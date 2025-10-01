import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useAppSelector } from "../store/hooks";
import { useUpdateComplaintStatusMutation, useAssignComplaintMutation, useUpdateComplaintMutation, useGetWardUsersQuery, } from "../store/api/complaintsApi";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { useToast } from "../hooks/use-toast";
import { AlertCircle, CheckCircle, Clock, User, UserCheck } from "lucide-react";
const COMPLAINT_STATUSES = [
    {
        value: "REGISTERED",
        label: "Registered",
        icon: AlertCircle,
        color: "bg-yellow-100 text-yellow-800",
    },
    {
        value: "ASSIGNED",
        label: "Assigned",
        icon: User,
        color: "bg-blue-100 text-blue-800",
    },
    {
        value: "IN_PROGRESS",
        label: "In Progress",
        icon: Clock,
        color: "bg-orange-100 text-orange-800",
    },
    {
        value: "RESOLVED",
        label: "Resolved",
        icon: CheckCircle,
        color: "bg-green-100 text-green-800",
    },
    {
        value: "CLOSED",
        label: "Closed",
        icon: CheckCircle,
        color: "bg-gray-100 text-gray-800",
    },
    {
        value: "REOPENED",
        label: "Reopened",
        icon: AlertCircle,
        color: "bg-purple-100 text-purple-800",
    },
];
const UNASSIGNED_ID = "unassigned";
const isComplaintStatus = (value) => COMPLAINT_STATUSES.some((status) => status.value === value);
const fromComplaintStatus = (status) => {
    if (typeof status === "string") {
        const normalized = status.toUpperCase();
        if (isComplaintStatus(normalized)) {
            return normalized;
        }
    }
    return COMPLAINT_STATUSES[0].value;
};
const toApiComplaintStatus = (status) => status.toLowerCase();
const ComplaintStatusUpdate = ({ complaint, isOpen, onClose, onSuccess, mode = "both", }) => {
    const { user } = useAppSelector((state) => state.auth);
    const { toast } = useToast();
    const [updateComplaintStatus, { isLoading: isUpdatingStatus }] = useUpdateComplaintStatusMutation();
    const [assignComplaint, { isLoading: isAssigning }] = useAssignComplaintMutation();
    const [updateComplaint] = useUpdateComplaintMutation();
    const [formData, setFormData] = useState(() => ({
        status: fromComplaintStatus(complaint.status),
        assignedTo: complaint.wardOfficer?.id || complaint.assignedTo?.id || UNASSIGNED_ID,
        remarks: "",
    }));
    useEffect(() => {
        setFormData({
            status: fromComplaintStatus(complaint.status),
            assignedTo: complaint.wardOfficer?.id || complaint.assignedTo?.id || UNASSIGNED_ID,
            remarks: "",
        });
    }, [
        complaint.assignedTo?.id,
        complaint.status,
        complaint.wardOfficer?.id,
    ]);
    const isLoading = isUpdatingStatus || isAssigning;
    const usersFilter = useMemo(() => {
        if (user?.role === "ADMINISTRATOR") {
            return { role: "WARD_OFFICER" };
        }
        if (user?.role === "WARD_OFFICER") {
            return { role: "MAINTENANCE_TEAM" };
        }
        return {};
    }, [user?.role]);
    const { data: usersResponse, isLoading: usersLoading } = useGetWardUsersQuery({
        page: 1,
        limit: 100,
        ...usersFilter,
    });
    const assignableUsers = usersResponse?.data?.users || [];
    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const previousStatus = fromComplaintStatus(complaint.status);
            const previousAssigneeId = complaint.wardOfficer?.id ||
                complaint.assignedTo?.id ||
                UNASSIGNED_ID;
            const isStatusUpdateAllowed = mode === "status" ||
                (mode === "both" && formData.status !== previousStatus);
            const isAssignmentUpdateAllowed = mode === "assign" ||
                (mode === "both" && formData.assignedTo !== previousAssigneeId);
            if (isStatusUpdateAllowed) {
                const statusPayload = formData.remarks
                    ? {
                        id: complaint.id,
                        status: toApiComplaintStatus(formData.status),
                        remarks: formData.remarks,
                    }
                    : {
                        id: complaint.id,
                        status: toApiComplaintStatus(formData.status),
                    };
                await updateComplaintStatus(statusPayload).unwrap();
            }
            if (isAssignmentUpdateAllowed) {
                const isUnassignedSelection = formData.assignedTo === UNASSIGNED_ID;
                if (user?.role === "WARD_OFFICER") {
                    const assignmentPayload = formData.remarks
                        ? {
                            id: complaint.id,
                            assignedTo: isUnassignedSelection ? "" : formData.assignedTo,
                            remarks: formData.remarks,
                        }
                        : {
                            id: complaint.id,
                            assignedTo: isUnassignedSelection ? "" : formData.assignedTo,
                        };
                    await assignComplaint(assignmentPayload).unwrap();
                }
                else if (user?.role === "ADMINISTRATOR") {
                    const updateData = {
                        id: complaint.id,
                    };
                    if (!isUnassignedSelection) {
                        updateData.wardOfficerId = formData.assignedTo;
                    }
                    if (formData.remarks) {
                        updateData.remarks = formData.remarks;
                    }
                    await updateComplaint(updateData).unwrap();
                }
            }
            toast({
                title: "Success",
                description: "Complaint updated successfully",
            });
            onSuccess?.();
            onClose();
        }
        catch (error) {
            const message = error?.data?.message ||
                getApiErrorMessage(error) ||
                "Failed to update complaint";
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            });
        }
    };
    const getStatusInfo = (status) => COMPLAINT_STATUSES.find((s) => s.value === status) ||
        COMPLAINT_STATUSES[0];
    const previousStatusInfo = getStatusInfo(fromComplaintStatus(complaint.status));
    const updatedStatusInfo = getStatusInfo(formData.status);
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(previousStatusInfo.icon, { className: "h-5 w-5" }), "Update Complaint #", complaint.complaintId || complaint.id.slice(-6)] }), _jsx(DialogDescription, { children: "Update the status and assignment for this complaint" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("h3", { className: "font-medium mb-2", children: "Complaint Summary" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("p", { children: [_jsx("strong", { children: "Type:" }), " ", complaint.type?.replace(/_/g, " ") || "-"] }), _jsxs("p", { children: [_jsx("strong", { children: "Area:" }), " ", complaint.area || "-"] }), _jsxs("p", { children: [_jsx("strong", { children: "Description:" }), " ", complaint.description || "-"] }), _jsxs("div", { className: "flex items-center gap-2 mt-2", children: [_jsx(Badge, { className: previousStatusInfo.color, children: previousStatusInfo.label }), (complaint.wardOfficer || complaint.assignedTo) && (_jsxs(Badge, { variant: "outline", className: "flex items-center gap-1", children: [_jsx(UserCheck, { className: "h-3 w-3" }), (complaint.wardOfficer || complaint.assignedTo)?.fullName] }))] })] })] }), (mode === "status" || mode === "both") && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "status", children: "Update Status" }), _jsxs(Select, { value: formData.status, onValueChange: (value) => {
                                        if (isComplaintStatus(value)) {
                                            setFormData((prev) => ({ ...prev, status: value }));
                                        }
                                    }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: COMPLAINT_STATUSES.filter((s) => s.value !== "REOPENED").map((status) => (_jsx(SelectItem, { value: status.value, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(status.icon, { className: "h-4 w-4" }), status.label] }) }, status.value))) })] }), formData.status !== fromComplaintStatus(complaint.status) && (_jsxs("div", { className: "text-sm text-blue-600 bg-blue-50 p-2 rounded", children: ["Status will change from", " ", _jsx("strong", { children: previousStatusInfo.label }), " to", " ", _jsx("strong", { children: updatedStatusInfo.label })] }))] })), (mode === "assign" || mode === "both") && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "assignedTo", children: user?.role === "ADMINISTRATOR"
                                        ? "Assign to Ward Officer"
                                        : "Assign to Team Member" }), _jsxs(Select, { value: formData.assignedTo, onValueChange: (value) => setFormData((prev) => ({ ...prev, assignedTo: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: user?.role === "ADMINISTRATOR"
                                                    ? "Select ward officer"
                                                    : "Select team member" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: UNASSIGNED_ID, children: "Unassigned" }), usersLoading ? (_jsx(SelectItem, { value: "loading", disabled: true, children: "Loading users..." })) : (assignableUsers.map((u) => (_jsx(SelectItem, { value: u.id, children: _jsx("div", { className: "flex justify-between items-center w-full", children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { children: u.fullName }), u.email && (_jsx("span", { className: "text-xs text-gray-500", children: u.email })), u.ward?.name && (_jsx("span", { className: "text-xs text-blue-600", children: u.ward.name }))] }) }) }, u.id))))] })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "remarks", children: "Remarks (Optional)" }), _jsx(Textarea, { id: "remarks", value: formData.remarks, onChange: (e) => setFormData((prev) => ({ ...prev, remarks: e.target.value })), placeholder: "Add any comments about this update...", rows: 3 })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isLoading, className: "min-w-[100px]", children: isLoading ? "Updating..." : "Update Complaint" })] })] })] }) }));
};
export default ComplaintStatusUpdate;
