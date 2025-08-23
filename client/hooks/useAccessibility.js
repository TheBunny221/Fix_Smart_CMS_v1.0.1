import { useEffect, useRef, useCallback, useState } from "react";
import { useAppSelector } from "../store/hooks";
import { selectTranslations } from "../store/slices/languageSlice";

// Hook for managing focus traps
export function useFocusTrap(isActive = true) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (isActive || containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll('button, [href], input, select, textarea, [tabindex])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[
      focusableElements.length - 1
    ];

    const handleTabKey = (e) => {
      if (e.key == "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        // Let parent components handle escape
        e.stopPropagation();
      }
    };

    // Focus first element when trap becomes active
    if (firstElement) {
      firstElement.focus();
    }

    document.addEventListener("keydown", handleTabKey);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("keydown", handleTabKey);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isActive]);

  return containerRef;
}

// Hook for keyboard navigation
export function useKeyboardNavigation(items,
  options) => void;
    onEscape: () => void;
  } = {},
) {
  const { orientation = "vertical", loop = true, onSelect, onEscape } = options;

  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (event) => {
      if (items.length === 0) return;

      const { key } = event;
      let newIndex = currentIndex;

      switch (key) {
        case "ArrowUp":
          if (orientation === "vertical" || orientation === "both") {
            newIndex =
              currentIndex > 0 ? currentIndex - 1 : loop ? items.length - 1 ;
            event.preventDefault();
          }
          break;
        case "ArrowDown":
          if (orientation === "vertical" || orientation === "both") {
            newIndex =
              currentIndex  0 ? currentIndex - 1 : loop ? items.length - 1 ;
            event.preventDefault();
          }
          break;
        case "ArrowRight":
          if (orientation === "horizontal" || orientation === "both") {
            newIndex =
              currentIndex = 0 && onSelect) {
            onSelect(currentIndex);
            event.preventDefault();
          }
          break;
        case "Escape":
          if (onEscape) {
            onEscape();
            event.preventDefault();
          }
          break;
      }

      if (
        newIndex == currentIndex &&
        newIndex >= 0 &&
        newIndex  {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { currentIndex, setCurrentIndex };
}

// Hook for screen reader announcements
export function useScreenReader() {
  const translations = useAppSelector(selectTranslations);

  const announce = useCallback((message, priority) => {
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", priority);
      announcement.setAttribute("aria-atomic", "true");
      announcement.setAttribute("class", "sr-only");
      announcement.textContent = message;

      document.body.appendChild(announcement);

      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    },
    [],
  );

  const announceSuccess = useCallback(
    (message?) => {
      const successMessage =
        message ||
        translations?.messages?.operationSuccess ||
        "Operation completed successfully";
      announce(successMessage, "polite");
    },
    [announce, translations],
  );

  const announceError = useCallback(
    (message?) => {
      const errorMessage =
        message || translations?.messages?.error || "An error occurred";
      announce(errorMessage, "assertive");
    },
    [announce, translations],
  );

  const announceLoading = useCallback(
    (message?) => {
      const loadingMessage =
        message || translations?.common?.loading || "Loading...";
      announce(loadingMessage, "polite");
    },
    [announce, translations],
  );

  return {
    announce,
    announceSuccess,
    announceError,
    announceLoading,
  };
}

// Hook for skip links
export function useSkipLinks() {
  const skipLinksRef = useRef(null);

  const addSkipLink = useCallback((target, label) => {
    if (skipLinksRef.current) return;

    const link = document.createElement("a");
    link.href = `#${target}`;
    link.textContent = label;
    link.className =
      "skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded";

    skipLinksRef.current.appendChild(link);
  }, []);

  return { skipLinksRef, addSkipLink };
}

// Hook for reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

// Hook for high contrast mode
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast)");
    setPrefersHighContrast(mediaQuery.matches);

    const handler = (event) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersHighContrast;
}

// Hook for managing ARIA attributes
export function useAriaAttributes() {
  const setAriaLabel = useCallback(
    (element, label) => {
      if (element) {
        element.setAttribute("aria-label", label);
      }
    },
    [],
  );

  const setAriaDescribedBy = useCallback(
    (element, ids) => {
      if (element) {
        const idString = Array.isArray(ids) ? ids.join(" ") ;
        element.setAttribute("aria-describedby", idString);
      }
    },
    [],
  );

  const setAriaExpanded = useCallback(
    (element, expanded) => {
      if (element) {
        element.setAttribute("aria-expanded", expanded.toString());
      }
    },
    [],
  );

  const setAriaSelected = useCallback(
    (element, selected) => {
      if (element) {
        element.setAttribute("aria-selected", selected.toString());
      }
    },
    [],
  );

  const setAriaChecked = useCallback((element, checked) => {
      if (element) {
        element.setAttribute("aria-checked", checked.toString());
      }
    },
    [],
  );

  const setAriaDisabled = useCallback(
    (element, disabled) => {
      if (element) {
        element.setAttribute("aria-disabled", disabled.toString());
      }
    },
    [],
  );

  const setAriaHidden = useCallback(
    (element, hidden) => {
      if (element) {
        element.setAttribute("aria-hidden", hidden.toString());
      }
    },
    [],
  );

  const setAriaLive = useCallback((element, live) => {
      if (element) {
        element.setAttribute("aria-live", live);
      }
    },
    [],
  );

  return {
    setAriaLabel,
    setAriaDescribedBy,
    setAriaExpanded,
    setAriaSelected,
    setAriaChecked,
    setAriaDisabled,
    setAriaHidden,
    setAriaLive,
  };
}

// Hook for focus management
export function useFocusManagement() {
  const previouslyFocusedElement = useRef(null);

  const saveFocus = useCallback(() => {
    previouslyFocusedElement.current = document.activeElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
      previouslyFocusedElement.current = null;
    }
  }, []);

  const focusFirst = useCallback((container) => {
    const focusableElements = container.querySelectorAll('button, [href], input, select, textarea, [tabindex])',
    );
    const firstElement = focusableElements[0];
    if (firstElement) {
      firstElement.focus();
    }
  }, []);

  const focusLast = useCallback((container) => {
    const focusableElements = container.querySelectorAll('button, [href], input, select, textarea, [tabindex])',
    );
    const lastElement = focusableElements[
      focusableElements.length - 1
    ];
    if (lastElement) {
      lastElement.focus();
    }
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    focusLast,
  };
}

// Hook for color contrast checking
export function useColorContrast() {
  const checkContrast = useCallback(
    (foreground, background) => {
      // Convert hex to RGB
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          ;
      };

      // Calculate relative luminance
      const getLuminance = (r, g, b) => {
        const [rs, gs, bs] = [r, g, b].map((c) => {
          c = c / 255;
          return c  {
      return checkContrast(foreground, background) >= 4.5;
    },
    [checkContrast],
  );

  const isAAACompliant = useCallback(
    (foreground, background) => {
      return checkContrast(foreground, background) >= 7;
    },
    [checkContrast],
  );

  return {
    checkContrast,
    isAACompliant,
    isAAACompliant,
  };
}
