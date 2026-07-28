import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
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
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.session?.user.id);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("workout_sessions")
      .select("id, completed_at, duration_seconds, workouts(name), workout_sets(weight, reps, completed)")
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

  return (
    <ScrollView
      className="flex-1 bg-background px-6"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 40 }}
    >
      <BackButton fallbackHref="/(tabs)/antrenman" />
      <Text className="mt-3 font-mono text-xs uppercase tracking-[3px] text-primary">
        {t("panel:workout.history.eyebrow")}
      </Text>
      <Text className="mt-3 font-display text-4xl uppercase text-foreground">
        {t("panel:workout.history.title")}
      </Text>

      {!loading && items.length === 0 && (
        <Text className="mt-6 font-body text-sm text-muted-foreground">
          {t("panel:workout.history.emptyState")}
        </Text>
      )}

      <View className="mt-6 gap-3">
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(`/(tabs)/antrenman/history/${item.id}`)}
          >
            <Card>
              <Text className="font-body-semibold text-base text-foreground">
                {item.workoutName}
              </Text>
              <Text className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {new Date(item.completedAt).toLocaleDateString()}
              </Text>
              <View className="mt-3 flex-row gap-6">
                <View>
                  <Text className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("panel:workout.history.durationLabel")}
                  </Text>
                  <Text className="mt-0.5 font-body-semibold text-sm text-foreground">
                    {item.durationSeconds ? formatDuration(item.durationSeconds) : "—"}
                  </Text>
                </View>
                <View>
                  <Text className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("panel:workout.history.volumeLabel")}
                  </Text>
                  <Text className="mt-0.5 font-body-semibold text-sm text-foreground">
                    {Math.round(item.volume)} kg
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
