import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionButton } from "@/components/ui/option-button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Stepper } from "@/components/ui/stepper";
import { cn } from "@/lib/cn";
import { haptics } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import {
  editableProfileSchema,
  genderOptions,
  goalOptions,
  activityOptions,
  experienceOptions,
  type EditableProfileValues,
} from "@/lib/profile-schema";

const trainingDays = [1, 2, 3, 4, 5, 6, 7];

export default function EditProfileScreen() {
  const { t } = useTranslation(["panel", "onboarding", "common"]);
  const userId = useAuthStore((state) => state.session?.user.id);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditableProfileValues>({ resolver: zodResolver(editableProfileSchema) });

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("age, gender, height_cm, weight_kg, goal, activity_level, workout_experience, preferred_training_days")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) reset(data);
        setLoading(false);
      });
  }, [userId, reset]);

  async function onSubmit(values: EditableProfileValues) {
    if (!userId) return;
    setSubmitError(null);
    const { error } = await supabase.from("profiles").update(values).eq("id", userId);
    if (error) {
      haptics.error();
      setSubmitError(t("onboarding:errors.saveFailed"));
      return;
    }
    haptics.success();
    router.back();
  }

  if (loading) {
    return (
      <Screen>
        <View className="flex-row items-center gap-2">
          <BackButton fallbackHref="/(tabs)/profil" />
          <Text className="flex-1 font-display text-2xl uppercase text-foreground">
            {t("panel:profile.edit.title")}
          </Text>
        </View>
        <View className="mt-6 gap-3">
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center gap-2">
        <BackButton fallbackHref="/(tabs)/profil" />
        <Text className="flex-1 font-display text-2xl uppercase text-foreground">
          {t("panel:profile.edit.title")}
        </Text>
      </View>

      <View className="mt-6 gap-6">
        <View className="gap-1.5">
          <Text className="font-body-medium text-xs text-muted-foreground">
            {t("onboarding:labels.gender")}
          </Text>
          <View className="flex-row gap-2">
            {genderOptions.map((opt) => (
              <View key={opt.value} className="flex-1">
                <OptionButton
                  label={t(opt.labelKey)}
                  selected={watch("gender") === opt.value}
                  onPress={() => setValue("gender", opt.value, { shouldValidate: true })}
                />
              </View>
            ))}
          </View>
          {errors.gender && (
            <Text className="font-body text-xs text-danger">{t(errors.gender.message ?? "")}</Text>
          )}
        </View>

        <Controller
          control={control}
          name="age"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t("onboarding:labels.age")}
              keyboardType="numeric"
              onChangeText={(text) => onChange(text === "" ? undefined : Number(text))}
              onBlur={onBlur}
              value={value?.toString() ?? ""}
              error={errors.age ? t(errors.age.message ?? "") : undefined}
            />
          )}
        />

        <View className="gap-1.5">
          <Text className="font-body-medium text-xs text-muted-foreground">
            {t("onboarding:labels.height")}
          </Text>
          <View className="flex-row items-center gap-3">
            <Controller
              control={control}
              name="height_cm"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-1">
                  <Input
                    keyboardType="numeric"
                    onChangeText={(text) => onChange(text === "" ? undefined : Number(text))}
                    onBlur={onBlur}
                    value={value?.toString() ?? ""}
                  />
                </View>
              )}
            />
            <Stepper
              value={watch("height_cm")}
              step={1}
              fallback={170}
              onChange={(v) => setValue("height_cm", v, { shouldValidate: true })}
            />
          </View>
          {errors.height_cm && (
            <Text className="font-body text-xs text-danger">{t(errors.height_cm.message ?? "")}</Text>
          )}
        </View>

        <View className="gap-1.5">
          <Text className="font-body-medium text-xs text-muted-foreground">
            {t("onboarding:labels.weight")}
          </Text>
          <View className="flex-row items-center gap-3">
            <Controller
              control={control}
              name="weight_kg"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-1">
                  <Input
                    keyboardType="numeric"
                    onChangeText={(text) => onChange(text === "" ? undefined : Number(text))}
                    onBlur={onBlur}
                    value={value?.toString() ?? ""}
                  />
                </View>
              )}
            />
            <Stepper
              value={watch("weight_kg")}
              step={0.5}
              fallback={70}
              onChange={(v) => setValue("weight_kg", v, { shouldValidate: true })}
            />
          </View>
          {errors.weight_kg && (
            <Text className="font-body text-xs text-danger">{t(errors.weight_kg.message ?? "")}</Text>
          )}
        </View>

        <View className="gap-1.5">
          <Text className="font-body-medium text-xs text-muted-foreground">
            {t("onboarding:labels.goal")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {goalOptions.map((opt) => (
              <View key={opt.value} style={{ width: "48%" }}>
                <OptionButton
                  label={t(opt.labelKey)}
                  selected={watch("goal") === opt.value}
                  onPress={() => setValue("goal", opt.value, { shouldValidate: true })}
                />
              </View>
            ))}
          </View>
          {errors.goal && (
            <Text className="font-body text-xs text-danger">{t(errors.goal.message ?? "")}</Text>
          )}
        </View>

        <View className="gap-1.5">
          <Text className="font-body-medium text-xs text-muted-foreground">
            {t("onboarding:labels.activityLevel")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {activityOptions.map((opt) => (
              <View key={opt.value} style={{ width: "48%" }}>
                <OptionButton
                  label={t(opt.labelKey)}
                  selected={watch("activity_level") === opt.value}
                  onPress={() => setValue("activity_level", opt.value, { shouldValidate: true })}
                />
              </View>
            ))}
          </View>
          {errors.activity_level && (
            <Text className="font-body text-xs text-danger">
              {t(errors.activity_level.message ?? "")}
            </Text>
          )}
        </View>

        <View className="gap-1.5">
          <Text className="font-body-medium text-xs text-muted-foreground">
            {t("onboarding:labels.experience")}
          </Text>
          <View className="gap-2">
            {experienceOptions.map((opt) => (
              <OptionButton
                key={opt.value}
                label={t(opt.labelKey)}
                selected={watch("workout_experience") === opt.value}
                onPress={() => setValue("workout_experience", opt.value, { shouldValidate: true })}
              />
            ))}
          </View>
          {errors.workout_experience && (
            <Text className="font-body text-xs text-danger">
              {t(errors.workout_experience.message ?? "")}
            </Text>
          )}
        </View>

        <View className="gap-1.5">
          <Text className="font-body-medium text-xs text-muted-foreground">
            {t("onboarding:labels.days")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {trainingDays.map((day) => {
              const selected = watch("preferred_training_days") === day;
              return (
                <PressableScale
                  key={day}
                  onPress={() => setValue("preferred_training_days", day, { shouldValidate: true })}
                >
                  <View
                    className={cn(
                      "h-12 w-12 items-center justify-center rounded-full border",
                      selected ? "border-primary bg-primary/15" : "border-border-strong bg-surface-raised",
                    )}
                  >
                    <Text
                      className={cn(
                        "font-mono text-sm",
                        selected ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {day}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
          {errors.preferred_training_days && (
            <Text className="font-body text-xs text-danger">
              {t(errors.preferred_training_days.message ?? "")}
            </Text>
          )}
        </View>

        {submitError && <Text className="font-body text-xs text-danger">{submitError}</Text>}

        <Button
          variant="primary"
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        >
          {t("common:buttons.save")}
        </Button>
      </View>
    </Screen>
  );
}
