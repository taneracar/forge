import { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Dumbbell,
  Image as ImageIcon,
  Plus,
  Search,
  X,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { haptics } from "@/lib/haptics";
import { Colors } from "@/constants/colors";
import { exerciseInstructions, listExercises, type Exercise } from "@/lib/exercises";
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
    <View
      className="flex-1 bg-background px-5"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-2xl uppercase text-foreground">
          {t("panel:workout.builder.pickExercise")}
        </Text>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
        >
          <X color={Colors.foreground} size={18} />
        </Pressable>
      </View>

      <View className="mt-4">
        <Input
          placeholder={t("panel:workout.builder.searchPlaceholder")}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
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
            "h-9 justify-center rounded-full border px-3.5",
            muscleGroup === null
              ? "border-primary bg-primary/15"
              : "border-border-strong bg-surface",
          )}
        >
          <Text
            className={cn(
              "font-body-medium text-xs",
              muscleGroup === null ? "text-primary" : "text-muted-foreground",
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
              "h-9 justify-center rounded-full border px-3.5",
              muscleGroup === opt.value
                ? "border-primary bg-primary/15"
                : "border-border-strong bg-surface",
            )}
          >
            <Text
              className={cn(
                "font-body-medium text-xs",
                muscleGroup === opt.value ? "text-primary" : "text-muted-foreground",
              )}
            >
              {t(opt.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {!allExercises ? (
        <View className="mt-4 gap-2">
          <Skeleton height={62} />
          <Skeleton height={62} />
          <Skeleton height={62} />
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
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                haptics.select();
                setDetail(item);
              }}
            >
              <Card className="flex-row items-center gap-3 py-3">
                <View className="h-9 w-9 items-center justify-center rounded-tile bg-surface-overlay">
                  <Dumbbell color={Colors.mutedForeground} size={16} />
                </View>
                <View className="flex-1">
                  <Text className="font-body-semibold text-sm text-foreground">{item.name}</Text>
                  <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                    {labelFor(muscleGroupOptions, item.muscle_group, t)}
                    {item.equipment
                      ? ` · ${labelFor(equipmentOptions, item.equipment, t)}`
                      : ""}
                  </Text>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
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
  const { text, steps } = exerciseInstructions(exercise, i18n.language);

  return (
    <View
      className="flex-1 bg-background"
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
        <View className="mt-2 aspect-square items-center justify-center rounded-card bg-surface-raised">
          <ImageIcon color={Colors.muted} size={32} />
          <Text className="mt-2 font-body text-xs text-muted-foreground">
            {t("panel:workout.builder.exerciseDetail.mediaPlaceholder")}
          </Text>
        </View>

        <Text className="mt-5 font-display text-2xl uppercase text-foreground">
          {exercise.name}
        </Text>

        <View className="mt-3 flex-row flex-wrap gap-2">
          <View className="rounded-full border border-border-strong bg-surface px-3.5 py-1.5">
            <Text className="font-body-medium text-xs text-muted-foreground">
              {labelFor(muscleGroupOptions, exercise.muscle_group, t)}
            </Text>
          </View>
          {exercise.equipment && (
            <View className="rounded-full border border-border-strong bg-surface px-3.5 py-1.5">
              <Text className="font-body-medium text-xs text-muted-foreground">
                {labelFor(equipmentOptions, exercise.equipment, t)}
              </Text>
            </View>
          )}
        </View>

        <Text className="mt-6 font-body-semibold text-sm text-foreground">
          {t("panel:workout.builder.exerciseDetail.instructionsLabel")}
        </Text>

        {steps && steps.length > 0 ? (
          <View className="mt-3 gap-3">
            {steps.map((step, i) => (
              <View key={i} className="flex-row gap-3">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-primary/15">
                  <Text className="font-mono text-xs text-primary">{i + 1}</Text>
                </View>
                <Text className="flex-1 font-body text-sm text-muted-foreground">{step}</Text>
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
  );
}
