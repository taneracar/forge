import { useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { NumberPill } from "@/components/ui/number-pill";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Colors } from "@/constants/colors";
import { cn } from "@/lib/cn";

const PRESETS_ML = [1500, 2000, 2500, 3000, 3500];

interface GoalEditorModalProps {
  visible: boolean;
  currentGoalMl: number;
  onClose: () => void;
  onSave: (goalMl: number) => void;
}

export function GoalEditorModal({
  visible,
  currentGoalMl,
  onClose,
  onSave,
}: GoalEditorModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Keyed so each open starts from a fresh useState(currentGoalMl) instead
          of syncing a prop into state via an effect. */}
      {visible && (
        <GoalEditorContent
          key={currentGoalMl}
          currentGoalMl={currentGoalMl}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  );
}

function GoalEditorContent({
  currentGoalMl,
  onClose,
  onSave,
}: Omit<GoalEditorModalProps, "visible">) {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(currentGoalMl);

  return (
    <View
      className="flex-1 bg-background px-5"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-2xl uppercase text-foreground">
          {t("panel:water.goalModalTitle")}
        </Text>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
        >
          <X color={Colors.foreground} size={18} />
        </Pressable>
      </View>

      <View className="mt-8 flex-row flex-wrap gap-2">
        {PRESETS_ML.map((preset) => (
          <PressableScale key={preset} onPress={() => setValue(preset)}>
            <View
              className={cn(
                "rounded-full border px-4 py-2.5",
                value === preset
                  ? "border-primary bg-primary/15"
                  : "border-border-strong bg-surface",
              )}
            >
              <Text
                className={cn(
                  "font-body-medium text-sm",
                  value === preset ? "text-primary" : "text-muted-foreground",
                )}
              >
                {(preset / 1000).toFixed(1)} L
              </Text>
            </View>
          </PressableScale>
        ))}
      </View>

      <View className="mt-6">
        <NumberPill value={value} onChange={setValue} step={100} />
      </View>

      <View className="mt-8">
        <Button
          variant="primary"
          size="lg"
          onPress={() => {
            onSave(value);
            onClose();
          }}
        >
          {t("common:buttons.save")}
        </Button>
      </View>
    </View>
  );
}
