import { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import { onboardingSchema, type OnboardingValues } from "@/lib/profile-schema";

const stepFields = [
  ["name"],
  ["age", "gender"],
  ["height_cm", "weight_kg"],
  ["goal"],
  ["activity_level"],
  ["workout_experience", "preferred_training_days"],
] as const satisfies (keyof OnboardingValues)[][];

const stepMeta = [
  { eyebrow: "Adım 1 / 6", title: "İsmin Ne?", description: "Sana nasıl hitap edelim?" },
  {
    eyebrow: "Adım 2 / 6",
    title: "Yaş ve Cinsiyet",
    description: "Programını sana göre ayarlamamız için gerekli.",
  },
  {
    eyebrow: "Adım 3 / 6",
    title: "Boy ve Kilo",
    description: "İlerlemeni takip edebilmemiz için.",
  },
  {
    eyebrow: "Adım 4 / 6",
    title: "Hedefin Ne?",
    description: "Antrenman ve beslenme planın buna göre şekillenecek.",
  },
  {
    eyebrow: "Adım 5 / 6",
    title: "Aktivite Seviyen",
    description: "Günlük hareketliliğini en iyi tanımlayan seçeneği seç.",
  },
  {
    eyebrow: "Adım 6 / 6",
    title: "Antrenman Deneyimin",
    description:
      "Deneyim seviyeni ve haftada kaç gün antrenman yapmak istediğini seç.",
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
  "rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground";
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

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.session?.user.id);
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({ resolver: zodResolver(onboardingSchema) });

  const totalSteps = stepMeta.length;
  const meta = stepMeta[step];

  const onSubmit = async (values: OnboardingValues) => {
    setSubmitError(null);

    if (!userId) {
      setSubmitError("Oturum bulunamadı, tekrar giriş yap.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...values });

    if (error) {
      setSubmitError("Kaydedilirken bir sorun oluştu.");
      return;
    }

    router.replace("/(tabs)");
  };

  async function handleNext() {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;

    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      return;
    }

    await handleSubmit(onSubmit)();
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

        {step === 1 && (
          <>
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
            <View className="gap-1.5">
              <Text className={labelClass}>Cinsiyet</Text>
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
          </>
        )}

        {step === 2 && (
          <>
            <View className="gap-1.5">
              <Text className={labelClass}>Boy (cm)</Text>
              <Controller
                control={control}
                name="height_cm"
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
              {errors.height_cm && (
                <Text className="text-xs text-primary">
                  {errors.height_cm.message}
                </Text>
              )}
            </View>
            <View className="gap-1.5">
              <Text className={labelClass}>Kilo (kg)</Text>
              <Controller
                control={control}
                name="weight_kg"
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
              {errors.weight_kg && (
                <Text className="text-xs text-primary">
                  {errors.weight_kg.message}
                </Text>
              )}
            </View>
          </>
        )}

        {step === 3 && (
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

        {step === 4 && (
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

        {step === 5 && (
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
                      "h-10 w-10 items-center justify-center rounded-sm border",
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
          {step > 0 && (
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
