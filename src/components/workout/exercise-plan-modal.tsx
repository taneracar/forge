import { useState } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Minus, Plus, X } from "lucide-react-native";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import {
  DEFAULT_REST_SECONDS,
  MAX_SETS,
  defaultPlannedSet,
  type PlannedExercise,
  type PlannedSet,
} from "@/lib/workout-plan";

interface ExercisePlanModalProps {
  visible: boolean;
  exercise: PlannedExercise | null;
  onClose: () => void;
  onSave: (exercise: PlannedExercise) => void;
}

export function ExercisePlanModal({
  visible,
  exercise,
  onClose,
  onSave,
}: ExercisePlanModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Keyed by the exercise so each open starts from that exercise's own
          plan instead of syncing props into state via an effect. */}
      {visible && exercise && (
        <PlanContent
          key={exercise.key}
          exercise={exercise}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  );
}

/** Compact -/+ pair around a value, used for every number on this screen. */
function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
  min: number;
  max: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={() => {
          haptics.select();
          onChange(value === null ? min : Math.max(min, value - step));
        }}
        hitSlop={6}
        className="h-7 w-7 items-center justify-center rounded-full active:bg-surface-overlay"
      >
        <Minus color={Colors.primary} size={14} />
      </Pressable>
      <Text className="min-w-8 text-center font-mono text-base text-foreground">
        {value ?? placeholder ?? "—"}
      </Text>
      <Pressable
        onPress={() => {
          haptics.select();
          onChange(value === null ? min : Math.min(max, value + step));
        }}
        hitSlop={6}
        className="h-7 w-7 items-center justify-center rounded-full active:bg-surface-overlay"
      >
        <Plus color={Colors.muted} size={14} />
      </Pressable>
    </View>
  );
}

function PlanContent({
  exercise,
  onClose,
  onSave,
}: Omit<ExercisePlanModalProps, "visible"> & { exercise: PlannedExercise }) {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();

  const [sets, setSets] = useState<PlannedSet[]>(exercise.sets);
  const [restSeconds, setRestSeconds] = useState(exercise.restSeconds);
  const [notes, setNotes] = useState(exercise.notes);

  function patchSet(index: number, patch: Partial<PlannedSet>) {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  return (
    <View className="flex-1 bg-background">
      <AmbientBackground />
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-start justify-between gap-3">
          <Text className="flex-1 font-display text-2xl uppercase text-foreground">
            {exercise.name}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
          >
            <X color={Colors.foreground} size={18} />
          </Pressable>
        </View>

        <View className="mt-6 flex-row items-center justify-between">
          <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {t("panel:workout.plan.restLabel")}
          </Text>
          <View className="flex-row items-center gap-2">
            <Stepper
              value={restSeconds}
              onChange={(next) => setRestSeconds(next ?? DEFAULT_REST_SECONDS)}
              min={0}
              max={600}
              step={15}
            />
            <Text className="font-body text-xs text-muted-foreground">
              {t("panel:workout.plan.secondsSuffix")}
            </Text>
          </View>
        </View>

        <View className="mt-4">
          <Input
            placeholder={t("panel:workout.plan.notesPlaceholder")}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <View className="mt-7 flex-row items-center">
          <Text className="w-10 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("panel:workout.plan.setLabel")}
          </Text>
          <Text className="flex-1 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("panel:workout.plan.repsLabel")}
          </Text>
          <Text className="w-20 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("panel:workout.plan.rirLabel")}
          </Text>
          <View className="w-8" />
        </View>

        <View className="mt-2 gap-2">
          {sets.map((set, index) => (
            <View
              key={index}
              className="flex-row items-center rounded-tile bg-surface-raised py-2.5"
            >
              <View className="w-10 items-center">
                <Text className="font-mono text-sm text-muted-foreground">{index + 1}</Text>
              </View>

              <View className="flex-1 flex-row items-center justify-center gap-2">
                <Stepper
                  value={set.repsMin}
                  onChange={(next) =>
                    patchSet(index, {
                      repsMin: next,
                      // Keep the range coherent instead of allowing min > max.
                      repsMax:
                        next !== null && set.repsMax !== null && next > set.repsMax
                          ? next
                          : set.repsMax,
                    })
                  }
                  min={1}
                  max={100}
                />
                <Text className="font-body text-muted-foreground">–</Text>
                <Stepper
                  value={set.repsMax}
                  onChange={(next) =>
                    patchSet(index, {
                      repsMax: next,
                      repsMin:
                        next !== null && set.repsMin !== null && next < set.repsMin
                          ? next
                          : set.repsMin,
                    })
                  }
                  min={1}
                  max={100}
                />
              </View>

              <View className="w-20 items-center">
                <Stepper
                  value={set.rir}
                  onChange={(next) => patchSet(index, { rir: next })}
                  min={0}
                  max={10}
                  placeholder="—"
                />
              </View>

              <Pressable
                onPress={() => {
                  haptics.select();
                  setSets((prev) => prev.filter((_, i) => i !== index));
                }}
                hitSlop={6}
                disabled={sets.length === 1}
                className="w-8 items-center justify-center"
              >
                <X color={sets.length === 1 ? Colors.muted : Colors.danger} size={16} />
              </Pressable>
            </View>
          ))}
        </View>

        {sets.length < MAX_SETS && (
          <Pressable
            onPress={() => {
              haptics.select();
              // New sets copy the last one — a plan is usually uniform, and
              // copying beats retyping 8–12 for every added row.
              setSets((prev) => [...prev, { ...(prev[prev.length - 1] ?? defaultPlannedSet()) }]);
            }}
            className="mt-3 flex-row items-center justify-center gap-2 rounded-tile border border-dashed border-border-strong py-3.5 active:bg-surface-raised"
          >
            <Plus color={Colors.primary} size={16} />
            <Text className="font-body-medium text-sm text-primary">
              {t("panel:workout.plan.addSetButton")}
            </Text>
          </Pressable>
        )}

        <View className="mt-8">
          <Button
            variant="primary"
            size="lg"
            onPress={() => {
              onSave({ ...exercise, sets, restSeconds, notes });
              onClose();
            }}
          >
            {t("common:buttons.save")}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
