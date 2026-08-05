import { View, useWindowDimensions } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { Colors } from "@/constants/colors";

/**
 * Fixed, non-scrolling glow behind screen content — the flat background
 * otherwise reads as an empty void once a screen's content doesn't fill the
 * viewport. Kept subtle (max ~14% opacity) so it adds depth, not noise.
 */
export function AmbientBackground() {
  const { width, height } = useWindowDimensions();
  const glowHeight = height * 0.55;

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: glowHeight }}>
      <Svg width={width} height={glowHeight} viewBox={`0 0 ${width} ${glowHeight}`}>
        <Defs>
          <RadialGradient id="ambientPrimary" cx="85%" cy="0%" r="65%">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity={0.14} />
            <Stop offset="1" stopColor={Colors.primary} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="ambientAlt" cx="5%" cy="30%" r="45%">
            <Stop offset="0" stopColor={Colors.chartAlt} stopOpacity={0.08} />
            <Stop offset="1" stopColor={Colors.chartAlt} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#ambientPrimary)" />
        <Rect width="100%" height="100%" fill="url(#ambientAlt)" />
      </Svg>
    </View>
  );
}
