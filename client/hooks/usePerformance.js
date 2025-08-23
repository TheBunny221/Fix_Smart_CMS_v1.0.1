import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { debounce, throttle } from "lodash-es";

// Hook for debounced values
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for debounced callbacks
export function useDebouncedCallback any>(callback,
  delay,
  deps,
) {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [...deps, delay],
  );

  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return debouncedCallback;
}

// Hook for throttled callbacks
export function useThrottledCallback any>(callback,
  delay,
  deps,
) {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [...deps, delay],
  );

  useEffect(() => {
    return () => {
      throttledCallback.cancel();
    };
  }, [throttledCallback]);

  return throttledCallback;
}

// Hook for memoized expensive calculations
export function useMemoizedComputation(computation) => T,
  deps: React.DependencyList,
) {
  return useMemo(computation, deps);
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  options = {},
): [React.RefCallback, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState(null);

  const callbackRef = useCallback((node) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return [callbackRef, isIntersecting];
}

// Hook for virtual scrolling
export function useVirtualScrolling({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index,
      offsetTop: (startIndex + index) * itemHeight,
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    onScroll,
    startIndex,
    endIndex,
  };
}

// Hook for image lazy loading
export function useLazyImage(src, placeholder?) {
  const [imageSrc, setImageSrc] = useState(placeholder || "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver();

  useEffect(() => {
    if (isIntersecting && src && isLoaded && isError) {
      const img = new Image();

      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };

      img.onerror = () => {
        setIsError(true);
      };

      img.src = src;
    }
  }, [isIntersecting, src, isLoaded, isError]);

  return {
    ref,
    src,
    isLoaded,
    isError,
    isIntersecting,
  };
}

// Hook for prefetching data
export function usePrefetch(prefetchFn) => Promise,
  deps: React.DependencyList = [],
  delay = 100,
) {
  const timeoutRef = useRef();

  const prefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      prefetchFn().catch(() => {
        // Silently ignore prefetch errors
      });
    }, delay);
  }, [...deps, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return prefetch;
}

// Hook for measuring component performance
export function usePerformanceMeasurement(name) {
  const startTimeRef = useRef();

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      console.log(`Performance [${name}])}ms`);

      // Send to analytics if needed
      if (window.gtag) {
        window.gtag("event", "timing_complete", {
          name,
          value),
        });
      }

      startTimeRef.current = undefined;
      return duration;
    }
    return 0;
  }, [name]);

  return { start, end };
}

// Hook for batch state updates
export function useBatchUpdates(initialState, delay = 16) {
  const [state, setState] = useState(initialState);
  const pendingUpdatesRef = useRef[]>([]);
  const timeoutRef = useRef();

  const batchedSetState = useCallback((update) => Partial)) => {
      const updateObject =
        typeof update === "function" ? update(state) ;
      pendingUpdatesRef.current.push(updateObject);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const mergedUpdate = pendingUpdatesRef.current.reduce(
          (acc, update) => ({ ...acc, ...update }),
          {},
        );

        setState((prev) => ({ ...prev, ...mergedUpdate }));
        pendingUpdatesRef.current = [];
      }, delay);
    },
    [state, delay],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchedSetState];
}

// Hook for optimized list rendering
export function useOptimizedList({
  items,
  getItemKey,
  compareItems,
}, index) => string | number;
  compareItems: (a, b) => boolean;
}) {
  const memoizedItems = useMemo(() => {
    return items.map((item, index) => ({
      key, index),
      item,
      index,
    }));
  }, [items, getItemKey]);

  const itemsMap = useMemo(() => {
    const map = new Map();
    memoizedItems.forEach(({ key, item }) => {
      map.set(key, item);
    });
    return map;
  }, [memoizedItems]);

  const getItem = useCallback(
    (key) => {
      return itemsMap.get(key);
    },
    [itemsMap],
  );

  const hasItem = useCallback(
    (key) => {
      return itemsMap.has(key);
    },
    [itemsMap],
  );

  return {
    items,
    getItem,
    hasItem,
    itemsMap,
  };
}

// Hook for component visibility tracking
export function useVisibilityTracking(threshold = 0.5) {
  const [isVisible, setIsVisible] = useState(false);
  const [visibilityTime, setVisibilityTime] = useState(0);
  const startTimeRef = useRef();

  const [ref, isIntersecting] = useIntersectionObserver({
    threshold,
  });

  useEffect(() => {
    if (isIntersecting && isVisible) {
      setIsVisible(true);
      startTimeRef.current = Date.now();
    } else if (isIntersecting && isVisible) {
      setIsVisible(false);
      if (startTimeRef.current) {
        setVisibilityTime(Date.now() - startTimeRef.current);
      }
    }
  }, [isIntersecting, isVisible]);

  return {
    ref,
    isVisible,
    visibilityTime,
  };
}

// Hook for resource preloading
export function useResourcePreloader() {
  const preloadedResources = useRef(new Set());

  const preloadImage = useCallback((src) => {
    if (preloadedResources.current.has(src)) return;

    const img = new Image();
    img.src = src;
    preloadedResources.current.add(src);
  }, []);

  const preloadScript = useCallback((src) => {
    if (preloadedResources.current.has(src)) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = src;
    document.head.appendChild(link);
    preloadedResources.current.add(src);
  }, []);

  const preloadStylesheet = useCallback((href) => {
    if (preloadedResources.current.has(href)) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "style";
    link.href = href;
    document.head.appendChild(link);
    preloadedResources.current.add(href);
  }, []);

  return {
    preloadImage,
    preloadScript,
    preloadStylesheet,
  };
}

// Hook for memory usage monitoring
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ("memory" in performance) {
        setMemoryInfo((performance).memory);
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

// Custom hook for optimized re-renders
export function useShallowMemo(obj) {
  const ref = useRef(obj);

  return useMemo(() => {
    const keys = Object.keys(obj);

    // Check if any values have changed
    for (const key of keys) {
      if (obj[key] == ref.current[key]) {
        ref.current = obj;
        break;
      }
    }

    return ref.current;
  }, [obj]);
}
