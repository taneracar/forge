import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { Plus, Utensils, X } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { totalsFor, type MealLog, type MealType } from "@/lib/nutrition";

/** Icon-badge accent per meal type — reuses existing palette tokens. */
const MEAL_COLOR: Record<MealType, string> = {
  breakfast: Colors.chartAlt,
  lunch: Colors.primary,
  dinner: Colors.warning,
  snack: Colors.success,
};

interface MealSectionProps {
  mealType: MealType;
  logs: MealLog[];
  /** False on any day but today — meals are only ever logged as you eat them. */
  canAdd: boolean;
  onAdd: (mealType: MealType) => void;
  onDelete: (entry: MealLog) => void;
}

export function MealSection({ mealType, logs, canAdd, onAdd, onDelete }: MealSectionProps) {
  const { t } = useTranslation("panel");
  const totals = totalsFor(logs);
  const accent = MEAL_COLOR[mealType];

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <View
          className="h-9 w-9 items-center justify-center rounded-tile"
          style={{ backgroundColor: `${accent}26` }}
        >
          <Utensils color={accent} size={16} />
        </View>
        <View className="flex-1">
          <Text className="font-body-semibold text-base text-foreground">
            {t(`nutrition.mealTypes.${mealType}`)}
          </Text>
          <Text className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {totals.calories} kcal · {Math.round(totals.proteinG)}P ·{" "}
            {Math.round(totals.carbsG)}C · {Math.round(totals.fatG)}F
          </Text>
        </View>
      </View>

      {logs.length > 0 && (
        <View className="gap-1">
          {logs.map((entry, i) => (
            <Animated.View
              key={entry.id}
              entering={FadeInDown.duration(220).delay(Math.min(i, 6) * 30)}
              layout={LinearTransition.duration(200)}
            >
              <View className="flex-row items-center gap-2 border-t border-border pt-2">
                <Text
                  numberOfLines={1}
                  className="flex-1 font-body text-sm text-foreground"
                >
                  {entry.name}
                </Text>
                <Text className="font-mono text-xs text-muted-foreground">
                  {entry.calories} kcal
                </Text>
                <Pressable
                  onPress={() => onDelete(entry)}
                  hitSlop={8}
                  className="h-7 w-7 items-center justify-center rounded-tile active:bg-surface-overlay"
                >
                  <X color={Colors.muted} size={14} />
                </Pressable>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      {canAdd && (
        <Pressable
          onPress={() => {
            haptics.select();
            onAdd(mealType);
          }}
          className="items-center justify-center rounded-tile bg-surface-overlay py-3 active:opacity-70"
        >
          <Plus color={Colors.primary} size={18} />
        </Pressable>
      )}
    </Card>
  );
}
