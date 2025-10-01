import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Shield, AlertTriangle, Home, LogIn } from "lucide-react";
const Unauthorized = () => {
    const { appName } = useSystemConfig();
    return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-lg", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4", children: _jsx(AlertTriangle, { className: "h-8 w-8 text-red-600" }) }), _jsx(CardTitle, { className: "text-2xl text-red-600", children: "Access Denied" })] }), _jsxs(CardContent, { className: "text-center space-y-4", children: [_jsx("p", { className: "text-gray-600", children: "You don't have permission to access this page. Please contact your administrator if you believe this is an error." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 justify-center", children: [_jsx(Link, { to: "/", children: _jsxs(Button, { variant: "outline", className: "w-full sm:w-auto", children: [_jsx(Home, { className: "h-4 w-4 mr-2" }), "Go Home"] }) }), _jsx(Link, { to: "/login", children: _jsxs(Button, { className: "w-full sm:w-auto", children: [_jsx(LogIn, { className: "h-4 w-4 mr-2" }), "Login"] }) })] }), _jsx("div", { className: "mt-8 pt-4 border-t", children: _jsxs("div", { className: "flex items-center justify-center space-x-2 text-gray-500", children: [_jsx(Shield, { className: "h-4 w-4" }), _jsxs("span", { className: "text-sm", children: [appName, " E-Governance"] })] }) })] })] }) }));
};
export default Unauthorized;
