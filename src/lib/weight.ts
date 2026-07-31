import { supabase } from "@/lib/supabase";
import type { LineDatum } from "@/components/ui/line-chart";

export interface WeightLog {
  id: string;
  weightKg: number;
  loggedAt: string;
}

export interface WeightSummary {
  /** 7-day trailing average — the headline number, not the latest raw entry. */
  currentAverage: number | null;
  /** Average for the 7 days before that, for the trend indicator. */
  previousAverage: number | null;
  trendKg: number | null;
}

/** Local midnight, `daysAgo` days back (0 = today). */
function startOfDay(daysAgo: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export async function listRecentLogs(userId: string, limit = 10): Promise<WeightLog[]> {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("id, weight_kg, logged_at")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    weightKg: row.weight_kg,
    loggedAt: row.logged_at,
  }));
}

/** 7-day moving average vs. the prior 7 days, for the headline number + trend arrow. */
export async function getWeightSummary(userId: string): Promise<WeightSummary> {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("weight_kg, logged_at")
    .eq("user_id", userId)
    .gte("logged_at", startOfDay(13).toISOString())
    .order("logged_at", { ascending: true });
  if (error) throw error;

  const logs = (data ?? []) as { weight_kg: number; logged_at: string }[];
  const currentWindowStart = startOfDay(6).getTime();
  const previousWindowStart = startOfDay(13).getTime();

  const current: number[] = [];
  const previous: number[] = [];
  for (const log of logs) {
    const t = new Date(log.logged_at).getTime();
    if (t >= currentWindowStart) current.push(log.weight_kg);
    else if (t >= previousWindowStart) previous.push(log.weight_kg);
  }

  const currentAverage = average(current);
  const previousAverage = average(previous);
  return {
    currentAverage: currentAverage !== null ? round1(currentAverage) : null,
    previousAverage: previousAverage !== null ? round1(previousAverage) : null,
    trendKg:
      currentAverage !== null && previousAverage !== null
        ? round1(currentAverage - previousAverage)
        : null,
  };
}

/** Last 7 weekly buckets (oldest first), each the average of that week's logs. */
export async function listWeeklyAverages(userId: string): Promise<LineDatum[]> {
  const weeks = 7;
  const { data, error } = await supabase
    .from("weight_logs")
    .select("weight_kg, logged_at")
    .eq("user_id", userId)
    .gte("logged_at", startOfDay(weeks * 7 - 1).toISOString())
    .order("logged_at", { ascending: true });
  if (error) throw error;

  const logs = (data ?? []) as { weight_kg: number; logged_at: string }[];

  const result: LineDatum[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const windowStart = startOfDay(w * 7 + 6).getTime();
    const windowEnd = startOfDay(w * 7).getTime() + 24 * 60 * 60 * 1000;
    const inWindow = logs
      .filter((log) => {
        const t = new Date(log.logged_at).getTime();
        return t >= windowStart && t < windowEnd;
      })
      .map((log) => log.weight_kg);

    const avg = average(inWindow);
    result.push({
      label: new Date(windowStart).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "2-digit",
      }),
      value: avg !== null ? round1(avg) : 0,
    });
  }
  return result;
}

export async function addWeightLog(userId: string, weightKg: number): Promise<WeightLog> {
  const { data, error } = await supabase
    .from("weight_logs")
    .insert({ user_id: userId, weight_kg: weightKg })
    .select("id, weight_kg, logged_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to log weight");
  return { id: data.id, weightKg: data.weight_kg, loggedAt: data.logged_at };
}

export async function deleteWeightLog(id: string): Promise<void> {
  const { error } = await supabase.from("weight_logs").delete().eq("id", id);
  if (error) throw error;
}
