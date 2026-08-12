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
    // flexGrow (not `flex: 1`) on purpose. `flex: 1` also sets flexBasis to 0,
    // which collapses the button to zero height whenever it sits in a column
    // whose height comes from its content — i.e. every stacked list of
    // options. flexGrow alone keeps the content height as the baseline and
    // still stretches to match a taller sibling when the row gives it a
    // definite height to fill.
    <PressableScale onPress={onPress} style={{ flexGrow: 1 }}>
      <View
        style={{ flexGrow: 1 }}
        className={cn(
          "items-center justify-center rounded-tile border p-4",
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
