import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { Plus, Scale, TrendingDown, TrendingUp, X } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, type LineDatum } from "@/components/ui/line-chart";
import { PressableScale } from "@/components/ui/pressable-scale";
import { LogWeightModal } from "@/components/weight/log-weight-modal";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import {
  addWeightLog,
  deleteWeightLog,
  getWeightSummary,
  listRecentLogs,
  listWeeklyAverages,
  type WeightLog,
  type WeightSummary,
} from "@/lib/weight";

type Goal = "bulk" | "cut" | "maintain" | "recomp" | null;

function trendTone(goal: Goal, trendKg: number | null): "success" | "warning" | "neutral" {
  if (trendKg === null || Math.abs(trendKg) < 0.1) return "neutral";
  if (goal === "bulk") return trendKg > 0 ? "success" : "warning";
  if (goal === "cut") return trendKg < 0 ? "success" : "warning";
  return "neutral";
}

const toneColor = {
  success: Colors.success,
  warning: Colors.warning,
  neutral: Colors.mutedForeground,
};

export default function KiloScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const userId = useAuthStore((state) => state.session?.user.id);

  const [summary, setSummary] = useState<WeightSummary | null>(null);
  const [weeklyAverages, setWeeklyAverages] = useState<LineDatum[]>([]);
  const [recentLogs, setRecentLogs] = useState<WeightLog[]>([]);
  const [goal, setGoal] = useState<Goal>(null);
  const [loading, setLoading] = useState(true);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      getWeightSummary(userId).catch(() => ({
        currentAverage: null,
        previousAverage: null,
        trendKg: null,
      })),
      listWeeklyAverages(userId).catch(() => []),
      listRecentLogs(userId).catch(() => []),
      supabase.from("profiles").select("goal").eq("id", userId).maybeSingle(),
    ])
      .then(([weightSummary, weekly, recent, profileResult]) => {
        setSummary(weightSummary);
        setWeeklyAverages(weekly);
        setRecentLogs(recent);
        setGoal((profileResult.data?.goal as Goal) ?? null);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSave(weightKg: number) {
    if (!userId || saving) return;
    setSaving(true);
    try {
      const entry = await addWeightLog(userId, weightKg);
      setRecentLogs((prev) => [entry, ...prev].slice(0, 10));
      const [nextSummary, nextWeekly] = await Promise.all([
        getWeightSummary(userId),
        listWeeklyAverages(userId),
      ]);
      setSummary(nextSummary);
      setWeeklyAverages(nextWeekly);
      haptics.success();
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(entry: WeightLog) {
    haptics.select();
    setRecentLogs((prev) => prev.filter((e) => e.id !== entry.id));
    void deleteWeightLog(entry.id).then(() => {
      if (!userId) return;
      Promise.all([getWeightSummary(userId), listWeeklyAverages(userId)]).then(
        ([nextSummary, nextWeekly]) => {
          setSummary(nextSummary);
          setWeeklyAverages(nextWeekly);
        },
      );
    });
  }

  const tone = summary ? trendTone(goal, summary.trendKg) : "neutral";
  const ToneIcon = summary?.trendKg !== null && (summary?.trendKg ?? 0) < 0 ? TrendingDown : TrendingUp;
  const startingWeight = recentLogs[0]?.weightKg ?? summary?.currentAverage ?? 70;

  return (
    <Screen>
      <Text className="pt-1 font-display text-4xl uppercase text-foreground">
        {t("panel:weight.title")}
      </Text>

      {loading ? (
        <View className="mt-6 gap-3">
          <Skeleton height={110} />
          <Skeleton height={140} />
        </View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(280)} className="mt-6">
            <Card variant="gradient">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-body-medium text-xs text-muted-foreground">
                    {t("panel:weight.averageLabel")}
                  </Text>
                  <Text className="mt-1 font-mono text-3xl text-foreground">
                    {summary?.currentAverage !== null && summary?.currentAverage !== undefined
                      ? summary.currentAverage.toFixed(1)
                      : "—"}
                    <Text className="font-body text-base text-muted-foreground"> kg</Text>
                  </Text>
                </View>
                <View className="h-12 w-12 items-center justify-center rounded-tile bg-primary/15">
                  <Scale color={Colors.primary} size={22} />
                </View>
              </View>
              <View className="mt-3 flex-row items-center gap-1.5">
                {summary?.trendKg !== null && summary?.trendKg !== undefined ? (
                  Math.abs(summary.trendKg) < 0.1 ? (
                    <Text className="font-body text-xs text-muted-foreground">
                      {t("panel:weight.trendFlat")}
                    </Text>
                  ) : (
                    <>
                      <ToneIcon color={toneColor[tone]} size={13} />
                      <Text className="font-body text-xs" style={{ color: toneColor[tone] }}>
                        {t(
                          summary.trendKg > 0
                            ? "panel:weight.trendUp"
                            : "panel:weight.trendDown",
                          { amount: Math.abs(summary.trendKg).toFixed(1) },
                        )}
                      </Text>
                    </>
                  )
                ) : (
                  <Text className="font-body text-xs text-muted-foreground">
                    {t("panel:weight.noTrend")}
                  </Text>
                )}
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(280).delay(40)} className="mt-3">
            <PressableScale
              onPress={() => {
                haptics.select();
                setLogModalVisible(true);
              }}
            >
              <Card variant="raised" className="flex-row items-center justify-center gap-2 py-4">
                <Plus color={Colors.primary} size={18} />
                <Text className="font-body-semibold text-sm text-foreground">
                  {t("panel:weight.logButton")}
                </Text>
              </Card>
            </PressableScale>
          </Animated.View>

          <SectionHeader className="mt-7" title={t("panel:weight.weeklyLabel")} />
          <Card className="mt-3">
            <LineChart data={weeklyAverages} />
          </Card>

          <SectionHeader className="mt-7" title={t("panel:weight.recentLabel")} />

          {recentLogs.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={<Scale color={Colors.mutedForeground} size={24} />}
              title={t("panel:weight.emptyState")}
              description={t("panel:weight.emptyStateDescription")}
            />
          ) : (
            <View className="mt-3 gap-2">
              {recentLogs.map((entry, i) => (
                <Animated.View
                  key={entry.id}
                  entering={FadeInDown.duration(240).delay(Math.min(i, 8) * 30)}
                  layout={LinearTransition.duration(200)}
                >
                  <Card className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-8 w-8 items-center justify-center rounded-tile bg-primary/15">
                        <Scale color={Colors.primary} size={14} />
                      </View>
                      <View>
                        <Text className="font-mono text-sm text-foreground">
                          {entry.weightKg} kg
                        </Text>
                        <Text className="font-body text-xs text-muted-foreground">
                          {new Date(entry.loggedAt).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "2-digit",
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
                </Animated.View>
              ))}
            </View>
          )}
        </>
      )}

      <LogWeightModal
        visible={logModalVisible}
        startingWeightKg={startingWeight}
        onClose={() => setLogModalVisible(false)}
        onSave={handleSave}
      />
    </Screen>
  );
}
