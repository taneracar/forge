import { View, Text } from "react-native";
import { Button } from "@/components/ui/button";

const totalSteps = 6;
const currentStep = 1;

export default function OnboardingScreen() {
  return (
    <View className="flex-1 justify-center gap-6 bg-background px-6">
      <View className="flex-row gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < currentStep ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </View>

      <Text className="font-mono text-xs uppercase tracking-[3px] text-primary">
        Adım {currentStep} / {totalSteps}
      </Text>
      <Text className="font-display text-3xl uppercase text-foreground">
        Seni Tanıyalım
      </Text>
      <Text className="font-body text-muted-foreground">
        Antrenman ve beslenme planını sana göre kişiselleştirmemiz için birkaç
        soru soracağız.
      </Text>

      <Button variant="primary" className="w-full">
        Devam Et
      </Button>
    </View>
  );
}
