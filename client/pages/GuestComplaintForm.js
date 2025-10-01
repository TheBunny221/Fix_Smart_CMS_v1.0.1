import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { selectAuth, getDashboardRouteForRole, } from "../store/slices/authSlice";
import { selectCurrentStep, selectSteps, selectFormData, selectValidationErrors, selectCanProceed, selectIsSubmitting, selectSubmissionStep, selectGuestError, selectComplaintId, selectTrackingNumber, selectNewUserRegistered, selectImagePreview, setCurrentStep, nextStep, prevStep, updateFormData, addAttachment, removeAttachment, validateCurrentStep, setImagePreview, clearGuestData, } from "../store/slices/guestSlice";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useOtpFlow } from "../contexts/OtpContext";
import { useGetWardsQuery, useSubmitGuestComplaintMutation, } from "../store/api/guestApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "../components/ui/dialog";
import { FileText, CheckCircle, User, MapPin, ArrowLeft, ArrowRight, Loader2, UserPlus, Shield, Camera, Upload, X, Eye, AlertCircle, MapIcon, Check, } from "lucide-react";
import { useToast } from "../hooks/use-toast";
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
const GuestComplaintForm = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const { openOtpFlow } = useOtpFlow();
    const { isAuthenticated, user } = useAppSelector(selectAuth);
    const { appName } = useSystemConfig();
    // Fetch wards from API
    const { data: wardsResponse, isLoading: wardsLoading, error: wardsError, } = useGetWardsQuery();
    const wards = Array.isArray(wardsResponse?.data) ? wardsResponse.data : [];
    // RTK Query mutation for form submission
    const [submitComplaintMutation] = useSubmitGuestComplaintMutation();
    // Guest form state
    const currentStep = useAppSelector(selectCurrentStep);
    const steps = useAppSelector(selectSteps);
    const formData = useAppSelector(selectFormData);
    const validationErrors = useAppSelector(selectValidationErrors);
    const canProceed = useAppSelector(selectCanProceed);
    const isSubmitting = useAppSelector(selectIsSubmitting);
    const submissionStep = useAppSelector(selectSubmissionStep);
    const error = useAppSelector(selectGuestError);
    const complaintId = useAppSelector(selectComplaintId);
    const trackingNumber = useAppSelector(selectTrackingNumber);
    const newUserRegistered = useAppSelector(selectNewUserRegistered);
    const imagePreview = useAppSelector(selectImagePreview);
    // Local state
    const [currentLocation, setCurrentLocation] = useState(null);
    const [fileMap, setFileMap] = useState(new Map());
    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (isAuthenticated && user) {
            const dashboardRoute = getDashboardRouteForRole(user.role);
            navigate(dashboardRoute);
        }
    }, [isAuthenticated, user, navigate]);
    // Get current location
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setCurrentLocation(coords);
                dispatch(updateFormData({
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
        dispatch(updateFormData({ [name]: value }));
    }, [dispatch]);
    // Handle select changes
    const handleSelectChange = useCallback((name, value) => {
        dispatch(updateFormData({ [name]: value }));
    }, [dispatch]);
    // Handle file upload
    const handleFileUpload = useCallback((files) => {
        if (!files)
            return;
        Array.from(files).forEach((file) => {
            // Validate file
            if (file.size > 10 * 1024 * 1024) {
                // 10MB
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
        // Clean up file map
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
    // Handle form submission
    const handleSubmit = useCallback(async () => {
        dispatch(validateCurrentStep());
        // Final validation
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
            // Prepare files array for submission
            const files = formData.attachments
                ?.map((attachment) => {
                const file = fileMap.get(attachment.id);
                return file ? { id: attachment.id, file } : null;
            })
                .filter((f) => f !== null) || [];
            // Create FormData for file uploads
            const submissionData = new FormData();
            // Add text data
            submissionData.append("fullName", formData.fullName);
            submissionData.append("email", formData.email);
            submissionData.append("phoneNumber", formData.phoneNumber);
            submissionData.append("type", formData.type);
            submissionData.append("description", formData.description);
            submissionData.append("priority", formData.priority || "MEDIUM");
            submissionData.append("wardId", formData.wardId);
            if (formData.subZoneId)
                submissionData.append("subZoneId", formData.subZoneId);
            submissionData.append("area", formData.area);
            if (formData.landmark)
                submissionData.append("landmark", formData.landmark);
            if (formData.address)
                submissionData.append("address", formData.address);
            // Add coordinates
            if (formData.coordinates) {
                submissionData.append("coordinates", JSON.stringify(formData.coordinates));
            }
            // Add attachments
            if (files && files.length > 0) {
                files.forEach((fileAttachment) => {
                    submissionData.append("attachments", fileAttachment.file);
                });
            }
            const response = await submitComplaintMutation(submissionData).unwrap();
            const result = response.data;
            if (result.complaintId && result.trackingNumber) {
                // Open unified OTP dialog
                openOtpFlow({
                    context: "guestComplaint",
                    email: formData.email,
                    complaintId: result.complaintId,
                    trackingNumber: result.trackingNumber,
                    title: "Verify Your Complaint",
                    description: "Enter the verification code sent to your email to complete your complaint submission",
                    onSuccess: () => {
                        toast({
                            title: "Success!",
                            description: "Your complaint has been verified successfully.",
                        });
                        navigate("/dashboard");
                    },
                });
                toast({
                    title: "Complaint Submitted",
                    description: `Tracking number: ${result.trackingNumber}. Please check your email for the verification code.`,
                });
            }
        }
        catch (error) {
            console.error("Guest complaint submission error:", error);
            toast({
                title: "Submission Failed",
                description: getApiErrorMessage(error),
                variant: "destructive",
            });
        }
    }, [dispatch, formData, validationErrors, openOtpFlow, toast, navigate]);
    // Calculate progress
    const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
    // Get available sub-zones based on selected ward
    const selectedWard = wards.find((ward) => ward.id === formData.wardId);
    const availableSubZones = selectedWard?.subZones || [];
    // Success page
    if (submissionStep === "success") {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4", children: _jsx("div", { className: "w-full max-w-md space-y-6", children: _jsx(Card, { "data-testid": "success-page", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto", children: _jsx(UserPlus, { className: "h-8 w-8 text-green-600" }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold text-green-800", children: ["Welcome to ", appName, "!"] }), _jsx("p", { className: "text-green-700 mt-2", children: "Your complaint has been verified and you've been registered as a citizen." })] }), _jsxs("div", { className: "bg-white p-4 rounded-lg border border-green-200", children: [_jsxs("p", { className: "text-sm text-gray-700", children: [_jsx("strong", { children: "Tracking Number:" }), " ", trackingNumber] }), _jsx("p", { className: "text-sm text-gray-700 mt-1", children: "You can now track your complaint progress from your dashboard." })] }), _jsxs(Alert, { className: "border-amber-200 bg-amber-50", children: [_jsx(Shield, { className: "h-4 w-4" }), _jsxs(AlertDescription, { className: "text-amber-700", children: [_jsx("strong", { children: "Security Tip:" }), " Set a password in your profile settings for easier future logins."] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Button, { onClick: () => navigate("/dashboard"), className: "w-full", children: "Go to Dashboard" }), _jsx(Button, { variant: "outline", onClick: () => dispatch(clearGuestData()), className: "w-full", children: "Submit Another Complaint" })] })] }) }) }) }) }));
    }
    // Multi-step complaint form
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Submit a Complaint" }), _jsx("p", { className: "text-gray-600", children: "Report civic issues and get them resolved quickly" })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Progress" }), _jsxs("span", { className: "text-sm text-gray-500", children: ["Step ", currentStep, " of ", steps.length] })] }), _jsx(Progress, { value: progress, className: "w-full" }), _jsx("div", { className: "flex justify-between", children: steps.map((step, index) => (_jsxs("button", { onClick: () => handleStepClick(step.id), disabled: step.id > currentStep, className: `flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${step.id === currentStep
                                            ? "bg-blue-100 text-blue-800"
                                            : step.isCompleted
                                                ? "bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
                                                : "text-gray-400 cursor-not-allowed"}`, children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step.id === currentStep
                                                    ? "bg-blue-600 text-white"
                                                    : step.isCompleted
                                                        ? "bg-green-600 text-white"
                                                        : "bg-gray-300 text-gray-600"}`, children: step.isCompleted ? (_jsx(Check, { className: "h-4 w-4" })) : (step.id) }), _jsx("span", { className: "text-xs font-medium", children: step.title })] }, step.id))) })] }) }) }), error && (_jsxs(Alert, { variant: "destructive", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: error })] })), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [currentStep === 1 && _jsx(User, { className: "h-5 w-5" }), currentStep === 2 && _jsx(MapPin, { className: "h-5 w-5" }), currentStep === 3 && _jsx(Camera, { className: "h-5 w-5" }), currentStep === 4 && _jsx(FileText, { className: "h-5 w-5" }), currentStep === 5 && _jsx(CheckCircle, { className: "h-5 w-5" }), steps[currentStep - 1]?.title] }), _jsxs(CardDescription, { children: [currentStep === 1 &&
                                            "Provide your details and describe the issue", currentStep === 2 && "Specify the location of the problem", currentStep === 3 &&
                                            "Add images to help us understand the issue (optional)", currentStep === 4 && "Review all information before submitting", currentStep === 5 && "Submit your complaint for verification"] })] }), _jsxs(CardContent, { className: "space-y-6", children: [currentStep === 1 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Personal Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "fullName", children: ["Full Name ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "fullName", name: "fullName", placeholder: "Enter your full name", value: formData.fullName, onChange: handleInputChange, "aria-describedby": validationErrors.fullName
                                                                        ? "fullName-error"
                                                                        : undefined, className: validationErrors.fullName
                                                                        ? "border-red-500 focus:ring-red-500"
                                                                        : "" }), validationErrors.fullName && (_jsx("p", { id: "fullName-error", className: "text-sm text-red-600", role: "alert", children: validationErrors.fullName }))] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "email", children: ["Email Address ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "email", name: "email", type: "email", placeholder: "Enter your email", value: formData.email, onChange: handleInputChange, "aria-describedby": validationErrors.email ? "email-error" : undefined, className: validationErrors.email
                                                                        ? "border-red-500 focus:ring-red-500"
                                                                        : "" }), validationErrors.email && (_jsx("p", { id: "email-error", className: "text-sm text-red-600", role: "alert", children: validationErrors.email }))] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "phoneNumber", children: ["Phone Number ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "phoneNumber", name: "phoneNumber", type: "tel", placeholder: "Enter your phone number", value: formData.phoneNumber, onChange: handleInputChange, "aria-describedby": validationErrors.phoneNumber
                                                                ? "phoneNumber-error"
                                                                : undefined, className: validationErrors.phoneNumber
                                                                ? "border-red-500 focus:ring-red-500"
                                                                : "" }), validationErrors.phoneNumber && (_jsx("p", { id: "phoneNumber-error", className: "text-sm text-red-600", role: "alert", children: validationErrors.phoneNumber }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Complaint Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { children: ["Complaint Type ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs(Select, { value: formData.type, onValueChange: (value) => handleSelectChange("type", value), "aria-describedby": validationErrors.type ? "type-error" : undefined, children: [_jsx(SelectTrigger, { className: validationErrors.type
                                                                                ? "border-red-500 focus:ring-red-500"
                                                                                : "", children: _jsx(SelectValue, { placeholder: "Select complaint type" }) }), _jsx(SelectContent, { children: COMPLAINT_TYPES.map((type) => (_jsx(SelectItem, { value: type.value, children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium", children: type.label }), _jsx("span", { className: "text-xs text-gray-500", children: type.description })] }) }, type.value))) })] }), validationErrors.type && (_jsx("p", { id: "type-error", className: "text-sm text-red-600", role: "alert", children: validationErrors.type }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Priority" }), _jsxs(Select, { value: formData.priority, onValueChange: (value) => handleSelectChange("priority", value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: PRIORITIES.map((priority) => (_jsx(SelectItem, { value: priority.value, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${priority.color}` }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium", children: priority.label }), _jsx("span", { className: "text-xs text-gray-500", children: priority.description })] })] }) }, priority.value))) })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "description", children: ["Description ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Textarea, { id: "description", name: "description", placeholder: "Describe the issue in detail...", value: formData.description, onChange: handleInputChange, rows: 4, "aria-describedby": validationErrors.description
                                                                ? "description-error"
                                                                : undefined, className: validationErrors.description
                                                                ? "border-red-500 focus:ring-red-500"
                                                                : "" }), validationErrors.description && (_jsx("p", { id: "description-error", className: "text-sm text-red-600", role: "alert", children: validationErrors.description }))] })] })] })), currentStep === 2 && (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Location Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { children: ["Ward ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs(Select, { value: formData.wardId, onValueChange: (value) => handleSelectChange("wardId", value), children: [_jsx(SelectTrigger, { className: validationErrors.wardId
                                                                            ? "border-red-500 focus:ring-red-500"
                                                                            : "", children: _jsx(SelectValue, { placeholder: "Select ward" }) }), _jsx(SelectContent, { children: wardsLoading ? (_jsx(SelectItem, { value: "loading", disabled: true, children: "Loading wards..." })) : wardsError ? (_jsx(SelectItem, { value: "error", disabled: true, children: "Error loading wards" })) : (wards.map((ward) => (_jsx(SelectItem, { value: ward.id, children: ward.name }, ward.id)))) })] }), validationErrors.wardId && (_jsx("p", { className: "text-sm text-red-600", role: "alert", children: validationErrors.wardId }))] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { children: ["Sub-Zone ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs(Select, { value: formData.subZoneId, onValueChange: (value) => handleSelectChange("subZoneId", value), disabled: !formData.wardId, children: [_jsx(SelectTrigger, { className: validationErrors.subZoneId
                                                                            ? "border-red-500 focus:ring-red-500"
                                                                            : "", children: _jsx(SelectValue, { placeholder: "Select sub-zone" }) }), _jsx(SelectContent, { children: availableSubZones.length === 0 ? (_jsx(SelectItem, { value: "no-subzones", disabled: true, children: "No sub-zones available" })) : (availableSubZones.map((subZone) => (_jsx(SelectItem, { value: subZone.id, children: subZone.name }, subZone.id)))) })] }), validationErrors.subZoneId && (_jsx("p", { className: "text-sm text-red-600", role: "alert", children: validationErrors.subZoneId }))] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "area", children: ["Area/Locality ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "area", name: "area", placeholder: "Enter specific area or locality", value: formData.area, onChange: handleInputChange, className: validationErrors.area
                                                            ? "border-red-500 focus:ring-red-500"
                                                            : "" }), validationErrors.area && (_jsx("p", { className: "text-sm text-red-600", role: "alert", children: validationErrors.area }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "landmark", children: "Landmark (Optional)" }), _jsx(Input, { id: "landmark", name: "landmark", placeholder: "Nearby landmark", value: formData.landmark, onChange: handleInputChange })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "address", children: "Full Address (Optional)" }), _jsx(Input, { id: "address", name: "address", placeholder: "Complete address", value: formData.address, onChange: handleInputChange })] })] }), currentLocation && (_jsx("div", { className: "bg-green-50 p-4 rounded-lg border border-green-200", children: _jsxs("div", { className: "flex items-center gap-2 text-green-700", children: [_jsx(MapIcon, { className: "h-4 w-4" }), _jsxs("span", { className: "text-sm font-medium", children: ["Location detected: ", currentLocation.lat.toFixed(6), ",", " ", currentLocation.lng.toFixed(6)] })] }) }))] }) })), currentStep === 3 && (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Upload Images (Optional)" }), _jsx("p", { className: "text-sm text-gray-600", children: "Upload images to help illustrate the issue. Maximum 5 files, 10MB each." }), _jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "file", multiple: true, accept: "image/*", onChange: (e) => handleFileUpload(e.target.files), className: "hidden", id: "file-upload" }), _jsx(Label, { htmlFor: "file-upload", className: "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100", children: _jsxs("div", { className: "flex flex-col items-center justify-center pt-5 pb-6", children: [_jsx(Upload, { className: "w-8 h-8 mb-2 text-gray-500" }), _jsxs("p", { className: "mb-2 text-sm text-gray-500", children: [_jsx("span", { className: "font-semibold", children: "Click to upload" }), " ", "or drag and drop"] }), _jsx("p", { className: "text-xs text-gray-500", children: "PNG, JPG or JPEG (MAX. 10MB each)" })] }) }), formData.attachments &&
                                                        formData.attachments.length > 0 && (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: formData.attachments.map((attachment) => (_jsxs("div", { className: "relative group border rounded-lg overflow-hidden", children: [_jsx("img", { src: attachment.preview, alt: "Preview", className: "w-full h-24 object-cover" }), _jsx("div", { className: "absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center", children: _jsxs("div", { className: "opacity-0 group-hover:opacity-100 flex gap-2", children: [_jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: () => handlePreviewImage(attachment.preview), children: _jsx(Eye, { className: "h-4 w-4" }) }), _jsx(Button, { type: "button", variant: "destructive", size: "sm", onClick: () => handleRemoveAttachment(attachment.id), children: _jsx(X, { className: "h-4 w-4" }) })] }) })] }, attachment.id))) }))] })] }) })), currentStep === 4 && (_jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Review Your Complaint" }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Personal Information" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Name:" }), " ", formData.fullName] }), _jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " ", formData.email] }), _jsxs("p", { children: [_jsx("strong", { children: "Phone:" }), " ", formData.phoneNumber] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Complaint Details" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Type:" }), " ", COMPLAINT_TYPES.find((type) => type.value === formData.type)?.label] }), _jsxs("p", { children: [_jsx("strong", { children: "Priority:" }), " ", _jsx(Badge, { className: PRIORITIES.find((p) => p.value === formData.priority)?.color, children: PRIORITIES.find((p) => p.value === formData.priority)?.label })] }), _jsxs("p", { children: [_jsx("strong", { children: "Description:" }), " ", formData.description] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Location" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Ward:" }), " ", selectedWard?.name || formData.wardId] }), _jsxs("p", { children: [_jsx("strong", { children: "Sub-Zone:" }), " ", availableSubZones.find((sz) => sz.id === formData.subZoneId)?.name ||
                                                                            formData.subZoneId ||
                                                                            "Not specified"] }), _jsxs("p", { children: [_jsx("strong", { children: "Area:" }), " ", formData.area] }), formData.landmark && (_jsxs("p", { children: [_jsx("strong", { children: "Landmark:" }), " ", formData.landmark] })), formData.address && (_jsxs("p", { children: [_jsx("strong", { children: "Address:" }), " ", formData.address] }))] })] }), formData.attachments && formData.attachments.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Attachments" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-3 gap-2", children: formData.attachments.map((attachment) => (_jsx("img", { src: attachment.preview, alt: "Attachment", className: "w-full h-20 object-cover rounded border cursor-pointer", onClick: () => handlePreviewImage(attachment.preview) }, attachment.id))) }) })] }))] })] })), _jsxs("div", { className: "flex justify-between pt-6", children: [_jsxs(Button, { type: "button", variant: "outline", onClick: handlePrev, disabled: currentStep === 1, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Previous"] }), currentStep < steps.length ? (_jsxs(Button, { type: "button", onClick: handleNext, disabled: !canProceed, children: ["Next", _jsx(ArrowRight, { className: "h-4 w-4 ml-2" })] })) : (_jsx(Button, { type: "button", onClick: handleSubmit, disabled: isSubmitting || !canProceed, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Submitting..."] })) : (_jsxs(_Fragment, { children: ["Submit Complaint", _jsx(CheckCircle, { className: "h-4 w-4 ml-2" })] })) }))] })] })] }), imagePreview.show && (_jsx(Dialog, { open: imagePreview.show, onOpenChange: (open) => dispatch(setImagePreview({ show: open, url: imagePreview.url })), children: _jsxs(DialogContent, { className: "max-w-3xl", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Image Preview" }) }), _jsx("div", { className: "flex justify-center", children: _jsx("img", { src: imagePreview.url, alt: "Preview", className: "max-w-full max-h-96 object-contain" }) })] }) }))] }) }));
};
export default GuestComplaintForm;
