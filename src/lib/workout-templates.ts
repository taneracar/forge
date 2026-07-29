import { supabase } from "@/lib/supabase";

export interface WorkoutTemplate {
  id: string;
  name: string;
  goal: string;
  description: string | null;
  exerciseCount: number;
}

interface TemplateRow {
  id: string;
  name: string;
  goal: string;
  description: string | null;
  workout_template_exercises: { count: number }[];
}

export interface WorkoutTemplateExercise {
  exerciseId: string;
  name: string;
  orderIndex: number;
}

interface TemplateExerciseRow {
  exercise_id: string;
  order_index: number;
  exercises: { name: string } | null;
}

export const templateGoalOptions = [
  { value: "bulk", labelKey: "panel:workout.templates.goals.bulk" },
  { value: "cut", labelKey: "panel:workout.templates.goals.cut" },
  { value: "strength", labelKey: "panel:workout.templates.goals.strength" },
  { value: "general", labelKey: "panel:workout.templates.goals.general" },
] as const;

export async function listTemplates(): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from("workout_templates")
    .select("id, name, goal, description, workout_template_exercises(count)")
    .order("goal")
    .order("name")
    .returns<TemplateRow[]>();
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    goal: row.goal,
    description: row.description,
    exerciseCount: row.workout_template_exercises[0]?.count ?? 0,
  }));
}

export async function getTemplate(
  id: string,
): Promise<{ template: Omit<WorkoutTemplate, "exerciseCount">; exercises: WorkoutTemplateExercise[] }> {
  const [{ data: template, error: templateError }, { data: exercises, error: exercisesError }] =
    await Promise.all([
      supabase
        .from("workout_templates")
        .select("id, name, goal, description")
        .eq("id", id)
        .single(),
      supabase
        .from("workout_template_exercises")
        .select("exercise_id, order_index, exercises(name)")
        .eq("template_id", id)
        .order("order_index")
        .returns<TemplateExerciseRow[]>(),
    ]);

  if (templateError) throw templateError;
  if (exercisesError) throw exercisesError;

  return {
    template,
    exercises: (exercises ?? []).map((row) => ({
      exerciseId: row.exercise_id,
      name: row.exercises?.name ?? "",
      orderIndex: row.order_index,
    })),
  };
}

/** Copies a template into the user's own `workouts`/`workout_exercises`, returning the new workout id. */
export async function applyTemplate(templateId: string, userId: string): Promise<string> {
  const { template, exercises } = await getTemplate(templateId);

  const { data: workout, error: insertError } = await supabase
    .from("workouts")
    .insert({ user_id: userId, name: template.name })
    .select("id")
    .single();
  if (insertError || !workout) throw insertError ?? new Error("Failed to create workout");

  if (exercises.length > 0) {
    const rows = exercises.map((ex) => ({
      workout_id: workout.id,
      exercise_id: ex.exerciseId,
      order_index: ex.orderIndex,
    }));
    const { error: exercisesError } = await supabase.from("workout_exercises").insert(rows);
    if (exercisesError) throw exercisesError;
  }

  return workout.id;
}
