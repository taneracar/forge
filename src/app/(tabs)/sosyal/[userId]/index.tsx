import { useEffect, useState } from "react";
import { View, Text, Alert, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ban, UserX } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import { UserAvatar } from "@/components/social/user-avatar";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import {
  blockUser,
  followUser,
  getFollowCounts,
  getFollowState,
  getPublicActivity,
  getPublicProfile,
  hasBlocked,
  unblockUser,
  unfollowUser,
  type FollowCounts,
  type FollowState,
  type PublicProfile,
} from "@/lib/social";
import { buildActivityHeatmap, type ActivityHeatmap as ActivityHeatmapData } from "@/lib/workouts";

export default function PublicProfileScreen() {
  const { t } = useTranslation(["panel", "common"]);
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [activity, setActivity] = useState<ActivityHeatmapData | null>(null);
  const [counts, setCounts] = useState<FollowCounts | null>(null);
  const [follow, setFollow] = useState<FollowState>({ following: false, followsYou: false });
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      getPublicProfile(userId).catch(() => null),
      getPublicActivity(userId).catch((): string[] => []),
      hasBlocked(userId).catch(() => false),
      getFollowCounts(userId).catch(() => null),
      getFollowState(userId).catch(() => ({ following: false, followsYou: false })),
    ])
      .then(([publicProfile, timestamps, isBlocked, followCounts, followState]) => {
        setProfile(publicProfile);
        // An empty list means either "no sessions" or "sharing turned off" —
        // the RPC deliberately doesn't distinguish, so neither does the UI.
        setActivity(timestamps.length > 0 ? buildActivityHeatmap(timestamps) : null);
        setBlocked(isBlocked);
        setCounts(followCounts);
        setFollow(followState);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  function toggleFollow() {
    if (!profile || busy) return;
    haptics.select();
    setBusy(true);

    const wasFollowing = follow.following;
    // Optimistic, with the follower count moved in step so the number doesn't
    // lag behind the button.
    setFollow((prev) => ({ ...prev, following: !wasFollowing }));
    setCounts((prev) =>
      prev ? { ...prev, followers: prev.followers + (wasFollowing ? -1 : 1) } : prev,
    );

    (wasFollowing ? unfollowUser(profile.id) : followUser(profile.id))
      .catch(() => {
        setFollow((prev) => ({ ...prev, following: wasFollowing }));
        setCounts((prev) =>
          prev ? { ...prev, followers: prev.followers + (wasFollowing ? 1 : -1) } : prev,
        );
        haptics.error();
      })
      .finally(() => setBusy(false));
  }

  function confirmBlock() {
    if (!profile) return;
    haptics.select();

    if (blocked) {
      unblockUser(profile.id)
        .then(() => setBlocked(false))
        .catch(() => haptics.error());
      return;
    }

    Alert.alert(
      t("panel:social.blockConfirmTitle"),
      t("panel:social.blockConfirmMessage", { name: profile.name }),
      [
        { text: t("common:buttons.cancel"), style: "cancel" },
        {
          text: t("panel:social.blockButton"),
          style: "destructive",
          onPress: () => {
            blockUser(profile.id)
              .then(() => {
                setBlocked(true);
                // Blocking severs the follow edges server-side, so mirror that
                // here instead of leaving a stale "Following" button.
                setActivity(null);
                setFollow({ following: false, followsYou: false });
                setCounts(null);
                haptics.success();
              })
              .catch(() => haptics.error());
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton fallbackHref="/(tabs)/sosyal" />
        {profile && (
          <Pressable
            onPress={confirmBlock}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised active:bg-surface-overlay"
          >
            <Ban color={blocked ? Colors.danger : Colors.muted} size={16} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View className="mt-6 gap-3">
          <Skeleton height={180} />
          <Skeleton height={190} />
        </View>
      ) : !profile ? (
        <EmptyState
          className="mt-6"
          icon={<UserX color={Colors.mutedForeground} size={24} />}
          title={t("panel:social.notFound")}
          description={t("panel:social.notFoundDescription")}
        />
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(280)} className="mt-6">
            <Card variant="gradient" className="items-center py-6">
              <UserAvatar name={profile.name} size={72} />
              <Text className="mt-3 font-display text-2xl uppercase text-foreground">
                {profile.name}
              </Text>
              <Text className="mt-1 font-mono text-sm text-primary">
                @{profile.username}
              </Text>

              {follow.followsYou && !blocked && (
                <View className="mt-2 rounded-full bg-surface-overlay px-3 py-1">
                  <Text className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("panel:social.followsYou")}
                  </Text>
                </View>
              )}

              {counts && (
                <View className="mt-5 flex-row gap-8">
                  <Pressable
                    onPress={() => {
                      haptics.select();
                      router.push(`/(tabs)/sosyal/${profile.id}/followers`);
                    }}
                    className="items-center"
                  >
                    <Text className="font-mono text-xl text-foreground">
                      {counts.followers}
                    </Text>
                    <Text className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("panel:social.followersLabel")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      haptics.select();
                      router.push(`/(tabs)/sosyal/${profile.id}/following`);
                    }}
                    className="items-center"
                  >
                    <Text className="font-mono text-xl text-foreground">
                      {counts.following}
                    </Text>
                    <Text className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("panel:social.followingLabel")}
                    </Text>
                  </Pressable>
                </View>
              )}
            </Card>
          </Animated.View>

          {!blocked && (
            <View className="mt-3">
              <Button
                variant={follow.following ? "outline" : "primary"}
                size="lg"
                onPress={toggleFollow}
              >
                {follow.following
                  ? t("panel:social.unfollowButton")
                  : t("panel:social.followButton")}
              </Button>
            </View>
          )}

          {blocked ? (
            <EmptyState
              className="mt-4"
              icon={<Ban color={Colors.mutedForeground} size={24} />}
              title={t("panel:social.blockedTitle")}
              description={t("panel:social.blockedDescription")}
              actionLabel={t("panel:social.unblockButton")}
              onAction={confirmBlock}
            />
          ) : activity ? (
            <Animated.View entering={FadeInDown.duration(280).delay(60)} className="mt-6">
              <ActivityHeatmap
                weeks={activity.weeks}
                weekStreak={activity.weekStreak}
                bestWeekStreak={activity.bestWeekStreak}
                totalSessions={activity.totalSessions}
              />
            </Animated.View>
          ) : (
            <EmptyState
              className="mt-4"
              icon={<UserX color={Colors.mutedForeground} size={24} />}
              title={t("panel:social.noActivity")}
            />
          )}
        </>
      )}
    </Screen>
  );
}
