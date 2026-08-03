import { supabase } from "@/lib/supabase";
import type { BarDatum } from "@/components/ui/bar-chart";

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

/** Last 7 days (oldest first), one summed calorie total per day for the shared BarChart. */
export async function listWeekTotals(userId: string): Promise<BarDatum[]> {
  const { data, error } = await supabase
    .from("meal_logs")
    .select("calories, logged_at")
    .eq("user_id", userId)
    .gte("logged_at", startOfDay(6).toISOString());
  if (error) throw error;

  const totalsByDate = new Map<string, number>();
  for (const row of data ?? []) {
    const key = new Date(row.logged_at).toDateString();
    totalsByDate.set(key, (totalsByDate.get(key) ?? 0) + row.calories);
  }

  const result: BarDatum[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(i);
    result.push({
      label: day.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" }),
      value: totalsByDate.get(day.toDateString()) ?? 0,
    });
  }
  return result;
}

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
