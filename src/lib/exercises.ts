import { supabase } from "@/lib/supabase";

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

export async function listExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase.from("exercises").select("*").order("name");
  if (error) throw error;
  return data ?? [];
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
