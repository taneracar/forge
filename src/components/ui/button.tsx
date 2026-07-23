import { Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@/lib/cn";

interface ButtonProps extends PressableProps {
  variant?: "primary" | "outline" | "ghost";
  children: string;
  className?: string;
}

const variantContainer: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary",
  outline: "border border-foreground/20",
  ghost: "",
};

const variantText: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "text-primary-foreground",
  outline: "text-foreground",
  ghost: "text-foreground/70",
};

export function Button({
  variant = "primary",
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(
        "items-center justify-center rounded-sm px-7 py-3.5",
        variantContainer[variant],
        className,
      )}
      {...props}
    >
      <Text
        className={cn(
          "font-body-semibold text-sm tracking-wide",
          variantText[variant],
        )}
      >
        {children}
      </Text>
    </Pressable>
  );
}
