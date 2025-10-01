import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import { useGetComplaintsQuery, useGetComplaintStatisticsQuery, } from "../store/api/complaintsApi";
import { formatDate } from "../lib/dateUtils";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../components/ui/table";
import { PlusCircle, FileText, Clock, CheckCircle, AlertTriangle, MapPin, Calendar, Search, Filter, Eye, Star, RefreshCw, } from "lucide-react";
import FeedbackDialog from "../components/FeedbackDialog";
import QuickComplaintModal from "../components/QuickComplaintModal";
import ContactInfoCard from "../components/ContactInfoCard";
const CitizenDashboard = () => {
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const { translations } = useAppSelector((state) => state.language);
    const { complaintTypeOptions } = useComplaintTypes();
    // Set document title
    useDocumentTitle("Dashboard");
    // Debug: Log authentication state
    console.log("Authentication state:", {
        user: !!user,
        isAuthenticated,
        userId: user?.id,
    });
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    // Use RTK Query for better authentication handling
    const { data: complaintsResponse, isLoading: complaintsLoading, error: complaintsError, refetch: refetchComplaints, } = useGetComplaintsQuery({ page: 1, limit: 50 }, // Get more complaints for better stats
    { skip: !isAuthenticated || !user });
    const { data: statsResponse, isLoading: statsLoading, refetch: refetchStats, } = useGetComplaintStatisticsQuery({}, { skip: !isAuthenticated || !user });
    // Debug: Log raw API responses
    console.log("Raw API responses:", {
        complaintsResponse,
        statsResponse,
        complaintsResponseKeys: complaintsResponse
            ? Object.keys(complaintsResponse)
            : null,
        statsResponseKeys: statsResponse ? Object.keys(statsResponse) : null,
    });
    // Extract complaints from the actual API response structure
    // Backend returns: { success: true, data: { complaints: [...], pagination: {...} } }
    const complaints = Array.isArray(complaintsResponse?.data?.complaints)
        ? complaintsResponse.data.complaints
        : [];
    console.log("Extracted complaints:", complaints);
    console.log("Complaints count:", complaints.length);
    const pagination = complaintsResponse?.data?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
    };
    const isLoading = complaintsLoading;
    const [dashboardStats, setDashboardStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        avgResolutionTime: 0,
        resolutionRate: 0,
    });
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
    const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all");
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "submittedOn");
    const [sortOrder, setSortOrder] = useState(searchParams.get("order") || "desc");
    const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
    // Handler functions
    const handleRefresh = () => {
        refetchComplaints();
        refetchStats();
    };
    const handleSearch = (e) => {
        e.preventDefault();
        // Update URL params to trigger re-fetch
        const params = new URLSearchParams();
        if (searchTerm)
            params.set("search", searchTerm);
        if (statusFilter && statusFilter !== "all")
            params.set("status", statusFilter);
        if (typeFilter && typeFilter !== "all")
            params.set("type", typeFilter);
        if (sortBy)
            params.set("sort", sortBy);
        if (sortOrder)
            params.set("order", sortOrder);
        navigate(`/dashboard?${params.toString()}`);
    };
    const clearAllFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setTypeFilter("all");
        setSortBy("submittedOn");
        setSortOrder("desc");
        // Navigate to dashboard without any query parameters
        navigate("/dashboard");
    };
    // Fetch complaints when user is available or filters change
    useEffect(() => {
        // Debug: Log the actual data we're receiving
        console.log("Dashboard data debug:", {
            statsResponse: statsResponse?.data,
            complaintsCount: complaints.length,
            complaintStatuses: complaints.map((c) => c.status),
            complaintsData: complaints.slice(0, 2), // Log first 2 complaints for inspection
        });
        // Calculate dashboard statistics from complaints or use stats API
        if (statsResponse?.data?.stats) {
            // Use API stats if available
            const stats = statsResponse.data.stats;
            const total = stats.total || 0;
            const pending = stats.byStatus?.REGISTERED || stats.byStatus?.registered || 0;
            const inProgress = stats.byStatus?.IN_PROGRESS || stats.byStatus?.in_progress || 0;
            const resolved = stats.byStatus?.RESOLVED || stats.byStatus?.resolved || 0;
            const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
            console.log("Using API stats:", {
                stats,
                total,
                pending,
                inProgress,
                resolved,
                resolutionRate,
            });
            setDashboardStats({
                total,
                pending,
                inProgress,
                resolved,
                avgResolutionTime: stats.avgResolutionTimeHours || 0,
                resolutionRate,
            });
        }
        else {
            // Calculate from complaints list as fallback
            const total = complaints.length;
            console.log("Fallback calculation - analyzing complaints:", complaints.map((c) => ({
                id: c.id,
                status: c.status,
                type: typeof c.status,
            })));
            const pending = complaints.filter((c) => c.status === "registered" || c.status === "REGISTERED").length;
            const inProgress = complaints.filter((c) => c.status === "in_progress" || c.status === "IN_PROGRESS").length;
            const resolved = complaints.filter((c) => c.status === "resolved" ||
                c.status === "RESOLVED" ||
                c.status === "closed" ||
                c.status === "CLOSED").length;
            const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
            console.log("Using fallback calculation:", {
                total,
                pending,
                inProgress,
                resolved,
                resolutionRate,
            });
            setDashboardStats({
                total,
                pending,
                inProgress,
                resolved,
                avgResolutionTime: 0, // Will be calculated by backend stats API
                resolutionRate,
            });
        }
    }, [complaints, statsResponse]);
    const getStatusColor = (status) => {
        const normalizedStatus = status.toUpperCase();
        switch (normalizedStatus) {
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
    const getComplaintTypeLabel = (type) => {
        // Convert type to readable format
        return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    };
    const isResolved = (status) => {
        const normalizedStatus = status.toUpperCase();
        return normalizedStatus === "RESOLVED" || normalizedStatus === "CLOSED";
    };
    const recentComplaints = complaints.slice(0, 5);
    // Show error state if there's an authentication error
    if (complaintsError &&
        "status" in complaintsError &&
        complaintsError.status === 401) {
        return (_jsxs("div", { className: "text-center py-8", children: [_jsxs("div", { className: "text-red-600 mb-4", children: [_jsx("h2", { className: "text-xl font-semibold mb-2", children: "Authentication Error" }), _jsx("p", { children: "Please log in again to access your dashboard." })] }), _jsx(Link, { to: "/login", children: _jsx(Button, { children: "Go to Login" }) })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold mb-2", children: ["\uD83D\uDE80 Welcome back, ", user?.fullName || "Citizen", "! \uD83D\uDC4B"] }), _jsx("p", { className: "text-blue-100", children: "Track your complaints and stay updated with the latest progress." })] }), _jsx("div", { className: "hidden md:flex items-center space-x-4", children: _jsxs(Button, { onClick: () => setIsQuickFormOpen(true), className: "bg-white text-blue-600 hover:bg-gray-50", children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "New Complaint"] }) })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Complaints" }), _jsx(FileText, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: dashboardStats.total }), _jsx("p", { className: "text-xs text-muted-foreground", children: "All time submissions" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Pending" }), _jsx(Clock, { className: "h-4 w-4 text-yellow-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-yellow-600", children: dashboardStats.pending }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Awaiting assignment" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "In Progress" }), _jsx(AlertTriangle, { className: "h-4 w-4 text-orange-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: dashboardStats.inProgress }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Being worked on" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Resolved" }), _jsx(CheckCircle, { className: "h-4 w-4 text-green-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: dashboardStats.resolved }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Successfully resolved" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Resolution Progress" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Overall Resolution Rate" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [dashboardStats.resolved, " of ", dashboardStats.total, " complaints"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [dashboardStats.resolutionRate, "%"] })] }), _jsx(Progress, { value: dashboardStats.resolutionRate, className: "h-2" })] }), dashboardStats.avgResolutionTime > 0 && (_jsxs("div", { className: "flex items-center justify-between text-sm text-muted-foreground", children: [_jsx("span", { children: "Average Resolution Time" }), _jsxs("span", { children: [dashboardStats.avgResolutionTime, " days"] })] }))] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-lg", children: "My Complaints" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: handleRefresh, children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Refresh"] }), _jsxs(Button, { onClick: () => setIsQuickFormOpen(true), size: "sm", children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "New Complaint"] })] })] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "space-y-4 mb-6", children: [_jsxs("form", { onSubmit: handleSearch, className: "flex gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" }), _jsx(Input, { placeholder: "Search by ID, description, or location...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10", title: "Search by complaint ID (e.g., KSC0001), description, or location" }), searchTerm && (_jsx("div", { className: "absolute right-3 top-1/2 transform -translate-y-1/2", children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setSearchTerm(""), className: "h-4 w-4 p-0 hover:bg-gray-200", children: "\u00D7" }) }))] }) }), _jsx(Button, { type: "submit", variant: "outline", children: _jsx(Search, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "flex flex-wrap gap-4", children: [_jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsx(SelectTrigger, { className: "w-40", children: _jsx(SelectValue, { placeholder: "All Status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "REGISTERED", children: "Registered" }), _jsx(SelectItem, { value: "ASSIGNED", children: "Assigned" }), _jsx(SelectItem, { value: "IN_PROGRESS", children: "In Progress" }), _jsx(SelectItem, { value: "RESOLVED", children: "Resolved" }), _jsx(SelectItem, { value: "CLOSED", children: "Closed" })] })] }), _jsxs(Select, { value: typeFilter, onValueChange: setTypeFilter, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, { placeholder: "All Types" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), complaintTypeOptions.map((type) => (_jsx(SelectItem, { value: type.value, children: type.label }, type.value)))] })] }), _jsxs(Select, { value: `${sortBy}-${sortOrder}`, onValueChange: (value) => {
                                                    const [newSortBy, newSortOrder] = value.split("-");
                                                    setSortBy(newSortBy);
                                                    setSortOrder(newSortOrder);
                                                }, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, { placeholder: "Sort by" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "submittedOn-desc", children: "Newest First" }), _jsx(SelectItem, { value: "submittedOn-asc", children: "Oldest First" }), _jsx(SelectItem, { value: "priority-desc", children: "High Priority First" }), _jsx(SelectItem, { value: "status-asc", children: "Status" })] })] }), (searchTerm ||
                                                (statusFilter && statusFilter !== "all") ||
                                                (typeFilter && typeFilter !== "all")) && (_jsxs(Button, { variant: "ghost", onClick: clearAllFilters, children: [_jsx(Filter, { className: "h-4 w-4 mr-2" }), "Clear Filters"] }))] })] }), isLoading ? (_jsxs("div", { className: "flex items-center justify-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }), _jsx("span", { className: "ml-2", children: "Loading complaints..." })] })) : complaints.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(FileText, { className: "h-12 w-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No complaints found" }), _jsx("p", { className: "text-gray-500 mb-4", children: searchTerm || statusFilter || typeFilter
                                            ? "No complaints match your current filters."
                                            : "You haven't submitted any complaints yet." }), _jsxs(Button, { onClick: () => navigate("/complaints/citizen-form"), children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "Submit Your First Complaint"] })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "md:hidden space-y-4", children: complaints.map((complaint) => (_jsx(Card, { className: "p-4", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-medium text-sm", children: complaint.title }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["ID: ", complaint.complaintId || complaint.id] })] }), _jsx(Badge, { className: getStatusColor(complaint.status), children: complaint.status.replace("_", " ") })] }), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500", children: [_jsx("span", { children: getComplaintTypeLabel(complaint.type) }), _jsx("span", { children: formatDate(complaint.submittedOn) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "outline", className: getPriorityColor(complaint.priority), children: complaint.priority }), complaint.ward && (_jsxs("div", { className: "flex items-center text-xs text-gray-500", children: [_jsx(MapPin, { className: "h-3 w-3 mr-1" }), complaint.ward.name] }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => navigate(`/complaints/${complaint.id}`), className: "flex-1", children: [_jsx(Eye, { className: "h-4 w-4 mr-1" }), "View"] }), isResolved(complaint.status) && (_jsx(FeedbackDialog, { complaintId: complaint.id, complaintTitle: complaint.title, isResolved: isResolved(complaint.status), existingFeedback: complaint.rating
                                                                    ? {
                                                                        rating: complaint.rating,
                                                                        comment: complaint.citizenFeedback || "",
                                                                    }
                                                                    : null, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Star, { className: "h-4 w-4 mr-1" }), complaint.rating ? "Update" : "Rate"] }) }))] })] }) }, complaint.id))) }), _jsx("div", { className: "hidden md:block", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "ID" }), _jsx(TableHead, { children: "Title" }), _jsx(TableHead, { children: "Type" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Priority" }), _jsx(TableHead, { children: "Location" }), _jsx(TableHead, { children: "Submitted" }), _jsx(TableHead, { children: "Rating" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: complaints.map((complaint) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-mono text-xs", children: (complaint.complaintId ?? complaint.id)
                                                                    ? (complaint.complaintId ?? complaint.id).slice(-8)
                                                                    : "-" }), _jsx(TableCell, { children: _jsxs("div", { className: "max-w-48", children: [_jsx("div", { className: "font-medium text-sm truncate", children: complaint.title }), complaint.description && (_jsxs("div", { className: "text-xs text-gray-500 truncate", children: [complaint.description.slice(0, 50), "..."] }))] }) }), _jsx(TableCell, { children: _jsx("span", { className: "text-sm", children: getComplaintTypeLabel(complaint.type) }) }), _jsx(TableCell, { children: _jsx(Badge, { className: getStatusColor(complaint.status), children: complaint.status.replace("_", " ") }) }), _jsx(TableCell, { children: _jsx(Badge, { variant: "outline", className: getPriorityColor(complaint.priority), children: complaint.priority }) }), _jsx(TableCell, { children: complaint.ward && (_jsxs("div", { className: "flex items-center text-sm", children: [_jsx(MapPin, { className: "h-3 w-3 mr-1" }), complaint.ward.name] })) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center text-sm", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDate(complaint.submittedOn)] }) }), _jsx(TableCell, { children: complaint.rating ? (_jsxs("div", { className: "flex items-center", children: [_jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" }), _jsxs("span", { className: "text-sm", children: [complaint.rating, "/5"] })] })) : isResolved(complaint.status) ? (_jsx("span", { className: "text-xs text-gray-500", children: "Not rated" })) : (_jsx("span", { className: "text-xs text-gray-400", children: "\u2014" })) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate(`/complaints/${complaint.id}`), children: _jsx(Eye, { className: "h-4 w-4" }) }), isResolved(complaint.status) && (_jsx(FeedbackDialog, { complaintId: complaint.id, complaintTitle: complaint.title, isResolved: isResolved(complaint.status), existingFeedback: complaint.rating
                                                                                ? {
                                                                                    rating: complaint.rating,
                                                                                    comment: complaint.citizenFeedback || "",
                                                                                }
                                                                                : null, children: _jsx(Button, { variant: "ghost", size: "sm", children: _jsx(Star, { className: "h-4 w-4" }) }) }))] }) })] }, complaint.id))) })] }) }), pagination.totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-sm text-gray-500", children: ["Showing", " ", (pagination.currentPage - 1) * pagination.limit + 1, " to", " ", Math.min(pagination.currentPage * pagination.limit, pagination.totalItems), " ", "of ", pagination.totalItems, " complaints"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", disabled: !pagination.hasPrev, onClick: () => {
                                                            // RTK Query handles pagination automatically via refetch
                                                            refetchComplaints();
                                                        }, children: "Previous" }), _jsx(Button, { variant: "outline", size: "sm", disabled: !pagination.hasNext, onClick: () => {
                                                            // RTK Query handles pagination automatically via refetch
                                                            refetchComplaints();
                                                        }, children: "Next" })] })] }))] }))] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Quick Actions" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs(Button, { onClick: () => setIsQuickFormOpen(true), className: "w-full justify-start", children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Submit New Complaint"] }), _jsxs(Button, { variant: "outline", onClick: () => navigate("/complaints"), className: "w-full justify-start", children: [_jsx(FileText, { className: "mr-2 h-4 w-4" }), "View All Complaints"] })] })] }), _jsx(ContactInfoCard, { title: "Help & Support" })] }), _jsx(QuickComplaintModal, { isOpen: isQuickFormOpen, onClose: () => setIsQuickFormOpen(false), onSuccess: (complaintId) => {
                    // Refresh data after successful submission
                    handleRefresh();
                } })] }));
};
export default CitizenDashboard;
