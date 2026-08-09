import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

const STORAGE_KEY = "forge.reminders";

export interface Reminder {
  id: string;
  label: string;
  hour: number;
  minute: number;
  /** expo-notifications weekday numbering: 1 (Sunday) – 7 (Saturday). All 7 present = every day. */
  days: number[];
  enabled: boolean;
  notificationIds: string[];
}

export type ReminderInput = Pick<Reminder, "label" | "hour" | "minute" | "days">;

// Local reminders only fire while the app can wake to show them, so keep
// them visible even when Forge is already in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function loadReminders(): Promise<Reminder[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Reminder[]) : [];
}

export async function persistReminders(reminders: Reminder[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

export function generateReminderId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Every day of the week selected collapses to a single DAILY trigger;
 * otherwise one WEEKLY trigger per selected day, since expo-notifications
 * has no single "these weekdays" trigger shape.
 */
export async function scheduleReminderNotifications(
  input: ReminderInput,
): Promise<string[]> {
  const content: Notifications.NotificationContentInput = {
    title: "Forge",
    body: input.label,
    sound: true,
  };

  if (input.days.length === 7) {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: input.hour,
        minute: input.minute,
      },
    });
    return [id];
  }

  return Promise.all(
    input.days.map((weekday) =>
      Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: input.hour,
          minute: input.minute,
        },
      }),
    ),
  );
}

export async function cancelReminderNotifications(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
