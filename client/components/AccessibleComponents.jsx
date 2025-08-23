import React, { useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import {
  useFocusTrap,
  useKeyboardNavigation,
  useScreenReader,
  useFocusManagement,
} from "../hooks/useAccessibility";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { X, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

// Accessible Modal/Dialog Component


export const AccessibleDialog: React.FC = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  size = "md",
}) => {
  const { saveFocus, restoreFocus } = useFocusManagement();
  const { announce } = useScreenReader();

  useEffect(() => {
    if (isOpen) {
      saveFocus();
      announce(`Dialog opened, "polite");
    } else {
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

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    
       e.preventDefault()
        }
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
      >
        
          {title}
          {description && (
            
              {description}
            
          )}
        
        {children}
        
          
        
      
    
  );
};

// Skip Links Component
>;
  className?;
}

export const SkipLinks: React.FC = ({ links, className }) => {
  return (
    
      {links.map(({ target, label }) => (
        
          {label}
        
      ))}
    
  );
};

// Live Region for Screen Reader Announcements


export const LiveRegion: React.FC = ({
  message,
  priority = "polite",
  atomic = true,
  className,
}) => {
  return (
    
      {message}
    
  );
};

// Accessible Alert Component


export const AccessibleAlert: React.FC = ({
  type,
  title,
  message,
  onClose,
  className,
  autoClose = false,
  autoCloseDelay = 5000,
}) => {
  const { announce } = useScreenReader();

  useEffect(() => {
    announce(`${type},
      type === "error" ? "assertive" : "polite",
    );
  }, [announce, type, title, message]);

  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose, autoCloseDelay]);

  const icons = {
    success,
    error,
    warning,
    info,
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

  return (
    
      
        
          
        
        
          
            {title}
          
          
            {message}
          
        
        {onClose && (
          
            
              
            
          
        )}
      
    
  );
};

// Accessible Tabs Component




export const AccessibleTabs: React.FC = ({
  tabs,
  defaultTab,
  onTabChange,
  className,
  orientation = "horizontal",
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);
  const tabListRef = useRef(null);
  const tabRefs = useRef([]);

  const enabledTabs = tabs.filter((tab) => tab.disabled);
  const enabledTabElements = tabRefs.current.filter(Boolean);

  useKeyboardNavigation(enabledTabElements, {
    orientation,
    onSelect) => {
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

  return (
    
      
        {tabs.map((tab, index) => (
           {
              if (tab.disabled) {
                const enabledIndex = enabledTabs.findIndex(
                  (t) => t.id === tab.id,
                );
                if (enabledIndex >= 0) {
                  tabRefs.current[enabledIndex] = el;
                }
              }
            }}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => handleTabClick(tab.id)}
            className={cn("px-4 py-2 text-sm font-medium rounded-t-lg focus,
              "disabled:opacity-50 disabled:cursor-not-allowed",
              activeTab === tab.id
                ? "bg-white border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              orientation === "vertical" && "rounded-t-none rounded-l-lg",
            )}
          >
            {tab.label}
          
        ))}
      

      
        {activeTabContent}
      
    
  );
};

// Accessible Menu Component




export const AccessibleMenu: React.FC = ({
  trigger,
  items,
  className,
  placement = "bottom-start",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);
  const { saveFocus, restoreFocus } = useFocusManagement();

  const focusTrapRef = useFocusTrap(isOpen);

  const enabledItems = items.filter((item) => item.disabled);

  useKeyboardNavigation(itemRefs.current.filter(Boolean), {
    orientation: "vertical",
    onSelect: (index) => {
      const item = enabledItems[index];
      if (item) {
        item.onClick();
        setIsOpen(false);
      }
    },
    onEscape: () => setIsOpen(false),
  });

  useEffect(() => {
    if (isOpen) {
      saveFocus();
    } else {
      restoreFocus();
    }
  }, [isOpen, saveFocus, restoreFocus]);

  const handleTriggerClick = () => {
    setIsOpen(isOpen);
  };

  const handleItemClick = (item) => {
    item.onClick();
    setIsOpen(false);
  };

  const placementClasses = {
    "bottom-start": "top-full left-0 mt-1",
    "bottom-end": "top-full right-0 mt-1",
    "top-start": "bottom-full left-0 mb-1",
    "top-end": "bottom-full right-0 mb-1",
  };

  return ({React.cloneElement(trigger, {
        onClick,
        "aria-expanded",
        "aria-haspopup",
        id: "menu-trigger",
      })}

      {isOpen && (
        
          
            {items.map((item, index) => {
              const enabledIndex = enabledItems.findIndex(
                (i) => i.id === item.id,
              );
              return (
                 {
                    if (item.disabled && enabledIndex >= 0) {
                      itemRefs.current[enabledIndex] = el;
                    }
                  }}
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => handleItemClick(item)}
                  className={cn("flex w-full items-center px-3 py-2 text-sm text-left",
                    "hover,
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    focusedIndex === enabledIndex && "bg-gray-100",
                  )}
                >
                  {item.icon && (
                    
                      {item.icon}
                    
                  )}
                  {item.label}
                  {item.shortcut && (
                    
                      {item.shortcut}
                    
                  )}
                
              );
            })}
          
        
      )}
    
  );
};

// Progress Indicator with Screen Reader Support


export const AccessibleProgress: React.FC = ({
  value,
  max = 100,
  label,
  description,
  className,
  showPercentage = true,
}) => {
  const percentage = Math.round((value / max) * 100);

  return (
    
      
        
          {label}
        
        {showPercentage && (
          
            {percentage}%
          
        )}
      
      {description && (
        
          {description}
        
      )}
      
        
      
      
        {label}: {percentage}% complete
      
    
  );
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
