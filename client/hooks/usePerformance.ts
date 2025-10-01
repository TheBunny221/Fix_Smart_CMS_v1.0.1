import {
  DependencyList,
  RefCallback,
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Lightweight debounce/throttle implementations to avoid extra deps
type AnyFn = (...args: unknown[]) => unknown;

type Cancelable<T extends AnyFn> = T & { cancel: () => void };

interface VirtualItem<T> {
  item: T;
  index: number;
  offsetTop: number;
}

interface VirtualScrollResult<T> {
  visibleItems: Array<VirtualItem<T>>;
  totalHeight: number;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
  startIndex: number;
  endIndex: number;
}

function createDebounce<T extends AnyFn>(fn: T, wait: number): Cancelable<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const wrapped = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  }) as Cancelable<T>;
  wrapped.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  return wrapped;
}

function createThrottle<T extends AnyFn>(fn: T, wait: number): Cancelable<T> {
  let last = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  const invoke = () => {
    last = Date.now();
    timeout = null;
    if (lastArgs) {
      fn(...lastArgs);
      lastArgs = null;
    }
  };
  const wrapped = ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    lastArgs = args;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      invoke();
    } else if (!timeout) {
      timeout = setTimeout(invoke, remaining);
    }
  }) as Cancelable<T>;
  wrapped.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = null;
  };
  return wrapped;
}

// Hook for debounced values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

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
export function useDebouncedCallback<T extends AnyFn>(
  callback: T,
  delay: number,
  deps: DependencyList = [],
): T {
  const debouncedCallback = useMemo(
    () => createDebounce(callback, delay),
    [...deps, delay],
  );

  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);

  return debouncedCallback as T;
}

// Hook for throttled callbacks
export function useThrottledCallback<T extends AnyFn>(
  callback: T,
  delay: number,
  deps: DependencyList = [],
): T {
  const throttledCallback = useMemo(
    () => createThrottle(callback, delay),
    [...deps, delay],
  );

  useEffect(() => {
    return () => {
      throttledCallback.cancel();
    };
  }, [throttledCallback]);

  return throttledCallback as T;
}

// Hook for memoized expensive calculations
export function useMemoizedComputation<T>(
  computation: () => T,
  deps: DependencyList,
): T {
  return useMemo(computation, deps);
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  options: IntersectionObserverInit = {},
): [RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  const callbackRef = useCallback((node: Element | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsIntersecting(entry.isIntersecting);
        }
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
export function useVirtualScrolling<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}): VirtualScrollResult<T> {
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
      index: startIndex + index,
      offsetTop: (startIndex + index) * itemHeight,
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const onScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
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
interface LazyImageResult {
  ref: RefCallback<Element>;
  src: string;
  isLoaded: boolean;
  isError: boolean;
  isIntersecting: boolean;
}

export function useLazyImage(src: string, placeholder?: string): LazyImageResult {
  const [imageSrc, setImageSrc] = useState(placeholder || "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver();

  useEffect(() => {
    if (isIntersecting && src && !isLoaded && !isError) {
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
    src: imageSrc,
    isLoaded,
    isError,
    isIntersecting,
  };
}

// Hook for prefetching data
export function usePrefetch<T>(
  prefetchFn: () => Promise<T>,
  deps: DependencyList = [],
  delay = 100,
): () => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      prefetchFn().catch(() => {
        // Silently ignore prefetch errors
      });
    }, delay);
  }, [prefetchFn, delay, ...deps]);

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
export function usePerformanceMeasurement(name: string) {
  const startTimeRef = useRef<number | null>(null);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (startTimeRef.current !== null) {
      const duration = performance.now() - startTimeRef.current;
      console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);

      // Send to analytics if needed
      if (window.gtag) {
        window.gtag("event", "timing_complete", {
          name,
          value: Math.round(duration),
        });
      }

      startTimeRef.current = null;
      return duration;
    }
    return 0;
  }, [name]);

  return { start, end };
}

// Hook for batch state updates
export function useBatchUpdates<T>(
  initialState: T,
  delay = 16,
): readonly [T, (update: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdatesRef = useRef<
    Array<Partial<T> | ((prev: T) => Partial<T>)>
  >([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const batchedSetState = useCallback(
    (update: Partial<T> | ((prev: T) => Partial<T>)) => {
      pendingUpdatesRef.current.push(update);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setState((prev) => {
          const mergedUpdate = pendingUpdatesRef.current.reduce<Partial<T>>(
            (acc, pendingUpdate) => {
              const partial =
                typeof pendingUpdate === "function"
                  ? (pendingUpdate as (prevState: T) => Partial<T>)(prev)
                  : pendingUpdate;
              return { ...acc, ...partial };
            },
            {},
          );

          pendingUpdatesRef.current = [];
          return { ...prev, ...mergedUpdate };
        });
      }, delay);
    },
    [delay],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchedSetState] as const;
}

// Hook for optimized list rendering
export function useOptimizedList<T>({
  items,
  getItemKey,
  compareItems,
}: {
  items: T[];
  getItemKey: (item: T, index: number) => string | number;
  compareItems?: (a: T, b: T) => boolean;
}) {
  const memoizedItems = useMemo(() => {
    return items.map((item, index) => ({
      key: getItemKey(item, index),
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
    (key: string | number) => {
      return itemsMap.get(key);
    },
    [itemsMap],
  );

  const hasItem = useCallback(
    (key: string | number) => {
      return itemsMap.has(key);
    },
    [itemsMap],
  );

  return {
    items: memoizedItems,
    getItem,
    hasItem,
    itemsMap,
  };
}

// Hook for component visibility tracking
export function useVisibilityTracking(threshold = 0.5) {
  const [isVisible, setIsVisible] = useState(false);
  const [visibilityTime, setVisibilityTime] = useState(0);
  const startTimeRef = useRef<number>();

  const [ref, isIntersecting] = useIntersectionObserver({
    threshold,
  });

  useEffect(() => {
    if (isIntersecting && !isVisible) {
      setIsVisible(true);
      startTimeRef.current = Date.now();
    } else if (!isIntersecting && isVisible) {
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
  const preloadedResources = useRef(new Set<string>());

  const preloadImage = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return;

    const img = new Image();
    img.src = src;
    preloadedResources.current.add(src);
  }, []);

  const preloadScript = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = src;
    document.head.appendChild(link);
    preloadedResources.current.add(src);
  }, []);

  const preloadStylesheet = useCallback((href: string) => {
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
type MemoryInfo = {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
};

export function useMemoryMonitoring(): MemoryInfo | null {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      const perf = performance as Performance & { memory?: MemoryInfo };
      if (perf.memory) {
        setMemoryInfo(perf.memory);
      }
    };

    updateMemoryInfo();
    const interval = window.setInterval(updateMemoryInfo, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return memoryInfo;
}

// Custom hook for optimized re-renders
export function useShallowMemo<T extends object>(obj: T): T {
  const ref = useRef<T>(obj);

  return useMemo(() => {
    const keys = Object.keys(obj) as Array<keyof T>;

    // Check if any values have changed
    for (const key of keys) {
      if (obj[key] !== ref.current[key]) {
        ref.current = obj;
        break;
      }
    }

    return ref.current;
  }, [obj]);
}
