import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { calculateVolume, formatDuration } from "@/lib/workout-calculations";

interface CurrentWorkout {
  id: string;
  name: string;
  exerciseNames: string[];
}

interface RecentSession {
  id: string;
  workoutName: string;
  completedAt: string;
  durationSeconds: number | null;
  volume: number;
}

interface OpenSession {
  id: string;
}

interface WorkoutExerciseRow {
  order_index: number;
  exercises: { name: string } | null;
}

interface SessionRow {
  id: string;
  completed_at: string;
  duration_seconds: number | null;
  workouts: { name: string } | null;
  workout_sets: { weight: number | null; reps: number | null; completed: boolean }[];
}

export default function AntrenmanHomeScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.session?.user.id);
  const [currentWorkout, setCurrentWorkout] = useState<CurrentWorkout | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [openSession, setOpenSession] = useState<OpenSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [{ data: workout }, { data: sessions }, { data: open }] = await Promise.all([
      supabase
        .from("workouts")
        .select("id, name")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("workout_sessions")
        .select("id, completed_at, duration_seconds, workouts(name), workout_sets(weight, reps, completed)")
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(3)
        .returns<SessionRow[]>(),
      supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", userId)
        .is("completed_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (workout) {
      const { data: exercises } = await supabase
        .from("workout_exercises")
        .select("order_index, exercises(name)")
        .eq("workout_id", workout.id)
        .order("order_index")
        .returns<WorkoutExerciseRow[]>();
      setCurrentWorkout({
        id: workout.id,
        name: workout.name,
        exerciseNames: (exercises ?? [])
          .map((e) => e.exercises?.name)
          .filter((name): name is string => Boolean(name)),
      });
    } else {
      setCurrentWorkout(null);
    }

    setRecentSessions(
      (sessions ?? []).map((s) => ({
        id: s.id,
        workoutName: s.workouts?.name ?? "—",
        completedAt: s.completed_at,
        durationSeconds: s.duration_seconds,
        volume: calculateVolume(s.workout_sets ?? []),
      })),
    );

    setOpenSession(open ? { id: open.id } : null);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleStart() {
    if (!userId || starting) return;
    setStarting(true);
    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({ user_id: userId, workout_id: currentWorkout?.id ?? null })
      .select("id")
      .single();
    setStarting(false);
    if (error || !data) return;
    router.push(`/(tabs)/antrenman/session/${data.id}`);
  }

  return (
    <ScrollView
      className="flex-1 bg-background px-6"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 40 }}
    >
      <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
        {t("panel:workout.home.eyebrow")}
      </Text>
      <Text className="mt-3 font-display text-4xl uppercase text-foreground">
        {t("panel:workout.home.title")}
      </Text>

      {openSession && (
        <Pressable
          onPress={() => router.push(`/(tabs)/antrenman/session/${openSession.id}`)}
          className="mt-6 rounded-md border border-primary bg-primary/10 p-4"
        >
          <Text className="font-body-semibold text-sm text-primary">
            {t("panel:workout.home.resumeBanner")}
          </Text>
          <Text className="mt-1 font-mono text-xs uppercase tracking-wider text-primary">
            {t("panel:workout.home.resumeButton")} →
          </Text>
        </Pressable>
      )}

      <View className="mt-6">
        <View className="flex-row items-center justify-between">
          <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {t("panel:workout.home.currentProgramLabel")}
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/antrenman/builder/new")}>
            <Text className="font-mono text-xs uppercase tracking-wider text-primary">
              {t("panel:workout.home.newWorkoutButton")}
            </Text>
          </Pressable>
        </View>
        {!loading && currentWorkout ? (
          <Pressable
            onPress={() => router.push(`/(tabs)/antrenman/builder/${currentWorkout.id}`)}
          >
            <Card className="mt-3">
              <Text className="font-display text-2xl uppercase text-foreground">
                {currentWorkout.name}
              </Text>
              <View className="mt-3 gap-1.5">
                {currentWorkout.exerciseNames.map((name, i) => (
                  <Text key={i} className="font-body text-sm text-muted-foreground">
                    • {name}
                  </Text>
                ))}
              </View>
            </Card>
          </Pressable>
        ) : (
          !loading && (
            <View className="mt-3">
              <Text className="font-body text-sm text-muted-foreground">
                {t("panel:workout.home.noProgram")}
              </Text>
              <View className="mt-4">
                <Button
                  variant="outline"
                  onPress={() => router.push("/(tabs)/antrenman/builder/new")}
                >
                  {t("panel:workout.home.createWorkoutButton")}
                </Button>
              </View>
            </View>
          )
        )}
      </View>

      {!openSession && currentWorkout && (
        <View className="mt-6">
          <Button variant="primary" onPress={handleStart} disabled={starting}>
            {t("common:buttons.startWorkout")}
          </Button>
        </View>
      )}

      <View className="mt-8 flex-row items-center justify-between">
        <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t("panel:workout.home.recentLabel")}
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/antrenman/history")}>
          <Text className="font-mono text-xs uppercase tracking-wider text-primary">
            {t("panel:workout.home.historyButton")}
          </Text>
        </Pressable>
      </View>

      {!loading && recentSessions.length === 0 && (
        <Text className="mt-3 font-body text-sm text-muted-foreground">
          {t("panel:workout.home.noRecent")}
        </Text>
      )}

      <View className="mt-3 gap-3">
        {recentSessions.map((session) => (
          <Pressable
            key={session.id}
            onPress={() => router.push(`/(tabs)/antrenman/history/${session.id}`)}
          >
            <Card>
              <Text className="font-body-semibold text-base text-foreground">
                {session.workoutName}
              </Text>
              <Text className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {new Date(session.completedAt).toLocaleDateString()} ·{" "}
                {session.durationSeconds ? formatDuration(session.durationSeconds) : "—"} ·{" "}
                {Math.round(session.volume)} kg
              </Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
