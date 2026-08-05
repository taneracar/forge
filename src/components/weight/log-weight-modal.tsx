import { useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { Button } from "@/components/ui/button";
import { NumberPill } from "@/components/ui/number-pill";
import { Colors } from "@/constants/colors";

interface LogWeightModalProps {
  visible: boolean;
  startingWeightKg: number;
  onClose: () => void;
  onSave: (weightKg: number) => void;
}

export function LogWeightModal({
  visible,
  startingWeightKg,
  onClose,
  onSave,
}: LogWeightModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Keyed so each open starts from a fresh useState(startingWeightKg)
          instead of syncing a prop into state via an effect. */}
      {visible && (
        <LogWeightContent
          key={startingWeightKg}
          startingWeightKg={startingWeightKg}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  );
}

function LogWeightContent({
  startingWeightKg,
  onClose,
  onSave,
}: Omit<LogWeightModalProps, "visible">) {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(startingWeightKg);

  return (
    <View className="flex-1 bg-background">
      <AmbientBackground />
      <View
        className="flex-1 px-5"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-2xl uppercase text-foreground">
            {t("panel:weight.logModalTitle")}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
          >
            <X color={Colors.foreground} size={18} />
          </Pressable>
        </View>

        {/* Centers the stepper in whatever space is left below the header,
            instead of leaving a dead void underneath the Save button. */}
        <View className="flex-1 justify-center">
          <NumberPill
            value={value}
            onChange={(next) => setValue(Math.max(20, next))}
            step={0.5}
          />

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
      </View>
    </View>
  );
}
