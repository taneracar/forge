import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SuScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 24 }}
    >
      <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
        Su
      </Text>
      <Text className="mt-3 font-display text-4xl uppercase text-foreground">
        Su Takibi
      </Text>
      <Text className="mt-4 font-body text-muted-foreground">
        Günlük su tüketimini tek dokunuşla kaydet.
      </Text>
      <Text className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Yakında
      </Text>
    </View>
  );
}
