import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
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
        className="flex-1 bg-background px-6"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-2xl uppercase text-foreground">
            {t("panel:workout.builder.pickExercise")}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X color={Colors.foreground} size={22} />
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
          contentContainerStyle={{ gap: 8 }}
        >
          <Pressable
            onPress={() => setMuscleGroup(null)}
            className={cn(
              "rounded-full border px-3 py-1.5",
              muscleGroup === null ? "border-primary bg-surface-raised" : "border-border",
            )}
          >
            <Text
              className={cn(
                "font-mono text-xs uppercase",
                muscleGroup === null ? "text-primary" : "text-muted-foreground",
              )}
            >
              {t("panel:workout.builder.allMuscleGroups")}
            </Text>
          </Pressable>
          {muscleGroupOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setMuscleGroup(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1.5",
                muscleGroup === opt.value
                  ? "border-primary bg-surface-raised"
                  : "border-border",
              )}
            >
              <Text
                className={cn(
                  "font-mono text-xs uppercase",
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
          ListEmptyComponent={
            <Text className="mt-8 text-center font-body text-sm text-muted-foreground">
              {t("panel:workout.builder.noResults")}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item)}
              className="border-b border-border py-4"
            >
              <Text className="font-body-semibold text-base text-foreground">{item.name}</Text>
              <Text className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {labelFor(muscleGroupOptions, item.muscle_group, t)}
                {item.equipment ? ` · ${labelFor(equipmentOptions, item.equipment, t)}` : ""}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
