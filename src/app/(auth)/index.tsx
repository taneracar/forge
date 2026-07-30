import { View, Text } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(["auth", "common"]);

  return (
    <View className="flex-1 bg-background">
      <View className="h-[58%] w-full">
        {/* expo-image and LinearGradient only reliably take `style`, not
            className, so absolute-fill layout goes through style here. */}
        <Image
          source={require("../../../assets/images/auth-hero.jpg")}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "transparent", "#14110D"]}
          locations={[0, 0.55, 1]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          className="absolute inset-x-0 items-center"
          style={{ top: insets.top + 16 }}
        >
          <Animated.View entering={FadeIn.duration(500)}>
            {/* Anton's cap-height nearly fills its own line box, leaving
                almost no built-in headroom — a hair of pt keeps the glyph
                top from reading as clipped. */}
            <Text className="pt-1 font-display text-4xl uppercase tracking-wide text-foreground">
              FOR<Text className="text-primary">GE</Text>
            </Text>
          </Animated.View>
        </View>
      </View>

      <View
        className="flex-1 justify-between px-6"
        style={{ paddingTop: 20, paddingBottom: insets.bottom + 20 }}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <View className="gap-3">
            <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
              {t("auth:welcome.eyebrow")}
            </Text>
            <Text className="pt-1 font-display text-4xl uppercase leading-[1.05] text-foreground">
              {t("auth:welcome.headline")}
            </Text>
            <Text className="font-body text-sm text-muted-foreground">
              {t("auth:welcome.subtitle")}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(160)}>
          <View className="gap-3">
            <Button
              variant="primary"
              size="lg"
              onPress={() => {
                haptics.select();
                router.push("/(auth)/kayit");
              }}
            >
              {t("auth:welcome.createAccount")}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onPress={() => {
                haptics.select();
                router.push("/(auth)/login");
              }}
            >
              {t("auth:welcome.login")}
            </Button>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
