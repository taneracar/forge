import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Haptics are a no-op on web; guarding here keeps call sites free of
// Platform checks and keeps the web export from throwing.
const enabled = Platform.OS === "ios" || Platform.OS === "android";

export const haptics = {
  /** Light tap — selecting an item, toggling a chip. */
  select() {
    if (enabled) void Haptics.selectionAsync();
  },
  /** Medium tap — primary button presses. */
  press() {
    if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  /** Completing a set, saving a workout. */
  success() {
    if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  /** Validation failures and destructive confirmations. */
  error() {
    if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
