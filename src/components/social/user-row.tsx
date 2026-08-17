import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/social/user-avatar";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import type { PublicProfile } from "@/lib/social";

interface UserRowProps {
  profile: PublicProfile;
}

/** Shared by search results and the follower/following lists. */
export function UserRow({ profile }: UserRowProps) {
  return (
    <Pressable
      onPress={() => {
        haptics.select();
        router.push(`/(tabs)/sosyal/${profile.id}`);
      }}
    >
      <Card className="flex-row items-center gap-3 py-3">
        <UserAvatar name={profile.name} size={40} />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-body-semibold text-sm text-foreground">
            {profile.name}
          </Text>
          <Text className="mt-0.5 font-mono text-xs text-muted-foreground">
            @{profile.username}
          </Text>
        </View>
        <ChevronRight color={Colors.muted} size={18} />
      </Card>
    </Pressable>
  );
}
