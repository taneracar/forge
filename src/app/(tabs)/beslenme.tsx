import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function BeslenmeScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 24 }}
    >
      <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
        {t("panel:nutrition.eyebrow")}
      </Text>
      <Text className="mt-3 font-display text-4xl uppercase text-foreground">
        {t("panel:nutrition.title")}
      </Text>
      <Text className="mt-4 font-body text-muted-foreground">
        {t("panel:nutrition.description")}
      </Text>
      <Text className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {t("common:soon")}
      </Text>
    </View>
  );
}
