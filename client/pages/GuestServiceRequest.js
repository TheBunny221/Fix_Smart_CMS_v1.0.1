import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { useToast } from "../hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { FileText, Calendar, MapPin, User, ArrowLeft, ArrowRight, CheckCircle, Clock, Loader2, } from "lucide-react";
const SERVICE_TYPES = [
    {
        value: "BIRTH_CERTIFICATE",
        label: "Birth Certificate",
        description: "New birth certificate issuance",
        processingTime: "5-7 days",
    },
    {
        value: "DEATH_CERTIFICATE",
        label: "Death Certificate",
        description: "Death certificate issuance",
        processingTime: "3-5 days",
    },
    {
        value: "MARRIAGE_CERTIFICATE",
        label: "Marriage Certificate",
        description: "Marriage certificate issuance",
        processingTime: "7-10 days",
    },
    {
        value: "PROPERTY_TAX",
        label: "Property Tax",
        description: "Property tax payment and certificates",
        processingTime: "2-3 days",
    },
    {
        value: "TRADE_LICENSE",
        label: "Trade License",
        description: "Business trade license application",
        processingTime: "10-15 days",
    },
    {
        value: "BUILDING_PERMIT",
        label: "Building Permit",
        description: "Construction and renovation permits",
        processingTime: "15-20 days",
    },
    {
        value: "WATER_CONNECTION",
        label: "Water Connection",
        description: "New water connection application",
        processingTime: "7-10 days",
    },
    {
        value: "OTHERS",
        label: "Others",
        description: "Other municipal services",
        processingTime: "Varies",
    },
];
const PRIORITIES = [
    { value: "NORMAL", label: "Normal", color: "bg-blue-500" },
    { value: "URGENT", label: "Urgent", color: "bg-orange-500" },
    { value: "EMERGENCY", label: "Emergency", color: "bg-red-500" },
];
const WARDS = [
    { id: "ward-1", name: "Fort Kochi" },
    { id: "ward-2", name: "Mattancherry" },
    { id: "ward-3", name: "Ernakulam South" },
    { id: "ward-4", name: "Ernakulam North" },
    { id: "ward-5", name: "Kadavanthra" },
    { id: "ward-6", name: "Thevara" },
];
const GuestServiceRequest = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        serviceType: "",
        priority: "NORMAL",
        description: "",
        preferredDate: "",
        preferredTime: "",
        wardId: "",
        area: "",
        address: "",
        landmark: "",
    });
    const [validationErrors, setValidationErrors] = useState({});
    const steps = [
        { id: 1, title: "Service Details", icon: FileText },
        { id: 2, title: "Personal Info", icon: User },
        { id: 3, title: "Location", icon: MapPin },
        { id: 4, title: "Schedule", icon: Calendar },
        { id: 5, title: "Review", icon: CheckCircle },
    ];
    const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };
    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };
    const validateStep = (step) => {
        const errors = {};
        switch (step) {
            case 1:
                if (!formData.serviceType)
                    errors.serviceType = "Service type is required";
                if (!formData.description.trim())
                    errors.description = "Description is required";
                else if (formData.description.trim().length < 10) {
                    errors.description = "Description must be at least 10 characters";
                }
                break;
            case 2:
                if (!formData.fullName.trim())
                    errors.fullName = "Full name is required";
                if (!formData.email.trim())
                    errors.email = "Email is required";
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    errors.email = "Please enter a valid email address";
                }
                if (!formData.phoneNumber.trim())
                    errors.phoneNumber = "Phone number is required";
                else if (!/^[\d\s\-\+\(\)]{10,}$/.test(formData.phoneNumber.replace(/\s/g, ""))) {
                    errors.phoneNumber = "Please enter a valid phone number";
                }
                break;
            case 3:
                if (!formData.wardId)
                    errors.wardId = "Ward selection is required";
                if (!formData.area.trim())
                    errors.area = "Area is required";
                if (!formData.address.trim())
                    errors.address = "Address is required";
                break;
            case 4:
                if (!formData.preferredDate)
                    errors.preferredDate = "Preferred date is required";
                if (!formData.preferredTime)
                    errors.preferredTime = "Preferred time is required";
                break;
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 5));
        }
    };
    const handlePrev = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };
    const handleSubmit = async () => {
        if (!validateStep(4))
            return;
        setIsSubmitting(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            toast({
                title: "Service Request Submitted",
                description: "Your service request has been submitted successfully. You will receive a confirmation email shortly.",
            });
            navigate("/guest/track");
        }
        catch (error) {
            toast({
                title: "Submission Failed",
                description: "There was an error submitting your request. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const selectedService = SERVICE_TYPES.find((s) => s.value === formData.serviceType);
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Service Request" }), _jsx("p", { className: "text-gray-600", children: "Request municipal services online" })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Progress" }), _jsxs("span", { className: "text-sm text-gray-500", children: ["Step ", currentStep, " of ", steps.length] })] }), _jsx(Progress, { value: progress, className: "w-full" }), _jsx("div", { className: "flex justify-between", children: steps.map((step) => {
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
                                        }), steps[currentStep - 1].title] }), _jsxs(CardDescription, { children: [currentStep === 1 &&
                                            "Select the service you need and provide details", currentStep === 2 && "Enter your personal information", currentStep === 3 && "Specify your location", currentStep === 4 && "Choose your preferred appointment time", currentStep === 5 && "Review and submit your service request"] })] }), _jsxs(CardContent, { className: "space-y-6", children: [currentStep === 1 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Service Type *" }), _jsxs(Select, { value: formData.serviceType, onValueChange: (value) => handleSelectChange("serviceType", value), children: [_jsx(SelectTrigger, { className: validationErrors.serviceType ? "border-red-500" : "", children: _jsx(SelectValue, { placeholder: "Select service type" }) }), _jsx(SelectContent, { children: SERVICE_TYPES.map((service) => (_jsx(SelectItem, { value: service.value, children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium", children: service.label }), _jsx("span", { className: "text-xs text-gray-500", children: service.description })] }) }, service.value))) })] }), validationErrors.serviceType && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.serviceType }))] }), selectedService && (_jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-medium text-blue-900 mb-2", children: selectedService.label }), _jsx("p", { className: "text-sm text-blue-700 mb-2", children: selectedService.description }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-4 w-4 text-blue-600" }), _jsxs("span", { className: "text-sm text-blue-600", children: ["Processing Time: ", selectedService.processingTime] })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Priority" }), _jsxs(Select, { value: formData.priority, onValueChange: (value) => handleSelectChange("priority", value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: PRIORITIES.map((priority) => (_jsx(SelectItem, { value: priority.value, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${priority.color}` }), priority.label] }) }, priority.value))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "description", children: "Description *" }), _jsx(Textarea, { id: "description", name: "description", placeholder: "Provide detailed information about your service request...", value: formData.description, onChange: handleInputChange, rows: 4, className: validationErrors.description ? "border-red-500" : "" }), validationErrors.description && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.description }))] })] })), currentStep === 2 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "fullName", children: "Full Name *" }), _jsx(Input, { id: "fullName", name: "fullName", placeholder: "Enter your full name", value: formData.fullName, onChange: handleInputChange, className: validationErrors.fullName ? "border-red-500" : "" }), validationErrors.fullName && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.fullName }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email Address *" }), _jsx(Input, { id: "email", name: "email", type: "email", placeholder: "Enter your email", value: formData.email, onChange: handleInputChange, className: validationErrors.email ? "border-red-500" : "" }), validationErrors.email && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.email }))] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "phoneNumber", children: "Phone Number *" }), _jsx(Input, { id: "phoneNumber", name: "phoneNumber", type: "tel", placeholder: "Enter your phone number", value: formData.phoneNumber, onChange: handleInputChange, className: validationErrors.phoneNumber ? "border-red-500" : "" }), validationErrors.phoneNumber && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.phoneNumber }))] })] })), currentStep === 3 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Ward *" }), _jsxs(Select, { value: formData.wardId, onValueChange: (value) => handleSelectChange("wardId", value), children: [_jsx(SelectTrigger, { className: validationErrors.wardId ? "border-red-500" : "", children: _jsx(SelectValue, { placeholder: "Select ward" }) }), _jsx(SelectContent, { children: WARDS.map((ward) => (_jsx(SelectItem, { value: ward.id, children: ward.name }, ward.id))) })] }), validationErrors.wardId && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.wardId }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "area", children: "Area/Locality *" }), _jsx(Input, { id: "area", name: "area", placeholder: "Enter area or locality", value: formData.area, onChange: handleInputChange, className: validationErrors.area ? "border-red-500" : "" }), validationErrors.area && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.area }))] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "address", children: "Full Address *" }), _jsx(Textarea, { id: "address", name: "address", placeholder: "Enter your complete address", value: formData.address, onChange: handleInputChange, rows: 3, className: validationErrors.address ? "border-red-500" : "" }), validationErrors.address && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.address }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "landmark", children: "Landmark (Optional)" }), _jsx(Input, { id: "landmark", name: "landmark", placeholder: "Nearby landmark", value: formData.landmark, onChange: handleInputChange })] })] })), currentStep === 4 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "preferredDate", children: "Preferred Date *" }), _jsx(Input, { id: "preferredDate", name: "preferredDate", type: "date", value: formData.preferredDate, onChange: handleInputChange, min: new Date().toISOString().split("T")[0], className: validationErrors.preferredDate ? "border-red-500" : "" }), validationErrors.preferredDate && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.preferredDate }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "preferredTime", children: "Preferred Time *" }), _jsxs(Select, { value: formData.preferredTime, onValueChange: (value) => handleSelectChange("preferredTime", value), children: [_jsx(SelectTrigger, { className: validationErrors.preferredTime ? "border-red-500" : "", children: _jsx(SelectValue, { placeholder: "Select time slot" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "09:00", children: "09:00 AM" }), _jsx(SelectItem, { value: "10:00", children: "10:00 AM" }), _jsx(SelectItem, { value: "11:00", children: "11:00 AM" }), _jsx(SelectItem, { value: "12:00", children: "12:00 PM" }), _jsx(SelectItem, { value: "14:00", children: "02:00 PM" }), _jsx(SelectItem, { value: "15:00", children: "03:00 PM" }), _jsx(SelectItem, { value: "16:00", children: "04:00 PM" })] })] }), validationErrors.preferredTime && (_jsx("p", { className: "text-sm text-red-600", children: validationErrors.preferredTime }))] })] }), _jsxs("div", { className: "bg-amber-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-medium text-amber-900 mb-2", children: "Important Notes" }), _jsxs("ul", { className: "text-sm text-amber-700 space-y-1", children: [_jsx("li", { children: "\u2022 Appointments are subject to availability" }), _jsx("li", { children: "\u2022 You will receive a confirmation email with final appointment details" }), _jsx("li", { children: "\u2022 Please bring all required documents" }), _jsx("li", { children: "\u2022 Arrive 15 minutes before your scheduled time" })] })] })] })), currentStep === 5 && (_jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Review Your Service Request" }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Service Details" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Service:" }), " ", selectedService?.label] }), _jsxs("p", { children: [_jsx("strong", { children: "Priority:" }), _jsx(Badge, { className: `ml-2 ${PRIORITIES.find((p) => p.value === formData.priority)?.color}`, children: PRIORITIES.find((p) => p.value === formData.priority)?.label })] }), _jsxs("p", { children: [_jsx("strong", { children: "Description:" }), " ", formData.description] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Personal Information" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Name:" }), " ", formData.fullName] }), _jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " ", formData.email] }), _jsxs("p", { children: [_jsx("strong", { children: "Phone:" }), " ", formData.phoneNumber] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Location" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Ward:" }), " ", WARDS.find((w) => w.id === formData.wardId)?.name] }), _jsxs("p", { children: [_jsx("strong", { children: "Area:" }), " ", formData.area] }), _jsxs("p", { children: [_jsx("strong", { children: "Address:" }), " ", formData.address] }), formData.landmark && (_jsxs("p", { children: [_jsx("strong", { children: "Landmark:" }), " ", formData.landmark] }))] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Appointment" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("p", { children: [_jsx("strong", { children: "Date:" }), " ", new Date(formData.preferredDate).toLocaleDateString()] }), _jsxs("p", { children: [_jsx("strong", { children: "Time:" }), " ", formData.preferredTime] })] })] })] })] })), _jsxs("div", { className: "flex justify-between pt-6", children: [_jsxs(Button, { type: "button", variant: "outline", onClick: handlePrev, disabled: currentStep === 1, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Previous"] }), currentStep < 5 ? (_jsxs(Button, { type: "button", onClick: handleNext, children: ["Next", _jsx(ArrowRight, { className: "h-4 w-4 ml-2" })] })) : (_jsx(Button, { type: "button", onClick: handleSubmit, disabled: isSubmitting, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Submitting..."] })) : (_jsxs(_Fragment, { children: ["Submit Request", _jsx(CheckCircle, { className: "h-4 w-4 ml-2" })] })) }))] })] })] })] }) }));
};
export default GuestServiceRequest;
