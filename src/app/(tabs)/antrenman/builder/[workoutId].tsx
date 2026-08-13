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
import { ExerciseImagePlaceholder } from "@/components/ui/exercise-image-placeholder";
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
import { ExercisePlanModal } from "@/components/workout/exercise-plan-modal";
import type { Exercise } from "@/lib/exercises";
import { MAX_OWN_WORKOUTS, countUserWorkouts } from "@/lib/workouts";
import {
  DEFAULT_REST_SECONDS,
  defaultPlannedSets,
  describeSets,
  loadPlan,
  savePlan,
  type PlannedExercise,
} from "@/lib/workout-plan";

function ExerciseRow({
  item,
  index,
  drag,
  isActive,
  onRemove,
  onEdit,
}: RenderItemParams<PlannedExercise> & {
  index: number;
  onRemove: (key: string) => void;
  onEdit: (item: PlannedExercise) => void;
}) {
  return (
    // overflow-hidden + rounded-card on this outer wrapper (not the Card
    // itself) so the row's flat rectangle fully covers the swipe-action
    // pane at rest — Card's own rounded corners would otherwise leave a
    // transparent sliver at the top/bottom-right where the always-mounted
    // red delete button peeks through.
    <View className="mb-2 overflow-hidden rounded-card">
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
        {/* Tap opens the set plan, long-press picks the row up to reorder —
            the latter matches the gesture users already know from iOS
            home-screen icons. The grip icon is a passive hint. */}
        <Pressable
          onPress={() => {
            haptics.select();
            onEdit(item);
          }}
          onLongPress={drag}
          delayLongPress={150}
          disabled={isActive}
        >
          <Card
            className={cn(
              "flex-row items-center gap-3 rounded-none py-3",
              isActive && "border-primary",
            )}
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Text className="font-mono text-xs text-primary">{index + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-body-semibold text-sm text-foreground">{item.name}</Text>
              <Text className="mt-0.5 font-mono text-xs text-muted-foreground">
                {describeSets(item.sets)}
              </Text>
            </View>
            <ExerciseImagePlaceholder className="h-10 w-10 rounded-tile" iconSize={16} />
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
  const [items, setItems] = useState<PlannedExercise[]>([]);
  const [editing, setEditing] = useState<PlannedExercise | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
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

  function handleSelectExercise(exercise: Exercise) {
    setItems((prev) => [
      ...prev,
      {
        key: `${exercise.id}-${Date.now()}`,
        exerciseId: exercise.id,
        name: exercise.name,
        // Arrives already prescribed, so an exercise is usable the moment
        // it's added rather than needing a second editing pass.
        restSeconds: DEFAULT_REST_SECONDS,
        notes: "",
        sets: defaultPlannedSets(),
      },
    ]);
  }

  function handleEditSaved(next: PlannedExercise) {
    setItems((prev) => prev.map((item) => (item.key === next.key ? next : item)));
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
    }

    if (id) {
      try {
        await savePlan(id, items);
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
              <ExerciseRow
                {...params}
                index={params.getIndex() ?? 0}
                onRemove={handleRemove}
                onEdit={setEditing}
              />
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

      <ExercisePlanModal
        visible={editing !== null}
        exercise={editing}
        onClose={() => setEditing(null)}
        onSave={handleEditSaved}
      />
    </View>
  );
}
