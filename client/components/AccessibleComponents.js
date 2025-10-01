import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "../lib/utils";
import { useFocusTrap, useKeyboardNavigation, useScreenReader, useFocusManagement, } from "../hooks/useAccessibility";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "./ui/dialog";
import { Button } from "./ui/button";
import { X, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
const isHTMLElement = (element) => element !== null;
export const AccessibleDialog = ({ isOpen, onClose, title, description, children, className, closeOnEscape = true, closeOnOverlayClick = true, size = "md", }) => {
    const { saveFocus, restoreFocus } = useFocusManagement();
    const { announce } = useScreenReader();
    useEffect(() => {
        if (isOpen) {
            saveFocus();
            announce(`Dialog opened: ${title}`, "polite");
        }
        else {
            restoreFocus();
        }
    }, [isOpen, saveFocus, restoreFocus, announce, title]);
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && closeOnEscape) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose, closeOnEscape]);
    const handleOpenChange = useCallback((open) => {
        if (!open) {
            onClose();
        }
    }, [onClose]);
    const preventPointerDownOutside = useCallback((event) => {
        event.preventDefault();
    }, []);
    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: handleOpenChange, children: _jsxs(DialogContent, { className: cn(sizeClasses[size], className), ...(!closeOnOverlayClick && {
                onPointerDownOutside: preventPointerDownOutside,
            }), "aria-labelledby": "dialog-title", "aria-describedby": description ? "dialog-description" : undefined, children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { id: "dialog-title", children: title }), description && (_jsx(DialogDescription, { id: "dialog-description", children: description }))] }), _jsx("div", { className: "mt-4", children: children }), _jsx(Button, { variant: "ghost", size: "sm", className: "absolute right-4 top-4", onClick: onClose, "aria-label": "Close dialog", children: _jsx(X, { className: "h-4 w-4" }) })] }) }));
};
export const SkipLinks = ({ links, className }) => {
    return (_jsx("div", { className: cn("sr-only focus-within:not-sr-only", className), children: links.map(({ target, label }) => (_jsx("a", { href: `#${target}`, className: "fixed top-4 left-4 z-[9999] bg-primary text-primary-foreground px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-ring", children: label }, target))) }));
};
export const LiveRegion = ({ message, priority = "polite", atomic = true, className, }) => {
    return (_jsx("div", { "aria-live": priority, "aria-atomic": atomic, className: cn("sr-only", className), children: message }));
};
export const AccessibleAlert = ({ type, title, message, onClose, className, autoClose = false, autoCloseDelay = 5000, }) => {
    const { announce } = useScreenReader();
    useEffect(() => {
        announce(`${type}: ${title}. ${message}`, type === "error" ? "assertive" : "polite");
    }, [announce, type, title, message]);
    useEffect(() => {
        if (autoClose && onClose) {
            const timer = setTimeout(onClose, autoCloseDelay);
            return () => clearTimeout(timer);
        }
    }, [autoClose, onClose, autoCloseDelay]);
    const icons = {
        success: CheckCircle,
        error: XCircle,
        warning: AlertTriangle,
        info: Info,
    };
    const Icon = icons[type];
    const typeClasses = {
        success: "bg-green-50 border-green-200 text-green-800",
        error: "bg-red-50 border-red-200 text-red-800",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
        info: "bg-blue-50 border-blue-200 text-blue-800",
    };
    const iconClasses = {
        success: "text-green-400",
        error: "text-red-400",
        warning: "text-yellow-400",
        info: "text-blue-400",
    };
    return (_jsx("div", { role: "alert", "aria-labelledby": "alert-title", "aria-describedby": "alert-message", className: cn("rounded-md border p-4", typeClasses[type], className), children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(Icon, { className: cn("h-5 w-5", iconClasses[type]), "aria-hidden": "true" }) }), _jsxs("div", { className: "ml-3 flex-1", children: [_jsx("h3", { id: "alert-title", className: "text-sm font-medium", children: title }), _jsx("div", { id: "alert-message", className: "mt-2 text-sm", children: message })] }), onClose && (_jsx("div", { className: "ml-auto pl-3", children: _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, className: "text-inherit hover:bg-black/10", "aria-label": `Close ${type} alert`, children: _jsx(X, { className: "h-4 w-4" }) }) }))] }) }));
};
export const AccessibleTabs = ({ tabs, defaultTab, onTabChange, className, orientation = "horizontal", }) => {
    const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);
    const tabListRef = useRef(null);
    const tabRefs = useRef([]);
    const enabledTabs = tabs.filter((tab) => !tab.disabled);
    const enabledTabElements = tabRefs.current.filter(isHTMLElement);
    useKeyboardNavigation(enabledTabElements, {
        orientation,
        onSelect: (index) => {
            const tab = enabledTabs[index];
            if (tab) {
                setActiveTab(tab.id);
                onTabChange?.(tab.id);
            }
        },
    });
    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        onTabChange?.(tabId);
    };
    const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;
    return (_jsxs("div", { className: cn("w-full", className), children: [_jsx("div", { ref: tabListRef, role: "tablist", "aria-orientation": orientation, className: cn("flex border-b border-gray-200", orientation === "vertical" && "flex-col border-b-0 border-r"), children: tabs.map((tab, index) => (_jsx("button", { ref: (el) => {
                        if (!tab.disabled) {
                            const enabledIndex = enabledTabs.findIndex((t) => t.id === tab.id);
                            if (enabledIndex >= 0) {
                                tabRefs.current[enabledIndex] = el;
                            }
                        }
                    }, role: "tab", "aria-selected": activeTab === tab.id, "aria-controls": `tabpanel-${tab.id}`, id: `tab-${tab.id}`, tabIndex: activeTab === tab.id ? 0 : -1, disabled: tab.disabled, onClick: () => handleTabClick(tab.id), className: cn("px-4 py-2 text-sm font-medium rounded-t-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", "disabled:opacity-50 disabled:cursor-not-allowed", activeTab === tab.id
                        ? "bg-white border-b-2 border-primary text-primary"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50", orientation === "vertical" && "rounded-t-none rounded-l-lg"), children: tab.label }, tab.id))) }), _jsx("div", { role: "tabpanel", id: `tabpanel-${activeTab}`, "aria-labelledby": `tab-${activeTab}`, tabIndex: 0, className: "mt-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded", children: activeTabContent })] }));
};
export const AccessibleMenu = ({ trigger, items, className, placement = "bottom-start", }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const menuRef = useRef(null);
    const itemRefs = useRef([]);
    const { saveFocus, restoreFocus } = useFocusManagement();
    const focusTrapRef = useFocusTrap(isOpen);
    const enabledItems = items.filter((item) => !item.disabled);
    const itemElements = itemRefs.current.filter(isHTMLElement);
    const { currentIndex, setCurrentIndex } = useKeyboardNavigation(itemElements, {
        orientation: "vertical",
        onSelect: (index) => {
            const item = enabledItems[index];
            if (item) {
                item.onClick();
                setIsOpen(false);
                setCurrentIndex(-1);
            }
        },
        onEscape: () => setIsOpen(false),
    });
    useEffect(() => {
        if (!isOpen) {
            setCurrentIndex(-1);
        }
    }, [isOpen, setCurrentIndex]);
    useEffect(() => {
        if (isOpen) {
            saveFocus();
        }
        else {
            restoreFocus();
        }
    }, [isOpen, saveFocus, restoreFocus]);
    const handleTriggerClick = () => {
        const nextIsOpen = !isOpen;
        setIsOpen(nextIsOpen);
        if (nextIsOpen) {
            setCurrentIndex(enabledItems.length > 0 ? 0 : -1);
        }
    };
    const handleItemClick = (item) => {
        item.onClick();
        setIsOpen(false);
        setCurrentIndex(-1);
    };
    const placementClasses = {
        "bottom-start": "top-full left-0 mt-1",
        "bottom-end": "top-full right-0 mt-1",
        "top-start": "bottom-full left-0 mb-1",
        "top-end": "bottom-full right-0 mb-1",
    };
    return (_jsxs("div", { className: "relative", children: [React.cloneElement(trigger, {
                onClick: handleTriggerClick,
                "aria-expanded": isOpen,
                "aria-haspopup": "menu",
                id: "menu-trigger",
            }), isOpen && (_jsx("div", { ref: focusTrapRef, role: "menu", "aria-labelledby": "menu-trigger", className: cn("absolute z-50 min-w-48 bg-white border border-gray-200 rounded-md shadow-lg", placementClasses[placement], className), children: _jsx("div", { className: "py-1", children: items.map((item, index) => {
                        const enabledIndex = enabledItems.findIndex((i) => i.id === item.id);
                        return (_jsxs("button", { ref: (el) => {
                                if (!item.disabled && enabledIndex >= 0) {
                                    itemRefs.current[enabledIndex] = el;
                                }
                            }, role: "menuitem", disabled: item.disabled, onClick: () => handleItemClick(item), className: cn("flex w-full items-center px-3 py-2 text-sm text-left", "hover:bg-gray-100 focus:bg-gray-100 focus:outline-none", "disabled:opacity-50 disabled:cursor-not-allowed", currentIndex === enabledIndex && "bg-gray-100"), onFocus: () => enabledIndex >= 0
                                ? setCurrentIndex(enabledIndex)
                                : undefined, onMouseEnter: () => enabledIndex >= 0
                                ? setCurrentIndex(enabledIndex)
                                : undefined, children: [item.icon && (_jsx("span", { className: "mr-3 flex-shrink-0", "aria-hidden": "true", children: item.icon })), _jsx("span", { className: "flex-1", children: item.label }), item.shortcut && (_jsx("span", { className: "ml-3 text-xs text-gray-400", "aria-hidden": "true", children: item.shortcut }))] }, item.id));
                    }) }) }))] }));
};
export const AccessibleProgress = ({ value, max = 100, label, description, className, showPercentage = true, }) => {
    const percentage = Math.round((value / max) * 100);
    return (_jsxs("div", { className: className, children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("label", { id: "progress-label", className: "text-sm font-medium", children: label }), showPercentage && (_jsxs("span", { "aria-hidden": "true", className: "text-sm text-gray-500", children: [percentage, "%"] }))] }), description && (_jsx("p", { id: "progress-description", className: "text-xs text-gray-600 mb-2", children: description })), _jsx("div", { role: "progressbar", "aria-valuemin": 0, "aria-valuemax": max, "aria-valuenow": value, "aria-labelledby": "progress-label", "aria-describedby": description ? "progress-description" : undefined, className: "w-full bg-gray-200 rounded-full h-2 overflow-hidden", children: _jsx("div", { className: "h-full bg-primary transition-all duration-300 ease-out", style: { width: `${percentage}%` } }) }), _jsxs("div", { className: "sr-only", children: [label, ": ", percentage, "% complete"] })] }));
};
export default {
    AccessibleDialog,
    SkipLinks,
    LiveRegion,
    AccessibleAlert,
    AccessibleTabs,
    AccessibleMenu,
    AccessibleProgress,
};
