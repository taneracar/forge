import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Timer, Trophy } from "lucide-react-native";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
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
  notes: string | null;
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
        .select("started_at, completed_at, duration_seconds, workouts(name), notes")
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

  if (!session) {
    return (
      <View className="flex-1 gap-3 bg-background px-5" style={{ paddingTop: insets.top + 20 }}>
        <Skeleton height={36} />
        <Skeleton height={92} />
        <Skeleton height={160} />
      </View>
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center gap-2">
        <BackButton fallbackHref="/(tabs)/antrenman/history" />
        <Text className="flex-1 font-display text-2xl uppercase text-foreground">
          {session.workouts?.name ?? t("panel:workout.history.detail.title")}
        </Text>
      </View>

      {/* Summary mirrors the live session header so a finished workout reads
          the same way as one in progress. */}
      <Card variant="gradient" className="mt-3">
        {session.completed_at && (
          <Text className="font-body text-xs text-muted-foreground">
            {new Date(session.completed_at).toLocaleDateString()}
          </Text>
        )}
        <View className="mt-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Timer color={Colors.primary} size={18} />
            <Text className="font-mono text-3xl text-foreground">
              {session.duration_seconds ? formatDuration(session.duration_seconds) : "—"}
            </Text>
          </View>
          <View className="items-end">
            <Text className="font-mono text-lg text-foreground">
              {Math.round(volume).toLocaleString()} kg
            </Text>
            <Text className="font-body text-[11px] text-muted-foreground">
              {t("panel:workout.history.volumeLabel")}
            </Text>
          </View>
        </View>
      </Card>

      <SectionHeader className="mt-7" title={t("panel:workout.history.detail.setsLabel")} />

      <View className="mt-3 gap-2">
        {groups.map((group, groupIndex) => (
          <Animated.View
            key={group.exerciseId}
            entering={FadeInDown.duration(280).delay(Math.min(groupIndex, 8) * 40)}
          >
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 font-body-semibold text-base text-foreground">
                  {group.name}
                </Text>
                <Text className="font-mono text-xs text-muted-foreground">
                  {group.sets.length}
                </Text>
              </View>

              <View className="mt-2.5 gap-1.5">
                {group.sets.map((set) => {
                  const isPR = prSetIds.has(set.id);
                  return (
                    <View
                      key={set.id}
                      className={cn(
                        "flex-row items-center gap-3 rounded-tile px-2.5 py-2",
                        isPR ? "bg-warning/10" : "bg-surface-overlay",
                      )}
                    >
                      <View
                        className={cn(
                          "h-7 w-7 items-center justify-center rounded-full",
                          isPR ? "bg-warning/20" : "bg-surface-raised",
                        )}
                      >
                        {isPR ? (
                          <Trophy color={Colors.warning} size={13} />
                        ) : (
                          <Text className="font-mono text-xs text-muted-foreground">
                            {set.set_number}
                          </Text>
                        )}
                      </View>
                      <Text className="flex-1 font-mono text-sm text-foreground">
                        {set.weight ?? 0} kg × {set.reps ?? 0}
                      </Text>
                      {isPR && <Badge label="PR" tone="warning" />}
                    </View>
                  );
                })}
              </View>
            </Card>
          </Animated.View>
        ))}
      </View>

      {session.notes && (
        <>
          <SectionHeader className="mt-7" title={t("panel:workout.history.detail.notesLabel")} />
          <Card className="mt-3">
            <Text className="font-body text-sm text-foreground">{session.notes}</Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
