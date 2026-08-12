import { supabase } from "@/lib/supabase";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealLog {
  id: string;
  mealType: MealType;
  name: string;
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  loggedAt: string;
}

export interface NewMealLog {
  mealType: MealType;
  name: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

export interface DailyTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Local midnight, `daysAgo` days back (0 = today). */
function startOfDay(daysAgo: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

/** Local midnight of `date` itself, and of the next day — a half-open range. */
function dayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/** Monday of the calendar week containing `date`, at local midnight. */
export function mondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function toMealLog(row: {
  id: string;
  meal_type: MealType;
  name: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  logged_at: string;
}): MealLog {
  return {
    id: row.id,
    mealType: row.meal_type,
    name: row.name,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    loggedAt: row.logged_at,
  };
}

export async function listTodayLogs(userId: string): Promise<MealLog[]> {
  const { data, error } = await supabase
    .from("meal_logs")
    .select("id, meal_type, name, calories, protein_g, carbs_g, fat_g, logged_at")
    .eq("user_id", userId)
    .gte("logged_at", startOfDay(0).toISOString())
    .order("logged_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toMealLog);
}

/** Meals logged on one specific calendar day, for the date-strip navigation. */
export async function listLogsForDate(userId: string, date: Date): Promise<MealLog[]> {
  const { start, end } = dayBounds(date);
  const { data, error } = await supabase
    .from("meal_logs")
    .select("id, meal_type, name, calories, protein_g, carbs_g, fat_g, logged_at")
    .eq("user_id", userId)
    .gte("logged_at", start.toISOString())
    .lt("logged_at", end.toISOString())
    .order("logged_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toMealLog);
}

/**
 * Calorie total per day across the Mon–Sun week containing `date`, keyed by
 * `Date.toDateString()` — drives the day strip's "has entries" dots without
 * a query per day.
 */
export async function listCalendarWeekTotals(
  userId: string,
  date: Date,
): Promise<Map<string, number>> {
  const start = mondayOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const { data, error } = await supabase
    .from("meal_logs")
    .select("calories, logged_at")
    .eq("user_id", userId)
    .gte("logged_at", start.toISOString())
    .lt("logged_at", end.toISOString());
  if (error) throw error;

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const key = new Date(row.logged_at).toDateString();
    totals.set(key, (totals.get(key) ?? 0) + row.calories);
  }
  return totals;
}

export function totalsFor(logs: MealLog[]): DailyTotals {
  return logs.reduce(
    (totals, log) => ({
      calories: totals.calories + log.calories,
      proteinG: totals.proteinG + (log.proteinG ?? 0),
      carbsG: totals.carbsG + (log.carbsG ?? 0),
      fatG: totals.fatG + (log.fatG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

/** Always logs against now — the UI only offers "add" on today. */
export async function addMealLog(userId: string, meal: NewMealLog): Promise<MealLog> {
  const { data, error } = await supabase
    .from("meal_logs")
    .insert({
      user_id: userId,
      meal_type: meal.mealType,
      name: meal.name,
      calories: meal.calories,
      protein_g: meal.proteinG ?? null,
      carbs_g: meal.carbsG ?? null,
      fat_g: meal.fatG ?? null,
    })
    .select("id, meal_type, name, calories, protein_g, carbs_g, fat_g, logged_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to log meal");
  return toMealLog(data);
}

export async function deleteMealLog(id: string): Promise<void> {
  const { error } = await supabase.from("meal_logs").delete().eq("id", id);
  if (error) throw error;
}
