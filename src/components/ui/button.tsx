import { useState, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  Text,
  View,
  ActivityIndicator,
  type PressableProps,
} from "react-native";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: string;
  className?: string;
  icon?: ReactNode;
  loading?: boolean;
  /** Set false for low-stakes/repeated presses. */
  haptic?: boolean;
}

const variantContainer: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  outline: "border border-border-strong bg-surface-raised",
  ghost: "",
  danger: "bg-danger",
};

const variantText: Record<ButtonVariant, string> = {
  primary: "text-primary-foreground",
  outline: "text-foreground",
  ghost: "text-muted-foreground",
  danger: "text-danger-foreground",
};

const sizeContainer: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5 rounded-tile",
  md: "px-7 py-4 rounded-tile",
  lg: "px-8 py-5 rounded-card",
};

const sizeText: Record<ButtonSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  icon,
  loading = false,
  haptic = true,
  disabled,
  onPress,
  ...props
}: ButtonProps) {
  // RN's Animated (method-based) rather than a Reanimated shared value: the
  // React Compiler lint treats `sharedValue.value = ...` in an event handler
  // as mutating an immutable binding.
  const [scale] = useState(() => new Animated.Value(1));
  const isDisabled = disabled || loading;

  function springTo(toValue: number) {
    Animated.spring(scale, {
      toValue,
      damping: 18,
      stiffness: 320,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      disabled={isDisabled}
      onPressIn={() => springTo(0.96)}
      onPressOut={() => springTo(1)}
      onPress={(event) => {
        if (haptic) haptics.press();
        onPress?.(event);
      }}
      {...props}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View
          className={cn(
            "flex-row items-center justify-center gap-2",
            sizeContainer[size],
            variantContainer[variant],
            isDisabled && "opacity-50",
            className,
          )}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={variant === "primary" ? Colors.primaryForeground : Colors.foreground}
            />
          ) : (
            <>
              {icon}
              <Text
                className={cn(
                  "font-body-semibold tracking-wide",
                  sizeText[size],
                  variantText[variant],
                )}
              >
                {children}
              </Text>
            </>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}
