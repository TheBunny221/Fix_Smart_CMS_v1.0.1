import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { selectAuth, resetRegistrationState, getDashboardRouteForRole, } from "../store/slices/authSlice";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useToast } from "../hooks/use-toast";
import { useApiErrorHandler } from "../hooks/useApiErrorHandler";
import { useRegisterMutation } from "../store/api/authApi";
import { useOtpFlow } from "../contexts/OtpContext";
import { useGetWardsQuery } from "../store/api/guestApi";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Logo } from "../components/ui/logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Shield, User, Mail, Lock, Phone, Home } from "lucide-react";
const Register = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const { openOtpFlow } = useOtpFlow();
    const { handleApiError } = useApiErrorHandler();
    const { isAuthenticated, user } = useAppSelector(selectAuth);
    const { appName, appLogoUrl, appLogoSize } = useSystemConfig();
    // API hooks
    const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
    const { data: wardsResponse, isLoading: wardsLoading, error: wardsError, } = useGetWardsQuery();
    const wardsData = Array.isArray(wardsResponse?.data)
        ? wardsResponse.data
        : [];
    // Clear registration state on component mount
    useEffect(() => {
        dispatch(resetRegistrationState());
    }, [dispatch]);
    // Redirect if authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            const dashboardRoute = getDashboardRouteForRole(user.role);
            navigate(dashboardRoute);
        }
    }, [isAuthenticated, user, navigate]);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        role: "CITIZEN",
        wardId: "",
    });
    // Transform wards data for the form
    const wards = wardsData.map((ward) => ({
        value: ward.id,
        label: ward.name,
    }));
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast({
                title: "Password Mismatch",
                description: "Passwords do not match",
                variant: "destructive",
            });
            return;
        }
        try {
            const result = await registerUser({
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                password: formData.password,
                role: formData.role,
                wardId: formData.wardId,
            }).unwrap();
            if (result.data?.requiresOtpVerification) {
                // OTP verification required - open unified dialog
                openOtpFlow({
                    context: "register",
                    email: formData.email,
                    title: "Complete Registration",
                    description: "Enter the verification code sent to your email to activate your account",
                    onSuccess: (data) => {
                        toast({
                            title: "Registration Successful!",
                            description: `Welcome ${data.user?.fullName}! Your account has been verified.`,
                        });
                        // Navigation will be handled by auth state change
                    },
                });
                toast({
                    title: "Registration Initiated",
                    description: "Please check your email for the verification code.",
                });
            }
            else {
                // Direct registration without OTP
                toast({
                    title: "Registration Successful!",
                    description: "Account created successfully! Welcome aboard!",
                });
                // Navigation will be handled by auth state change
            }
        }
        catch (error) {
            console.error("Registration error:", JSON.stringify(error, null, 2));
            console.error("Registration error object:", error);
            // Handle RTK Query error structure
            console.log("RTK Query error structure:", error);
            // Check if this is an RTK Query error with data
            const errorData = error?.data?.data || error?.data;
            const errorStatus = error?.status;
            // Handle specific user already exists scenarios
            if (errorStatus === 400 && errorData?.existingUser) {
                const { isActive, action } = errorData;
                if (isActive && action === "login") {
                    toast({
                        title: "Account Already Exists",
                        description: "This email is already registered. Please log in instead.",
                        variant: "destructive",
                        action: (_jsx(Link, { to: "/login", className: "inline-flex items-center justify-center rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline h-8 px-3", children: "Go to Login" })),
                    });
                }
                else if (!isActive && action === "verify_email") {
                    toast({
                        title: "Email Verification Pending",
                        description: "This email is already registered but not verified. Please check your email for verification code.",
                    });
                    // Open OTP flow for the existing unverified user
                    openOtpFlow({
                        context: "register",
                        email: formData.email,
                        title: "Complete Registration",
                        description: "Enter the verification code sent to your email to activate your account. Click 'Resend Code' if you need a new verification email.",
                        onSuccess: (data) => {
                            toast({
                                title: "Registration Completed!",
                                description: `Welcome ${data.user?.fullName}! Your account has been verified.`,
                            });
                        },
                    });
                }
            }
            else {
                // Handle other errors - extract message from server response
                const errorMessage = errorData?.message ||
                    error?.data?.message ||
                    getApiErrorMessage(error);
                console.log("Extracted error message:", errorMessage);
                toast({
                    title: "Registration Failed",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-md space-y-6", children: [_jsx("div", { className: "text-center mb-8", children: _jsxs("div", { className: "flex items-center justify-center mb-4", children: [_jsx(Logo, { logoUrl: appLogoUrl, appName: appName, size: appLogoSize, context: "auth", fallbackIcon: Shield, showText: false, className: "mr-3" }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: appName }), _jsx("p", { className: "text-gray-600", children: "Create Your Account" })] })] }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-center", children: "Register for E-Governance Portal" }) }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "fullName", children: "Full Name" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { id: "fullName", type: "text", value: formData.fullName, onChange: (e) => setFormData({ ...formData, fullName: e.target.value }), placeholder: "Enter your full name", className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { id: "email", type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), placeholder: "Enter your email", className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "phoneNumber", children: "Phone Number" }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { id: "phoneNumber", type: "tel", value: formData.phoneNumber, onChange: (e) => setFormData({ ...formData, phoneNumber: e.target.value }), placeholder: "Enter your phone number", className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "wardId", children: "Ward" }), _jsxs(Select, { value: formData.wardId, onValueChange: (value) => setFormData({ ...formData, wardId: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select your ward" }) }), _jsx(SelectContent, { children: wardsLoading ? (_jsx(SelectItem, { value: "loading", disabled: true, children: "Loading wards..." })) : wardsError ? (_jsx(SelectItem, { value: "error", disabled: true, children: "Error loading wards" })) : (wards.map((ward) => (_jsx(SelectItem, { value: ward.value, children: ward.label }, ward.value)))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { id: "password", type: "password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), placeholder: "Create a password", className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPassword", children: "Confirm Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { id: "confirmPassword", type: "password", value: formData.confirmPassword, onChange: (e) => setFormData({
                                                                ...formData,
                                                                confirmPassword: e.target.value,
                                                            }), placeholder: "Confirm your password", className: "pl-10", required: true })] })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isRegistering, children: isRegistering ? "Creating Account..." : "Create Account" })] }), _jsxs("div", { className: "mt-6 text-center space-y-2", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Already have an account?", " ", _jsx(Link, { to: "/login", className: "text-blue-600 hover:underline", children: "Sign in here" })] }), _jsx("p", { className: "text-sm text-gray-600", children: _jsxs(Link, { to: "/", className: "inline-flex items-center gap-1 text-blue-600 hover:underline", children: [_jsx(Home, { className: "h-4 w-4" }), "Back to Home"] }) })] })] })] })] }) }));
};
export default Register;
