import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn("items-center rounded-card bg-surface/60 px-6 py-10", className)}>
      {icon && (
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-surface-raised">
          {icon}
        </View>
      )}
      <Text className="text-center font-body-semibold text-base text-foreground">{title}</Text>
      {description && (
        <Text className="mt-1.5 text-center font-body text-sm text-muted-foreground">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-5">
          <Button variant="outline" size="sm" onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}
