import { supabase } from "@/lib/supabase";

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

export async function declineShare(shareId: string): Promise<void> {
  const { error } = await supabase
    .from("workout_shares")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", shareId);
  if (error) throw error;
}

/**
 * Materialises the snapshot into the recipient's own rows. Every insert here
 * runs as the recipient against their own `user_id`, which is why sharing
 * needed no change to the existing workout policies.
 */
export async function acceptShare(share: IncomingShare): Promise<void> {
  const userId = await currentUserId();

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
