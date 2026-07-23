import { View, Text } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    router.replace("/(auth)/login");
  }

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 24 }}
    >
      <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
        Profil
      </Text>
      <Text className="mt-3 font-display text-4xl uppercase text-foreground">
        Profilin
      </Text>
      <Text className="mt-4 font-body text-muted-foreground">
        Mevcut kilon, hedef kilon ve antrenman serin burada olacak — yakında.
      </Text>

      <View className="mt-8">
        <Button variant="outline" onPress={handleLogout}>
          Çıkış Yap
        </Button>
      </View>
    </View>
  );
}
