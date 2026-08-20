import { supabase } from "@/lib/supabase";
import { bestPerformance, type SetPerformance } from "@/lib/workout-calculations";

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  instructions_en: string | null;
  instructions_tr: string | null;
  instruction_steps_en: string[] | null;
  instruction_steps_tr: string[] | null;
  secondary_muscles: string[] | null;
  target_muscle: string | null;
  body_part: string | null;
  image_path: string | null;
  gif_path: string | null;
  created_at: string;
}

/** PostgREST caps an unbounded select at 1000 rows regardless of what you ask for. */
const PAGE_SIZE = 1000;

/**
 * The whole catalogue, fetched in pages. The picker filters client-side, so a
 * truncated fetch doesn't just shorten the list — it makes the missing
 * exercises unsearchable too. The catalogue is already past 1000 rows, so the
 * single unbounded select this replaces was silently hiding the tail of the
 * alphabet.
 */
export async function listExercises(): Promise<Exercise[]> {
  const all: Exercise[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .order("name")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    const page = data ?? [];
    all.push(...page);
    if (page.length < PAGE_SIZE) return all;
  }
}

export interface ExerciseSessionLog {
  sessionId: string;
  completedAt: string;
  sets: SetPerformance[];
}

export interface ExerciseHistory {
  personalRecord: (SetPerformance & { achievedAt: string }) | null;
  recentSessions: ExerciseSessionLog[];
}

interface ExerciseSetRow {
  weight: number | null;
  reps: number | null;
  workout_sessions: { id: string; completed_at: string } | null;
}

/**
 * All-time PR (heaviest set, reps break ties — same rule as session/history
 * screens) plus the last few sessions this exercise appeared in, for the
 * "how have I done this before" panel in the exercise detail view.
 */
export async function getExerciseHistory(
  userId: string,
  exerciseId: string,
  sessionLimit = 4,
): Promise<ExerciseHistory> {
  const { data, error } = await supabase
    .from("workout_sets")
    .select("weight, reps, workout_sessions!inner(id, completed_at, user_id)")
    .eq("exercise_id", exerciseId)
    .eq("completed", true)
    .eq("workout_sessions.user_id", userId)
    .not("workout_sessions.completed_at", "is", null)
    .returns<ExerciseSetRow[]>();
  if (error) throw error;

  const rows = (data ?? []).filter((row) => row.workout_sessions !== null);

  const bySession = new Map<string, ExerciseSessionLog>();
  for (const row of rows) {
    const session = row.workout_sessions!;
    if (!bySession.has(session.id)) {
      bySession.set(session.id, {
        sessionId: session.id,
        completedAt: session.completed_at,
        sets: [],
      });
    }
    bySession.get(session.id)!.sets.push({ weight: row.weight, reps: row.reps });
  }

  const recentSessions = Array.from(bySession.values())
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, sessionLimit);

  const best = bestPerformance(rows);
  const personalRecord = best
    ? { weight: best.weight, reps: best.reps, achievedAt: best.workout_sessions!.completed_at }
    : null;

  return { personalRecord, recentSessions };
}

/** English is the base/fallback language app-wide; Turkish only for `tr` locale. */
export function exerciseInstructions(
  exercise: Exercise,
  language: string,
): { text: string | null; steps: string[] | null } {
  const preferTr = language.startsWith("tr");
  const text = preferTr
    ? (exercise.instructions_tr ?? exercise.instructions_en)
    : (exercise.instructions_en ?? exercise.instructions_tr);
  const steps = preferTr
    ? (exercise.instruction_steps_tr ?? exercise.instruction_steps_en)
    : (exercise.instruction_steps_en ?? exercise.instruction_steps_tr);
  return { text: text ?? null, steps: steps ?? null };
}
