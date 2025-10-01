import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import { selectAuth } from "../store/slices/authSlice";
import { useToast } from "../hooks/use-toast";
import { useUploadComplaintAttachmentMutation, useCreateComplaintMutation, } from "../store/api/complaintsApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Alert, AlertDescription } from "../components/ui/alert";
import { FileText, MapPin, ArrowLeft, ArrowRight, CheckCircle, Loader2, Camera, Upload, X, Info, UserCheck, Image, } from "lucide-react";
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
const WARDS = [
    {
        id: "ward-1",
        name: "Fort Kochi",
        subZones: ["Marine Drive", "Parade Ground", "Princess Street"],
    },
    {
        id: "ward-2",
        name: "Mattancherry",
        subZones: ["Jew Town", "Dutch Palace", "Spice Market"],
    },
    {
        id: "ward-3",
        name: "Ernakulam South",
        subZones: ["MG Road", "Broadway", "Shanmugham Road"],
    },
    {
        id: "ward-4",
        name: "Ernakulam North",
        subZones: ["Kadavanthra", "Panampilly Nagar", "Kaloor"],
    },
    {
        id: "ward-5",
        name: "Kadavanthra",
        subZones: ["NH Bypass", "Rajaji Road", "Pipeline Road"],
    },
    {
        id: "ward-6",
        name: "Thevara",
        subZones: ["Thevara Ferry", "Pipeline", "NGO Quarters"],
    },
];
const CitizenComplaintForm = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const { user, isAuthenticated } = useAppSelector(selectAuth);
    const { complaintTypeOptions, isLoading: complaintTypesLoading } = useComplaintTypes();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    // Initialize form data with citizen profile information
    const [formData, setFormData] = useState({
        fullName: user?.fullName || "",
        email: user?.email || "",
        phoneNumber: user?.phoneNumber || "",
        type: "",
        description: "",
        priority: "MEDIUM",
        slaHours: 48,
        wardId: user?.wardId || "",
        area: "",
        landmark: "",
        address: "",
        coordinates: undefined,
        attachments: [],
    });
    const [validationErrors, setValidationErrors] = useState({});
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [fileUploadErrors, setFileUploadErrors] = useState([]);
    // API mutation hooks
    const [createComplaint] = useCreateComplaintMutation();
    const [uploadAttachment] = useUploadComplaintAttachmentMutation();
    const steps = [
        { id: 1, title: "Details", icon: FileText, isCompleted: false },
        { id: 2, title: "Location", icon: MapPin, isCompleted: false },
        { id: 3, title: "Attachments", icon: Camera, isCompleted: false },
        { id: 4, title: "Review", icon: CheckCircle, isCompleted: false },
    ];
    const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated || !user) {
            navigate("/login");
            return;
        }
        // Auto-fill form with user data
        setFormData((prev) => ({
            ...prev,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber || "",
            wardId: user.wardId || "",
        }));
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
                setFormData((prev) => ({
                    ...prev,
                    coordinates: {
                        latitude: coords.lat,
                        longitude: coords.lng,
                    },
                }));
            }, (error) => {
                console.log("Location access denied or unavailable");
            });
        }
    }, []);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };
    const handleSelectChange = (name, value) => {
        setFormData((prev) => {
            const updatedData = { ...prev, [name]: value };
            // Auto-assign priority and SLA hours when complaint type changes
            if (name === "type") {
                const selectedType = complaintTypeOptions.find((type) => type.value === value);
                if (selectedType) {
                    updatedData.priority = selectedType.priority || "MEDIUM";
                    updatedData.slaHours = selectedType.slaHours || 48;
                }
            }
            return updatedData;
        });
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };
    const validateStep = (step) => {
        const errors = {};
        switch (step) {
            case 1:
                if (!formData.type)
                    errors.type = "Complaint type is required";
                if (!formData.description.trim())
                    errors.description = "Description is required";
                else if (formData.description.trim().length < 10) {
                    errors.description = "Description must be at least 10 characters";
                }
                break;
            case 2:
                if (!formData.wardId)
                    errors.wardId = "Ward selection is required";
                if (!formData.area.trim())
                    errors.area = "Area/locality is required";
                if (availableSubZones &&
                    availableSubZones.length > 0 &&
                    !formData.subZoneId) {
                    errors.subZoneId = "Sub-zone is required";
                }
                if (!formData.landmark || !formData.landmark.trim()) {
                    errors.landmark = "Landmark is required";
                }
                if (!formData.address || !formData.address.trim()) {
                    errors.address = "Full address is required";
                }
                if (!formData.coordinates ||
                    formData.coordinates.latitude == null ||
                    formData.coordinates.longitude == null) {
                    errors.coordinates = "Location (GPS coordinates) is required";
                }
                break;
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 4));
        }
    };
    const handlePrev = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };
    const handleSubmit = async () => {
        if (!validateStep(2))
            return;
        setIsSubmitting(true);
        try {
            // Create complaint
            const complaintData = {
                title: `${formData.type} complaint`,
                description: formData.description,
                // Send both during transition; backend prefers complaintTypeId
                complaintTypeId: formData.type,
                type: formData.type,
                priority: formData.priority,
                slaHours: formData.slaHours,
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
            const complaintResponse = await createComplaint(complaintData).unwrap();
            const complaint = complaintResponse.data.complaint;
            const complaintId = complaint.id;
            const displayId = complaint.complaintId || complaintId.slice(-6).toUpperCase();
            // Upload attachments if any
            if (formData.attachments && formData.attachments.length > 0) {
                setUploadingFiles(true);
                for (const file of formData.attachments) {
                    try {
                        await uploadAttachment({ complaintId, file }).unwrap();
                    }
                    catch (uploadError) {
                        console.error("Failed to upload file:", file.name, uploadError);
                        // Don't fail the entire submission for file upload errors
                    }
                }
                setUploadingFiles(false);
            }
            toast({
                title: "Complaint Submitted Successfully!",
                description: `Your complaint has been registered with ID: ${displayId}. You will receive updates via email and in-app notifications.`,
            });
            navigate("/complaints");
        }
        catch (error) {
            console.error("Submission error:", error);
            toast({
                title: "Submission Failed",
                description: error?.data?.message ||
                    "There was an error submitting your complaint. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsSubmitting(false);
            setUploadingFiles(false);
        }
    };
    // File upload handlers
    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0)
            return;
        // Validate file count
        const currentFileCount = formData.attachments?.length || 0;
        if (currentFileCount + files.length > 5) {
            toast({
                title: "Too many files",
                description: "You can upload a maximum of 5 files",
                variant: "destructive",
            });
            return;
        }
        const validFiles = [];
        const errors = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                errors.push(`${file.name}: File size too large (max 10MB)`);
                continue;
            }
            // Validate file type
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
            ];
            if (!allowedTypes.includes(file.type)) {
                errors.push(`${file.name}: Invalid file type (only images allowed)`);
                continue;
            }
            validFiles.push(file);
        }
        if (errors.length > 0) {
            setFileUploadErrors(errors);
            toast({
                title: "File validation errors",
                description: `${errors.length} file(s) were rejected`,
                variant: "destructive",
            });
        }
        if (validFiles.length > 0) {
            setFormData((prev) => ({
                ...prev,
                attachments: [...(prev.attachments || []), ...validFiles],
            }));
            setFileUploadErrors([]);
        }
        // Clear the input
        event.target.value = "";
    };
    const removeFile = (index) => {
        setFormData((prev) => ({
            ...prev,
            attachments: prev.attachments?.filter((_, i) => i !== index) || [],
        }));
    };
    const selectedComplaintType = complaintTypeOptions.find((c) => c.value === formData.type);
    const selectedWard = WARDS.find((w) => w.id === formData.wardId);
    const availableSubZones = selectedWard?.subZones || [];
    if (!isAuthenticated || !user) {
        return null; // Will redirect in useEffect
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Submit a Complaint" }), _jsx("p", { className: "text-gray-600", children: "As a registered citizen, your information is pre-filled for faster submission" })] }), _jsxs(Alert, { className: "border-blue-200 bg-blue-50", children: [_jsx(UserCheck, { className: "h-4 w-4" }), _jsxs(AlertDescription, { className: "text-blue-800", children: [_jsx("strong", { children: "Logged in as:" }), " ", user.fullName, " (", user.email, ")", _jsx("br", {}), "Your personal information is automatically filled and cannot be changed here. To update your profile, visit the", " ", _jsx("button", { onClick: () => navigate("/profile"), className: "underline hover:no-underline", children: "Profile Settings" }), "."] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Progress" }), _jsxs("span", { className: "text-sm text-gray-500", children: ["Step ", currentStep, " of ", steps.length] })] }), _jsx(Progress, { value: progress, className: "w-full" }), _jsx("div", { className: "flex justify-between", children: steps.map((step) => {
                                        const StepIcon = step.icon;
                                        return (_jsxs("div", { className: `flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${step.id === currentStep
                                                ? "bg-blue-100 text-blue-800"
                                                : step.id < currentStep
                                                    ? "bg-green-100 text-green-800"
                                                    : "text-gray-400"}`, children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step.id === currentStep
                                                        ? "bg-blue-600 text-white"
                                                        : step.id < currentStep
                                                            ? "bg-green-600 text-white"
                                                            : "bg-gray-300 text-gray-600"}`, children: step.id < currentStep ? (_jsx(CheckCircle, { className: "h-4 w-4" })) : (_jsx(StepIcon, { className: "h-4 w-4" })) }), _jsx("span", { className: "text-xs font-medium", children: step.title })] }, step.id));
                                    }) })] }) }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [React.createElement(steps[currentStep - 1].icon, {
                                            className: "h-5 w-5",
                                        }), steps[currentStep - 1].title] }), _jsxs(CardDescription, { children: [currentStep === 1 && "Describe your complaint and set priority", currentStep === 2 && "Specify the exact location of the issue", currentStep === 3 && "Add supporting images (optional)", currentStep === 4 && "Review and submit your complaint"] })] }), _jsxs(CardContent, { className: "space-y-6", children: [currentStep === 1 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-700", children: "Personal Information (Auto-filled)" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Full Name" }), _jsx(Input, { value: formData.fullName, readOnly: true, className: "bg-gray-100" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Email Address" }), _jsx(Input, { value: formData.email, readOnly: true, className: "bg-gray-100" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Phone Number" }), _jsx(Input, { value: formData.phoneNumber, readOnly: true, className: "bg-gray-100" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Citizen ID" }), _jsx(Input, { value: user.id.slice(-8).toUpperCase(), readOnly: true, className: "bg-gray-100 font-mono" })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Complaint Details" }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Complaint Type *" }), _jsxs(Select, { value: formData.type, onValueChange: (value) => handleSelectChange("type", value), children: [_jsx(SelectTrigger, { className: validationErrors.type ? "border-red-500" : "", children: _jsx(SelectValue, { placeholder: "Select complaint type" }) }), _jsx(SelectContent, { children: complaintTypesLoading ? (_jsx(SelectItem, { value: "loading", disabled: true, children: "Loading complaint types..." })) : complaintTypeOptions.length > 0 ? (complaintTypeOptions.map((type) => (_jsx(SelectItem, { value: type.value, children: _jsxs("div", { className: "flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium", children: type.label }), type.priority && (_jsx(Badge, { variant: "outline", className: "text-xs", children: type.priority }))] }), type.description && (_jsx("span", { className: "text-xs text-gray-500", children: type.description }))] }) }, type.value)))) : (_jsx(SelectItem, { value: "none", disabled: true, children: "No complaint types available" })) })] }), validationErrors.type && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.type }))] }), selectedComplaintType && (_jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-medium text-blue-900 mb-2", children: selectedComplaintType.label }), _jsx("p", { className: "text-sm text-blue-700 mb-2", children: selectedComplaintType.description }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Info, { className: "h-4 w-4 text-blue-600" }), _jsxs("span", { className: "text-sm text-blue-600", children: ["Priority: ", selectedComplaintType.priority] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Info, { className: "h-4 w-4 text-blue-600" }), _jsxs("span", { className: "text-sm text-blue-600", children: ["SLA: ", selectedComplaintType.slaHours, "h"] })] })] })] })), selectedComplaintType && (_jsxs("div", { className: "bg-gray-50 p-4 rounded-lg border", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-800 mb-1", children: "Auto-assigned Details" }), _jsx("p", { className: "text-sm text-gray-600", children: "Based on your complaint type, the following have been automatically set:" })] }) }), _jsxs("div", { className: "mt-3 grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${PRIORITIES.find((p) => p.value === formData.priority)?.color || "bg-gray-500"}` }), _jsxs("span", { className: "text-sm font-medium", children: ["Priority:", " ", PRIORITIES.find((p) => p.value === formData.priority)?.label || formData.priority] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Info, { className: "h-4 w-4 text-gray-600" }), _jsxs("span", { className: "text-sm font-medium", children: ["SLA: ", formData.slaHours, " hours"] })] })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "description", children: "Description *" }), _jsx(Textarea, { id: "description", name: "description", placeholder: "Describe the issue in detail... (What happened? When? Where exactly?)", value: formData.description, onChange: handleInputChange, rows: 4, className: validationErrors.description ? "border-red-500" : "" }), validationErrors.description && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.description })), _jsx("p", { className: "text-xs text-gray-500", children: "Be specific about the problem, when it started, and how it affects you." })] })] })] })), currentStep === 2 && (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Location Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Ward *" }), _jsxs(Select, { value: formData.wardId, onValueChange: (value) => handleSelectChange("wardId", value), children: [_jsx(SelectTrigger, { className: validationErrors.wardId ? "border-red-500" : "", children: _jsx(SelectValue, { placeholder: "Select ward" }) }), _jsx(SelectContent, { children: WARDS.map((ward) => (_jsx(SelectItem, { value: ward.id, children: ward.name }, ward.id))) })] }), validationErrors.wardId && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.wardId }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Sub-Zone *" }), _jsxs(Select, { value: formData.subZoneId, onValueChange: (value) => handleSelectChange("subZoneId", value), disabled: !formData.wardId, children: [_jsx(SelectTrigger, { className: validationErrors.subZoneId ? "border-red-500" : "", children: _jsx(SelectValue, { placeholder: "Select sub-zone" }) }), _jsx(SelectContent, { children: availableSubZones.map((subZone, index) => (_jsx(SelectItem, { value: subZone, children: subZone }, index))) })] }), validationErrors.subZoneId && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.subZoneId }))] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "area", children: "Area/Locality *" }), _jsx(Input, { id: "area", name: "area", placeholder: "Enter specific area or locality (e.g., Near Metro Station, Main Road)", value: formData.area, onChange: handleInputChange, className: validationErrors.area ? "border-red-500" : "" }), validationErrors.area && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.area }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "landmark", children: "Landmark *" }), _jsx(Input, { id: "landmark", name: "landmark", placeholder: "Nearby landmark (e.g., Next to Bank, Opposite School)", value: formData.landmark, onChange: handleInputChange, className: validationErrors.landmark ? "border-red-500" : "" }), validationErrors.landmark && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.landmark }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "address", children: "Full Address *" }), _jsx(Input, { id: "address", name: "address", placeholder: "Complete address", value: formData.address, onChange: handleInputChange, className: validationErrors.address ? "border-red-500" : "" }), validationErrors.address && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.address }))] })] }), currentLocation && (_jsxs("div", { className: "bg-green-50 p-4 rounded-lg border border-green-200", children: [_jsxs("div", { className: "flex items-center gap-2 text-green-700", children: [_jsx(MapPin, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm font-medium", children: "Current location detected and will be included with your complaint" })] }), _jsxs("p", { className: "text-xs text-green-600 mt-1", children: ["Coordinates: ", currentLocation.lat.toFixed(6), ",", " ", currentLocation.lng.toFixed(6)] })] })), validationErrors.coordinates && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.coordinates }))] }) })), currentStep === 3 && (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Upload Images (Optional)" }), _jsx("p", { className: "text-sm text-gray-600", children: "Adding photos helps our team understand and resolve the issue faster. You can upload up to 5 images." }), _jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "file", multiple: true, accept: "image/*", className: "hidden", id: "file-upload", onChange: handleFileUpload }), _jsx(Label, { htmlFor: "file-upload", className: "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100", children: _jsxs("div", { className: "flex flex-col items-center justify-center pt-5 pb-6", children: [_jsx(Upload, { className: "w-8 h-8 mb-2 text-gray-500" }), _jsxs("p", { className: "mb-2 text-sm text-gray-500", children: [_jsx("span", { className: "font-semibold", children: "Click to upload" }), " ", "or drag and drop"] }), _jsx("p", { className: "text-xs text-gray-500", children: "PNG, JPG or JPEG (MAX. 10MB each)" })] }) }), formData.attachments &&
                                                        formData.attachments.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("h4", { className: "font-medium text-sm text-gray-700", children: ["Uploaded Files (", formData.attachments.length, "/5)"] }), _jsx("div", { className: "space-y-2", children: formData.attachments.map((file, index) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Image, { className: "h-5 w-5 text-blue-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: file.name }), _jsxs("p", { className: "text-xs text-gray-500", children: [(file.size / 1024).toFixed(1), " KB"] })] })] }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => removeFile(index), className: "text-red-500 hover:text-red-700", children: _jsx(X, { className: "h-4 w-4" }) })] }, index))) })] })), fileUploadErrors.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "font-medium text-sm text-red-700", children: "Upload Errors:" }), fileUploadErrors.map((error, index) => (_jsx("p", { className: "text-sm text-red-600", children: error }, index)))] })), _jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-medium text-blue-900 mb-2", children: "Tips for better photos:" }), _jsxs("ul", { className: "text-sm text-blue-700 space-y-1", children: [_jsx("li", { children: "\u2022 Take clear, well-lit photos of the problem area" }), _jsx("li", { children: "\u2022 Include wider shots to show context" }), _jsx("li", { children: "\u2022 Capture any visible damage or hazards" }), _jsx("li", { children: "\u2022 Avoid including personal or sensitive information" })] })] })] })] }) })), currentStep === 4 && (_jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Review Your Complaint" }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Citizen Information" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Name:" }), " ", formData.fullName] }), _jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " ", formData.email] }), _jsxs("p", { children: [_jsx("strong", { children: "Phone:" }), " ", formData.phoneNumber] }), _jsxs("p", { children: [_jsx("strong", { children: "Citizen ID:" }), " ", user.id.slice(-8).toUpperCase()] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Complaint Details" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Type:" }), " ", selectedComplaintType?.label] }), _jsxs("p", { children: [_jsx("strong", { children: "Priority:" }), _jsx(Badge, { className: `ml-2 ${PRIORITIES.find((p) => p.value === formData.priority)?.color}`, children: PRIORITIES.find((p) => p.value === formData.priority)?.label })] }), _jsxs("p", { children: [_jsx("strong", { children: "SLA Hours:" }), " ", formData.slaHours, " hours"] }), _jsxs("p", { children: [_jsx("strong", { children: "Description:" }), " ", formData.description] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Location" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Ward:" }), " ", WARDS.find((w) => w.id === formData.wardId)?.name] }), formData.subZoneId && (_jsxs("p", { children: [_jsx("strong", { children: "Sub-Zone:" }), " ", formData.subZoneId] })), _jsxs("p", { children: [_jsx("strong", { children: "Area:" }), " ", formData.area] }), formData.landmark && (_jsxs("p", { children: [_jsx("strong", { children: "Landmark:" }), " ", formData.landmark] })), formData.address && (_jsxs("p", { children: [_jsx("strong", { children: "Address:" }), " ", formData.address] })), currentLocation && (_jsxs("p", { children: [_jsx("strong", { children: "GPS Coordinates:" }), " Included"] }))] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Attachments" }) }), _jsx(CardContent, { children: formData.attachments &&
                                                                formData.attachments.length > 0 ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "text-sm text-gray-600 mb-3", children: [formData.attachments.length, " file(s) will be uploaded with your complaint:"] }), formData.attachments.map((file, index) => (_jsxs("div", { className: "flex items-center space-x-3 p-2 bg-gray-50 rounded", children: [_jsx(Image, { className: "h-4 w-4 text-blue-500" }), _jsx("span", { className: "text-sm", children: file.name }), _jsxs("span", { className: "text-xs text-gray-500", children: ["(", (file.size / 1024).toFixed(1), " KB)"] })] }, index)))] })) : (_jsx("p", { className: "text-sm text-gray-500", children: "No attachments" })) })] }), _jsxs(Alert, { className: "border-green-200 bg-green-50", children: [_jsx(CheckCircle, { className: "h-4 w-4" }), _jsxs(AlertDescription, { className: "text-green-800", children: [_jsx("strong", { children: "Ready to submit!" }), " Your complaint will be automatically assigned a tracking number and forwarded to the appropriate department. You'll receive email notifications about status updates."] })] })] })] })), _jsxs("div", { className: "flex justify-between pt-6", children: [_jsxs(Button, { type: "button", variant: "outline", onClick: handlePrev, disabled: currentStep === 1, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Previous"] }), currentStep < 4 ? (_jsxs(Button, { type: "button", onClick: handleNext, children: ["Next", _jsx(ArrowRight, { className: "h-4 w-4 ml-2" })] })) : (_jsx(Button, { type: "button", onClick: handleSubmit, disabled: isSubmitting || uploadingFiles, children: isSubmitting || uploadingFiles ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), uploadingFiles ? "Uploading files..." : "Submitting..."] })) : (_jsxs(_Fragment, { children: ["Submit Complaint", _jsx(CheckCircle, { className: "h-4 w-4 ml-2" })] })) }))] })] })] })] }) }));
};
export default CitizenComplaintForm;
