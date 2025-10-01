import { useMemo } from "react";

import en from "@/store/resources/en.json";
import { useAppTranslation } from "@/utils/i18n";
import { mergeWithFallback } from "@/utils/translationHelpers";
import { useAppSelector } from "../store/hooks";

type TranslationResource = typeof en;

export const useTranslations = (): TranslationResource => {
  const { i18n } = useAppTranslation();
  const currentLanguage = useAppSelector(
    (state) => state.language.currentLanguage,
  );

  return useMemo(() => {
    const resource = i18n.getResourceBundle(
      currentLanguage,
      "translation",
    ) as TranslationResource | undefined;

    const fallback =
      (i18n.getResourceBundle("en", "translation") as TranslationResource) ??
      en;

    return mergeWithFallback(resource, fallback) as TranslationResource;
  }, [currentLanguage, i18n]);
};

export default useTranslations;
