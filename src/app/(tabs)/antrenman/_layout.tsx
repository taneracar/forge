import { Stack } from "expo-router";

export default function AntrenmanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="builder/[workoutId]" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="session/[sessionId]" options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="history/index" />
      <Stack.Screen name="history/[sessionId]" />
    </Stack>
  );
}
