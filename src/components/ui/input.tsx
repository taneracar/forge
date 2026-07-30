import { useState, type ReactNode } from "react";
import { View, Text, TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/cn";
import { Colors } from "@/constants/colors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  /** e.g. a password show/hide toggle, rendered inside the input on the right. */
  rightElement?: ReactNode;
}

export function Input({
  label,
  error,
  className,
  containerClassName,
  rightElement,
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
      <View className="justify-center">
        <TextInput
          className={cn(
            "rounded-tile border bg-surface-raised px-4 py-3.5 text-base text-foreground",
            rightElement && "pr-12",
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
        {rightElement && <View className="absolute right-4">{rightElement}</View>}
      </View>
      {error && <Text className="font-body text-xs text-danger">{error}</Text>}
    </View>
  );
}
