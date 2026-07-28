import { View, Text } from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { Colors } from "@/constants/colors";

export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
}

/**
 * Minimal bar chart on react-native-svg — no charting dependency needed for
 * this shape, and it keeps full control of the design tokens.
 */
export function BarChart({ data, height = 96 }: BarChartProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const gap = 8;
  const barWidth = 100 / data.length;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.primaryGlow} />
            <Stop offset="1" stopColor={Colors.primary} />
          </LinearGradient>
        </Defs>
        {data.map((datum, i) => {
          // Keep zero-volume sessions visible as a stub rather than nothing.
          const barHeight = Math.max((datum.value / max) * height, 3);
          const innerWidth = barWidth - gap / data.length;
          return (
            <Rect
              key={i}
              x={i * barWidth + (barWidth - innerWidth) / 2}
              y={height - barHeight}
              width={innerWidth}
              height={barHeight}
              rx={1.5}
              fill={datum.value > 0 ? "url(#barFill)" : Colors.surfaceOverlay}
            />
          );
        })}
      </Svg>
      <View className="mt-2 flex-row">
        {data.map((datum, i) => (
          <Text
            key={i}
            numberOfLines={1}
            style={{ width: `${barWidth}%` }}
            className="text-center font-body text-[10px] text-muted-foreground"
          >
            {datum.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
