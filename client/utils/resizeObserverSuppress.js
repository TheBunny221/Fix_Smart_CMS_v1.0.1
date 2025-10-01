// Utility to suppress harmless ResizeObserver errors
// This is a common issue with Recharts and other UI libraries
export const suppressResizeObserverErrors = () => {
    // Store original methods
    const originalError = window.console.error;
    const originalWarn = window.console.warn;
    // Override console.error
    window.console.error = (...args) => {
        const message = String(args[0] || "");
        // Filter out ResizeObserver errors
        if (message.includes("ResizeObserver loop completed with undelivered notifications") ||
            message.includes("ResizeObserver loop limit exceeded") ||
            message.includes("ResizeObserver loop") ||
            (message.includes("ResizeObserver") && message.includes("loop"))) {
            // Silently ignore these harmless errors
            return;
        }
        // Call original console.error for other errors
        originalError.apply(console, args);
    };
    // Override console.warn as well (sometimes ResizeObserver issues show as warnings)
    window.console.warn = (...args) => {
        const message = String(args[0] || "");
        // Filter out ResizeObserver warnings
        if (message.includes("ResizeObserver loop completed with undelivered notifications") ||
            message.includes("ResizeObserver loop limit exceeded") ||
            message.includes("ResizeObserver loop")) {
            // Silently ignore these harmless warnings
            return;
        }
        // Call original console.warn for other warnings
        originalWarn.apply(console, args);
    };
    // Handle global error events
    const handleGlobalError = (event) => {
        const errorEvent = event;
        const message = errorEvent.message || errorEvent.error?.message || "";
        if (message.includes("ResizeObserver loop completed") ||
            message.includes("ResizeObserver loop limit exceeded") ||
            message.includes("ResizeObserver loop")) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return false;
        }
    };
    // Handle unhandled promise rejections that might contain ResizeObserver errors
    const handleUnhandledRejection = (event) => {
        const rejection = event;
        const reason = rejection.reason;
        const message = String(reason?.message || reason || "");
        if (message.includes("ResizeObserver loop completed") ||
            message.includes("ResizeObserver loop limit exceeded") ||
            message.includes("ResizeObserver loop")) {
            event.preventDefault();
            return false;
        }
    };
    // Add event listeners
    window.addEventListener("error", handleGlobalError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);
    // Also try to monkey-patch ResizeObserver constructor if available
    if (typeof ResizeObserver !== "undefined") {
        const OriginalResizeObserver = ResizeObserver;
        window.ResizeObserver = class extends OriginalResizeObserver {
            constructor(callback) {
                const wrappedCallback = (entries, observer) => {
                    try {
                        callback(entries, observer);
                    }
                    catch (error) {
                        // Suppress ResizeObserver callback errors
                        if (error instanceof Error && error.message.includes("ResizeObserver loop")) {
                            return;
                        }
                        throw error;
                    }
                };
                super(wrappedCallback);
            }
        };
    }
    // Return cleanup function
    return () => {
        window.console.error = originalError;
        window.console.warn = originalWarn;
        window.removeEventListener("error", handleGlobalError, true);
        window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
    };
};
