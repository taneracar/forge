import { View, Text, Pressable } from "react-native";
import { Check, Trash2, Trophy } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";
import { WeightRepsInput } from "@/components/workout/weight-reps-input";

interface SetRowProps {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  isPR?: boolean;
  weightLabel: string;
  repsLabel: string;
  setLabel: string;
  onChangeWeight: (value: number) => void;
  onChangeReps: (value: number) => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function SetRow({
  setNumber,
  weight,
  reps,
  completed,
  isPR,
  weightLabel,
  repsLabel,
  setLabel,
  onChangeWeight,
  onChangeReps,
  onToggleComplete,
  onDelete,
}: SetRowProps) {
  return (
    <View
      className={cn(
        "gap-3 rounded-md border p-3",
        completed ? "border-primary/40 bg-surface-raised" : "border-border bg-surface",
      )}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {setLabel} {setNumber}
          </Text>
          {isPR && (
            <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
              <Trophy color={Colors.primary} size={10} />
              <Text className="font-mono text-[10px] uppercase text-primary">PR</Text>
            </View>
          )}
        </View>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Trash2 color={Colors.mutedForeground} size={16} />
        </Pressable>
      </View>

      <View className="flex-row items-end gap-3">
        <WeightRepsInput
          weight={weight}
          reps={reps}
          onChangeWeight={onChangeWeight}
          onChangeReps={onChangeReps}
          weightLabel={weightLabel}
          repsLabel={repsLabel}
        />
        <Pressable
          onPress={onToggleComplete}
          className={cn(
            "h-10 w-10 items-center justify-center rounded-md border",
            completed ? "border-primary bg-primary" : "border-border",
          )}
        >
          <Check
            color={completed ? Colors.primaryForeground : Colors.mutedForeground}
            size={18}
          />
        </Pressable>
      </View>
    </View>
  );
}
