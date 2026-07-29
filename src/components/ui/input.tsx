import { useState } from "react";
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
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={cn("gap-2", containerClassName)}>
      {label && (
        <Text className="font-body-medium text-xs text-muted-foreground">{label}</Text>
      )}
      <TextInput
        className={cn(
          "rounded-tile border bg-surface-raised px-4 py-3.5 text-base text-foreground",
          focused ? "border-primary" : error ? "border-danger" : "border-border-strong",
          className,
        )}
        placeholderTextColor={Colors.muted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
      {error && <Text className="font-body text-xs text-danger">{error}</Text>}
    </View>
  );
}
