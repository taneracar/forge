import { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Plus, Search, Trophy, X } from "lucide-react-native";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ExerciseImagePlaceholder } from "@/components/ui/exercise-image-placeholder";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { haptics } from "@/lib/haptics";
import { Colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth.store";
import {
  exerciseInstructions,
  getExerciseHistory,
  listExercises,
  type Exercise,
  type ExerciseHistory,
} from "@/lib/exercises";
import { muscleGroupOptions, equipmentOptions } from "@/lib/workout-schema";
import { labelFor } from "@/lib/profile-schema";

interface ExercisePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePicker({ visible, onClose, onSelect }: ExercisePickerProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Keyed so a fresh open always starts back at the search list, not
          wherever the previous session's detail view left off. */}
      {visible && <PickerContent key="open" onClose={onClose} onSelect={onSelect} />}
    </Modal>
  );
}

function PickerContent({ onClose, onSelect }: Omit<ExercisePickerProps, "visible">) {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[] | null>(null);
  const [detail, setDetail] = useState<Exercise | null>(null);

  // The full catalog (~1.4k rows) is small enough to fetch once and filter
  // in memory — avoids a round trip (and the empty-list flash) on every
  // keystroke and every muscle-group tap.
  useEffect(() => {
    listExercises().then(setAllExercises);
  }, []);

  const results = useMemo(() => {
    if (!allExercises) return [];
    const q = query.trim().toLowerCase();
    return allExercises.filter((exercise) => {
      if (muscleGroup && exercise.muscle_group !== muscleGroup) return false;
      if (q && !exercise.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allExercises, query, muscleGroup]);

  if (detail) {
    return (
      <ExerciseDetail
        key={detail.id}
        exercise={detail}
        onBack={() => setDetail(null)}
        onAdd={() => {
          onSelect(detail);
          onClose();
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <AmbientBackground />
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
      >
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 font-display text-2xl uppercase text-foreground">
          {t("panel:workout.builder.pickExercise")}
        </Text>
        <View className="flex-row items-center gap-3">
          {allExercises && (
            <Text className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {results.length} {t("panel:workout.builder.resultsLabel")}
            </Text>
          )}
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
          >
            <X color={Colors.foreground} size={18} />
          </Pressable>
        </View>
      </View>

      <View className="mt-4">
        <Input
          placeholder={t("panel:workout.builder.searchPlaceholder")}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          leftElement={<Search color={Colors.muted} size={16} />}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3"
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      >
        <Pressable
          onPress={() => setMuscleGroup(null)}
          className={cn(
            "h-9 justify-center rounded-full px-3.5",
            muscleGroup === null ? "bg-primary" : "bg-surface-raised",
          )}
        >
          <Text
            className={cn(
              "font-body-semibold text-xs uppercase tracking-wide",
              muscleGroup === null ? "text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {t("panel:workout.builder.allMuscleGroups")}
          </Text>
        </Pressable>
        {muscleGroupOptions.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => {
              haptics.select();
              setMuscleGroup(opt.value);
            }}
            className={cn(
              "h-9 justify-center rounded-full px-3.5",
              muscleGroup === opt.value ? "bg-primary" : "bg-surface-raised",
            )}
          >
            <Text
              className={cn(
                "font-body-semibold text-xs uppercase tracking-wide",
                muscleGroup === opt.value ? "text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t(opt.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {!allExercises ? (
        <View className="mt-4 gap-2">
          <Skeleton height={72} />
          <Skeleton height={72} />
          <Skeleton height={72} />
        </View>
      ) : (
        <FlatList
          className="mt-4"
          data={results}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
          ListEmptyComponent={
            <EmptyState
              className="mt-6"
              icon={<Search color={Colors.mutedForeground} size={22} />}
              title={t("panel:workout.builder.noResults")}
            />
          }
          renderItem={({ item }) => {
            const subtitle = [
              item.equipment ? labelFor(equipmentOptions, item.equipment, t) : null,
              labelFor(muscleGroupOptions, item.muscle_group, t),
            ]
              .filter(Boolean)
              .join(" · ")
              .toUpperCase();
            return (
              <Pressable
                onPress={() => {
                  haptics.select();
                  setDetail(item);
                }}
              >
                <Card className="flex-row items-center gap-3 py-3">
                  <ExerciseImagePlaceholder className="h-14 w-14 rounded-tile" iconSize={20} />
                  <View className="flex-1">
                    <Text className="font-body-semibold text-base text-foreground">
                      {item.name}
                    </Text>
                    <Text className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                      {subtitle}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
      </View>
    </View>
  );
}

function ExerciseDetail({
  exercise,
  onBack,
  onAdd,
}: {
  exercise: Exercise;
  onBack: () => void;
  onAdd: () => void;
}) {
  const { t, i18n } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.session?.user.id);
  const { text, steps } = exerciseInstructions(exercise, i18n.language);
  const [history, setHistory] = useState<ExerciseHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getExerciseHistory(userId, exercise.id)
      .then(setHistory)
      .catch(() => setHistory({ personalRecord: null, recentSessions: [] }))
      .finally(() => setHistoryLoading(false));
  }, [userId, exercise.id]);

  const tags = [
    labelFor(muscleGroupOptions, exercise.muscle_group, t),
    exercise.equipment ? labelFor(equipmentOptions, exercise.equipment, t) : null,
    exercise.body_part,
  ].filter((tag): tag is string => Boolean(tag));

  const primaryMuscle = exercise.target_muscle ?? labelFor(muscleGroupOptions, exercise.muscle_group, t);
  const secondaryMuscles = exercise.secondary_muscles ?? [];

  return (
    <View className="flex-1 bg-background">
      <AmbientBackground />
      <View
        className="flex-1"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
      >
      <View className="flex-row items-center px-5">
        <Pressable
          onPress={onBack}
          hitSlop={10}
          className="-ml-2 h-9 w-9 items-center justify-center rounded-full"
        >
          <ChevronLeft color={Colors.foreground} size={22} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <ExerciseImagePlaceholder
          className="mt-2 w-full rounded-card"
          style={{ aspectRatio: 1.5 }}
          iconSize={48}
        />

        <Text className="mt-5 font-display text-3xl uppercase text-foreground">
          {exercise.name}
        </Text>

        <View className="mt-3 flex-row flex-wrap gap-2">
          {tags.map((tag, i) => (
            <View
              key={tag}
              className={cn(
                "rounded-full px-3.5 py-1.5",
                i === 0 ? "bg-primary" : "border border-border-strong bg-surface",
              )}
            >
              <Text
                className={cn(
                  "font-body-semibold text-xs uppercase tracking-wide",
                  i === 0 ? "text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-6 flex-row items-center justify-between">
          <Text className="font-body-semibold text-sm text-foreground">
            {t("panel:workout.builder.exerciseDetail.musclesLabel")}
          </Text>
          <Text className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            1 {t("panel:workout.builder.exerciseDetail.primaryLabel")}
          </Text>
        </View>
        <View className="mt-3 gap-3">
          <View>
            <Text className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("panel:workout.builder.exerciseDetail.primaryLabel")}
            </Text>
            <View className="mt-1.5 flex-row flex-wrap gap-2">
              <View className="rounded-full border border-success/30 bg-success/10 px-3.5 py-1.5">
                <Text className="font-body-semibold text-xs uppercase tracking-wide text-success">
                  {primaryMuscle}
                </Text>
              </View>
            </View>
          </View>
          {secondaryMuscles.length > 0 && (
            <View>
              <Text className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {t("panel:workout.builder.exerciseDetail.secondaryLabel")}
              </Text>
              <View className="mt-1.5 flex-row flex-wrap gap-2">
                {secondaryMuscles.map((muscle) => (
                  <View
                    key={muscle}
                    className="rounded-full border border-border-strong bg-surface px-3.5 py-1.5"
                  >
                    <Text className="font-body-medium text-xs uppercase tracking-wide text-muted-foreground">
                      {muscle}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {historyLoading ? (
          <Skeleton height={56} className="mt-6" />
        ) : history?.personalRecord ? (
          <>
            <View className="mt-6 flex-row items-center gap-3 rounded-tile border border-warning/20 bg-warning/10 px-4 py-3">
              <Trophy color={Colors.warning} size={18} />
              <Text className="flex-1 font-body-medium text-xs text-muted-foreground">
                {t("panel:workout.builder.exerciseDetail.personalRecordLabel")}
              </Text>
              <Text className="font-mono text-base text-warning">
                {history.personalRecord.weight ?? 0} kg × {history.personalRecord.reps ?? 0}
              </Text>
            </View>

            <Text className="mt-6 font-body-semibold text-sm text-foreground">
              {t("panel:workout.builder.exerciseDetail.recentSessionsLabel")}
            </Text>
            <View className="mt-3 gap-2">
              {history.recentSessions.map((session) => {
                const isPrSession = session.sets.some(
                  (s) =>
                    s.weight === history.personalRecord?.weight &&
                    s.reps === history.personalRecord?.reps,
                );
                return (
                  <View
                    key={session.sessionId}
                    className="rounded-tile border border-border-strong bg-surface px-4 py-3"
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="font-body text-xs text-muted-foreground">
                        {new Date(session.completedAt).toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </Text>
                      {isPrSession && <Badge label="PR" tone="warning" />}
                    </View>
                    <Text className="mt-1 font-mono text-sm text-foreground">
                      {session.sets.map((s) => `${s.weight ?? 0}×${s.reps ?? 0}`).join("  ·  ")}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Text className="mt-6 font-body text-sm text-muted-foreground">
            {t("panel:workout.builder.exerciseDetail.noHistory")}
          </Text>
        )}

        <View className="mt-6 flex-row items-center justify-between">
          <Text className="font-body-semibold text-sm text-foreground">
            {t("panel:workout.builder.exerciseDetail.instructionsLabel")}
          </Text>
          {steps && steps.length > 0 && (
            <Text className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {steps.length} {t("panel:workout.builder.exerciseDetail.stepsLabel")}
            </Text>
          )}
        </View>

        {steps && steps.length > 0 ? (
          <View className="mt-3 gap-2">
            {steps.map((step, i) => (
              <View key={i} className="gap-1 rounded-tile bg-surface-raised px-4 py-3">
                <Text className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </Text>
                <Text className="font-body text-sm text-foreground">{step}</Text>
              </View>
            ))}
          </View>
        ) : text ? (
          <Text className="mt-3 font-body text-sm text-muted-foreground">{text}</Text>
        ) : (
          <Text className="mt-3 font-body text-sm text-muted-foreground">
            {t("panel:workout.builder.exerciseDetail.noInstructions")}
          </Text>
        )}
      </ScrollView>

      <View className="px-5 pt-3">
        <Button
          variant="primary"
          size="lg"
          onPress={onAdd}
          icon={<Plus color={Colors.primaryForeground} size={18} />}
        >
          {t("panel:workout.builder.addExerciseButton")}
        </Button>
      </View>
      </View>
    </View>
  );
}
