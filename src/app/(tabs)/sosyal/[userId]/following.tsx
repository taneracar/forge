import { useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ProfileListScreen } from "@/components/social/profile-list";
import { listFollowing } from "@/lib/social";

export default function FollowingScreen() {
  const { t } = useTranslation("panel");
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const load = useCallback(() => listFollowing(userId), [userId]);

  return (
    <ProfileListScreen
      title={t("social.followingLabel")}
      emptyTitle={t("social.noFollowing")}
      load={load}
    />
  );
}
