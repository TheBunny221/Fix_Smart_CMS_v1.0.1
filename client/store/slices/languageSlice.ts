import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  translations,
  type Language,
  type Translation,
} from "../resources/translations";
import type { RootState } from "..";

const isBrowser = typeof window !== "undefined";

const isLanguage = (value: unknown): value is Language =>
  typeof value === "string" &&
  SUPPORTED_LANGUAGES.some((supported) => supported === value);

const getInitialLanguage = (): Language => {
  if (!isBrowser) {
    return DEFAULT_LANGUAGE;
  }

  const stored = window.localStorage.getItem("language");
  if (isLanguage(stored)) {
    return stored;
  }

  return DEFAULT_LANGUAGE;
};

const initialLanguage = getInitialLanguage();

export interface LanguageState {
  currentLanguage: Language;
  translations: Translation;
  isLoading: boolean;
}

const initialState: LanguageState = {
  currentLanguage: initialLanguage,
  translations: translations[initialLanguage],
  isLoading: false,
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      const nextLanguage = action.payload;
      state.currentLanguage = nextLanguage;
      state.translations = translations[nextLanguage];

      if (isBrowser) {
        window.localStorage.setItem("language", nextLanguage);
      }
    },
    initializeLanguage: (state) => {
      const storedLanguage = getInitialLanguage();
      state.currentLanguage = storedLanguage;
      state.translations = translations[storedLanguage];
    },
    resetLanguage: (state) => {
      state.currentLanguage = DEFAULT_LANGUAGE;
      state.translations = translations[DEFAULT_LANGUAGE];

      if (isBrowser) {
        window.localStorage.removeItem("language");
      }
    },
  },
});

export const { setLanguage, initializeLanguage, resetLanguage } =
  languageSlice.actions;
export default languageSlice.reducer;

export const selectLanguage = (state: RootState) => state.language.currentLanguage;
export const selectTranslations = (state: RootState) =>
  state.language.translations;
export const selectLanguageLoading = (state: RootState) =>
  state.language.isLoading;

export { translations, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "../resources/translations";
export type { Language, Translation } from "../resources/translations";
