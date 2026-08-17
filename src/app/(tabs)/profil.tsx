import { useCallback, useState } from "react";
import { View, Text, Pressable, Switch } from "react-native";
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
  Eye,
  Ruler,
  Scale,
  Target,
  User,
  Users,
} from "lucide-react-native";
import { EditFieldModal, type EditFieldConfig } from "@/components/profile/edit-field-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";
import { setShareActivity as saveShareActivity } from "@/lib/social";
import { useAuthStore } from "@/store/auth.store";
import {
  genderOptions,
  goalOptions,
  activityOptions,
  experienceOptions,
  labelFor,
  type OnboardingValues,
} from "@/lib/profile-schema";

interface EditingField {
  config: EditFieldConfig;
  title: string;
  currentValue: string | number | null;
}

export default function ProfilScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const email = useAuthStore((state) => state.session?.user.email);
  const userId = useAuthStore((state) => state.session?.user.id);
  const [profile, setProfile] = useState<OnboardingValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingField | null>(null);
  const [shareActivity, setShareActivity] = useState(true);

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
          setShareActivity(data?.share_activity ?? true);
          setLoading(false);
        });
    }, [userId]),
  );

  const notSet = t("common:notSet");
  const fields: {
    key: string;
    label: string;
    value: string | number;
    unit?: string;
    icon: typeof Users;
    mono: boolean;
    rawValue: string | number | null;
    config: EditFieldConfig;
  }[] = [
    {
      key: "gender",
      label: t("panel:profile.fields.gender"),
      value: labelFor(genderOptions, profile?.gender, t),
      icon: Users,
      mono: false,
      rawValue: profile?.gender ?? null,
      config: { kind: "options", column: "gender", options: genderOptions },
    },
    {
      key: "age",
      label: t("panel:profile.fields.age"),
      value: profile?.age ?? notSet,
      icon: Calendar,
      mono: true,
      rawValue: profile?.age ?? null,
      config: { kind: "number", column: "age", step: 1 },
    },
    {
      key: "height",
      label: t("panel:profile.fields.height"),
      value: profile?.height_cm ?? notSet,
      unit: profile?.height_cm ? "cm" : undefined,
      icon: Ruler,
      mono: true,
      rawValue: profile?.height_cm ?? null,
      config: { kind: "number", column: "height_cm", step: 1, unit: "cm", withStepper: true },
    },
    {
      key: "weight",
      label: t("panel:profile.fields.weight"),
      value: profile?.weight_kg ?? notSet,
      unit: profile?.weight_kg ? "kg" : undefined,
      icon: Scale,
      mono: true,
      rawValue: profile?.weight_kg ?? null,
      config: { kind: "number", column: "weight_kg", step: 0.5, unit: "kg", withStepper: true },
    },
    {
      key: "goal",
      label: t("panel:profile.fields.goal"),
      value: labelFor(goalOptions, profile?.goal, t),
      icon: Target,
      mono: false,
      rawValue: profile?.goal ?? null,
      config: { kind: "options", column: "goal", options: goalOptions },
    },
    {
      key: "activityLevel",
      label: t("panel:profile.fields.activityLevel"),
      value: labelFor(activityOptions, profile?.activity_level, t),
      icon: Activity,
      mono: false,
      rawValue: profile?.activity_level ?? null,
      config: { kind: "options", column: "activity_level", options: activityOptions },
    },
    {
      key: "experience",
      label: t("panel:profile.fields.experience"),
      value: labelFor(experienceOptions, profile?.workout_experience, t),
      icon: Dumbbell,
      mono: false,
      rawValue: profile?.workout_experience ?? null,
      config: { kind: "options", column: "workout_experience", options: experienceOptions },
    },
    {
      key: "days",
      label: t("panel:profile.fields.days"),
      value: profile?.preferred_training_days ?? notSet,
      icon: CalendarDays,
      mono: true,
      rawValue: profile?.preferred_training_days ?? null,
      config: { kind: "days", column: "preferred_training_days" },
    },
  ];

  return (
    <Screen>
      <Text className="pt-1 font-display text-4xl uppercase text-foreground">
        {t("panel:profile.title")}
      </Text>

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
            <Pressable
              onPress={() => {
                haptics.select();
                setEditing({
                  config: { kind: "username", column: "username" },
                  title: t("panel:profile.edit.fieldTitle", {
                    field: t("panel:profile.fields.username"),
                  }),
                  currentValue: profile?.username ?? null,
                });
              }}
            >
              <Card variant="gradient" className="flex-row items-center gap-4">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                  <User color={Colors.primary} size={24} />
                </View>
                <View className="flex-1">
                  <Text className="font-display text-xl uppercase text-foreground">
                    {profile?.name ?? notSet}
                  </Text>
                  <Text className="mt-0.5 font-mono text-sm text-primary">
                    @{profile?.username ?? "—"}
                  </Text>
                  <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                    {email}
                  </Text>
                </View>
                <ChevronRight color={Colors.muted} size={18} />
              </Card>
            </Pressable>
          </Animated.View>

          <View className="mt-6 flex-row flex-wrap gap-3">
            {fields.map((field, i) => (
              <View key={field.key} className="flex-1 basis-[47%]">
                <Animated.View entering={FadeInDown.duration(280).delay(Math.min(i, 8) * 30)}>
                  <Pressable
                    onPress={() => {
                      haptics.select();
                      setEditing({
                        config: field.config,
                        title: t("panel:profile.edit.fieldTitle", { field: field.label }),
                        currentValue: field.rawValue,
                      });
                    }}
                  >
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
                  </Pressable>
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

          <Animated.View entering={FadeInDown.duration(280).delay(270)} className="mt-3">
            <Card className="flex-row items-center gap-3 py-3.5">
              <View className="h-9 w-9 items-center justify-center rounded-tile bg-primary/15">
                <Eye color={Colors.primary} size={16} />
              </View>
              <View className="flex-1">
                <Text className="font-body-semibold text-sm text-foreground">
                  {t("panel:profile.shareActivity")}
                </Text>
                <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                  {t("panel:profile.shareActivityDescription")}
                </Text>
              </View>
              <Switch
                value={shareActivity}
                onValueChange={(next) => {
                  if (!userId) return;
                  haptics.select();
                  // Optimistic: the toggle should feel instant, and a failed
                  // write just rolls back to the value the server still has.
                  setShareActivity(next);
                  saveShareActivity(userId, next).catch(() => {
                    setShareActivity(!next);
                    haptics.error();
                  });
                }}
                trackColor={{ false: Colors.surfaceOverlay, true: Colors.primary }}
                thumbColor={Colors.foreground}
              />
            </Card>
          </Animated.View>

          <View className="mt-6">
            <Button variant="outline" onPress={() => supabase.auth.signOut()}>
              {t("common:buttons.logout")}
            </Button>
          </View>
        </>
      )}

      <EditFieldModal
        visible={editing !== null}
        title={editing?.title ?? ""}
        field={editing?.config ?? null}
        currentValue={editing?.currentValue ?? null}
        userId={userId}
        onClose={() => setEditing(null)}
        onSaved={(column, value) =>
          setProfile((prev) => (prev ? { ...prev, [column]: value } : prev))
        }
      />
    </Screen>
  );
}
