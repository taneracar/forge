import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { cn } from "@/lib/cn";

type BadgeTone = "primary" | "success" | "danger" | "warning" | "neutral";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
}

const toneContainer: Record<BadgeTone, string> = {
  primary: "bg-primary/15",
  success: "bg-success/15",
  danger: "bg-danger/15",
  warning: "bg-warning/15",
  neutral: "bg-surface-overlay",
};

const toneText: Record<BadgeTone, string> = {
  primary: "text-primary",
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
  neutral: "text-muted-foreground",
};

export function Badge({ label, tone = "primary", icon, className }: BadgeProps) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-1 rounded-full px-2 py-0.5",
        toneContainer[tone],
        className,
      )}
    >
      {icon}
      <Text className={cn("font-body-semibold text-[10px]", toneText[tone])}>{label}</Text>
    </View>
  );
}
