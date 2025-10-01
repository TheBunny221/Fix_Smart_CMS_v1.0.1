import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { verifyRegistrationOTP, resendRegistrationOTP, selectAuth, selectRegistrationData, getDashboardRouteForRole, } from "../store/slices/authSlice";
import { showToast } from "../store/slices/uiSlice";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "./ui/card";
import { Mail, Clock, CheckCircle2, ArrowLeft } from "lucide-react";
const OTPVerification = ({ onBack }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isLoading, error, isAuthenticated, user } = useAppSelector(selectAuth);
    const registrationData = useAppSelector(selectRegistrationData);
    const [otpCode, setOtpCode] = useState("");
    const [timer, setTimer] = useState(300); // 5 minutes
    const [canResend, setCanResend] = useState(false);
    // Timer countdown
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);
    // Redirect on successful authentication
    useEffect(() => {
        if (isAuthenticated && user) {
            const dashboardRoute = getDashboardRouteForRole(user.role);
            dispatch(showToast({
                type: "success",
                title: "Registration Successful!",
                message: `Welcome ${user.fullName}! Your account has been verified.`,
            }));
            navigate(dashboardRoute);
        }
    }, [isAuthenticated, user, navigate, dispatch]);
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!registrationData?.email || otpCode.length !== 6) {
            return;
        }
        try {
            await dispatch(verifyRegistrationOTP({
                email: registrationData.email,
                otpCode,
            })).unwrap();
        }
        catch (error) {
            dispatch(showToast({
                type: "error",
                title: "Verification Failed",
                message: error.message || "Invalid OTP. Please try again.",
            }));
        }
    };
    const handleResendOTP = async () => {
        if (!registrationData?.email)
            return;
        try {
            await dispatch(resendRegistrationOTP({
                email: registrationData.email,
            })).unwrap();
            dispatch(showToast({
                type: "success",
                title: "Email Sent Successfully!",
                message: `A new verification code has been sent to ${registrationData.email}. Please check your email.`,
            }));
            setTimer(300);
            setCanResend(false);
        }
        catch (error) {
            dispatch(showToast({
                type: "error",
                title: "Failed to Resend",
                message: error.message || "Failed to resend OTP. Please try again.",
            }));
        }
    };
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };
    if (!registrationData) {
        return (_jsx("div", { className: "text-center p-8", children: _jsx("p", { className: "text-gray-600", children: "No registration data found. Please register again." }) }));
    }
    return (_jsx("div", { className: "w-full max-w-md mx-auto", children: _jsxs(Card, { children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4", children: _jsx(Mail, { className: "h-6 w-6 text-blue-600" }) }), _jsx(CardTitle, { children: "Verify Your Email" }), _jsxs(CardDescription, { children: ["We've sent a 6-digit verification code to", _jsx("br", {}), _jsx("strong", { children: registrationData.email })] })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handleVerifyOTP, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "otpCode", children: "Enter Verification Code" }), _jsx(Input, { id: "otpCode", type: "text", placeholder: "000000", value: otpCode, onChange: (e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)), maxLength: 6, className: "text-center tracking-widest text-lg", required: true })] }), error && (_jsx("div", { className: "text-sm text-red-600 text-center", children: error })), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading || otpCode.length !== 6, children: isLoading ? (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }), "Verifying..."] })) : (_jsxs("div", { className: "flex items-center justify-center", children: [_jsx(CheckCircle2, { className: "h-4 w-4 mr-2" }), "Verify Email"] })) })] }), _jsxs("div", { className: "mt-6 text-center space-y-4", children: [timer > 0 ? (_jsxs("div", { className: "flex items-center justify-center gap-2 text-sm text-gray-600", children: [_jsx(Clock, { className: "h-4 w-4" }), "Resend code in ", formatTime(timer)] })) : (_jsx(Button, { variant: "ghost", size: "sm", onClick: handleResendOTP, disabled: isLoading, children: "Resend Verification Code" })), onBack && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: onBack, className: "flex items-center", children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-1" }), "Back to Registration"] }))] })] })] }) }));
};
export default OTPVerification;
