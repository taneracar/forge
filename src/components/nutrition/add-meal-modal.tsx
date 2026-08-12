import { useState } from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Colors } from "@/constants/colors";
import type { MealType, NewMealLog } from "@/lib/nutrition";

interface AddMealModalProps {
  visible: boolean;
  /** Fixed by which meal card's "+" was tapped — never chosen inside the form. */
  mealType: MealType;
  onClose: () => void;
  onAdd: (meal: NewMealLog) => void;
}

export function AddMealModal({ visible, mealType, onClose, onAdd }: AddMealModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Keyed by mealType so each open starts from a fresh, empty form
          instead of syncing props into state via an effect. */}
      {visible && (
        <AddMealContent
          key={mealType}
          mealType={mealType}
          onClose={onClose}
          onAdd={onAdd}
        />
      )}
    </Modal>
  );
}

function AddMealContent({
  mealType,
  onClose,
  onAdd,
}: Omit<AddMealModalProps, "visible">) {
  const { t } = useTranslation(["panel", "common"]);
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const caloriesNum = Number(calories);
  const canSave =
    name.trim().length > 0 &&
    calories.trim().length > 0 &&
    !Number.isNaN(caloriesNum) &&
    caloriesNum > 0;

  function handleSave() {
    if (!canSave) return;
    onAdd({
      mealType,
      name: name.trim(),
      calories: Math.round(caloriesNum),
      proteinG: protein ? Number(protein) : undefined,
      carbsG: carbs ? Number(carbs) : undefined,
      fatG: fat ? Number(fat) : undefined,
    });
    onClose();
  }

  return (
    <View className="flex-1 bg-background">
      <AmbientBackground />
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          flexGrow: 1,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
              {t(`panel:nutrition.mealTypes.${mealType}`)}
            </Text>
            <Text className="mt-1.5 font-display text-2xl uppercase text-foreground">
              {t("panel:nutrition.addModalTitle")}
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

        {/* Centers the form in whatever space is left below the header,
            instead of leaving a dead void underneath the Add button. */}
        <View className="flex-1 justify-center">
          <View className="gap-4">
            <Input
              label={t("panel:nutrition.nameLabel")}
              placeholder={t("panel:nutrition.namePlaceholder")}
              value={name}
              onChangeText={setName}
            />
            <Input
              label={t("panel:nutrition.caloriesFieldLabel")}
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label={`${t("panel:nutrition.proteinLabel")} (g)`}
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={setProtein}
                />
              </View>
              <View className="flex-1">
                <Input
                  label={`${t("panel:nutrition.carbsLabel")} (g)`}
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </View>
              <View className="flex-1">
                <Input
                  label={`${t("panel:nutrition.fatLabel")} (g)`}
                  keyboardType="numeric"
                  value={fat}
                  onChangeText={setFat}
                />
              </View>
            </View>
          </View>

          <View className="mt-8">
            <Button variant="primary" size="lg" onPress={handleSave} disabled={!canSave}>
              {t("common:buttons.add")}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
