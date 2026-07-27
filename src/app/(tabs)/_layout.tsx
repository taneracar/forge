import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Droplet,
  Scale,
  User,
} from "lucide-react-native";
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
      <Tabs.Screen
        name="su"
        options={{
          title: t("tabs.water"),
          tabBarIcon: ({ color, size }) => (
            <Droplet color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="kilo"
        options={{
          title: t("tabs.weight"),
          tabBarIcon: ({ color, size }) => <Scale color={color} size={size} />,
        }}
      />
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
