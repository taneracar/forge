import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Droplet, X } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, type BarDatum } from "@/components/ui/bar-chart";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { useAuthStore } from "@/store/auth.store";
import {
  DAILY_WATER_GOAL_ML,
  addWaterLog,
  deleteWaterLog,
  listTodayLogs,
  listWeekTotals,
  type WaterLog,
} from "@/lib/water";

const QUICK_ADD_ML = [200, 330, 500, 1000] as const;
const QUICK_ADD_KEYS: Record<(typeof QUICK_ADD_ML)[number], string> = {
  200: "glass",
  330: "can",
  500: "bottle",
  1000: "largeBottle",
};

export default function SuScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const userId = useAuthStore((state) => state.session?.user.id);

  const [todayLogs, setTodayLogs] = useState<WaterLog[]>([]);
  const [weekTotals, setWeekTotals] = useState<BarDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingAmount, setAddingAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    Promise.all([listTodayLogs(userId), listWeekTotals(userId)])
      .then(([logs, totals]) => {
        setTodayLogs(logs);
        setWeekTotals(totals);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  function adjustToday(deltaMl: number) {
    setWeekTotals((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = { ...last, value: Math.max(0, last.value + deltaMl) };
      return next;
    });
  }

  async function handleAdd(amountMl: number) {
    if (!userId || addingAmount !== null) return;
    setAddingAmount(amountMl);
    try {
      const entry = await addWaterLog(userId, amountMl);
      setTodayLogs((prev) => [...prev, entry]);
      adjustToday(amountMl);
      haptics.success();
    } finally {
      setAddingAmount(null);
    }
  }

  function handleDelete(entry: WaterLog) {
    haptics.select();
    setTodayLogs((prev) => prev.filter((e) => e.id !== entry.id));
    adjustToday(-entry.amountMl);
    void deleteWaterLog(entry.id);
  }

  const totalMl = todayLogs.reduce((sum, e) => sum + e.amountMl, 0);
  const progress = Math.min(1, totalMl / DAILY_WATER_GOAL_ML);
  const remainingMl = Math.max(0, DAILY_WATER_GOAL_ML - totalMl);

  return (
    <Screen>
      <Text className="font-display text-4xl uppercase text-foreground">
        {t("panel:water.title")}
      </Text>

      {loading ? (
        <View className="mt-6 gap-3">
          <Skeleton height={110} />
          <View className="flex-row flex-wrap gap-3">
            <Skeleton height={90} className="flex-1 basis-[47%]" />
            <Skeleton height={90} className="flex-1 basis-[47%]" />
            <Skeleton height={90} className="flex-1 basis-[47%]" />
            <Skeleton height={90} className="flex-1 basis-[47%]" />
          </View>
        </View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(280)} className="mt-6">
            <Card variant="gradient">
              <View className="flex-row items-center justify-between">
                <Text className="font-mono text-3xl text-foreground">
                  {(totalMl / 1000).toFixed(1)}
                  <Text className="font-body text-base text-muted-foreground">
                    {" "}
                    / {(DAILY_WATER_GOAL_ML / 1000).toFixed(1)} L
                  </Text>
                </Text>
                <View className="h-12 w-12 items-center justify-center rounded-tile bg-primary/15">
                  <Droplet color={Colors.primary} size={22} />
                </View>
              </View>
              <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </View>
              <Text className="mt-2 font-body text-xs text-muted-foreground">
                {remainingMl > 0
                  ? t("panel:water.remaining", { amount: (remainingMl / 1000).toFixed(1) })
                  : t("panel:water.goalReached")}
              </Text>
            </Card>
          </Animated.View>

          <View className="mt-6 flex-row flex-wrap gap-3">
            {QUICK_ADD_ML.map((amountMl, i) => (
              <View key={amountMl} className="flex-1 basis-[47%]">
                <Animated.View entering={FadeInDown.duration(280).delay(i * 40)}>
                  <Pressable
                    onPress={() => handleAdd(amountMl)}
                    disabled={addingAmount !== null}
                  >
                    <Card variant="raised" className="items-center gap-1.5 py-5">
                      <Droplet color={Colors.primary} size={22} />
                      <Text className="font-body-semibold text-sm text-foreground">
                        {t(`panel:water.quickAdd.${QUICK_ADD_KEYS[amountMl]}`)}
                      </Text>
                      <Text className="font-mono text-xs text-muted-foreground">
                        {amountMl} ml
                      </Text>
                    </Card>
                  </Pressable>
                </Animated.View>
              </View>
            ))}
          </View>

          <SectionHeader className="mt-7" title={t("panel:water.entriesLabel")} />

          {todayLogs.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={<Droplet color={Colors.mutedForeground} size={24} />}
              title={t("panel:water.emptyState")}
            />
          ) : (
            <View className="mt-3 gap-2">
              {todayLogs.map((entry) => (
                <Card key={entry.id} className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-8 w-8 items-center justify-center rounded-tile bg-surface-overlay">
                      <Droplet color={Colors.mutedForeground} size={14} />
                    </View>
                    <View>
                      <Text className="font-body-semibold text-sm text-foreground">
                        {entry.amountMl} ml
                      </Text>
                      <Text className="font-mono text-xs text-muted-foreground">
                        {new Date(entry.loggedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
              ))}
            </View>
          )}

          <SectionHeader className="mt-7" title={t("panel:water.weeklyLabel")} />
          <Card className="mt-3">
            <BarChart data={weekTotals} />
          </Card>
        </>
      )}
    </Screen>
  );
}
