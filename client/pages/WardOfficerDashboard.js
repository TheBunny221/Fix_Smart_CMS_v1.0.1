import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetWardDashboardStatisticsQuery } from "../store/api/complaintsApi";
import ComplaintsListWidget from "../components/ComplaintsListWidget";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { RadioGroup } from "../components/ui/radio-group";
import { BarChart3, } from "lucide-react";
import StatusOverviewGrid from "@/components/StatusOverviewGrid";
import HeatmapGrid from "../components/charts/HeatmapGrid";
const WardOfficerDashboard = () => {
    const { user } = useAppSelector((state) => state.auth);
    const navigate = useNavigate();
    // State for filters
    const [filters, setFilters] = useState({
        mainFilter: "registered",
        overdue: false,
        urgent: false,
    });
    // Fetch ward dashboard statistics
    const { data: statsResponse, isLoading: statsLoading, error: statsError, refetch: refetchStats, } = useGetWardDashboardStatisticsQuery();
    const stats = statsResponse?.data?.stats;
    const smallCardClass = "cursor-pointer transform transition-all hover:shadow-lg hover:scale-[1.02] p-3 bg-white rounded-lg border border-gray-100 flex flex-col justify-between min-h-[96px]";
    // Build filter params for complaints query based on active filters
    const buildComplaintsFilter = () => {
        const filterParams = {};
        const statusFilters = [];
        const priorityFilters = [];
        // Main filter logic
        switch (filters.mainFilter) {
            case "registered":
                statusFilters.push("REGISTERED");
                break;
            case "assigned":
                statusFilters.push("ASSIGNED");
                break;
            case "inProgress":
                statusFilters.push("IN_PROGRESS");
                break;
            case "resolved":
                statusFilters.push("RESOLVED");
                break;
            case "reopened":
                statusFilters.push("REOPENED");
                break;
            case "closed":
                statusFilters.push("CLOSED");
                break;
            case "total":
                // No status filter, show all
                break;
            case "none":
            default:
                // No main filter applied
                break;
        }
        // Additional filters
        if (filters.urgent) {
            priorityFilters.push("HIGH", "CRITICAL");
        }
        if (filters.overdue) {
            filterParams.slaStatus = "OVERDUE";
        }
        // Ensure ward-based filtering so Ward Officer only sees complaints for their ward
        if (user?.ward?.id) {
            filterParams.wardId = user.ward.id;
        }
        // Only add arrays if they have content
        if (statusFilters.length > 0) {
            filterParams.status = statusFilters;
        }
        if (priorityFilters.length > 0) {
            filterParams.priority = priorityFilters;
        }
        return filterParams;
    };
    // Calculate if we have active filters
    const hasActiveFilters = filters.mainFilter !== "none" || filters.overdue || filters.urgent;
    // Build complaints filter for the widget
    const complaintsFilter = buildComplaintsFilter();
    // Heatmap overview state for ward officer
    const [overviewHeatmap, setOverviewHeatmap] = useState(null);
    const [overviewHeatmapLoading, setOverviewHeatmapLoading] = useState(false);
    const fetchOverviewHeatmap = useCallback(async () => {
        setOverviewHeatmapLoading(true);
        try {
            const baseUrl = window.location.origin;
            const resp = await fetch(`${baseUrl}/api/reports/heatmap`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!resp.ok)
                throw new Error(resp.statusText);
            const json = await resp.json();
            const apiData = json.data;
            // Use server-provided display names
            setOverviewHeatmap(apiData);
        }
        catch (e) {
            console.warn("Failed to load overview heatmap", e);
            setOverviewHeatmap(null);
        }
        finally {
            setOverviewHeatmapLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchOverviewHeatmap();
    }, [fetchOverviewHeatmap]);
    const handleMainFilterChange = (value) => {
        setFilters((prev) => ({
            ...prev,
            mainFilter: value,
        }));
    };
    const handleFilterChange = (filterKey, checked) => {
        setFilters((prev) => ({
            ...prev,
            [filterKey]: checked,
        }));
    };
    const clearAllFilters = () => {
        setFilters({
            mainFilter: "none",
            overdue: false,
            urgent: false,
        });
    };
    // Handle navigation to complaints page with filters
    const navigateToComplaints = (filterParams) => {
        const searchParams = new URLSearchParams();
        Object.entries(filterParams).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                searchParams.append(key, value.join(","));
            }
            else {
                searchParams.append(key, value.toString());
            }
        });
        navigate(`/complaints?${searchParams.toString()}`);
    };
    if (statsLoading) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white", children: [_jsx("h1", { className: "text-2xl font-bold mb-2", children: "Ward Officer Dashboard" }), _jsx("p", { className: "text-blue-100", children: "Loading ward statistics..." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4", children: Array(6)
                        .fill(0)
                        .map((_, i) => (_jsxs(Card, { className: "animate-pulse", children: [_jsx(CardHeader, { className: "space-y-0 pb-2", children: _jsx("div", { className: "h-4 bg-gray-200 rounded w-3/4" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "h-8 bg-gray-200 rounded w-1/2 mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-full" })] })] }, i))) })] }));
    }
    if (statsError) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-6 text-white", children: [_jsx("h1", { className: "text-2xl font-bold mb-2", children: "Ward Officer Dashboard" }), _jsx("p", { className: "text-red-100", children: "Error loading ward statistics" })] }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-6", children: [_jsx("p", { className: "text-center text-gray-500 mb-4", children: "Failed to load dashboard data" }), _jsx(Button, { onClick: () => refetchStats(), className: "w-full", children: "Retry" })] }) })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold mb-2", children: "Ward Officer Dashboard" }), _jsxs("p", { className: "text-blue-100", children: ["Manage complaints for ", user?.ward?.name || "your assigned ward", " and monitor team performance."] })] }), _jsxs(Card, { className: `w-40 p-1.5 cursor-pointer rounded-xl transition-all duration-300 ${filters.mainFilter === "total"
                            ? "ring-2 ring-primary bg-primary/10 scale-105"
                            : "bg-white/10 hover:bg-white/20"}`, onClick: () => handleMainFilterChange(filters.mainFilter === "total" ? "none" : "total"), children: [_jsx(CardHeader, { className: "flex items-center p-0 justify-between pb-0.5", children: _jsxs(CardTitle, { className: "flex gap-2 text-sm font-medium text-white/90", children: [_jsx(BarChart3, { className: "h-4 w-4 text-white/90" }), "Total"] }) }), _jsxs(CardContent, { className: "p-1 pt-0", children: [_jsx("div", { className: "text-xl font-bold text-center text-white", children: stats?.summary?.totalComplaints ?? 0 }), _jsx("p", { className: "text-xs text-white/80 text-center", children: "All complaints" })] })] })] }), _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Filter by Status" }), filters.mainFilter !== "none" && (_jsx(Button, { variant: "outline", size: "sm", onClick: () => setFilters((prev) => ({ ...prev, mainFilter: "none" })), children: "Clear Filter" }))] }), _jsx(RadioGroup, { value: filters.mainFilter, onValueChange: handleMainFilterChange, children: _jsx(StatusOverviewGrid, { stats: stats, filters: filters, onMainFilterChange: handleMainFilterChange }) }), hasActiveFilters && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Filtered Complaints" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => navigateToComplaints(complaintsFilter), children: "View All in Complaints Page" })] }), _jsx(ComplaintsListWidget, { filters: complaintsFilter, title: "Filtered Results", maxHeight: "500px", showActions: true, userRole: user?.role, user: user })] })), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Overview Heatmap" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Complaints distribution across sub-zones in your ward" })] }), _jsxs(CardContent, { children: [_jsx(HeatmapGrid, { title: "Ward Overview Heatmap", description: `Complaints by type within ${user?.ward?.name || "your ward"}`, data: overviewHeatmap || {
                                    xLabels: [],
                                    yLabels: [],
                                    matrix: [],
                                    xAxisLabel: "Complaint Type",
                                    yAxisLabel: "Sub-zone",
                                }, className: "min-h-[420px]" }), overviewHeatmapLoading && (_jsx("div", { className: "mt-2 text-xs text-muted-foreground", children: "Loading heatmap..." }))] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Ward Performance" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: "Total Complaints" }), _jsx("span", { children: stats?.summary.totalComplaints || 0 })] }), _jsx(Progress, { value: stats?.summary.totalComplaints
                                            ? (stats.summary.completedWork /
                                                stats.summary.totalComplaints) *
                                                100
                                            : 0, className: "h-2" }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [stats?.summary.completedWork || 0, " completed"] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xl font-bold text-blue-600", children: stats?.statusBreakdown.in_progress || 0 }), _jsx("p", { className: "text-xs text-gray-500", children: "Active" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xl font-bold text-red-600", children: stats?.summary.overdueComplaints || 0 }), _jsx("p", { className: "text-xs text-gray-500", children: "Overdue" })] })] })] })] })] }));
};
export default WardOfficerDashboard;
