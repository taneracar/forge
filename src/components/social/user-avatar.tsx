import { View, Text } from "react-native";
import { cn } from "@/lib/cn";

interface UserAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Initial-letter circle. Deliberately not an uploaded image: avatars would
 * need storage plus a moderation path, and initials read fine at every size
 * this app uses.
 */
export function UserAvatar({ name, size = 40, className }: UserAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <View
      className={cn("items-center justify-center rounded-full bg-primary/15", className)}
      style={{ width: size, height: size }}
    >
      <Text
        className="font-display uppercase text-primary"
        style={{ fontSize: Math.round(size * 0.42) }}
      >
        {initial}
      </Text>
    </View>
  );
}
