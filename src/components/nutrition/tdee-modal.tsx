import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Minus, Plus, RotateCcw, X } from "lucide-react-native";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OptionButton } from "@/components/ui/option-button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Colors } from "@/constants/colors";
import { cn } from "@/lib/cn";
import { haptics } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";
import { activityOptions, goalOptions } from "@/lib/profile-schema";
import {
  ADJUSTMENT_LIMIT,
  ADJUSTMENT_STEP,
  clampAdjustment,
  explainTargets,
  getTargetProfile,
  type TargetProfile,
} from "@/lib/nutrition-targets";
import {
  MeasurementsSheet,
  type MeasurementPatch,
} from "@/components/nutrition/measurements-sheet";

interface TdeeModalProps {
  visible: boolean;
  userId: string | undefined;
  onClose: () => void;
  /** Fires when anything behind the target changed, so the caller can refresh it. */
  onProfileChanged: () => void;
}

/**
 * The categorical data-viz series in their fixed order — protein, carbs, fat.
 * Not the semantic colors (success, warning, danger), which mean something
 * else everywhere else in the app.
 */
const MACRO_SHADES = [Colors.chart, Colors.chartAlt, Colors.chartTertiary];

/** One line of the calculation: a label, the value, and what produced it. */
function Step({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <View className="flex-row items-baseline justify-between gap-3 py-2">
      <View className="flex-1">
        <Text className="font-body text-sm text-muted-foreground">{label}</Text>
        {hint && (
          <Text className="mt-0.5 font-mono text-[10px] text-muted-foreground">{hint}</Text>
        )}
      </View>
      <Text className={cn("font-mono text-base", accent ? "text-primary" : "text-foreground")}>
        {value}
      </Text>
    </View>
  );
}

function NudgeButton({
  direction,
  disabled,
  onPress,
}: {
  direction: "up" | "down";
  disabled: boolean;
  onPress: () => void;
}) {
  const Icon = direction === "up" ? Plus : Minus;
  return (
    // The write path already fires its own select haptic.
    <PressableScale disabled={disabled} haptic={false} onPress={onPress}>
      <View
        className={cn(
          "h-11 w-11 items-center justify-center rounded-full border border-border-strong bg-surface-raised",
          disabled && "opacity-35",
        )}
      >
        <Icon color={Colors.foreground} size={18} />
      </View>
    </PressableScale>
  );
}

export function TdeeModal({ visible, userId, onClose, onProfileChanged }: TdeeModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible && (
        <TdeeContent userId={userId} onClose={onClose} onProfileChanged={onProfileChanged} />
      )}
    </Modal>
  );
}

function TdeeContent({ userId, onClose, onProfileChanged }: Omit<TdeeModalProps, "visible">) {
  const { t } = useTranslation(["panel", "onboarding", "common"]);
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<TargetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingMeasurements, setEditingMeasurements] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getTargetProfile(userId)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  // Recomputed locally on every change, so the numbers move as you tap rather
  // than after a round trip.
  const breakdown = profile ? explainTargets(profile) : null;

  function patchProfile(patch: Partial<TargetProfile>) {
    if (!userId || !profile) return;
    haptics.select();
    const previous = profile;
    setProfile({ ...profile, ...patch });

    supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .then(({ error }) => {
        if (error) {
          setProfile(previous);
          haptics.error();
          return;
        }
        onProfileChanged();
      });
  }

  function nudge(delta: number) {
    if (!breakdown) return;
    const next = clampAdjustment(breakdown.adjustment + delta);
    if (next === breakdown.adjustment) return;
    patchProfile({ calorie_adjustment: next });
  }

  function applyMeasurements(patch: MeasurementPatch) {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    onProfileChanged();
  }

  const adjustment = breakdown?.adjustment ?? 0;
  const signedAdjustment = `${adjustment > 0 ? "+" : ""}${adjustment}`;

  const macros = breakdown
    ? [
        { label: t("panel:nutrition.proteinLabel"), grams: breakdown.proteinG, kcal: breakdown.proteinG * 4 },
        { label: t("panel:nutrition.carbsLabel"), grams: breakdown.carbsG, kcal: breakdown.carbsG * 4 },
        { label: t("panel:nutrition.fatLabel"), grams: breakdown.fatG, kcal: breakdown.fatG * 9 },
      ]
    : [];
  const macroKcal = macros.reduce((sum, m) => sum + m.kcal, 0) || 1;

  return (
    <View className="flex-1 bg-background">
      <AmbientBackground />
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-display text-3xl uppercase text-foreground">
              {t("panel:nutrition.tdee.title")}
            </Text>
            <Text className="mt-1.5 font-body text-sm text-muted-foreground">
              {t("panel:nutrition.tdee.subtitle")}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
          >
            <X color={Colors.foreground} size={18} />
          </Pressable>
        </View>

        {loading || !breakdown ? (
          <View className="mt-7 gap-3">
            <Skeleton height={200} />
            <Skeleton height={140} />
          </View>
        ) : (
          <>
            <Card variant="gradient" className="mt-7 items-center">
              <Text className="font-body-medium text-sm text-muted-foreground">
                {t("panel:nutrition.tdee.targetLabel")}
              </Text>
              <View className="mt-1.5 flex-row items-baseline gap-2">
                <Text className="font-mono text-5xl text-primary">
                  {breakdown.calories.toLocaleString()}
                </Text>
                <Text className="font-body-medium text-base text-muted-foreground">kcal</Text>
              </View>

              <View className="mt-6 w-full flex-row items-center justify-between rounded-full border border-border bg-background/50 p-1.5">
                <NudgeButton
                  direction="down"
                  disabled={adjustment <= -ADJUSTMENT_LIMIT}
                  onPress={() => nudge(-ADJUSTMENT_STEP)}
                />
                <View className="items-center">
                  <Text className="font-body-medium text-xs text-muted-foreground">
                    {t("panel:nutrition.tdee.adjustLabel")}
                  </Text>
                  <Text
                    className={cn(
                      "mt-0.5 font-mono text-sm",
                      adjustment === 0 ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {signedAdjustment} kcal
                  </Text>
                </View>
                <NudgeButton
                  direction="up"
                  disabled={adjustment >= ADJUSTMENT_LIMIT}
                  onPress={() => nudge(ADJUSTMENT_STEP)}
                />
              </View>

              {adjustment !== 0 && (
                <Pressable
                  onPress={() => patchProfile({ calorie_adjustment: 0 })}
                  hitSlop={8}
                  className="mt-4 flex-row items-center gap-1.5"
                >
                  <RotateCcw color={Colors.mutedForeground} size={13} />
                  <Text className="font-body-medium text-xs text-muted-foreground">
                    {t("panel:nutrition.tdee.adjustReset")}
                  </Text>
                </Pressable>
              )}
            </Card>

            <Text className="mt-3 px-1 font-body text-xs text-muted-foreground">
              {t("panel:nutrition.tdee.adjustHint")}
            </Text>

            {breakdown.isFallback ? (
              <Card variant="raised" className="mt-7 gap-4">
                <Text className="font-body text-sm text-warning">
                  {t("panel:nutrition.tdee.missingProfile")}
                </Text>
                <Button
                  variant="outline"
                  size="md"
                  onPress={() => setEditingMeasurements(true)}
                >
                  {t("panel:nutrition.tdee.addMeasurements")}
                </Button>
              </Card>
            ) : (
              <>
                <SectionHeader
                  className="mt-8"
                  title={t("panel:nutrition.tdee.breakdownLabel")}
                />
                <Card className="mt-3">
                  <Step
                    label={t("panel:nutrition.tdee.bmrLabel")}
                    value={`${breakdown.bmr?.toLocaleString()} kcal`}
                  />
                  <Step
                    label={t("panel:nutrition.tdee.maintenanceLabel")}
                    hint={`BMR × ${breakdown.activityFactor}`}
                    value={`${breakdown.maintenance?.toLocaleString()} kcal`}
                  />
                  <Step
                    label={t("panel:nutrition.tdee.goalLabel")}
                    hint={`TDEE × ${breakdown.goalFactor}`}
                    value={`${breakdown.baseCalories.toLocaleString()} kcal`}
                  />
                  {adjustment !== 0 && (
                    <Step
                      label={t("panel:nutrition.tdee.adjustRowLabel")}
                      value={`${signedAdjustment} kcal`}
                      accent
                    />
                  )}
                </Card>

                <SectionHeader
                  className="mt-8"
                  title={t("panel:nutrition.tdee.measurementsLabel")}
                  actionLabel={t("panel:nutrition.tdee.recalculate")}
                  onAction={() => {
                    haptics.select();
                    setEditingMeasurements(true);
                  }}
                />
                <Card className="mt-3 flex-row">
                  {[
                    { label: t("onboarding:labels.weight"), value: profile?.weight_kg, unit: "kg" },
                    { label: t("onboarding:labels.height"), value: profile?.height_cm, unit: "cm" },
                    { label: t("onboarding:labels.age"), value: profile?.age, unit: "" },
                  ].map((item) => (
                    <View key={item.label} className="flex-1 gap-1">
                      <Text className="font-body-medium text-xs text-muted-foreground">
                        {item.label}
                      </Text>
                      <View className="flex-row items-baseline gap-1">
                        <Text className="font-mono text-xl text-foreground">{item.value}</Text>
                        {item.unit !== "" && (
                          <Text className="font-mono text-xs text-muted-foreground">
                            {item.unit}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </Card>
              </>
            )}

            <SectionHeader className="mt-8" title={t("panel:nutrition.tdee.activityLabel")} />
            <View className="mt-3 flex-row flex-wrap gap-2.5">
              {activityOptions.map((opt) => (
                <View key={opt.value} style={{ width: "47.5%" }}>
                  <OptionButton
                    label={t(opt.labelKey)}
                    selected={profile?.activity_level === opt.value}
                    onPress={() => patchProfile({ activity_level: opt.value })}
                  />
                </View>
              ))}
            </View>

            <SectionHeader className="mt-8" title={t("panel:nutrition.tdee.goalLabel")} />
            <View className="mt-3 flex-row flex-wrap gap-2.5">
              {goalOptions.map((opt) => (
                <View key={opt.value} style={{ width: "47.5%" }}>
                  <OptionButton
                    label={t(opt.labelKey)}
                    selected={profile?.goal === opt.value}
                    onPress={() => patchProfile({ goal: opt.value })}
                  />
                </View>
              ))}
            </View>

            <SectionHeader className="mt-8" title={t("panel:nutrition.tdee.macrosLabel")} />
            <Card className="mt-3">
              <View className="h-2.5 flex-row gap-1">
                {macros.map((macro, i) => (
                  <View
                    key={macro.label}
                    className="rounded-full"
                    style={{ flex: macro.kcal, backgroundColor: MACRO_SHADES[i] }}
                  />
                ))}
              </View>
              <View className="mt-4 flex-row">
                {macros.map((macro, i) => (
                  <View key={macro.label} className="flex-1 gap-1.5">
                    <View className="flex-row items-center gap-1.5">
                      <View
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: MACRO_SHADES[i] }}
                      />
                      <Text className="font-body-medium text-xs text-muted-foreground">
                        {macro.label}
                      </Text>
                    </View>
                    <View className="flex-row items-baseline gap-1">
                      <Text className="font-mono text-xl text-foreground">{macro.grams}</Text>
                      <Text className="font-mono text-xs text-muted-foreground">g</Text>
                    </View>
                    <Text className="font-mono text-[10px] text-muted-foreground">
                      {Math.round((macro.kcal / macroKcal) * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
            <Text className="mt-3 px-1 font-body text-xs text-muted-foreground">
              {t("panel:nutrition.tdee.macrosRule", { perKg: breakdown.proteinPerKg })}
            </Text>

            <Text className="mt-7 font-body text-xs text-muted-foreground">
              {t("panel:nutrition.tdee.footnote")}
            </Text>
          </>
        )}
      </ScrollView>

      <MeasurementsSheet
        visible={editingMeasurements}
        userId={userId}
        profile={profile}
        onClose={() => setEditingMeasurements(false)}
        onSaved={applyMeasurements}
      />
    </View>
  );
}
