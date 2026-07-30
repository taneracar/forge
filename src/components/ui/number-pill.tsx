import { View, TextInput, Pressable } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";

interface NumberPillProps {
  value: number | null;
  onChange: (value: number) => void;
  step: number;
  className?: string;
  /** Dimmed styling once the set is locked in. */
  muted?: boolean;
}

/**
 * Single rounded control holding [− value +]. One surface with borderless
 * steppers reads far cleaner than three separate bordered boxes.
 */
export function NumberPill({ value, onChange, step, className, muted }: NumberPillProps) {
  const current = value ?? 0;

  function nudge(delta: number) {
    haptics.select();
    onChange(Math.max(0, Math.round((current + delta) * 100) / 100));
  }

  return (
    <View
      className={cn(
        "h-12 min-w-0 flex-row items-center overflow-hidden rounded-tile",
        muted ? "bg-surface" : "bg-surface-overlay",
        className,
      )}
    >
      <Pressable
        onPress={() => nudge(-step)}
        className="h-full w-9 items-center justify-center active:bg-surface-raised"
      >
        <Minus color={Colors.mutedForeground} size={14} />
      </Pressable>
      <TextInput
        className="h-full min-w-0 flex-1 p-0 text-center font-mono text-base text-foreground"
        keyboardType="numeric"
        selectTextOnFocus
        value={String(current)}
        onChangeText={(text) => {
          const parsed = Number(text.replace(",", "."));
          onChange(text === "" || Number.isNaN(parsed) ? 0 : parsed);
        }}
      />
      <Pressable
        onPress={() => nudge(step)}
        className="h-full w-9 items-center justify-center active:bg-surface-raised"
      >
        <Plus color={Colors.mutedForeground} size={14} />
      </Pressable>
    </View>
  );
}
