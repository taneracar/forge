import { supabase } from "@/lib/supabase";

export interface NutritionTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface ProfileRow {
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  activity_level: string | null;
}

/** Multipliers applied to BMR, keyed by the app's own activity-level slugs. */
const ACTIVITY_FACTOR: Record<string, number> = {
  hareketsiz: 1.2,
  "az-aktif": 1.375,
  "orta-aktif": 1.55,
  "cok-aktif": 1.725,
};

/** Calorie delta applied to maintenance, keyed by the app's goal slugs. */
const GOAL_FACTOR: Record<string, number> = {
  bulk: 1.15,
  cut: 0.8,
  maintain: 1,
  recomp: 0.95,
};

/** Grams of protein per kg bodyweight, by goal — higher on a cut to spare muscle. */
const PROTEIN_PER_KG: Record<string, number> = {
  bulk: 1.8,
  cut: 2.2,
  maintain: 1.8,
  recomp: 2.2,
};

/**
 * Shown when the profile is missing the measurements the formula needs
 * (a resumed signup can leave them null) — a neutral, clearly-generic
 * target beats rendering "0 / 0" or a number derived from guessed inputs.
 */
const FALLBACK: NutritionTargets = {
  calories: 2200,
  proteinG: 140,
  carbsG: 240,
  fatG: 61,
};

/**
 * Mifflin-St Jeor BMR → TDEE → goal-adjusted calorie target, then split into
 * macros (protein by bodyweight, fat at 25% of calories, carbs take the rest).
 * Derived from `profiles` rather than stored, so it stays correct when the
 * user edits their weight or goal — and needs no extra column/migration.
 */
export function targetsFor(profile: ProfileRow): NutritionTargets {
  const { age, gender, height_cm: height, weight_kg: weight } = profile;
  if (!age || !height || !weight) return FALLBACK;

  const base = 10 * weight + 6.25 * height - 5 * age;
  // "other" sits between the male (+5) and female (-161) constants rather
  // than defaulting to either one.
  const bmr = gender === "male" ? base + 5 : gender === "female" ? base - 161 : base - 78;

  const activity = ACTIVITY_FACTOR[profile.activity_level ?? ""] ?? 1.375;
  const goalFactor = GOAL_FACTOR[profile.goal ?? ""] ?? 1;
  const calories = Math.round((bmr * activity * goalFactor) / 10) * 10;

  const proteinG = Math.round(weight * (PROTEIN_PER_KG[profile.goal ?? ""] ?? 1.8));
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  return { calories, proteinG, carbsG, fatG };
}

export async function getNutritionTargets(userId: string): Promise<NutritionTargets> {
  const { data, error } = await supabase
    .from("profiles")
    .select("age, gender, height_cm, weight_kg, goal, activity_level")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return FALLBACK;
  return targetsFor(data as ProfileRow);
}
