import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronRight, Dumbbell, Flame, History } from "lucide-react-native";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { calculateVolume, formatDuration } from "@/lib/workout-calculations";

interface SessionRow {
  id: string;
  completed_at: string;
  duration_seconds: number | null;
  workouts: { name: string } | null;
  workout_sets: { weight: number | null; reps: number | null; completed: boolean }[];
}

interface HistoryItem {
  id: string;
  workoutName: string;
  completedAt: string;
  durationSeconds: number | null;
  volume: number;
}

export default function WorkoutHistoryScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const userId = useAuthStore((state) => state.session?.user.id);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("workout_sessions")
      .select(
        "id, completed_at, duration_seconds, workouts(name), workout_sets(weight, reps, completed)",
      )
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .returns<SessionRow[]>()
      .then(({ data }) => {
        setItems(
          (data ?? []).map((s) => ({
            id: s.id,
            workoutName: s.workouts?.name ?? "—",
            completedAt: s.completed_at,
            durationSeconds: s.duration_seconds,
            volume: calculateVolume(s.workout_sets ?? []),
          })),
        );
        setLoading(false);
      });
  }, [userId]);

  const totalVolume = items.reduce((sum, i) => sum + i.volume, 0);
  const totalSeconds = items.reduce((sum, i) => sum + (i.durationSeconds ?? 0), 0);

  return (
    <Screen>
      <BackButton fallbackHref="/(tabs)/antrenman" />
      <Text className="mt-2 font-display text-4xl uppercase text-foreground">
        {t("panel:workout.history.title")}
      </Text>

      {loading ? (
        <View className="mt-6 gap-3">
          <Skeleton height={72} />
          <Skeleton height={84} />
          <Skeleton height={84} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<History color={Colors.mutedForeground} size={24} />}
          title={t("panel:workout.history.emptyState")}
          description={t("panel:workout.home.noRecentDescription")}
        />
      ) : (
        <>
          <View className="mt-5 flex-row gap-3">
            <StatTile
              className="flex-1"
              label={t("panel:workout.home.statsSessions")}
              value={String(items.length)}
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

          <View className="mt-5 gap-2">
            {items.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.duration(280).delay(Math.min(index, 8) * 40)}
              >
                <Pressable
                  onPress={() => {
                    haptics.select();
                    router.push(`/(tabs)/antrenman/history/${item.id}`);
                  }}
                >
                  <Card className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-tile bg-surface-overlay">
                      <Dumbbell color={Colors.mutedForeground} size={17} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-body-semibold text-sm text-foreground">
                        {item.workoutName}
                      </Text>
                      <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                        {new Date(item.completedAt).toLocaleDateString()}
                      </Text>
                      <View className="mt-1.5 flex-row items-center gap-3">
                        <Text className="font-mono text-xs text-foreground">
                          {Math.round(item.volume).toLocaleString()} kg
                        </Text>
                        <Text className="font-mono text-xs text-muted-foreground">
                          {item.durationSeconds ? formatDuration(item.durationSeconds) : "—"}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight color={Colors.muted} size={18} />
                  </Card>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <Text className="mt-5 text-center font-body text-xs text-muted-foreground">
            {t("panel:workout.history.totalTime")} {formatDuration(totalSeconds)}
          </Text>
        </>
      )}
    </Screen>
  );
}
