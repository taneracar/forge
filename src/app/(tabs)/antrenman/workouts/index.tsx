import { useCallback, useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { Check, ChevronRight, Dumbbell, Plus, Sparkles, Trash2 } from "lucide-react-native";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { useAuthStore } from "@/store/auth.store";
import { useWorkoutHomeStore } from "@/store/workout-home.store";
import {
  MAX_OWN_WORKOUTS,
  deleteWorkout,
  listUserWorkouts,
  selectWorkout,
  type SavedWorkout,
} from "@/lib/workouts";
import { getPublicProfile } from "@/lib/social";

export default function MyWorkoutsScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const userId = useAuthStore((state) => state.session?.user.id);
  const invalidateWorkoutHome = useWorkoutHomeStore((state) => state.invalidate);
  const [workouts, setWorkouts] = useState<SavedWorkout[]>([]);
  const [sharerNames, setSharerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const list = await listUserWorkouts(userId);
      setWorkouts(list);

      // `workouts` only stores the sharer's id; usernames come from the
      // public-profile RPC since `profiles` itself stays unreadable. Capped
      // at five shared workouts, so this is at most five small lookups.
      const shared = list.filter((w) => w.source === "shared" && w.sharedFrom);
      const resolved = await Promise.all(
        shared.map(async (w) => {
          const profile = await getPublicProfile(w.sharedFrom!).catch(() => null);
          return [w.id, profile?.username ?? "?"] as const;
        }),
      );
      setSharerNames(Object.fromEntries(resolved));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Received programs live under their own cap, so they never block you
  // from writing another of your own.
  const ownCount = workouts.filter((w) => w.source === "own").length;
  const atCap = ownCount >= MAX_OWN_WORKOUTS;

  function handleCreate() {
    if (atCap) {
      Alert.alert(
        t("panel:workout.workouts.limitTitle"),
        t("panel:workout.workouts.limitMessage", { max: MAX_OWN_WORKOUTS }),
      );
      return;
    }
    haptics.select();
    router.push("/(tabs)/antrenman/builder/new");
  }

  async function handleSelect(workout: SavedWorkout) {
    if (selecting) return;
    setSelecting(workout.id);
    await selectWorkout(workout.id);
    haptics.success();
    await load();
    invalidateWorkoutHome();
    setSelecting(null);
  }

  function handleDelete(workout: SavedWorkout) {
    Alert.alert(
      t("panel:workout.workouts.deleteConfirmTitle"),
      t("panel:workout.workouts.deleteConfirmMessage", { name: workout.name }),
      [
        { text: t("common:buttons.cancel"), style: "cancel" },
        {
          text: t("common:buttons.delete"),
          style: "destructive",
          onPress: async () => {
            setWorkouts((prev) => prev.filter((w) => w.id !== workout.id));
            await deleteWorkout(workout.id);
            invalidateWorkoutHome();
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <BackButton fallbackHref="/(tabs)/antrenman" />
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="font-display text-4xl uppercase text-foreground">
          {t("panel:workout.workouts.title")}
        </Text>
        <Text className="font-mono text-sm text-muted-foreground">
          {ownCount}/{MAX_OWN_WORKOUTS}
        </Text>
      </View>

      {loading ? (
        <View className="mt-6 gap-2">
          <Skeleton height={72} />
          <Skeleton height={72} />
          <Skeleton height={72} />
        </View>
      ) : workouts.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Dumbbell color={Colors.mutedForeground} size={24} />}
          title={t("panel:workout.workouts.emptyState")}
          description={t("panel:workout.workouts.emptyStateDescription")}
        />
      ) : (
        <View className="mt-5 gap-2">
          {workouts.map((workout, index) => {
            const isActive = index === 0;
            return (
              <Animated.View
                key={workout.id}
                entering={FadeInDown.duration(260).delay(Math.min(index, 8) * 40)}
                layout={LinearTransition.duration(220)}
              >
                <Card className="gap-0 p-0">
                  <Pressable
                    onPress={() => {
                      haptics.select();
                      router.push(`/(tabs)/antrenman/builder/${workout.id}`);
                    }}
                    className="flex-row items-center gap-3 p-4"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-tile bg-primary/15">
                      <Dumbbell color={Colors.primary} size={17} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-body-semibold text-sm text-foreground">
                          {workout.name}
                        </Text>
                        {isActive && (
                          <Badge
                            label={t("panel:workout.workouts.activeLabel")}
                            tone="success"
                          />
                        )}
                      </View>
                      <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                        {workout.exerciseCount} {t("panel:dashboard.exerciseCountSuffix")}
                      </Text>
                      {workout.source === "shared" && (
                        // Attribution survives editing — a received program
                        // stays credited to whoever wrote it.
                        <Text className="mt-0.5 font-mono text-[10px] text-primary">
                          {t("panel:social.sharedFrom", {
                            username: sharerNames[workout.id] ?? "…",
                          })}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleDelete(workout)}
                      hitSlop={8}
                      className="h-8 w-8 items-center justify-center rounded-tile active:bg-surface-overlay"
                    >
                      <Trash2 color={Colors.danger} size={16} />
                    </Pressable>
                    <ChevronRight color={Colors.muted} size={18} />
                  </Pressable>

                  {!isActive && (
                    <Pressable
                      onPress={() => handleSelect(workout)}
                      disabled={selecting === workout.id}
                      className="flex-row items-center justify-center gap-1.5 border-t border-border py-2.5 active:bg-surface-raised"
                    >
                      <Check color={Colors.primary} size={14} />
                      <Text className="font-body-medium text-xs text-primary">
                        {t("panel:workout.workouts.useButton")}
                      </Text>
                    </Pressable>
                  )}
                </Card>
              </Animated.View>
            );
          })}
        </View>
      )}

      <View className="mt-5 gap-2.5">
        <Button
          variant="outline"
          icon={<Plus color={Colors.foreground} size={16} />}
          onPress={handleCreate}
        >
          {t("panel:workout.workouts.newButton")}
        </Button>
        <Button
          variant="ghost"
          icon={<Sparkles color={Colors.primary} size={16} />}
          onPress={() => {
            haptics.select();
            router.push("/(tabs)/antrenman/templates");
          }}
        >
          {t("panel:workout.workouts.browseTemplatesButton")}
        </Button>
      </View>
    </Screen>
  );
}
