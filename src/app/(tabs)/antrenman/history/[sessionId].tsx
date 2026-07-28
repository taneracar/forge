import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Trophy } from "lucide-react-native";
import { BackButton } from "@/components/ui/back-button";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import {
  bestPerformance,
  calculateVolume,
  compareSetPerformance,
  formatDuration,
  isPersonalRecord,
} from "@/lib/workout-calculations";

interface SetRowData {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  exercises: { name: string } | null;
}

interface SessionDetail {
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  workouts: { name: string } | null;
}

interface PriorSetRow {
  exercise_id: string;
  weight: number | null;
  reps: number | null;
}

interface ExerciseGroup {
  exerciseId: string;
  name: string;
  sets: SetRowData[];
}

export default function WorkoutHistoryDetailScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [prSetIds, setPrSetIds] = useState<Set<string>>(new Set());
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase
        .from("workout_sessions")
        .select("started_at, completed_at, duration_seconds, workouts(name)")
        .eq("id", sessionId)
        .single<SessionDetail>();
      setSession(sessionData ?? null);
      if (!sessionData) return;

      const { data: sets } = await supabase
        .from("workout_sets")
        .select("id, exercise_id, set_number, weight, reps, completed, exercises(name)")
        .eq("session_id", sessionId)
        .order("set_number")
        .returns<SetRowData[]>();

      const byExercise = new Map<string, ExerciseGroup>();
      for (const set of sets ?? []) {
        const key = set.exercise_id;
        if (!byExercise.has(key)) {
          byExercise.set(key, {
            exerciseId: key,
            name: set.exercises?.name ?? "",
            sets: [],
          });
        }
        byExercise.get(key)!.sets.push(set);
      }
      const groupList = Array.from(byExercise.values());
      setGroups(groupList);
      setVolume(calculateVolume(sets ?? []));

      const exerciseIds = groupList.map((g) => g.exerciseId);
      if (exerciseIds.length === 0) return;

      // Only sets logged in *earlier* sessions count as the record to beat, so
      // a badge means "this beat everything before it" and stays accurate even
      // after the lift is surpassed later.
      const { data: priorSets } = await supabase
        .from("workout_sets")
        .select("exercise_id, weight, reps, workout_sessions!inner(started_at)")
        .in("exercise_id", exerciseIds)
        .eq("completed", true)
        .lt("workout_sessions.started_at", sessionData.started_at)
        .returns<PriorSetRow[]>();

      const priorBest = new Map<string, PriorSetRow>();
      for (const set of priorSets ?? []) {
        const current = priorBest.get(set.exercise_id);
        if (!current || compareSetPerformance(set, current) > 0) {
          priorBest.set(set.exercise_id, set);
        }
      }

      // At most one badge per exercise: the best set of this session, and only
      // when it actually beats the prior record.
      const records = new Set<string>();
      for (const group of groupList) {
        const best = bestPerformance(group.sets.filter((s) => s.completed));
        if (best && isPersonalRecord(best, priorBest.get(group.exerciseId) ?? null)) {
          records.add(best.id);
        }
      }
      setPrSetIds(records);
    }
    load();
  }, [sessionId]);

  return (
    <ScrollView
      className="flex-1 bg-background px-6"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
    >
      <View className="flex-row items-center gap-2">
        <BackButton fallbackHref="/(tabs)/antrenman/history" />
        <Text className="flex-1 font-display text-2xl uppercase text-foreground">
          {session?.workouts?.name ?? t("panel:workout.history.detail.title")}
        </Text>
      </View>

      {session?.completed_at && (
        <Text className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {new Date(session.completed_at).toLocaleDateString()}
        </Text>
      )}

      <View className="mt-4 flex-row gap-6">
        <View>
          <Text className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("panel:workout.history.durationLabel")}
          </Text>
          <Text className="mt-0.5 font-body-semibold text-lg text-foreground">
            {session?.duration_seconds ? formatDuration(session.duration_seconds) : "—"}
          </Text>
        </View>
        <View>
          <Text className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("panel:workout.history.volumeLabel")}
          </Text>
          <Text className="mt-0.5 font-body-semibold text-lg text-foreground">
            {Math.round(volume)} kg
          </Text>
        </View>
      </View>

      <Text className="mt-8 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {t("panel:workout.history.detail.setsLabel")}
      </Text>

      <View className="mt-3 gap-6">
        {groups.map((group) => (
          <View key={group.exerciseId}>
            <Text className="mb-2 font-body-semibold text-base text-foreground">
              {group.name}
            </Text>
            <View className="gap-1.5">
              {group.sets.map((set) => {
                const isPR = prSetIds.has(set.id);
                return (
                  <View
                    key={set.id}
                    className="flex-row items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5"
                  >
                    <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      {t("panel:workout.session.setLabel")} {set.set_number}
                    </Text>
                    <View className="flex-row items-center gap-3">
                      <Text className="font-body-semibold text-sm text-foreground">
                        {set.weight ?? 0} kg × {set.reps ?? 0}
                      </Text>
                      {isPR && (
                        <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
                          <Trophy color={Colors.primary} size={10} />
                          <Text className="font-mono text-[10px] uppercase text-primary">
                            PR
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
