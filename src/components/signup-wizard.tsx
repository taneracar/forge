import { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Eye, EyeOff, Check, Minus, Plus } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { signupSchema, type SignupValues } from "@/lib/profile-schema";

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

const stepMeta = [
  { eyebrow: "Adım 1 / 9", title: "Hesabını Oluştur", description: "Antrenman yolculuğuna başla." },
  { eyebrow: "Adım 2 / 9", title: "İsmin Ne?", description: "Sana nasıl hitap edelim?" },
  { eyebrow: "Adım 3 / 9", title: "Cinsiyetin Ne?", description: "Programını sana göre ayarlamamız için." },
  { eyebrow: "Adım 4 / 9", title: "Kaç Yaşındasın?", description: "Programını sana göre ayarlamamız için." },
  { eyebrow: "Adım 5 / 9", title: "Boyun Kaç?", description: "İlerlemeni takip edebilmemiz için." },
  { eyebrow: "Adım 6 / 9", title: "Kilon Kaç?", description: "İlerlemeni takip edebilmemiz için." },
  { eyebrow: "Adım 7 / 9", title: "Hedefin Ne?", description: "Antrenman ve beslenme planın buna göre şekillenecek." },
  { eyebrow: "Adım 8 / 9", title: "Aktivite Seviyen?", description: "Günlük hareketliliğini en iyi tanımlayan seçeneği seç." },
  {
    eyebrow: "Adım 9 / 9",
    title: "Antrenman Deneyimin?",
    description: "Deneyim seviyeni ve haftada kaç gün antrenman yapmak istediğini seç.",
  },
];

const genderOptions = [
  { value: "male", label: "Erkek" },
  { value: "female", label: "Kadın" },
  { value: "other", label: "Diğer" },
] as const;

const goalOptions = [
  { value: "bulk", label: "Kütle Al" },
  { value: "cut", label: "Yağ Yak" },
  { value: "maintain", label: "Formunu Koru" },
  { value: "recomp", label: "Yeniden Şekillen" },
] as const;

const activityOptions = [
  { value: "hareketsiz", label: "Hareketsiz" },
  { value: "az-aktif", label: "Az Aktif" },
  { value: "orta-aktif", label: "Orta Aktif" },
  { value: "cok-aktif", label: "Çok Aktif" },
] as const;

const experienceOptions = [
  { value: "yeni-basliyorum", label: "Yeni Başlıyorum" },
  { value: "orta-seviye", label: "Orta Seviye" },
  { value: "ileri-seviye", label: "İleri Seviye" },
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

  const totalSteps = stepMeta.length;
  const meta = stepMeta[step];
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
      setSubmitError("Oturum bulunamadı, tekrar giriş yap.");
      return;
    }

    const { email, password, ...profileValues } = values;
    void email;
    void password;

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...profileValues });

    if (error) {
      setSubmitError("Kaydedilirken bir sorun oluştu.");
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
            ? "Bu e-posta zaten kayıtlı."
            : "Kayıt sırasında bir sorun oluştu.",
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
          E-postanı Kontrol Et
        </Text>
        <Text className="font-body text-muted-foreground">
          Hesabını onaylaman için sana bir bağlantı gönderdik.
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
        {stepMeta.map((_, i) => (
          <View
            key={i}
            className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-border")}
          />
        ))}
      </View>

      <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
        {meta.eyebrow}
      </Text>
      <Text className="mt-3 font-display text-3xl uppercase text-foreground">
        {meta.title}
      </Text>
      <Text className="mt-3 font-body text-muted-foreground">{meta.description}</Text>

      <View className="mt-8 gap-6">
        {step === 0 && (
          <>
            <View className="gap-1.5">
              <Text className={labelClass}>E-posta</Text>
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
                <Text className="text-xs text-primary">{errors.email.message}</Text>
              )}
            </View>

            <View className="gap-1.5">
              <Text className={labelClass}>Şifre</Text>
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
                {[
                  { key: "length", label: "En az 8 karakter" },
                  { key: "letter", label: "En az bir harf" },
                  { key: "number", label: "En az bir rakam" },
                ].map((rule) => {
                  const met =
                    passwordChecks[rule.key as keyof typeof passwordChecks];
                  return (
                    <View key={rule.key} className="flex-row items-center gap-1.5">
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
                        {rule.label}
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
            <Text className={labelClass}>İsim</Text>
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
              <Text className="text-xs text-primary">{errors.name.message}</Text>
            )}
          </View>
        )}

        {step === 2 && (
          <View className="gap-1.5">
            <View className="flex-row gap-2">
              {genderOptions.map((opt) => (
                <View key={opt.value} className="flex-1">
                  <OptionButton
                    label={opt.label}
                    selected={watch("gender") === opt.value}
                    onPress={() =>
                      setValue("gender", opt.value, { shouldValidate: true })
                    }
                  />
                </View>
              ))}
            </View>
            {errors.gender && (
              <Text className="text-xs text-primary">{errors.gender.message}</Text>
            )}
          </View>
        )}

        {step === 3 && (
          <View className="gap-1.5">
            <Text className={labelClass}>Yaş</Text>
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
              <Text className="text-xs text-primary">{errors.age.message}</Text>
            )}
          </View>
        )}

        {step === 4 && (
          <View className="gap-1.5">
            <Text className={labelClass}>Boy (cm)</Text>
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
              <Text className="text-xs text-primary">{errors.height_cm.message}</Text>
            )}
          </View>
        )}

        {step === 5 && (
          <View className="gap-1.5">
            <Text className={labelClass}>Kilo (kg)</Text>
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
              <Text className="text-xs text-primary">{errors.weight_kg.message}</Text>
            )}
          </View>
        )}

        {step === 6 && (
          <View className="gap-1.5">
            <View className="flex-row flex-wrap gap-2">
              {goalOptions.map((opt) => (
                <View key={opt.value} style={{ width: "48%" }}>
                  <OptionButton
                    label={opt.label}
                    selected={watch("goal") === opt.value}
                    onPress={() =>
                      setValue("goal", opt.value, { shouldValidate: true })
                    }
                  />
                </View>
              ))}
            </View>
            {errors.goal && (
              <Text className="text-xs text-primary">{errors.goal.message}</Text>
            )}
          </View>
        )}

        {step === 7 && (
          <View className="gap-1.5">
            <View className="flex-row flex-wrap gap-2">
              {activityOptions.map((opt) => (
                <View key={opt.value} style={{ width: "48%" }}>
                  <OptionButton
                    label={opt.label}
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
                {errors.activity_level.message}
              </Text>
            )}
          </View>
        )}

        {step === 8 && (
          <>
            <View className="gap-1.5">
              <Text className={labelClass}>Antrenman Deneyimi</Text>
              <View className="gap-2">
                {experienceOptions.map((opt) => (
                  <OptionButton
                    key={opt.value}
                    label={opt.label}
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
                  {errors.workout_experience.message}
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <Text className={labelClass}>Haftalık Antrenman Günü</Text>
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
                  {errors.preferred_training_days.message}
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
                Geri
              </Button>
            </View>
          )}
          <View className="flex-1">
            <Button
              variant="primary"
              onPress={handleNext}
              disabled={isSubmitting}
            >
              {step === totalSteps - 1 ? "Bitir" : "Devam Et"}
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
