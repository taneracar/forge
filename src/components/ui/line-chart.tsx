import { View, Text } from "react-native";
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Colors } from "@/constants/colors";

export interface LineDatum {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineDatum[];
  height?: number;
}

/**
 * Minimal line chart on react-native-svg, for trends where values cluster
 * tightly (e.g. body weight) — a zero-baseline BarChart would flatten the
 * differences that matter. The y-axis floats to the data's own range instead.
 */
export function LineChart({ data, height = 96 }: LineChartProps) {
  const known = data.filter((d) => d.value > 0);
  if (known.length === 0) return null;

  const values = known.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.2 || 1;
  const domainMin = min - pad;
  const domainRange = max + pad - domainMin;

  const stepX = data.length > 1 ? 100 / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: i * stepX,
    y: d.value > 0 ? height - ((d.value - domainMin) / domainRange) * height : null,
  }));

  const linePoints = points
    .filter((p): p is { x: number; y: number } => p.y !== null)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={Colors.primaryGlow} />
            <Stop offset="1" stopColor={Colors.primary} />
          </LinearGradient>
        </Defs>
        <Polyline
          points={linePoints}
          fill="none"
          stroke="url(#lineStroke)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map(
          (p, i) =>
            p.y !== null && <Circle key={i} cx={p.x} cy={p.y} r={2} fill={Colors.primary} />,
        )}
      </Svg>
      <View className="mt-2 flex-row">
        {data.map((datum, i) => (
          <Text
            key={i}
            numberOfLines={1}
            style={{ width: `${100 / data.length}%` }}
            className="text-center font-body text-[10px] text-muted-foreground"
          >
            {datum.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
