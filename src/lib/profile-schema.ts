import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().min(1, "common:validation.nameRequired"),
  age: z
    .number({ error: "common:validation.ageInvalid" })
    .int()
    .positive("common:validation.ageInvalid"),
  gender: z.enum(["male", "female", "other"], {
    error: "common:validation.genderRequired",
  }),
  height_cm: z
    .number({ error: "common:validation.heightInvalid" })
    .positive("common:validation.heightInvalid"),
  weight_kg: z
    .number({ error: "common:validation.weightInvalid" })
    .positive("common:validation.weightInvalid"),
  goal: z.enum(["bulk", "cut", "maintain", "recomp"], {
    error: "common:validation.goalRequired",
  }),
  activity_level: z.string().min(1, "common:validation.activityRequired"),
  workout_experience: z.string().min(1, "common:validation.experienceRequired"),
  preferred_training_days: z
    .number({ error: "common:validation.daysRequired" })
    .int()
    .min(1, "common:validation.daysMin")
    .max(7, "common:validation.daysMax"),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const accountSchema = z.object({
  email: z.string().email("common:validation.emailInvalid"),
  password: z
    .string()
    .min(8, "common:validation.passwordMinSignup")
    .regex(/[a-zA-Z]/, "common:validation.passwordLetter")
    .regex(/[0-9]/, "common:validation.passwordNumber"),
});

export const signupSchema = accountSchema.merge(onboardingSchema);
export type SignupValues = z.infer<typeof signupSchema>;

export const genderOptions = [
  { value: "male", labelKey: "onboarding:options.gender.male" },
  { value: "female", labelKey: "onboarding:options.gender.female" },
  { value: "other", labelKey: "onboarding:options.gender.other" },
] as const;

export const goalOptions = [
  { value: "bulk", labelKey: "onboarding:options.goal.bulk" },
  { value: "cut", labelKey: "onboarding:options.goal.cut" },
  { value: "maintain", labelKey: "onboarding:options.goal.maintain" },
  { value: "recomp", labelKey: "onboarding:options.goal.recomp" },
] as const;

export const activityOptions = [
  { value: "hareketsiz", labelKey: "onboarding:options.activity.hareketsiz" },
  { value: "az-aktif", labelKey: "onboarding:options.activity.az-aktif" },
  { value: "orta-aktif", labelKey: "onboarding:options.activity.orta-aktif" },
  { value: "cok-aktif", labelKey: "onboarding:options.activity.cok-aktif" },
] as const;

export const experienceOptions = [
  {
    value: "yeni-basliyorum",
    labelKey: "onboarding:options.experience.yeni-basliyorum",
  },
  { value: "orta-seviye", labelKey: "onboarding:options.experience.orta-seviye" },
  { value: "ileri-seviye", labelKey: "onboarding:options.experience.ileri-seviye" },
] as const;

export function labelFor(
  options: readonly { value: string; labelKey: string }[],
  value: string | null | undefined,
  t: (key: string) => string,
) {
  const key = options.find((o) => o.value === value)?.labelKey;
  return key ? t(key) : "—";
}
