import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { clearError, selectAuth, setCredentials } from "../store/slices/authSlice";
import { useSetPasswordMutation, useValidatePasswordSetupTokenMutation, useGetCurrentUserQuery } from "../store/api/authApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Eye, EyeOff, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { useToast } from "../hooks/use-toast";
const SetPassword = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { token: paramToken } = useParams();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const queryToken = searchParams.get("token") || undefined;
    const token = paramToken || queryToken;
    const { toast } = useToast();
    const { appName } = useSystemConfig();
    const { error } = useAppSelector(selectAuth);
    const [setPasswordMutation, { isLoading }] = useSetPasswordMutation();
    const [validateToken] = useValidatePasswordSetupTokenMutation();
    const { refetch: refetchCurrentUser } = useGetCurrentUserQuery(undefined);
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordValidation, setPasswordValidation] = useState({
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        match: false,
    });
    // Clear error when component mounts
    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);
    // Note: Do NOT auto-redirect authenticated users from this page
    // Validate token exists and is valid (no redirects on error)
    const [tokenValid, setTokenValid] = useState(null);
    const [tokenValidationMessage, setTokenValidationMessage] = useState("");
    useEffect(() => {
        const run = async () => {
            if (!token) {
                setTokenValid(false);
                setTokenValidationMessage("The password setup link is invalid or missing.");
                toast({
                    title: "Invalid Link",
                    description: "The password setup link is invalid or missing.",
                    variant: "destructive",
                });
                return;
            }
            try {
                const res = await validateToken({ token }).unwrap();
                setTokenValid(!!res?.data?.valid);
                if (!res?.data?.valid) {
                    setTokenValidationMessage("This password setup link is invalid or expired. Please request a new link from your profile page.");
                    toast({
                        title: "Invalid or Expired Link",
                        description: "Please request a new setup link.",
                        variant: "destructive",
                    });
                }
            }
            catch (e) {
                // If backend doesn't provide a validation endpoint (404), skip pre-validation gracefully
                const status = e?.status || e?.originalStatus || e?.data?.status;
                if (status === 404) {
                    setTokenValid(null); // unknown; allow form submit to validate
                    setTokenValidationMessage("");
                    // Optional: info toast once
                    toast({ title: "Proceeding Without Pre-Validation", description: "We'll validate the link when you submit.", variant: "default" });
                }
                else {
                    setTokenValid(false);
                    const msg = e?.data?.message || "Could not validate the link. Please request a new setup link.";
                    setTokenValidationMessage(msg);
                    toast({ title: "Link Validation Failed", description: msg, variant: "destructive" });
                }
            }
        };
        run();
    }, [token, validateToken, toast]);
    // Password validation
    useEffect(() => {
        const { password, confirmPassword } = formData;
        setPasswordValidation({
            minLength: password.length >= 6,
            hasUpper: /[A-Z]/.test(password),
            hasLower: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            match: password.length > 0 && password === confirmPassword,
        });
    }, [formData]);
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            return;
        }
        const { password, confirmPassword } = formData;
        // Validate passwords match
        if (password !== confirmPassword) {
            return;
        }
        // Validate password strength
        const isValid = Object.values(passwordValidation).every(Boolean);
        if (!isValid) {
            return;
        }
        try {
            if (tokenValid === false) {
                // Prevent submit if token invalid
                return;
            }
            const result = await setPasswordMutation({
                token: token,
                password,
            }).unwrap();
            // Update Redux store with new user data (including hasPassword: true)
            if (result?.data?.user && result?.data?.token) {
                dispatch(setCredentials({
                    token: result.data.token,
                    user: result.data.user,
                }));
            }
            else {
                // Fallback: refresh profile from backend to get updated hasPassword
                try {
                    const me = await refetchCurrentUser().unwrap();
                    if (me?.data?.user && me?.data?.token) {
                        dispatch(setCredentials({
                            token: me.data.token,
                            user: me.data.user,
                        }));
                    }
                }
                catch (e) {
                    // If refetch fails, continue with success flow
                    console.warn("Failed to refresh user after password setup:", e);
                }
            }
            toast({
                title: "Password Set Successfully",
                description: "You can now log in using your new password.",
            });
            // Redirect to login per flow requirement
            navigate("/login");
        }
        catch (error) {
            toast({
                title: "Error",
                description: error?.data?.message ||
                    "Failed to set password. The link may be invalid or expired. Please request a new setup link.",
                variant: "destructive",
            });
        }
    };
    const isFormValid = Object.values(passwordValidation).every(Boolean) && tokenValid !== false;
    const ValidationItem = ({ isValid, text, }) => (_jsxs("div", { className: `flex items-center gap-2 text-sm ${isValid ? "text-green-600" : "text-gray-500"}`, children: [isValid ? (_jsx(CheckCircle, { className: "h-4 w-4" })) : (_jsx(AlertCircle, { className: "h-4 w-4" })), text] }));
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4", children: _jsxs("div", { className: "w-full max-w-md space-y-6", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("div", { className: "flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto", children: _jsx(Shield, { className: "h-8 w-8 text-blue-600" }) }), _jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Set Your Password" }), _jsxs("p", { className: "text-gray-600", children: ["Create a secure password for your ", appName, " account"] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { children: "Create Password" }), _jsx(CardDescription, { children: "Choose a strong password to protect your account" })] }), _jsxs(CardContent, { children: [tokenValid === false && (_jsx(Alert, { className: "mb-4 border-red-200 bg-red-50", children: _jsx(AlertDescription, { className: "text-red-700", children: tokenValidationMessage || "Invalid or expired link." }) })), tokenValid === null && (_jsx(Alert, { className: "mb-4 border-blue-200 bg-blue-50", children: _jsx(AlertDescription, { className: "text-blue-700", children: "Unable to pre-validate this link. We will validate it when you submit your new password." }) })), error && (_jsx(Alert, { className: "mb-4 border-red-200 bg-red-50", children: _jsx(AlertDescription, { className: "text-red-700", children: error }) })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "New Password" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "password", name: "password", type: showPassword ? "text" : "password", placeholder: "Enter your new password", value: formData.password, onChange: handleInputChange, required: true }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent", onClick: () => setShowPassword(!showPassword), children: showPassword ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPassword", children: "Confirm Password" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "confirmPassword", name: "confirmPassword", type: showConfirmPassword ? "text" : "password", placeholder: "Confirm your new password", value: formData.confirmPassword, onChange: handleInputChange, required: true }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent", onClick: () => setShowConfirmPassword(!showConfirmPassword), children: showConfirmPassword ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) })] })] }), _jsxs("div", { className: "space-y-2 p-4 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "text-sm font-medium text-gray-700", children: "Password Requirements:" }), _jsxs("div", { className: "space-y-1", children: [_jsx(ValidationItem, { isValid: passwordValidation.minLength, text: "At least 6 characters long" }), _jsx(ValidationItem, { isValid: passwordValidation.hasUpper, text: "Contains uppercase letter" }), _jsx(ValidationItem, { isValid: passwordValidation.hasLower, text: "Contains lowercase letter" }), _jsx(ValidationItem, { isValid: passwordValidation.hasNumber, text: "Contains number" }), _jsx(ValidationItem, { isValid: passwordValidation.match, text: "Passwords match" })] })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading || !isFormValid, children: isLoading ? "Setting Password..." : "Set Password" })] }), _jsx("div", { className: "mt-4 p-4 bg-blue-50 rounded-lg", children: _jsxs("p", { className: "text-sm text-blue-700", children: [_jsx("strong", { children: "Security Notice:" }), " After setting your password, you'll be automatically logged in and can access your account using either password or OTP login methods."] }) })] })] })] }) }));
};
export default SetPassword;
