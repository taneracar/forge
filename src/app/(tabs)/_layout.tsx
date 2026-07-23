import { Tabs } from "expo-router";
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
          title: "Panel",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="antrenman"
        options={{
          title: "Antrenman",
          tabBarIcon: ({ color, size }) => (
            <Dumbbell color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="beslenme"
        options={{
          title: "Beslenme",
          tabBarIcon: ({ color, size }) => (
            <Utensils color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="su"
        options={{
          title: "Su",
          tabBarIcon: ({ color, size }) => (
            <Droplet color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="kilo"
        options={{
          title: "Kilo",
          tabBarIcon: ({ color, size }) => <Scale color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
