import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Plus, Timer } from "lucide-react-native";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";
import { useWorkoutHomeStore } from "@/store/workout-home.store";
import { DurationTimer } from "@/components/workout/duration-timer";
import { SetRow, SET_COLUMNS } from "@/components/workout/set-row";
import {
  bestPerformance,
  calculateVolume,
  compareSetPerformance,
  isPersonalRecord,
} from "@/lib/workout-calculations";

interface LocalSet {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
}

interface ExerciseGroup {
  exerciseId: string;
  name: string;
  sets: LocalSet[];
}

interface WorkoutExerciseRow {
  order_index: number;
  exercise_id: string;
  exercises: { name: string } | null;
}

interface SessionDetail {
  started_at: string;
  workout_id: string | null;
  workouts: { name: string } | null;
  notes: string | null;
}

interface PriorSetRow {
  exercise_id: string;
  weight: number | null;
  reps: number | null;
}

export default function ActiveSessionScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const invalidateWorkoutHome = useWorkoutHomeStore((state) => state.invalidate);

  const [workoutName, setWorkoutName] = useState("");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [priorBestByExercise, setPriorBestByExercise] = useState<Record<string, PriorSetRow>>(
    {},
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase
        .from("workout_sessions")
        .select("started_at, workout_id, workouts(name), notes")
        .eq("id", sessionId)
        .single<SessionDetail>();
      if (!session) {
        setLoading(false);
        return;
      }
      setStartedAt(session.started_at);
      setWorkoutName(session.workouts?.name ?? "");
      setNotes(session.notes ?? "");

      let exerciseRows: WorkoutExerciseRow[] = [];
      if (session.workout_id) {
        const { data } = await supabase
          .from("workout_exercises")
          .select("order_index, exercise_id, exercises(name)")
          .eq("workout_id", session.workout_id)
          .order("order_index")
          .returns<WorkoutExerciseRow[]>();
        exerciseRows = data ?? [];
      }

      const { data: setsData } = await supabase
        .from("workout_sets")
        .select("id, exercise_id, set_number, weight, reps, completed")
        .eq("session_id", sessionId)
        .order("set_number");

      const exerciseIds = exerciseRows.map((r) => r.exercise_id);
      const priorBest: Record<string, PriorSetRow> = {};
      if (exerciseIds.length > 0) {
        // Same rule as the history screen: only earlier sessions set the record.
        const { data: priorSets } = await supabase
          .from("workout_sets")
          .select("exercise_id, weight, reps, workout_sessions!inner(started_at)")
          .in("exercise_id", exerciseIds)
          .eq("completed", true)
          .lt("workout_sessions.started_at", session.started_at)
          .returns<PriorSetRow[]>();
        for (const set of priorSets ?? []) {
          const current = priorBest[set.exercise_id];
          if (!current || compareSetPerformance(set, current) > 0) {
            priorBest[set.exercise_id] = set;
          }
        }
      }
      setPriorBestByExercise(priorBest);

      setGroups(
        exerciseRows.map((row) => ({
          exerciseId: row.exercise_id,
          name: row.exercises?.name ?? "",
          sets: (setsData ?? [])
            .filter((s) => s.exercise_id === row.exercise_id)
            .map((s) => ({
              id: s.id,
              set_number: s.set_number,
              weight: s.weight,
              reps: s.reps,
              completed: s.completed,
            })),
        })),
      );
      setLoading(false);
    }
    load();
  }, [sessionId]);

  function updateLocalSet(exerciseId: string, setId: string, patch: Partial<LocalSet>) {
    setGroups((prev) =>
      prev.map((g) =>
        g.exerciseId === exerciseId
          ? { ...g, sets: g.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) }
          : g,
      ),
    );
  }

  async function handleAddSet(exerciseId: string) {
    const group = groups.find((g) => g.exerciseId === exerciseId);
    const nextNumber = (group?.sets.length ?? 0) + 1;
    const { data, error } = await supabase
      .from("workout_sets")
      .insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: nextNumber,
        weight: 0,
        reps: 0,
        completed: false,
      })
      .select("id")
      .single();
    if (error || !data) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.exerciseId === exerciseId
          ? {
              ...g,
              sets: [
                ...g.sets,
                { id: data.id, set_number: nextNumber, weight: 0, reps: 0, completed: false },
              ],
            }
          : g,
      ),
    );
  }

  function handleChangeWeight(exerciseId: string, setId: string, value: number) {
    updateLocalSet(exerciseId, setId, { weight: value });
    supabase.from("workout_sets").update({ weight: value }).eq("id", setId).then(() => {});
  }

  function handleChangeReps(exerciseId: string, setId: string, value: number) {
    updateLocalSet(exerciseId, setId, { reps: value });
    supabase.from("workout_sets").update({ reps: value }).eq("id", setId).then(() => {});
  }

  function handleToggleComplete(exerciseId: string, set: LocalSet) {
    const nextCompleted = !set.completed;
    updateLocalSet(exerciseId, set.id, { completed: nextCompleted });
    supabase
      .from("workout_sets")
      .update({ completed: nextCompleted })
      .eq("id", set.id)
      .then(() => {});
  }

  function handleDeleteSet(exerciseId: string, setId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.exerciseId === exerciseId ? { ...g, sets: g.sets.filter((s) => s.id !== setId) } : g,
      ),
    );
    supabase.from("workout_sets").delete().eq("id", setId).then(() => {});
  }

  function handleBlurNotes() {
    supabase
      .from("workout_sessions")
      .update({ notes: notes.trim() || null })
      .eq("id", sessionId)
      .then(() => {});
  }

  async function handleFinish() {
    if (!startedAt) return;
    const durationSeconds = Math.round((Date.now() - new Date(startedAt).getTime()) / 1000);
    await supabase
      .from("workout_sessions")
      .update({ completed_at: new Date().toISOString(), duration_seconds: durationSeconds })
      .eq("id", sessionId);
    invalidateWorkoutHome();
    router.replace("/(tabs)/antrenman");
  }

  function handleDiscard() {
    Alert.alert(
      t("panel:workout.session.discardConfirmTitle"),
      t("panel:workout.session.discardConfirmMessage"),
      [
        { text: t("common:buttons.cancel"), style: "cancel" },
        {
          text: t("common:buttons.discard"),
          style: "destructive",
          onPress: async () => {
            await supabase.from("workout_sessions").delete().eq("id", sessionId);
            invalidateWorkoutHome();
            router.replace("/(tabs)/antrenman");
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View
        className="flex-1 gap-3 bg-background px-5"
        style={{ paddingTop: insets.top + 20 }}
      >
        <Skeleton height={40} />
        <Skeleton height={72} />
        <Skeleton height={180} />
      </View>
    );
  }

  // Derived every render so the badge follows the sets as they are edited.
  const prSetIds = new Set<string>();
  for (const group of groups) {
    const best = bestPerformance(group.sets.filter((s) => s.completed));
    if (best && isPersonalRecord(best, priorBestByExercise[group.exerciseId] ?? null)) {
      prSetIds.add(best.id);
    }
  }

  const allSets = groups.flatMap((g) => g.sets);
  const completedCount = allSets.filter((s) => s.completed).length;
  const progress = allSets.length > 0 ? completedCount / allSets.length : 0;
  const volume = calculateVolume(allSets);

  return (
    <View className="flex-1 bg-background px-5" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center gap-2">
        <BackButton fallbackHref="/(tabs)/antrenman" />
        <Text className="flex-1 font-display text-2xl uppercase text-foreground">
          {workoutName}
        </Text>
      </View>

      {/* Live stats: the numbers you glance at mid-workout get the most weight. */}
      <Card variant="gradient" className="mt-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Timer color={Colors.primary} size={18} />
            {startedAt && (
              <DurationTimer
                startedAt={startedAt}
                className="font-mono text-3xl text-foreground"
              />
            )}
          </View>
          <View className="items-end">
            <Text className="font-mono text-lg text-foreground">
              {Math.round(volume).toLocaleString()} kg
            </Text>
            <Text className="font-body text-[11px] text-muted-foreground">
              {completedCount}/{allSets.length} {t("panel:workout.session.setLabel")}
            </Text>
          </View>
        </View>
        <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
          <View
            className="h-full rounded-full bg-success"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
      </Card>

      <ScrollView
        className="mt-4 flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {groups.map((group, groupIndex) => (
          <Animated.View
            key={group.exerciseId}
            entering={FadeInDown.duration(280).delay(groupIndex * 50)}
          >
            <Card className="mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 font-body-semibold text-base text-foreground">
                  {group.name}
                </Text>
                <Text className="font-mono text-xs text-muted-foreground">
                  {group.sets.filter((s) => s.completed).length}/{group.sets.length}
                </Text>
              </View>

              {group.sets.length > 0 && (
                <View
                  className="mt-3 flex-row items-center px-1.5"
                  style={{ gap: SET_COLUMNS.gap }}
                >
                  <View style={{ width: SET_COLUMNS.badge }} />
                  <Text className="flex-1 text-center font-body-medium text-[10px] text-muted-foreground">
                    {t("panel:workout.session.weightLabel")}
                  </Text>
                  <Text className="flex-1 text-center font-body-medium text-[10px] text-muted-foreground">
                    {t("panel:workout.session.repsLabel")}
                  </Text>
                  <View
                    style={{ width: SET_COLUMNS.check + SET_COLUMNS.remove + SET_COLUMNS.gap }}
                  />
                </View>
              )}

              <View className="mt-1.5 gap-1.5">
                {group.sets.map((set) => (
                  <SetRow
                    key={set.id}
                    setNumber={set.set_number}
                    weight={set.weight}
                    reps={set.reps}
                    completed={set.completed}
                    isPR={prSetIds.has(set.id)}
                    onChangeWeight={(value) =>
                      handleChangeWeight(group.exerciseId, set.id, value)
                    }
                    onChangeReps={(value) => handleChangeReps(group.exerciseId, set.id, value)}
                    onToggleComplete={() => handleToggleComplete(group.exerciseId, set)}
                    onDelete={() => handleDeleteSet(group.exerciseId, set.id)}
                  />
                ))}
              </View>

              <Pressable
                onPress={() => {
                  haptics.select();
                  handleAddSet(group.exerciseId);
                }}
                className="mt-2.5 flex-row items-center justify-center gap-1.5 rounded-tile border border-dashed border-border-strong py-2.5 active:bg-surface-raised"
              >
                <Plus color={Colors.primary} size={15} />
                <Text className="font-body-medium text-xs text-primary">
                  {t("panel:workout.session.addSetButton")}
                </Text>
              </Pressable>
            </Card>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.duration(280).delay(groups.length * 50)}>
          <Card>
            <Text className="font-body-semibold text-base text-foreground">
              {t("panel:workout.session.notesLabel")}
            </Text>
            <Input
              value={notes}
              onChangeText={setNotes}
              onBlur={handleBlurNotes}
              placeholder={t("panel:workout.session.notesPlaceholder")}
              placeholderTextColor={Colors.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              containerClassName="mt-2.5"
              className="min-h-[88px]"
            />
          </Card>
        </Animated.View>
      </ScrollView>

      <View className="gap-1 pb-3 pt-1">
        <Button variant="primary" size="lg" onPress={handleFinish}>
          {t("panel:workout.session.finishButton")}
        </Button>
        <Pressable onPress={handleDiscard} className="items-center py-2.5">
          <Text className="font-body text-sm text-muted-foreground">
            {t("panel:workout.session.discardButton")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
