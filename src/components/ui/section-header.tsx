import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Section title with an optional trailing action. Sentence case on purpose —
 * the old uppercase+wide-tracking mono label was applied everywhere and hurt
 * scanning; mono is now reserved for numeric metrics.
 */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
  className,
}: SectionHeaderProps) {
  return (
    <View className={cn("flex-row items-center justify-between", className)}>
      <Text className="font-body-semibold text-base text-foreground">{title}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8} className="flex-row items-center gap-0.5">
          <Text className="font-body-medium text-sm text-primary">{actionLabel}</Text>
          <ChevronRight color={Colors.primary} size={16} />
        </Pressable>
      )}
    </View>
  );
}
