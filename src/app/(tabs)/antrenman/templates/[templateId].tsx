import { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Dumbbell } from "lucide-react-native";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { useAuthStore } from "@/store/auth.store";
import { MAX_SAVED_WORKOUTS, countUserWorkouts } from "@/lib/workouts";
import { labelFor } from "@/lib/profile-schema";
import {
  applyTemplate,
  getTemplate,
  templateDescription,
  templateGoalOptions,
  templateName,
  type WorkoutTemplateExercise,
} from "@/lib/workout-templates";

interface TemplateDetail {
  slug: string;
  goal: string;
}

export default function WorkoutTemplateDetailScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const userId = useAuthStore((state) => state.session?.user.id);
  const insets = useSafeAreaInsets();

  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [exercises, setExercises] = useState<WorkoutTemplateExercise[]>([]);
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getTemplate(templateId)
      .then(({ template, exercises }) => {
        setTemplate(template);
        setExercises(exercises);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [templateId]);

  async function handleUseTemplate() {
    if (!userId || applying) return;
    const count = await countUserWorkouts(userId);
    if (count >= MAX_SAVED_WORKOUTS) {
      haptics.error();
      Alert.alert(
        t("panel:workout.workouts.limitTitle"),
        t("panel:workout.workouts.limitMessage", { max: MAX_SAVED_WORKOUTS }),
      );
      return;
    }
    setApplying(true);
    const newWorkoutId = await applyTemplate(templateId, userId, t);
    setApplying(false);
    haptics.success();
    router.replace(`/(tabs)/antrenman/builder/${newWorkoutId}`);
  }

  if (loading) {
    return (
      <View className="flex-1 gap-3 bg-background px-5" style={{ paddingTop: insets.top + 20 }}>
        <Skeleton height={36} />
        <Skeleton height={120} />
      </View>
    );
  }

  if (notFound || !template) {
    return (
      <Screen>
        <BackButton fallbackHref="/(tabs)/antrenman/templates" />
        <EmptyState
          className="mt-6"
          icon={<Dumbbell color={Colors.mutedForeground} size={24} />}
          title={t("panel:workout.templates.noResults")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <BackButton fallbackHref="/(tabs)/antrenman/templates" />

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="flex-1 font-display text-3xl uppercase text-foreground">
          {templateName(template.slug, t)}
        </Text>
        <Badge label={labelFor(templateGoalOptions, template.goal, t)} tone="primary" />
      </View>

      <Text className="mt-2 font-body text-sm text-muted-foreground">
        {templateDescription(template.slug, t)}
      </Text>

      <Text className="mt-7 font-body-semibold text-base text-foreground">
        {t("panel:workout.builder.exercisesLabel")}
      </Text>

      <View className="mt-3 gap-2">
        {exercises.map((exercise, index) => (
          <Animated.View key={exercise.exerciseId} entering={FadeInDown.duration(240).delay(index * 40)}>
            <Card className="flex-row items-center gap-3 py-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                <Text className="font-mono text-xs text-primary">{index + 1}</Text>
              </View>
              <Text className="flex-1 font-body-semibold text-sm text-foreground">
                {exercise.name}
              </Text>
            </Card>
          </Animated.View>
        ))}
      </View>

      <View className="mt-6">
        <Button
          variant="primary"
          size="lg"
          loading={applying}
          icon={<Dumbbell color={Colors.primaryForeground} size={18} />}
          onPress={handleUseTemplate}
        >
          {t("panel:workout.templates.useTemplateButton")}
        </Button>
      </View>
    </Screen>
  );
}
