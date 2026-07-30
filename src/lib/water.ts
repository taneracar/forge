import { supabase } from "@/lib/supabase";
import type { BarDatum } from "@/components/ui/bar-chart";

export const DAILY_WATER_GOAL_ML = 2500;

export interface WaterLog {
  id: string;
  amountMl: number;
  loggedAt: string;
}

/** Local midnight, `daysAgo` days back (0 = today). */
function startOfDay(daysAgo: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

export async function listTodayLogs(userId: string): Promise<WaterLog[]> {
  const { data, error } = await supabase
    .from("water_logs")
    .select("id, amount_ml, logged_at")
    .eq("user_id", userId)
    .gte("logged_at", startOfDay(0).toISOString())
    .order("logged_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    amountMl: row.amount_ml,
    loggedAt: row.logged_at,
  }));
}

/** Last 7 days (oldest first), one summed total (ml) per day for the shared BarChart. */
export async function listWeekTotals(userId: string): Promise<BarDatum[]> {
  const { data, error } = await supabase
    .from("water_logs")
    .select("amount_ml, logged_at")
    .eq("user_id", userId)
    .gte("logged_at", startOfDay(6).toISOString());
  if (error) throw error;

  const totalsByDate = new Map<string, number>();
  for (const row of data ?? []) {
    const key = new Date(row.logged_at).toDateString();
    totalsByDate.set(key, (totalsByDate.get(key) ?? 0) + row.amount_ml);
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

export async function addWaterLog(userId: string, amountMl: number): Promise<WaterLog> {
  const { data, error } = await supabase
    .from("water_logs")
    .insert({ user_id: userId, amount_ml: amountMl })
    .select("id, amount_ml, logged_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to log water");
  return { id: data.id, amountMl: data.amount_ml, loggedAt: data.logged_at };
}

export async function deleteWaterLog(id: string): Promise<void> {
  const { error } = await supabase.from("water_logs").delete().eq("id", id);
  if (error) throw error;
}
