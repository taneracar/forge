import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
  height?: number;
}

/** Pulsing placeholder shown while data loads, instead of a blank screen. */
export function Skeleton({ className, height = 16 }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.85, { duration: 850 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    // className (bg/rounded) goes on a plain View — NativeWind's interop
    // doesn't reliably reach Reanimated's Animated.View, which only carries
    // the animated style here.
    <Animated.View style={animatedStyle}>
      <View className={cn("rounded-tile bg-surface-raised", className)} style={{ height }} />
    </Animated.View>
  );
}
