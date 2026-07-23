import { View, Text } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);

  function handleMockLogin() {
    login();
    router.replace("/(tabs)");
  }

  return (
    <View className="flex-1 items-center justify-center gap-8 bg-background px-6">
      <Text className="font-display text-4xl uppercase text-foreground">
        FOR<Text className="text-primary">GE</Text>
      </Text>
      <Text className="text-center font-body text-muted-foreground">
        Antrenmanına kaldığın yerden devam et.
      </Text>
      <Button variant="primary" onPress={handleMockLogin} className="w-full">
        Giriş Yap
      </Button>
    </View>
  );
}
