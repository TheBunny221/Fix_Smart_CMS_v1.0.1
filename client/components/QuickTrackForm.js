import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { setCredentials } from "../store/slices/authSlice";
import { useRequestComplaintOtpMutation, useVerifyComplaintOtpMutation, } from "../store/api/guestApi";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, Lock, RefreshCw, Search } from "lucide-react";
import OtpVerificationModal from "./OtpVerificationModal";
const QuickTrackForm = ({ onClose }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [complaintId, setComplaintId] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [error, setError] = useState("");
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [requestOtp, { isLoading: isRequestingOtp }] = useRequestComplaintOtpMutation();
    const [verifyOtp, { isLoading: isVerifyingOtp, error: verifyError }] = useVerifyComplaintOtpMutation();
    const handleRequest = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await requestOtp({
                complaintId: complaintId.trim(),
            }).unwrap();
            if (res?.success) {
                setMaskedEmail(res.data.email);
                setShowOtpModal(true);
            }
        }
        catch (err) {
            setError(err?.data?.message ||
                "Complaint not found. Please check your complaint ID.");
        }
    };
    const handleVerified = async ({ complaintId, otpCode, }) => {
        try {
            const res = await verifyOtp({ complaintId, otpCode }).unwrap();
            if (res?.success && res.data?.token && res.data?.user) {
                dispatch(setCredentials({ token: res.data.token, user: res.data.user }));
                localStorage.setItem("token", res.data.token);
                const redirect = res.data.redirectTo ||
                    `/complaints/${res.data.complaint?.id || complaintId}`;
                setShowOtpModal(false);
                onClose?.();
                navigate(redirect);
            }
        }
        catch (e) {
            // Otp modal shows error
        }
    };
    const handleResend = async () => {
        try {
            await requestOtp({ complaintId: complaintId.trim() }).unwrap();
        }
        catch {
            // ignore
        }
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Lock, { className: "h-5 w-5 text-blue-600" }), "Track Your Complaint"] }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleRequest, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "complaintId", children: "Complaint ID" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { id: "complaintId", value: complaintId, onChange: (e) => setComplaintId(e.target.value), placeholder: "Enter your complaint ID (e.g., CSC...)", className: "pl-10", required: true })] })] }), error && (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: error })] })), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "submit", disabled: isRequestingOtp, children: isRequestingOtp ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" }), " Sending..."] })) : ("Verify & Track") }), _jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Cancel" })] })] }) }), _jsx(OtpVerificationModal, { isOpen: showOtpModal, onClose: () => setShowOtpModal(false), onVerified: handleVerified, complaintId: complaintId, maskedEmail: maskedEmail, isVerifying: isVerifyingOtp, error: verifyError?.data?.message || null, onResendOtp: handleResend, isResending: isRequestingOtp })] }));
};
export default QuickTrackForm;
