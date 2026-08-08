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
    // flex:1 lets this stretch to match a taller sibling (e.g. a two-line
    // label next to single-line ones) instead of staying content-sized.
    <PressableScale onPress={onPress} style={{ flex: 1 }}>
      <View
        className={cn(
          "flex-1 items-center justify-center rounded-tile border p-4",
          selected ? "border-primary bg-primary/15" : "border-border-strong bg-surface-raised",
        )}
      >
        <Text
          className={cn(
            "text-center font-body-medium text-sm",
            selected ? "text-primary" : "text-foreground",
          )}
        >
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
