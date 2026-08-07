import { useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionButton } from "@/components/ui/option-button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Stepper } from "@/components/ui/stepper";
import { Colors } from "@/constants/colors";
import { cn } from "@/lib/cn";
import { haptics } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";
import type { OnboardingValues } from "@/lib/profile-schema";

type OptionsColumn = "gender" | "goal" | "activity_level" | "workout_experience";
type NumberColumn = "age" | "height_cm" | "weight_kg";

export type EditFieldConfig =
  | { kind: "options"; column: OptionsColumn; options: readonly { value: string; labelKey: string }[] }
  | { kind: "number"; column: NumberColumn; step: number; unit?: string; withStepper?: boolean }
  | { kind: "days"; column: "preferred_training_days" };

interface EditFieldModalProps {
  visible: boolean;
  title: string;
  field: EditFieldConfig | null;
  currentValue: string | number | null;
  userId: string | undefined;
  onClose: () => void;
  onSaved: (column: keyof OnboardingValues, value: string | number) => void;
}

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export function EditFieldModal({
  visible,
  title,
  field,
  currentValue,
  userId,
  onClose,
  onSaved,
}: EditFieldModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Keyed so each field starts from a fresh useState(currentValue) instead
          of syncing a prop into state via an effect. */}
      {visible && field && (
        <EditFieldContent
          key={field.column}
          title={title}
          field={field}
          currentValue={currentValue}
          userId={userId}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

function EditFieldContent({
  title,
  field,
  currentValue,
  userId,
  onClose,
  onSaved,
}: Omit<EditFieldModalProps, "visible" | "field"> & { field: EditFieldConfig }) {
  const { t } = useTranslation(["panel", "onboarding", "common"]);
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState<string | number>(
    currentValue ?? (field.kind === "options" ? "" : field.kind === "days" ? 1 : 0),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    field.kind === "options"
      ? typeof value === "string" && value.length > 0
      : typeof value === "number" && Number.isFinite(value) && value > 0;

  async function handleSave() {
    if (!userId || !isValid || saving) return;
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ [field.column]: value })
      .eq("id", userId);
    setSaving(false);
    if (updateError) {
      haptics.error();
      setError(t("onboarding:errors.saveFailed"));
      return;
    }
    haptics.success();
    onSaved(field.column, value);
    onClose();
  }

  return (
    <View className="flex-1 bg-background">
      <AmbientBackground />
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-2xl uppercase text-foreground">{title}</Text>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
          >
            <X color={Colors.foreground} size={18} />
          </Pressable>
        </View>

        <View className="flex-1 justify-center gap-6">
          {field.kind === "options" && (
            <View className="flex-row flex-wrap gap-2">
              {field.options.map((opt) => (
                <View
                  key={opt.value}
                  style={
                    field.options.length > 3
                      ? { width: "48%" }
                      : { flex: 1 }
                  }
                >
                  <OptionButton
                    label={t(opt.labelKey)}
                    selected={value === opt.value}
                    onPress={() => setValue(opt.value)}
                  />
                </View>
              ))}
            </View>
          )}

          {field.kind === "number" && (
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Input
                  keyboardType="numeric"
                  value={value.toString()}
                  onChangeText={(text) => setValue(text === "" ? 0 : Number(text))}
                  rightElement={
                    field.unit ? (
                      <Text className="font-body-medium text-xs text-muted-foreground">
                        {field.unit}
                      </Text>
                    ) : undefined
                  }
                />
              </View>
              {field.withStepper && (
                <Stepper
                  value={typeof value === "number" ? value : 0}
                  step={field.step}
                  fallback={0}
                  onChange={setValue}
                />
              )}
            </View>
          )}

          {field.kind === "days" && (
            <View className="flex-row flex-wrap gap-2">
              {DAYS.map((day) => {
                const selected = value === day;
                return (
                  <PressableScale key={day} onPress={() => setValue(day)}>
                    <View
                      className={cn(
                        "h-12 w-12 items-center justify-center rounded-full border",
                        selected
                          ? "border-primary bg-primary/15"
                          : "border-border-strong bg-surface-raised",
                      )}
                    >
                      <Text
                        className={cn(
                          "font-mono text-sm",
                          selected ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {day}
                      </Text>
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          )}

          {error && <Text className="font-body text-xs text-danger">{error}</Text>}

          <Button variant="primary" size="lg" loading={saving} disabled={!isValid} onPress={handleSave}>
            {t("common:buttons.save")}
          </Button>
        </View>
      </View>
    </View>
  );
}
