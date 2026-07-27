import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().min(1, "İsmini gir"),
  age: z
    .number({ error: "Geçerli bir yaş gir" })
    .int()
    .positive("Geçerli bir yaş gir"),
  gender: z.enum(["male", "female", "other"], { error: "Bir seçenek seç" }),
  height_cm: z
    .number({ error: "Geçerli bir boy gir" })
    .positive("Geçerli bir boy gir"),
  weight_kg: z
    .number({ error: "Geçerli bir kilo gir" })
    .positive("Geçerli bir kilo gir"),
  goal: z.enum(["bulk", "cut", "maintain", "recomp"], {
    error: "Bir hedef seç",
  }),
  activity_level: z.string().min(1, "Bir seçenek seç"),
  workout_experience: z.string().min(1, "Bir seçenek seç"),
  preferred_training_days: z
    .number({ error: "Bir gün sayısı seç" })
    .int()
    .min(1, "Haftada en az 1 gün seç")
    .max(7, "En fazla 7 gün olabilir"),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const accountSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi gir"),
  password: z
    .string()
    .min(8, "En az 8 karakter olmalı")
    .regex(/[a-zA-Z]/, "En az bir harf içermeli")
    .regex(/[0-9]/, "En az bir rakam içermeli"),
});

export const signupSchema = accountSchema.merge(onboardingSchema);
export type SignupValues = z.infer<typeof signupSchema>;

export const genderOptions = [
  { value: "male", label: "Erkek" },
  { value: "female", label: "Kadın" },
  { value: "other", label: "Diğer" },
] as const;

export const goalOptions = [
  { value: "bulk", label: "Kütle Al" },
  { value: "cut", label: "Yağ Yak" },
  { value: "maintain", label: "Formunu Koru" },
  { value: "recomp", label: "Yeniden Şekillen" },
] as const;

export const activityOptions = [
  { value: "hareketsiz", label: "Hareketsiz" },
  { value: "az-aktif", label: "Az Aktif" },
  { value: "orta-aktif", label: "Orta Aktif" },
  { value: "cok-aktif", label: "Çok Aktif" },
] as const;

export const experienceOptions = [
  { value: "yeni-basliyorum", label: "Yeni Başlıyorum" },
  { value: "orta-seviye", label: "Orta Seviye" },
  { value: "ileri-seviye", label: "İleri Seviye" },
] as const;

export function labelFor(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined,
) {
  return options.find((o) => o.value === value)?.label ?? "—";
}
