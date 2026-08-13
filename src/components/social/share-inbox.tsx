import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { Check, Inbox, X } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import type { IncomingShare } from "@/lib/workout-share";

interface ShareInboxProps {
  shares: IncomingShare[];
  busyId: string | null;
  onAccept: (share: IncomingShare) => void;
  onDecline: (share: IncomingShare) => void;
}

/** Pending workouts other people sent you. Hidden entirely when empty. */
export function ShareInbox({ shares, busyId, onAccept, onDecline }: ShareInboxProps) {
  const { t } = useTranslation("panel");
  if (shares.length === 0) return null;

  return (
    <>
      <SectionHeader className="mt-7" title={t("social.inboxLabel")} />
      <View className="mt-3 gap-2">
        {shares.map((share, i) => (
          <Animated.View
            key={share.id}
            entering={FadeInDown.duration(240).delay(Math.min(i, 6) * 30)}
            layout={LinearTransition.duration(200)}
          >
            <Card
              variant="gradient"
              className={`gap-3 ${busyId === share.id ? "opacity-50" : ""}`}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-tile bg-primary/15">
                  <Inbox color={Colors.primary} size={16} />
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="font-body-semibold text-sm text-foreground"
                  >
                    {share.payload.name}
                  </Text>
                  <Text className="mt-0.5 font-mono text-xs text-muted-foreground">
                    @{share.fromUsername} ·{" "}
                    {t("social.exerciseCount", {
                      count: share.payload.exercises.length,
                    })}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    haptics.select();
                    onDecline(share);
                  }}
                  disabled={busyId !== null}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-tile border border-border-strong py-2.5 active:bg-surface-overlay"
                >
                  <X color={Colors.muted} size={15} />
                  <Text className="font-body-medium text-sm text-muted-foreground">
                    {t("social.declineButton")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onAccept(share)}
                  disabled={busyId !== null}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-tile bg-primary py-2.5 active:opacity-80"
                >
                  <Check color={Colors.primaryForeground} size={15} strokeWidth={3} />
                  <Text className="font-body-semibold text-sm text-primary-foreground">
                    {t("social.acceptButton")}
                  </Text>
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        ))}
      </View>
    </>
  );
}
