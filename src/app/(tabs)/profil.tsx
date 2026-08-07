import { useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Activity,
  Bell,
  Calendar,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Pencil,
  Ruler,
  Scale,
  Target,
  User,
  Users,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
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
  const email = useAuthStore((state) => state.session?.user.email);
  const userId = useAuthStore((state) => state.session?.user.id);
  const [profile, setProfile] = useState<OnboardingValues | null>(null);
  const [loading, setLoading] = useState(true);

  // Refetches on every focus (not just mount) so edits made on the Edit
  // Profile screen show up immediately on the way back.
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
        });
    }, [userId]),
  );

  const notSet = t("common:notSet");
  const fields = [
    {
      key: "gender",
      label: t("panel:profile.fields.gender"),
      value: labelFor(genderOptions, profile?.gender, t),
      icon: Users,
      mono: false,
    },
    {
      key: "age",
      label: t("panel:profile.fields.age"),
      value: profile?.age ?? notSet,
      icon: Calendar,
      mono: true,
    },
    {
      key: "height",
      label: t("panel:profile.fields.height"),
      value: profile?.height_cm ?? notSet,
      unit: profile?.height_cm ? "cm" : undefined,
      icon: Ruler,
      mono: true,
    },
    {
      key: "weight",
      label: t("panel:profile.fields.weight"),
      value: profile?.weight_kg ?? notSet,
      unit: profile?.weight_kg ? "kg" : undefined,
      icon: Scale,
      mono: true,
    },
    {
      key: "goal",
      label: t("panel:profile.fields.goal"),
      value: labelFor(goalOptions, profile?.goal, t),
      icon: Target,
      mono: false,
    },
    {
      key: "activityLevel",
      label: t("panel:profile.fields.activityLevel"),
      value: labelFor(activityOptions, profile?.activity_level, t),
      icon: Activity,
      mono: false,
    },
    {
      key: "experience",
      label: t("panel:profile.fields.experience"),
      value: labelFor(experienceOptions, profile?.workout_experience, t),
      icon: Dumbbell,
      mono: false,
    },
    {
      key: "days",
      label: t("panel:profile.fields.days"),
      value: profile?.preferred_training_days ?? notSet,
      icon: CalendarDays,
      mono: true,
    },
  ];

  return (
    <Screen>
      <View className="flex-row items-center justify-between pt-1">
        <Text className="font-display text-4xl uppercase text-foreground">
          {t("panel:profile.title")}
        </Text>
        {!loading && (
          <Pressable
            onPress={() => {
              haptics.select();
              router.push("/(tabs)/profil-duzenle");
            }}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-raised active:bg-surface-overlay"
          >
            <Pencil color={Colors.foreground} size={16} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View className="mt-6 gap-3">
          <Skeleton height={92} />
          <View className="flex-row flex-wrap gap-3">
            <Skeleton height={84} className="flex-1 basis-[47%]" />
            <Skeleton height={84} className="flex-1 basis-[47%]" />
            <Skeleton height={84} className="flex-1 basis-[47%]" />
            <Skeleton height={84} className="flex-1 basis-[47%]" />
          </View>
        </View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(280)} className="mt-6">
            <Card variant="gradient" className="flex-row items-center gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                <User color={Colors.primary} size={24} />
              </View>
              <View className="flex-1">
                <Text className="font-display text-xl uppercase text-foreground">
                  {profile?.name ?? notSet}
                </Text>
                <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                  {email}
                </Text>
              </View>
            </Card>
          </Animated.View>

          <View className="mt-6 flex-row flex-wrap gap-3">
            {fields.map((field, i) => (
              <View key={field.key} className="flex-1 basis-[47%]">
                <Animated.View entering={FadeInDown.duration(280).delay(Math.min(i, 8) * 30)}>
                  <Card variant="raised" className="gap-2">
                    <View className="flex-row items-center gap-1.5">
                      <field.icon color={Colors.mutedForeground} size={13} />
                      <Text className="font-body-medium text-xs text-muted-foreground">
                        {field.label}
                      </Text>
                    </View>
                    <View className="flex-row items-baseline gap-1">
                      <Text
                        className={cn(
                          "text-lg text-foreground",
                          field.mono ? "font-mono" : "font-body-semibold",
                        )}
                      >
                        {field.value}
                      </Text>
                      {field.unit && (
                        <Text className="font-body-medium text-xs text-muted-foreground">
                          {field.unit}
                        </Text>
                      )}
                    </View>
                  </Card>
                </Animated.View>
              </View>
            ))}
          </View>

          <Animated.View entering={FadeInDown.duration(280).delay(240)} className="mt-6">
            <Pressable
              onPress={() => {
                haptics.select();
                router.push("/(tabs)/hatirlaticilar");
              }}
            >
              <Card className="flex-row items-center gap-3 py-3.5">
                <View className="h-9 w-9 items-center justify-center rounded-tile bg-primary/15">
                  <Bell color={Colors.primary} size={16} />
                </View>
                <Text className="flex-1 font-body-semibold text-sm text-foreground">
                  {t("panel:reminders.profileRow")}
                </Text>
                <ChevronRight color={Colors.muted} size={18} />
              </Card>
            </Pressable>
          </Animated.View>

          <View className="mt-6">
            <Button variant="outline" onPress={() => supabase.auth.signOut()}>
              {t("common:buttons.logout")}
            </Button>
          </View>
        </>
      )}
    </Screen>
  );
}
