import { useState } from "react";
import { View, Text } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/colors";

const loginSchema = z.object({
  email: z.string().email("common:validation.emailInvalid"),
  password: z.string().min(6, "common:validation.passwordMinLogin"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const insets = useSafeAreaInsets();
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
    <View className="flex-1 bg-background">
      <AmbientBackground />
      <View
        className="flex-1 px-6"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }}
      >
        <BackButton fallbackHref="/(auth)" />

        {/* Vertically centered in the space between the back button and the
            sign-up prompt, instead of pinned right under the back button
            with a dead void below — see ambient-background.tsx for the rest
            of the "screen feels empty" fix. */}
        <View className="flex-1 justify-center">
          <View>
            <Text className="pt-1 font-display text-3xl uppercase text-foreground">
              {t("auth:login.title")}
            </Text>
            <Text className="mt-2 font-body text-sm text-muted-foreground">
              {t("auth:login.subtitle")}
            </Text>
          </View>

          <View className="mt-8 gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t("auth:login.emailLabel")}
                  placeholder="ornek@eposta.com"
                  placeholderTextColor={Colors.muted}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.email ? t(errors.email.message ?? "") : undefined}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t("auth:login.passwordLabel")}
                  secureTextEntry
                  autoComplete="current-password"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.password ? t(errors.password.message ?? "") : undefined}
                />
              )}
            />

            {submitError && (
              <Text className="font-body text-xs text-danger">{submitError}</Text>
            )}

            <Button
              variant="primary"
              size="lg"
              onPress={() => onSubmit()}
              disabled={isSubmitting}
              loading={isSubmitting}
              className="mt-2"
            >
              {t("auth:login.submit")}
            </Button>
          </View>
        </View>

        <Text className="text-center font-body text-sm text-muted-foreground">
          {t("auth:login.noAccount")}{" "}
          <Link href="/(auth)/kayit" className="font-body-semibold text-primary">
            {t("auth:login.signUp")}
          </Link>
        </Text>
      </View>
    </View>
  );
}
