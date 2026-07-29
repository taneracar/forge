import type { ReactNode } from "react";
import { View, ScrollView, type ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";

interface ScreenProps extends ScrollViewProps {
  children: ReactNode;
  /** Set false for screens that manage their own scrolling. */
  scroll?: boolean;
  className?: string;
}

/**
 * Standard screen frame: background + safe-area top padding. Replaces the
 * `paddingTop: insets.top + 24` boilerplate repeated across every screen.
 */
export function Screen({
  children,
  scroll = true,
  className,
  contentContainerStyle,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  if (!scroll) {
    return (
      <View
        className={cn("flex-1 bg-background px-5", className)}
        style={{ paddingTop: insets.top + 20 }}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      className={cn("flex-1 bg-background px-5", className)}
      // Bottom padding clears the floating tab bar so the last row can scroll
      // fully into view.
      contentContainerStyle={[
        { paddingTop: insets.top + 20, paddingBottom: 96 },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
