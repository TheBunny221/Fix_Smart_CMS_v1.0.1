import { createSlice } from "@reduxjs/toolkit";
import en from "../resources/en.json";
import hi from "../resources/hi.json";
import ml from "../resources/ml.json";
import { mergeWithFallback } from "../../utils/translationHelpers";
// Translations
const englishTranslation = mergeWithFallback(en, en);
const toTranslation = (resource) => mergeWithFallback(resource, englishTranslation);
const translations = {
    en: englishTranslation,
    hi: toTranslation(hi),
    ml: toTranslation(ml),
};
// Initial state
const initialState = {
    currentLanguage: localStorage.getItem("language") || "en",
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
        setLanguage: (state, action) => {
            state.currentLanguage = action.payload;
            state.translations = translations[action.payload];
            localStorage.setItem("language", action.payload);
        },
        initializeLanguage: (state) => {
            // Initialize language from localStorage or default to English
            const savedLanguage = localStorage.getItem("language");
            if (savedLanguage && translations[savedLanguage]) {
                state.currentLanguage = savedLanguage;
                state.translations = translations[savedLanguage];
            }
            else {
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
export const { setLanguage, initializeLanguage, resetLanguage } = languageSlice.actions;
export default languageSlice.reducer;
// Selectors
export const selectLanguage = (state) => state.language.currentLanguage;
export const selectTranslations = (state) => state.language.translations;
export const selectLanguageLoading = (state) => state.language.isLoading;
// Export translations for direct use
export { translations };
