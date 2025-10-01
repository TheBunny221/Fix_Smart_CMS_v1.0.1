import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Specialized Error Boundary for OtpProvider Context Issues
 * Provides fallback UI and error recovery for OTP-related context errors
 */
import { Component } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
class OtpErrorBoundary extends Component {
    maxRetries = 3;
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0,
        };
    }
    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }
    componentDidCatch(error, errorInfo) {
        // Log the error details
        console.error('🚨 [OtpErrorBoundary] Context error caught:', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            route: window.location.pathname,
            timestamp: new Date().toISOString(),
        });
        this.setState({
            error,
            errorInfo,
        });
        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
        // Check if this is an OTP context-related error
        const isOtpContextError = error.message.includes('OtpProvider') ||
            error.message.includes('useOtp') ||
            error.message.includes('Cannot read properties of null') ||
            error.message.includes('useContext');
        if (isOtpContextError) {
            console.warn('🔍 [OtpErrorBoundary] Detected OTP context error. This might be caused by:', '\n1. Component rendered outside OtpProvider', '\n2. Provider initialization timing issue', '\n3. Route-specific context mounting problem', '\n📍 Current route:', window.location.pathname, '\n🔄 Attempting recovery...');
        }
    }
    handleRetry = () => {
        if (this.state.retryCount < this.maxRetries) {
            console.log(`🔄 [OtpErrorBoundary] Retry attempt ${this.state.retryCount + 1}/${this.maxRetries}`);
            this.setState(prevState => ({
                hasError: false,
                error: null,
                errorInfo: null,
                retryCount: prevState.retryCount + 1,
            }));
        }
        else {
            console.error('🚨 [OtpErrorBoundary] Max retries exceeded. Manual refresh required.');
            window.location.reload();
        }
    };
    handleRefresh = () => {
        window.location.reload();
    };
    render() {
        if (this.state.hasError) {
            // Custom fallback UI provided
            if (this.props.fallback) {
                return this.props.fallback;
            }
            // Default fallback UI
            const isOtpContextError = this.state.error?.message.includes('OtpProvider') ||
                this.state.error?.message.includes('useOtp') ||
                this.state.error?.message.includes('Cannot read properties of null');
            return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-4 bg-gray-50", children: _jsxs("div", { className: "max-w-md w-full", children: [_jsxs(Alert, { variant: "destructive", className: "mb-4", children: [_jsx(AlertTriangle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: isOtpContextError ? 'OTP Context Error' : 'Application Error' }), _jsx(AlertDescription, { className: "mt-2", children: isOtpContextError ? (_jsxs(_Fragment, { children: ["There was an issue with the OTP verification system. This usually happens when:", _jsxs("ul", { className: "mt-2 ml-4 list-disc text-sm", children: [_jsx("li", { children: "The page loaded before the context was ready" }), _jsx("li", { children: "There's a temporary network issue" }), _jsx("li", { children: "The route configuration needs to refresh" })] })] })) : ('An unexpected error occurred while loading this page.') })] }), _jsxs("div", { className: "space-y-3", children: [this.state.retryCount < this.maxRetries ? (_jsxs(Button, { onClick: this.handleRetry, className: "w-full", variant: "default", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Try Again (", this.maxRetries - this.state.retryCount, " attempts left)"] })) : (_jsxs(Button, { onClick: this.handleRefresh, className: "w-full", variant: "default", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Refresh Page"] })), _jsx(Button, { onClick: () => window.history.back(), variant: "outline", className: "w-full", children: "Go Back" })] }), process.env.NODE_ENV === 'development' && this.state.error && (_jsxs("details", { className: "mt-4 p-3 bg-gray-100 rounded text-xs", children: [_jsx("summary", { className: "cursor-pointer font-semibold", children: "Debug Information (Development Only)" }), _jsxs("div", { className: "mt-2 space-y-2", children: [_jsxs("div", { children: [_jsx("strong", { children: "Error:" }), " ", this.state.error.message] }), _jsxs("div", { children: [_jsx("strong", { children: "Route:" }), " ", window.location.pathname] }), _jsxs("div", { children: [_jsx("strong", { children: "Retry Count:" }), " ", this.state.retryCount] }), this.state.error.stack && (_jsxs("div", { children: [_jsx("strong", { children: "Stack Trace:" }), _jsx("pre", { className: "mt-1 text-xs overflow-auto", children: this.state.error.stack })] }))] })] }))] }) }));
        }
        return this.props.children;
    }
}
export default OtpErrorBoundary;
