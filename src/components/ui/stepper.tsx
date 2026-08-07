import { View } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Colors } from "@/constants/colors";

interface StepperProps {
  value: number | undefined;
  onChange: (value: number) => void;
  step: number;
  fallback: number;
}

export function Stepper({ value, onChange, step, fallback }: StepperProps) {
  const current = value ?? fallback;
  return (
    <View className="flex-row gap-2">
      <PressableScale onPress={() => onChange(current - step)}>
        <View className="h-12 w-12 items-center justify-center rounded-tile border border-border-strong bg-surface-raised">
          <Minus color={Colors.foreground} size={16} />
        </View>
      </PressableScale>
      <PressableScale onPress={() => onChange(current + step)}>
        <View className="h-12 w-12 items-center justify-center rounded-tile border border-border-strong bg-surface-raised">
          <Plus color={Colors.foreground} size={16} />
        </View>
      </PressableScale>
    </View>
  );
}
