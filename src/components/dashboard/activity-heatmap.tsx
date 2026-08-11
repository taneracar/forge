import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import type { ActivityDay } from "@/lib/workouts";

interface ActivityHeatmapProps {
  weeks: ActivityDay[][];
  weekStreak: number;
  bestWeekStreak: number;
  totalSessions: number;
}

const DAY_LABEL_ROWS = [0, 2, 4]; // Mon, Wed, Fri

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5">
      <Text className="font-display text-xl" style={{ color }}>
        {value}
      </Text>
      <Text className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}

export function ActivityHeatmap({
  weeks,
  weekStreak,
  bestWeekStreak,
  totalSessions,
}: ActivityHeatmapProps) {
  const { t, i18n } = useTranslation("panel");

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-lg uppercase text-foreground">
          {t("dashboard.activity.title")}
        </Text>
        <Text className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("dashboard.activity.allTime")}
        </Text>
      </View>

      <View className="mt-3 flex-row gap-5">
        <Stat value={weekStreak} label={t("dashboard.activity.wkStreak")} color="#FF5A1F" />
        <Stat value={totalSessions} label={t("dashboard.activity.total")} color="#F7F3EC" />
        <Stat value={bestWeekStreak} label={t("dashboard.activity.best")} color="#FFB627" />
      </View>

      <View className="mt-4 flex-row gap-2">
        <View className="justify-between py-[15px]">
          {DAY_LABEL_ROWS.map((row) => (
            <Text key={row} className="font-mono text-[9px] text-muted-foreground">
              {weeks[weeks.length - 1]?.[row]?.date.toLocaleDateString(i18n.language, {
                weekday: "narrow",
              })}
            </Text>
          ))}
        </View>

        <View className="flex-1 gap-[3px]">
          <View className="flex-row justify-between">
            {weeks.map((week, i) => {
              const monday = week[0]!.date;
              const prevMonday = weeks[i - 1]?.[0]?.date;
              const isNewMonth = i === 0 || monday.getMonth() !== prevMonday?.getMonth();
              return (
                <Text
                  key={monday.toISOString()}
                  className="flex-1 font-mono text-[9px] text-muted-foreground"
                >
                  {isNewMonth ? monday.toLocaleDateString(i18n.language, { month: "short" }) : ""}
                </Text>
              );
            })}
          </View>
          <View className="flex-row gap-[3px]">
            {weeks.map((week) => (
              <View key={week[0]!.date.toISOString()} className="flex-1 gap-[3px]">
                {week.map((day) => (
                  <View
                    key={day.date.toISOString()}
                    className={cn(
                      "aspect-square rounded-[2px]",
                      day.active ? "bg-primary" : "bg-surface-raised",
                    )}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
