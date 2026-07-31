import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Dumbbell, Utensils, User } from "lucide-react-native";
import { Colors } from "@/constants/colors";

export default function TabsLayout() {
  const { t } = useTranslation("common");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.panel"),
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="antrenman"
        options={{
          title: t("tabs.workout"),
          tabBarIcon: ({ color, size }) => (
            <Dumbbell color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="beslenme"
        options={{
          title: t("tabs.nutrition"),
          tabBarIcon: ({ color, size }) => (
            <Utensils color={color} size={size} />
          ),
        }}
      />
      {/* Water and Weight are quick, low-depth daily actions — reached from
          the Dashboard instead of their own tab. The routes stay part of
          this Tabs navigator (href: null) so the tab bar remains visible
          when a card pushes into them. */}
      <Tabs.Screen name="su" options={{ href: null }} />
      <Tabs.Screen name="kilo" options={{ href: null }} />
      <Tabs.Screen
        name="profil"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
