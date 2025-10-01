import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { loginWithPassword, sendPasswordSetupEmail, clearError, selectAuth, selectRequiresPasswordSetup, getDashboardRouteForRole, } from "../store/slices/authSlice";
import { useRequestOTPLoginMutation } from "../store/api/authApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Logo } from "../components/ui/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Eye, EyeOff, Mail, Lock, Home } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useOtpFlow } from "../contexts/OtpContext";
import AdminSeeder from "../components/AdminSeeder";
const Login = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { openOtpFlow } = useOtpFlow();
    const { appName, appLogoUrl, appLogoSize } = useSystemConfig();
    // Set document title
    useDocumentTitle("Login");
    const { isLoading, error, isAuthenticated, user } = useAppSelector(selectAuth);
    const requiresPasswordSetup = useAppSelector(selectRequiresPasswordSetup);
    // API hooks
    const [requestOTPLogin, { isLoading: isRequestingOtp }] = useRequestOTPLoginMutation();
    // Form states
    const [loginMethod, setLoginMethod] = useState("password");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    // Clear error when component mounts
    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);
    // Redirect if authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            const dashboardRoute = getDashboardRouteForRole(user.role);
            navigate(dashboardRoute);
        }
    }, [isAuthenticated, user, navigate]);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (error) {
            dispatch(clearError());
        }
    };
    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            return;
        }
        try {
            await dispatch(loginWithPassword({
                email: formData.email,
                password: formData.password,
            })).unwrap();
            toast({
                title: "Login Successful",
                description: "Welcome back!",
            });
        }
        catch (error) {
            // Error is handled by the reducer
        }
    };
    const handleOTPRequest = async (e) => {
        e.preventDefault();
        if (!formData.email) {
            return;
        }
        try {
            // Request OTP first
            console.log("Requesting OTP for email:", formData.email);
            const response = await requestOTPLogin({
                email: formData.email,
            }).unwrap();
            console.log("OTP response:", response);
            // Open the unified OTP dialog
            openOtpFlow({
                context: "login",
                email: formData.email,
                onSuccess: (data) => {
                    toast({
                        title: "Login Successful",
                        description: "Welcome back!",
                    });
                    // Navigation will be handled by the auth state change
                },
            });
            toast({
                title: "OTP Sent",
                description: `A verification code has been sent to ${formData.email}`,
            });
        }
        catch (error) {
            // Error is handled by the mutation
        }
    };
    const handlePasswordSetupRequest = async () => {
        try {
            await dispatch(sendPasswordSetupEmail({
                email: formData.email,
            })).unwrap();
            toast({
                title: "Email Sent Successfully!",
                description: `Password setup instructions have been sent to ${formData.email}. Please check your email and follow the instructions.`,
            });
        }
        catch (error) {
            // Error is handled by the reducer
        }
    };
    // Demo credentials for testing
    const demoCredentials = [
        {
            email: "admin@cochinsmartcity.gov.in",
            password: "admin123",
            role: "Administrator",
        },
        {
            email: "ward.officer@cochinsmartcity.gov.in",
            password: "ward123",
            role: "Ward Officer",
        },
        {
            email: "maintenance@cochinsmartcity.gov.in",
            password: "maintenance123",
            role: "Maintenance Team",
        },
        {
            email: "citizen@example.com",
            password: "citizen123",
            role: "Citizen",
        },
    ];
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4", children: _jsxs("div", { className: "w-full max-w-md space-y-6", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("div", { className: "mb-2", children: _jsx(Logo, { logoUrl: appLogoUrl, appName: appName, size: appLogoSize, context: "auth", fallbackIcon: Home, showText: false }) }), _jsx("h1", { className: "text-3xl font-bold text-gray-900", children: appName }), _jsx("p", { className: "text-gray-600", children: "E-Governance Portal" })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { children: "Welcome Back" }), _jsx(CardDescription, { children: "Choose your preferred login method" })] }), _jsxs(CardContent, { children: [error && (_jsx(Alert, { className: "mb-4 border-red-200 bg-red-50", children: _jsx(AlertDescription, { className: "text-red-700", children: error }) })), requiresPasswordSetup && (_jsx(Alert, { className: "mb-4 border-amber-200 bg-amber-50", children: _jsx(AlertDescription, { className: "text-amber-700", children: _jsxs("div", { className: "space-y-2", children: [_jsx("p", { children: "Your password is not set. You can:" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setLoginMethod("otp"), className: "text-amber-700 border-amber-300", children: "Login with OTP" }), _jsx(Button, { variant: "outline", size: "sm", onClick: handlePasswordSetupRequest, disabled: isLoading, className: "text-amber-700 border-amber-300", children: "Set Password" })] })] }) }) })), _jsxs(Tabs, { value: loginMethod, onValueChange: (value) => setLoginMethod(value), children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsxs(TabsTrigger, { value: "password", className: "flex items-center gap-2", children: [_jsx(Lock, { className: "h-4 w-4" }), "Password"] }), _jsxs(TabsTrigger, { value: "otp", className: "flex items-center gap-2", children: [_jsx(Mail, { className: "h-4 w-4" }), "OTP"] })] }), _jsx(TabsContent, { value: "password", className: "space-y-4", children: _jsxs("form", { onSubmit: handlePasswordLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email Address" }), _jsx(Input, { id: "email", name: "email", type: "email", placeholder: "Enter your email", value: formData.email, onChange: handleInputChange, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "password", name: "password", type: showPassword ? "text" : "password", placeholder: "Enter your password", value: formData.password, onChange: handleInputChange, required: true }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent", onClick: () => setShowPassword(!showPassword), children: showPassword ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) })] })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading || !formData.email || !formData.password, children: isLoading ? "Signing In..." : "Sign In" })] }) }), _jsx(TabsContent, { value: "otp", className: "space-y-4", children: _jsxs("form", { onSubmit: handleOTPRequest, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "otp-email", children: "Email Address" }), _jsx(Input, { id: "otp-email", name: "email", type: "email", placeholder: "Enter your email", value: formData.email, onChange: handleInputChange, required: true })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isRequestingOtp || !formData.email, children: isRequestingOtp ? "Sending OTP..." : "Send OTP" }), _jsx("div", { className: "text-center text-sm text-gray-600", children: _jsx("p", { children: "We'll send a 6-digit code to your email address" }) })] }) })] }), _jsxs("div", { className: "text-center space-y-2 pt-4", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Don't have an account?", " ", _jsx(Link, { to: "/register", className: "text-blue-600 hover:underline", children: "Register here" })] }), _jsx("p", { className: "text-sm text-gray-600", children: _jsxs(Link, { to: "/", className: "inline-flex items-center gap-1 text-blue-600 hover:underline", children: [_jsx(Home, { className: "h-4 w-4" }), "Back to Home"] }) })] })] })] }), process.env.NODE_ENV === "development" && _jsx(AdminSeeder, {}), process.env.NODE_ENV === "development" && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-lg", children: "Demo Credentials" }), _jsx(CardDescription, { children: "For testing purposes only" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: demoCredentials.map((cred, index) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-sm font-medium", children: cred.email }), _jsx("div", { className: "text-xs text-gray-500", children: cred.password })] }), _jsx(Badge, { variant: "outline", children: cred.role })] }, index))) }) })] }))] }) }));
};
export default Login;
