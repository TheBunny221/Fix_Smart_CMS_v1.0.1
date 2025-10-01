import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Error Boundary caught an error:", error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { style: {
                    padding: "20px",
                    background: "#fee",
                    color: "#900",
                    minHeight: "100vh",
                    fontFamily: "Arial, sans-serif",
                }, children: [_jsx("h1", { children: "\uD83D\uDEA8 Application Error" }), _jsx("h2", { children: "Something went wrong" }), _jsxs("details", { style: { marginTop: "20px" }, children: [_jsx("summary", { children: "Error Details" }), _jsxs("pre", { style: {
                                    background: "#fff",
                                    padding: "10px",
                                    overflow: "auto",
                                    marginTop: "10px",
                                    fontSize: "12px",
                                }, children: [this.state.error && this.state.error.toString(), _jsx("br", {}), this.state.errorInfo && this.state.errorInfo.componentStack] })] }), _jsx("button", { onClick: () => window.location.reload(), style: {
                            marginTop: "20px",
                            padding: "10px 20px",
                            background: "#900",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }, children: "Reload Page" })] }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
