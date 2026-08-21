import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Colors } from "@/constants/colors";
import { haptics } from "@/lib/haptics";
import { supabase } from "@/lib/supabase";
import { explainTargets, type TargetProfile } from "@/lib/nutrition-targets";

type Measurement = "weight_kg" | "height_cm" | "age";

export type MeasurementPatch = Partial<Record<Measurement, number>>;

const FIELDS: { column: Measurement; labelKey: string; unit?: string }[] = [
  { column: "weight_kg", labelKey: "onboarding:labels.weight", unit: "kg" },
  { column: "height_cm", labelKey: "onboarding:labels.height", unit: "cm" },
  { column: "age", labelKey: "onboarding:labels.age" },
];

interface MeasurementsSheetProps {
  visible: boolean;
  userId: string | undefined;
  profile: TargetProfile | null;
  onClose: () => void;
  onSaved: (patch: MeasurementPatch) => void;
}

export function MeasurementsSheet({
  visible,
  userId,
  profile,
  onClose,
  onSaved,
}: MeasurementsSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Keyed so every open starts from empty fields showing the current
          values as placeholders, rather than whatever was typed last time. */}
      <MeasurementsForm
        key={visible ? "open" : "closed"}
        userId={userId}
        profile={profile}
        onClose={onClose}
        onSaved={onSaved}
      />
    </BottomSheet>
  );
}

function MeasurementsForm({
  userId,
  profile,
  onClose,
  onSaved,
}: Omit<MeasurementsSheetProps, "visible">) {
  const { t } = useTranslation(["panel", "onboarding", "common"]);
  const [draft, setDraft] = useState<Record<Measurement, string>>({
    weight_kg: "",
    height_cm: "",
    age: "",
  });
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  // A blank field means "keep what's there", so only what was typed is parsed.
  // `null` marks something typed that isn't a usable measurement.
  const patch = parseDraft(draft);
  const isValid = patch !== null && Object.keys(patch).length > 0;

  // Live so the sheet answers "what would that make my target?" before saving.
  const preview =
    profile && patch ? explainTargets({ ...profile, ...patch }).calories : null;

  async function handleSave() {
    if (!userId || !patch || !isValid || saving) return;
    setSaving(true);
    setFailed(false);
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    setSaving(false);
    if (error) {
      haptics.error();
      setFailed(true);
      return;
    }
    haptics.success();
    onSaved(patch);
    onClose();
  }

  return (
    <View className="gap-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-display text-xl uppercase text-foreground">
            {t("panel:nutrition.tdee.recalculateTitle")}
          </Text>
          <Text className="mt-1 font-body text-xs text-muted-foreground">
            {t("panel:nutrition.tdee.recalculateHint")}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
        >
          <X color={Colors.foreground} size={18} />
        </Pressable>
      </View>

      <View className="gap-3">
        {FIELDS.map((field) => (
          <Input
            key={field.column}
            label={t(field.labelKey)}
            keyboardType="numeric"
            value={draft[field.column]}
            placeholder={profile?.[field.column]?.toString() ?? "—"}
            onChangeText={(text) =>
              setDraft((prev) => ({ ...prev, [field.column]: text }))
            }
            rightElement={
              field.unit ? (
                <Text className="font-body-medium text-xs text-muted-foreground">
                  {field.unit}
                </Text>
              ) : undefined
            }
          />
        ))}
      </View>

      {preview !== null && (
        <View className="flex-row items-baseline justify-between rounded-tile border border-border bg-surface px-4 py-3">
          <Text className="font-body-medium text-sm text-muted-foreground">
            {t("panel:nutrition.tdee.newTarget")}
          </Text>
          <Text className="font-mono text-lg text-primary">
            {preview.toLocaleString()} kcal
          </Text>
        </View>
      )}

      {patch === null && (
        <Text className="font-body text-xs text-danger">
          {t("panel:nutrition.tdee.invalidMeasurement")}
        </Text>
      )}
      {failed && (
        <Text className="font-body text-xs text-danger">
          {t("onboarding:errors.saveFailed")}
        </Text>
      )}

      <Button variant="primary" size="lg" loading={saving} disabled={!isValid} onPress={handleSave}>
        {t("panel:nutrition.tdee.recalculate")}
      </Button>
    </View>
  );
}

function parseDraft(draft: Record<Measurement, string>): MeasurementPatch | null {
  const patch: MeasurementPatch = {};
  for (const field of FIELDS) {
    const raw = draft[field.column].trim().replace(",", ".");
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return null;
    patch[field.column] = field.column === "age" ? Math.round(value) : value;
  }
  return patch;
}
