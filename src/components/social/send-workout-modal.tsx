import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Dumbbell, Send } from "lucide-react-native";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { useAuthStore } from "@/store/auth.store";
import { listUserWorkouts, type SavedWorkout } from "@/lib/workouts";
import { sendWorkout } from "@/lib/workout-share";

interface SendWorkoutModalProps {
  visible: boolean;
  toUserId: string;
  onClose: () => void;
  onSent: () => void;
}

export function SendWorkoutModal({
  visible,
  toUserId,
  onClose,
  onSent,
}: SendWorkoutModalProps) {
  const { t } = useTranslation("panel");
  const userId = useAuthStore((state) => state.session?.user.id);

  const [workouts, setWorkouts] = useState<SavedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !userId) return;
    listUserWorkouts(userId)
      // Only your own programs can be passed on — a received one stays with
      // its original author. Enforced by the insert policy too.
      .then((all) => setWorkouts(all.filter((w) => w.source === "own")))
      .catch(() => setWorkouts([]))
      .finally(() => setLoading(false));
  }, [visible, userId]);

  function handleSend(workout: SavedWorkout) {
    if (sending) return;
    setSending(workout.id);
    setError(null);
    sendWorkout(toUserId, workout.id)
      .then(() => {
        haptics.success();
        onSent();
        onClose();
      })
      .catch(() => {
        haptics.error();
        setError(t("social.sendFailed"));
      })
      .finally(() => setSending(null));
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className="text-center font-display text-lg uppercase text-foreground">
        {t("social.sendWorkoutTitle")}
      </Text>

      {loading ? (
        <View className="mt-4 gap-2">
          <Skeleton height={64} />
          <Skeleton height={64} />
        </View>
      ) : workouts.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={<Dumbbell color={Colors.mutedForeground} size={24} />}
          title={t("social.sendWorkoutEmpty")}
        />
      ) : (
        <View className="mt-4 gap-2">
          {workouts.map((workout) => (
            <Pressable
              key={workout.id}
              onPress={() => handleSend(workout)}
              disabled={sending !== null}
            >
              <Card
                className={`flex-row items-center gap-3 py-3 ${
                  sending === workout.id ? "opacity-50" : ""
                }`}
              >
                <View className="h-9 w-9 items-center justify-center rounded-tile bg-primary/15">
                  <Dumbbell color={Colors.primary} size={16} />
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="font-body-semibold text-sm text-foreground"
                  >
                    {workout.name}
                  </Text>
                  <Text className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {workout.exerciseCount} {t("dashboard.exerciseCountSuffix")}
                  </Text>
                </View>
                <Send color={Colors.muted} size={16} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      {error && (
        <Text className="mt-3 text-center font-body text-xs text-danger">{error}</Text>
      )}
    </BottomSheet>
  );
}
