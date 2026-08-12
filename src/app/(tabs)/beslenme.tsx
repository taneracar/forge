import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, type BarDatum } from "@/components/ui/bar-chart";
import { AddMealModal } from "@/components/nutrition/add-meal-modal";
import { CalorieSummary } from "@/components/nutrition/calorie-summary";
import { DayStrip } from "@/components/nutrition/day-strip";
import { MealSection } from "@/components/nutrition/meal-section";
import { haptics } from "@/lib/haptics";
import { useAuthStore } from "@/store/auth.store";
import {
  addMealLog,
  deleteMealLog,
  listCalendarWeekTotals,
  listLogsForDate,
  mondayOfWeek,
  totalsFor,
  type MealLog,
  type MealType,
  type NewMealLog,
} from "@/lib/nutrition";
import { getNutritionTargets, type NutritionTargets } from "@/lib/nutrition-targets";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function BeslenmeScreen() {
  const { t, i18n } = useTranslation(["panel", "common"]);
  const userId = useAuthStore((state) => state.session?.user.id);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [weekTotals, setWeekTotals] = useState<Map<string, number>>(new Map());
  const [targets, setTargets] = useState<NutritionTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState<MealType | null>(null);

  useEffect(() => {
    if (!userId) return;
    getNutritionTargets(userId).then(setTargets);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      listLogsForDate(userId, selectedDate).catch(() => []),
      listCalendarWeekTotals(userId, selectedDate).catch(
        () => new Map<string, number>(),
      ),
    ])
      .then(([dayLogs, totals]) => {
        setLogs(dayLogs);
        setWeekTotals(totals);
      })
      .finally(() => setLoading(false));
  }, [userId, selectedDate]);

  async function handleAdd(meal: NewMealLog) {
    if (!userId) return;
    const entry = await addMealLog(userId, meal);
    setLogs((prev) => [...prev, entry]);
    setWeekTotals((prev) => {
      const next = new Map(prev);
      const key = selectedDate.toDateString();
      next.set(key, (next.get(key) ?? 0) + entry.calories);
      return next;
    });
    haptics.success();
  }

  function handleDelete(entry: MealLog) {
    haptics.select();
    setLogs((prev) => prev.filter((e) => e.id !== entry.id));
    setWeekTotals((prev) => {
      const next = new Map(prev);
      const key = selectedDate.toDateString();
      next.set(key, Math.max(0, (next.get(key) ?? 0) - entry.calories));
      return next;
    });
    void deleteMealLog(entry.id);
  }

  const totals = totalsFor(logs);
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // The bar chart reads from the same Mon–Sun map the strip does, so the
  // "This Week" heading means the same range in both places.
  const monday = mondayOfWeek(selectedDate);
  const weekChart: BarDatum[] = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + i);
    return {
      label: day.toLocaleDateString(i18n.language, { weekday: "narrow" }),
      value: weekTotals.get(day.toDateString()) ?? 0,
    };
  });

  return (
    <Screen>
      <Text className="pt-1 font-display text-4xl uppercase text-foreground">
        {isToday
          ? t("panel:nutrition.todayTitle")
          : selectedDate.toLocaleDateString(i18n.language, {
              day: "numeric",
              month: "long",
            })}
      </Text>

      <View className="mt-4">
        <DayStrip
          selected={selectedDate}
          totalsByDate={weekTotals}
          onSelect={setSelectedDate}
        />
      </View>

      {loading || !targets ? (
        <View className="mt-6 gap-3">
          <Skeleton height={240} />
          <Skeleton height={110} />
          <Skeleton height={110} />
        </View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(280)} className="mt-5">
            <CalorieSummary totals={totals} targets={targets} />
          </Animated.View>

          <View className="mt-3 gap-3">
            {MEAL_ORDER.map((mealType, i) => (
              <Animated.View
                key={mealType}
                entering={FadeInDown.duration(280).delay(40 + i * 40)}
              >
                <MealSection
                  mealType={mealType}
                  logs={logs.filter((entry) => entry.mealType === mealType)}
                  canAdd={isToday}
                  onAdd={setAddingTo}
                  onDelete={handleDelete}
                />
              </Animated.View>
            ))}
          </View>

          <SectionHeader className="mt-7" title={t("panel:nutrition.weeklyLabel")} />
          <Card className="mt-3">
            <BarChart data={weekChart} />
          </Card>
        </>
      )}

      <AddMealModal
        visible={addingTo !== null}
        mealType={addingTo ?? "breakfast"}
        onClose={() => setAddingTo(null)}
        onAdd={handleAdd}
      />
    </Screen>
  );
}
