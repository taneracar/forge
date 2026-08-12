import { View, Text } from "react-native";
import Svg, { Polyline, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Colors } from "@/constants/colors";
import { cn } from "@/lib/cn";
import type { DailyTotals } from "@/lib/nutrition";
import type { NutritionTargets } from "@/lib/nutrition-targets";

// A wide, shallow arc: a circle of radius 169 centred well below the frame,
// so only a 64° sliver shows. Spans x 10→190 with a 26-unit rise, which
// renders about 5:1 — slim enough to sit under the headline number without
// crowding it.
const CENTER_X = 100;
const CENTER_Y = 174.8;
const RADIUS = 168.8;
const START_ANGLE = 122.2;
const SWEEP = 64.4;
const SEGMENTS = 48;

function arcPoints(fraction: number): string {
  const clamped = Math.max(0, Math.min(1, fraction));
  if (clamped === 0) return "";
  const steps = Math.max(2, Math.round(SEGMENTS * clamped));
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = START_ANGLE - SWEEP * clamped * (i / steps);
    const rad = (angle * Math.PI) / 180;
    points.push(
      `${(CENTER_X + RADIUS * Math.cos(rad)).toFixed(2)},${(
        CENTER_Y -
        RADIUS * Math.sin(rad)
      ).toFixed(2)}`,
    );
  }
  return points.join(" ");
}

interface MacroBarProps {
  label: string;
  value: number;
  target: number;
  color: string;
}

function MacroBar({ label, value, target, color }: MacroBarProps) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <View className="flex-1 gap-1.5">
      <Text className="font-body-medium text-xs text-muted-foreground">{label}</Text>
      <Text className="font-mono text-sm text-foreground">
        {Math.round(value)}
        <Text className="text-muted-foreground"> / {target} g</Text>
      </Text>
      <View className="h-1.5 overflow-hidden rounded-full bg-surface-overlay">
        <View
          style={{ width: `${pct * 100}%`, backgroundColor: color }}
          className="h-full rounded-full"
        />
      </View>
    </View>
  );
}

interface CalorieSummaryProps {
  totals: DailyTotals;
  targets: NutritionTargets;
}

export function CalorieSummary({ totals, targets }: CalorieSummaryProps) {
  const { t } = useTranslation("panel");
  const fraction = targets.calories > 0 ? totals.calories / targets.calories : 0;
  const over = totals.calories > targets.calories;
  const remaining = Math.max(0, targets.calories - totals.calories);

  return (
    <Card variant="gradient">
      <Text className="text-center font-mono text-4xl text-foreground">
        {totals.calories.toLocaleString()}
        <Text className="text-xl text-muted-foreground">
          {" "}
          / {targets.calories.toLocaleString()}
        </Text>
      </Text>
      <Text className="mt-1 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        kcal
      </Text>

      <View style={{ width: "100%", height: 70 }} className="mt-2">
        <Svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="xMidYMid meet">
          <Defs>
            <LinearGradient id="calorieArc" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={Colors.primary} />
              <Stop offset="1" stopColor={Colors.primaryGlow} />
            </LinearGradient>
          </Defs>
          <Polyline
            points={arcPoints(1)}
            fill="none"
            stroke={Colors.surfaceOverlay}
            strokeWidth={7}
            strokeLinecap="round"
          />
          {fraction > 0 && (
            <Polyline
              points={arcPoints(fraction)}
              fill="none"
              stroke="url(#calorieArc)"
              strokeWidth={7}
              strokeLinecap="round"
            />
          )}
        </Svg>
      </View>

      <Text
        className={cn(
          "text-center font-body text-xs",
          over ? "text-warning" : "text-muted-foreground",
        )}
      >
        {over
          ? t("nutrition.overBy", {
              value: (totals.calories - targets.calories).toLocaleString(),
            })
          : t("nutrition.remaining", { value: remaining.toLocaleString() })}
      </Text>

      <View className="mt-5 flex-row gap-4">
        <MacroBar
          label={t("nutrition.proteinLabel")}
          value={totals.proteinG}
          target={targets.proteinG}
          color={Colors.chartAlt}
        />
        <MacroBar
          label={t("nutrition.carbsLabel")}
          value={totals.carbsG}
          target={targets.carbsG}
          color={Colors.warning}
        />
        <MacroBar
          label={t("nutrition.fatLabel")}
          value={totals.fatG}
          target={targets.fatG}
          color={Colors.success}
        />
      </View>
    </Card>
  );
}
