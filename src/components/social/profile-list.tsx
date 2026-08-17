import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Users } from "lucide-react-native";
import { Screen } from "@/components/ui/screen";
import { BackButton } from "@/components/ui/back-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRow } from "@/components/social/user-row";
import { Colors } from "@/constants/colors";
import type { PublicProfile } from "@/lib/social";

interface ProfileListScreenProps {
  title: string;
  emptyTitle: string;
  load: () => Promise<PublicProfile[]>;
}

/** Shared body for the followers and following screens. */
export function ProfileListScreen({ title, emptyTitle, load }: ProfileListScreenProps) {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load()
      .then(setProfiles)
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, [load]);

  return (
    <Screen>
      <View className="flex-row items-center gap-2">
        <BackButton fallbackHref="/(tabs)/sosyal" />
        <Text className="flex-1 font-display text-2xl uppercase text-foreground">
          {title}
        </Text>
      </View>

      {loading ? (
        <View className="mt-6 gap-2">
          <Skeleton height={68} />
          <Skeleton height={68} />
          <Skeleton height={68} />
        </View>
      ) : profiles.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Users color={Colors.mutedForeground} size={24} />}
          title={emptyTitle}
        />
      ) : (
        <View className="mt-6 gap-2">
          {profiles.map((profile, i) => (
            <Animated.View
              key={profile.id}
              entering={FadeInDown.duration(240).delay(Math.min(i, 8) * 30)}
            >
              <UserRow profile={profile} />
            </Animated.View>
          ))}
        </View>
      )}
    </Screen>
  );
}
