import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { getCurrentLanguage, setLabelsLanguage, type AppLanguage } from "../constants/labels";

type I18nContextValue = {
  language: AppLanguage;
  direction: "rtl" | "ltr";
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const LANGUAGE_STORAGE_KEY = "app-language";

const resolveDirection = (language: AppLanguage): "rtl" | "ltr" => {
  return language === "ar" ? "rtl" : "ltr";
};

const resolveInitialLanguage = (): AppLanguage => {
  if (typeof window !== "undefined") {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage === "ar" || storedLanguage === "en") {
      setLabelsLanguage(storedLanguage);
      return storedLanguage;
    }
  }

  const fallbackLanguage = getCurrentLanguage();
  setLabelsLanguage(fallbackLanguage);
  return fallbackLanguage;
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(resolveInitialLanguage);
  const direction = resolveDirection(language);

  useLayoutEffect(() => {
    setLabelsLanguage(language);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }

    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dir = direction;
  }, [direction, language]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      language,
      direction,
      setLanguage: (nextLanguage) => setLanguageState(nextLanguage),
      toggleLanguage: () => setLanguageState((prev) => (prev === "ar" ? "en" : "ar"))
    };
  }, [direction, language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
};
