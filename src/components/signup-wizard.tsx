import { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Check, Minus, Plus } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import {
  signupSchema,
  type SignupValues,
  genderOptions,
  goalOptions,
  activityOptions,
  experienceOptions,
} from "@/lib/profile-schema";

const stepFields = [
  ["email", "password"],
  ["name"],
  ["gender"],
  ["age"],
  ["height_cm"],
  ["weight_kg"],
  ["goal"],
  ["activity_level"],
  ["workout_experience", "preferred_training_days"],
] as const satisfies (keyof SignupValues)[][];

const stepKeys = [
  "account",
  "name",
  "gender",
  "age",
  "height",
  "weight",
  "goal",
  "activity",
  "experience",
] as const;

const trainingDays = [1, 2, 3, 4, 5, 6, 7];

const inputClass =
  "rounded-md border border-border bg-surface px-4 py-3.5 text-base text-foreground";
const labelClass = "font-mono text-xs uppercase tracking-wider text-muted-foreground";

function OptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-md border p-4",
        selected ? "border-primary bg-surface-raised" : "border-border bg-surface",
      )}
    >
      <Text
        className={cn(
          "font-body text-sm",
          selected ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Stepper({
  value,
  onChange,
  step,
  fallback,
}: {
  value: number | undefined;
  onChange: (value: number) => void;
  step: number;
  fallback: number;
}) {
  const current = value ?? fallback;
  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={() => onChange(current - step)}
        className="h-11 w-11 items-center justify-center rounded-md border border-border"
      >
        <Minus color={Colors.foreground} size={16} />
      </Pressable>
      <Pressable
        onPress={() => onChange(current + step)}
        className="h-11 w-11 items-center justify-center rounded-md border border-border"
      >
        <Plus color={Colors.foreground} size={16} />
      </Pressable>
    </View>
  );
}

export function SignupWizard() {
  const { t } = useTranslation(["onboarding", "common"]);
  const insets = useSafeAreaInsets();
  const session = useAuthStore((state) => state.session);
  const hasProfile = useAuthStore((state) => state.hasProfile);
  const setHasProfile = useAuthStore((state) => state.setHasProfile);
  const [step, setStep] = useState(() => (session && !hasProfile ? 1 : 0));
  const [checkEmail, setCheckEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  const totalSteps = stepKeys.length;
  const stepKey = stepKeys[step];
  const password = watch("password") ?? "";
  const passwordChecks = {
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const onSubmit = async (values: SignupValues) => {
    setSubmitError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitError(t("onboarding:errors.noSession"));
      return;
    }

    const { email, password, ...profileValues } = values;
    void email;
    void password;

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...profileValues });

    if (error) {
      setSubmitError(t("onboarding:errors.saveFailed"));
      return;
    }

    setHasProfile(true);
    router.replace("/(tabs)");
  };

  async function handleNext() {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;

    if (step === 0) {
      setSubmitError(null);
      const { email, password } = watch();
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setSubmitError(
          error.message.includes("already registered")
            ? t("onboarding:errors.alreadyRegistered")
            : t("onboarding:errors.signupFailed"),
        );
        return;
      }

      if (!data.session) {
        setCheckEmail(true);
        return;
      }
    }

    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Full-schema validation would require email/password, which resumed
    // users (step starting at 1) never fill in — each step already validated
    // its own fields above, so submit with the current values directly.
    await onSubmit(watch());
  }

  if (checkEmail) {
    return (
      <View
        className="flex-1 bg-background px-6"
        style={{ paddingTop: insets.top + 24 }}
      >
        <Text className="font-display text-3xl uppercase text-foreground mb-1">
          {t("onboarding:checkEmail.title")}
        </Text>
        <Text className="font-body text-muted-foreground">
          {t("onboarding:checkEmail.description")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24 }}
    >
      <View className="flex-row gap-1.5 mb-8">
        {stepKeys.map((key, i) => (
          <View
            key={key}
            className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-border")}
          />
        ))}
      </View>

      <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
        {t(`onboarding:steps.${stepKey}.eyebrow`)}
      </Text>
      <Text className="mt-3 font-display text-3xl uppercase text-foreground">
        {t(`onboarding:steps.${stepKey}.title`)}
      </Text>
      <Text className="mt-3 font-body text-muted-foreground">
        {t(`onboarding:steps.${stepKey}.description`)}
      </Text>

      <View className="mt-8 gap-6">
        {step === 0 && (
          <>
            <View className="gap-1.5">
              <Text className={labelClass}>{t("onboarding:labels.email")}</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={inputClass}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor={Colors.mutedForeground}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value ?? ""}
                  />
                )}
              />
              {errors.email && (
                <Text className="text-xs text-primary">
                  {t(errors.email.message ?? "")}
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <Text className={labelClass}>{t("onboarding:labels.password")}</Text>
              <View className="relative justify-center">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={cn(inputClass, "pr-12")}
                      secureTextEntry={!showPassword}
                      placeholderTextColor={Colors.mutedForeground}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value ?? ""}
                    />
                  )}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  className="absolute right-4"
                  hitSlop={8}
                >
                  {showPassword ? (
                    <EyeOff color={Colors.mutedForeground} size={16} />
                  ) : (
                    <Eye color={Colors.mutedForeground} size={16} />
                  )}
                </Pressable>
              </View>
              <View className="mt-1 gap-1">
                {(["length", "letter", "number"] as const).map((key) => {
                  const met = passwordChecks[key];
                  return (
                    <View key={key} className="flex-row items-center gap-1.5">
                      <Check
                        color={met ? Colors.primary : Colors.mutedForeground}
                        size={12}
                      />
                      <Text
                        className={cn(
                          "font-body text-xs",
                          met ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {t(`onboarding:passwordChecklist.${key}`)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {step === 1 && (
          <View className="gap-1.5">
            <Text className={labelClass}>{t("onboarding:labels.name")}</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={inputClass}
                  placeholderTextColor={Colors.mutedForeground}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value ?? ""}
                />
              )}
            />
            {errors.name && (
              <Text className="text-xs text-primary">
                {t(errors.name.message ?? "")}
              </Text>
            )}
          </View>
        )}

        {step === 2 && (
          <View className="gap-1.5">
            <View className="flex-row gap-2">
              {genderOptions.map((opt) => (
                <View key={opt.value} className="flex-1">
                  <OptionButton
                    label={t(opt.labelKey)}
                    selected={watch("gender") === opt.value}
                    onPress={() =>
                      setValue("gender", opt.value, { shouldValidate: true })
                    }
                  />
                </View>
              ))}
            </View>
            {errors.gender && (
              <Text className="text-xs text-primary">
                {t(errors.gender.message ?? "")}
              </Text>
            )}
          </View>
        )}

        {step === 3 && (
          <View className="gap-1.5">
            <Text className={labelClass}>{t("onboarding:labels.age")}</Text>
            <Controller
              control={control}
              name="age"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={inputClass}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.mutedForeground}
                  onChangeText={(text) =>
                    onChange(text === "" ? undefined : Number(text))
                  }
                  onBlur={onBlur}
                  value={value?.toString() ?? ""}
                />
              )}
            />
            {errors.age && (
              <Text className="text-xs text-primary">
                {t(errors.age.message ?? "")}
              </Text>
            )}
          </View>
        )}

        {step === 4 && (
          <View className="gap-1.5">
            <Text className={labelClass}>{t("onboarding:labels.height")}</Text>
            <View className="flex-row items-center gap-3">
              <Controller
                control={control}
                name="height_cm"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={cn(inputClass, "flex-1")}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.mutedForeground}
                    onChangeText={(text) =>
                      onChange(text === "" ? undefined : Number(text))
                    }
                    onBlur={onBlur}
                    value={value?.toString() ?? ""}
                  />
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
              <Text className="text-xs text-primary">
                {t(errors.height_cm.message ?? "")}
              </Text>
            )}
          </View>
        )}

        {step === 5 && (
          <View className="gap-1.5">
            <Text className={labelClass}>{t("onboarding:labels.weight")}</Text>
            <View className="flex-row items-center gap-3">
              <Controller
                control={control}
                name="weight_kg"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={cn(inputClass, "flex-1")}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.mutedForeground}
                    onChangeText={(text) =>
                      onChange(text === "" ? undefined : Number(text))
                    }
                    onBlur={onBlur}
                    value={value?.toString() ?? ""}
                  />
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
              <Text className="text-xs text-primary">
                {t(errors.weight_kg.message ?? "")}
              </Text>
            )}
          </View>
        )}

        {step === 6 && (
          <View className="gap-1.5">
            <View className="flex-row flex-wrap gap-2">
              {goalOptions.map((opt) => (
                <View key={opt.value} style={{ width: "48%" }}>
                  <OptionButton
                    label={t(opt.labelKey)}
                    selected={watch("goal") === opt.value}
                    onPress={() =>
                      setValue("goal", opt.value, { shouldValidate: true })
                    }
                  />
                </View>
              ))}
            </View>
            {errors.goal && (
              <Text className="text-xs text-primary">
                {t(errors.goal.message ?? "")}
              </Text>
            )}
          </View>
        )}

        {step === 7 && (
          <View className="gap-1.5">
            <View className="flex-row flex-wrap gap-2">
              {activityOptions.map((opt) => (
                <View key={opt.value} style={{ width: "48%" }}>
                  <OptionButton
                    label={t(opt.labelKey)}
                    selected={watch("activity_level") === opt.value}
                    onPress={() =>
                      setValue("activity_level", opt.value, {
                        shouldValidate: true,
                      })
                    }
                  />
                </View>
              ))}
            </View>
            {errors.activity_level && (
              <Text className="text-xs text-primary">
                {t(errors.activity_level.message ?? "")}
              </Text>
            )}
          </View>
        )}

        {step === 8 && (
          <>
            <View className="gap-1.5">
              <Text className={labelClass}>{t("onboarding:labels.experience")}</Text>
              <View className="gap-2">
                {experienceOptions.map((opt) => (
                  <OptionButton
                    key={opt.value}
                    label={t(opt.labelKey)}
                    selected={watch("workout_experience") === opt.value}
                    onPress={() =>
                      setValue("workout_experience", opt.value, {
                        shouldValidate: true,
                      })
                    }
                  />
                ))}
              </View>
              {errors.workout_experience && (
                <Text className="text-xs text-primary">
                  {t(errors.workout_experience.message ?? "")}
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <Text className={labelClass}>{t("onboarding:labels.days")}</Text>
              <View className="flex-row flex-wrap gap-2">
                {trainingDays.map((day) => (
                  <Pressable
                    key={day}
                    onPress={() =>
                      setValue("preferred_training_days", day, {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      "h-11 w-11 items-center justify-center rounded-md border",
                      watch("preferred_training_days") === day
                        ? "border-primary bg-surface-raised"
                        : "border-border",
                    )}
                  >
                    <Text
                      className={cn(
                        "font-mono text-sm",
                        watch("preferred_training_days") === day
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {errors.preferred_training_days && (
                <Text className="text-xs text-primary">
                  {t(errors.preferred_training_days.message ?? "")}
                </Text>
              )}
            </View>
          </>
        )}

        {submitError && <Text className="text-xs text-primary">{submitError}</Text>}

        <View className="flex-row gap-3">
          {step > (session && !hasProfile ? 1 : 0) && (
            <View className="flex-1">
              <Button variant="outline" onPress={() => setStep((s) => s - 1)}>
                {t("common:buttons.back")}
              </Button>
            </View>
          )}
          <View className="flex-1">
            <Button
              variant="primary"
              onPress={handleNext}
              disabled={isSubmitting}
            >
              {step === totalSteps - 1
                ? t("common:buttons.finish")
                : t("common:buttons.continue")}
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
