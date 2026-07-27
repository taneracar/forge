import { useEffect, useState } from "react";
import { Text, type TextProps } from "react-native";
import { formatDuration } from "@/lib/workout-calculations";

interface DurationTimerProps extends TextProps {
  startedAt: string;
}

export function DurationTimer({ startedAt, ...props }: DurationTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const seconds = (now - new Date(startedAt).getTime()) / 1000;

  return <Text {...props}>{formatDuration(seconds)}</Text>;
}
