import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintsQuery } from "../store/api/complaintsApi";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "./ui/table";
import { FileText, Calendar, MapPin, RefreshCw, Users, UserCheck, } from "lucide-react";
import ComplaintQuickActions from "./ComplaintQuickActions";
import UpdateComplaintModal from "./UpdateComplaintModal";
const ComplaintsListWidget = ({ filters, title = "Complaints", maxHeight = "400px", showActions = true, onComplaintUpdate, userRole, user, }) => {
    const { user: currentUser } = useAppSelector((state) => state.auth);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    // Use provided user or fall back to current user from store
    const effectiveUser = user || currentUser;
    const effectiveUserRole = userRole || effectiveUser?.role;
    // Build query params with ward filtering for Ward Officers
    const queryParams = useMemo(() => {
        const params = {
            ...filters,
            page: 1,
            limit: 50,
        };
        // Enforce officer-based filtering for Ward Officers
        if (effectiveUserRole === "WARD_OFFICER" && effectiveUser?.id) {
            params.officerId = effectiveUser.id;
        }
        return params;
    }, [filters, effectiveUserRole, effectiveUser?.id]);
    const { data: complaintsResponse, isLoading, error, refetch, } = useGetComplaintsQuery(queryParams);
    // Normalize response to array of complaints
    const complaints = Array.isArray(complaintsResponse?.data)
        ? complaintsResponse.data
        : [];
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
    // Get team assignment status based on maintenanceTeamId
    const getTeamAssignmentStatus = (complaint) => {
        if (complaint.maintenanceTeamId) {
            return {
                status: "Assigned",
                color: "bg-green-100 text-green-800",
                teamMember: complaint.maintenanceTeam?.fullName || "Unknown Team Member",
            };
        }
        else {
            return {
                status: "Needs Assignment",
                color: "bg-orange-100 text-orange-800",
                teamMember: null,
            };
        }
    };
    const hasFilters = Object.keys(filters).some((key) => filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== "" &&
        !(Array.isArray(filters[key]) && filters[key].length === 0));
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsxs("span", { className: "flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2" }), title, " (", complaintsResponse?.meta?.total ?? complaints.length, ")"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => refetch(), children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-1" }), "Refresh"] })] }) }), _jsx(CardContent, { children: error ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(FileText, { className: "h-12 w-12 mx-auto text-red-400 mb-4" }), _jsx("p", { className: "text-red-500 mb-2", children: "Failed to load complaints" }), _jsx(Button, { variant: "outline", onClick: () => refetch(), children: "Try Again" })] })) : isLoading ? (_jsx("div", { className: "space-y-4", children: [...Array(3)].map((_, i) => (_jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-3/4 mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-1/2" })] }, i))) })) : complaints.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(FileText, { className: "h-12 w-12 mx-auto text-gray-400 mb-4" }), _jsx("p", { className: "text-gray-500 mb-2", children: "No complaints found" }), _jsx("p", { className: "text-sm text-gray-400", children: hasFilters
                                ? "No complaints match the selected filters"
                                : "No complaints available" })] })) : (_jsx("div", { style: { maxHeight, overflowY: "auto" }, children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "ID" }), _jsx(TableHead, { children: "Description" }), _jsx(TableHead, { children: "Location" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Priority" }), effectiveUserRole === "WARD_OFFICER" && (_jsx(TableHead, { children: "Team " })), effectiveUserRole !== "WARD_OFFICER" && (_jsx(TableHead, { children: "Rating" })), effectiveUserRole !== "WARD_OFFICER" && (_jsx(TableHead, { children: "SLA" })), effectiveUserRole !== "WARD_OFFICER" && (_jsx(TableHead, { children: "Closed" })), _jsx(TableHead, { children: "Updated" }), _jsx(TableHead, { children: "Date" }), showActions && _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: complaints.map((complaint) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { className: "font-medium", children: ["#", complaint.complaintId || complaint.id.slice(-6)] }), _jsx(TableCell, { children: _jsxs("div", { className: "max-w-xs", children: [_jsx("p", { className: "truncate", title: complaint.description, children: complaint.description }), _jsx("p", { className: "text-sm text-gray-500", children: complaint.type?.replace("_", " ") || "N/A" })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center text-sm", children: [_jsx(MapPin, { className: "h-3 w-3 mr-1" }), complaint.area || "N/A"] }) }), _jsx(TableCell, { children: _jsx(Badge, { className: getStatusColor(complaint.status), children: complaint.status?.replace("_", " ") || "Unknown" }) }), _jsx(TableCell, { children: _jsx(Badge, { className: getPriorityColor(complaint.priority), children: complaint.priority || "N/A" }) }), effectiveUserRole === "WARD_OFFICER" && (_jsx(_Fragment, { children: _jsx(TableCell, { children: (() => {
                                                    const assignment = getTeamAssignmentStatus(complaint);
                                                    return assignment.teamMember ? (_jsxs("div", { className: "flex items-center text-sm width-fit-content", children: [_jsx(UserCheck, { className: "h-3 w-3 mr-1" }), assignment.teamMember] })) : (_jsxs("div", { className: "flex items-center text-sm text-gray-500", children: [_jsx(Users, { className: "h-3 w-3 mr-1" }), "Not assigned"] }));
                                                })() }) })), effectiveUserRole !== "WARD_OFFICER" && (_jsxs(_Fragment, { children: [_jsx(TableCell, { children: typeof complaint.rating === "number" &&
                                                        complaint.rating > 0 ? (_jsxs("span", { className: "text-sm font-medium", children: [complaint.rating, "/5"] })) : (_jsx("span", { className: "text-xs text-gray-500", children: "N/A" })) }), _jsx(TableCell, { children: _jsx(Badge, { className: (complaint.slaStatus === "OVERDUE" &&
                                                            "bg-red-100 text-red-800") ||
                                                            (complaint.slaStatus === "WARNING" &&
                                                                "bg-yellow-100 text-yellow-800") ||
                                                            (complaint.slaStatus === "ON_TIME" &&
                                                                "bg-green-100 text-green-800") ||
                                                            "bg-gray-100 text-gray-800", children: complaint.slaStatus?.replace("_", " ") || "N/A" }) }), _jsx(TableCell, { children: complaint.closedOn ? (_jsx("span", { className: "text-sm", children: new Date(complaint.closedOn).toLocaleDateString() })) : (_jsx("span", { className: "text-xs text-gray-500", children: "-" })) })] })), _jsx(TableCell, { children: complaint.updatedAt ? (_jsx("span", { className: "text-sm", children: new Date(complaint.updatedAt).toLocaleDateString() })) : (_jsx("span", { className: "text-xs text-gray-500", children: "-" })) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center text-sm", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), complaint.submittedOn
                                                        ? new Date(complaint.submittedOn).toLocaleDateString()
                                                        : "N/A"] }) }), showActions && (_jsx(TableCell, { children: _jsx("div", { className: "flex items-center gap-1", children: _jsx(ComplaintQuickActions, { complaint: {
                                                        id: complaint.id,
                                                        complaintId: complaint.complaintId,
                                                        status: complaint.status,
                                                        priority: complaint.priority,
                                                        type: complaint.type,
                                                        description: complaint.description,
                                                        area: complaint.area,
                                                        assignedTo: complaint.assignedTo,
                                                    }, userRole: effectiveUserRole || "WARD_OFFICER", showDetails: false, onUpdate: () => {
                                                        refetch();
                                                        onComplaintUpdate?.();
                                                    }, onShowUpdateModal: () => {
                                                        setSelectedComplaint(complaint);
                                                        setIsUpdateModalOpen(true);
                                                    } }) }) }))] }, complaint.id))) })] }) })) }), _jsx(UpdateComplaintModal, { complaint: selectedComplaint, isOpen: isUpdateModalOpen, onClose: () => {
                    setIsUpdateModalOpen(false);
                    setSelectedComplaint(null);
                }, onSuccess: () => {
                    setIsUpdateModalOpen(false);
                    setSelectedComplaint(null);
                    refetch();
                    onComplaintUpdate?.();
                } })] }));
};
export default ComplaintsListWidget;
