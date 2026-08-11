import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Dumbbell, GripVertical, Plus, Trash2 } from "lucide-react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { haptics } from "@/lib/haptics";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { useWorkoutHomeStore } from "@/store/workout-home.store";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import type { Exercise } from "@/lib/exercises";
import { MAX_SAVED_WORKOUTS, countUserWorkouts } from "@/lib/workouts";

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

function ExerciseRow({
  item,
  index,
  drag,
  isActive,
  onRemove,
}: RenderItemParams<BuilderExerciseItem> & { index: number; onRemove: (key: string) => void }) {
  return (
    <View className="mb-2">
      <Swipeable
        friction={2}
        rightThreshold={44}
        renderRightActions={() => (
          <Pressable
            onPress={() => {
              haptics.select();
              onRemove(item.key);
            }}
            className="ml-2 w-16 items-center justify-center rounded-tile bg-danger"
          >
            <Trash2 color={Colors.dangerForeground} size={18} />
          </Pressable>
        )}
      >
        {/* Long-press anywhere on the row to pick it up — matches the
            reorder gesture users already know from iOS home-screen icons,
            no separate handle to discover. The grip icon is a passive hint. */}
        <Pressable onLongPress={drag} delayLongPress={150} disabled={isActive}>
          <Card
            className={cn(
              "flex-row items-center gap-3 py-3",
              isActive && "border-primary",
            )}
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Text className="font-mono text-xs text-primary">{index + 1}</Text>
            </View>
            <Text className="flex-1 font-body-semibold text-sm text-foreground">
              {item.name}
            </Text>
            <GripVertical color={Colors.muted} size={18} />
          </Card>
        </Pressable>
      </Swipeable>
    </View>
  );
}

export default function WorkoutBuilderScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const isNew = workoutId === "new";
  const userId = useAuthStore((state) => state.session?.user.id);
  const invalidateWorkoutHome = useWorkoutHomeStore((state) => state.invalidate);

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

  async function handleSave() {
    if (!userId) return;
    if (!name.trim()) {
      setError(t("common:validation.workoutNameRequired"));
      return;
    }

    if (isNew) {
      const existingCount = await countUserWorkouts(userId);
      if (existingCount >= MAX_SAVED_WORKOUTS) {
        setError(t("panel:workout.workouts.limitMessage", { max: MAX_SAVED_WORKOUTS }));
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
          name: name.trim(),
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
    invalidateWorkoutHome();
    router.back();
  }

  return (
    <View className="flex-1 bg-background px-5" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center gap-2">
        <BackButton fallbackHref="/(tabs)/antrenman" />
        <Text className="flex-1 font-display text-2xl uppercase text-foreground">
          {isNew ? t("panel:workout.builder.newTitle") : t("panel:workout.builder.editTitle")}
        </Text>
      </View>

      {/* NestableScrollContainer/NestableDraggableFlatList are gesture-handler
          components, not core RN primitives — NativeWind's className interop
          isn't guaranteed to reach them (same caveat as LinearGradient in
          Card), so layout here goes through style/contentContainerStyle. */}
      <NestableScrollContainer
        style={{ marginTop: 20, flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label={t("panel:workout.builder.nameLabel")}
          placeholder={t("panel:workout.builder.namePlaceholder")}
          value={name}
          onChangeText={setName}
        />

        <SectionHeader
          className="mt-7"
          title={t("panel:workout.builder.exercisesLabel")}
        />

        {loading ? (
          <View className="mt-3 gap-2">
            <Skeleton height={58} />
            <Skeleton height={58} />
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            className="mt-3"
            icon={<Dumbbell color={Colors.mutedForeground} size={24} />}
            title={t("panel:workout.builder.emptyState")}
            description={t("panel:workout.builder.emptyStateDescription")}
          />
        ) : (
          <NestableDraggableFlatList
            data={items}
            keyExtractor={(item) => item.key}
            containerStyle={{ marginTop: 12 }}
            onDragEnd={({ data }) => setItems(data)}
            renderItem={(params) => (
              <ExerciseRow {...params} index={params.getIndex() ?? 0} onRemove={handleRemove} />
            )}
          />
        )}

        <Pressable
          onPress={() => {
            haptics.select();
            setPickerVisible(true);
          }}
          disabled={loading}
          className={cn(
            "mt-3 flex-row items-center justify-center gap-2 rounded-tile border border-dashed border-border-strong py-3.5 active:bg-surface-raised",
            loading && "opacity-40",
          )}
        >
          <Plus color={Colors.primary} size={16} />
          <Text className="font-body-medium text-sm text-primary">
            {t("panel:workout.builder.addExerciseButton")}
          </Text>
        </Pressable>

        {error && <Text className="mt-4 font-body text-xs text-danger">{error}</Text>}
      </NestableScrollContainer>

      <View className="pb-3 pt-1">
        <Button variant="primary" size="lg" loading={saving} onPress={handleSave}>
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
