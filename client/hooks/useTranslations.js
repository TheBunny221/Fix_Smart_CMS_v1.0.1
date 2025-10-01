import { useMemo } from "react";
import en from "@/store/resources/en.json";
import { useAppTranslation } from "@/utils/i18n";
import { mergeWithFallback } from "@/utils/translationHelpers";
import { useAppSelector } from "../store/hooks";
export const useTranslations = () => {
    const { i18n } = useAppTranslation();
    const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
    return useMemo(() => {
        const resource = i18n.getResourceBundle(currentLanguage, "translation");
        const fallback = i18n.getResourceBundle("en", "translation") ??
            en;
        return mergeWithFallback(resource, fallback);
    }, [currentLanguage, i18n]);
};
export default useTranslations;
