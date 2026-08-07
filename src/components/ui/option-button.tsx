import { View, Text } from "react-native";
import { PressableScale } from "@/components/ui/pressable-scale";
import { cn } from "@/lib/cn";

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionButton({ label, selected, onPress }: OptionButtonProps) {
  return (
    <PressableScale onPress={onPress}>
      <View
        className={cn(
          "rounded-tile border p-4",
          selected ? "border-primary bg-primary/15" : "border-border-strong bg-surface-raised",
        )}
      >
        <Text
          className={cn(
            "font-body-medium text-sm",
            selected ? "text-primary" : "text-foreground",
          )}
        >
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
