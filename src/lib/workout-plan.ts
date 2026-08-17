import { supabase } from "@/lib/supabase";

export interface PlannedSet {
  repsMin: number | null;
  repsMax: number | null;
  /** Reps in reserve. Null when the plan doesn't specify one. */
  rir: number | null;
}

export interface PlannedExercise {
  key: string;
  exerciseId: string;
  name: string;
  restSeconds: number;
  notes: string;
  sets: PlannedSet[];
}

export const DEFAULT_SET_COUNT = 3;
export const DEFAULT_REPS_MIN = 8;
export const DEFAULT_REPS_MAX = 12;
export const DEFAULT_REST_SECONDS = 120;
export const MAX_SETS = 12;

export function defaultPlannedSet(): PlannedSet {
  return { repsMin: DEFAULT_REPS_MIN, repsMax: DEFAULT_REPS_MAX, rir: null };
}

/** A newly added exercise arrives already prescribed, not as a bare name. */
export function defaultPlannedSets(): PlannedSet[] {
  return Array.from({ length: DEFAULT_SET_COUNT }, defaultPlannedSet);
}

/** "8–12", "10", or "—" for one set's prescribed reps. */
export function rangeLabel(set: { repsMin: number | null; repsMax: number | null }): string {
  if (set.repsMin == null && set.repsMax == null) return "—";
  if (set.repsMin == null) return String(set.repsMax);
  if (set.repsMax == null || set.repsMax === set.repsMin) return String(set.repsMin);
  return `${set.repsMin}–${set.repsMax}`;
}

/**
 * "3 × 8–12" when every set matches, "12 · 10 · 8" for a pyramid — the
 * collapsed form stays readable on a builder row, and a varying plan is
 * visibly different at a glance rather than silently averaged.
 */
export function describeSets(sets: PlannedSet[]): string {
  if (sets.length === 0) return "—";
  const labels = sets.map(rangeLabel);
  return labels.every((l) => l === labels[0])
    ? `${sets.length} × ${labels[0]}`
    : labels.join(" · ");
}

export interface PrescribedSet {
  setIndex: number;
  repsMin: number | null;
  repsMax: number | null;
  rir: number | null;
}

interface PlanRow {
  exercise_id: string;
  rest_seconds: number;
  notes: string | null;
  workout_exercise_sets: {
    set_index: number;
    reps_min: number | null;
    reps_max: number | null;
    rir: number | null;
  }[];
}

export interface ExercisePlan {
  restSeconds: number;
  notes: string | null;
  sets: PrescribedSet[];
}

/**
 * The prescription for a workout, keyed by exercise id — the shape the active
 * session needs, since it groups logged sets by exercise rather than by the
 * `workout_exercises` row.
 */
export async function getPlanByExercise(
  workoutId: string,
): Promise<Map<string, ExercisePlan>> {
  const { data, error } = await supabase
    .from("workout_exercises")
    .select(
      "exercise_id, rest_seconds, notes, workout_exercise_sets(set_index, reps_min, reps_max, rir)",
    )
    .eq("workout_id", workoutId)
    .order("order_index")
    .returns<PlanRow[]>();
  if (error) throw error;

  const plans = new Map<string, ExercisePlan>();
  for (const row of data ?? []) {
    plans.set(row.exercise_id, {
      restSeconds: row.rest_seconds,
      notes: row.notes,
      sets: [...row.workout_exercise_sets]
        .sort((a, b) => a.set_index - b.set_index)
        .map((s) => ({
          setIndex: s.set_index,
          repsMin: s.reps_min,
          repsMax: s.reps_max,
          rir: s.rir,
        })),
    });
  }
  return plans;
}

interface BuilderPlanRow {
  id: string;
  exercise_id: string;
  rest_seconds: number;
  notes: string | null;
  exercises: { name: string } | null;
  workout_exercise_sets: {
    set_index: number;
    reps_min: number | null;
    reps_max: number | null;
    rir: number | null;
  }[];
}

/** Loads an existing workout into the builder's editable shape. */
export async function loadPlan(workoutId: string): Promise<PlannedExercise[]> {
  const { data, error } = await supabase
    .from("workout_exercises")
    .select(
      "id, exercise_id, rest_seconds, notes, exercises(name), workout_exercise_sets(set_index, reps_min, reps_max, rir)",
    )
    .eq("workout_id", workoutId)
    .order("order_index")
    .returns<BuilderPlanRow[]>();
  if (error) throw error;

  return (data ?? []).map((row) => ({
    key: row.id,
    exerciseId: row.exercise_id,
    name: row.exercises?.name ?? "",
    restSeconds: row.rest_seconds,
    notes: row.notes ?? "",
    // Workouts saved before prescriptions existed have no set rows; give them
    // the default plan rather than showing an exercise with zero sets.
    sets:
      row.workout_exercise_sets.length > 0
        ? [...row.workout_exercise_sets]
            .sort((a, b) => a.set_index - b.set_index)
            .map((s) => ({ repsMin: s.reps_min, repsMax: s.reps_max, rir: s.rir }))
        : defaultPlannedSets(),
  }));
}

/**
 * Replaces the workout's exercises and their prescribed sets. The parent rows
 * are re-inserted wholesale (children cascade away with them), then matched
 * back to their sets by `order_index` — not by the order Postgres happens to
 * return, which isn't contractually guaranteed.
 */
export async function savePlan(
  workoutId: string,
  items: PlannedExercise[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("workout_id", workoutId);
  if (deleteError) throw deleteError;
  if (items.length === 0) return;

  const { data: inserted, error: insertError } = await supabase
    .from("workout_exercises")
    .insert(
      items.map((item, index) => ({
        workout_id: workoutId,
        exercise_id: item.exerciseId,
        order_index: index,
        rest_seconds: item.restSeconds,
        notes: item.notes.trim() || null,
      })),
    )
    .select("id, order_index")
    .returns<{ id: string; order_index: number }[]>();
  if (insertError) throw insertError;

  const idByOrder = new Map((inserted ?? []).map((r) => [r.order_index, r.id]));
  const setRows = items.flatMap((item, index) => {
    const parentId = idByOrder.get(index);
    if (!parentId) return [];
    return item.sets.map((set, setIndex) => ({
      workout_exercise_id: parentId,
      set_index: setIndex,
      reps_min: set.repsMin,
      reps_max: set.repsMax,
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
