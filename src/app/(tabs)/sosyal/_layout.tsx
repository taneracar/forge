import { Stack } from "expo-router";

export default function SosyalLayout() {
  return (
    // Card presentation (not fullScreenModal) so iOS keeps its native
    // swipe-from-left-edge back gesture, matching the Antrenman stack.
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[userId]/index" />
      <Stack.Screen name="[userId]/followers" />
      <Stack.Screen name="[userId]/following" />
    </Stack>
  );
}
