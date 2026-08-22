import { supabase } from "@/lib/supabase";
import { getExerciseNames } from "@/lib/exercises";
import type { PlannedExercise, PlannedSet } from "@/lib/workout-plan";

/**
 * The frozen copy of a workout that travels with a share. Deliberately a
 * snapshot rather than a reference to the sender's `workouts` row: they churn
 * their own programs against the 5-workout cap, and a live reference would
 * rewrite or break the recipient's copy underneath them.
 */
export interface SharePayloadSet {
  set_index: number;
  reps_min: number | null;
  reps_max: number | null;
  rir: number | null;
}

export interface SharePayloadExercise {
  exercise_id: string;
  order_index: number;
  rest_seconds: number;
  notes: string | null;
  sets: SharePayloadSet[];
}

export interface SharePayload {
  name: string;
  exercises: SharePayloadExercise[];
}

export interface IncomingShare {
  id: string;
  fromUser: string;
  fromUsername: string;
  fromName: string;
  payload: SharePayload;
  createdAt: string;
}

interface SnapshotRow {
  exercise_id: string;
  order_index: number;
  rest_seconds: number;
  notes: string | null;
  workout_exercise_sets: SharePayloadSet[];
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("Not signed in");
  return data.user.id;
}

export async function buildSharePayload(workoutId: string): Promise<SharePayload> {
  const [{ data: workout, error: workoutError }, { data: rows, error: rowsError }] =
    await Promise.all([
      supabase.from("workouts").select("name").eq("id", workoutId).single(),
      supabase
        .from("workout_exercises")
        .select(
          "exercise_id, order_index, rest_seconds, notes, workout_exercise_sets(set_index, reps_min, reps_max, rir)",
        )
        .eq("workout_id", workoutId)
        .order("order_index")
        .returns<SnapshotRow[]>(),
    ]);
  if (workoutError) throw workoutError;
  if (rowsError) throw rowsError;

  return {
    name: workout?.name ?? "",
    exercises: (rows ?? []).map((row) => ({
      exercise_id: row.exercise_id,
      order_index: row.order_index,
      rest_seconds: row.rest_seconds,
      notes: row.notes,
      sets: [...row.workout_exercise_sets].sort((a, b) => a.set_index - b.set_index),
    })),
  };
}

/**
 * Whether you may send to this person right now: one boolean, computed
 * server-side from mutual follow, blocks, and their free slots. The rules are
 * enforced again by the insert policy, so a stale `true` still can't get
 * through.
 */
export async function canReceiveWorkout(targetUserId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("can_receive_workout", {
    target: targetUserId,
  });
  if (error) throw error;
  return data === true;
}

export async function sendWorkout(
  toUserId: string,
  workoutId: string,
): Promise<void> {
  const payload = await buildSharePayload(workoutId);
  const { error } = await supabase.from("workout_shares").insert({
    from_user: await currentUserId(),
    to_user: toUserId,
    source_workout_id: workoutId,
    payload,
  });
  if (error) throw error;
}

/**
 * Sends a program written for the recipient rather than copied from your own
 * five. Nothing is saved to the sender's workouts — it exists only as the
 * share's snapshot, so writing programs for other people never eats your own
 * cap. `source_workout_id` stays null; see the Milestone 15 policy note.
 */
export async function sendComposedWorkout(
  toUserId: string,
  name: string,
  exercises: PlannedExercise[],
): Promise<void> {
  const payload: SharePayload = {
    name: name.trim(),
    exercises: exercises.map((exercise, index) => ({
      exercise_id: exercise.exerciseId,
      order_index: index,
      rest_seconds: exercise.restSeconds,
      notes: exercise.notes.trim() || null,
      sets: exercise.sets.map((set, setIndex) => ({
        set_index: setIndex,
        reps_min: set.repsMin,
        reps_max: set.repsMax,
        rir: set.rir,
      })),
    })),
  };

  const { error } = await supabase.from("workout_shares").insert({
    from_user: await currentUserId(),
    to_user: toUserId,
    payload,
  });
  if (error) throw error;
}

export async function listIncomingShares(): Promise<IncomingShare[]> {
  const { data, error } = await supabase.rpc("list_incoming_shares");
  if (error) throw error;
  return ((data ?? []) as {
    id: string;
    from_user: string;
    from_username: string;
    from_name: string;
    payload: SharePayload;
    created_at: string;
  }[]).map((row) => ({
    id: row.id,
    fromUser: row.from_user,
    fromUsername: row.from_username,
    fromName: row.from_name,
    payload: row.payload,
    createdAt: row.created_at,
  }));
}

/** A share's exercise, resolved for display: the payload's ids swapped for names. */
export interface SharePreviewExercise {
  exerciseId: string;
  name: string;
  restSeconds: number;
  notes: string | null;
  sets: PlannedSet[];
}

/**
 * The snapshot rendered as something readable, so you can judge a workout
 * before accepting it. An exercise the catalogue no longer has still gets a
 * row — dropping it silently would understate what you're about to accept.
 */
export async function loadSharePreview(
  payload: SharePayload,
  unknownLabel: string,
): Promise<SharePreviewExercise[]> {
  const names = await getExerciseNames(payload.exercises.map((e) => e.exercise_id));

  return [...payload.exercises]
    .sort((a, b) => a.order_index - b.order_index)
    .map((exercise) => ({
      exerciseId: exercise.exercise_id,
      name: names.get(exercise.exercise_id) ?? unknownLabel,
      restSeconds: exercise.rest_seconds,
      notes: exercise.notes,
      sets: [...exercise.sets]
        .sort((a, b) => a.set_index - b.set_index)
        .map((set) => ({ repsMin: set.reps_min, repsMax: set.reps_max, rir: set.rir })),
    }));
}

export async function declineShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from("workout_shares")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", shareId)
    .eq("status", "pending");
  if (error) throw error;
}

/**
 * Materialises the snapshot into the recipient's own rows. Every insert here
 * runs as the recipient against their own `user_id`, which is why sharing
 * needed no change to the existing workout policies.
 */
export async function acceptShare(share: IncomingShare): Promise<void> {
  const userId = await currentUserId();

  // Claim the share before writing anything. PostgREST has no transaction to
  // wrap the insert and the status flip together, so the status flip goes
  // first and is guarded on `pending` — a second accept (double tap, two
  // devices, a retry after a slow response) matches no row and stops here
  // instead of copying the program twice.
  const { data: claimed, error: claimError } = await supabase
    .from("workout_shares")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", share.id)
    .eq("status", "pending")
    .select("id");
  if (claimError) throw claimError;
  if (!claimed || claimed.length === 0) return;

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      name: share.payload.name,
      source: "shared",
      shared_from: share.fromUser,
    })
    .select("id")
    .single();
  if (workoutError || !workout) throw workoutError ?? new Error("Failed to save workout");

  if (share.payload.exercises.length > 0) {
    const { data: inserted, error: exercisesError } = await supabase
      .from("workout_exercises")
      .insert(
        share.payload.exercises.map((exercise) => ({
          workout_id: workout.id,
          exercise_id: exercise.exercise_id,
          order_index: exercise.order_index,
          rest_seconds: exercise.rest_seconds,
          notes: exercise.notes,
        })),
      )
      .select("id, order_index")
      .returns<{ id: string; order_index: number }[]>();
    if (exercisesError) throw exercisesError;

    // Matched by order_index rather than the order Postgres returns, same as
    // savePlan — the returned order isn't contractually guaranteed.
    const idByOrder = new Map((inserted ?? []).map((r) => [r.order_index, r.id]));
    const setRows = share.payload.exercises.flatMap((exercise) => {
      const parentId = idByOrder.get(exercise.order_index);
      if (!parentId) return [];
      return exercise.sets.map((set) => ({
        workout_exercise_id: parentId,
        set_index: set.set_index,
        reps_min: set.reps_min,
        reps_max: set.reps_max,
        rir: set.rir,
      }));
    });

    if (setRows.length > 0) {
      const { error: setsError } = await supabase
        .from("workout_exercise_sets")
        .insert(setRows);
      if (setsError) throw setsError;
    }
  }

  const { error: statusError } = await supabase
    .from("workout_shares")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", share.id);
  if (statusError) throw statusError;
}
