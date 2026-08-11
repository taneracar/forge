import { View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Dumbbell } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";

interface ExerciseImagePlaceholderProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}

/**
 * A local, network-free stand-in for exercise photos/GIFs — a remote URL
 * placeholder never rendered on-device (no network reachability guarantee
 * in dev/test environments), so this is code-drawn instead: same gradient
 * pair as `Card`'s "gradient" variant, so it reads as a deliberate visual
 * rather than a broken image. Swap for real per-exercise media later (see
 * the licensing note on `image_path`/`gif_path` in the exercise import).
 */
export function ExerciseImagePlaceholder({
  className,
  style,
  iconSize = 22,
}: ExerciseImagePlaceholderProps) {
  return (
    <View className={cn("overflow-hidden", className)} style={style}>
      <LinearGradient
        colors={["#2E271F", "#1C1815"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <Dumbbell color={Colors.primary} size={iconSize} />
      </LinearGradient>
    </View>
  );
}
