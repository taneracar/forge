import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { calculateVolume } from "@/lib/workout-calculations";

export interface CurrentWorkout {
  id: string;
  name: string;
  exerciseNames: string[];
}

export interface RecentSession {
  id: string;
  workoutName: string;
  completedAt: string;
  durationSeconds: number | null;
  volume: number;
}

export interface OpenSession {
  id: string;
}

interface WorkoutExerciseRow {
  order_index: number;
  exercises: { name: string } | null;
}

interface SessionRow {
  id: string;
  completed_at: string;
  duration_seconds: number | null;
  workouts: { name: string } | null;
  workout_sets: { weight: number | null; reps: number | null; completed: boolean }[];
}

interface WorkoutHomeState {
  currentWorkout: CurrentWorkout | null;
  recentSessions: RecentSession[];
  openSession: OpenSession | null;
  loading: boolean;
  /** True once a fetch has completed — lets `load` no-op on repeat tab visits. */
  loaded: boolean;
  load: (userId: string) => Promise<void>;
  /** Call after any mutation (save workout, select, delete, finish/start a
      session…) so the next visit to the Workout tab actually refetches. */
  invalidate: () => void;
  setOpenSession: (session: OpenSession | null) => void;
}

export const useWorkoutHomeStore = create<WorkoutHomeState>((set, get) => ({
  currentWorkout: null,
  recentSessions: [],
  openSession: null,
  loading: false,
  loaded: false,

  load: async (userId) => {
    // Tapping into the tab shouldn't re-hit the network every time — only a
    // real invalidation (see below) or the very first visit should.
    if (get().loaded) return;
    set({ loading: true });

    const [{ data: workout }, { data: sessions }, { data: open }] = await Promise.all([
      supabase
        .from("workouts")
        .select("id, name")
        .eq("user_id", userId)
        .order("last_selected_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("workout_sessions")
        .select(
          "id, completed_at, duration_seconds, workouts(name), workout_sets(weight, reps, completed)",
        )
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(5)
        .returns<SessionRow[]>(),
      supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", userId)
        .is("completed_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    let currentWorkout: CurrentWorkout | null = null;
    if (workout) {
      const { data: exercises } = await supabase
        .from("workout_exercises")
        .select("order_index, exercises(name)")
        .eq("workout_id", workout.id)
        .order("order_index")
        .returns<WorkoutExerciseRow[]>();
      currentWorkout = {
        id: workout.id,
        name: workout.name,
        exerciseNames: (exercises ?? [])
          .map((e) => e.exercises?.name)
          .filter((name): name is string => Boolean(name)),
      };
    }

    set({
      currentWorkout,
      recentSessions: (sessions ?? []).map((s) => ({
        id: s.id,
        workoutName: s.workouts?.name ?? "—",
        completedAt: s.completed_at,
        durationSeconds: s.duration_seconds,
        volume: calculateVolume(s.workout_sets ?? []),
      })),
      openSession: open ? { id: open.id } : null,
      loading: false,
      loaded: true,
    });
  },

  invalidate: () => set({ loaded: false }),
  setOpenSession: (openSession) => set({ openSession }),
}));
