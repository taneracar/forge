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
  /** Manual kcal delta on top of the formula. Optional: most callers don't set it. */
  calorie_adjustment?: number | null;
}

const PROFILE_COLUMNS =
  "age, gender, height_cm, weight_kg, goal, activity_level, calorie_adjustment";

/** How far the manual nudge may move the target, matching the DB check constraint. */
export const ADJUSTMENT_LIMIT = 1000;
export const ADJUSTMENT_STEP = 50;

/** Below this the macro split stops meaning anything, so the nudge can't go lower. */
const MIN_CALORIES = 1000;

export function clampAdjustment(value: number): number {
  return Math.max(-ADJUSTMENT_LIMIT, Math.min(ADJUSTMENT_LIMIT, value));
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
const FALLBACK_CALORIES = 2200;
const FALLBACK_PROTEIN = 140;
const FALLBACK: NutritionTargets = {
  calories: FALLBACK_CALORIES,
  proteinG: FALLBACK_PROTEIN,
  ...splitMacros(FALLBACK_CALORIES, FALLBACK_PROTEIN),
};

/**
 * Mifflin-St Jeor BMR → TDEE → goal-adjusted calorie target, then split into
 * macros (protein by bodyweight, fat at 25% of calories, carbs take the rest).
 * Derived from `profiles` rather than stored, so it stays correct when the
 * user edits their weight or goal — and needs no extra column/migration.
 */
/** Every intermediate step, so the calculator screen can show its working. */
export interface TargetBreakdown extends NutritionTargets {
  /** Null when the profile was missing measurements and FALLBACK was used. */
  bmr: number | null;
  activityFactor: number;
  /** BMR × activity — what you'd eat to hold your weight. */
  maintenance: number | null;
  goalFactor: number;
  proteinPerKg: number;
  /** What the formula alone produced, before the manual nudge. */
  baseCalories: number;
  /** The manual nudge actually in effect — clamped, so it can differ from the stored value. */
  adjustment: number;
  /** True when these are the generic fallback numbers, not derived from you. */
  isFallback: boolean;
}

/** Protein is set by bodyweight, fat takes a quarter of the calories, carbs take the rest. */
function splitMacros(calories: number, proteinG: number) {
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  return { fatG, carbsG };
}

/**
 * Returns the working as well as the result. `targetsFor` narrows it back down
 * for the callers that only want the four numbers.
 */
export function explainTargets(profile: ProfileRow): TargetBreakdown {
  const { age, gender, height_cm: height, weight_kg: weight } = profile;
  const activityFactor = ACTIVITY_FACTOR[profile.activity_level ?? ""] ?? 1.375;
  const goalFactor = GOAL_FACTOR[profile.goal ?? ""] ?? 1;
  const proteinPerKg = PROTEIN_PER_KG[profile.goal ?? ""] ?? 1.8;
  const adjustment = clampAdjustment(profile.calorie_adjustment ?? 0);

  if (!age || !height || !weight) {
    const calories = Math.max(MIN_CALORIES, FALLBACK.calories + adjustment);
    return {
      ...FALLBACK,
      calories,
      ...splitMacros(calories, FALLBACK.proteinG),
      bmr: null,
      activityFactor,
      maintenance: null,
      goalFactor,
      proteinPerKg,
      baseCalories: FALLBACK.calories,
      adjustment,
      isFallback: true,
    };
  }

  const base = 10 * weight + 6.25 * height - 5 * age;
  // "other" sits between the male (+5) and female (-161) constants rather
  // than defaulting to either one.
  const bmr = gender === "male" ? base + 5 : gender === "female" ? base - 161 : base - 78;

  const maintenance = Math.round((bmr * activityFactor) / 10) * 10;
  const baseCalories = Math.round((bmr * activityFactor * goalFactor) / 10) * 10;
  const calories = Math.max(MIN_CALORIES, baseCalories + adjustment);

  const proteinG = Math.round(weight * proteinPerKg);

  return {
    calories,
    proteinG,
    ...splitMacros(calories, proteinG),
    bmr: Math.round(bmr),
    activityFactor,
    maintenance,
    goalFactor,
    proteinPerKg,
    baseCalories,
    adjustment,
    isFallback: false,
  };
}

export function targetsFor(profile: ProfileRow): NutritionTargets {
  const { calories, proteinG, carbsG, fatG } = explainTargets(profile);
  return { calories, proteinG, carbsG, fatG };
}

export type TargetProfile = ProfileRow;

/**
 * The raw inputs behind the target. The calculator screen keeps these in state
 * and re-runs `explainTargets` locally, so changing your goal updates every
 * number instantly instead of waiting on a round trip.
 */
export async function getTargetProfile(userId: string): Promise<TargetProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProfileRow;
}

export async function getNutritionTargets(userId: string): Promise<NutritionTargets> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return FALLBACK;
  return targetsFor(data as ProfileRow);
}
