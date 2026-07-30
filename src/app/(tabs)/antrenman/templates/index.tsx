import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronRight, Dumbbell } from "lucide-react-native";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import {
  listTemplates,
  templateDescription,
  templateGoalOptions,
  templateName,
  type WorkoutTemplate,
} from "@/lib/workout-templates";

export default function WorkoutTemplatesScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [goal, setGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTemplates()
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const filtered = goal ? templates.filter((tpl) => tpl.goal === goal) : templates;

  return (
    <Screen>
      <BackButton fallbackHref="/(tabs)/antrenman/workouts" />
      <Text className="mt-2 font-display text-4xl uppercase text-foreground">
        {t("panel:workout.templates.title")}
      </Text>
      <Text className="mt-1 font-body text-sm text-muted-foreground">
        {t("panel:workout.templates.description")}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4"
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      >
        <Pressable
          onPress={() => {
            haptics.select();
            setGoal(null);
          }}
          className={cn(
            "h-9 justify-center rounded-full border px-3.5",
            goal === null ? "border-primary bg-primary/15" : "border-border-strong bg-surface",
          )}
        >
          <Text
            className={cn(
              "font-body-medium text-xs",
              goal === null ? "text-primary" : "text-muted-foreground",
            )}
          >
            {t("panel:workout.templates.allGoals")}
          </Text>
        </Pressable>
        {templateGoalOptions.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => {
              haptics.select();
              setGoal(opt.value);
            }}
            className={cn(
              "h-9 justify-center rounded-full border px-3.5",
              goal === opt.value
                ? "border-primary bg-primary/15"
                : "border-border-strong bg-surface",
            )}
          >
            <Text
              className={cn(
                "font-body-medium text-xs",
                goal === opt.value ? "text-primary" : "text-muted-foreground",
              )}
            >
              {t(opt.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View className="mt-5 gap-2">
          <Skeleton height={84} />
          <Skeleton height={84} />
          <Skeleton height={84} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Dumbbell color={Colors.mutedForeground} size={24} />}
          title={t("panel:workout.templates.noResults")}
        />
      ) : (
        <View className="mt-5 gap-2">
          {filtered.map((template, index) => (
            <Animated.View
              key={template.id}
              entering={FadeInDown.duration(260).delay(Math.min(index, 8) * 40)}
            >
              <Pressable
                onPress={() => {
                  haptics.select();
                  router.push(`/(tabs)/antrenman/templates/${template.id}`);
                }}
              >
                <Card>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="font-body-semibold text-base text-foreground">
                        {templateName(template.slug, t)}
                      </Text>
                      <Text className="mt-1 font-body text-xs text-muted-foreground">
                        {templateDescription(template.slug, t)}
                      </Text>
                      <Text className="mt-2 font-mono text-xs text-muted-foreground">
                        {template.exerciseCount} {t("panel:dashboard.exerciseCountSuffix")}
                      </Text>
                    </View>
                    <ChevronRight color={Colors.muted} size={18} />
                  </View>
                </Card>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}
    </Screen>
  );
}
