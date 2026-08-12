import { useCallback } from "react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ProfileListScreen } from "@/components/social/profile-list";
import { listFollowers } from "@/lib/social";

export default function FollowersScreen() {
  const { t } = useTranslation("panel");
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const load = useCallback(() => listFollowers(userId), [userId]);

  return (
    <ProfileListScreen
      title={t("social.followersLabel")}
      emptyTitle={t("social.noFollowers")}
      load={load}
    />
  );
}
