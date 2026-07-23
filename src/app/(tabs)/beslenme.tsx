import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BeslenmeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 24 }}
    >
      <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
        Beslenme
      </Text>
      <Text className="mt-3 font-display text-4xl uppercase text-foreground">
        Öğünlerin
      </Text>
      <Text className="mt-4 font-body text-muted-foreground">
        Kahvaltı, öğle, akşam ve ara öğünlerini kaydet, kalori ve makrolarını
        takip et.
      </Text>
      <Text className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Yakında
      </Text>
    </View>
  );
}
