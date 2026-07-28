import { Pressable } from "react-native";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";

interface BackButtonProps {
  /** Where to go when there is no history to pop (deep link / fresh load). */
  fallbackHref?: Href;
  className?: string;
  size?: number;
}

export function BackButton({
  fallbackHref = "/(tabs)",
  className,
  size = 24,
}: BackButtonProps) {
  const { t } = useTranslation("common");
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallbackHref))}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={t("buttons.back")}
      className={cn("-ml-2 h-10 w-10 items-center justify-center rounded-md", className)}
    >
      <ChevronLeft color={Colors.foreground} size={size} />
    </Pressable>
  );
}
