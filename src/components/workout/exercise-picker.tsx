import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Dumbbell, Plus, Search, X } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { haptics } from "@/lib/haptics";
import { Colors } from "@/constants/colors";
import { searchExercises, type Exercise } from "@/lib/exercises";
import { muscleGroupOptions, equipmentOptions } from "@/lib/workout-schema";
import { labelFor } from "@/lib/profile-schema";

interface ExercisePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export function ExercisePicker({ visible, onClose, onSelect }: ExercisePickerProps) {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  const [results, setResults] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!visible) return;
    searchExercises(query, muscleGroup ?? undefined).then(setResults);
  }, [visible, query, muscleGroup]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
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
                onSelect(item);
                onClose();
              }}
            >
              <Card className="flex-row items-center gap-3 py-3">
                <View className="h-9 w-9 items-center justify-center rounded-tile bg-surface-overlay">
                  <Dumbbell color={Colors.mutedForeground} size={16} />
                </View>
                <View className="flex-1">
                  <Text className="font-body-semibold text-sm text-foreground">
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                    {labelFor(muscleGroupOptions, item.muscle_group, t)}
                    {item.equipment
                      ? ` · ${labelFor(equipmentOptions, item.equipment, t)}`
                      : ""}
                  </Text>
                </View>
                <Plus color={Colors.primary} size={18} />
              </Card>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
