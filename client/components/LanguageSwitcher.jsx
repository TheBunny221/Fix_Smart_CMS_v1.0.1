import React, { useState } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  setLanguage,
  selectLanguage,
  selectTranslations,
} from "../store/slices/languageSlice";
import { updateUserPreferences } from "../store/slices/authSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { Globe, Check, Loader2 } from "lucide-react";
import { toast } from "./ui/use-toast";
import { cn } from "../lib/utils";

// Language configuration
const LANGUAGES = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    rtl,
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    rtl,
  },
  ml: {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    flag: "🇮🇳",
    rtl,
  },
};

 keyof typeof LANGUAGES;



export const LanguageSwitcher: React.FC = ({
  variant = "dropdown",
  showFlag = true,
  showNativeName = true,
  showBadge = false,
  size = "md",
  className,
  onLanguageChange,
}) => {
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector(selectLanguage);
  const translations = useAppSelector(selectTranslations);
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (newLanguage) => {
    if (newLanguage === currentLanguage || isChanging) return;

    setIsChanging(true);

    try {
      // Update language in store
      dispatch(setLanguage(newLanguage));

      // Update user preferences if authenticated
      if (isAuthenticated) {
        await dispatch(updateUserPreferences({ language),
        ).unwrap();
      }

      // Show success toast
      toast({
        title,
        description: `Language changed to ${LANGUAGES[newLanguage].name}`,
        variant: "default",
      });

      // Call optional callback
      onLanguageChange?.(newLanguage);

      // Update document language attribute
      document.documentElement.lang = newLanguage;

      // Update document direction for RTL languages
      document.documentElement.dir = LANGUAGES[newLanguage].rtl ? "rtl" : "ltr";
    } catch (error) {
      // Rollback language change on error
      dispatch(setLanguage(currentLanguage));

      toast({
        title,
        description: "Failed to update language preferences",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  const getLanguageLabel = (lang, showFull = false) => {
    const language = LANGUAGES[lang];
    const parts = [];

    if (showFlag) parts.push(language.flag);
    if (showNativeName || showFull) parts.push(language.nativeName);
    else parts.push(language.name);

    return parts.join(" ");
  };

  const sizeClasses = {
    sm: "text-sm h-8",
    md: "text-sm h-9",
    lg: "text-base h-10",
  };

  if (variant === "select") {
    return (
      
        
          
            
              {isChanging ? (
                
                  
                  Changing...
                
              ) : (
                getLanguageLabel(currentLanguage)
              )}
            
          
          
            {Object.entries(LANGUAGES).map(([code, language]) => (
              
                
                  {language.flag}
                  {language.nativeName}
                  {code === currentLanguage && (
                    
                  )}
                
              
            ))}
          
        
        {showBadge && (
          
            {LANGUAGES[currentLanguage].code.toUpperCase()}
          
        )}
      
    );
  }

  if (variant === "dropdown") {
    return (
      
        
          
            
              {isChanging ? (
                
                  
                  Changing...
                
              ) : (
                
                  
                  {getLanguageLabel(currentLanguage)}
                
              )}
            
          
          
            {Object.entries(LANGUAGES).map(([code, language]) => (
               handleLanguageChange(code)}
                disabled={code === currentLanguage}
                className={cn(
                  "flex items-center justify-between space-x-2 cursor-pointer",
                  code === currentLanguage && "bg-accent",
                )}
              >
                
                  {language.flag}
                  
                    {language.nativeName}
                    
                      {language.name}
                    
                  
                
                {code === currentLanguage && (
                  
                )}
              
            ))}
          
        
        {showBadge && (
          
            {LANGUAGES[currentLanguage].code.toUpperCase()}
          
        )}
      
    );
  }

  // Button variant
  return (
    
      {Object.entries(LANGUAGES).map(([code, language]) => (
         handleLanguageChange(code)}
          disabled={isChanging || isLoading || code === currentLanguage}
          className={cn(
            "relative",
            sizeClasses[size],
            code === currentLanguage && "pointer-events-none",
          )}
        >
          {isChanging && code === currentLanguage ? (
            
          ) : (
            getLanguageLabel(code)
          )}
          {showBadge && code === currentLanguage && (
            
              
            
          )}
        
      ))}
    
  );
};

// Hook for language utilities
export const useLanguage = () => {
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector(selectLanguage);
  const translations = useAppSelector(selectTranslations);

  const changeLanguage = (language) => {
    dispatch(setLanguage(language));
  };

  const getCurrentLanguageInfo = () => LANGUAGES[currentLanguage];

  const isRTL = () => LANGUAGES[currentLanguage].rtl;

  const formatDate = (date, options) => {
    const locale =
      currentLanguage === "hi"
        ? "hi-IN"
         === "ml"
          ? "ml-IN"
          : "en-US";

    return new Intl.DateTimeFormat(locale, {
      year,
      month: "long",
      day: "numeric",
      ...options,
    }).format(date);
  };

  const formatNumber = (number, options) => {
    const locale =
      currentLanguage === "hi"
        ? "hi-IN"
         === "ml"
          ? "ml-IN"
          : "en-US";

    return new Intl.NumberFormat(locale, options).format(number);
  };

  const formatCurrency = (amount, currency = "INR") => {
    const locale =
      currentLanguage === "hi"
        ? "hi-IN"
         === "ml"
          ? "ml-IN"
          : "en-IN";

    return new Intl.NumberFormat(locale, {
      style,
      currency,
    }).format(amount);
  };

  const getDirection = () => (isRTL() ? "rtl" : "ltr");

  return {
    currentLanguage,
    translations,
    changeLanguage,
    getCurrentLanguageInfo,
    isRTL,
    formatDate,
    formatNumber,
    formatCurrency,
    getDirection,
    availableLanguages,
  };
};

// Text direction provider component


export const TextDirectionProvider: React.FC = ({
  children,
}) => {
  const { getDirection } = useLanguage();

  React.useEffect(() => {
    document.documentElement.dir = getDirection();
  }, [getDirection]);

  return {children};
};

// Translation helper component


export const Translate: React.FC = ({
  path,
  values,
  fallback,
}) => {
  const translations = useAppSelector(selectTranslations);

  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  let text = getNestedValue(translations, path) || fallback || path;

  // Replace placeholders with values
  if (values && typeof text === "string") {
    Object.entries(values).forEach(([key, value]) => {
      text = text.replace(new RegExp(`{${key}}`, "g"), String(value));
    });
  }

  return {text};
};

// Higher-order component for automatic translation
export function withTranslations(Component,
) {
  return function TranslatedComponent(props) {
    const translations = useAppSelector(selectTranslations);
    return ;
  };
}

export default LanguageSwitcher;
