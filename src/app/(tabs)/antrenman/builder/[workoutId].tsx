import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react-native";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import type { Exercise } from "@/lib/exercises";

interface BuilderExerciseItem {
  key: string;
  exerciseId: string;
  name: string;
}

interface WorkoutExerciseRow {
  order_index: number;
  exercise_id: string;
  exercises: { name: string } | null;
}

export default function WorkoutBuilderScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const isNew = workoutId === "new";
  const userId = useAuthStore((state) => state.session?.user.id);

  const [name, setName] = useState("");
  const [items, setItems] = useState<BuilderExerciseItem[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    Promise.all([
      supabase.from("workouts").select("name").eq("id", workoutId).single(),
      supabase
        .from("workout_exercises")
        .select("order_index, exercise_id, exercises(name)")
        .eq("workout_id", workoutId)
        .order("order_index")
        .returns<WorkoutExerciseRow[]>(),
    ]).then(([{ data: workout }, { data: exercises }]) => {
      if (workout) setName(workout.name);
      setItems(
        (exercises ?? []).map((row, i) => ({
          key: `${row.exercise_id}-${i}`,
          exerciseId: row.exercise_id,
          name: row.exercises?.name ?? "",
        })),
      );
      setLoading(false);
    });
  }, [isNew, workoutId]);

  function handleSelectExercise(exercise: Exercise) {
    setItems((prev) => [
      ...prev,
      { key: `${exercise.id}-${Date.now()}`, exerciseId: exercise.id, name: exercise.name },
    ]);
  }

  function handleRemove(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  function handleMove(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (!userId) return;
    if (!name.trim()) {
      setError(t("common:validation.workoutNameRequired"));
      return;
    }
    setSaving(true);
    setError(null);

    let id = isNew ? null : workoutId;

    if (isNew) {
      const { data, error: insertError } = await supabase
        .from("workouts")
        .insert({ user_id: userId, name: name.trim() })
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
        .update({ name: name.trim() })
        .eq("id", id);
      if (updateError) {
        setSaving(false);
        setError(updateError.message);
        return;
      }
      await supabase.from("workout_exercises").delete().eq("workout_id", id);
    }

    if (items.length > 0 && id) {
      const rows = items.map((item, index) => ({
        workout_id: id,
        exercise_id: item.exerciseId,
        order_index: index,
      }));
      const { error: exercisesError } = await supabase.from("workout_exercises").insert(rows);
      if (exercisesError) {
        setSaving(false);
        setError(exercisesError.message);
        return;
      }
    }

    setSaving(false);
    router.back();
  }

  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: insets.top + 16 }}>
      <View className="flex-row items-center gap-2">
        <BackButton fallbackHref="/(tabs)/antrenman" />
        <Text className="flex-1 font-display text-2xl uppercase text-foreground">
          {isNew ? t("panel:workout.builder.newTitle") : t("panel:workout.builder.editTitle")}
        </Text>
      </View>

      <ScrollView className="mt-6 flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <Input
          label={t("panel:workout.builder.nameLabel")}
          placeholder={t("panel:workout.builder.namePlaceholder")}
          value={name}
          onChangeText={setName}
        />

        <View className="mt-6 flex-row items-center justify-between">
          <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {t("panel:workout.builder.exercisesLabel")}
          </Text>
          <Pressable
            onPress={() => setPickerVisible(true)}
            disabled={loading}
            className="flex-row items-center gap-1.5"
          >
            <Plus color={loading ? Colors.border : Colors.primary} size={14} />
            <Text
              className="font-mono text-xs uppercase tracking-wider"
              style={{ color: loading ? Colors.border : Colors.primary }}
            >
              {t("panel:workout.builder.addExerciseButton")}
            </Text>
          </Pressable>
        </View>

        {loading ? null : items.length === 0 ? (
          <Text className="mt-4 font-body text-sm text-muted-foreground">
            {t("panel:workout.builder.emptyState")}
          </Text>
        ) : (
          <View className="mt-3 gap-2">
            {items.map((item, index) => (
              <View
                key={item.key}
                className="flex-row items-center justify-between rounded-md border border-border bg-surface p-3"
              >
                <Text className="flex-1 font-body-semibold text-sm text-foreground">
                  {index + 1}. {item.name}
                </Text>
                <View className="flex-row items-center gap-3">
                  <Pressable
                    onPress={() => handleMove(index, -1)}
                    disabled={index === 0}
                    hitSlop={8}
                  >
                    <ArrowUp
                      color={index === 0 ? Colors.border : Colors.mutedForeground}
                      size={16}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => handleMove(index, 1)}
                    disabled={index === items.length - 1}
                    hitSlop={8}
                  >
                    <ArrowDown
                      color={index === items.length - 1 ? Colors.border : Colors.mutedForeground}
                      size={16}
                    />
                  </Pressable>
                  <Pressable onPress={() => handleRemove(item.key)} hitSlop={8}>
                    <Trash2 color={Colors.mutedForeground} size={16} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {error && <Text className="mt-4 text-xs text-primary">{error}</Text>}
      </ScrollView>

      <View className="pb-4">
        <Button variant="primary" onPress={handleSave} disabled={saving}>
          {t("common:buttons.save")}
        </Button>
      </View>

      <ExercisePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelectExercise}
      />
    </View>
  );
}
