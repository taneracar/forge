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

interface PriorSet {
  exercise_id: string;
  weight: number | null;
  completed: boolean;
}

export function detectPR(exerciseId: string, weight: number, priorSets: PriorSet[]): boolean {
  const priorMax = priorSets
    .filter((s) => s.exercise_id === exerciseId && s.completed)
    .reduce((max, s) => Math.max(max, s.weight ?? 0), 0);
  return weight > priorMax;
}
