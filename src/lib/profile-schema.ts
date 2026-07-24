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
