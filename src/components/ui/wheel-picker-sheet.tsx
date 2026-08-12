import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Host, Picker } from "@expo/ui";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Colors } from "@/constants/colors";

interface WheelPickerItem {
  label: string;
  value: number;
}

interface WheelPickerSheetProps {
  visible: boolean;
  title: string;
  items: WheelPickerItem[];
  value: number;
  onClose: () => void;
  onSave: (value: number) => void;
}

/**
 * Native SwiftUI wheel (via @expo/ui) instead of a hand-rolled snapping
 * scroll list — iOS-only smooth momentum/haptics are effectively
 * unreproducible in JS, so this borrows the platform's own picker rather
 * than risk a janky custom one. Falls back to a plain dropdown on
 * Android/web (no wheel there), which is an acceptable native convention.
 */
export function WheelPickerSheet({
  visible,
  title,
  items,
  value,
  onClose,
  onSave,
}: WheelPickerSheetProps) {
  const { t } = useTranslation("common");
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className="text-center font-display text-lg uppercase text-foreground">
        {title}
      </Text>
      <Host style={{ width: "100%", height: 180 }} colorScheme="dark" seedColor={Colors.primary}>
        <Picker
          appearance="wheel"
          selectedValue={draft}
          onValueChange={(v) => setDraft(v as number)}
        >
          {items.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </Host>
      <View className="mt-2">
        <Button
          variant="primary"
          size="lg"
          onPress={() => {
            onSave(draft);
            onClose();
          }}
        >
          {t("buttons.save")}
        </Button>
      </View>
    </BottomSheet>
  );
}
