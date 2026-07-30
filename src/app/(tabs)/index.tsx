import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Droplet, Dumbbell, Flame, Scale, Utensils } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { getDashboard } from "@/services/profile.service";
import type { mockDashboard } from "@/mock/user";

export default function DashboardScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const [dashboard, setDashboard] = useState<typeof mockDashboard | null>(null);

  useEffect(() => {
    getDashboard().then(setDashboard);
  }, []);

  function goToWorkout() {
    haptics.select();
    router.push("/(tabs)/antrenman");
  }

  return (
    <Screen>
      <Text className="font-display text-4xl uppercase text-foreground">
        {t("dashboard.title")}
      </Text>

      {!dashboard ? (
        <View className="mt-6 gap-3">
          <View className="flex-row flex-wrap gap-3">
            <Skeleton height={84} className="flex-1 basis-[47%]" />
            <Skeleton height={84} className="flex-1 basis-[47%]" />
            <Skeleton height={84} className="flex-1 basis-[47%]" />
            <Skeleton height={84} className="flex-1 basis-[47%]" />
          </View>
          <Skeleton height={80} />
        </View>
      ) : (
        <>
          <View className="mt-6 flex-row flex-wrap gap-3">
            {/* Sizing lives on a plain View (flex-1/basis-[47%] via
                NativeWind only reliably targets core RN primitives, not
                Reanimated's Animated.View) — Animated.View just animates. */}
            <View className="flex-1 basis-[47%]">
              <Animated.View entering={FadeInDown.duration(280)}>
                <StatTile
                  label={t("dashboard.stats.calories")}
                  value={dashboard.calories.current.toLocaleString()}
                  unit={dashboard.calories.unit}
                  icon={<Flame color={Colors.mutedForeground} size={13} />}
                />
              </Animated.View>
            </View>
            <View className="flex-1 basis-[47%]">
              <Animated.View entering={FadeInDown.duration(280).delay(40)}>
                <StatTile
                  label={t("dashboard.stats.protein")}
                  value={dashboard.protein.current.toLocaleString()}
                  unit={dashboard.protein.unit}
                  icon={<Utensils color={Colors.mutedForeground} size={13} />}
                />
              </Animated.View>
            </View>
            <View className="flex-1 basis-[47%]">
              <Animated.View entering={FadeInDown.duration(280).delay(80)}>
                <StatTile
                  label={t("dashboard.stats.water")}
                  value={dashboard.water.current.toLocaleString()}
                  unit={dashboard.water.unit}
                  icon={<Droplet color={Colors.mutedForeground} size={13} />}
                />
              </Animated.View>
            </View>
            <View className="flex-1 basis-[47%]">
              <Animated.View entering={FadeInDown.duration(280).delay(120)}>
                <StatTile
                  label={t("dashboard.stats.weight")}
                  value={dashboard.weight.current.toLocaleString()}
                  unit={dashboard.weight.unit}
                  icon={<Scale color={Colors.mutedForeground} size={13} />}
                />
              </Animated.View>
            </View>
          </View>

          <Animated.View entering={FadeInDown.duration(280).delay(160)}>
            <Pressable onPress={goToWorkout} className="mt-3">
              <Card variant="gradient" className="flex-row items-center gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-tile bg-primary/15">
                  <Dumbbell color={Colors.primary} size={20} />
                </View>
                <View className="flex-1">
                  <Text className="font-body-medium text-xs text-muted-foreground">
                    {t("dashboard.todayWorkoutLabel")}
                  </Text>
                  <Text className="mt-0.5 font-body-semibold text-base text-foreground">
                    {dashboard.todayWorkout.name}
                  </Text>
                  <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                    {dashboard.todayWorkout.exerciseCount}{" "}
                    {t("dashboard.exerciseCountSuffix")}
                  </Text>
                </View>
              </Card>
            </Pressable>
          </Animated.View>

          <View className="mt-4">
            <Button variant="primary" size="lg" onPress={goToWorkout}>
              {t("common:buttons.startWorkout")}
            </Button>
          </View>
        </>
      )}
    </Screen>
  );
}
