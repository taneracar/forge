import { View, type ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "raised" | "gradient" | "outline";

interface CardProps extends ViewProps {
  variant?: CardVariant;
}

const variantClass: Record<CardVariant, string> = {
  default: "bg-surface border border-border",
  raised: "bg-surface-raised border border-border-strong",
  gradient: "border border-border-strong",
  outline: "border border-border-strong",
};

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  const base = cn("rounded-card p-4", variantClass[variant], className);

  if (variant === "gradient") {
    return (
      // NativeWind's className interop only reliably targets core RN
      // primitives, not third-party wrappers like LinearGradient — so the
      // caller's layout className goes on a plain inner View, not the
      // gradient itself, or classes like flex-row silently no-op.
      <View
        className={cn("overflow-hidden rounded-card", variantClass[variant])}
        {...props}
      >
        <LinearGradient
          // Subtle top-left lift so the card reads as a raised surface
          // instead of a flat rectangle.
          colors={["#2E271F", "#1C1815"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16 }}
        >
          <View className={className}>{children}</View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className={base} {...props}>
      {children}
    </View>
  );
}
