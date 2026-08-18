import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { WorkoutComposer } from "@/components/workout/workout-composer";
import { haptics } from "@/lib/haptics";
import { getPublicProfile } from "@/lib/social";
import { sendComposedWorkout } from "@/lib/workout-share";
import type { PlannedExercise } from "@/lib/workout-plan";

/**
 * Write a program *for* someone and send it. Nothing lands in your own
 * workouts, so coaching other people never spends your five slots.
 */
export default function ComposeForUserScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [username, setUsername] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    getPublicProfile(userId)
      .then((profile) => setUsername(profile?.username ?? null))
      .catch(() => setUsername(null));
  }, [userId]);

  async function handleSubmit(name: string, items: PlannedExercise[]) {
    if (!userId || sending) return;
    if (!name.trim()) {
      setError(t("common:validation.workoutNameRequired"));
      return;
    }
    if (items.length === 0) {
      setError(t("panel:social.composeEmpty"));
      return;
    }

    setSending(true);
    setError(null);
    try {
      await sendComposedWorkout(userId, name, items);
      haptics.success();
      router.back();
    } catch (sendError) {
      // The user gets a friendly line, but the real Postgres error (RLS
      // rejection, constraint violation) needs somewhere to surface or a
      // failure like this is undebuggable from the outside.
      console.error("sendComposedWorkout failed:", sendError);
      haptics.error();
      setError(t("panel:social.sendFailed"));
    } finally {
      setSending(false);
    }
  }

  return (
    <WorkoutComposer
      title={t("panel:social.composeTitle")}
      backHref="/(tabs)/sosyal"
      subtitle={username ? `@${username}` : undefined}
      submitLabel={t("panel:social.sendWorkoutButton")}
      submitting={sending}
      error={error}
      onSubmit={handleSubmit}
    />
  );
}
