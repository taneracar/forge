import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { WorkoutComposer } from "@/components/workout/workout-composer";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { useWorkoutHomeStore } from "@/store/workout-home.store";
import { MAX_OWN_WORKOUTS, countUserWorkouts } from "@/lib/workouts";
import { loadPlan, savePlan, type PlannedExercise } from "@/lib/workout-plan";

export default function WorkoutBuilderScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const isNew = workoutId === "new";
  const userId = useAuthStore((state) => state.session?.user.id);
  const invalidateWorkoutHome = useWorkoutHomeStore((state) => state.invalidate);

  const [name, setName] = useState("");
  const [items, setItems] = useState<PlannedExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    Promise.all([
      supabase.from("workouts").select("name").eq("id", workoutId).single(),
      loadPlan(workoutId).catch((): PlannedExercise[] => []),
    ]).then(([{ data: workout }, plan]) => {
      if (workout) setName(workout.name);
      setItems(plan);
      setLoading(false);
    });
  }, [isNew, workoutId]);

  async function handleSubmit(nextName: string, nextItems: PlannedExercise[]) {
    if (!userId) return;
    if (!nextName.trim()) {
      setError(t("common:validation.workoutNameRequired"));
      return;
    }

    if (isNew) {
      const existingCount = await countUserWorkouts(userId, "own");
      if (existingCount >= MAX_OWN_WORKOUTS) {
        setError(t("panel:workout.workouts.limitMessage", { max: MAX_OWN_WORKOUTS }));
        return;
      }
    }

    setSaving(true);
    setError(null);

    let id = isNew ? null : workoutId;

    if (isNew) {
      const { data, error: insertError } = await supabase
        .from("workouts")
        // A freshly created workout becomes the current program immediately —
        // matches "New Workout" always having been the implicit selection.
        .insert({
          user_id: userId,
          name: nextName.trim(),
          last_selected_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (insertError || !data) {
        setSaving(false);
        setError(insertError?.message ?? null);
        return;
      }
      id = data.id;
    } else {
      const { error: updateError } = await supabase
        .from("workouts")
        .update({ name: nextName.trim() })
        .eq("id", id);
      if (updateError) {
        setSaving(false);
        setError(updateError.message);
        return;
      }
    }

    if (id) {
      try {
        await savePlan(id, nextItems);
      } catch (planError) {
        setSaving(false);
        setError(planError instanceof Error ? planError.message : String(planError));
        return;
      }
    }

    setSaving(false);
    invalidateWorkoutHome();
    router.back();
  }

  return (
    <WorkoutComposer
      // Remounts once the saved workout has loaded, so the composer's initial
      // name/items are the real ones rather than empty defaults.
      key={loading ? "loading" : "ready"}
      title={isNew ? t("panel:workout.builder.newTitle") : t("panel:workout.builder.editTitle")}
      backHref="/(tabs)/antrenman"
      initialName={name}
      initialItems={items}
      loading={loading}
      submitLabel={t("common:buttons.save")}
      submitting={saving}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
