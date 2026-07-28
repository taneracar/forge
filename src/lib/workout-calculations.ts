export interface SetLike {
  weight: number | null;
  reps: number | null;
  completed: boolean;
}

export function calculateVolume(sets: SetLike[]): number {
  return sets
    .filter((s) => s.completed)
    .reduce((total, s) => total + (s.weight ?? 0) * (s.reps ?? 0), 0);
}

export function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export interface SetPerformance {
  weight: number | null;
  reps: number | null;
}

/**
 * Ranks two sets: heavier weight always wins, and equal weight is broken by
 * more reps — so 5kg x 3 outranks 5kg x 1.
 */
export function compareSetPerformance(a: SetPerformance, b: SetPerformance): number {
  const weightDiff = (a.weight ?? 0) - (b.weight ?? 0);
  if (weightDiff !== 0) return weightDiff;
  return (a.reps ?? 0) - (b.reps ?? 0);
}

/** The single best set of the given list, or null when the list is empty. */
export function bestPerformance<T extends SetPerformance>(sets: T[]): T | null {
  return sets.reduce<T | null>(
    (best, set) => (best === null || compareSetPerformance(set, best) > 0 ? set : best),
    null,
  );
}

/**
 * A set is a personal record only when it strictly beats everything logged
 * before it. `priorBest` must come from earlier sessions only, so a record
 * stays a record in history even after it is later surpassed.
 */
export function isPersonalRecord(
  candidate: SetPerformance,
  priorBest: SetPerformance | null,
): boolean {
  if ((candidate.weight ?? 0) <= 0) return false;
  if (priorBest === null) return true;
  return compareSetPerformance(candidate, priorBest) > 0;
}
