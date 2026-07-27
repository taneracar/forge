import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";

import commonTr from "@/locales/tr/common.json";
import authTr from "@/locales/tr/auth.json";
import onboardingTr from "@/locales/tr/onboarding.json";
import panelTr from "@/locales/tr/panel.json";
import commonEn from "@/locales/en/common.json";
import authEn from "@/locales/en/auth.json";
import onboardingEn from "@/locales/en/onboarding.json";
import panelEn from "@/locales/en/panel.json";

const deviceLanguage = getLocales()[0]?.languageCode;
const initialLanguage = deviceLanguage === "en" ? "en" : "tr";

i18next.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: "tr",
  compatibilityJSON: "v4",
  interpolation: { escapeValue: false },
  resources: {
    tr: {
      common: commonTr,
      auth: authTr,
      onboarding: onboardingTr,
      panel: panelTr,
    },
    en: {
      common: commonEn,
      auth: authEn,
      onboarding: onboardingEn,
      panel: panelEn,
    },
  },
  ns: ["common", "auth", "onboarding", "panel"],
  defaultNS: "common",
});

export default i18next;
