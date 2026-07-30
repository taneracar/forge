import { useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { NumberPill } from "@/components/ui/number-pill";
import { Colors } from "@/constants/colors";

const DEFAULT_ML = 250;
const MIN_ML = 50;

interface CustomAmountModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (amountMl: number) => void;
}

export function CustomAmountModal({ visible, onClose, onAdd }: CustomAmountModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Keyed by visible so re-opening always starts from DEFAULT_ML instead
          of syncing state via an effect. */}
      {visible && <CustomAmountContent key="open" onClose={onClose} onAdd={onAdd} />}
    </Modal>
  );
}

function CustomAmountContent({
  onClose,
  onAdd,
}: Omit<CustomAmountModalProps, "visible">) {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(DEFAULT_ML);

  return (
    <View
      className="flex-1 bg-background px-5"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-2xl uppercase text-foreground">
          {t("panel:water.customModalTitle")}
        </Text>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-raised"
        >
          <X color={Colors.foreground} size={18} />
        </Pressable>
      </View>

      <View className="mt-8">
        <NumberPill
          value={value}
          onChange={(next) => setValue(Math.max(MIN_ML, next))}
          step={50}
        />
      </View>

      <View className="mt-8">
        <Button
          variant="primary"
          size="lg"
          onPress={() => {
            onAdd(value);
            onClose();
          }}
        >
          {t("common:buttons.add")}
        </Button>
      </View>
    </View>
  );
}
