import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const email = useAuthStore((state) => state.session?.user.email);

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
      <Text className="mt-4 font-body text-foreground">{email}</Text>
      <Text className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Mevcut kilon, hedef kilon ve antrenman serin burada olacak — yakında.
      </Text>

      <View className="mt-8">
        <Button variant="outline" onPress={() => supabase.auth.signOut()}>
          Çıkış Yap
        </Button>
      </View>
    </View>
  );
}
