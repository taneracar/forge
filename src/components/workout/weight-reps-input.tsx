import { View, Text, TextInput, Pressable } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { Colors } from "@/constants/colors";

interface NumberFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  step: number;
}

function NumberField({ label, value, onChange, step }: NumberFieldProps) {
  const current = value ?? 0;
  return (
    <View className="flex-1 gap-1.5">
      <Text className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <View className="flex-row items-center gap-1.5">
        <Pressable
          onPress={() => onChange(Math.max(0, current - step))}
          className="h-10 w-10 items-center justify-center rounded-md border border-border"
          hitSlop={4}
        >
          <Minus color={Colors.foreground} size={14} />
        </Pressable>
        <TextInput
          className="flex-1 rounded-md border border-border bg-surface px-2 py-2.5 text-center text-base text-foreground"
          keyboardType="numeric"
          value={String(current)}
          onChangeText={(text) => onChange(text === "" ? 0 : Number(text))}
        />
        <Pressable
          onPress={() => onChange(current + step)}
          className="h-10 w-10 items-center justify-center rounded-md border border-border"
          hitSlop={4}
        >
          <Plus color={Colors.foreground} size={14} />
        </Pressable>
      </View>
    </View>
  );
}

interface WeightRepsInputProps {
  weight: number | null;
  reps: number | null;
  onChangeWeight: (value: number) => void;
  onChangeReps: (value: number) => void;
  weightLabel: string;
  repsLabel: string;
}

export function WeightRepsInput({
  weight,
  reps,
  onChangeWeight,
  onChangeReps,
  weightLabel,
  repsLabel,
}: WeightRepsInputProps) {
  return (
    <View className="flex-1 flex-row gap-3">
      <NumberField label={weightLabel} value={weight} onChange={onChangeWeight} step={2.5} />
      <NumberField label={repsLabel} value={reps} onChange={onChangeReps} step={1} />
    </View>
  );
}
