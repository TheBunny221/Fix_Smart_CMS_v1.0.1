import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useCreateComplaintMutation } from "../store/api/complaintsApi";
import { useGetComplaintTypesQuery } from "../store/api/complaintTypesApi";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { useToast } from "../components/ui/use-toast";
import { getApiErrorMessage } from "../store/api/baseApi";
import { MapPin, FileText, User, AlertCircle, CheckCircle, ArrowLeft, } from "lucide-react";
const CreateComplaint = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "",
        priority: "MEDIUM",
        area: "",
        landmark: "",
        address: "",
        contactName: user?.fullName || "",
        contactEmail: user?.email || "",
        contactPhone: user?.phoneNumber || "",
        isAnonymous: false,
    });
    const [errors, setErrors] = useState({});
    // Fetch complaint types
    const { data: typesResponse, isLoading: typesLoading } = useGetComplaintTypesQuery();
    const complaintTypes = Array.isArray(typesResponse?.data)
        ? typesResponse.data
        : [];
    // Create complaint mutation
    const [createComplaint, { isLoading: isCreating }] = useCreateComplaintMutation();
    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }
        if (!formData.type) {
            newErrors.type = "Complaint type is required";
        }
        if (!formData.area.trim()) {
            newErrors.area = "Area is required";
        }
        if (!formData.contactPhone.trim()) {
            newErrors.contactPhone = "Contact phone is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }
        try {
            const result = await createComplaint({
                title: formData.title || `${formData.type} complaint`,
                description: formData.description,
                complaintTypeId: formData.type,
                type: formData.type,
                priority: formData.priority,
                wardId: user?.wardId || "default-ward", // This should be determined by area/location
                area: formData.area,
                landmark: formData.landmark || undefined,
                address: formData.address || undefined,
                contactName: formData.isAnonymous ? undefined : formData.contactName,
                contactEmail: formData.isAnonymous ? undefined : formData.contactEmail,
                contactPhone: formData.contactPhone,
                isAnonymous: formData.isAnonymous,
            }).unwrap();
            toast({
                title: "Complaint Submitted",
                description: "Your complaint has been successfully registered.",
            });
            // Navigate to complaint details
            navigate(`/complaints/${result.data.id}`);
        }
        catch (error) {
            console.error("Create complaint error:", error);
            toast({
                title: "Submission Failed",
                description: getApiErrorMessage(error),
                variant: "destructive",
            });
        }
    };
    if (!isAuthenticated) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx(AlertCircle, { className: "h-12 w-12 mx-auto text-red-500 mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Authentication Required" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Please log in to submit a complaint." }), _jsx(Button, { onClick: () => navigate("/login"), children: "Go to Login" })] }));
    }
    return (_jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigate("/dashboard"), children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Dashboard"] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Register New Complaint" }), _jsx("p", { className: "text-gray-600", children: "Submit a complaint to get it resolved quickly" })] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2" }), "Complaint Details"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "type", children: "Complaint Type *" }), _jsxs(Select, { value: formData.type, onValueChange: (value) => handleInputChange("type", value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select complaint type" }) }), _jsx(SelectContent, { children: typesLoading ? (_jsx(SelectItem, { value: "loading", disabled: true, children: "Loading..." })) : (complaintTypes.map((type) => (_jsx(SelectItem, { value: type.id, children: type.name }, type.id)))) })] }), errors.type && (_jsx("p", { className: "text-sm text-red-600", children: errors.type }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "priority", children: "Priority" }), _jsxs(Select, { value: formData.priority, onValueChange: (value) => handleInputChange("priority", value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "LOW", children: "Low" }), _jsx(SelectItem, { value: "MEDIUM", children: "Medium" }), _jsx(SelectItem, { value: "HIGH", children: "High" }), _jsx(SelectItem, { value: "CRITICAL", children: "Critical" })] })] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "title", children: "Title (Optional)" }), _jsx(Input, { id: "title", value: formData.title, onChange: (e) => handleInputChange("title", e.target.value), placeholder: "Brief title for your complaint" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "description", children: "Description *" }), _jsx(Textarea, { id: "description", value: formData.description, onChange: (e) => handleInputChange("description", e.target.value), placeholder: "Describe your complaint in detail...", rows: 4, className: errors.description ? "border-red-500" : "" }), errors.description && (_jsx("p", { className: "text-sm text-red-600", children: errors.description }))] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(MapPin, { className: "h-5 w-5 mr-2" }), "Location Details"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "area", children: "Area/Locality *" }), _jsx(Input, { id: "area", value: formData.area, onChange: (e) => handleInputChange("area", e.target.value), placeholder: "e.g., Fort Kochi, Mattancherry", className: errors.area ? "border-red-500" : "" }), errors.area && (_jsx("p", { className: "text-sm text-red-600", children: errors.area }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "landmark", children: "Landmark" }), _jsx(Input, { id: "landmark", value: formData.landmark, onChange: (e) => handleInputChange("landmark", e.target.value), placeholder: "Nearby landmark (optional)" })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "address", children: "Complete Address" }), _jsx(Textarea, { id: "address", value: formData.address, onChange: (e) => handleInputChange("address", e.target.value), placeholder: "Complete address (optional)", rows: 2 })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(User, { className: "h-5 w-5 mr-2" }), "Contact Information"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "anonymous", checked: formData.isAnonymous, onCheckedChange: (checked) => handleInputChange("isAnonymous", checked) }), _jsx(Label, { htmlFor: "anonymous", children: "Submit anonymously" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "contactName", children: "Name" }), _jsx(Input, { id: "contactName", value: formData.contactName, onChange: (e) => handleInputChange("contactName", e.target.value), placeholder: "Your name", disabled: formData.isAnonymous })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "contactEmail", children: "Email" }), _jsx(Input, { id: "contactEmail", type: "email", value: formData.contactEmail, onChange: (e) => handleInputChange("contactEmail", e.target.value), placeholder: "your.email@example.com", disabled: formData.isAnonymous })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "contactPhone", children: "Phone Number *" }), _jsx(Input, { id: "contactPhone", type: "tel", value: formData.contactPhone, onChange: (e) => handleInputChange("contactPhone", e.target.value), placeholder: "Your phone number", className: errors.contactPhone ? "border-red-500" : "" }), errors.contactPhone && (_jsx("p", { className: "text-sm text-red-600", children: errors.contactPhone }))] })] })] })] }), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => navigate("/dashboard"), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isCreating, children: isCreating ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "h-4 w-4 mr-2 animate-spin" }), "Submitting..."] })) : (_jsxs(_Fragment, { children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "Submit Complaint"] })) })] })] })] }));
};
export default CreateComplaint;
