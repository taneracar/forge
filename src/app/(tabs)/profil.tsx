import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth.store";
import {
  genderOptions,
  goalOptions,
  activityOptions,
  experienceOptions,
  labelFor,
  type OnboardingValues,
} from "@/lib/profile-schema";

export default function ProfilScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const email = useAuthStore((state) => state.session?.user.email);
  const userId = useAuthStore((state) => state.session?.user.id);
  const [profile, setProfile] = useState<OnboardingValues | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [userId]);

  const notSet = t("common:notSet");
  const fields = [
    { label: t("panel:profile.fields.name"), value: profile?.name ?? notSet },
    { label: t("panel:profile.fields.age"), value: profile?.age ?? notSet },
    {
      label: t("panel:profile.fields.gender"),
      value: labelFor(genderOptions, profile?.gender, t),
    },
    {
      label: t("panel:profile.fields.height"),
      value: profile?.height_cm ? `${profile.height_cm} cm` : notSet,
    },
    {
      label: t("panel:profile.fields.weight"),
      value: profile?.weight_kg ? `${profile.weight_kg} kg` : notSet,
    },
    {
      label: t("panel:profile.fields.goal"),
      value: labelFor(goalOptions, profile?.goal, t),
    },
    {
      label: t("panel:profile.fields.activityLevel"),
      value: labelFor(activityOptions, profile?.activity_level, t),
    },
    {
      label: t("panel:profile.fields.experience"),
      value: labelFor(experienceOptions, profile?.workout_experience, t),
    },
    {
      label: t("panel:profile.fields.days"),
      value: profile?.preferred_training_days ?? notSet,
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-background px-6"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 40 }}
    >
      <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
        {t("panel:profile.eyebrow")}
      </Text>
      <Text className="mt-3 font-display text-4xl uppercase text-foreground">
        {t("panel:profile.title")}
      </Text>
      <Text className="mt-4 font-body text-foreground">{email}</Text>

      <View className="mt-8 flex-row flex-wrap gap-3">
        {fields.map((field) => (
          <View key={field.label} style={{ width: "47%" }}>
            <Card>
              <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {field.label}
              </Text>
              <Text className="mt-1 font-body font-semibold text-foreground">
                {field.value}
              </Text>
            </Card>
          </View>
        ))}
      </View>

      <View className="mt-8">
        <Button variant="outline" onPress={() => supabase.auth.signOut()}>
          {t("common:buttons.logout")}
        </Button>
      </View>
    </ScrollView>
  );
}
