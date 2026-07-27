import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Dumbbell } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Colors } from "@/constants/colors";
import { getDashboard } from "@/services/profile.service";
import type { mockDashboard } from "@/mock/user";

function StatTile({
  value,
  unit,
  label,
}: {
  value: number;
  unit: string;
  label: string;
}) {
  return (
    <Card className="flex-1 basis-[47%]">
      <Text className="font-mono text-2xl font-bold text-primary">
        {value.toLocaleString("tr-TR")}
        {unit}
      </Text>
      <Text className="mt-1 font-body text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
    </Card>
  );
}

export default function DashboardScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const [dashboard, setDashboard] = useState<typeof mockDashboard | null>(
    null,
  );

  useEffect(() => {
    getDashboard().then(setDashboard);
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 24, padding: 24 }}
    >
      <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
        {t("dashboard.eyebrow")}
      </Text>
      <Text className="mt-3 font-display text-4xl uppercase text-foreground">
        {t("dashboard.title")}
      </Text>

      {dashboard && (
        <>
          <View className="mt-8 flex-row flex-wrap gap-3">
            <StatTile
              value={dashboard.calories.current}
              unit={` ${dashboard.calories.unit}`}
              label={t("dashboard.stats.calories")}
            />
            <StatTile
              value={dashboard.protein.current}
              unit={dashboard.protein.unit}
              label={t("dashboard.stats.protein")}
            />
            <StatTile
              value={dashboard.water.current}
              unit={dashboard.water.unit}
              label={t("dashboard.stats.water")}
            />
            <StatTile
              value={dashboard.weight.current}
              unit={dashboard.weight.unit}
              label={t("dashboard.stats.weight")}
            />
          </View>

          <Card className="mt-3 flex-row items-center justify-between gap-4">
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-sm bg-primary/10">
                <Dumbbell color={Colors.primary} size={22} />
              </View>
              <View>
                <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {t("dashboard.todayWorkoutLabel")}
                </Text>
                <Text className="font-body-semibold text-foreground">
                  {dashboard.todayWorkout.name} —{" "}
                  {dashboard.todayWorkout.exerciseCount}{" "}
                  {t("dashboard.exerciseCountSuffix")}
                </Text>
              </View>
            </View>
          </Card>

          <View className="mt-4">
            <Button variant="primary">{t("common:buttons.startWorkout")}</Button>
          </View>
        </>
      )}
    </ScrollView>
  );
}
