import { supabase } from "@/lib/supabase";
import { calculateVolume } from "@/lib/workout-calculations";

export const MAX_SAVED_WORKOUTS = 5;

export interface SavedWorkout {
  id: string;
  name: string;
  createdAt: string;
  exerciseCount: number;
}

interface WorkoutRow {
  id: string;
  name: string;
  created_at: string;
  workout_exercises: { count: number }[];
}

/**
 * Ordered so the "current program" (the one shown on the workout home
 * screen) is always index 0: most recently selected first, falling back to
 * most recently created for workouts that have never been explicitly used.
 */
export async function listUserWorkouts(userId: string): Promise<SavedWorkout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, name, created_at, workout_exercises(count)")
    .eq("user_id", userId)
    .order("last_selected_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<WorkoutRow[]>();
  if (error) throw error;
  return (data ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    createdAt: w.created_at,
    exerciseCount: w.workout_exercises[0]?.count ?? 0,
  }));
}

/** Marks a workout as the user's current program (see `listUserWorkouts`). */
export async function selectWorkout(id: string): Promise<void> {
  const { error } = await supabase
    .from("workouts")
    .update({ last_selected_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function countUserWorkouts(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("workouts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) throw error;
}

export interface WeeklyWorkoutStats {
  sessionsCount: number;
  totalVolume: number;
}

/** Completed sessions in the last 7 days, for the Dashboard's weekly summary. */
export async function getWeeklyWorkoutStats(userId: string): Promise<WeeklyWorkoutStats> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("workout_sets(weight, reps, completed)")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", weekAgo.toISOString());
  if (error) throw error;

  const sessions = data ?? [];
  const totalVolume = sessions.reduce(
    (sum, session) => sum + calculateVolume(session.workout_sets ?? []),
    0,
  );
  return { sessionsCount: sessions.length, totalVolume };
}
