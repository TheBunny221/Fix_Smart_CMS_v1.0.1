import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "./ui/select";
import { Plus, Package, AlertCircle, Loader2, Calendar, } from "lucide-react";
import { useGetComplaintMaterialsQuery, useAddComplaintMaterialMutation, } from "../store/api/complaintsApi";
const MaterialsModal = ({ isOpen, onClose, complaintId, complaintTitle, }) => {
    const [isAddingMaterial, setIsAddingMaterial] = useState(false);
    const [newMaterial, setNewMaterial] = useState({
        materialName: "",
        quantity: 1,
        unit: "piece",
        notes: "",
    });
    const [addError, setAddError] = useState(null);
    const { data: materialsResponse, isLoading, error, refetch, } = useGetComplaintMaterialsQuery(complaintId, {
        skip: !isOpen,
    });
    const [addMaterial, { isLoading: isAdding }] = useAddComplaintMaterialMutation();
    const materials = materialsResponse?.data?.materials || [];
    // Common units
    const commonUnits = [
        "piece",
        "kg",
        "meter",
        "liter",
        "box",
        "roll",
        "bag",
        "bottle",
        "tube",
        "sheet",
        "pack",
        "set",
    ];
    // Handle adding new material
    const handleAddMaterial = async () => {
        if (!newMaterial.materialName.trim()) {
            setAddError("Material name is required");
            return;
        }
        if (newMaterial.quantity <= 0) {
            setAddError("Quantity must be greater than 0");
            return;
        }
        try {
            setAddError(null);
            await addMaterial({
                complaintId,
                materialName: newMaterial.materialName.trim(),
                quantity: newMaterial.quantity,
                unit: newMaterial.unit,
                notes: newMaterial.notes.trim() || undefined,
            }).unwrap();
            // Reset form
            setNewMaterial({
                materialName: "",
                quantity: 1,
                unit: "piece",
                notes: "",
            });
            setIsAddingMaterial(false);
            refetch();
        }
        catch (error) {
            console.error("Add material error:", error);
            setAddError(error.data?.message || "Failed to add material");
        }
    };
    // Cancel adding material
    const handleCancelAdd = () => {
        setNewMaterial({
            materialName: "",
            quantity: 1,
            unit: "piece",
            notes: "",
        });
        setIsAddingMaterial(false);
        setAddError(null);
    };
    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center", children: [_jsx(Package, { className: "h-5 w-5 mr-2" }), "Materials Used - ", complaintTitle] }) }), _jsxs("div", { className: "space-y-4", children: [isLoading && (_jsxs("div", { className: "flex items-center justify-center py-8", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin" }), _jsx("span", { className: "ml-2", children: "Loading materials..." })] })), error && (_jsxs("div", { className: "flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: "Failed to load materials. Please try again." })] })), !isLoading && !error && (_jsxs(_Fragment, { children: [materials.length > 0 ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "text-lg font-medium", children: ["Materials Used (", materials.length, ")"] }), _jsxs(Button, { size: "sm", onClick: () => setIsAddingMaterial(true), disabled: isAddingMaterial, children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), "Add Material"] })] }), _jsx("div", { className: "space-y-2", children: materials.map((material) => (_jsx("div", { className: "border rounded-lg p-4 hover:bg-gray-50", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-medium", children: material.materialName }), _jsxs("div", { className: "flex items-center space-x-4 mt-1 text-sm text-gray-600", children: [_jsxs("span", { className: "flex items-center", children: [_jsx("strong", { className: "mr-1", children: "Quantity:" }), material.quantity, " ", material.unit] }), _jsxs("span", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDate(material.usedAt)] })] }), material.notes && (_jsxs("p", { className: "text-sm text-gray-600 mt-2", children: [_jsx("strong", { children: "Notes:" }), " ", material.notes] }))] }), _jsx("div", { className: "ml-4", children: _jsx(Badge, { variant: "secondary", children: material.addedBy.fullName }) })] }) }, material.id))) })] })) : (_jsxs("div", { className: "text-center py-8", children: [_jsx(Package, { className: "h-12 w-12 mx-auto text-gray-400 mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No Materials Added Yet" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Start tracking materials used for this complaint." }), _jsxs(Button, { onClick: () => setIsAddingMaterial(true), children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add First Material"] })] })), isAddingMaterial && (_jsxs("div", { className: "border-t pt-4 mt-4", children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "Add New Material" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "materialName", children: "Material Name *" }), _jsx(Input, { id: "materialName", value: newMaterial.materialName, onChange: (e) => setNewMaterial({ ...newMaterial, materialName: e.target.value }), placeholder: "e.g., PVC Pipe, Cement, LED Bulb", disabled: isAdding })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "quantity", children: "Quantity *" }), _jsx(Input, { id: "quantity", type: "number", min: "1", value: newMaterial.quantity, onChange: (e) => setNewMaterial({
                                                                        ...newMaterial,
                                                                        quantity: parseInt(e.target.value) || 1,
                                                                    }), disabled: isAdding })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "unit", children: "Unit" }), _jsxs(Select, { value: newMaterial.unit, onValueChange: (value) => setNewMaterial({ ...newMaterial, unit: value }), disabled: isAdding, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: commonUnits.map((unit) => (_jsx(SelectItem, { value: unit, children: unit }, unit))) })] })] })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx(Label, { htmlFor: "notes", children: "Notes (Optional)" }), _jsx(Textarea, { id: "notes", value: newMaterial.notes, onChange: (e) => setNewMaterial({ ...newMaterial, notes: e.target.value }), placeholder: "Additional details about the material usage...", rows: 3, disabled: isAdding })] }), addError && (_jsxs("div", { className: "flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg mt-4", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: addError })] })), _jsxs("div", { className: "flex justify-end space-x-2 mt-4", children: [_jsx(Button, { variant: "outline", onClick: handleCancelAdd, disabled: isAdding, children: "Cancel" }), _jsx(Button, { onClick: handleAddMaterial, disabled: isAdding, children: isAdding ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Adding..."] })) : (_jsxs(_Fragment, { children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Material"] })) })] })] }))] })), !isLoading && !error && materials.length > 0 && (_jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-medium mb-2", children: "Summary" }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsxs("p", { children: ["Total materials tracked: ", _jsx("strong", { children: materials.length })] }), _jsxs("p", { children: ["Materials by type:", " ", _jsxs("strong", { children: [[...new Set(materials.map(m => m.materialName))].length, " unique types"] })] })] })] })), _jsx("div", { className: "flex justify-end pt-4", children: _jsx(Button, { variant: "outline", onClick: onClose, children: "Close" }) })] })] }) }));
};
export default MaterialsModal;
