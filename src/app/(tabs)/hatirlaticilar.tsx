import { useCallback, useState } from "react";
import { View, Text, Pressable, Switch, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { Bell, Plus, Trash2 } from "lucide-react-native";
import { AddReminderModal } from "@/components/reminders/add-reminder-modal";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { useRemindersStore } from "@/store/reminders.store";
import type { Reminder } from "@/lib/notifications";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDays(days: number[], t: (key: string) => string) {
  if (days.length === 7) return t("panel:reminders.everyDayLabel");
  return [...days]
    .sort((a, b) => (a === 1 ? 8 : a) - (b === 1 ? 8 : b))
    .map((weekday) => t(`panel:reminders.days.${DAY_KEYS[weekday - 1]}`))
    .join(", ");
}

export default function RemindersScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const reminders = useRemindersStore((state) => state.reminders);
  const loading = useRemindersStore((state) => state.loading);
  const load = useRemindersStore((state) => state.load);
  const addReminder = useRemindersStore((state) => state.addReminder);
  const toggleReminder = useRemindersStore((state) => state.toggleReminder);
  const deleteReminder = useRemindersStore((state) => state.deleteReminder);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function handleDelete(reminder: Reminder) {
    Alert.alert(
      t("panel:reminders.deleteConfirmTitle"),
      t("panel:reminders.deleteConfirmMessage", { name: reminder.label }),
      [
        { text: t("common:buttons.cancel"), style: "cancel" },
        {
          text: t("common:buttons.delete"),
          style: "destructive",
          onPress: () => deleteReminder(reminder.id),
        },
      ],
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center gap-2">
        <BackButton fallbackHref="/(tabs)/profil" />
        <Text className="flex-1 font-display text-2xl uppercase text-foreground">
          {t("panel:reminders.title")}
        </Text>
      </View>

      {loading ? (
        <View className="mt-6 gap-2">
          <Skeleton height={72} />
          <Skeleton height={72} />
        </View>
      ) : reminders.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Bell color={Colors.mutedForeground} size={24} />}
          title={t("panel:reminders.emptyState")}
          description={t("panel:reminders.emptyStateDescription")}
        />
      ) : (
        <View className="mt-5 gap-2">
          {reminders.map((reminder, index) => (
            <Animated.View
              key={reminder.id}
              entering={FadeInDown.duration(260).delay(Math.min(index, 8) * 40)}
              layout={LinearTransition.duration(220)}
            >
              <Card className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-tile bg-primary/15">
                  <Bell color={Colors.primary} size={17} />
                </View>
                <View className="flex-1">
                  <Text className="font-body-semibold text-sm text-foreground">
                    {reminder.label}
                  </Text>
                  <Text className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {formatTime(reminder.hour, reminder.minute)} · {formatDays(reminder.days, t)}
                  </Text>
                </View>
                <Switch
                  value={reminder.enabled}
                  onValueChange={() => {
                    haptics.select();
                    toggleReminder(reminder.id);
                  }}
                  trackColor={{ false: Colors.surfaceOverlay, true: Colors.primary }}
                  thumbColor={Colors.foreground}
                />
                <Pressable
                  onPress={() => handleDelete(reminder)}
                  hitSlop={8}
                  className="h-8 w-8 items-center justify-center rounded-tile active:bg-surface-overlay"
                >
                  <Trash2 color={Colors.danger} size={16} />
                </Pressable>
              </Card>
            </Animated.View>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => {
          haptics.select();
          setModalVisible(true);
        }}
        className="mt-4 flex-row items-center justify-center gap-2 rounded-tile border border-dashed border-border-strong py-3.5 active:bg-surface-raised"
      >
        <Plus color={Colors.primary} size={16} />
        <Text className="font-body-medium text-sm text-primary">
          {t("panel:reminders.addButton")}
        </Text>
      </Pressable>

      <AddReminderModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={addReminder}
      />
    </Screen>
  );
}
