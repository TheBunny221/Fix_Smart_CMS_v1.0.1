import { useEffect } from "react";
import { useSelector } from "react-redux";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import en from "@/store/resources/en.json";
import hi from "@/store/resources/hi.json";
import ml from "@/store/resources/ml.json";
const resources = {
    en: { translation: en },
    hi: { translation: hi },
    ml: { translation: ml },
};
const FALLBACK_LANGUAGE = "en";
const getPersistedLanguage = () => {
    if (typeof window === "undefined") {
        return FALLBACK_LANGUAGE;
    }
    const stored = window.localStorage.getItem("lang") ??
        window.localStorage.getItem("language");
    if (stored && Object.keys(resources).includes(stored)) {
        return stored;
    }
    return FALLBACK_LANGUAGE;
};
if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
        resources,
        lng: getPersistedLanguage(),
        fallbackLng: FALLBACK_LANGUAGE,
        defaultNS: "translation",
        ns: ["translation"],
        interpolation: {
            escapeValue: false,
        },
        returnEmptyString: false,
        returnNull: false,
    });
}
export const useAppTranslation = () => {
    const currentLanguage = useSelector((state) => state.language?.currentLanguage ?? FALLBACK_LANGUAGE);
    const translationResponse = useTranslation();
    useEffect(() => {
        const nextLanguage = currentLanguage ?? FALLBACK_LANGUAGE;
        if (i18n.language !== nextLanguage) {
            void i18n.changeLanguage(nextLanguage);
        }
        if (typeof window !== "undefined") {
            window.localStorage.setItem("lang", nextLanguage);
        }
    }, [currentLanguage]);
    return translationResponse;
};
export default i18n;
