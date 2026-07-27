import { z } from "zod";

export const workoutNameSchema = z.object({
  name: z.string().min(1, "common:validation.workoutNameRequired"),
});
export type WorkoutNameValues = z.infer<typeof workoutNameSchema>;

export const setInputSchema = z.object({
  weight: z
    .number({ error: "common:validation.weightInvalid" })
    .nonnegative("common:validation.weightInvalid"),
  reps: z
    .number({ error: "common:validation.repsInvalid" })
    .int()
    .positive("common:validation.repsInvalid"),
});
export type SetInputValues = z.infer<typeof setInputSchema>;

export const muscleGroupOptions = [
  { value: "omuz", labelKey: "panel:workout.muscleGroups.omuz" },
  { value: "gogus", labelKey: "panel:workout.muscleGroups.gogus" },
  { value: "biceps", labelKey: "panel:workout.muscleGroups.biceps" },
  { value: "karin", labelKey: "panel:workout.muscleGroups.karin" },
  { value: "on-kol", labelKey: "panel:workout.muscleGroups.on-kol" },
  { value: "on-bacak", labelKey: "panel:workout.muscleGroups.on-bacak" },
  { value: "trapez", labelKey: "panel:workout.muscleGroups.trapez" },
  { value: "sirt", labelKey: "panel:workout.muscleGroups.sirt" },
  { value: "triceps", labelKey: "panel:workout.muscleGroups.triceps" },
  { value: "kalca", labelKey: "panel:workout.muscleGroups.kalca" },
  { value: "arka-bacak", labelKey: "panel:workout.muscleGroups.arka-bacak" },
  { value: "baldir", labelKey: "panel:workout.muscleGroups.baldir" },
] as const;

export const equipmentOptions = [
  { value: "barbell", labelKey: "panel:workout.equipment.barbell" },
  { value: "dumbbell", labelKey: "panel:workout.equipment.dumbbell" },
  { value: "cable", labelKey: "panel:workout.equipment.cable" },
  { value: "machine", labelKey: "panel:workout.equipment.machine" },
  { value: "bodyweight", labelKey: "panel:workout.equipment.bodyweight" },
  { value: "plate", labelKey: "panel:workout.equipment.plate" },
] as const;
