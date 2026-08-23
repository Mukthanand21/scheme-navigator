/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, type Language, type TranslationKey } from "./translations";

interface LanguageContextProps {
  lang: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("scheme_navigator_lang");
    return (saved === "en" || saved === "te") ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem("scheme_navigator_lang", lang);
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "te" : "en"));
  };

  const t = (key: TranslationKey, replacements?: Record<string, string | number>): string => {
    const dict = translations[lang];
    let text = dict[key] || translations.en[key] || String(key);

    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
