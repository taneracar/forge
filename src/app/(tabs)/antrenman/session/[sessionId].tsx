import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react-native";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { DurationTimer } from "@/components/workout/duration-timer";
import { SetRow } from "@/components/workout/set-row";
import { detectPR } from "@/lib/workout-calculations";

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
}

export default function ActiveSessionScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [workoutName, setWorkoutName] = useState("");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [priorMaxByExercise, setPriorMaxByExercise] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase
        .from("workout_sessions")
        .select("started_at, workout_id, workouts(name)")
        .eq("id", sessionId)
        .single<SessionDetail>();
      if (!session) {
        setLoading(false);
        return;
      }
      setStartedAt(session.started_at);
      setWorkoutName(session.workouts?.name ?? "");

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
      const priorMax: Record<string, number> = {};
      if (exerciseIds.length > 0) {
        const { data: priorSets } = await supabase
          .from("workout_sets")
          .select("exercise_id, weight")
          .in("exercise_id", exerciseIds)
          .eq("completed", true)
          .neq("session_id", sessionId);
        for (const s of priorSets ?? []) {
          const w = s.weight ?? 0;
          if (!priorMax[s.exercise_id] || w > priorMax[s.exercise_id]) {
            priorMax[s.exercise_id] = w;
          }
        }
      }
      setPriorMaxByExercise(priorMax);

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

  async function handleFinish() {
    if (!startedAt) return;
    const durationSeconds = Math.round((Date.now() - new Date(startedAt).getTime()) / 1000);
    await supabase
      .from("workout_sessions")
      .update({ completed_at: new Date().toISOString(), duration_seconds: durationSeconds })
      .eq("id", sessionId);
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
            router.replace("/(tabs)/antrenman");
          },
        },
      ],
    );
  }

  if (loading) {
    return <View className="flex-1 bg-background" style={{ paddingTop: insets.top }} />;
  }

  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: insets.top + 16 }}>
      <View className="flex-row items-center gap-2">
        <BackButton fallbackHref="/(tabs)/antrenman" />
        <Text className="flex-1 font-display text-3xl uppercase text-foreground">
          {workoutName}
        </Text>
      </View>
      <View className="mt-2 flex-row items-center gap-2">
        <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t("panel:workout.session.durationLabel")}
        </Text>
        {startedAt && (
          <DurationTimer
            startedAt={startedAt}
            className="font-mono text-xs uppercase tracking-wider text-primary"
          />
        )}
      </View>

      <ScrollView className="mt-6 flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {groups.map((group) => (
          <View key={group.exerciseId} className="mb-6">
            <Text className="mb-3 font-body-semibold text-lg text-foreground">
              {group.name}
            </Text>
            <View className="gap-2">
              {group.sets.map((set) => (
                <SetRow
                  key={set.id}
                  setNumber={set.set_number}
                  weight={set.weight}
                  reps={set.reps}
                  completed={set.completed}
                  isPR={
                    set.completed &&
                    (set.weight ?? 0) > 0 &&
                    detectPR(group.exerciseId, set.weight ?? 0, [
                      {
                        exercise_id: group.exerciseId,
                        weight: priorMaxByExercise[group.exerciseId] ?? 0,
                        completed: true,
                      },
                    ])
                  }
                  weightLabel={t("panel:workout.session.weightLabel")}
                  repsLabel={t("panel:workout.session.repsLabel")}
                  setLabel={t("panel:workout.session.setLabel")}
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
              onPress={() => handleAddSet(group.exerciseId)}
              className="mt-2 flex-row items-center gap-1.5 self-start"
            >
              <Plus color={Colors.primary} size={14} />
              <Text className="font-mono text-xs uppercase tracking-wider text-primary">
                {t("panel:workout.session.addSetButton")}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View className="gap-3 pb-4">
        <Button variant="primary" onPress={handleFinish}>
          {t("panel:workout.session.finishButton")}
        </Button>
        <Pressable onPress={handleDiscard} className="items-center py-2">
          <Text className="font-body text-sm text-muted-foreground">
            {t("panel:workout.session.discardButton")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
