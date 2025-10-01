import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { selectAuth, getDashboardRouteForRole, setCredentials, } from "../store/slices/authSlice";
import { useCreateComplaintMutation } from "../store/api/complaintsApi";
import { clearGuestData, updateFormData as updateGuestFormData, validateCurrentStep, setCurrentStep, nextStep, prevStep, addAttachment, removeAttachment, setImagePreview, selectFormData, selectCurrentStep, selectSteps, selectValidationErrors, selectCanProceed, selectIsSubmitting, selectComplaintId, selectSessionId, selectTrackingNumber, selectImagePreview, setOtpSession, } from "../store/slices/guestSlice";
import { useGetWardsQuery, useVerifyGuestOtpMutation, useSubmitGuestComplaintMutation, useResendGuestOtpMutation, } from "../store/api/guestApi";
import { useOtpFlow } from "../contexts/OtpContext";
import OtpDialog from "../components/OtpDialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import SimpleLocationMapDialog from "../components/SimpleLocationMapDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "../components/ui/dialog";
import { Mail, CheckCircle, Clock, User, MapPin, ArrowLeft, ArrowRight, Loader2, UserPlus, Shield, Camera, Upload, X, Eye, MapIcon, Check, UserCheck, Info, } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { prewarmMapAssets } from "../utils/mapTilePrefetch";
const COMPLAINT_TYPES = [
    {
        value: "WATER_SUPPLY",
        label: "Water Supply",
        description: "Issues with water supply, quality, or pressure",
    },
    {
        value: "ELECTRICITY",
        label: "Electricity",
        description: "Power outages, faulty connections, or street lighting",
    },
    {
        value: "ROAD_REPAIR",
        label: "Road Repair",
        description: "Potholes, broken roads, or pedestrian issues",
    },
    {
        value: "GARBAGE_COLLECTION",
        label: "Garbage Collection",
        description: "Waste management and cleanliness issues",
    },
    {
        value: "STREET_LIGHTING",
        label: "Street Lighting",
        description: "Non-functioning or damaged street lights",
    },
    {
        value: "SEWERAGE",
        label: "Sewerage",
        description: "Drainage problems, blockages, or overflow",
    },
    {
        value: "PUBLIC_HEALTH",
        label: "Public Health",
        description: "Health and sanitation concerns",
    },
    {
        value: "TRAFFIC",
        label: "Traffic",
        description: "Traffic management and road safety issues",
    },
    {
        value: "OTHERS",
        label: "Others",
        description: "Any other civic issues not listed above",
    },
];
const PRIORITIES = [
    {
        value: "LOW",
        label: "Low",
        color: "bg-gray-500",
        description: "Non-urgent issues",
    },
    {
        value: "MEDIUM",
        label: "Medium",
        color: "bg-blue-500",
        description: "Standard issues requiring attention",
    },
    {
        value: "HIGH",
        label: "High",
        color: "bg-orange-500",
        description: "Important issues affecting daily life",
    },
    {
        value: "CRITICAL",
        label: "Critical",
        color: "bg-red-500",
        description: "Emergency situations requiring immediate attention",
    },
];
const UnifiedComplaintForm = () => {
    const navigate = useNavigate();
    // RTK Query mutations
    const [createComplaintMutation] = useCreateComplaintMutation();
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const { openOtpFlow } = useOtpFlow();
    const { getConfig } = useSystemConfig();
    const [verifyGuestOtp] = useVerifyGuestOtpMutation();
    const [submitGuestComplaintMutation, { isLoading: isSendingOtp }] = useSubmitGuestComplaintMutation();
    const [resendGuestOtp] = useResendGuestOtpMutation();
    const { isAuthenticated, user } = useAppSelector(selectAuth);
    // Fetch wards from API
    const { data: wardsResponse, isLoading: wardsLoading, error: wardsError, } = useGetWardsQuery();
    const wards = Array.isArray(wardsResponse?.data) ? wardsResponse.data : [];
    // Use guest form state as the canonical source for form management
    const currentStep = useAppSelector(selectCurrentStep);
    const steps = useAppSelector(selectSteps);
    const formData = useAppSelector(selectFormData);
    const validationErrors = useAppSelector(selectValidationErrors);
    const canProceed = useAppSelector(selectCanProceed);
    const isSubmitting = useAppSelector(selectIsSubmitting);
    const complaintId = useAppSelector(selectComplaintId);
    const sessionId = useAppSelector(selectSessionId);
    const trackingNumber = useAppSelector(selectTrackingNumber);
    const imagePreview = useAppSelector(selectImagePreview);
    // Local state for file handling and location
    const [currentLocation, setCurrentLocation] = useState(null);
    const [fileMap, setFileMap] = useState(new Map());
    const [submissionMode, setSubmissionMode] = useState(isAuthenticated ? "citizen" : "guest");
    const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
    // OTP state
    const [otpCode, setOtpCode] = useState("");
    const [showOtpDialog, setShowOtpDialog] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    // Prefill form data for authenticated users
    useEffect(() => {
        if (isAuthenticated && user) {
            setSubmissionMode("citizen");
            // Pre-fill user data for citizen mode
            dispatch(updateGuestFormData({
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber || "",
                wardId: user.wardId || "",
            }));
        }
        else {
            setSubmissionMode("guest");
        }
    }, [isAuthenticated, user, dispatch]);
    // Prewarm map assets (tiles + leaflet) using system-config default center
    useEffect(() => {
        const lat = parseFloat(getConfig("MAP_DEFAULT_LAT", "9.9312")) || 9.9312;
        const lng = parseFloat(getConfig("MAP_DEFAULT_LNG", "76.2673")) || 76.2673;
        prewarmMapAssets(lat, lng, 13);
    }, [getConfig]);
    c; // Get current location
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setCurrentLocation(coords);
                dispatch(updateGuestFormData({
                    coordinates: {
                        latitude: coords.lat,
                        longitude: coords.lng,
                    },
                }));
            }, (error) => {
                console.log("Location access denied or unavailable");
            });
        }
    }, [dispatch]);
    // Handle input changes
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        dispatch(updateGuestFormData({ [name]: value }));
    }, [dispatch]);
    // Handle select changes
    const handleSelectChange = useCallback((name, value) => {
        dispatch(updateGuestFormData({ [name]: value }));
    }, [dispatch]);
    // Handle location selection from map
    const handleLocationSelect = useCallback((location) => {
        dispatch(updateGuestFormData({
            landmark: location.landmark || location.address || "",
            area: location.area || formData.area,
            address: location.address || formData.address,
            coordinates: {
                latitude: location.latitude,
                longitude: location.longitude,
            },
        }));
    }, [dispatch, formData.area, formData.address]);
    // Handle file upload
    const handleFileUpload = useCallback((files) => {
        if (!files)
            return;
        Array.from(files).forEach((file) => {
            // Validate file
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Please select files smaller than 10MB",
                    variant: "destructive",
                });
                return;
            }
            if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
                toast({
                    title: "Invalid file type",
                    description: "Only JPG and PNG images are allowed",
                    variant: "destructive",
                });
                return;
            }
            // Create attachment object with serializable data
            const attachmentId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            const attachment = {
                id: attachmentId,
                name: file.name,
                size: file.size,
                type: file.type,
                preview: URL.createObjectURL(file),
                uploading: false,
                uploaded: false,
            };
            // Store the actual file separately
            setFileMap((prev) => new Map(prev).set(attachmentId, file));
            dispatch(addAttachment(attachment));
        });
    }, [dispatch, toast]);
    // Handle attachment removal
    const handleRemoveAttachment = useCallback((id) => {
        setFileMap((prev) => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
        });
        dispatch(removeAttachment(id));
    }, [dispatch]);
    // Handle image preview
    const handlePreviewImage = useCallback((url) => {
        dispatch(setImagePreview({ show: true, url }));
    }, [dispatch]);
    // Handle OTP input change
    const handleOtpChange = useCallback((e) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
        setOtpCode(value);
        // Clear OTP validation error when user starts typing
        if (validationErrors.otpCode) {
            dispatch(updateGuestFormData({})); // Trigger validation update
        }
    }, [dispatch, validationErrors.otpCode]);
    // Handle OTP resend
    const handleResendOtp = useCallback(async () => {
        if (!formData.email)
            return;
        try {
            await resendGuestOtp({ email: formData.email }).unwrap();
            toast({
                title: "Verification Code Resent",
                description: "A new verification code has been sent to your email.",
            });
        }
        catch (error) {
            toast({
                title: "Failed to Resend",
                description: error.message ||
                    "Failed to resend verification code. Please try again.",
                variant: "destructive",
            });
        }
    }, [dispatch, complaintId, formData.email, toast]);
    // Handle form navigation
    const handleNext = useCallback(() => {
        dispatch(validateCurrentStep());
        if (canProceed) {
            dispatch(nextStep());
        }
        else {
            toast({
                title: "Please complete required fields",
                description: "Fill in all required information before proceeding",
                variant: "destructive",
            });
        }
    }, [dispatch, canProceed, toast]);
    const handlePrev = useCallback(() => {
        dispatch(prevStep());
    }, [dispatch]);
    const handleStepClick = useCallback((stepNumber) => {
        if (stepNumber <= currentStep) {
            dispatch(setCurrentStep(stepNumber));
        }
    }, [dispatch, currentStep]);
    // Handle initial complaint submission (step 5 - send OTP)
    const handleSendOtp = useCallback(async () => {
        dispatch(validateCurrentStep());
        // Final validation of all previous steps
        const hasErrors = Object.keys(validationErrors).length > 0;
        if (hasErrors) {
            toast({
                title: "Please fix validation errors",
                description: "Complete all required fields correctly before submitting",
                variant: "destructive",
            });
            return;
        }
        try {
            if (submissionMode === "citizen" && isAuthenticated) {
                // Citizen flow: Submit directly to authenticated API
                const complaintData = {
                    title: `${COMPLAINT_TYPES.find((t) => t.value === formData.type)?.label} - ${formData.area}`,
                    description: formData.description,
                    complaintTypeId: formData.type,
                    type: formData.type,
                    priority: formData.priority,
                    wardId: formData.wardId,
                    subZoneId: formData.subZoneId,
                    area: formData.area,
                    landmark: formData.landmark,
                    address: formData.address,
                    coordinates: formData.coordinates,
                    contactName: formData.fullName,
                    contactEmail: formData.email,
                    contactPhone: formData.phoneNumber,
                    isAnonymous: false,
                };
                const result = await createComplaintMutation(complaintData).unwrap();
                toast({
                    title: "Complaint Submitted Successfully!",
                    description: `Your complaint has been registered with ID: ${result.complaintId}. You can track its progress from your dashboard.`,
                });
                // Clear form and navigate to dashboard
                dispatch(clearGuestData());
                navigate(getDashboardRouteForRole(user?.role || "CITIZEN"));
            }
            else {
                // Guest flow: Send OTP first (no attachments here)
                const submissionData = new FormData();
                submissionData.append("fullName", formData.fullName);
                submissionData.append("email", formData.email);
                submissionData.append("phoneNumber", formData.phoneNumber);
                if (formData.captchaId)
                    submissionData.append("captchaId", formData.captchaId);
                if (formData.captchaText)
                    submissionData.append("captchaText", formData.captchaText);
                const response = await submitGuestComplaintMutation(submissionData).unwrap();
                const result = response.data;
                if (result?.sessionId) {
                    dispatch(setOtpSession({
                        sessionId: result.sessionId,
                        email: result.email,
                        expiresAt: result.expiresAt,
                    }));
                    setShowOtpDialog(true);
                    toast({
                        title: "Verification Code Sent",
                        description: `A verification code has been sent to ${formData.email}. Please check your email and enter the code below.`,
                    });
                }
            }
        }
        catch (error) {
            console.error("Complaint submission error:", error);
            toast({
                title: "Submission Failed",
                description: error.message || "Failed to submit complaint. Please try again.",
                variant: "destructive",
            });
        }
    }, [
        dispatch,
        formData,
        validationErrors,
        submissionMode,
        isAuthenticated,
        user,
        fileMap,
        toast,
        navigate,
    ]);
    // Handle OTP verification and final submission
    const handleVerifyAndSubmit = useCallback(async () => {
        if (!otpCode || otpCode.length !== 6) {
            toast({
                title: "Invalid Code",
                description: "Please enter a valid 6-digit verification code.",
                variant: "destructive",
            });
            return;
        }
        if (!sessionId) {
            toast({
                title: "Error",
                description: "Verification session not found. Please resend the code.",
                variant: "destructive",
            });
            return;
        }
        try {
            // Use RTK Query mutation for OTP verification (send full complaint data now)
            const fd = new FormData();
            fd.append("email", formData.email);
            fd.append("otpCode", otpCode);
            fd.append("fullName", formData.fullName);
            fd.append("phoneNumber", formData.phoneNumber);
            fd.append("type", formData.type);
            fd.append("description", formData.description);
            fd.append("priority", formData.priority || "MEDIUM");
            fd.append("wardId", formData.wardId);
            if (formData.subZoneId)
                fd.append("subZoneId", formData.subZoneId);
            fd.append("area", formData.area);
            if (formData.landmark)
                fd.append("landmark", formData.landmark);
            if (formData.address)
                fd.append("address", formData.address);
            if (formData.coordinates)
                fd.append("coordinates", JSON.stringify(formData.coordinates));
            // Attach files
            const filesToSend = formData.attachments
                ?.map((a) => {
                const f = fileMap.get(a.id);
                return f ? { id: a.id, file: f } : null;
            })
                .filter((f) => f !== null) || [];
            for (const fa of filesToSend)
                fd.append("attachments", fa.file);
            const result = await verifyGuestOtp(fd).unwrap();
            // Store auth token and user data
            if (result.data?.token && result.data?.user) {
                dispatch(setCredentials({
                    token: result.data.token,
                    user: result.data.user,
                }));
                localStorage.setItem("token", result.data.token);
            }
            toast({
                title: "Success!",
                description: result.data?.isNewUser
                    ? "Your complaint has been verified and your citizen account has been created successfully!"
                    : "Your complaint has been verified and you've been logged in successfully!",
            });
            // Clear form data and navigate to dashboard
            dispatch(clearGuestData());
            navigate("/dashboard");
        }
        catch (error) {
            console.error("OTP verification error:", error);
            toast({
                title: "Verification Failed",
                description: error?.data?.message ||
                    error?.message ||
                    "Invalid verification code. Please try again.",
                variant: "destructive",
            });
        }
    }, [
        otpCode,
        sessionId,
        formData.email,
        verifyGuestOtp,
        dispatch,
        toast,
        navigate,
    ]);
    // Legacy handleSubmit for backward compatibility (now delegates to appropriate handler)
    const handleSubmit = useCallback(() => {
        if (currentStep === 5) {
            if (submissionMode === "citizen") {
                return handleSendOtp();
            }
            else if (!sessionId) {
                return handleSendOtp();
            }
            else {
                return handleVerifyAndSubmit();
            }
        }
        return handleSendOtp();
    }, [
        currentStep,
        submissionMode,
        sessionId,
        handleSendOtp,
        handleVerifyAndSubmit,
    ]);
    // Calculate progress
    const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
    // Get available sub-zones based on selected ward
    const selectedWard = wards.find((ward) => ward.id === formData.wardId);
    const availableSubZones = selectedWard?.subZones || [];
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Submit a Complaint" }), _jsx("p", { className: "text-gray-600", children: submissionMode === "citizen"
                                ? "Report civic issues using your citizen account"
                                : "Report civic issues and get them resolved quickly" })] }), submissionMode === "citizen" && user ? (_jsxs(Alert, { className: "border-blue-200 bg-blue-50", children: [_jsx(UserCheck, { className: "h-4 w-4" }), _jsxs(AlertDescription, { className: "text-blue-800", children: [_jsx("strong", { children: "Logged in as:" }), " ", user.fullName, " (", user.email, ")", _jsx("br", {}), "Your personal information is automatically filled. This complaint will be linked to your citizen account."] })] })) : (_jsxs(Alert, { className: "border-green-200 bg-green-50", children: [_jsx(UserPlus, { className: "h-4 w-4" }), _jsxs(AlertDescription, { className: "text-green-800", children: [_jsx("strong", { children: "Guest Submission:" }), " After submitting, you'll receive an email with a verification code. Verifying will automatically create your citizen account for future use."] })] })), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Progress" }), _jsxs("span", { className: "text-sm text-gray-500", children: ["Step ", currentStep, " of ", steps.length] })] }), _jsx(Progress, { value: progress, className: "w-full" }), _jsx("div", { className: "flex justify-between", children: steps.map((step, index) => (_jsxs("button", { onClick: () => handleStepClick(step.id), disabled: step.id > currentStep, className: `flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${step.id === currentStep
                                            ? "bg-blue-100 text-blue-800"
                                            : step.isCompleted
                                                ? "bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
                                                : "text-gray-400 cursor-not-allowed"}`, children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step.id === currentStep
                                                    ? "bg-blue-600 text-white"
                                                    : step.isCompleted
                                                        ? "bg-green-600 text-white"
                                                        : "bg-gray-300 text-gray-600"}`, children: step.isCompleted ? (_jsx(Check, { className: "h-4 w-4" })) : (step.id) }), _jsx("span", { className: "text-xs font-medium", children: step.title })] }, step.id))) })] }) }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [currentStep === 1 && _jsx(User, { className: "h-5 w-5" }), currentStep === 2 && _jsx(MapPin, { className: "h-5 w-5" }), currentStep === 3 && _jsx(Camera, { className: "h-5 w-5" }), currentStep === 4 && _jsx(CheckCircle, { className: "h-5 w-5" }), currentStep === 5 &&
                                            (submissionMode === "citizen" ? (_jsx(Shield, { className: "h-5 w-5" })) : (_jsx(Mail, { className: "h-5 w-5" }))), steps[currentStep - 1]?.title] }), _jsxs(CardDescription, { children: [currentStep === 1 &&
                                            "Provide your details and describe the issue", currentStep === 2 && "Specify the location of the problem", currentStep === 3 &&
                                            "Add images to help us understand the issue (optional)", currentStep === 4 && "Review all information before submitting", currentStep === 5 &&
                                            (submissionMode === "citizen"
                                                ? "Submit your complaint to the authorities"
                                                : "Verify your email and submit your complaint")] })] }), _jsxs(CardContent, { className: "space-y-6", children: [currentStep === 1 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Personal Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "fullName", children: ["Full Name ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "fullName", name: "fullName", placeholder: "Enter your full name", value: formData.fullName, onChange: handleInputChange, readOnly: submissionMode === "citizen", className: submissionMode === "citizen"
                                                                        ? "bg-gray-100"
                                                                        : validationErrors.fullName
                                                                            ? "border-red-500 focus:ring-red-500"
                                                                            : "", "aria-describedby": validationErrors.fullName
                                                                        ? "fullName-error"
                                                                        : undefined }), validationErrors.fullName && (_jsx("p", { id: "fullName-error", className: "text-sm text-red-600", role: "alert", children: validationErrors.fullName }))] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "email", children: ["Email Address ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "email", name: "email", type: "email", placeholder: "Enter your email", value: formData.email, onChange: handleInputChange, readOnly: submissionMode === "citizen", className: submissionMode === "citizen"
                                                                        ? "bg-gray-100"
                                                                        : validationErrors.email
                                                                            ? "border-red-500 focus:ring-red-500"
                                                                            : "", "aria-describedby": validationErrors.email ? "email-error" : undefined }), validationErrors.email && (_jsx("p", { id: "email-error", className: "text-sm text-red-600", role: "alert", children: validationErrors.email }))] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "phoneNumber", children: ["Phone Number ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "phoneNumber", name: "phoneNumber", type: "tel", placeholder: "Enter your phone number", value: formData.phoneNumber, onChange: handleInputChange, readOnly: submissionMode === "citizen", className: submissionMode === "citizen"
                                                                ? "bg-gray-100"
                                                                : validationErrors.phoneNumber
                                                                    ? "border-red-500 focus:ring-red-500"
                                                                    : "", "aria-describedby": validationErrors.phoneNumber
                                                                ? "phoneNumber-error"
                                                                : undefined }), validationErrors.phoneNumber && (_jsx("p", { id: "phoneNumber-error", className: "text-sm text-red-600", role: "alert", children: validationErrors.phoneNumber }))] }), submissionMode === "citizen" && (_jsxs("div", { className: "bg-blue-50 p-3 rounded-lg text-sm text-blue-700", children: [_jsx(Info, { className: "h-4 w-4 inline mr-2" }), "These details are from your citizen account. To update them, visit your profile settings."] }))] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Complaint Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { children: ["Complaint Type ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs(Select, { value: formData.type, onValueChange: (value) => handleSelectChange("type", value), "aria-describedby": validationErrors.type ? "type-error" : undefined, children: [_jsx(SelectTrigger, { className: validationErrors.type
                                                                                ? "border-red-500 focus:ring-red-500"
                                                                                : "", children: _jsx(SelectValue, { placeholder: "Select complaint type" }) }), _jsx(SelectContent, { children: COMPLAINT_TYPES.map((type) => (_jsx(SelectItem, { value: type.value, children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium", children: type.label }), _jsx("span", { className: "text-xs text-gray-500", children: type.description })] }) }, type.value))) })] }), validationErrors.type && (_jsx("p", { id: "type-error", className: "text-sm text-red-600", role: "alert", children: validationErrors.type }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Priority" }), _jsxs(Select, { value: formData.priority, onValueChange: (value) => handleSelectChange("priority", value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: PRIORITIES.map((priority) => (_jsx(SelectItem, { value: priority.value, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${priority.color}` }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium", children: priority.label }), _jsx("span", { className: "text-xs text-gray-500", children: priority.description })] })] }) }, priority.value))) })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "description", children: ["Description ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Textarea, { id: "description", name: "description", placeholder: "Describe the issue in detail...", value: formData.description, onChange: handleInputChange, rows: 4, "aria-describedby": validationErrors.description
                                                                ? "description-error"
                                                                : undefined, className: validationErrors.description
                                                                ? "border-red-500 focus:ring-red-500"
                                                                : "" }), validationErrors.description && (_jsx("p", { id: "description-error", className: "text-sm text-red-600", role: "alert", children: validationErrors.description }))] })] })] })), currentStep === 2 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Location Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { children: ["Ward ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs(Select, { value: formData.wardId, onValueChange: (value) => handleSelectChange("wardId", value), children: [_jsx(SelectTrigger, { className: validationErrors.wardId
                                                                                ? "border-red-500 focus:ring-red-500"
                                                                                : "", children: _jsx(SelectValue, { placeholder: "Select ward" }) }), _jsx(SelectContent, { children: wardsLoading ? (_jsx(SelectItem, { value: "loading", disabled: true, children: "Loading wards..." })) : wardsError ? (_jsx(SelectItem, { value: "error", disabled: true, children: "Error loading wards" })) : (wards.map((ward) => (_jsx(SelectItem, { value: ward.id, children: ward.name }, ward.id)))) })] }), validationErrors.wardId && (_jsx("p", { className: "text-sm text-red-600", role: "alert", children: validationErrors.wardId }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Sub-Zone (Optional)" }), _jsxs(Select, { value: formData.subZoneId, onValueChange: (value) => handleSelectChange("subZoneId", value), disabled: !formData.wardId, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select sub-zone" }) }), _jsx(SelectContent, { children: availableSubZones.length === 0 ? (_jsx(SelectItem, { value: "no-subzones", disabled: true, children: "No sub-zones available" })) : (availableSubZones.map((subZone) => (_jsx(SelectItem, { value: subZone.id, children: subZone.name }, subZone.id)))) })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "area", children: ["Area/Locality ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "area", name: "area", placeholder: "Enter specific area or locality", value: formData.area, onChange: handleInputChange, className: validationErrors.area
                                                                ? "border-red-500 focus:ring-red-500"
                                                                : "" }), validationErrors.area && (_jsx("p", { className: "text-sm text-red-600", role: "alert", children: validationErrors.area }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "landmark", children: ["Landmark ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Input, { id: "landmark", name: "landmark", placeholder: "Nearby landmark", value: formData.landmark, onChange: handleInputChange, className: `flex-1 ${validationErrors.landmark ? "border-red-500 focus:ring-red-500" : ""}` }), _jsx(Button, { type: "button", variant: "outline", size: "icon", onClick: () => setIsMapDialogOpen(true), title: "Select location on map", children: _jsx(MapPin, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "address", children: ["Full Address ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "address", name: "address", placeholder: "Complete address", value: formData.address, onChange: handleInputChange, className: validationErrors.address
                                                                        ? "border-red-500 focus:ring-red-500"
                                                                        : "" }), validationErrors.address && (_jsx("p", { className: "text-sm text-red-600", role: "alert", children: validationErrors.address }))] })] }), currentLocation && (_jsx("div", { className: "bg-green-50 p-4 rounded-lg border border-green-200", children: _jsxs("div", { className: "flex items-center gap-2 text-green-700", children: [_jsx(MapIcon, { className: "h-4 w-4" }), _jsxs("span", { className: "text-sm font-medium", children: ["Location detected: ", currentLocation.lat.toFixed(6), ",", " ", currentLocation.lng.toFixed(6)] })] }) }))] }), validationErrors.coordinates && (_jsx("p", { className: "text-sm text-red-600", role: "alert", children: validationErrors.coordinates }))] })), currentStep === 3 && (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Upload Images (Optional)" }), _jsx("p", { className: "text-sm text-gray-600", children: "Upload images to help illustrate the issue. Maximum 5 files, 10MB each." }), _jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "file", multiple: true, accept: "image/*", onChange: (e) => handleFileUpload(e.target.files), className: "hidden", id: "file-upload" }), _jsx(Label, { htmlFor: "file-upload", className: "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100", children: _jsxs("div", { className: "flex flex-col items-center justify-center pt-5 pb-6", children: [_jsx(Upload, { className: "w-8 h-8 mb-2 text-gray-500" }), _jsxs("p", { className: "mb-2 text-sm text-gray-500", children: [_jsx("span", { className: "font-semibold", children: "Click to upload" }), " ", "or drag and drop"] }), _jsx("p", { className: "text-xs text-gray-500", children: "PNG, JPG or JPEG (MAX. 10MB each)" })] }) }), formData.attachments &&
                                                        formData.attachments.length > 0 && (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: formData.attachments.map((attachment) => (_jsxs("div", { className: "relative group border rounded-lg overflow-hidden", children: [_jsx("img", { src: attachment.preview, alt: "Preview", className: "w-full h-24 object-cover" }), _jsx("div", { className: "absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center", children: _jsxs("div", { className: "opacity-0 group-hover:opacity-100 flex gap-2", children: [_jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: () => handlePreviewImage(attachment.preview), children: _jsx(Eye, { className: "h-4 w-4" }) }), _jsx(Button, { type: "button", variant: "destructive", size: "sm", onClick: () => handleRemoveAttachment(attachment.id), children: _jsx(X, { className: "h-4 w-4" }) })] }) })] }, attachment.id))) }))] })] }) })), currentStep === 4 && (_jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Review Your Complaint" }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Personal Information" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Name:" }), " ", formData.fullName] }), _jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " ", formData.email] }), _jsxs("p", { children: [_jsx("strong", { children: "Phone:" }), " ", formData.phoneNumber] }), submissionMode === "citizen" && user && (_jsxs("p", { children: [_jsx("strong", { children: "Citizen ID:" }), " ", user.id.slice(-8).toUpperCase()] }))] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Complaint Details" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Type:" }), " ", COMPLAINT_TYPES.find((type) => type.value === formData.type)?.label] }), _jsxs("p", { children: [_jsx("strong", { children: "Priority:" }), " ", _jsx(Badge, { className: PRIORITIES.find((p) => p.value === formData.priority)?.color, children: PRIORITIES.find((p) => p.value === formData.priority)?.label })] }), _jsxs("p", { children: [_jsx("strong", { children: "Description:" }), " ", formData.description] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Location" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Ward:" }), " ", selectedWard?.name || formData.wardId] }), _jsxs("p", { children: [_jsx("strong", { children: "Sub-Zone:" }), " ", availableSubZones.find((sz) => sz.id === formData.subZoneId)?.name ||
                                                                            formData.subZoneId ||
                                                                            "Not specified"] }), _jsxs("p", { children: [_jsx("strong", { children: "Area:" }), " ", formData.area] }), formData.landmark && (_jsxs("p", { children: [_jsx("strong", { children: "Landmark:" }), " ", formData.landmark] })), formData.address && (_jsxs("p", { children: [_jsx("strong", { children: "Address:" }), " ", formData.address] }))] })] }), formData.attachments && formData.attachments.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Attachments" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-3 gap-2", children: formData.attachments.map((attachment) => (_jsx("img", { src: attachment.preview, alt: "Attachment", className: "w-full h-20 object-cover rounded border cursor-pointer", onClick: () => handlePreviewImage(attachment.preview) }, attachment.id))) }) })] })), _jsxs(Alert, { className: submissionMode === "citizen"
                                                        ? "border-blue-200 bg-blue-50"
                                                        : "border-green-200 bg-green-50", children: [_jsx(CheckCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { className: submissionMode === "citizen"
                                                                ? "text-blue-800"
                                                                : "text-green-800", children: submissionMode === "citizen" ? (_jsxs(_Fragment, { children: [_jsx("strong", { children: "Citizen Submission:" }), " Your complaint will be immediately registered and linked to your account. You'll receive email notifications and can track progress from your dashboard."] })) : (_jsxs(_Fragment, { children: [_jsx("strong", { children: "Guest Submission:" }), " After submitting, you'll receive a verification email. Verifying will create your citizen account and activate your complaint tracking."] })) })] })] })] })), currentStep === 5 && (_jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Verify and Submit" }), submissionMode === "citizen" ? (
                                        // Citizen users: Direct submission without OTP
                                        _jsxs("div", { className: "space-y-4", children: [_jsxs(Alert, { className: "border-blue-200 bg-blue-50", children: [_jsx(Shield, { className: "h-4 w-4" }), _jsxs(AlertDescription, { className: "text-blue-800", children: [_jsx("strong", { children: "Citizen Account Detected:" }), " As a verified citizen, your complaint will be submitted immediately without requiring additional verification."] })] }), _jsxs("div", { className: "text-center py-8", children: [_jsx(CheckCircle, { className: "mx-auto h-16 w-16 text-green-500 mb-4" }), _jsx("h4", { className: "text-lg font-semibold mb-2", children: "Ready to Submit" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Your complaint is ready to be submitted to the relevant authorities." })] })] })) : (
                                        // Guest users: OTP verification required
                                        _jsx("div", { className: "space-y-4", children: !sessionId ? (
                                            // Step 5a: Send OTP
                                            _jsxs("div", { className: "space-y-4", children: [_jsxs(Alert, { className: "border-green-200 bg-green-50", children: [_jsx(Mail, { className: "h-4 w-4" }), _jsxs(AlertDescription, { className: "text-green-800", children: [_jsx("strong", { children: "Email Verification Required:" }), " We'll send a verification code to", " ", _jsx("strong", { children: formData.email }), " to secure your complaint submission and create your citizen account."] })] }), _jsxs("div", { className: "text-center py-8", children: [_jsx(Mail, { className: "mx-auto h-16 w-16 text-blue-500 mb-4" }), _jsx("h4", { className: "text-lg font-semibold mb-2", children: "Send Verification Code" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Click below to send a verification code to your email address." })] })] })) : (
                                            // Step 5b: Enter OTP
                                            _jsxs("div", { className: "space-y-4", children: [_jsxs(Alert, { className: "border-orange-200 bg-orange-50", children: [_jsx(Clock, { className: "h-4 w-4" }), _jsxs(AlertDescription, { className: "text-orange-800", children: [_jsx("strong", { children: "Verification Code Sent:" }), " Please check your email and enter the 6-digit verification code below."] })] }), _jsxs("div", { className: "max-w-md mx-auto space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "otpCode", className: "text-center block", children: "Enter Verification Code" }), _jsx(Input, { id: "otpCode", name: "otpCode", type: "text", placeholder: "Enter 6-digit code", maxLength: 6, className: "text-center text-xl font-mono tracking-widest", value: otpCode, onChange: handleOtpChange, autoComplete: "one-time-code" })] }), _jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsxs("span", { className: "text-gray-500", children: ["Code sent to: ", formData.email] }), _jsx(Button, { type: "button", variant: "link", size: "sm", onClick: handleResendOtp, disabled: isSubmitting, className: "text-blue-600 p-0", children: "Resend Code" })] }), validationErrors.otpCode && (_jsx("p", { className: "text-sm text-red-600 text-center", role: "alert", children: validationErrors.otpCode }))] })] })) }))] })), _jsxs("div", { className: "flex justify-between pt-6", children: [_jsxs(Button, { type: "button", variant: "outline", onClick: handlePrev, disabled: currentStep === 1, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Previous"] }), currentStep < steps.length ? (_jsxs(Button, { type: "button", onClick: handleNext, disabled: !canProceed, children: ["Next", _jsx(ArrowRight, { className: "h-4 w-4 ml-2" })] })) : (
                                        // Step 5 submission buttons
                                        _jsx("div", { className: "flex gap-2", children: submissionMode === "citizen" ? (
                                            // Citizen: Direct submit
                                            _jsx(Button, { type: "button", onClick: handleSendOtp, disabled: isSubmitting, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Submitting..."] })) : (_jsxs(_Fragment, { children: ["Submit Complaint", _jsx(CheckCircle, { className: "h-4 w-4 ml-2" })] })) })) : !sessionId ? (
                                            // Guest: Send OTP first
                                            _jsx(Button, { type: "button", onClick: handleSendOtp, disabled: isSendingOtp, children: isSendingOtp ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Sending Code..."] })) : (_jsxs(_Fragment, { children: ["Send Verification Code", _jsx(Mail, { className: "h-4 w-4 ml-2" })] })) })) : (
                                            // Guest: Verify OTP via popup
                                            _jsxs(Button, { type: "button", onClick: () => setShowOtpDialog(true), children: ["Verify & Submit", _jsx(CheckCircle, { className: "h-4 w-4 ml-2" })] })) }))] })] })] }), showOtpDialog && (_jsx(OtpDialog, { open: showOtpDialog, onOpenChange: setShowOtpDialog, context: "guestComplaint", email: formData.email, onVerified: async ({ otpCode }) => {
                        if (!otpCode)
                            return;
                        try {
                            setIsVerifyingOtp(true);
                            const fd = new FormData();
                            fd.append("email", formData.email);
                            fd.append("otpCode", otpCode);
                            fd.append("fullName", formData.fullName);
                            fd.append("phoneNumber", formData.phoneNumber);
                            fd.append("type", formData.type);
                            fd.append("description", formData.description);
                            fd.append("priority", formData.priority || "MEDIUM");
                            fd.append("wardId", formData.wardId);
                            if (formData.subZoneId)
                                fd.append("subZoneId", formData.subZoneId);
                            fd.append("area", formData.area);
                            if (formData.landmark)
                                fd.append("landmark", formData.landmark);
                            if (formData.address)
                                fd.append("address", formData.address);
                            if (formData.coordinates)
                                fd.append("coordinates", JSON.stringify(formData.coordinates));
                            const filesToSend = formData.attachments
                                ?.map((a) => {
                                const f = fileMap.get(a.id);
                                return f ? { id: a.id, file: f } : null;
                            })
                                .filter((f) => f !== null) || [];
                            for (const fa of filesToSend)
                                fd.append("attachments", fa.file);
                            const result = await verifyGuestOtp(fd).unwrap();
                            if (result.data?.token && result.data?.user) {
                                dispatch(setCredentials({
                                    token: result.data.token,
                                    user: result.data.user,
                                }));
                                localStorage.setItem("token", result.data.token);
                            }
                            toast({
                                title: "Success!",
                                description: result.data?.isNewUser
                                    ? "Your complaint has been verified and your citizen account has been created successfully!"
                                    : "Your complaint has been verified and you've been logged in successfully!",
                            });
                            dispatch(clearGuestData());
                            setShowOtpDialog(false);
                            navigate("/dashboard");
                        }
                        catch (error) {
                            toast({
                                title: "Verification Failed",
                                description: error?.data?.message ||
                                    error?.message ||
                                    "Invalid verification code. Please try again.",
                                variant: "destructive",
                            });
                        }
                        finally {
                            setIsVerifyingOtp(false);
                        }
                    }, onResend: async () => {
                        try {
                            await resendGuestOtp({ email: formData.email }).unwrap();
                            toast({
                                title: "Verification Code Resent",
                                description: "A new verification code has been sent to your email.",
                            });
                        }
                        catch (error) {
                            toast({
                                title: "Failed to Resend",
                                description: error?.message || "Failed to resend verification code.",
                                variant: "destructive",
                            });
                        }
                    }, isVerifying: isVerifyingOtp })), imagePreview.show && (_jsx(Dialog, { open: imagePreview.show, onOpenChange: (open) => dispatch(setImagePreview({ show: open, url: imagePreview.url })), children: _jsxs(DialogContent, { className: "max-w-3xl", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Image Preview" }) }), _jsx("div", { className: "flex justify-center", children: _jsx("img", { src: imagePreview.url, alt: "Preview", className: "max-w-full max-h-96 object-contain" }) })] }) })), _jsx(SimpleLocationMapDialog, { isOpen: isMapDialogOpen, onClose: () => setIsMapDialogOpen(false), onLocationSelect: handleLocationSelect, initialLocation: formData.coordinates
                        ? {
                            latitude: formData.coordinates.latitude,
                            longitude: formData.coordinates.longitude,
                            address: formData.address,
                            area: formData.area,
                            landmark: formData.landmark,
                        }
                        : undefined })] }) }));
};
export default UnifiedComplaintForm;
