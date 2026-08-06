import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ChevronRight, Dumbbell, Flame, History, Play } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, type BarDatum } from "@/components/ui/bar-chart";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { useWorkoutHomeStore } from "@/store/workout-home.store";
import { formatDuration } from "@/lib/workout-calculations";

/** Slow pulse so an unfinished workout reads as live without being noisy. */
function LiveDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.25, { duration: 900 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={style}>
      <View className="h-2 w-2 rounded-full bg-success" />
    </Animated.View>
  );
}

export default function AntrenmanHomeScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const userId = useAuthStore((state) => state.session?.user.id);
  const currentWorkout = useWorkoutHomeStore((state) => state.currentWorkout);
  const recentSessions = useWorkoutHomeStore((state) => state.recentSessions);
  const openSession = useWorkoutHomeStore((state) => state.openSession);
  const loading = useWorkoutHomeStore((state) => state.loading);
  const load = useWorkoutHomeStore((state) => state.load);
  const setOpenSession = useWorkoutHomeStore((state) => state.setOpenSession);
  const [starting, setStarting] = useState(false);

  // `load` no-ops once already cached, so this is cheap on every tab visit —
  // it only actually refetches after a mutation elsewhere calls invalidate().
  useFocusEffect(
    useCallback(() => {
      if (userId) load(userId);
    }, [userId, load]),
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
    setOpenSession({ id: data.id });
    haptics.success();
    router.push(`/(tabs)/antrenman/session/${data.id}`);
  }

  // Oldest-to-newest so the chart reads left to right.
  const chartData: BarDatum[] = [...recentSessions].reverse().map((s) => ({
    label: new Date(s.completedAt).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
    }),
    value: Math.round(s.volume),
  }));

  const totalVolume = recentSessions.reduce((sum, s) => sum + s.volume, 0);

  return (
    <Screen>
      <Text className="font-display text-4xl uppercase text-foreground">
        {t("panel:workout.home.title")}
      </Text>

      {loading ? (
        <View className="mt-6 gap-3">
          <Skeleton height={132} />
          <Skeleton height={56} />
          <Skeleton height={96} />
        </View>
      ) : (
        <>
          {openSession && (
            <Animated.View entering={FadeInDown.duration(320)}>
              <Pressable
                onPress={() => {
                  haptics.select();
                  router.push(`/(tabs)/antrenman/session/${openSession.id}`);
                }}
                className="mt-5"
              >
                <Card variant="raised" className="border-success/40 flex-row items-center gap-3">
                  <LiveDot />
                  <View className="flex-1">
                    <Text className="font-body-semibold text-sm text-foreground">
                      {t("panel:workout.home.resumeBanner")}
                    </Text>
                    <Text className="mt-0.5 font-body text-xs text-success">
                      {t("panel:workout.home.resumeButton")}
                    </Text>
                  </View>
                  <ChevronRight color={Colors.success} size={18} />
                </Card>
              </Pressable>
            </Animated.View>
          )}

          <SectionHeader
            className="mt-7"
            title={t("panel:workout.home.currentProgramLabel")}
            actionLabel={t("panel:workout.home.myWorkoutsButton")}
            onAction={() => {
              haptics.select();
              router.push("/(tabs)/antrenman/workouts");
            }}
          />

          {currentWorkout ? (
            <Animated.View entering={FadeInDown.duration(320).delay(60)}>
              <Pressable
                onPress={() => {
                  haptics.select();
                  router.push(`/(tabs)/antrenman/builder/${currentWorkout.id}`);
                }}
                className="mt-3"
              >
                <Card variant="gradient">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="font-display text-3xl uppercase text-foreground">
                        {currentWorkout.name}
                      </Text>
                      <Text className="mt-1 font-body text-xs text-muted-foreground">
                        {currentWorkout.exerciseNames.length}{" "}
                        {t("panel:dashboard.exerciseCountSuffix")}
                      </Text>
                    </View>
                    <View className="h-11 w-11 items-center justify-center rounded-tile bg-primary/15">
                      <Dumbbell color={Colors.primary} size={20} />
                    </View>
                  </View>

                  {currentWorkout.exerciseNames.length > 0 && (
                    <View className="mt-4 gap-2.5">
                      {currentWorkout.exerciseNames.map((name, i) => (
                        <View key={i} className="flex-row items-center gap-2.5">
                          <Text className="w-4 font-mono text-xs text-primary">{i + 1}</Text>
                          <Text className="flex-1 font-body text-sm text-foreground">{name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              </Pressable>
            </Animated.View>
          ) : (
            <EmptyState
              className="mt-3"
              icon={<Dumbbell color={Colors.mutedForeground} size={24} />}
              title={t("panel:workout.home.noProgram")}
              description={t("panel:workout.home.noProgramDescription")}
              actionLabel={t("panel:workout.home.createWorkoutButton")}
              onAction={() => router.push("/(tabs)/antrenman/builder/new")}
            />
          )}

          {!openSession && currentWorkout && (
            <View className="mt-4">
              <Button
                variant="primary"
                size="lg"
                loading={starting}
                onPress={handleStart}
                icon={<Play color={Colors.primaryForeground} size={18} fill={Colors.primaryForeground} />}
              >
                {t("common:buttons.startWorkout")}
              </Button>
            </View>
          )}

          <SectionHeader
            className="mt-8"
            title={t("panel:workout.home.recentLabel")}
            actionLabel={t("panel:workout.home.historyButton")}
            onAction={() => {
              haptics.select();
              router.push("/(tabs)/antrenman/history");
            }}
          />

          {recentSessions.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={<History color={Colors.mutedForeground} size={24} />}
              title={t("panel:workout.home.noRecent")}
              description={t("panel:workout.home.noRecentDescription")}
            />
          ) : (
            <>
              <View className="mt-3 flex-row gap-3">
                <StatTile
                  className="flex-1"
                  label={t("panel:workout.home.statsSessions")}
                  value={String(recentSessions.length)}
                  icon={<Dumbbell color={Colors.mutedForeground} size={13} />}
                />
                <StatTile
                  className="flex-1"
                  label={t("panel:workout.home.statsVolume")}
                  value={Math.round(totalVolume).toLocaleString()}
                  unit="kg"
                  icon={<Flame color={Colors.mutedForeground} size={13} />}
                />
              </View>

              <Card className="mt-3">
                <BarChart data={chartData} />
              </Card>

              <View className="mt-3 gap-2">
                {recentSessions.map((session, i) => (
                  <Animated.View
                    key={session.id}
                    entering={FadeInDown.duration(300).delay(i * 50)}
                  >
                    <Pressable
                      onPress={() => {
                        haptics.select();
                        router.push(`/(tabs)/antrenman/history/${session.id}`);
                      }}
                    >
                      <Card className="flex-row items-center gap-3">
                        <View className="h-9 w-9 items-center justify-center rounded-tile bg-surface-overlay">
                          <Dumbbell color={Colors.mutedForeground} size={16} />
                        </View>
                        <View className="flex-1">
                          <Text className="font-body-semibold text-sm text-foreground">
                            {session.workoutName}
                          </Text>
                          <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                            {new Date(session.completedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="font-mono text-sm text-foreground">
                            {Math.round(session.volume).toLocaleString()} kg
                          </Text>
                          <Text className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            {session.durationSeconds
                              ? formatDuration(session.durationSeconds)
                              : "—"}
                          </Text>
                        </View>
                      </Card>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </Screen>
  );
}
