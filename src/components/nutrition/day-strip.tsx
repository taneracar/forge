import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { haptics } from "@/lib/haptics";
import { mondayOfWeek } from "@/lib/nutrition";

interface DayStripProps {
  selected: Date;
  /** Calorie total per day, keyed by `Date.toDateString()`. */
  totalsByDate: Map<string, number>;
  onSelect: (date: Date) => void;
}

/**
 * Mon–Sun strip for the calendar week containing `selected`. Future days stay
 * tappable but render dimmed — you can't have logged a meal tomorrow, and the
 * dim state says so without disabling the control outright.
 */
export function DayStrip({ selected, totalsByDate, onSelect }: DayStripProps) {
  const { i18n } = useTranslation();
  const monday = mondayOfWeek(selected);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <View className="flex-row">
      {days.map((date) => {
        const isSelected = date.toDateString() === selected.toDateString();
        const isToday = date.toDateString() === today.toDateString();
        const isFuture = date > today;
        const hasEntries = (totalsByDate.get(date.toDateString()) ?? 0) > 0;

        return (
          <Pressable
            key={date.toISOString()}
            onPress={() => {
              haptics.select();
              onSelect(date);
            }}
            className="flex-1 items-center gap-1.5 py-1"
          >
            <Text
              className={cn(
                "font-mono text-[10px] uppercase",
                isToday ? "text-primary" : "text-muted-foreground",
                isFuture && "opacity-40",
              )}
            >
              {date.toLocaleDateString(i18n.language, { weekday: "narrow" })}
            </Text>
            <View
              className={cn(
                "h-9 w-9 items-center justify-center rounded-full",
                isSelected && "bg-primary",
              )}
            >
              <Text
                className={cn(
                  "font-mono text-sm",
                  isSelected
                    ? "text-primary-foreground"
                    : isToday
                      ? "text-primary"
                      : "text-foreground",
                  isFuture && !isSelected && "opacity-40",
                )}
              >
                {date.getDate()}
              </Text>
            </View>
            <View
              className={cn(
                "h-1 w-1 rounded-full",
                hasEntries ? "bg-primary" : "bg-border-strong",
              )}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
