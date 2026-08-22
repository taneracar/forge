import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Check, Timer, X } from "lucide-react-native";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { describeSets, type PlannedSet } from "@/lib/workout-plan";
import { loadSharePreview, type IncomingShare, type SharePreviewExercise } from "@/lib/workout-share";

/**
 * The one RIR the whole exercise prescribes, or null when the sets disagree or
 * none is set. A per-set RIR would need the full set table; this row is a
 * summary, and "2 RIR throughout" is the case worth showing at a glance.
 */
function sharedRir(sets: PlannedSet[]): number | null {
  const first = sets[0]?.rir ?? null;
  if (first === null) return null;
  return sets.every((set) => set.rir === first) ? first : null;
}

interface SharePreviewModalProps {
  /** The share being previewed, or null when the modal is closed. */
  share: IncomingShare | null;
  busy: boolean;
  onClose: () => void;
  onAccept: (share: IncomingShare) => void;
  onDecline: (share: IncomingShare) => void;
}

export function SharePreviewModal({
  share,
  busy,
  onClose,
  onAccept,
  onDecline,
}: SharePreviewModalProps) {
  return (
    <Modal visible={share !== null} animationType="slide" onRequestClose={onClose}>
      {share && (
        <PreviewContent
          key={share.id}
          share={share}
          busy={busy}
          onClose={onClose}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      )}
    </Modal>
  );
}

function PreviewContent({
  share,
  busy,
  onClose,
  onAccept,
  onDecline,
}: SharePreviewModalProps & { share: IncomingShare }) {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();

  const [exercises, setExercises] = useState<SharePreviewExercise[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadSharePreview(share.payload, t("panel:social.unknownExercise"))
      .then(setExercises)
      .catch(() => setFailed(true));
  }, [share.payload, t]);

  return (
    <View className="flex-1 bg-background">
      <AmbientBackground />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-display text-3xl uppercase text-foreground">
              {share.payload.name}
            </Text>
            <Text className="mt-1.5 font-body text-sm text-muted-foreground">
              {t("panel:social.sharedFrom", { username: share.fromUsername })} ·{" "}
              {t("panel:social.exerciseCount", { count: share.payload.exercises.length })}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
          >
            <X color={Colors.foreground} size={18} />
          </Pressable>
        </View>

        {failed ? (
          <Text className="mt-8 font-body text-sm text-danger">
            {t("panel:social.previewFailed")}
          </Text>
        ) : exercises === null ? (
          <View className="mt-7 gap-2">
            <Skeleton height={72} />
            <Skeleton height={72} />
            <Skeleton height={72} />
          </View>
        ) : (
          <View className="mt-7 gap-2">
            {exercises.map((exercise, index) => (
              <Card key={`${exercise.exerciseId}-${index}`} className="flex-row gap-3">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                  <Text className="font-mono text-xs text-primary">{index + 1}</Text>
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-body-semibold text-sm text-foreground">
                    {exercise.name}
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <Text className="font-mono text-xs text-muted-foreground">
                      {describeSets(exercise.sets)}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Timer color={Colors.muted} size={12} />
                      <Text className="font-mono text-xs text-muted-foreground">
                        {exercise.restSeconds}
                        {t("panel:workout.plan.secondsSuffix")}
                      </Text>
                    </View>
                    {sharedRir(exercise.sets) !== null && (
                      <Text className="font-mono text-xs text-muted-foreground">
                        {sharedRir(exercise.sets)} {t("panel:workout.plan.rirLabel")}
                      </Text>
                    )}
                  </View>
                  {exercise.notes && (
                    <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                      {exercise.notes}
                    </Text>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Pinned rather than at the end of the scroll: the whole point of the
          screen is deciding, and a long workout would bury the buttons. */}
      <View
        className="flex-row gap-2 border-t border-border bg-background px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Pressable
          onPress={() => {
            haptics.select();
            onDecline(share);
          }}
          disabled={busy}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-tile border border-border-strong py-3.5 active:bg-surface-overlay"
        >
          <X color={Colors.muted} size={16} />
          <Text className="font-body-medium text-sm text-muted-foreground">
            {t("panel:social.declineButton")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onAccept(share)}
          disabled={busy}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-tile bg-primary py-3.5 active:opacity-80"
        >
          <Check color={Colors.primaryForeground} size={16} strokeWidth={3} />
          <Text className="font-body-semibold text-sm text-primary-foreground">
            {t("panel:social.acceptButton")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
