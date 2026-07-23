import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Dumbbell } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
        Bugün
      </Text>
      <Text className="mt-3 font-display text-4xl uppercase text-foreground">
        Hoş Geldin
      </Text>

      {dashboard && (
        <>
          <View className="mt-8 flex-row flex-wrap gap-3">
            <StatTile
              value={dashboard.calories.current}
              unit={` ${dashboard.calories.unit}`}
              label={dashboard.calories.label}
            />
            <StatTile
              value={dashboard.protein.current}
              unit={dashboard.protein.unit}
              label={dashboard.protein.label}
            />
            <StatTile
              value={dashboard.water.current}
              unit={dashboard.water.unit}
              label={dashboard.water.label}
            />
            <StatTile
              value={dashboard.weight.current}
              unit={dashboard.weight.unit}
              label={dashboard.weight.label}
            />
          </View>

          <Card className="mt-3 flex-row items-center justify-between gap-4">
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-sm bg-primary/10">
                <Dumbbell color={Colors.primary} size={22} />
              </View>
              <View>
                <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Bugünkü Antrenman
                </Text>
                <Text className="font-body-semibold text-foreground">
                  {dashboard.todayWorkout.name} —{" "}
                  {dashboard.todayWorkout.exerciseCount} hareket
                </Text>
              </View>
            </View>
          </Card>

          <View className="mt-4">
            <Button variant="primary">Antrenmana Başla</Button>
          </View>
        </>
      )}
    </ScrollView>
  );
}
