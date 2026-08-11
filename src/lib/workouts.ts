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

export interface ActivityDay {
  date: Date;
  active: boolean;
}

export interface ActivityHeatmap {
  /** Columns of weeks (oldest first), each 7 entries Monday–Sunday. */
  weeks: ActivityDay[][];
  weekStreak: number;
  bestWeekStreak: number;
  totalSessions: number;
}

const HEATMAP_WEEKS = 22;

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * All-time workout activity for the Dashboard's GitHub-style heatmap: which
 * days had a completed session (last `HEATMAP_WEEKS` weeks, for the grid)
 * plus streak/total stats computed from the *full* session history, not
 * just the visible grid window — matches the "ALL-TIME" label next to it.
 */
export async function getActivityHeatmap(userId: string): Promise<ActivityHeatmap> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("completed_at")
    .eq("user_id", userId)
    .not("completed_at", "is", null);
  if (error) throw error;

  const sessions = data ?? [];
  const dayKeys = new Set(sessions.map((s) => new Date(s.completed_at as string).toDateString()));
  const weekKeys = new Set(
    sessions.map((s) => mondayOf(new Date(s.completed_at as string)).toISOString().slice(0, 10)),
  );

  const today = new Date();
  const currentMonday = mondayOf(today);

  const weeks: ActivityDay[][] = [];
  for (let w = HEATMAP_WEEKS - 1; w >= 0; w--) {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(weekStart.getDate() - w * 7);
    const days: ActivityDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + d);
      days.push({ date, active: date <= today && dayKeys.has(date.toDateString()) });
    }
    weeks.push(days);
  }

  let weekStreak = 0;
  const cursor = mondayOf(today);
  if (!weekKeys.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 7);
  }
  while (weekKeys.has(cursor.toISOString().slice(0, 10))) {
    weekStreak++;
    cursor.setDate(cursor.getDate() - 7);
  }

  const sortedWeeks = [...weekKeys].sort();
  let bestWeekStreak = 0;
  let run = 0;
  let prevTime: number | null = null;
  for (const wk of sortedWeeks) {
    const t = new Date(wk).getTime();
    run = prevTime !== null && t - prevTime === 7 * 24 * 60 * 60 * 1000 ? run + 1 : 1;
    bestWeekStreak = Math.max(bestWeekStreak, run);
    prevTime = t;
  }

  return { weeks, weekStreak, bestWeekStreak, totalSessions: sessions.length };
}
