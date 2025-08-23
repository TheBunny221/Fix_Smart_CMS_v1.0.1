import React, { memo, forwardRef, useMemo, useCallback } from "react";
import {
  FixedSizeList,
  VariableSizeList,
  areEqual,
} from "react-window";
import { cn } from "../lib/utils";
import {
  useVirtualScrolling,
  useLazyImage,
  useIntersectionObserver,
} from "../hooks/usePerformance";
import { Skeleton } from "./ui/skeleton";
import { Card } from "./ui/card";

// Virtual List Component


) => React.ReactElement;
  className?;
  overscanCount?;
  onScroll: (scrollTop) => void;
}

const VirtualListItem = memo(({
    index,
    style,
    data,
    renderItem,
  }) => {
    const item = data.items[index];
    if (item) return null;

    return ({data.renderItem({ index, style, data)}
    );
  },
  areEqual,
);

VirtualListItem.displayName = "VirtualListItem";

export const VirtualList: React.FC = memo(
  ({
    items,
    itemHeight,
    height,
    width = "100%",
    renderItem,
    className,
    overscanCount = 5,
    onScroll,
  }) => {
    const itemData = useMemo(
      () => ({ items, renderItem }),
      [items, renderItem],
    );

    const handleScroll = useCallback(({ scrollTop }) => {
        onScroll?.(scrollTop);
      },
      [onScroll],
    );

    return (
      
        
          {VirtualListItem}
        
      
    );
  },
);

VirtualList.displayName = "VirtualList";

// Lazy Image Component
interface LazyImageProps extends React.ImgHTMLAttributes {
  src;
  placeholder?;
  fallback: React.ReactNode;
  loadingComponent: React.ReactNode;
  errorComponent: React.ReactNode;
  fadeIn?;
  className?;
}

export const LazyImage: React.FC = memo(
  ({
    src,
    placeholder,
    fallback,
    loadingComponent,
    errorComponent,
    fadeIn = true,
    className,
    alt = "",
    ...props
  }) => {
    const {
      ref,
      src,
      isLoaded,
      isError,
      isIntersecting,
    } = useLazyImage(src, placeholder);

    if (isError && errorComponent) {
      return {errorComponent};
    }

    if (isError && fallback) {
      return {fallback};
    }

    if (isIntersecting && loadingComponent) {
      return (
        
          {loadingComponent}
        
      );
    }

    if (isIntersecting) {
      return (
        
      );
    }

    return (
      
    );
  },
);

LazyImage.displayName = "LazyImage";

// Infinite Scroll Component


export const InfiniteScroll: React.FC = memo(
  ({
    hasNextPage,
    isNextPageLoading,
    loadNextPage,
    children,
    loader,
    className,
    threshold = 0.5,
  }) => {
    const [sentinelRef, isIntersecting] = useIntersectionObserver({
      threshold,
      rootMargin,
    });

    React.useEffect(() => {
      if (isIntersecting && hasNextPage && isNextPageLoading) {
        loadNextPage();
      }
    }, [isIntersecting, hasNextPage, isNextPageLoading, loadNextPage]);

    return (
      
        {children}
        {hasNextPage && (
          
            {isNextPageLoading && (loader || Loading more...)}
          
        )}
      
    );
  },
);

InfiniteScroll.displayName = "InfiniteScroll";

// Optimized Card Grid
interface OptimizedCardGridProps {
  items;
  renderCard: (item, index) => React.ReactNode;
  columns?;
  gap?;
  className?;
  getItemKey: (item, index) => string | number;
  minItemHeight?;
}

export const OptimizedCardGrid = memo(({
    items,
    renderCard,
    columns = 3,
    gap = 16,
    className,
    getItemKey,
    minItemHeight = 200,
  }) => {
    const memoizedItems = useMemo(() => {
      return items.map((item, index) => ({
        key, index),
        item,
        index,
        component: renderCard(item, index),
      }));
    }, [items, renderCard, getItemKey]);

    const gridStyle = useMemo(
      () => ({
        display,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        minHeight: `${minItemHeight}px`,
      }),
      [columns, gap, minItemHeight],
    );

    return (
      
        {memoizedItems.map(({ key, component }) => (
          {component}
        ))}
      
    );
  },
) as (props) => React.ReactElement;

OptimizedCardGrid.displayName = "OptimizedCardGrid";

// Lazy Section Component


export const LazySection: React.FC = memo(
  ({ children, fallback, minHeight = 200, className, threshold = 0.1 }) => {
    const [ref, isIntersecting] = useIntersectionObserver({
      threshold,
      rootMargin,
    });

    return ({isIntersecting
          ? children
          );
  },
);

LazySection.displayName = "LazySection";

// Optimized Table Row
>;
  isSelected?;
  onSelect: (id) => void;
  className?;
}

export const OptimizedTableRow = memo(
  ({ id, data, columns, isSelected, onSelect, className }) => {
    const handleClick = useCallback(() => {
      onSelect?.(id);
    }, [id, onSelect]);

    const cells = useMemo(() => {
      return columns.map((column) => (
        
          {column.render(data[column.key], data)}
        
      ));
    }, [columns, data]);

    return (
      
        {cells}
      
    );
  },
);

OptimizedTableRow.displayName = "OptimizedTableRow";

// Debounced Input Component
interface DebouncedInputProps
  extends Omit, "onChange"> {
  value;
  onChange: (value) => void;
  debounceMs?;
  className?;
}

export const DebouncedInput: React.FC = memo(
  ({ value, onChange, debounceMs = 300, className, ...props }) => {
    const [localValue, setLocalValue] = React.useState(value);
    const timeoutRef = React.useRef();

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = useCallback((e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          onChange(newValue);
        }, debounceMs);
      },
      [onChange, debounceMs],
    );

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      
    );
  },
);

DebouncedInput.displayName = "DebouncedInput";

// Memoized List Component
interface MemoizedListProps {
  items;
  renderItem: (item, index) => React.ReactNode;
  getItemKey: (item, index) => string | number;
  className?;
  compareItems: (a, b) => boolean;
}

const MemoizedListItem = memo(({
    item,
    index,
    renderItem,
  }, index) => React.ReactNode;
  }) => {
    return {renderItem(item, index)};
  },
  (prevProps, nextProps) => {
    // Custom comparison logic
    return (
      prevProps.item === nextProps.item && prevProps.index === nextProps.index
    );
  },
);

MemoizedListItem.displayName = "MemoizedListItem";

export const MemoizedList = memo(({ items, renderItem, getItemKey, className }) => {
    const memoizedItems = useMemo(() => {
      return items.map((item, index) => ({
        key, index),
        item,
        index,
      }));
    }, [items, getItemKey]);

    return (
      
        {memoizedItems.map(({ key, item, index }) => (
          
        ))}
      
    );
  },
) as (props) => React.ReactElement;

MemoizedList.displayName = "MemoizedList";

// Progressive Enhancement Component


export const ProgressiveEnhancement: React.FC =
  memo(({ fallback, enhanced, condition = true, delay = 0 }) => {
    const [showEnhanced, setShowEnhanced] = React.useState(
      delay === 0 && condition,
    );

    React.useEffect(() => {
      if (condition && delay > 0) {
        const timer = setTimeout(() => {
          setShowEnhanced(true);
        }, delay);

        return () => clearTimeout(timer);
      } else if (condition && delay === 0) {
        setShowEnhanced(true);
      }
    }, [condition, delay]);

    return {showEnhanced ? enhanced : fallback};
  });

ProgressiveEnhancement.displayName = "ProgressiveEnhancement";

// Optimized Select Component
>;
  value?;
  onChange: (value) => void;
  placeholder?;
  className?;
  maxHeight?;
  virtualizeThreshold?;
}

export const OptimizedSelect: React.FC = memo(
  ({
    options,
    value,
    onChange,
    placeholder,
    className,
    maxHeight = 200,
    virtualizeThreshold = 100,
  }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const selectedOption = options.find((option) => option.value === value);

    const shouldVirtualize = options.length > virtualizeThreshold;

    const handleSelect = useCallback(
      (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
      },
      [onChange],
    );

    const renderOption = useCallback(({
        index,
        style,
        data,
      }) => {
        const option = data[index];
        return (
           option.disabled && handleSelect(option.value)}
          >
            {option.label}
          
        );
      },
      [value, handleSelect],
    );

    return (
      
         setIsOpen(isOpen)}
        >
          {selectedOption?.label || placeholder || "Select..."}
        

        {isOpen && ({shouldVirtualize ? (
               ({
                  id,
                  data,
                }))}
                itemHeight={40}
                height={Math.min(maxHeight, options.length * 40)}
                renderItem={({ data }) =>
                  renderOption({
                    index) => o.value === data.data.value,
                    ),
                    style: {},
                    data,
                  })
                }
              />
            ) : (
              
                {options.map((option, index) =>
                  renderOption({ index, style, data: options }),
                )}
              
            )}
          
        )}
      
    );
  },
);

OptimizedSelect.displayName = "OptimizedSelect";

export {
  VirtualList,
  LazyImage,
  InfiniteScroll,
  OptimizedCardGrid,
  LazySection,
  OptimizedTableRow,
  DebouncedInput,
  MemoizedList,
  ProgressiveEnhancement,
  OptimizedSelect,
};
