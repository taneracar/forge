import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function KiloScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 24 }}
    >
      <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
        Kilo
      </Text>
      <Text className="mt-3 font-display text-4xl uppercase text-foreground">
        Kilo Takibi
      </Text>
      <Text className="mt-4 font-body text-muted-foreground">
        Günlük kilonu gir, haftalık ve aylık trendini grafikte gör.
      </Text>
      <Text className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Yakında
      </Text>
    </View>
  );
}
