import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import en from "../resources/en.json";
import hi from "../resources/hi.json";
import ml from "../resources/ml.json";
import { mergeWithFallback } from "../../utils/translationHelpers";

// Language type
export type Language = "en" | "hi" | "ml";

// Translation interface
export type Translation = Record<string, any>;

// Translations
const englishTranslation = mergeWithFallback(en, en) as Translation;

const toTranslation = (resource: unknown): Translation =>
  mergeWithFallback(resource, englishTranslation) as Translation;

const translations: Record<Language, Translation> = {
  en: englishTranslation,
  hi: toTranslation(hi),
  ml: toTranslation(ml),
};

// Language state interface
export interface LanguageState {
  currentLanguage: Language;
  translations: Translation;
  isLoading: boolean;
}

// Get initial language from localStorage with fallback
const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "en";
  
  const stored = localStorage.getItem("language") || localStorage.getItem("lang");
  if (stored && (stored === "en" || stored === "hi" || stored === "ml")) {
    return stored as Language;
  }
  return "en";
};

// Initial state
const initialState: LanguageState = {
  currentLanguage: getInitialLanguage(),
  translations: translations.en,
  isLoading: false,
};

// Language slice
const languageSlice = createSlice({
  name: "language",
  initialState: {
    ...initialState,
    translations: translations[initialState.currentLanguage],
  },
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.currentLanguage = action.payload;
      state.translations = translations[action.payload];
      localStorage.setItem("language", action.payload);
    },
    initializeLanguage: (state) => {
      // Initialize language from localStorage with fallback to 'lang' key
      const savedLanguage = (localStorage.getItem("language") || localStorage.getItem("lang")) as Language | null;
      if (savedLanguage && translations[savedLanguage]) {
        state.currentLanguage = savedLanguage;
        state.translations = translations[savedLanguage];
      } else {
        state.currentLanguage = "en";
        state.translations = translations.en;
      }
    },
    resetLanguage: (state) => {
      state.currentLanguage = "en";
      state.translations = translations.en;
      localStorage.removeItem("language");
    },
  },
});

export const { setLanguage, initializeLanguage, resetLanguage } =
  languageSlice.actions;
export default languageSlice.reducer;

// Selectors
export const selectLanguage = (state: { language: LanguageState }) =>
  state.language.currentLanguage;
export const selectTranslations = (state: { language: LanguageState }) =>
  state.language.translations;
export const selectLanguageLoading = (state: { language: LanguageState }) =>
  state.language.isLoading;

// Export translations for direct use
export { translations };
