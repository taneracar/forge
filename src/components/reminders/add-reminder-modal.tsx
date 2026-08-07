import { useState } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberPill } from "@/components/ui/number-pill";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Colors } from "@/constants/colors";
import { cn } from "@/lib/cn";
import type { ReminderInput } from "@/lib/notifications";

const PRESET_LABELS = ["Creatine", "Multivitamin", "Protein"];

// Displayed Monday-first; values are expo-notifications' WEEKLY weekday
// numbering (1 = Sunday … 7 = Saturday).
const WEEKDAYS: { weekday: number; labelKey: string }[] = [
  { weekday: 2, labelKey: "mon" },
  { weekday: 3, labelKey: "tue" },
  { weekday: 4, labelKey: "wed" },
  { weekday: 5, labelKey: "thu" },
  { weekday: 6, labelKey: "fri" },
  { weekday: 7, labelKey: "sat" },
  { weekday: 1, labelKey: "sun" },
];
const ALL_WEEKDAYS = WEEKDAYS.map((d) => d.weekday);

interface AddReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: ReminderInput) => Promise<boolean>;
}

export function AddReminderModal({ visible, onClose, onSave }: AddReminderModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Keyed to `visible` so every open starts from a clean form instead of
          carrying over the previous reminder's values. */}
      {visible && <AddReminderContent key={String(visible)} onClose={onClose} onSave={onSave} />}
    </Modal>
  );
}

function AddReminderContent({
  onClose,
  onSave,
}: Omit<AddReminderModalProps, "visible">) {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const [label, setLabel] = useState("");
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [days, setDays] = useState<number[]>(ALL_WEEKDAYS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(weekday: number) {
    setDays((prev) => {
      if (prev.includes(weekday)) {
        // At least one day must stay selected.
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== weekday);
      }
      return [...prev, weekday];
    });
  }

  async function handleSave() {
    if (!label.trim() || saving) return;
    setSaving(true);
    setError(null);
    const ok = await onSave({
      label: label.trim(),
      hour,
      minute: Math.min(59, minute),
      days,
    });
    setSaving(false);
    if (!ok) {
      setError(t("panel:reminders.modal.permissionDenied"));
      return;
    }
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
          <Text className="font-display text-2xl uppercase text-foreground">
            {t("panel:reminders.modal.title")}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
          >
            <X color={Colors.foreground} size={18} />
          </Pressable>
        </View>

        <ScrollView
          className="mt-6 flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center gap-6">
            <View>
              <Input
                label={t("panel:reminders.modal.nameLabel")}
                placeholder={t("panel:reminders.modal.namePlaceholder")}
                value={label}
                onChangeText={setLabel}
              />
              <View className="mt-2.5 flex-row flex-wrap gap-2">
                {PRESET_LABELS.map((preset) => (
                  <PressableScale key={preset} onPress={() => setLabel(preset)}>
                    <View
                      className={cn(
                        "rounded-full border px-3.5 py-1.5",
                        label === preset
                          ? "border-primary bg-primary/15"
                          : "border-border-strong bg-surface",
                      )}
                    >
                      <Text
                        className={cn(
                          "font-body-medium text-xs",
                          label === preset ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {preset}
                      </Text>
                    </View>
                  </PressableScale>
                ))}
              </View>
            </View>

            <View>
              <Text className="font-body-medium text-xs text-muted-foreground">
                {t("panel:reminders.modal.timeLabel")}
              </Text>
              <View className="mt-2 flex-row items-center gap-3">
                <NumberPill value={hour} onChange={(v) => setHour(Math.min(23, v))} step={1} className="flex-1" />
                <Text className="font-mono text-lg text-muted-foreground">:</Text>
                <NumberPill value={minute} onChange={(v) => setMinute(Math.min(59, v))} step={5} className="flex-1" />
              </View>
            </View>

            <View>
              <Text className="font-body-medium text-xs text-muted-foreground">
                {t("panel:reminders.modal.daysLabel")}
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {WEEKDAYS.map(({ weekday, labelKey }) => {
                  const active = days.includes(weekday);
                  return (
                    <PressableScale key={weekday} onPress={() => toggleDay(weekday)}>
                      <View
                        className={cn(
                          "h-10 w-10 items-center justify-center rounded-full border",
                          active ? "border-primary bg-primary/15" : "border-border-strong bg-surface",
                        )}
                      >
                        <Text
                          className={cn(
                            "font-body-medium text-xs",
                            active ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {t(`panel:reminders.days.${labelKey}`)}
                        </Text>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            {error && <Text className="font-body text-xs text-danger">{error}</Text>}

            <Button variant="primary" size="lg" loading={saving} onPress={handleSave} disabled={!label.trim()}>
              {t("common:buttons.save")}
            </Button>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
