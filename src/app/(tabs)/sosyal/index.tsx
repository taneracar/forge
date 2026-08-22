import { useCallback, useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Search, Users } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRow } from "@/components/social/user-row";
import { ShareInbox } from "@/components/social/share-inbox";
import { SharePreviewModal } from "@/components/social/share-preview-modal";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { useAuthStore } from "@/store/auth.store";
import { useWorkoutHomeStore } from "@/store/workout-home.store";
import { listFollowing, searchProfiles, type PublicProfile } from "@/lib/social";
import { MAX_SHARED_WORKOUTS, countUserWorkouts } from "@/lib/workouts";
import {
  acceptShare,
  declineShare,
  listIncomingShares,
  type IncomingShare,
} from "@/lib/workout-share";

const MIN_QUERY = 2;

export default function SosyalScreen() {
  const { t } = useTranslation("panel");
  const userId = useAuthStore((state) => state.session?.user.id);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicProfile[]>([]);
  // Which query the current `results` belong to, so "no users found" only
  // shows once a search has settled — not while one is still in flight.
  const [searchedFor, setSearchedFor] = useState("");

  const [following, setFollowing] = useState<PublicProfile[]>([]);
  const [followingLoading, setFollowingLoading] = useState(true);

  const [shares, setShares] = useState<IncomingShare[]>([]);
  const [busyShareId, setBusyShareId] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [previewShare, setPreviewShare] = useState<IncomingShare | null>(null);
  const invalidateWorkoutHome = useWorkoutHomeStore((state) => state.invalidate);

  const trimmed = query.trim();

  // Refetched on focus so following someone from a profile screen is reflected
  // when you come back here.
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      listFollowing(userId)
        .then(setFollowing)
        .catch(() => setFollowing([]))
        .finally(() => setFollowingLoading(false));
      listIncomingShares()
        .then(setShares)
        .catch(() => setShares([]));
    }, [userId]),
  );

  async function handleAcceptShare(share: IncomingShare) {
    if (!userId || busyShareId) return;
    // Closed as soon as a decision is made — the preview has done its job, and
    // leaving it up would hide the error banner this can still produce.
    setPreviewShare(null);
    setBusyShareId(share.id);
    setShareError(null);
    try {
      // The send-time check already reserved a slot, but a share can sit
      // pending for days — re-check before writing rather than blowing past
      // the cap on a stale reservation.
      const sharedCount = await countUserWorkouts(userId, "shared");
      if (sharedCount >= MAX_SHARED_WORKOUTS) {
        setShareError(t("social.sharedLimitMessage", { max: MAX_SHARED_WORKOUTS }));
        return;
      }
      await acceptShare(share);
      setShares((prev) => prev.filter((s) => s.id !== share.id));
      invalidateWorkoutHome();
      haptics.success();
    } catch {
      haptics.error();
      setShareError(t("social.acceptFailed"));
    } finally {
      setBusyShareId(null);
    }
  }

  function handleDeclineShare(share: IncomingShare) {
    if (busyShareId) return;
    setPreviewShare(null);
    setBusyShareId(share.id);
    setShares((prev) => prev.filter((s) => s.id !== share.id));
    declineShare(share.id)
      .catch(() => haptics.error())
      .finally(() => setBusyShareId(null));
  }

  useEffect(() => {
    // Every setState below runs inside the timer, never synchronously in the
    // effect — which is both what the compiler wants and what keeps previous
    // results on screen while the next keystroke settles.
    const timer = setTimeout(async () => {
      const q = query.trim();
      if (q.length < MIN_QUERY) {
        setResults([]);
        setSearchedFor(q);
        return;
      }
      try {
        setResults(await searchProfiles(q));
      } catch {
        setResults([]);
      }
      setSearchedFor(q);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const settled = searchedFor === trimmed;
  const searching = trimmed.length >= MIN_QUERY;

  return (
    <Screen>
      <Text className="pt-1 font-display text-4xl uppercase text-foreground">
        {t("social.title")}
      </Text>

      <View className="mt-5">
        <Input
          placeholder={t("social.searchPlaceholder")}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          leftElement={<Search color={Colors.mutedForeground} size={16} />}
        />
      </View>

      {searching ? (
        !settled ? (
          <View className="mt-6 gap-2">
            <Skeleton height={68} />
            <Skeleton height={68} />
            <Skeleton height={68} />
          </View>
        ) : results.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Users color={Colors.mutedForeground} size={24} />}
            title={t("social.noResults")}
          />
        ) : (
          <View className="mt-6 gap-2">
            {results.map((profile, i) => (
              <Animated.View
                key={profile.id}
                entering={FadeInDown.duration(240).delay(Math.min(i, 8) * 30)}
              >
                <UserRow profile={profile} />
              </Animated.View>
            ))}
          </View>
        )
      ) : (
        // Idle state doubles as your following list — more useful than a bare
        // "type to search" prompt, and it's the list you'd reach for anyway.
        <>
          <ShareInbox
            shares={shares}
            busyId={busyShareId}
            onAccept={handleAcceptShare}
            onDecline={handleDeclineShare}
            onPreview={setPreviewShare}
          />
          {shareError && (
            <Text className="mt-3 text-center font-body text-xs text-danger">
              {shareError}
            </Text>
          )}

          <SectionHeader className="mt-7" title={t("social.yourFollowing")} />
          {followingLoading ? (
            <View className="mt-3 gap-2">
              <Skeleton height={68} />
              <Skeleton height={68} />
            </View>
          ) : following.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={<Users color={Colors.mutedForeground} size={24} />}
              title={t("social.searchPrompt")}
              description={t("social.searchPromptDescription")}
            />
          ) : (
            <View className="mt-3 gap-2">
              {following.map((profile, i) => (
                <Animated.View
                  key={profile.id}
                  entering={FadeInDown.duration(240).delay(Math.min(i, 8) * 30)}
                >
                  <UserRow profile={profile} />
                </Animated.View>
              ))}
            </View>
          )}
        </>
      )}

      <SharePreviewModal
        share={previewShare}
        busy={busyShareId !== null}
        onClose={() => setPreviewShare(null)}
        onAccept={handleAcceptShare}
        onDecline={handleDeclineShare}
      />
    </Screen>
  );
}
