import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
/**
 * Error boundary specifically for context-related errors
 */
export class ContextErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        // Check if this is a context-related error
        const isContextError = error.message.includes("must be used within") ||
            error.message.includes("Context") ||
            error.message.includes("Provider");
        return isContextError ? { hasError: true, error } : { hasError: false };
    }
    componentDidCatch(error, errorInfo) {
        // Log context errors for debugging
        if (this.state.hasError) {
            console.group("🔴 Context Error Boundary");
            console.error("Context Error:", error);
            console.error("Error Info:", errorInfo);
            console.error("Context Name:", this.props.contextName || "Unknown");
            console.groupEnd();
        }
    }
    handleRetry = () => {
        this.setState({ hasError: false });
    };
    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }
            // Default error UI
            return (_jsxs(Card, { className: "max-w-md mx-auto mt-8 border-red-200", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx(AlertTriangle, { className: "h-12 w-12 text-red-500" }) }), _jsx(CardTitle, { className: "text-red-700", children: "Context Error" })] }), _jsxs(CardContent, { className: "text-center space-y-4", children: [_jsx("p", { className: "text-gray-600", children: this.props.contextName
                                    ? `${this.props.contextName} context is not available.`
                                    : "A required context is not available." }), _jsx("p", { className: "text-sm text-gray-500", children: "This usually means a component is being used outside of its provider." }), this.state.error && (_jsxs("details", { className: "text-left", children: [_jsx("summary", { className: "cursor-pointer text-sm text-gray-500 hover:text-gray-700", children: "Error Details" }), _jsx("pre", { className: "mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto", children: this.state.error.message })] })), _jsxs(Button, { onClick: this.handleRetry, variant: "outline", className: "mt-4", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Try Again"] })] })] }));
        }
        return this.props.children;
    }
}
/**
 * HOC to wrap components with context error boundary
 */
export function withContextErrorBoundary(Component, contextName, fallback) {
    const WrappedComponent = (props) => (_jsx(ContextErrorBoundary, { ...(contextName !== undefined ? { contextName } : {}), ...(fallback !== undefined ? { fallback } : {}), children: _jsx(Component, { ...props }) }));
    WrappedComponent.displayName = `withContextErrorBoundary(${Component.displayName || Component.name})`;
    return WrappedComponent;
}
