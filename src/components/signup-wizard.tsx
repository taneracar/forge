import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router, Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Eye, EyeOff, Check, Minus, Plus } from "lucide-react-native";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Screen } from "@/components/ui/screen";
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
    <PressableScale onPress={onPress}>
      <View
        className={cn(
          "rounded-tile border p-4",
          selected ? "border-primary bg-primary/15" : "border-border-strong bg-surface-raised",
        )}
      >
        <Text
          className={cn(
            "font-body-medium text-sm",
            selected ? "text-primary" : "text-foreground",
          )}
        >
          {label}
        </Text>
      </View>
    </PressableScale>
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
      <PressableScale onPress={() => onChange(current - step)}>
        <View className="h-12 w-12 items-center justify-center rounded-tile border border-border-strong bg-surface-raised">
          <Minus color={Colors.foreground} size={16} />
        </View>
      </PressableScale>
      <PressableScale onPress={() => onChange(current + step)}>
        <View className="h-12 w-12 items-center justify-center rounded-tile border border-border-strong bg-surface-raised">
          <Plus color={Colors.foreground} size={16} />
        </View>
      </PressableScale>
    </View>
  );
}

export function SignupWizard() {
  const { t } = useTranslation(["onboarding", "common"]);
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
      <Screen scroll={false}>
        <Text className="pt-1 font-display text-3xl uppercase text-foreground">
          {t("onboarding:checkEmail.title")}
        </Text>
        <Text className="mt-2 font-body text-muted-foreground">
          {t("onboarding:checkEmail.description")}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
      <View className="flex-1">
        {step === 0 && <BackButton fallbackHref="/(auth)" className="mb-2" />}

        <View className="mb-8 flex-row gap-1.5">
          {stepKeys.map((key, i) => (
            <View
              key={key}
              className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-border")}
            />
          ))}
        </View>

        {/* Centers the eyebrow/title/fields block in whatever space is left
            between the progress bar and the login prompt, instead of
            top-pinning it with a dead void below on short steps. */}
        <View className="flex-1 justify-center">
      <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
        {t(`onboarding:steps.${stepKey}.eyebrow`)}
      </Text>
      <Text className="mt-3 pt-1 font-display text-3xl uppercase text-foreground">
        {t(`onboarding:steps.${stepKey}.title`)}
      </Text>
      <Text className="mt-3 font-body text-muted-foreground">
        {t(`onboarding:steps.${stepKey}.description`)}
      </Text>

      <View className="mt-8 gap-6">
        <Animated.View key={step} entering={FadeInDown.duration(220)}>
          <View className="gap-6">
            {step === 0 && (
              <>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={t("onboarding:labels.email")}
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value ?? ""}
                      error={errors.email ? t(errors.email.message ?? "") : undefined}
                    />
                  )}
                />

                <View className="gap-1.5">
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label={t("onboarding:labels.password")}
                        secureTextEntry={!showPassword}
                        autoComplete="new-password"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value ?? ""}
                        error={errors.password ? t(errors.password.message ?? "") : undefined}
                        rightElement={
                          <Pressable
                            onPress={() => setShowPassword((v) => !v)}
                            hitSlop={8}
                          >
                            {showPassword ? (
                              <EyeOff color={Colors.mutedForeground} size={16} />
                            ) : (
                              <Eye color={Colors.mutedForeground} size={16} />
                            )}
                          </Pressable>
                        }
                      />
                    )}
                  />
                  <View className="mt-1 gap-1">
                    {(["length", "letter", "number"] as const).map((key) => {
                      const met = passwordChecks[key];
                      return (
                        <View key={key} className="flex-row items-center gap-1.5">
                          <Check
                            color={met ? Colors.success : Colors.mutedForeground}
                            size={12}
                          />
                          <Text
                            className={cn(
                              "font-body text-xs",
                              met ? "text-success" : "text-muted-foreground",
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
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t("onboarding:labels.name")}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value ?? ""}
                    error={errors.name ? t(errors.name.message ?? "") : undefined}
                  />
                )}
              />
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
                  <Text className="font-body text-xs text-danger">
                    {t(errors.gender.message ?? "")}
                  </Text>
                )}
              </View>
            )}

            {step === 3 && (
              <Controller
                control={control}
                name="age"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t("onboarding:labels.age")}
                    keyboardType="numeric"
                    onChangeText={(text) =>
                      onChange(text === "" ? undefined : Number(text))
                    }
                    onBlur={onBlur}
                    value={value?.toString() ?? ""}
                    error={errors.age ? t(errors.age.message ?? "") : undefined}
                  />
                )}
              />
            )}

            {step === 4 && (
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
                          onChangeText={(text) =>
                            onChange(text === "" ? undefined : Number(text))
                          }
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
                  <Text className="font-body text-xs text-danger">
                    {t(errors.height_cm.message ?? "")}
                  </Text>
                )}
              </View>
            )}

            {step === 5 && (
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
                          onChangeText={(text) =>
                            onChange(text === "" ? undefined : Number(text))
                          }
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
                  <Text className="font-body text-xs text-danger">
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
                  <Text className="font-body text-xs text-danger">
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
                  <Text className="font-body text-xs text-danger">
                    {t(errors.activity_level.message ?? "")}
                  </Text>
                )}
              </View>
            )}

            {step === 8 && (
              <>
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
                        onPress={() =>
                          setValue("workout_experience", opt.value, {
                            shouldValidate: true,
                          })
                        }
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
                          onPress={() =>
                            setValue("preferred_training_days", day, {
                              shouldValidate: true,
                            })
                          }
                        >
                          <View
                            className={cn(
                              "h-12 w-12 items-center justify-center rounded-full border",
                              selected
                                ? "border-primary bg-primary/15"
                                : "border-border-strong bg-surface-raised",
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
              </>
            )}
          </View>
        </Animated.View>

        {submitError && (
          <Text className="font-body text-xs text-danger">{submitError}</Text>
        )}

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
              loading={isSubmitting}
            >
              {step === totalSteps - 1
                ? t("common:buttons.finish")
                : t("common:buttons.continue")}
            </Button>
          </View>
        </View>
        </View>
        </View>

        {step === 0 && (
          <Text className="text-center font-body text-sm text-muted-foreground">
            {t("onboarding:haveAccountPrompt")}{" "}
            <Link href="/(auth)/login" className="font-body-semibold text-primary">
              {t("onboarding:loginLink")}
            </Link>
          </Text>
        )}
      </View>
    </Screen>
  );
}
