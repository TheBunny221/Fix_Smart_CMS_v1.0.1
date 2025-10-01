import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import OtpDialog from "./OtpDialog";
import { useSubmitGuestComplaintMutation } from "../store/api/guestApi";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useGetWardsQuery, useVerifyGuestOtpMutation, useLazyGenerateCaptchaQuery, } from "../store/api/guestApi";
import { useResendGuestOtpMutation } from "../store/api/guestApi";
import { setCredentials } from "../store/slices/authSlice";
import { showErrorToast } from "../store/slices/uiSlice";
import { useToast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import SimpleLocationMapDialog from "./SimpleLocationMapDialog";
import { MapPin, Upload, RefreshCw, FileText, Zap, Wrench, Droplets, CheckCircle, AlertCircle, X, Loader2, } from "lucide-react";
import { createComplaint } from "@/store/slices/complaintsSlice";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { prewarmMapAssets } from "../utils/mapTilePrefetch";
import { emailSchema, nameSchema, phoneSchema } from "../lib/validations";
const QuickComplaintForm = ({ onSuccess, onClose, }) => {
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.complaints);
    const { translations } = useAppSelector((state) => state.language);
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const { complaintTypeOptions } = useComplaintTypes();
    const { data: wardsResponse, isLoading: wardsLoading, error: wardsError, } = useGetWardsQuery();
    const wards = Array.isArray(wardsResponse?.data) ? wardsResponse.data : [];
    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        mobile: "",
        email: "",
        problemType: "",
        ward: "",
        subZoneId: "",
        area: "",
        location: "",
        address: "",
        description: "",
        coordinates: null,
    });
    const [files, setFiles] = useState([]);
    const [errors, setErrors] = useState({});
    const [captcha, setCaptcha] = useState("");
    const [captchaId, setCaptchaId] = useState(null);
    const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
    const [submissionMode, setSubmissionMode] = useState(isAuthenticated ? "citizen" : "guest");
    const [otpCode, setOtpCode] = useState("");
    const [complaintId, setComplaintId] = useState(null);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [showOtpDialog, setShowOtpDialog] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
    const { toast } = useToast();
    const { getConfig } = useSystemConfig();
    const [verifyGuestOtp] = useVerifyGuestOtpMutation();
    const [resendGuestOtp] = useResendGuestOtpMutation();
    const [submitGuestComplaintMutation, { isLoading: isSendingOtp }] = useSubmitGuestComplaintMutation();
    const [generateCaptcha, { data: captchaData, isLoading: captchaLoading, error: captchaError },] = useLazyGenerateCaptchaQuery();
    const guestIsSubmitting = useAppSelector((state) => state.guest.isSubmitting);
    // Pre-fill user data if authenticated and set submission mode
    useEffect(() => {
        if (isAuthenticated && user) {
            setSubmissionMode("citizen");
            setFormData((prev) => ({
                ...prev,
                fullName: user.fullName || "",
                mobile: user.phoneNumber || "",
                email: user.email || "",
                ward: user.wardId || "",
                subZoneId: "",
            }));
        }
        else {
            setSubmissionMode("guest");
        }
    }, [isAuthenticated, user]);
    // Generate CAPTCHA on component mount
    useEffect(() => {
        handleRefreshCaptcha();
    }, []);
    // Prewarm map assets (tiles + leaflet) using system-config default center
    useEffect(() => {
        const lat = parseFloat(getConfig("MAP_DEFAULT_LAT", "9.9312")) || 9.9312;
        const lng = parseFloat(getConfig("MAP_DEFAULT_LNG", "76.2673")) || 76.2673;
        prewarmMapAssets(lat, lng, 13);
    }, [getConfig]);
    // Update CAPTCHA ID when new CAPTCHA is generated
    useEffect(() => {
        if (captchaData?.success && captchaData.data) {
            setCaptchaId(captchaData.data.captchaId);
        }
    }, [captchaData]);
    // Handle CAPTCHA refresh
    const handleRefreshCaptcha = useCallback(() => {
        setCaptcha("");
        setCaptchaId(null);
        generateCaptcha();
    }, [generateCaptcha]);
    // Icon mapping for different complaint types
    const getIconForComplaintType = (type) => {
        const iconMap = {
            WATER_SUPPLY: _jsx(Droplets, { className: "h-4 w-4" }),
            ELECTRICITY: _jsx(Zap, { className: "h-4 w-4" }),
            ROAD_REPAIR: _jsx(Wrench, { className: "h-4 w-4" }),
            WASTE_MANAGEMENT: _jsx(FileText, { className: "h-4 w-4" }),
            GARBAGE_COLLECTION: _jsx(FileText, { className: "h-4 w-4" }),
            STREET_LIGHTING: _jsx(Zap, { className: "h-4 w-4" }),
            DRAINAGE: _jsx(Droplets, { className: "h-4 w-4" }),
            SEWERAGE: _jsx(Droplets, { className: "h-4 w-4" }),
            PUBLIC_TOILET: _jsx(CheckCircle, { className: "h-4 w-4" }),
            TREE_CUTTING: _jsx(Wrench, { className: "h-4 w-4" }),
            PUBLIC_HEALTH: _jsx(CheckCircle, { className: "h-4 w-4" }),
            TRAFFIC: _jsx(AlertCircle, { className: "h-4 w-4" }),
            OTHERS: _jsx(FileText, { className: "h-4 w-4" }),
        };
        return iconMap[type] || _jsx(FileText, { className: "h-4 w-4" });
    };
    const problemTypes = complaintTypeOptions.map((type) => ({
        key: type.value,
        label: type.label,
        icon: getIconForComplaintType(type.value),
    }));
    const validateField = (field, value) => {
        try {
            switch (field) {
                case "fullName":
                    nameSchema.parse(value);
                    break;
                case "mobile":
                    phoneSchema.parse(value);
                    break;
                case "email":
                    if (submissionMode === "guest") {
                        emailSchema.parse(value);
                    }
                    else if (value) {
                        emailSchema.parse(value);
                    }
                    break;
                case "area":
                    if (!value || value.trim().length < 3)
                        throw new Error("Area must be at least 3 characters");
                    break;
                case "description":
                    if (!value || value.trim().length < 10)
                        throw new Error("Description must be at least 10 characters");
                    break;
                case "captcha":
                    if (!value)
                        throw new Error("Please complete the CAPTCHA verification");
                    break;
                default:
                    break;
            }
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
        catch (e) {
            const msg = e?.errors?.[0]?.message || e?.message || "Invalid value";
            setErrors((prev) => ({ ...prev, [field]: msg }));
        }
    };
    // Derive sub-zones for the selected ward (from public wards response which includes subZones)
    const selectedWard = wards.find((w) => w.id === formData.ward);
    const subZonesForWard = selectedWard?.subZones || [];
    const handleInputChange = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);
    const handleFileUpload = useCallback((event) => {
        const selectedFiles = Array.from(event.target.files || []);
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "video/mp4",
            "video/webm",
            "video/ogg",
        ];
        const validFiles = [];
        selectedFiles.forEach((file) => {
            if (allowedTypes.includes(file.type)) {
                validFiles.push(file);
            }
            else {
                dispatch(showErrorToast("Invalid File Type", "Only JPG and PNG images are allowed"));
            }
        });
        if (validFiles.length) {
            setFiles((prev) => [...prev, ...validFiles]);
        }
    }, [dispatch]);
    const removeFile = useCallback((index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);
    const handleLocationSelect = useCallback((location) => {
        setFormData((prev) => ({
            ...prev,
            location: location.landmark || location.address || "",
            area: location.area || prev.area,
            address: location.address || prev.address,
            coordinates: {
                latitude: location.latitude,
                longitude: location.longitude,
            },
        }));
    }, []);
    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        if ((submissionMode === "guest" ? guestIsSubmitting : isLoading) ||
            isSubmittingLocal)
            return;
        setIsSubmittingLocal(true);
        if (!captcha || !captchaId) {
            dispatch(showErrorToast(translations?.forms?.invalidCaptcha || "Invalid CAPTCHA", translations?.forms?.enterCaptcha ||
                "Please enter the CAPTCHA code"));
            return;
        }
        if (!formData.fullName ||
            !formData.mobile ||
            !formData.problemType ||
            !formData.ward ||
            !formData.area ||
            !formData.description) {
            dispatch(showErrorToast(translations?.forms?.requiredField || "Required Field", translations?.forms?.requiredField ||
                "Please fill all required fields"));
            return;
        }
        try {
            if (submissionMode === "citizen" && isAuthenticated) {
                // Citizen flow: Submit directly to authenticated API
                const complaintData = {
                    title: `${formData.problemType} complaint`,
                    description: formData.description,
                    type: formData.problemType,
                    priority: "MEDIUM",
                    wardId: formData.ward,
                    subZoneId: formData.subZoneId || undefined,
                    area: formData.area,
                    landmark: formData.location,
                    address: formData.address,
                    coordinates: formData.coordinates,
                    captchaText: captcha,
                    captchaId: captchaId,
                    contactName: user?.fullName || "",
                    contactEmail: formData.email,
                    contactPhone: formData.mobile,
                    isAnonymous: false,
                };
                const result = await dispatch(createComplaint(complaintData)).unwrap();
                console.warn(result);
                toast({
                    title: "Complaint Submitted Successfully!",
                    description: `Your complaint has been registered with ID: ${result.complaintId}. You can track its progress from your dashboard.`,
                });
                // Reset form and call success callback
                resetForm();
                onSuccess?.(result.id);
            }
            else {
                // Guest flow: Send OTP initiation (no attachments here)
                const submissionData = new FormData();
                submissionData.append("fullName", formData.fullName);
                submissionData.append("email", formData.email);
                submissionData.append("phoneNumber", formData.mobile);
                if (captchaId)
                    submissionData.append("captchaId", String(captchaId));
                if (captcha)
                    submissionData.append("captchaText", captcha);
                const response = await submitGuestComplaintMutation(submissionData).unwrap();
                const result = response?.data || response;
                if (result?.sessionId) {
                    setSessionId(result.sessionId);
                    setShowOtpInput(false);
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
            const message = typeof error === "string" ? error : getApiErrorMessage(error);
            toast({
                title: "Submission Failed",
                description: message || "Failed to submit complaint. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsSubmittingLocal(false);
        }
    }, [
        isLoading,
        captcha,
        captchaId,
        formData,
        submissionMode,
        isAuthenticated,
        user,
        files,
        dispatch,
        translations,
        toast,
        onSuccess,
    ]);
    // Handle OTP verification and final submission
    const handleVerifyOtp = useCallback(async (code) => {
        const inputCode = code ?? otpCode;
        if (!inputCode || inputCode.length !== 6) {
            toast({
                title: "Invalid Code",
                description: "Please enter a valid 6-digit verification code.",
                variant: "destructive",
            });
            return;
        }
        try {
            setIsVerifyingOtp(true);
            const fd = new FormData();
            fd.append("email", formData.email);
            fd.append("otpCode", inputCode);
            fd.append("fullName", formData.fullName);
            fd.append("phoneNumber", formData.mobile);
            fd.append("type", formData.problemType);
            fd.append("description", formData.description);
            fd.append("priority", "MEDIUM");
            fd.append("wardId", formData.ward);
            if (formData.subZoneId)
                fd.append("subZoneId", formData.subZoneId);
            fd.append("area", formData.area);
            if (formData.location)
                fd.append("landmark", formData.location);
            if (formData.address)
                fd.append("address", formData.address);
            if (formData.coordinates)
                fd.append("coordinates", JSON.stringify(formData.coordinates));
            for (const file of files)
                fd.append("attachments", file);
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
            resetForm();
            setShowOtpInput(false);
            setSessionId(null);
            setOtpCode("");
            setShowOtpDialog(false);
            onSuccess?.(result.data?.complaint?.id || "");
        }
        catch (error) {
            console.error("OTP verification error:", error);
            const message = typeof error === "string" ? error : getApiErrorMessage(error);
            toast({
                title: "Verification Failed",
                description: message || "Invalid verification code. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsVerifyingOtp(false);
        }
    }, [otpCode, formData, files, verifyGuestOtp, dispatch, toast, onSuccess]);
    const resetForm = useCallback(() => {
        setFormData({
            fullName: "",
            mobile: isAuthenticated && user ? user.phoneNumber || "" : "",
            email: isAuthenticated && user ? user.email || "" : "",
            problemType: "",
            ward: isAuthenticated && user ? user.wardId || "" : "",
            subZoneId: "",
            area: "",
            location: "",
            address: "",
            description: "",
            coordinates: null,
        });
        setFiles([]);
        setCaptcha("");
        setCaptchaId(null);
        setOtpCode("");
        setSessionId(null);
        setShowOtpInput(false);
        handleRefreshCaptcha();
    }, [isAuthenticated, user, handleRefreshCaptcha]);
    return (_jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-primary rounded-lg flex items-center justify-center", children: _jsx(MapPin, { className: "h-4 w-4 text-primary-foreground" }) }), _jsx("span", { children: translations?.complaints?.registerComplaint ||
                                                "Register Complaint" }), !isAuthenticated && (_jsx(Badge, { variant: "secondary", className: "ml-2", children: translations?.auth?.guestMode || "Guest Mode" }))] }), onClose && (_jsx(Button, { variant: "outline", onClick: onClose, children: _jsx(X, { className: "h-4 w-4" }) }))] }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: translations?.forms?.contactInformation ||
                                                "Contact Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "fullName", children: [translations?.auth?.fullName || "Full Name", " *"] }), _jsx(Input, { id: "fullName", type: "text", value: formData.fullName, onChange: (e) => handleInputChange("fullName", e.target.value), onBlur: () => validateField("fullName", formData.fullName), placeholder: `${translations?.common?.name || "Enter your"} ${translations?.auth?.fullName || "full name"}`, required: true }), errors.fullName && (_jsx("p", { className: "text-sm text-red-500", children: errors.fullName }))] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "mobile", children: [translations?.complaints?.mobile || "Mobile Number", " *"] }), _jsx(Input, { id: "mobile", type: "tel", value: formData.mobile, onChange: (e) => handleInputChange("mobile", e.target.value), onBlur: () => validateField("mobile", formData.mobile), placeholder: `${translations?.common?.required || "Enter your"} ${translations?.complaints?.mobile || "mobile number"}`, required: true, disabled: isAuthenticated && !!user?.phoneNumber }), errors.mobile && (_jsx("p", { className: "text-sm text-red-500", children: errors.mobile }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: translations?.auth?.email || "Email Address" }), _jsx(Input, { id: "email", type: "email", value: formData.email, onChange: (e) => handleInputChange("email", e.target.value), onBlur: () => validateField("email", formData.email), placeholder: `${translations?.common?.optional || "Enter your"} ${translations?.auth?.email || "email address"}`, disabled: isAuthenticated && !!user?.email }), errors.email && (_jsx("p", { className: "text-sm text-red-500", children: errors.email }))] })] })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: translations?.forms?.problemDetails || "Problem Details" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "problem-type", children: [translations?.complaints?.complaintType ||
                                                                    "Complaint Type", " ", "*"] }), _jsxs(Select, { value: formData.problemType, onValueChange: (value) => handleInputChange("problemType", value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: `${translations?.common?.selectAll || "Select"} ${translations?.complaints?.complaintType || "complaint type"}` }) }), _jsx(SelectContent, { children: problemTypes.map((type) => (_jsx(SelectItem, { value: type.key, children: _jsxs("div", { className: "flex items-center space-x-2", children: [type.icon, _jsx("span", { children: type.label })] }) }, type.key))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "ward", children: [translations?.complaints?.ward || "Ward", " *"] }), _jsxs(Select, { value: formData.ward, onValueChange: (value) => handleInputChange("ward", value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: `${translations?.common?.selectAll || "Select your"} ${translations?.complaints?.ward || "ward"}` }) }), _jsx(SelectContent, { children: wardsLoading ? (_jsx(SelectItem, { value: "loading", disabled: true, children: "Loading wards..." })) : wardsError ? (_jsx(SelectItem, { value: "error", disabled: true, children: "Error loading wards" })) : (wards.map((ward) => (_jsx(SelectItem, { value: ward.id, children: ward.name }, ward.id)))) })] })] })] })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: translations?.forms?.locationDetails || "Location Details" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "area", children: [translations?.complaints?.area || "Area", " *"] }), _jsx(Input, { id: "area", value: formData.area, onChange: (e) => handleInputChange("area", e.target.value), onBlur: () => validateField("area", formData.area), placeholder: translations?.forms?.minCharacters ||
                                                                "Enter area (minimum 3 characters)", required: true }), errors.area && (_jsx("p", { className: "text-sm text-red-500", children: errors.area }))] }), formData.ward && subZonesForWard.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "subZone", children: translations?.complaints?.subZone || "Sub-Zone" }), _jsxs(Select, { value: formData.subZoneId || "", onValueChange: (value) => handleInputChange("subZoneId", value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: translations?.common?.selectAll || "Select sub-zone" }) }), _jsx(SelectContent, { children: subZonesForWard.map((sz) => (_jsx(SelectItem, { value: sz.id, children: sz.name }, sz.id))) })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "location", children: translations?.complaints?.location || "Location/Landmark" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Input, { id: "location", value: formData.location, onChange: (e) => handleInputChange("location", e.target.value), placeholder: `${translations?.complaints?.landmark || "Specific location or landmark"}`, className: "flex-1" }), _jsx(Button, { type: "button", variant: "outline", size: "icon", onClick: () => setIsMapDialogOpen(true), title: "Select location on map", children: _jsx(MapPin, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "address", children: translations?.complaints?.address ||
                                                                "Full Address" }), _jsx(Textarea, { id: "address", value: formData.address, onChange: (e) => handleInputChange("address", e.target.value), placeholder: `${translations?.complaints?.address || "Complete address details"}...`, rows: 3 })] })] })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: translations?.forms?.complaintDescription ||
                                                "Complaint Description" }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "description", children: [translations?.complaints?.description ||
                                                            translations?.forms?.description ||
                                                            "Description", " ", "*"] }), _jsx(Textarea, { id: "description", value: formData.description, onChange: (e) => handleInputChange("description", e.target.value), onBlur: () => validateField("description", formData.description), placeholder: `${translations?.forms?.complaintDescription || "Describe your complaint in detail"}...`, rows: 4, required: true }), errors.description && (_jsx("p", { className: "text-sm text-red-500", children: errors.description }))] })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: translations?.forms?.optionalUploads || "Optional Uploads" }), _jsx("div", { className: "border-2 border-dashed border-border rounded-lg p-6", children: _jsxs("div", { className: "text-center", children: [_jsx(Upload, { className: "h-8 w-8 mx-auto text-muted-foreground mb-2" }), _jsxs("p", { className: "text-sm text-muted-foreground mb-2", children: [translations?.common?.upload || "Upload", " ", translations?.complaints?.files ||
                                                                "images, videos, or PDF files"] }), _jsx("input", { type: "file", multiple: true, accept: "image/jpeg,image/png,image/jpg,video/mp4,video/webm,video/ogg", onChange: handleFileUpload, className: "hidden", id: "file-upload" }), _jsx(Label, { htmlFor: "file-upload", className: "cursor-pointer", children: _jsx(Button, { type: "button", variant: "outline", asChild: true, children: _jsxs("span", { children: [translations?.common?.upload || "Upload", " ", translations?.complaints?.files || "Files"] }) }) })] }) }), files.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "text-sm font-medium", children: [translations?.complaints?.files || "Uploaded Files", ":"] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: files.map((file, index) => {
                                                        const url = URL.createObjectURL(file);
                                                        const isImage = file.type.startsWith("image/");
                                                        const isVideo = file.type.startsWith("video/");
                                                        return (_jsxs("div", { className: "relative rounded border overflow-hidden", children: [_jsx("button", { type: "button", className: "absolute top-1 right-1 z-10 bg-white/80 rounded-full px-2 py-0.5 text-xs", onClick: () => removeFile(index), "aria-label": `Remove ${file.name}`, children: "\u00D7" }), isImage ? (_jsx("img", { src: url, alt: file.name, className: "w-full h-32 object-cover" })) : isVideo ? (_jsx("video", { src: url, className: "w-full h-32 object-cover", controls: true })) : (_jsx("div", { className: "p-3 text-sm break-all", children: file.name })), _jsx("div", { className: "p-2 text-xs text-gray-600 truncate", children: file.name })] }, index));
                                                    }) })] }))] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsxs("h3", { className: "text-lg font-medium", children: [translations?.forms?.captchaVerification ||
                                                    "CAPTCHA Verification", " ", "*"] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "bg-gray-100 p-2 rounded border min-h-[60px] flex items-center justify-center", children: captchaLoading ? (_jsx("div", { className: "text-sm text-gray-500", children: "Loading CAPTCHA..." })) : captchaError ? (_jsx("div", { className: "text-sm text-red-500", children: "Error loading CAPTCHA" })) : captchaData?.success && captchaData.data ? (_jsx("div", { dangerouslySetInnerHTML: {
                                                            __html: captchaData.data.captchaSvg,
                                                        }, className: "captcha-svg" })) : (_jsx("div", { className: "text-sm text-gray-500", children: "Click refresh to load CAPTCHA" })) }), _jsx(Button, { type: "button", variant: "outline", size: "icon", onClick: handleRefreshCaptcha, disabled: captchaLoading, title: "Refresh CAPTCHA", children: _jsx(RefreshCw, { className: `h-4 w-4 ${captchaLoading ? "animate-spin" : ""}` }) })] }), _jsx(Input, { value: captcha, onChange: (e) => setCaptcha(e.target.value), onBlur: () => validateField("captcha", captcha), placeholder: translations?.forms?.enterCaptcha ||
                                                "Enter the code shown above", required: true }), errors.captcha && (_jsx("p", { className: "text-sm text-red-500", children: errors.captcha }))] }), showOtpInput && submissionMode === "guest" && (_jsxs(_Fragment, { children: [_jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium", children: "Email Verification" }), _jsxs("div", { className: "max-w-md mx-auto space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "otpCode", className: "text-center block", children: "Enter Verification Code" }), _jsx(Input, { id: "otpCode", name: "otpCode", type: "text", placeholder: "Enter 6-digit code", maxLength: 6, className: "text-center text-xl font-mono tracking-widest", value: otpCode, onChange: (e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)), autoComplete: "one-time-code" })] }), _jsxs("div", { className: "text-center text-sm text-gray-500", children: ["Code sent to: ", formData.email] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { type: "button", onClick: handleVerifyOtp, className: "flex-1", disabled: isLoading || otpCode.length !== 6, children: "Verify & Submit" }), _jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                                                        setShowOtpInput(false);
                                                                        setOtpCode("");
                                                                        setSessionId(null);
                                                                    }, children: "Back" })] })] })] })] })), !showOtpInput && (_jsxs("div", { className: "flex space-x-4 pt-4", children: [_jsx(Button, { type: "submit", className: "flex-1 md:flex-none", disabled: submissionMode === "guest"
                                                ? isSendingOtp || isSubmittingLocal
                                                : isLoading, children: submissionMode === "guest" ? (isSendingOtp || isSubmittingLocal ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Sending Code..."] })) : ("Submit & Send Verification")) : isLoading ? (translations?.common?.loading || "Submitting...") : (translations?.forms?.submitComplaint || "Submit Complaint") }), _jsx(Button, { type: "button", variant: "outline", onClick: resetForm, children: translations?.forms?.resetForm || "Reset Form" })] }))] }) })] }), showOtpDialog && (_jsx(OtpDialog, { open: showOtpDialog, onOpenChange: setShowOtpDialog, context: "guestComplaint", email: formData.email, onVerified: async ({ otpCode }) => {
                    if (!otpCode)
                        return;
                    await handleVerifyOtp(otpCode);
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
                }, isVerifying: isVerifyingOtp })), _jsx(SimpleLocationMapDialog, { isOpen: isMapDialogOpen, onClose: () => setIsMapDialogOpen(false), onLocationSelect: handleLocationSelect, initialLocation: formData.coordinates
                    ? {
                        latitude: formData.coordinates.latitude,
                        longitude: formData.coordinates.longitude,
                        address: formData.address,
                        area: formData.area,
                        landmark: formData.location,
                    }
                    : undefined })] }));
};
export default QuickComplaintForm;
