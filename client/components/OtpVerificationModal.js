import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Shield, Clock, Mail, CheckCircle, AlertCircle, RefreshCw, } from "lucide-react";
const OtpVerificationModal = ({ isOpen, onClose, onVerified, complaintId, maskedEmail, isVerifying, error, onResendOtp, isResending = false, }) => {
    const [otpCode, setOtpCode] = useState("");
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [canResend, setCanResend] = useState(false);
    // Timer countdown
    useEffect(() => {
        if (!isOpen)
            return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen]);
    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setOtpCode("");
            setTimeLeft(600);
            setCanResend(false);
        }
    }, [isOpen]);
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };
    const handleOtpChange = (value) => {
        // Only allow digits and limit to 6 characters
        const sanitized = value.replace(/\D/g, "").slice(0, 6);
        setOtpCode(sanitized);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (otpCode.length === 6) {
            onVerified({ complaintId, otpCode });
        }
    };
    const handleResend = () => {
        if (onResendOtp && canResend) {
            setTimeLeft(600);
            setCanResend(false);
            onResendOtp();
        }
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center space-x-2", children: [_jsx("div", { className: "p-2 bg-blue-100 rounded-lg", children: _jsx(Shield, { className: "h-5 w-5 text-blue-600" }) }), _jsx("span", { children: "Verify Your Identity" })] }), _jsx(DialogDescription, { children: "We've sent a verification code to your email address to ensure the security of your complaint details." })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center space-x-3 p-4 bg-blue-50 rounded-lg", children: [_jsx(Mail, { className: "h-5 w-5 text-blue-600" }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-medium text-blue-900", children: ["Code sent to: ", maskedEmail] }), _jsx("p", { className: "text-xs text-blue-600", children: "Check your inbox and spam folder" })] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "otpCode", children: "Enter 6-digit verification code" }), _jsx(Input, { id: "otpCode", type: "text", value: otpCode, onChange: (e) => handleOtpChange(e.target.value), placeholder: "000000", className: "text-center text-lg font-mono tracking-widest", maxLength: 6, autoComplete: "one-time-code", autoFocus: true }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Enter the 6-digit code from your email" })] }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Clock, { className: "h-4 w-4 text-gray-500" }), _jsxs("span", { className: "text-gray-600", children: ["Code expires in: ", formatTime(timeLeft)] })] }), timeLeft === 0 && (_jsx("span", { className: "text-red-600 font-medium", children: "Code expired" }))] }), error && (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: error })] })), otpCode.length === 6 && !error && (_jsxs(Alert, { children: [_jsx(CheckCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: "Code entered successfully. Click verify to continue." })] })), _jsxs("div", { className: "flex space-x-3", children: [_jsx(Button, { type: "submit", disabled: otpCode.length !== 6 || isVerifying || timeLeft === 0, className: "flex-1", children: isVerifying ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" }), "Verifying..."] })) : ("Verify Code") }), _jsx(Button, { type: "button", variant: "outline", onClick: handleResend, disabled: !canResend || isResending, children: isResending ? (_jsx(RefreshCw, { className: "h-4 w-4 animate-spin" })) : ("Resend") })] })] }), _jsx("div", { className: "text-center", children: _jsxs("p", { className: "text-xs text-gray-500", children: ["Didn't receive the code?", " ", canResend ? (_jsx("button", { onClick: handleResend, className: "text-blue-600 hover:underline", disabled: isResending, children: "Click to resend" })) : (`Wait ${formatTime(timeLeft)} to resend`)] }) }), _jsx("div", { className: "bg-yellow-50 p-3 rounded-lg", children: _jsxs("div", { className: "flex items-start space-x-2", children: [_jsx(AlertCircle, { className: "h-4 w-4 text-yellow-600 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-yellow-800", children: "Security Note" }), _jsx("p", { className: "text-xs text-yellow-700", children: "Never share this code with anyone. Our team will never ask for your verification code." })] })] }) })] })] }) }));
};
export default OtpVerificationModal;
