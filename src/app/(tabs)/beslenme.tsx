import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { Plus, Utensils, X } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, type BarDatum } from "@/components/ui/bar-chart";
import { PressableScale } from "@/components/ui/pressable-scale";
import { AddMealModal } from "@/components/nutrition/add-meal-modal";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { useAuthStore } from "@/store/auth.store";
import {
  addMealLog,
  deleteMealLog,
  listTodayLogs,
  listWeekTotals,
  totalsFor,
  type MealLog,
  type MealType,
  type NewMealLog,
} from "@/lib/nutrition";

/** Icon-badge accent by meal type — reuses existing palette tokens, not new colors. */
const mealTypeColor: Record<MealType, string> = {
  breakfast: Colors.chartAlt,
  lunch: Colors.primary,
  dinner: Colors.warning,
  snack: Colors.success,
};

function defaultMealTypeForNow(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}

export default function BeslenmeScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const userId = useAuthStore((state) => state.session?.user.id);

  const [todayLogs, setTodayLogs] = useState<MealLog[]>([]);
  const [weekTotals, setWeekTotals] = useState<BarDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      listTodayLogs(userId).catch(() => []),
      listWeekTotals(userId).catch(() => []),
    ])
      .then(([logs, totals]) => {
        setTodayLogs(logs);
        setWeekTotals(totals);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleAdd(meal: NewMealLog) {
    if (!userId) return;
    const entry = await addMealLog(userId, meal);
    setTodayLogs((prev) => [...prev, entry]);
    setWeekTotals((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, value: last.value + entry.calories };
      return next;
    });
    haptics.success();
  }

  function handleDelete(entry: MealLog) {
    haptics.select();
    setTodayLogs((prev) => prev.filter((e) => e.id !== entry.id));
    setWeekTotals((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, value: Math.max(0, last.value - entry.calories) };
      return next;
    });
    void deleteMealLog(entry.id);
  }

  const totals = totalsFor(todayLogs);

  return (
    <Screen>
      <Text className="pt-1 font-display text-4xl uppercase text-foreground">
        {t("panel:nutrition.title")}
      </Text>

      {loading ? (
        <View className="mt-6 gap-3">
          <Skeleton height={140} />
        </View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(280)} className="mt-6">
            <Card variant="gradient">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-body-medium text-xs text-muted-foreground">
                    {t("panel:nutrition.caloriesLabel")}
                  </Text>
                  <Text className="mt-1 font-mono text-3xl text-foreground">
                    {totals.calories}
                    <Text className="font-body text-base text-muted-foreground"> kcal</Text>
                  </Text>
                </View>
                <View className="h-12 w-12 items-center justify-center rounded-tile bg-primary/15">
                  <Utensils color={Colors.primary} size={22} />
                </View>
              </View>
              <View className="mt-4 flex-row gap-4">
                <View className="flex-1">
                  <Text className="font-body-medium text-xs text-muted-foreground">
                    {t("panel:nutrition.proteinLabel")}
                  </Text>
                  <Text className="mt-0.5 font-mono text-base text-foreground">
                    {Math.round(totals.proteinG)}
                    <Text className="font-body text-xs text-muted-foreground"> g</Text>
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-body-medium text-xs text-muted-foreground">
                    {t("panel:nutrition.carbsLabel")}
                  </Text>
                  <Text className="mt-0.5 font-mono text-base text-foreground">
                    {Math.round(totals.carbsG)}
                    <Text className="font-body text-xs text-muted-foreground"> g</Text>
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-body-medium text-xs text-muted-foreground">
                    {t("panel:nutrition.fatLabel")}
                  </Text>
                  <Text className="mt-0.5 font-mono text-base text-foreground">
                    {Math.round(totals.fatG)}
                    <Text className="font-body text-xs text-muted-foreground"> g</Text>
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(280).delay(40)} className="mt-3">
            <PressableScale
              onPress={() => {
                haptics.select();
                setModalVisible(true);
              }}
            >
              <Card variant="raised" className="flex-row items-center justify-center gap-2 py-4">
                <Plus color={Colors.primary} size={18} />
                <Text className="font-body-semibold text-sm text-foreground">
                  {t("panel:nutrition.addButton")}
                </Text>
              </Card>
            </PressableScale>
          </Animated.View>

          <SectionHeader className="mt-7" title={t("panel:nutrition.entriesLabel")} />

          {todayLogs.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={<Utensils color={Colors.mutedForeground} size={24} />}
              title={t("panel:nutrition.emptyState")}
            />
          ) : (
            <View className="mt-3 gap-2">
              {todayLogs.map((entry, i) => (
                <Animated.View
                  key={entry.id}
                  entering={FadeInDown.duration(240).delay(Math.min(i, 8) * 30)}
                  layout={LinearTransition.duration(200)}
                >
                  <Card className="flex-row items-center justify-between">
                    <View className="flex-1 flex-row items-center gap-3">
                      <View
                        className="h-8 w-8 items-center justify-center rounded-tile"
                        style={{ backgroundColor: `${mealTypeColor[entry.mealType]}26` }}
                      >
                        <Utensils color={mealTypeColor[entry.mealType]} size={14} />
                      </View>
                      <View className="flex-1">
                        <Text
                          numberOfLines={1}
                          className="font-body-semibold text-sm text-foreground"
                        >
                          {entry.name}
                        </Text>
                        <Text className="font-body text-xs text-muted-foreground">
                          {t(`panel:nutrition.mealTypes.${entry.mealType}`)} ·{" "}
                          {entry.calories} kcal
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleDelete(entry)}
                      hitSlop={8}
                      className="h-8 w-8 items-center justify-center rounded-tile active:bg-surface-overlay"
                    >
                      <X color={Colors.muted} size={16} />
                    </Pressable>
                  </Card>
                </Animated.View>
              ))}
            </View>
          )}

          <SectionHeader className="mt-7" title={t("panel:nutrition.weeklyLabel")} />
          <Card className="mt-3">
            <BarChart data={weekTotals} />
          </Card>
        </>
      )}

      <AddMealModal
        visible={modalVisible}
        defaultMealType={defaultMealTypeForNow()}
        onClose={() => setModalVisible(false)}
        onAdd={handleAdd}
      />
    </Screen>
  );
}
