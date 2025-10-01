import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { setCredentials } from "../store/slices/authSlice";
import { useRequestComplaintOtpMutation, useVerifyComplaintOtpMutation, } from "../store/api/guestApi";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Search, FileText, Calendar, MapPin, Clock, CheckCircle, AlertCircle, Shield, Lock, } from "lucide-react";
import QuickComplaintModal from "../components/QuickComplaintModal";
import OtpVerificationModal from "../components/OtpVerificationModal";
import ComplaintDetailsModal from "../components/ComplaintDetailsModal";
const GuestTrackComplaint = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [complaintId, setComplaintId] = useState("");
    const [trackingResult, setTrackingResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
    // OTP Verification States
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showComplaintDetails, setShowComplaintDetails] = useState(false);
    const [maskedEmail, setMaskedEmail] = useState("");
    const [verifiedComplaint, setVerifiedComplaint] = useState(null);
    const [verifiedUser, setVerifiedUser] = useState(null);
    // API Hooks
    const [requestOtp, { isLoading: isRequestingOtp }] = useRequestComplaintOtpMutation();
    const [verifyOtp, { isLoading: isVerifyingOtp, error: verifyError }] = useVerifyComplaintOtpMutation();
    const handleTrack = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            // Request OTP for the complaint
            const result = await requestOtp({
                complaintId: complaintId.trim(),
            }).unwrap();
            if (result.success) {
                setMaskedEmail(result.data.email);
                setShowOtpModal(true);
            }
        }
        catch (err) {
            setError(err?.data?.message ||
                "Complaint not found. Please check your complaint ID.");
            setTrackingResult(null);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleOtpVerified = async (data) => {
        try {
            const result = await verifyOtp(data).unwrap();
            if (result.success) {
                // Handle auto-login if token is provided
                if (result.data.token && result.data.user) {
                    // Dispatch auth credentials to Redux store
                    dispatch(setCredentials({
                        user: result.data.user,
                        token: result.data.token,
                    }));
                    // Store token in localStorage for persistence
                    localStorage.setItem("token", result.data.token);
                    // Show success message
                    console.log(result.data.isNewUser
                        ? "Account created and logged in successfully!"
                        : "Logged in successfully!");
                    // Navigate to complaint details page
                    if (result.data.redirectTo) {
                        navigate(result.data.redirectTo);
                        return;
                    }
                }
                // Fallback: show complaint details in modal
                setVerifiedComplaint(result.data.complaint);
                setVerifiedUser(result.data.user);
                setShowOtpModal(false);
                setShowComplaintDetails(true);
            }
        }
        catch (err) {
            // Error will be handled by the OTP modal
            console.error("OTP verification failed:", err);
        }
    };
    const handleResendOtp = async () => {
        try {
            await requestOtp({
                complaintId: complaintId.trim(),
            }).unwrap();
        }
        catch (err) {
            console.error("Failed to resend OTP:", err);
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case "REGISTERED":
                return "bg-yellow-100 text-yellow-800";
            case "ASSIGNED":
                return "bg-blue-100 text-blue-800";
            case "IN_PROGRESS":
                return "bg-orange-100 text-orange-800";
            case "RESOLVED":
                return "bg-green-100 text-green-800";
            case "CLOSED":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case "REGISTERED":
                return _jsx(FileText, { className: "h-4 w-4" });
            case "ASSIGNED":
                return _jsx(AlertCircle, { className: "h-4 w-4" });
            case "IN_PROGRESS":
                return _jsx(Clock, { className: "h-4 w-4" });
            case "RESOLVED":
            case "CLOSED":
                return _jsx(CheckCircle, { className: "h-4 w-4" });
            default:
                return _jsx(FileText, { className: "h-4 w-4" });
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 py-8", children: [_jsxs("div", { className: "max-w-4xl mx-auto px-4", children: [_jsx("div", { className: "text-center mb-8", children: _jsxs("div", { className: "flex items-center justify-center mb-4", children: [_jsx(Shield, { className: "h-12 w-12 text-blue-600 mr-3" }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Track Your Complaint" }), _jsx("p", { className: "text-gray-600", children: "Secure complaint tracking with email verification" })] })] }) }), _jsxs(Card, { className: "mb-8", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-center flex items-center justify-center space-x-2", children: [_jsx(Lock, { className: "h-5 w-5 text-blue-600" }), _jsx("span", { children: "Secure Complaint Tracking" })] }) }), _jsxs(CardContent, { children: [_jsxs(Alert, { className: "mb-4", children: [_jsx(Lock, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: "For your security, we'll send a verification code to your registered email before showing complaint details." })] }), _jsxs("form", { onSubmit: handleTrack, className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx(Label, { htmlFor: "complaintId", children: "Complaint ID" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { id: "complaintId", type: "text", value: complaintId, onChange: (e) => setComplaintId(e.target.value), placeholder: "Enter your complaint ID (e.g., CMP123456)", className: "pl-10", required: true })] })] }), _jsx("div", { className: "flex items-end", children: _jsx(Button, { type: "submit", disabled: isLoading || isRequestingOtp, className: "w-full sm:w-auto", children: isLoading || isRequestingOtp
                                                                ? "Verifying..."
                                                                : "Verify & Track" }) })] }), error && (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: error })] }))] })] })] }), trackingResult && (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsx("span", { children: "Complaint Details" }), _jsx(Badge, { className: getStatusColor(trackingResult.status), children: trackingResult.status.replace("_", " ") })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: "Complaint ID" }), _jsxs("p", { className: "text-gray-600", children: ["#", trackingResult.id] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: "Type" }), _jsx("p", { className: "text-gray-600", children: trackingResult.type?.replace("_", " ") })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: "Description" }), _jsx("p", { className: "text-gray-600", children: trackingResult.description })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-medium text-gray-900 flex items-center", children: [_jsx(MapPin, { className: "h-4 w-4 mr-1" }), "Location"] }), _jsx("p", { className: "text-gray-600", children: trackingResult.area })] }), _jsxs("div", { children: [_jsxs("h3", { className: "font-medium text-gray-900 flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1" }), "Submitted On"] }), _jsx("p", { className: "text-gray-600", children: new Date(trackingResult.submittedOn).toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-900", children: "Priority" }), _jsx(Badge, { variant: "secondary", children: trackingResult.priority })] })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Status Timeline" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center", children: _jsx(CheckCircle, { className: "h-4 w-4 text-green-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "font-medium text-green-600", children: "Complaint Registered" }), _jsx("p", { className: "text-sm text-gray-500", children: new Date(trackingResult.submittedOn).toLocaleDateString() })] }), _jsx("p", { className: "text-sm text-gray-600", children: "Your complaint has been successfully registered in our system." })] })] }), _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${[
                                                                "ASSIGNED",
                                                                "IN_PROGRESS",
                                                                "RESOLVED",
                                                                "CLOSED",
                                                            ].includes(trackingResult.status)
                                                                ? "bg-green-100"
                                                                : "bg-gray-100"}`, children: _jsx(AlertCircle, { className: `h-4 w-4 ${[
                                                                    "ASSIGNED",
                                                                    "IN_PROGRESS",
                                                                    "RESOLVED",
                                                                    "CLOSED",
                                                                ].includes(trackingResult.status)
                                                                    ? "text-green-600"
                                                                    : "text-gray-400"}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: `font-medium ${[
                                                                                "ASSIGNED",
                                                                                "IN_PROGRESS",
                                                                                "RESOLVED",
                                                                                "CLOSED",
                                                                            ].includes(trackingResult.status)
                                                                                ? "text-green-600"
                                                                                : "text-gray-400"}`, children: "Complaint Assigned" }), trackingResult.assignedOn && (_jsx("p", { className: "text-sm text-gray-500", children: new Date(trackingResult.assignedOn).toLocaleDateString() }))] }), _jsx("p", { className: "text-sm text-gray-600", children: "Assigned to the appropriate team for resolution." })] })] }), _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(trackingResult.status)
                                                                ? "bg-green-100"
                                                                : "bg-gray-100"}`, children: _jsx(Clock, { className: `h-4 w-4 ${["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(trackingResult.status)
                                                                    ? "text-green-600"
                                                                    : "text-gray-400"}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("p", { className: `font-medium ${["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(trackingResult.status)
                                                                            ? "text-green-600"
                                                                            : "text-gray-400"}`, children: "Work in Progress" }) }), _jsx("p", { className: "text-sm text-gray-600", children: "Our team is actively working on resolving your complaint." })] })] }), _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: `flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${["RESOLVED", "CLOSED"].includes(trackingResult.status)
                                                                ? "bg-green-100"
                                                                : "bg-gray-100"}`, children: _jsx(CheckCircle, { className: `h-4 w-4 ${["RESOLVED", "CLOSED"].includes(trackingResult.status)
                                                                    ? "text-green-600"
                                                                    : "text-gray-400"}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: `font-medium ${["RESOLVED", "CLOSED"].includes(trackingResult.status)
                                                                                ? "text-green-600"
                                                                                : "text-gray-400"}`, children: "Complaint Resolved" }), trackingResult.resolvedOn && (_jsx("p", { className: "text-sm text-gray-500", children: new Date(trackingResult.resolvedOn).toLocaleDateString() }))] }), _jsx("p", { className: "text-sm text-gray-600", children: "Your complaint has been successfully resolved." })] })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Expected Resolution" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Expected Resolution Time" }), _jsx("p", { className: "text-sm text-gray-600", children: "Based on complaint type and priority" })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-2xl font-bold text-blue-600", children: "2-5 days" }), _jsx("p", { className: "text-sm text-gray-500", children: "Business days" })] })] }) })] })] })), _jsxs(Card, { className: "mt-8", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Need Help?" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-2", children: "Submit New Complaint" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Have another issue? Submit a new complaint." }), _jsx(Button, { variant: "outline", onClick: () => setIsQuickFormOpen(true), children: "New Complaint" })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-2", children: "Contact Support" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Need assistance? Contact our support team." }), _jsx(Button, { variant: "outline", children: "Contact Support" })] })] }) })] })] }), _jsx(QuickComplaintModal, { isOpen: isQuickFormOpen, onClose: () => setIsQuickFormOpen(false), onSuccess: (complaintId) => {
                    // Could automatically set the tracking ID to show the new complaint
                    setComplaintId(complaintId);
                } }), _jsx(OtpVerificationModal, { isOpen: showOtpModal, onClose: () => setShowOtpModal(false), onVerified: handleOtpVerified, complaintId: complaintId, maskedEmail: maskedEmail, isVerifying: isVerifyingOtp, error: verifyError?.data?.message || null, onResendOtp: handleResendOtp, isResending: isRequestingOtp }), _jsx(ComplaintDetailsModal, { isOpen: showComplaintDetails, onClose: () => setShowComplaintDetails(false), complaint: verifiedComplaint, user: verifiedUser })] }));
};
export default GuestTrackComplaint;
