import { create } from "zustand";
import {
  cancelReminderNotifications,
  generateReminderId,
  loadReminders,
  persistReminders,
  requestNotificationPermission,
  scheduleReminderNotifications,
  type Reminder,
  type ReminderInput,
} from "@/lib/notifications";

interface RemindersState {
  reminders: Reminder[];
  loading: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  /** Returns false when notification permission was denied — the caller
      shows the "enable notifications in Settings" message in that case. */
  addReminder: (input: ReminderInput) => Promise<boolean>;
  toggleReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

export const useRemindersStore = create<RemindersState>((set, get) => ({
  reminders: [],
  loading: false,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    set({ loading: true });
    const reminders = await loadReminders();
    set({ reminders, loading: false, loaded: true });
  },

  addReminder: async (input) => {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    const notificationIds = await scheduleReminderNotifications(input);
    const reminder: Reminder = {
      id: generateReminderId(),
      ...input,
      enabled: true,
      notificationIds,
    };
    const next = [...get().reminders, reminder];
    set({ reminders: next });
    await persistReminders(next);
    return true;
  },

  toggleReminder: async (id) => {
    const reminders = get().reminders;
    const target = reminders.find((r) => r.id === id);
    if (!target) return;

    if (target.enabled) {
      await cancelReminderNotifications(target.notificationIds);
      const next = reminders.map((r) =>
        r.id === id ? { ...r, enabled: false, notificationIds: [] } : r,
      );
      set({ reminders: next });
      await persistReminders(next);
      return;
    }

    const granted = await requestNotificationPermission();
    if (!granted) return;
    const notificationIds = await scheduleReminderNotifications(target);
    const next = reminders.map((r) => (r.id === id ? { ...r, enabled: true, notificationIds } : r));
    set({ reminders: next });
    await persistReminders(next);
  },

  deleteReminder: async (id) => {
    const reminders = get().reminders;
    const target = reminders.find((r) => r.id === id);
    if (target?.notificationIds.length) {
      await cancelReminderNotifications(target.notificationIds);
    }
    const next = reminders.filter((r) => r.id !== id);
    set({ reminders: next });
    await persistReminders(next);
  },
}));
