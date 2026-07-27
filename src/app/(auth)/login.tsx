import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";

const loginSchema = z.object({
  email: z.string().email("common:validation.emailInvalid"),
  password: z.string().min(6, "common:validation.passwordMinLogin"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setSubmitError(t("auth:login.invalidCredentials"));
  });

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-6">
      <Text className="font-display text-4xl uppercase text-foreground">
        FOR<Text className="text-primary">GE</Text>
      </Text>
      <Text className="text-center font-body text-muted-foreground">
        {t("auth:login.subtitle")}
      </Text>

      <View className="w-full gap-4">
        <View className="gap-1.5">
          <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {t("auth:login.emailLabel")}
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
                placeholder="ornek@eposta.com"
                placeholderTextColor={Colors.mutedForeground}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />
          {errors.email && (
            <Text className="text-xs text-primary">
              {t(errors.email.message ?? "")}
            </Text>
          )}
        </View>

        <View className="gap-1.5">
          <Text className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {t("auth:login.passwordLabel")}
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
                secureTextEntry
                autoComplete="current-password"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />
          {errors.password && (
            <Text className="text-xs text-primary">
              {t(errors.password.message ?? "")}
            </Text>
          )}
        </View>

        {submitError && (
          <Text className="text-xs text-primary">{submitError}</Text>
        )}

        <Button
          variant="primary"
          onPress={() => onSubmit()}
          disabled={isSubmitting}
          className="w-full"
        >
          {t("auth:login.submit")}
        </Button>

        <Text className="text-center font-body text-sm text-muted-foreground">
          {t("auth:login.noAccount")}{" "}
          <Link href="/(auth)/kayit" className="text-primary">
            {t("auth:login.signUp")}
          </Link>
        </Text>
      </View>
    </View>
  );
}
