import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  icon?: ReactNode;
  className?: string;
}

/** Metric tile. The number uses mono, the label does not. */
export function StatTile({ label, value, unit, icon, className }: StatTileProps) {
  return (
    <Card variant="raised" className={cn("gap-2", className)}>
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="font-body-medium text-xs text-muted-foreground">{label}</Text>
      </View>
      <View className="flex-row items-baseline gap-1">
        <Text className="font-mono text-2xl text-foreground">{value}</Text>
        {unit && <Text className="font-body-medium text-xs text-muted-foreground">{unit}</Text>}
      </View>
    </Card>
  );
}
