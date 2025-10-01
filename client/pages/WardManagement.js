import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintsQuery } from "../store/api/complaintsApi";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "../components/ui/tabs";
import ComplaintQuickActions from "../components/ComplaintQuickActions";
import UpdateComplaintModal from "../components/UpdateComplaintModal";
import { MapPin, BarChart3, Settings, TrendingUp, AlertTriangle, CheckCircle, FileText, Clock, Calendar, } from "lucide-react";
const WardManagement = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState("overview");
    // State for Update Complaint Modal
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    // Fetch complaints for the ward officer
    const { data: complaintsResponse, isLoading: complaintsLoading, refetch: refetchComplaints, } = useGetComplaintsQuery({
        page: 1,
        limit: 100,
        officerId: user?.id,
    });
    const complaints = Array.isArray(complaintsResponse?.data?.complaints)
        ? complaintsResponse.data.complaints
        : [];
    // Calculate real stats from complaint data
    const wardStats = {
        totalComplaints: complaints.length,
        resolved: complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length,
        pending: complaints.filter((c) => c.status === "REGISTERED" ||
            c.status === "ASSIGNED" ||
            c.status === "IN_PROGRESS").length,
        inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
        resolutionRate: complaints.length > 0
            ? Math.round((complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length /
                complaints.length) *
                100)
            : 0,
    };
    // Group complaints by sub-zone if available
    const complaintsByArea = complaints.reduce((acc, complaint) => {
        const area = complaint.area || "Unknown Area";
        if (!acc[area]) {
            acc[area] = {
                name: area,
                complaints: 0,
                resolved: 0,
                pending: 0,
            };
        }
        acc[area].complaints++;
        if (complaint.status === "RESOLVED" || complaint.status === "CLOSED") {
            acc[area].resolved++;
        }
        else {
            acc[area].pending++;
        }
        return acc;
    }, {});
    const subZones = Object.values(complaintsByArea);
    // Priority complaints that need attention
    const priorityComplaints = complaints
        .filter((c) => c.priority === "HIGH" ||
        c.priority === "CRITICAL" ||
        c.status === "REGISTERED")
        .slice(0, 10);
    if (complaintsLoading) {
        return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-8 bg-gray-200 rounded w-1/3 mb-4" }), _jsx("div", { className: "h-4 bg-gray-200 rounded w-1/2 mb-8" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [...Array(4)].map((_, i) => (_jsx("div", { className: "h-24 bg-gray-200 rounded" }, i))) })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Ward Management" }), _jsxs("p", { className: "text-gray-600", children: ["Overview and management of ", user?.ward?.name || "your ward"] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { onClick: () => refetchComplaints(), children: [_jsx(TrendingUp, { className: "h-4 w-4 mr-2" }), "Refresh Data"] }), _jsx(Link, { to: "/complaints", children: _jsxs(Button, { variant: "outline", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "View All Complaints"] }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Complaints" }), _jsx("p", { className: "text-2xl font-bold", children: wardStats.totalComplaints })] }), _jsx(BarChart3, { className: "h-8 w-8 text-blue-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Resolved" }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: wardStats.resolved })] }), _jsx(CheckCircle, { className: "h-8 w-8 text-green-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Pending" }), _jsx("p", { className: "text-2xl font-bold text-yellow-600", children: wardStats.pending })] }), _jsx(AlertTriangle, { className: "h-8 w-8 text-yellow-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "In Progress" }), _jsx("p", { className: "text-2xl font-bold text-orange-600", children: wardStats.inProgress })] }), _jsx(Clock, { className: "h-8 w-8 text-orange-600" })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(TrendingUp, { className: "h-5 w-5 mr-2" }), "Ward Performance"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsx("span", { children: "Resolution Rate" }), _jsxs("span", { children: [wardStats.resolutionRate, "%"] })] }), _jsx(Progress, { value: wardStats.resolutionRate, className: "h-2" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mt-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: "2.3" }), _jsx("p", { className: "text-sm text-gray-600", children: "Avg. Resolution Days" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: "95%" }), _jsx("p", { className: "text-sm text-gray-600", children: "Citizen Satisfaction" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: "28" }), _jsx("p", { className: "text-sm text-gray-600", children: "Active Team Members" })] })] })] }) })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "space-y-6", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "priority", children: "Priority Complaints" }), _jsx(TabsTrigger, { value: "areas", children: "Areas" })] }), _jsx(TabsContent, { value: "overview", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(TrendingUp, { className: "h-5 w-5 mr-2" }), "Ward Performance"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsx("span", { children: "Resolution Rate" }), _jsxs("span", { children: [wardStats.resolutionRate, "%"] })] }), _jsx(Progress, { value: wardStats.resolutionRate, className: "h-2" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4 mt-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: wardStats.totalComplaints }), _jsx("p", { className: "text-sm text-gray-600", children: "Total Complaints" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: wardStats.resolved }), _jsx("p", { className: "text-sm text-gray-600", children: "Resolved" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: wardStats.pending }), _jsx("p", { className: "text-sm text-gray-600", children: "Pending" })] })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Settings, { className: "h-5 w-5 mr-2" }), "Quick Actions"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 gap-3", children: [_jsx(Link, { to: "/complaints?status=REGISTERED", children: _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(AlertTriangle, { className: "h-4 w-4 mr-2" }), "New Complaints (", complaints.filter((c) => c.status === "REGISTERED")
                                                                    .length, ")"] }) }), _jsx(Link, { to: "/complaints?status=IN_PROGRESS", children: _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Clock, { className: "h-4 w-4 mr-2" }), "In Progress (", wardStats.inProgress, ")"] }) }), _jsx(Link, { to: "/complaints?priority=HIGH,CRITICAL", children: _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(AlertTriangle, { className: "h-4 w-4 mr-2" }), "High Priority (", complaints.filter((c) => c.priority === "HIGH" || c.priority === "CRITICAL").length, ")"] }) }), _jsx(Link, { to: "/complaints", children: _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "All Complaints"] }) })] }) })] })] }) }), _jsx(TabsContent, { value: "priority", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(AlertTriangle, { className: "h-5 w-5 mr-2" }), "Priority Complaints Requiring Attention"] }) }), _jsx(CardContent, { children: priorityComplaints.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(CheckCircle, { className: "h-12 w-12 mx-auto text-green-400 mb-4" }), _jsx("p", { className: "text-gray-500", children: "No priority complaints requiring attention" })] })) : (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "ID" }), _jsx(TableHead, { children: "Type" }), _jsx(TableHead, { children: "Area" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Priority" }), _jsx(TableHead, { children: "Date" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: priorityComplaints.map((complaint) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { className: "font-medium", children: ["#", complaint.complaintId || complaint.id.slice(-6)] }), _jsx(TableCell, { children: complaint.type.replace("_", " ") }), _jsx(TableCell, { children: complaint.area }), _jsx(TableCell, { children: _jsx(Badge, { className: complaint.status === "REGISTERED"
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : "bg-blue-100 text-blue-800", children: complaint.status.replace("_", " ") }) }), _jsx(TableCell, { children: _jsx(Badge, { className: complaint.priority === "CRITICAL"
                                                                    ? "bg-red-100 text-red-800"
                                                                    : "bg-orange-100 text-orange-800", children: complaint.priority }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center text-sm", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), new Date(complaint.submittedOn).toLocaleDateString()] }) }), _jsx(TableCell, { children: _jsx(ComplaintQuickActions, { complaint: {
                                                                    id: complaint.id,
                                                                    complaintId: complaint.complaintId,
                                                                    status: complaint.status,
                                                                    priority: complaint.priority,
                                                                    type: complaint.type,
                                                                    description: complaint.description,
                                                                    area: complaint.area,
                                                                    assignedTo: complaint.assignedTo,
                                                                }, userRole: user?.role || "", showDetails: false, onUpdate: () => refetchComplaints(), onShowUpdateModal: (complaint) => {
                                                                    setSelectedComplaint(complaint);
                                                                    setIsUpdateModalOpen(true);
                                                                } }) })] }, complaint.id))) })] })) })] }) }), _jsx(TabsContent, { value: "areas", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(MapPin, { className: "h-5 w-5 mr-2" }), "Complaints by Area"] }) }), _jsx(CardContent, { children: subZones.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(MapPin, { className: "h-12 w-12 mx-auto text-gray-400 mb-4" }), _jsx("p", { className: "text-gray-500", children: "No complaint data available" })] })) : (_jsx("div", { className: "space-y-4", children: subZones.map((zone, index) => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h3", { className: "font-medium", children: zone.name }), _jsxs(Badge, { variant: "secondary", children: [zone.complaints, " complaints"] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [_jsx("div", { children: _jsxs("p", { className: "text-gray-600", children: ["Total: ", zone.complaints] }) }), _jsx("div", { children: _jsxs("p", { className: "text-gray-600", children: ["Resolved: ", zone.resolved] }) }), _jsx("div", { children: _jsxs("p", { className: "text-gray-600", children: ["Pending: ", zone.pending] }) })] }), _jsx("div", { className: "mt-2", children: _jsx(Progress, { value: zone.complaints > 0
                                                            ? (zone.resolved / zone.complaints) * 100
                                                            : 0, className: "h-2" }) }), _jsx("div", { className: "mt-3 flex justify-end", children: _jsx(Link, { to: `/complaints?area=${encodeURIComponent(zone.name)}`, children: _jsx(Button, { variant: "outline", size: "sm", children: "View Complaints" }) }) })] }, index))) })) })] }) })] }), _jsx(UpdateComplaintModal, { complaint: selectedComplaint, isOpen: isUpdateModalOpen, onClose: () => {
                    setIsUpdateModalOpen(false);
                    setSelectedComplaint(null);
                }, onSuccess: () => {
                    setIsUpdateModalOpen(false);
                    setSelectedComplaint(null);
                    refetchComplaints();
                } })] }));
};
export default WardManagement;
