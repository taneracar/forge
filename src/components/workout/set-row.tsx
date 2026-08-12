import { View, Text, Pressable } from "react-native";
import { Check, Trophy, X } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";
import { NumberPill } from "@/components/ui/number-pill";
import { haptics } from "@/lib/haptics";

/** Shared column widths so the header row lines up with the set rows. */
export const SET_COLUMNS = { badge: 28, check: 44, remove: 22, gap: 8 };

interface SetRowProps {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  isPR?: boolean;
  /** Prescribed rep range for this set, e.g. "8–12". */
  target?: string;
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
  target,
  onChangeWeight,
  onChangeReps,
  onToggleComplete,
  onDelete,
}: SetRowProps) {
  return (
    <View
      className={cn(
        "flex-row items-center rounded-tile px-1.5 py-1.5",
        completed && "bg-success/10",
      )}
      style={{ gap: SET_COLUMNS.gap }}
    >
      <View
        style={{ width: SET_COLUMNS.badge, height: SET_COLUMNS.badge }}
        className={cn(
          "items-center justify-center rounded-full",
          isPR ? "bg-warning/20" : completed ? "bg-success/20" : "bg-surface-overlay",
        )}
      >
        {isPR ? (
          <Trophy color={Colors.warning} size={13} />
        ) : (
          <Text
            className={cn(
              "font-mono text-xs",
              completed ? "text-success" : "text-muted-foreground",
            )}
          >
            {setNumber}
          </Text>
        )}
      </View>

      <NumberPill
        className="flex-1"
        value={weight}
        onChange={onChangeWeight}
        step={2.5}
        muted={completed}
      />
      <View className="flex-1">
        <NumberPill value={reps} onChange={onChangeReps} step={1} muted={completed} />
        {target && (
          // The prescription sits under the actual, so the logged number
          // stays the prominent one while the target is still visible.
          <Text className="mt-0.5 text-center font-mono text-[10px] text-muted-foreground">
            {target}
          </Text>
        )}
      </View>

      <Pressable
        onPress={() => {
          if (!completed) haptics.success();
          onToggleComplete();
        }}
        style={{ width: SET_COLUMNS.check, height: SET_COLUMNS.check }}
        className={cn(
          "items-center justify-center rounded-tile border",
          completed ? "border-success bg-success" : "border-border-strong bg-surface-overlay",
        )}
      >
        <Check
          color={completed ? Colors.successForeground : Colors.mutedForeground}
          size={20}
          strokeWidth={3}
        />
      </Pressable>

      <Pressable
        onPress={() => {
          haptics.select();
          onDelete();
        }}
        hitSlop={10}
        style={{ width: SET_COLUMNS.remove }}
        className="items-center justify-center"
      >
        <X color={Colors.muted} size={16} />
      </Pressable>
    </View>
  );
}
