import "@/global.css";
import "@/lib/i18n";
// Registers the foreground notification handler as a side effect so it's
// active from launch, not just once the user visits the Reminders screen.
import "@/lib/notifications";

import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Anton_400Regular } from "@expo-google-fonts/anton";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";

SplashScreen.preventAutoHideAsync();

function useProtectedRoute() {
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasProfile = useAuthStore((state) => state.hasProfile);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (session && hasProfile === null) return;

    const inAuthGroup = segments[0] === "(auth)";
    const onKayit = segments[1] === "kayit";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (session && !hasProfile && !onKayit) {
      router.replace("/(auth)/kayit");
    } else if (session && hasProfile && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, isLoading, hasProfile, segments, router]);
}

export default function RootLayout() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const session = useAuthStore((state) => state.session);
  const hasProfile = useAuthStore((state) => state.hasProfile);
  const setSession = useAuthStore((state) => state.setSession);
  const setHasProfile = useAuthStore((state) => state.setHasProfile);

  const [fontsLoaded] = useFonts({
    Anton_400Regular,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    JetBrainsMono_400Regular,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, [setSession]);

  useEffect(() => {
    const userId = session?.user.id;

    if (!userId) {
      setHasProfile(null);
      return;
    }

    supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setHasProfile(!!data);
      });
  }, [session?.user.id, setHasProfile]);

  useProtectedRoute();

  const readyToRender =
    fontsLoaded && !isLoading && !(session && hasProfile === null);

  useEffect(() => {
    if (readyToRender) SplashScreen.hideAsync();
  }, [readyToRender]);

  if (!readyToRender) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
