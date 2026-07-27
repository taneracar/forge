import { View, Text, TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  className,
  containerClassName,
  ...props
}: InputProps) {
  return (
    <View className={cn("gap-1.5", containerClassName)}>
      {label && (
        <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          "rounded-md border border-border bg-surface px-4 py-3.5 text-base text-foreground",
          className,
        )}
        placeholderTextColor={Colors.mutedForeground}
        {...props}
      />
      {error && <Text className="text-xs text-primary">{error}</Text>}
    </View>
  );
}
