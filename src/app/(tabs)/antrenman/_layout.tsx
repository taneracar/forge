import { Stack } from "expo-router";

export default function AntrenmanLayout() {
  return (
    // Card presentation (not fullScreenModal) so iOS keeps its native
    // swipe-from-left-edge back gesture on every screen.
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="builder/[workoutId]" />
      <Stack.Screen name="session/[sessionId]" />
      <Stack.Screen name="history/index" />
      <Stack.Screen name="history/[sessionId]" />
      <Stack.Screen name="workouts/index" />
      <Stack.Screen name="templates/index" />
      <Stack.Screen name="templates/[templateId]" />
    </Stack>
  );
}
