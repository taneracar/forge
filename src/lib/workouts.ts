import { supabase } from "@/lib/supabase";

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

export async function listUserWorkouts(userId: string): Promise<SavedWorkout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, name, created_at, workout_exercises(count)")
    .eq("user_id", userId)
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
