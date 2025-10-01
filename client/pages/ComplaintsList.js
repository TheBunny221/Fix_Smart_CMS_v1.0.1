import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintsQuery } from "../store/api/complaintsApi";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useGetWardsForFilteringQuery } from "../store/api/adminApi";
import { useDataManager } from "../hooks/useDataManager";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../components/ui/table";
import { FileText, Search, Filter, Plus, Calendar, MapPin, } from "lucide-react";
import ComplaintQuickActions from "../components/ComplaintQuickActions";
import QuickComplaintModal from "../components/QuickComplaintModal";
import UpdateComplaintModal from "../components/UpdateComplaintModal";
import { useSystemConfig } from "../contexts/SystemConfigContext";
const ComplaintsList = () => {
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const { translations } = useAppSelector((state) => state.language);
    const [searchParams] = useSearchParams();
    // Initialize filters from URL parameters
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
    const [priorityFilter, setPriorityFilter] = useState(() => {
        const priority = searchParams.get("priority");
        // Handle comma-separated values like "CRITICAL,HIGH"
        if (priority && priority.includes(",")) {
            return "high_critical"; // Use a combined filter for UI purposes
        }
        return priority || "all";
    });
    const [wardFilter, setWardFilter] = useState(searchParams.get("ward") || "all");
    const [subZoneFilter, setSubZoneFilter] = useState(searchParams.get("subZone") || "all");
    const [needsMaintenanceAssignment, setNeedsMaintenanceAssignment] = useState(searchParams.get("needsMaintenanceAssignment") === "true" || false);
    const [slaStatusFilter, setSlaStatusFilter] = useState(searchParams.get("slaStatus") || "all");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(25);
    // Data management
    const { cacheComplaintsList } = useDataManager();
    // Fetch wards for filtering (only for admin users)
    const { data: wardsResponse, isLoading: isLoadingWards } = useGetWardsForFilteringQuery(undefined, {
        skip: !isAuthenticated || user?.role === "CITIZEN",
    });
    const wards = wardsResponse?.data?.wards || [];
    // Get sub-zones for selected ward
    const selectedWard = wards.find((ward) => ward.id === wardFilter);
    const availableSubZones = selectedWard?.subZones || [];
    // Get system config from context (avoids duplicate API calls)
    const { getConfig } = useSystemConfig();
    const getSettingValue = (key) => getConfig(key);
    const configuredPriorities = useMemo(() => {
        const raw = getSettingValue("COMPLAINT_PRIORITIES");
        try {
            const parsed = raw ? JSON.parse(raw) : null;
            return Array.isArray(parsed) && parsed.length
                ? parsed
                : ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
        }
        catch {
            return ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
        }
    }, [getSettingValue]);
    const configuredStatuses = useMemo(() => {
        const raw = getSettingValue("COMPLAINT_STATUSES");
        try {
            const parsed = raw ? JSON.parse(raw) : null;
            return Array.isArray(parsed) && parsed.length
                ? parsed
                : [
                    "REGISTERED",
                    "ASSIGNED",
                    "IN_PROGRESS",
                    "RESOLVED",
                    "CLOSED",
                    "REOPENED",
                ];
        }
        catch {
            return [
                "REGISTERED",
                "ASSIGNED",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED",
                "REOPENED",
            ];
        }
    }, [getSettingValue]);
    const prettyLabel = (v) => v
        .toLowerCase()
        .split("_")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
    // Debounce search term for better performance
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);
    // Reset to first page when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [
        statusFilter,
        priorityFilter,
        wardFilter,
        subZoneFilter,
        debouncedSearchTerm,
        needsMaintenanceAssignment,
        slaStatusFilter,
    ]);
    // Build query parameters for server-side filtering and pagination
    const queryParams = useMemo(() => {
        const params = { page: currentPage, limit: recordsPerPage };
        if (statusFilter !== "all")
            params.status = statusFilter.toUpperCase();
        // Handle priority filter including URL-based comma-separated values
        if (priorityFilter !== "all") {
            const urlPriority = searchParams.get("priority");
            if (urlPriority && urlPriority.includes(",")) {
                // For comma-separated values from URL, send as array
                params.priority = urlPriority
                    .split(",")
                    .map((p) => p.trim().toUpperCase());
            }
            else if (priorityFilter === "high_critical") {
                // Handle the combined high & critical filter
                params.priority = ["HIGH", "CRITICAL"];
            }
            else {
                params.priority = priorityFilter.toUpperCase();
            }
        }
        // Add ward and sub-zone filters
        if (wardFilter !== "all")
            params.wardId = wardFilter;
        if (subZoneFilter !== "all")
            params.subZoneId = subZoneFilter;
        // Enforce officer-based filtering for Ward Officers
        if (user?.role === "WARD_OFFICER" && user?.id) {
            params.officerId = user.id;
        }
        // Add new filters
        if (needsMaintenanceAssignment)
            params.needsTeamAssignment = true;
        if (slaStatusFilter !== "all")
            params.slaStatus = slaStatusFilter.toUpperCase();
        if (debouncedSearchTerm.trim())
            params.search = debouncedSearchTerm.trim();
        // For MAINTENANCE_TEAM users, show only complaints assigned to them (new field)
        if (user?.role === "MAINTENANCE_TEAM") {
            params.maintenanceTeamId = user.id;
        }
        return params;
    }, [
        currentPage,
        recordsPerPage,
        statusFilter,
        priorityFilter,
        wardFilter,
        subZoneFilter,
        debouncedSearchTerm,
        user?.role,
        user?.id,
        searchParams,
        needsMaintenanceAssignment,
        slaStatusFilter,
    ]);
    // Use RTK Query for better authentication handling
    const { data: complaintsResponse, isLoading, error, refetch, } = useGetComplaintsQuery(queryParams, { skip: !isAuthenticated || !user });
    const complaints = Array.isArray(complaintsResponse?.data?.complaints)
        ? complaintsResponse.data.complaints
        : [];
    // Cache complaints data when loaded
    useEffect(() => {
        if (complaints.length > 0) {
            cacheComplaintsList(complaints);
        }
    }, [complaints, cacheComplaintsList]);
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
            case "REOPENED":
                return "bg-purple-100 text-purple-800";
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
    const getSLAColor = (sla) => {
        switch (sla) {
            case "ON_TIME":
                return "bg-green-100 text-green-800";
            case "WARNING":
                return "bg-yellow-100 text-yellow-800";
            case "OVERDUE":
                return "bg-red-100 text-red-800";
            case "COMPLETED":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    // Use all complaints since filtering is done server-side
    const filteredComplaints = complaints;
    // Clear all filters and refetch data
    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setPriorityFilter("all");
        setWardFilter("all");
        setSubZoneFilter("all");
        setNeedsMaintenanceAssignment(false);
        setSlaStatusFilter("all");
        setDebouncedSearchTerm("");
    };
    // Reset sub-zone when ward changes
    const handleWardChange = (value) => {
        setWardFilter(value);
        setSubZoneFilter("all");
    };
    // Pagination helpers
    const totalItems = complaintsResponse?.data?.pagination?.totalItems ?? 0;
    const totalPages = Math.max(1, complaintsResponse?.data?.pagination?.totalPages ??
        Math.ceil((totalItems || 0) / recordsPerPage || 1));
    // Ensure currentPage stays within bounds when totalPages or totalItems change
    useEffect(() => {
        if (totalPages && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);
    const getPageNumbers = () => {
        const pages = [];
        const maxButtons = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxButtons - 1);
        if (end - start < maxButtons - 1) {
            start = Math.max(1, end - maxButtons + 1);
        }
        for (let p = start; p <= end; p++)
            pages.push(p);
        return pages;
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: user?.role === "MAINTENANCE_TEAM" ? "My Complaints" : "Complaints" }), _jsx("p", { className: "text-gray-600", children: user?.role === "MAINTENANCE_TEAM"
                                    ? "View and manage complaints you have submitted"
                                    : "Manage and track all complaints" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: () => refetch(), children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "Refresh"] }), (user?.role === "CITIZEN" ||
                                user?.role === "MAINTENANCE_TEAM" ||
                                user?.role === "ADMINISTRATOR" ||
                                user?.role === "WARD_OFFICER") && (_jsxs(Button, { onClick: () => setIsQuickFormOpen(true), children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "New Complaint"] }))] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-start", children: [_jsxs("div", { className: "space-y-1 col-span-1 sm:col-span-2 xl:col-span-3", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { placeholder: "Search by ID, description, or location...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10", title: "Search by complaint ID (e.g., KSC0001), description, or location" }), searchTerm && (_jsx("div", { className: "absolute right-3 top-3", children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setSearchTerm(""), className: "h-4 w-4 p-0 hover:bg-gray-200", children: "\u00D7" }) }))] }), searchTerm && (_jsx("p", { className: "text-xs text-gray-500", children: searchTerm.match(/^[A-Za-z]/)
                                            ? `Searching for complaint ID: ${searchTerm}`
                                            : `Searching in descriptions and locations` }))] }), _jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), configuredStatuses.map((s) => (_jsx(SelectItem, { value: s, children: prettyLabel(s) }, s)))] })] }), _jsxs(Select, { value: priorityFilter, onValueChange: setPriorityFilter, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by priority" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Priority" }), configuredPriorities.map((p) => (_jsx(SelectItem, { value: p, children: prettyLabel(p) }, p))), configuredPriorities.includes("HIGH") &&
                                                configuredPriorities.includes("CRITICAL") && (_jsx(SelectItem, { value: "high_critical", children: "High & Critical" }))] })] }), user?.role == "ADMINISTRATOR" && (_jsxs(Select, { value: wardFilter, onValueChange: handleWardChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by ward" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Wards" }), wards.map((ward) => (_jsx(SelectItem, { value: ward.id, children: ward.name }, ward.id)))] })] })), user?.role === "ADMINISTRATOR" &&
                                wardFilter !== "all" &&
                                availableSubZones.length > 0 && (_jsxs(Select, { value: subZoneFilter, onValueChange: setSubZoneFilter, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by sub-zone" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Sub-Zones" }), availableSubZones.map((subZone) => (_jsx(SelectItem, { value: subZone.id, children: subZone.name }, subZone.id)))] })] })), _jsxs(Select, { value: slaStatusFilter, onValueChange: setSlaStatusFilter, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by SLA" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All SLA Status" }), _jsx(SelectItem, { value: "ON_TIME", children: "On Time" }), _jsx(SelectItem, { value: "WARNING", children: "Warning" }), _jsx(SelectItem, { value: "OVERDUE", children: "Overdue" }), _jsx(SelectItem, { value: "COMPLETED", children: "Completed" })] })] }), user?.role === "WARD_OFFICER" && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "needsMaintenanceAssignment", checked: needsMaintenanceAssignment, onCheckedChange: setNeedsMaintenanceAssignment }), _jsx("label", { htmlFor: "needsMaintenanceAssignment", className: "text-sm cursor-pointer", children: "Needs Maintenance Assignment" })] })), _jsxs(Button, { variant: "outline", onClick: clearFilters, children: [_jsx(Filter, { className: "h-4 w-4 mr-2" }), "Clear Filters"] })] }) }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2" }), "Complaints (", complaintsResponse?.data?.pagination?.totalItems ??
                                    filteredComplaints.length, ")"] }) }), _jsx(CardContent, { children: !isAuthenticated ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(FileText, { className: "h-12 w-12 mx-auto text-gray-400 mb-4" }), _jsx("p", { className: "text-gray-600 mb-2", children: "Please sign in to view complaints." }), _jsx(Link, { to: "/login", children: _jsx(Button, { children: "Go to Sign In" }) })] })) : error ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(FileText, { className: "h-12 w-12 mx-auto text-red-400 mb-4" }), _jsx("p", { className: "text-red-500 mb-2", children: getApiErrorMessage(error) || "Failed to load complaints" }), _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => refetch(), children: "Try Again" }), _jsx(Link, { to: "/login", children: _jsx(Button, { variant: "outline", children: "Sign In" }) })] })] })) : isLoading ? (_jsx("div", { className: "space-y-4", children: [...Array(5)].map((_, i) => (_jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-3/4 mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-1/2" })] }, i))) })) : filteredComplaints.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(FileText, { className: "h-12 w-12 mx-auto text-gray-400 mb-4" }), _jsx("p", { className: "text-gray-500 mb-2", children: "No complaints found" }), _jsx("p", { className: "text-sm text-gray-400", children: searchTerm ||
                                        statusFilter !== "all" ||
                                        priorityFilter !== "all"
                                        ? "Try adjusting your filters or search terms"
                                        : "Submit your first complaint to get started" })] })) : (_jsxs(_Fragment, { children: [_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Complaint ID" }), _jsx(TableHead, { children: "Description" }), _jsx(TableHead, { children: "Location" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Priority" }), (user?.role === "ADMINISTRATOR" ||
                                                        user?.role === "WARD_OFFICER") && (_jsx(TableHead, { children: "Team" })), user?.role === "ADMINISTRATOR" && (_jsx(TableHead, { children: "Officer" })), user?.role !== "CITIZEN" && (_jsxs(_Fragment, { children: [_jsx(TableHead, { children: "Rating" }), _jsx(TableHead, { children: "SLA" }), _jsx(TableHead, { children: "Registered On" }), _jsx(TableHead, { children: "Updated" }), _jsx(TableHead, { children: "Closed" })] })), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: filteredComplaints.map((complaint) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { className: "font-medium", children: ["#", complaint.complaintId || complaint.id.slice(-6)] }), _jsx(TableCell, { children: _jsxs("div", { className: "max-w-xs", children: [_jsx("p", { className: "truncate", children: complaint.description }), _jsx("p", { className: "text-sm text-gray-500", children: complaint.type.replace("_", " ") })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center text-sm", children: [_jsx(MapPin, { className: "h-3 w-3 mr-1" }), complaint.area] }) }), _jsx(TableCell, { children: _jsx(Badge, { className: getStatusColor(complaint.status), children: complaint.status.replace("_", " ") }) }), _jsx(TableCell, { children: _jsx("div", { className: "flex flex-col gap-1", children: _jsx(Badge, { className: getPriorityColor(complaint.priority), children: complaint.priority }) }) }), (user?.role === "ADMINISTRATOR" ||
                                                        user?.role === "WARD_OFFICER") && (_jsx(TableCell, { children: complaint.maintenanceTeam?.fullName ? (_jsx("span", { className: "text-sm", children: complaint.maintenanceTeam.fullName })) : (_jsx("span", { className: "text-xs text-gray-500", children: "-" })) })), user?.role === "ADMINISTRATOR" && (_jsx(TableCell, { children: complaint.wardOfficer?.fullName ? (_jsx("span", { className: "text-sm", children: complaint.wardOfficer.fullName })) : (_jsx("span", { className: "text-xs text-gray-500", children: "-" })) })), user?.role !== "CITIZEN" && (_jsxs(_Fragment, { children: [_jsx(TableCell, { children: typeof complaint.rating === "number" &&
                                                                    complaint.rating > 0 ? (_jsxs("span", { className: "text-sm font-medium", children: [complaint.rating, "/5"] })) : (_jsx("span", { className: "text-xs text-gray-500", children: "N/A" })) }), _jsx(TableCell, { children: _jsx(Badge, { className: getSLAColor(complaint.slaStatus), children: complaint.slaStatus.replace("_", " ") }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center text-sm", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), new Date(complaint.submittedOn).toLocaleDateString()] }) }), _jsx(TableCell, { children: _jsx("span", { className: "text-sm", children: new Date(complaint.updatedAt).toLocaleDateString() }) }), _jsx(TableCell, { children: complaint.closedOn ? (_jsx("span", { className: "text-sm", children: new Date(complaint.closedOn).toLocaleDateString() })) : (_jsx("span", { className: "text-xs text-gray-500", children: "-" })) })] })), _jsx(TableCell, { children: _jsx(ComplaintQuickActions, { complaint: {
                                                                id: complaint.id,
                                                                complaintId: complaint.complaintId,
                                                                status: complaint.status,
                                                                priority: complaint.priority,
                                                                type: complaint.type,
                                                                description: complaint.description,
                                                                area: complaint.area,
                                                                assignedTo: complaint.assignedTo,
                                                            }, userRole: user?.role || "", showDetails: false, onUpdate: () => refetch(), onShowUpdateModal: (c) => {
                                                                setSelectedComplaint(complaint);
                                                                setIsUpdateModalOpen(true);
                                                            } }) })] }, complaint.id))) })] }), _jsxs("div", { className: "flex items-center justify-between mt-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Rows per page:" }), _jsxs(Select, { value: String(recordsPerPage), onValueChange: (v) => {
                                                        setRecordsPerPage(Number(v));
                                                        setCurrentPage(1);
                                                    }, children: [_jsx(SelectTrigger, { className: "h-8 w-24 px-2 py-1 text-sm", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "10", children: "10" }), _jsx(SelectItem, { value: "25", children: "25" }), _jsx(SelectItem, { value: "50", children: "50" }), _jsx(SelectItem, { value: "100", children: "100" })] })] }), _jsx("span", { className: "text-sm text-gray-500", children: totalItems === 0
                                                        ? `Showing 0 of 0`
                                                        : `Showing ${(currentPage - 1) * recordsPerPage + 1} - ${Math.min(currentPage * recordsPerPage, totalItems)} of ${totalItems}` })] }), _jsxs("div", { className: "flex items-center space-x-0.5", children: [_jsx(Button, { variant: "outline", size: "sm", className: "h-7 px-1 py-0.5 text-xs rounded-sm", onClick: () => setCurrentPage(1), disabled: currentPage === 1, children: "First" }), _jsx(Button, { variant: "outline", size: "sm", className: "h-7 px-1 py-0.5 text-xs rounded-sm", onClick: () => setCurrentPage((p) => Math.max(1, p - 1)), disabled: currentPage === 1, children: "Prev" }), getPageNumbers().map((p) => (_jsx(Button, { variant: p === currentPage ? "default" : "outline", size: "sm", className: "h-7 px-1 py-0.5 text-xs rounded-sm min-w-[28px]", onClick: () => setCurrentPage(p), children: p }, p))), _jsx(Button, { variant: "outline", size: "sm", className: "h-7 px-1 py-0.5 text-xs rounded-sm", onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)), disabled: currentPage === totalPages, children: "Next" }), _jsx(Button, { variant: "outline", size: "sm", className: "h-7 px-1 py-0.5 text-xs rounded-sm", onClick: () => setCurrentPage(totalPages), disabled: currentPage === totalPages, children: "Last" })] })] })] })) })] }), _jsx(QuickComplaintModal, { isOpen: isQuickFormOpen, onClose: () => setIsQuickFormOpen(false), onSuccess: (complaintId) => {
                    // Refresh data after successful submission
                    refetch();
                } }), _jsx(UpdateComplaintModal, { complaint: selectedComplaint, isOpen: isUpdateModalOpen, onClose: () => {
                    setIsUpdateModalOpen(false);
                    setSelectedComplaint(null);
                }, onSuccess: () => {
                    setIsUpdateModalOpen(false);
                    setSelectedComplaint(null);
                    refetch();
                } })] }));
};
export default ComplaintsList;
