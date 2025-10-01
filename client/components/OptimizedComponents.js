import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { memo, useMemo, useCallback } from "react";
import { FixedSizeList as List, areEqual, } from "react-window";
import { cn } from "../lib/utils";
import { useLazyImage, useIntersectionObserver, } from "../hooks/usePerformance";
import { Skeleton } from "./ui/skeleton";
const VirtualListItem = memo(({ index, style, data, }) => {
    const item = data.items[index];
    if (!item)
        return null;
    return (_jsx("div", { style: style, children: data.renderItem({ index, style, data: item }) }));
}, areEqual);
VirtualListItem.displayName = "VirtualListItem";
export const VirtualList = memo(({ items, itemHeight, height, width = "100%", renderItem, className, overscanCount = 5, onScroll, }) => {
    const itemData = useMemo(() => ({ items, renderItem }), [items, renderItem]);
    const handleScroll = useCallback((props) => {
        onScroll?.(props.scrollOffset);
    }, [onScroll]);
    return (_jsx("div", { className: className, children: _jsx(List, { height: height, width: width, itemCount: items.length, itemSize: itemHeight, itemData: itemData, overscanCount: overscanCount, onScroll: handleScroll, children: VirtualListItem }) }));
});
VirtualList.displayName = "VirtualList";
export const LazyImage = memo(({ src, placeholder, fallback, loadingComponent, errorComponent, fadeIn = true, className, alt = "", ...props }) => {
    const { ref, src: imageSrc, isLoaded, isError, isIntersecting, } = useLazyImage(src, placeholder);
    if (isError && errorComponent) {
        return _jsx(_Fragment, { children: errorComponent });
    }
    if (isError && fallback) {
        return _jsx(_Fragment, { children: fallback });
    }
    if (!isIntersecting && loadingComponent) {
        return (_jsx("div", { ref: ref, className: className, children: loadingComponent }));
    }
    if (!isIntersecting) {
        return (_jsx("div", { ref: ref, className: cn("bg-gray-100 animate-pulse", className) }));
    }
    return (_jsx("img", { ref: ref, src: imageSrc, alt: alt, className: cn(className, fadeIn && isLoaded && "transition-opacity duration-300", fadeIn && !isLoaded && "opacity-0"), ...props }));
});
LazyImage.displayName = "LazyImage";
export const InfiniteScroll = memo(({ hasNextPage, isNextPageLoading, loadNextPage, children, loader, className, threshold = 0.5, }) => {
    const [sentinelRef, isIntersecting] = useIntersectionObserver({
        threshold,
        rootMargin: "100px",
    });
    React.useEffect(() => {
        if (isIntersecting && hasNextPage && !isNextPageLoading) {
            loadNextPage();
        }
    }, [isIntersecting, hasNextPage, isNextPageLoading, loadNextPage]);
    return (_jsxs("div", { className: className, children: [children, hasNextPage && (_jsx("div", { ref: sentinelRef, className: "py-4", children: isNextPageLoading && (loader || _jsx("div", { children: "Loading more..." })) }))] }));
});
InfiniteScroll.displayName = "InfiniteScroll";
export const OptimizedCardGrid = memo(({ items, renderCard, columns = 3, gap = 16, className, getItemKey, minItemHeight = 200, }) => {
    const memoizedItems = useMemo(() => {
        return items.map((item, index) => ({
            key: getItemKey(item, index),
            item,
            index,
            component: renderCard(item, index),
        }));
    }, [items, renderCard, getItemKey]);
    const gridStyle = useMemo(() => ({
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        minHeight: `${minItemHeight}px`,
    }), [columns, gap, minItemHeight]);
    return (_jsx("div", { className: className, style: gridStyle, children: memoizedItems.map(({ key, component }) => (_jsx("div", { children: component }, key))) }));
});
OptimizedCardGrid.displayName =
    "OptimizedCardGrid";
export const LazySection = memo(({ children, fallback, minHeight = 200, className, threshold = 0.1 }) => {
    const [ref, isIntersecting] = useIntersectionObserver({
        threshold,
        rootMargin: "50px",
    });
    return (_jsx("div", { ref: ref, className: className, style: { minHeight: `${minHeight}px` }, children: isIntersecting
            ? children
            : fallback || _jsx(Skeleton, { className: "w-full h-full" }) }));
});
LazySection.displayName = "LazySection";
export const OptimizedTableRow = memo(({ id, data, columns, isSelected, onSelect, className }) => {
    const handleClick = useCallback(() => {
        onSelect?.(id);
    }, [id, onSelect]);
    const cells = useMemo(() => {
        return columns.map((column) => (_jsx("td", { className: "px-4 py-2", children: column.render(data[column.key], data) }, column.key)));
    }, [columns, data]);
    return (_jsx("tr", { className: cn("hover:bg-gray-50 cursor-pointer", isSelected && "bg-blue-50", className), onClick: handleClick, children: cells }));
});
OptimizedTableRow.displayName = "OptimizedTableRow";
export const DebouncedInput = memo(({ value, onChange, debounceMs = 300, className, ...props }) => {
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
    }, [onChange, debounceMs]);
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    return (_jsx("input", { ...props, value: localValue, onChange: handleChange, className: className }));
});
DebouncedInput.displayName = "DebouncedInput";
const MemoizedListItem = memo(({ item, index, renderItem, }) => {
    return _jsx(_Fragment, { children: renderItem(item, index) });
}, (prevProps, nextProps) => {
    // Custom comparison logic
    return (prevProps.item === nextProps.item && prevProps.index === nextProps.index);
});
MemoizedListItem.displayName = "MemoizedListItem";
export const MemoizedList = memo(({ items, renderItem, getItemKey, className }) => {
    const memoizedItems = useMemo(() => {
        return items.map((item, index) => ({
            key: getItemKey(item, index),
            item,
            index,
        }));
    }, [items, getItemKey]);
    return (_jsx("div", { className: className, children: memoizedItems.map(({ key, item, index }) => (_jsx(MemoizedListItem, { item: item, index: index, renderItem: renderItem }, key))) }));
});
MemoizedList.displayName =
    "MemoizedList";
export const ProgressiveEnhancement = memo(({ fallback, enhanced, condition = true, delay = 0 }) => {
    const [showEnhanced, setShowEnhanced] = React.useState(delay === 0 && condition);
    React.useEffect(() => {
        if (condition && delay > 0) {
            const timer = setTimeout(() => {
                setShowEnhanced(true);
            }, delay);
            return () => clearTimeout(timer);
        }
        else if (condition && delay === 0) {
            setShowEnhanced(true);
        }
    }, [condition, delay]);
    return _jsx(_Fragment, { children: showEnhanced ? enhanced : fallback });
});
ProgressiveEnhancement.displayName = "ProgressiveEnhancement";
export const OptimizedSelect = memo(({ options, value, onChange, placeholder, className, maxHeight = 200, virtualizeThreshold = 100, }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const selectedOption = options.find((option) => option.value === value);
    const shouldVirtualize = options.length > virtualizeThreshold;
    const handleSelect = useCallback((optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    }, [onChange]);
    const renderOption = useCallback(({ index, style, data, }) => {
        const option = data[index];
        if (!option)
            return null;
        return (_jsx("div", { style: style, className: cn("px-3 py-2 cursor-pointer hover:bg-gray-100", option.disabled && "opacity-50 cursor-not-allowed", option.value === value && "bg-blue-50"), onClick: () => !option.disabled && handleSelect(option.value), children: option.label }, option.value));
    }, [value, handleSelect]);
    return (_jsxs("div", { className: cn("relative", className), children: [_jsx("button", { type: "button", className: "w-full px-3 py-2 text-left border border-gray-300 rounded-md bg-white", onClick: () => setIsOpen(!isOpen), children: selectedOption?.label || placeholder || "Select..." }), isOpen && (_jsx("div", { className: "absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg", style: { maxHeight }, children: shouldVirtualize ? (_jsx(VirtualList, { items: options.map((option, index) => ({
                        id: option.value,
                        data: option,
                    })), itemHeight: 40, height: Math.min(maxHeight, options.length * 40), renderItem: ({ data }) => renderOption({
                        index: options.findIndex((o) => o.value === data.data.value),
                        style: {},
                        data: options,
                    }) })) : (_jsx("div", { style: { maxHeight, overflowY: "auto" }, children: options.map((option, index) => renderOption({ index, style: {}, data: options })) })) }))] }));
});
OptimizedSelect.displayName = "OptimizedSelect";
