import { useState, type ReactNode } from "react";
import { Animated, Pressable, View, type PressableProps } from "react-native";
import { haptics } from "@/lib/haptics";

interface PressableScaleProps extends PressableProps {
  children: ReactNode;
  className?: string;
  /** Set false for low-stakes/repeated presses. */
  haptic?: boolean;
}

/**
 * The press-in/press-out spring scale from `Button` (src/components/ui/button.tsx),
 * extracted for anything else that wants the same tactile feel — RN's
 * `Animated` (not Reanimated) so the scale value can be mutated in the event
 * handler without tripping the React Compiler lint (see Button's own note).
 */
export function PressableScale({
  children,
  className,
  haptic = true,
  disabled,
  onPress,
  ...props
}: PressableScaleProps) {
  const [scale] = useState(() => new Animated.Value(1));

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
      disabled={disabled}
      onPressIn={() => springTo(0.96)}
      onPressOut={() => springTo(1)}
      onPress={(event) => {
        if (haptic) haptics.select();
        onPress?.(event);
      }}
      {...props}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View className={className}>{children}</View>
      </Animated.View>
    </Pressable>
  );
}
