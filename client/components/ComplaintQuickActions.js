import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, } from "./ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, UserPlus, CheckCircle, Clock, FileText, } from "lucide-react";
const ComplaintQuickActions = ({ complaint, userRole, showDetails = true, onUpdate, onShowUpdateModal, }) => {
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
    const canManageComplaint = userRole === "WARD_OFFICER" || userRole === "ADMINISTRATOR";
    const canAssign = userRole === "WARD_OFFICER" || userRole === "ADMINISTRATOR";
    const isMaintenanceTeam = userRole === "MAINTENANCE_TEAM";
    return (_jsx(_Fragment, { children: _jsxs("div", { className: "flex items-center gap-2", children: [showDetails && (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx(Badge, { className: getStatusColor(complaint.status), variant: "secondary", children: complaint.status.replace("_", " ") }), _jsx(Badge, { className: getPriorityColor(complaint.priority), variant: "outline", children: complaint.priority })] })), _jsxs("div", { className: "flex items-center gap-1", children: [(() => {
                            const to = isMaintenanceTeam
                                ? `/tasks/${complaint.id}`
                                : `/complaints/${complaint.id}`;
                            return (_jsx(Link, { to: to, children: _jsx(Button, { size: "sm", variant: "outline", title: "View Details", children: _jsx(Eye, { className: "h-3 w-3" }) }) }));
                        })(), canManageComplaint && (_jsxs(_Fragment, { children: [complaint.status === "REGISTERED" && (_jsx(Button, { size: "sm", variant: "outline", onClick: () => onShowUpdateModal?.(complaint), title: "Assign Complaint", className: "text-blue-600 hover:text-blue-700", children: _jsx(UserPlus, { className: "h-3 w-3" }) })), complaint.status === "ASSIGNED" && (_jsx(Button, { size: "sm", variant: "outline", onClick: () => onShowUpdateModal?.(complaint), title: "Start Progress", className: "text-orange-600 hover:text-orange-700", children: _jsx(Clock, { className: "h-3 w-3" }) })), complaint.status === "IN_PROGRESS" && (_jsx(Button, { size: "sm", variant: "outline", onClick: () => onShowUpdateModal?.(complaint), title: "Mark Resolved", className: "text-green-600 hover:text-green-700", children: _jsx(CheckCircle, { className: "h-3 w-3" }) }))] })), isMaintenanceTeam && (_jsxs(_Fragment, { children: [complaint.status === "ASSIGNED" && (_jsxs(Button, { size: "sm", onClick: () => onShowUpdateModal?.(complaint), title: "Start Work", className: "text-orange-600 hover:text-orange-700", children: [_jsx(Clock, { className: "h-3 w-3 mr-1" }), "Start"] })), complaint.status === "IN_PROGRESS" && (_jsxs(Button, { size: "sm", onClick: () => onShowUpdateModal?.(complaint), title: "Mark Resolved", className: "text-green-600 hover:text-green-700", children: [_jsx(CheckCircle, { className: "h-3 w-3 mr-1" }), "Complete"] }))] })), (canManageComplaint || isMaintenanceTeam) && (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { size: "sm", variant: "outline", children: _jsx(MoreHorizontal, { className: "h-3 w-3" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [onShowUpdateModal && canManageComplaint && (_jsxs(_Fragment, { children: [_jsxs(DropdownMenuItem, { onClick: () => onShowUpdateModal(complaint), children: [_jsx(Edit, { className: "h-4 w-4 mr-2" }), "Update Complaint"] }), _jsx(DropdownMenuSeparator, {})] })), onShowUpdateModal && isMaintenanceTeam && (_jsxs(_Fragment, { children: [_jsxs(DropdownMenuItem, { onClick: () => onShowUpdateModal(complaint), children: [_jsx(Edit, { className: "h-4 w-4 mr-2" }), "Update Status"] }), _jsx(DropdownMenuSeparator, {})] })), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: isMaintenanceTeam ? `/tasks/${complaint.id}` : `/complaints/${complaint.id}`, children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "View Full Details"] }) })] })] }))] })] }) }));
};
export default ComplaintQuickActions;
