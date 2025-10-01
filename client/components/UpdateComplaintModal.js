import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useAppSelector } from "../store/hooks";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useUpdateComplaintMutation, useGetWardUsersQuery, } from "../store/api/complaintsApi";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "./ui/select";
import { Badge } from "./ui/badge";
import { toast } from "./ui/use-toast";
import { User, AlertTriangle, CheckCircle, Clock, FileText, Users, Settings, RotateCcw, } from "lucide-react";
const UpdateComplaintModal = ({ complaint, isOpen, onClose, onSuccess, }) => {
    const { user } = useAppSelector((state) => state.auth);
    const [formData, setFormData] = useState({
        status: "",
        priority: "",
        // New primary field for ward officer assignment
        wardOfficerId: "",
        // Legacy field kept for backward compatibility where needed
        assignedToId: "",
        maintenanceTeamId: "",
        remarks: "",
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [validationErrors, setValidationErrors] = useState([]);
    // Admins need both ward officers and maintenance team lists
    const { data: wardOfficerResponse, isLoading: isLoadingWardOfficers, error: wardOfficersError, } = useGetWardUsersQuery({ page: 1, limit: 200, role: "WARD_OFFICER" }, { skip: user?.role !== "ADMINISTRATOR" && user?.role !== "WARD_OFFICER" });
    const { data: maintenanceResponse, isLoading: isLoadingMaintenance, error: maintenanceError, } = useGetWardUsersQuery({ page: 1, limit: 200, role: "MAINTENANCE_TEAM" }, { skip: user?.role !== "ADMINISTRATOR" && user?.role !== "WARD_OFFICER" });
    // For legacy single-list flows, present available users based on role
    const wardOfficerUsers = wardOfficerResponse?.data?.users || [];
    const maintenanceUsers = maintenanceResponse?.data?.users || [];
    const availableUsers = user?.role === "WARD_OFFICER" ? maintenanceUsers : wardOfficerUsers;
    const [updateComplaint, { isLoading: isUpdating }] = useUpdateComplaintMutation();
    // Filter users based on search term
    const filteredUsers = availableUsers.filter((u) => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    useEffect(() => {
        if (complaint && isOpen) {
            // Extract IDs from complaint (prefer new wardOfficer field but keep legacy support)
            const wardOfficerId = typeof complaint.wardOfficer === "object" && complaint.wardOfficer?.id
                ? complaint.wardOfficer.id
                : complaint.wardOfficer || "none";
            const assignedToId = typeof complaint.assignedTo === "object" && complaint.assignedTo?.id
                ? complaint.assignedTo.id
                : complaint.assignedTo || "none";
            const maintenanceTeamId = typeof complaint.maintenanceTeam === "object" &&
                complaint.maintenanceTeam?.id
                ? complaint.maintenanceTeam.id
                : complaint.maintenanceTeam || "none";
            setFormData({
                status: complaint.status,
                priority: complaint.priority,
                wardOfficerId,
                assignedToId,
                maintenanceTeamId,
                remarks: "",
            });
            setSearchTerm("");
            setValidationErrors([]);
        }
    }, [complaint, isOpen]);
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
    const getPriorityColor = (priority) => {
        switch (priority) {
            case "LOW":
                return "bg-green-100 text-green-800";
            case "MEDIUM":
                return "bg-yellow-100 text-yellow-800";
            case "HIGH":
                return "bg-orange-100 text-orange-800";
            case "CRITICAL":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    const getUserRoleIcon = (role) => {
        switch (role) {
            case "WARD_OFFICER":
                return _jsx(User, { className: "h-4 w-4" });
            case "MAINTENANCE_TEAM":
                return _jsx(Settings, { className: "h-4 w-4" });
            case "ADMINISTRATOR":
                return _jsx(Users, { className: "h-4 w-4" });
            default:
                return _jsx(User, { className: "h-4 w-4" });
        }
    };
    const getDropdownLabel = () => {
        if (user?.role === "ADMINISTRATOR")
            return "Select Ward Officer & Team Member";
        if (user?.role === "WARD_OFFICER")
            return "Select Maintenance Team Member";
        return "Select User";
    };
    const getAvailableStatusOptions = () => {
        const currentStatus = complaint?.status;
        if (user?.role === "MAINTENANCE_TEAM") {
            const statusFlow = {
                ASSIGNED: ["ASSIGNED", "IN_PROGRESS"],
                IN_PROGRESS: ["IN_PROGRESS", "RESOLVED"],
                RESOLVED: ["RESOLVED"],
                REOPENED: ["REOPENED", "IN_PROGRESS"],
            };
            return statusFlow[currentStatus] || ["IN_PROGRESS", "RESOLVED"];
        }
        if (user?.role === "WARD_OFFICER") {
            return ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
        }
        if (user?.role === "ADMINISTRATOR") {
            return [
                "REGISTERED",
                "ASSIGNED",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED",
                "REOPENED",
            ];
        }
        return ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
    };
    const validateForm = () => {
        const errors = [];
        const availableStatuses = getAvailableStatusOptions();
        if (formData.status && !availableStatuses.includes(formData.status)) {
            errors.push(`You don't have permission to set status to '${formData.status}'. Available options: ${availableStatuses.join(", ")}`);
        }
        if (user?.role === "MAINTENANCE_TEAM") {
            if (formData.status === "ASSIGNED" && complaint?.status !== "ASSIGNED") {
                errors.push("Maintenance team cannot set status back to 'Assigned'.");
            }
            if (formData.status === "REGISTERED") {
                errors.push("Maintenance team cannot set status to 'Registered'.");
            }
            if (formData.priority !== complaint?.priority) {
                errors.push("Maintenance team cannot change complaint priority. Contact your supervisor if needed.");
            }
        }
        const isComplaintFinalized = ["RESOLVED", "CLOSED"].includes(formData.status);
        if (user?.role === "WARD_OFFICER" && !isComplaintFinalized) {
            if (formData.status === "ASSIGNED" &&
                (!formData.maintenanceTeamId || formData.maintenanceTeamId === "none")) {
                errors.push("Please select a Maintenance Team member before setting status to 'Assigned'.");
            }
            if (complaint?.status === "REGISTERED" &&
                formData.status === "ASSIGNED" &&
                (!formData.maintenanceTeamId || formData.maintenanceTeamId === "none")) {
                errors.push("Please select a Maintenance Team member to assign this complaint.");
            }
            if (complaint?.needsTeamAssignment &&
                !formData.maintenanceTeamId &&
                formData.status !== "REGISTERED" &&
                !["RESOLVED", "CLOSED"].includes(complaint.status)) {
                errors.push("This complaint needs a maintenance team assignment. Please select a team member.");
            }
        }
        // Admin must pick a ward officer (new field) when assigning
        if (user?.role === "ADMINISTRATOR" && !isComplaintFinalized) {
            if (formData.status === "ASSIGNED" &&
                (!formData.wardOfficerId || formData.wardOfficerId === "none")) {
                errors.push("Please select a Ward Officer before assigning the complaint.");
            }
        }
        setValidationErrors(errors);
        return errors.length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!complaint)
            return;
        if (!validateForm())
            return;
        try {
            const updateData = { status: formData.status };
            if (user?.role !== "MAINTENANCE_TEAM")
                updateData.priority = formData.priority;
            if (user?.role === "WARD_OFFICER") {
                if (formData.maintenanceTeamId &&
                    formData.maintenanceTeamId !== "none") {
                    updateData.maintenanceTeamId = formData.maintenanceTeamId;
                }
            }
            else if (user?.role === "ADMINISTRATOR") {
                // Admin sets wardOfficerId (new primary field); keep assignedToId for backward compatibility
                if (formData.wardOfficerId && formData.wardOfficerId !== "none") {
                    updateData.wardOfficerId = formData.wardOfficerId;
                    // also set legacy assignedToId to preserve older expectations
                    updateData.assignedToId = formData.wardOfficerId;
                }
                if (formData.maintenanceTeamId &&
                    formData.maintenanceTeamId !== "none") {
                    updateData.maintenanceTeamId = formData.maintenanceTeamId;
                }
            }
            else {
                // fallback: include legacy assignedToId if present
                if (formData.assignedToId && formData.assignedToId !== "none")
                    updateData.assignedToId = formData.assignedToId;
            }
            if (formData.remarks && formData.remarks.trim())
                updateData.remarks = formData.remarks.trim();
            const updatedComplaintResponse = await updateComplaint({
                id: complaint.id,
                ...updateData,
            }).unwrap();
            toast({
                title: "Success",
                description: "Complaint updated successfully. You can see the updated assignment below.",
            });
            if (updatedComplaintResponse?.data) {
                const updatedComplaint = updatedComplaintResponse.data;
                const wardOfficerId = typeof updatedComplaint.wardOfficer === "object" &&
                    updatedComplaint.wardOfficer?.id
                    ? updatedComplaint.wardOfficer.id
                    : updatedComplaint.wardOfficer || "none";
                const assignedToId = typeof updatedComplaint.assignedTo === "object" &&
                    updatedComplaint.assignedTo?.id
                    ? updatedComplaint.assignedTo.id
                    : updatedComplaint.assignedTo || "none";
                const maintenanceTeamId = typeof updatedComplaint.maintenanceTeam === "object" &&
                    updatedComplaint.maintenanceTeam?.id
                    ? updatedComplaint.maintenanceTeam.id
                    : updatedComplaint.maintenanceTeam || "none";
                setFormData({
                    status: updatedComplaint.status,
                    priority: updatedComplaint.priority,
                    wardOfficerId,
                    assignedToId,
                    maintenanceTeamId,
                    remarks: "",
                });
            }
            onSuccess();
        }
        catch (error) {
            const message = error?.data?.message ||
                getApiErrorMessage(error) ||
                "Failed to update complaint";
            toast({ title: "Error", description: message, variant: "destructive" });
        }
    };
    const handleClose = () => {
        setFormData({
            status: "",
            priority: "",
            wardOfficerId: "none",
            assignedToId: "none",
            maintenanceTeamId: "none",
            remarks: "",
        });
        setSearchTerm("");
        setValidationErrors([]);
        onClose();
    };
    if (!complaint)
        return null;
    return (_jsx(Dialog, { open: isOpen, onOpenChange: handleClose, children: _jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2" }), user?.role === "MAINTENANCE_TEAM"
                                    ? "Update Task Status"
                                    : user?.role === "WARD_OFFICER"
                                        ? "Manage Complaint"
                                        : "Update Complaint"] }), _jsx(DialogDescription, { children: user?.role === "MAINTENANCE_TEAM"
                                ? `Update your work status for complaint #${complaint.complaintId || complaint.id.slice(-6)}`
                                : user?.role === "WARD_OFFICER"
                                    ? `Assign and manage complaint #${complaint.complaintId || complaint.id.slice(-6)}`
                                    : `Update the status and assignment of complaint #${complaint.complaintId || complaint.id.slice(-6)}` })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "h-4 w-4 text-blue-600 mr-2" }), _jsxs("span", { className: "text-sm font-medium text-blue-800", children: ["Acting as: ", user?.role?.replace("_", " ")] })] }), user?.role === "MAINTENANCE_TEAM" && (_jsx(Badge, { variant: "outline", className: "text-xs text-blue-600 border-blue-300", children: "Limited Permissions" }))] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsx("h3", { className: "font-medium mb-2", children: "Complaint Summary" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Type:" }), " ", complaint.type.replace("_", " ")] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Area:" }), " ", complaint.area] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Current Status:" }), " ", _jsx(Badge, { className: `ml-2 ${getStatusColor(complaint.status)}`, children: complaint.status.replace("_", " ") })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Current Priority:" }), " ", _jsx(Badge, { className: `ml-2 ${getPriorityColor(complaint.priority)}`, children: complaint.priority })] })] }), _jsxs("div", { className: "mt-2", children: [_jsx("span", { className: "text-gray-600", children: "Description:" }), _jsx("p", { className: "text-sm mt-1", children: complaint.description })] }), _jsxs("div", { className: "mt-4 pt-4 border-t border-gray-200", children: [_jsx("h4", { className: "font-medium text-sm mb-2", children: "Current Assignments" }), _jsxs("div", { className: "grid grid-cols-1 gap-2 text-sm", children: [process.env.NODE_ENV === "development" && (_jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded p-2 text-xs", children: [_jsx("strong", { children: "Debug:" }), _jsx("br", {}), "wardOfficer:", " ", JSON.stringify(complaint.wardOfficer) || "null", _jsx("br", {}), "maintenanceTeam:", " ", JSON.stringify(complaint.maintenanceTeam) || "null", _jsx("br", {}), "needsTeamAssignment:", " ", String(complaint.needsTeamAssignment)] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Ward Officer:" }), _jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "h-4 w-4 mr-1" }), complaint.wardOfficer ? (_jsx("span", { className: "text-blue-600", children: complaint.wardOfficer.fullName })) : (_jsx("span", { className: "text-gray-400", children: "Not assigned" }))] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Maintenance Team:" }), _jsxs("div", { className: "flex items-center", children: [_jsx(Settings, { className: "h-4 w-4 mr-1" }), complaint.maintenanceTeam ? (_jsx("span", { className: "text-green-600", children: complaint.maintenanceTeam.fullName })) : complaint.needsTeamAssignment ? (_jsx(Badge, { className: "bg-orange-100 text-orange-800 text-xs", children: "Needs Assignment" })) : (_jsx("span", { className: "text-gray-400", children: "Not assigned" }))] })] })] })] })] }), _jsxs("div", { className: `grid gap-4 ${user?.role === "MAINTENANCE_TEAM" ? "grid-cols-1" : "grid-cols-2"}`, children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "status", children: "Status" }), user?.role === "MAINTENANCE_TEAM" && (_jsx("p", { className: "text-xs text-gray-500 mb-1", children: "You can update status to In Progress or mark as Resolved" })), _jsxs(Select, { value: formData.status, onValueChange: (value) => {
                                                setFormData((prev) => ({ ...prev, status: value }));
                                                setValidationErrors([]);
                                            }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select status" }) }), _jsx(SelectContent, { children: getAvailableStatusOptions().map((status) => {
                                                        const statusConfig = {
                                                            REGISTERED: { icon: Clock, label: "Registered" },
                                                            ASSIGNED: { icon: User, label: "Assigned" },
                                                            IN_PROGRESS: { icon: Settings, label: "In Progress" },
                                                            RESOLVED: { icon: CheckCircle, label: "Resolved" },
                                                            CLOSED: { icon: FileText, label: "Closed" },
                                                            REOPENED: { icon: RotateCcw, label: "Reopened" },
                                                        };
                                                        const config = statusConfig[status];
                                                        if (!config)
                                                            return null;
                                                        const IconComponent = config.icon;
                                                        return (_jsx(SelectItem, { value: status, children: _jsxs("div", { className: "flex items-center", children: [_jsx(IconComponent, { className: "h-4 w-4 mr-2" }), config.label] }) }, status));
                                                    }) })] })] }), user?.role !== "MAINTENANCE_TEAM" && (_jsxs("div", { children: [_jsx(Label, { htmlFor: "priority", children: "Priority" }), _jsxs(Select, { value: formData.priority, onValueChange: (value) => setFormData((prev) => ({ ...prev, priority: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select priority" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "LOW", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 bg-green-500 rounded-full mr-2" }), "Low"] }) }), _jsx(SelectItem, { value: "MEDIUM", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 bg-yellow-500 rounded-full mr-2" }), "Medium"] }) }), _jsx(SelectItem, { value: "HIGH", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 bg-orange-500 rounded-full mr-2" }), "High"] }) }), _jsx(SelectItem, { value: "CRITICAL", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 bg-red-500 rounded-full mr-2" }), "Critical"] }) })] })] })] }))] }), (user?.role === "WARD_OFFICER" ||
                            user?.role === "ADMINISTRATOR") && (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "assignedTo", children: getDropdownLabel() }), user?.role === "WARD_OFFICER" &&
                                            complaint?.needsTeamAssignment &&
                                            !["RESOLVED", "CLOSED"].includes(complaint.status) && (_jsx(Badge, { className: "bg-blue-100 text-blue-800 text-xs", children: "Assignment Required" }))] }), user?.role === "WARD_OFFICER" &&
                                    complaint?.needsTeamAssignment &&
                                    !["RESOLVED", "CLOSED"].includes(complaint.status) && (_jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertTriangle, { className: "h-4 w-4 text-blue-500 mr-2" }), _jsx("span", { className: "text-sm text-blue-700", children: "This complaint needs to be assigned to a maintenance team member to proceed." })] }) })), _jsxs("div", { className: "space-y-2", children: [user?.role === "ADMINISTRATOR" ? (_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "Ward Officer" }), _jsxs(Select, { value: formData.wardOfficerId, onValueChange: (value) => {
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    wardOfficerId: value,
                                                                }));
                                                                setValidationErrors([]);
                                                            }, disabled: isLoadingWardOfficers || wardOfficerUsers.length === 0, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select Ward Officer" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "No Assignment" }), wardOfficerUsers.map((u) => (_jsx(SelectItem, { value: u.id, children: _jsxs("div", { className: "flex items-center justify-between w-full gap-2", children: [_jsxs("div", { className: "flex items-center", children: [getUserRoleIcon(u.role), _jsxs("div", { className: "ml-2 text-left", children: [_jsx("div", { className: "font-medium", children: u.fullName }), _jsx("div", { className: "text-xs text-gray-500", children: u.email })] })] }), _jsx(Badge, { variant: "outline", className: "text-xs", children: u.role.replace("_", " ") })] }) }, u.id)))] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Maintenance Team" }), _jsxs(Select, { value: formData.maintenanceTeamId, onValueChange: (value) => {
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    maintenanceTeamId: value,
                                                                }));
                                                                setValidationErrors([]);
                                                            }, disabled: isLoadingMaintenance || maintenanceUsers.length === 0, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select Maintenance Team" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "No Assignment" }), maintenanceUsers.map((u) => (_jsx(SelectItem, { value: u.id, children: _jsxs("div", { className: "flex items-center justify-between w-full gap-2", children: [_jsxs("div", { className: "flex items-center", children: [getUserRoleIcon(u.role), _jsxs("div", { className: "ml-2 text-left", children: [_jsx("div", { className: "font-medium", children: u.fullName }), _jsx("div", { className: "text-xs text-gray-500", children: u.email })] })] }), _jsx(Badge, { variant: "outline", className: "text-xs", children: u.role.replace("_", " ") })] }) }, u.id)))] })] })] })] })) : (_jsxs(Select, { value: user?.role === "WARD_OFFICER"
                                                ? formData.maintenanceTeamId
                                                : formData.wardOfficerId, onValueChange: (value) => {
                                                if (user?.role === "WARD_OFFICER")
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        maintenanceTeamId: value,
                                                    }));
                                                else
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        wardOfficerId: value,
                                                    }));
                                                setValidationErrors([]);
                                            }, disabled: availableUsers.length === 0, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: getDropdownLabel() }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: _jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "h-4 w-4 mr-2" }), "No Assignment"] }) }), filteredUsers.map((u) => (_jsx(SelectItem, { value: u.id, children: _jsxs("div", { className: "flex items-center justify-between w-full gap-2", children: [_jsxs("div", { className: "flex items-center", children: [getUserRoleIcon(u.role), _jsxs("div", { className: "ml-2 text-left", children: [_jsx("div", { className: "font-medium", children: u.fullName }), _jsx("div", { className: "text-xs text-gray-500", children: u.email })] })] }), _jsx(Badge, { variant: "outline", className: "text-xs", children: u.role.replace("_", " ") }), u.ward && (_jsx("div", { className: "text-xs text-blue-600", children: u.ward.name }))] }) }, u.id)))] })] })), (isLoadingWardOfficers || isLoadingMaintenance) && (_jsx("div", { className: "text-sm text-gray-500", children: "Loading users..." })), (wardOfficersError || maintenanceError) && (_jsx("div", { className: "text-sm text-red-500", children: "Error loading users. Please try again." }))] })] })), _jsxs("div", { children: [_jsx(Label, { htmlFor: "remarks", children: user?.role === "MAINTENANCE_TEAM"
                                        ? "Work Notes (Optional)"
                                        : "Remarks (Optional)" }), _jsx(Textarea, { id: "remarks", placeholder: user?.role === "MAINTENANCE_TEAM"
                                        ? "Add notes about work progress, issues encountered, or completion details..."
                                        : user?.role === "WARD_OFFICER"
                                            ? "Add notes about assignment, instructions, or status changes..."
                                            : "Add any additional comments or remarks about this update...", value: formData.remarks, onChange: (e) => setFormData((prev) => ({ ...prev, remarks: e.target.value })), rows: 3 })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: handleClose, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isUpdating, children: isUpdating
                                        ? "Updating..."
                                        : user?.role === "MAINTENANCE_TEAM"
                                            ? "Update Status"
                                            : user?.role === "WARD_OFFICER"
                                                ? "Save Changes"
                                                : "Update Complaint" })] })] })] }) }));
};
export default UpdateComplaintModal;
