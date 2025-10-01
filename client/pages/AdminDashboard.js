import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetDashboardAnalyticsQuery, useGetRecentActivityQuery, useGetDashboardStatsQuery, useGetUserActivityQuery, useGetSystemHealthQuery, } from "../store/api/adminApi";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "../components/ui/tabs";
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent, TooltipProvider, } from "../components/ui/tooltip";
import HeatmapGrid from "../components/charts/HeatmapGrid";
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip as RechartsTooltip, } from "recharts";
import { Shield, Users, FileText, Settings, TrendingUp, AlertTriangle, CheckCircle, Clock, MapPin, BarChart3, UserCheck, Database, Activity, Info, } from "lucide-react";
import { useSystemConfig } from "../contexts/SystemConfigContext";
const AdminDashboard = () => {
    const { translations } = useAppSelector((state) => state.language);
    const { appName } = useSystemConfig();
    // Fetch real-time data using API queries
    const { data: dashboardStats, isLoading: statsLoading, error: statsError, } = useGetDashboardStatsQuery();
    const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError, } = useGetDashboardAnalyticsQuery();
    const { data: recentActivityData, isLoading: activityLoading, error: activityError, } = useGetRecentActivityQuery({ limit: 5 });
    const { data: userActivityData, isLoading: userActivityLoading, error: userActivityError, } = useGetUserActivityQuery({ period: "24h" });
    const { data: systemHealthData, isLoading: systemHealthLoading, error: systemHealthError, } = useGetSystemHealthQuery();
    const systemStats = dashboardStats?.data || {
        totalComplaints: 0,
        totalUsers: 0,
        activeComplaints: 0,
        resolvedComplaints: 0,
        overdue: 0,
        wardOfficers: 0,
        maintenanceTeam: 0,
        pendingTeamAssignments: 0,
    };
    const analytics = analyticsData?.data;
    const recentActivity = recentActivityData?.data || [];
    const isLoading = statsLoading ||
        analyticsLoading ||
        activityLoading ||
        userActivityLoading ||
        systemHealthLoading;
    // Use real data from APIs with fallbacks
    const complaintTrends = analytics?.complaintTrends || [];
    const complaintsByType = analytics?.complaintsByType || [];
    const wardPerformance = analytics?.wardPerformance || [];
    const metrics = analytics?.metrics || {
        avgResolutionTime: 0,
        slaCompliance: 0,
        citizenSatisfaction: 0,
        resolutionRate: 0,
    };
    // Development debugging
    if (process.env.NODE_ENV === "development") {
        console.log("Dashboard Data Debug:", {
            analytics: analytics,
            complaintTrends: complaintTrends,
            complaintsByType: complaintsByType,
            wardPerformance: wardPerformance,
            metrics: metrics,
            systemStats: systemStats,
        });
    }
    // Heatmap overview state
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
            // Server returns display names already in xLabels; use directly
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
    // Show loading state
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsx("div", { className: "text-lg", children: "Loading dashboard data..." }) }));
    }
    const hasError = Boolean(statsError ||
        analyticsError ||
        activityError ||
        userActivityError ||
        systemHealthError);
    const getActivityIcon = (type) => {
        switch (type) {
            case "complaint":
                return _jsx(FileText, { className: "h-4 w-4 text-blue-600" });
            case "resolution":
                return _jsx(CheckCircle, { className: "h-4 w-4 text-green-600" });
            case "assignment":
                return _jsx(UserCheck, { className: "h-4 w-4 text-orange-600" });
            case "login":
                return _jsx(UserCheck, { className: "h-4 w-4 text-blue-600" });
            case "user_created":
                return _jsx(Users, { className: "h-4 w-4 text-purple-600" });
            case "user":
                return _jsx(Users, { className: "h-4 w-4 text-purple-600" });
            case "alert":
                return _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" });
            default:
                return _jsx(Activity, { className: "h-4 w-4 text-gray-600" });
        }
    };
    return (_jsx(TooltipProvider, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold mb-2", children: "\uD83D\uDEE1\uFE0F Administrator Dashboard \uD83D\uDEE0\uFE0F" }), _jsxs("p", { className: "text-purple-100", children: ["Complete system overview and management controls for ", appName] })] }), _jsx(Shield, { className: "h-16 w-16 text-purple-200" })] }), _jsx("div", { className: "mt-6 grid grid-cols-2 md:grid-cols-4 gap-6", children: [
                                {
                                    value: systemStats.totalComplaints,
                                    label: "Total Complaints",
                                    tooltip: "All complaints in the system.",
                                },
                                {
                                    value: systemStats.activeUsers || 0,
                                    label: "Active Users",
                                    tooltip: "Users who have logged in recently.",
                                },
                                {
                                    value: `${metrics?.slaCompliance || 0}%`,
                                    label: "SLA Compliance",
                                    tooltip: "Average on-time performance across complaint types, using each type’s configured SLA hours.",
                                },
                                {
                                    value: `${(metrics?.citizenSatisfaction || 0).toFixed(1)}/5`,
                                    label: "Satisfaction",
                                    tooltip: "Average citizen feedback score.",
                                },
                            ].map((item, i) => (_jsxs("div", { className: "relative z-0 rounded-3xl p-5 bg-gradient-to-br from-white/80 to-gray-50/40\n                 backdrop-blur-xl border border-white/30 shadow-sm\n                 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl", children: [_jsx("div", { className: "text-3xl font-semibold text-gray-900", children: item.value }), _jsxs("div", { className: "mt-2 text-sm text-gray-700 flex items-center gap-1", children: [item.label, _jsxs(UITooltip, { children: [_jsx(TooltipTrigger, { children: _jsx(Info, { className: "h-4 w-4 text-gray-500 hover:text-gray-700 transition-colors" }) }), _jsx(TooltipContent, { className: "z-50 relative", children: item.tooltip })] })] })] }, i))) })] }), hasError && (_jsx("div", { className: "mt-4", children: _jsxs("div", { className: "rounded-md border border-red-200 bg-red-50 p-4 text-red-700", children: [_jsx("div", { className: "font-medium", children: "Some dashboard data failed to load" }), process.env.NODE_ENV === "development" && (_jsx("div", { className: "mt-1 text-xs text-red-600/80", children: JSON.stringify({
                                    statsError: Boolean(statsError),
                                    analyticsError: Boolean(analyticsError),
                                    activityError: Boolean(activityError),
                                    userActivityError: Boolean(userActivityError),
                                    systemHealthError: Boolean(systemHealthError),
                                }) }))] }) })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: ["Active Complaints", _jsxs(UITooltip, { children: [_jsx(TooltipTrigger, { children: _jsx(Info, { className: "h-4 w-4 text-muted-foreground" }) }), _jsx(TooltipContent, { children: "Complaints currently open (not resolved or closed)." })] })] }), _jsx(FileText, { className: "h-4 w-4 text-orange-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: systemStats.activeComplaints }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Pending resolution" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: ["Overdue Tasks", _jsxs(UITooltip, { children: [_jsx(TooltipTrigger, { children: _jsx(Info, { className: "h-4 w-4 text-muted-foreground" }) }), _jsx(TooltipContent, { children: "Open complaints that have passed their SLA deadline." })] })] }), _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-red-600", children: systemStats.overdue }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Open past deadline" }), _jsxs("p", { className: "text-[11px] text-gray-500 mt-1", children: ["SLA breaches (open + resolved late): ", metrics?.slaBreaches || 0] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: ["Pending Team Assignment", _jsxs(UITooltip, { children: [_jsx(TooltipTrigger, { children: _jsx(Info, { className: "h-4 w-4 text-muted-foreground" }) }), _jsx(TooltipContent, { children: "Complaints waiting to be assigned to a maintenance team." })] })] }), _jsx(UserCheck, { className: "h-4 w-4 text-blue-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: systemStats.pendingTeamAssignments || 0 }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Needs maintenance assignment" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: ["Avg Resolution", _jsxs(UITooltip, { children: [_jsx(TooltipTrigger, { children: _jsx(Info, { className: "h-4 w-4 text-muted-foreground" }) }), _jsx(TooltipContent, { children: "Average time taken to close complaints (in days)." })] })] }), _jsx(Clock, { className: "h-4 w-4 text-green-600" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold text-green-600", children: [(metrics?.avgResolutionTime || 0).toFixed(1), "d"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Average Closure Time" })] })] })] }), _jsxs(Tabs, { defaultValue: "overview", className: "space-y-4", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "system", children: "System" })] }), _jsxs(TabsContent, { value: "overview", className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Complaint Trends (Last 6 Months)" }) }), _jsx(CardContent, { children: complaintTrends && complaintTrends.length > 0 ? (_jsxs(_Fragment, { children: [_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: complaintTrends, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "month", tick: { fontSize: 12 }, angle: -45, textAnchor: "end", height: 60 }), _jsx(YAxis, { allowDecimals: false, tick: { fontSize: 12 } }), _jsx(RechartsTooltip, { formatter: (value, name) => [value, name], labelFormatter: (label) => `Month: ${label}` }), _jsx(Line, { type: "monotone", dataKey: "complaints", stroke: "#3B82F6", strokeWidth: 2, name: "Complaints", connectNulls: false }), _jsx(Line, { type: "monotone", dataKey: "resolved", stroke: "#10B981", strokeWidth: 2, name: "Resolved", connectNulls: false })] }) }), process.env.NODE_ENV === "development" && (_jsxs("div", { className: "mt-2 text-xs text-gray-400", children: ["Data points: ", complaintTrends.length, " | Total complaints:", " ", complaintTrends.reduce((sum, trend) => sum + (trend.complaints || 0), 0)] }))] })) : (_jsx("div", { className: "h-[300px] flex items-center justify-center text-gray-500", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mb-2", children: "No complaint trend data available" }), process.env.NODE_ENV === "development" &&
                                                                    analytics && (_jsxs("div", { className: "text-xs", children: ["Analytics loaded: ", analytics ? "Yes" : "No", " | Trends array length:", " ", complaintTrends?.length || 0] }))] }) })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Complaints by Type" }) }), _jsx(CardContent, { children: complaintsByType && complaintsByType.length > 0 ? (_jsxs(_Fragment, { children: [_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: complaintsByType, cx: "50%", cy: "50%", innerRadius: 50, outerRadius: 100, paddingAngle: 2, dataKey: "value", nameKey: "name", children: complaintsByType.map((entry, index) => (_jsx(Cell, { fill: entry?.color || "#6B7280" }, `cell-${index}`))) }), _jsx(RechartsTooltip, { content: ({ active, payload }) => {
                                                                                if (!active || !payload || !payload.length)
                                                                                    return null;
                                                                                const entry = payload[0];
                                                                                const typeName = entry?.payload?.name || entry?.name || "Type";
                                                                                const count = entry?.value ?? entry?.payload?.value ?? 0;
                                                                                return (_jsxs("div", { className: "rounded-md border bg-white px-3 py-2 text-sm shadow", children: [_jsx("div", { className: "font-medium", children: typeName }), _jsxs("div", { className: "text-gray-600", children: [count, " complaints"] })] }));
                                                                            } })] }) }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 max-h-32 overflow-y-auto", children: complaintsByType.map((item, index) => (_jsxs("div", { className: "flex items-center space-x-2 text-xs", children: [_jsx("div", { className: "w-3 h-3 rounded-full flex-shrink-0", style: {
                                                                                backgroundColor: item?.color || "#6B7280",
                                                                            } }), _jsxs("span", { className: "truncate", children: [item?.name || "Unknown", " (", item?.value || 0, ")"] })] }, index))) }), process.env.NODE_ENV === "development" && (_jsxs("div", { className: "mt-2 text-xs text-gray-400", children: ["Types: ", complaintsByType.length, " | Total:", " ", complaintsByType.reduce((sum, type) => sum + (type.value || 0), 0)] }))] })) : (_jsx("div", { className: "h-[300px] flex items-center justify-center text-gray-500", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mb-2", children: "No complaint type data available" }), process.env.NODE_ENV === "development" &&
                                                                    analytics && (_jsxs("div", { className: "text-xs", children: ["Analytics loaded: ", analytics ? "Yes" : "No", " | Types array length:", " ", complaintsByType?.length || 0] }))] }) })) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Overview Heatmap" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "High-level view of complaints across wards and types" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "w-full", children: [_jsx(HeatmapGrid, { title: "Overall Complaints Heatmap", description: "Complaints by type across wards (overview)", data: overviewHeatmap || {
                                                            xLabels: [],
                                                            yLabels: [],
                                                            matrix: [],
                                                            xAxisLabel: "Complaint Type",
                                                            yAxisLabel: "Ward",
                                                        }, className: "min-h-[420px]" }), overviewHeatmapLoading && (_jsx("div", { className: "mt-2 text-xs text-muted-foreground", children: "Loading heatmap..." }))] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Activity, { className: "h-5 w-5 mr-2" }), "Recent System Activity"] }) }), _jsx(CardContent, { children: recentActivity.length > 0 ? (_jsx("div", { className: "space-y-4", children: recentActivity.map((activity) => (_jsxs("div", { className: "flex items-center space-x-3 p-3 bg-gray-50 rounded-lg", children: [getActivityIcon(activity.type), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-medium", children: activity.message }), _jsx("span", { className: "text-[10px] uppercase tracking-wide text-gray-400", children: activity.type })] }), activity.user && (_jsxs("p", { className: "text-xs text-gray-600", children: [activity.user.name, activity.user.email ? (_jsxs(_Fragment, { children: [" ", "\u00B7", " ", _jsx("span", { className: "text-gray-500", children: activity.user.email })] })) : null] })), _jsx("p", { className: "text-xs text-gray-500", children: activity.time })] })] }, activity.id))) })) : (_jsx("div", { className: "h-[200px] flex items-center justify-center text-gray-500", children: "No recent activity available" })) })] })] }), _jsxs(TabsContent, { value: "performance", className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Response Time" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-3xl font-bold text-blue-600", children: [(metrics?.avgResolutionTime || 0).toFixed(1), "d"] }), _jsx("p", { className: "text-sm text-gray-600", children: "Average resolution time" }), _jsxs("div", { className: "mt-4", children: [_jsx("div", { className: "flex justify-between text-sm mb-1", children: _jsx("span", { children: (metrics?.avgResolutionTime || 0) <= 3
                                                                            ? "On target"
                                                                            : "Needs improvement" }) }), _jsx(Progress, { value: Math.min((3 / Math.max(metrics?.avgResolutionTime || 0.1, 0.1)) *
                                                                        100, 100), className: "h-2" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Resolution Rate" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-3xl font-bold text-green-600", children: [metrics?.resolutionRate || 0, "%"] }), _jsx("p", { className: "text-sm text-gray-600", children: "Complaints resolved" }), _jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: "Target: 90%" }), _jsx("span", { children: (metrics?.resolutionRate || 0) >= 90
                                                                                ? "Excellent"
                                                                                : (metrics?.resolutionRate || 0) >= 75
                                                                                    ? "Good"
                                                                                    : "Needs improvement" })] }), _jsx(Progress, { value: metrics?.resolutionRate || 0, className: "h-2" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "SLA Compliance" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-3xl font-bold text-purple-600", children: [metrics?.slaCompliance || 0, "%"] }), _jsx("p", { className: "text-sm text-gray-600", children: "Meeting deadlines" }), _jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: "Target: 85%" }), _jsx("span", { children: (metrics?.slaCompliance || 0) >= 85
                                                                                ? "Excellent"
                                                                                : (metrics?.slaCompliance || 0) >= 70
                                                                                    ? "Good"
                                                                                    : "Below target" })] }), _jsx(Progress, { value: metrics?.slaCompliance || 0, className: "h-2" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Satisfaction Score" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-3xl font-bold text-yellow-600", children: [(metrics?.citizenSatisfaction || 0).toFixed(1), "/5"] }), _jsx("p", { className: "text-sm text-gray-600", children: "Citizen feedback" }), _jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: "Target: 4.0" }), _jsx("span", { children: (metrics?.citizenSatisfaction || 0) >= 4.0
                                                                                ? "Above target"
                                                                                : "Below target" })] }), _jsx(Progress, { value: ((metrics?.citizenSatisfaction || 0) / 5) * 100, className: "h-2" })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Performance Summary" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: "Overall Resolution Rate" }), _jsxs("span", { className: "text-lg font-bold text-green-600", children: [metrics?.resolutionRate || 0, "%"] })] }), _jsx(Progress, { value: metrics?.resolutionRate || 0, className: "h-3" }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: "SLA Compliance" }), _jsxs("span", { className: "text-lg font-bold text-blue-600", children: [metrics?.slaCompliance || 0, "%"] })] }), _jsx(Progress, { value: metrics?.slaCompliance || 0, className: "h-3" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-3xl font-bold text-orange-600", children: [(metrics?.avgResolutionTime || 0).toFixed(1), "d"] }), _jsx("p", { className: "text-sm text-gray-600", children: "Average Resolution Time" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-purple-600", children: [(metrics?.citizenSatisfaction || 0).toFixed(1), "/5"] }), _jsx("p", { className: "text-sm text-gray-600", children: "Satisfaction Score" })] })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Quick Actions" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Link, { to: "/reports", children: _jsxs(Button, { variant: "outline", className: "w-full", children: [_jsx(BarChart3, { className: "h-4 w-4 mr-2" }), "Detailed Reports"] }) }), _jsx(Link, { to: "/admin/analytics", children: _jsxs(Button, { variant: "outline", className: "w-full", children: [_jsx(TrendingUp, { className: "h-4 w-4 mr-2" }), "Analytics"] }) }), _jsx(Link, { to: "/admin/users/new", children: _jsxs(Button, { variant: "outline", className: "w-full", children: [_jsx(Users, { className: "h-4 w-4 mr-2" }), "Add User"] }) }), _jsx(Link, { to: "/admin/config", children: _jsxs(Button, { variant: "outline", className: "w-full", children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), "Settings"] }) })] }) })] })] })] }), _jsx(TabsContent, { value: "users", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "User Management" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx(Link, { to: "/admin/users", className: "block", children: _jsxs(Button, { className: "w-full justify-start", children: [_jsx(Users, { className: "h-4 w-4 mr-2" }), "Manage Users (", systemStats.wardOfficers + systemStats.maintenanceTeam, ")"] }) }), _jsx(Link, { to: "/admin/users?role=WARD_OFFICER", className: "block", children: _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(UserCheck, { className: "h-4 w-4 mr-2" }), "Ward Officers (", systemStats.wardOfficers, ")"] }) }), _jsx(Link, { to: "/admin/users?role=MAINTENANCE_TEAM", className: "block", children: _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), "Maintenance Team (", systemStats.maintenanceTeam, ")"] }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "User Activity (Real-time)" }) }), _jsx(CardContent, { children: userActivityLoading ? (_jsxs("div", { className: "flex items-center justify-center py-4", children: [_jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" }), _jsx("span", { className: "ml-2 text-sm", children: "Loading activity..." })] })) : userActivityError ? (_jsx("div", { className: "text-center py-4 text-red-600", children: _jsx("p", { className: "text-sm", children: "Failed to load user activity" }) })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: "Active Users (24h)" }), _jsx(Badge, { variant: "secondary", children: userActivityData?.data?.metrics?.activeUsers || 0 })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: "New Registrations (24h)" }), _jsx(Badge, { variant: "secondary", children: userActivityData?.data?.metrics?.newRegistrations ||
                                                                        0 })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: "Login Success Rate" }), _jsxs(Badge, { variant: "secondary", children: [userActivityData?.data?.metrics?.loginSuccessRate ||
                                                                            0, "%"] })] }), userActivityData?.data?.activities &&
                                                            userActivityData.data.activities.length > 0 && (_jsxs("div", { className: "mt-4", children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Recent Activity" }), _jsx("div", { className: "space-y-2 max-h-32 overflow-y-auto", children: userActivityData.data.activities
                                                                        .slice(0, 3)
                                                                        .map((activity) => (_jsxs("div", { className: "text-xs p-2 bg-gray-50 rounded", children: [_jsx("p", { className: "font-medium", children: activity.message }), _jsx("p", { className: "text-gray-500", children: activity.time })] }, activity.id))) })] }))] })) })] })] }) }), _jsx(TabsContent, { value: "system", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "System Configuration" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx(Link, { to: "/admin/config", className: "block", children: _jsxs(Button, { className: "w-full justify-start", children: [_jsx(Database, { className: "h-4 w-4 mr-2" }), "System Settings"] }) }), _jsx(Link, { to: "/admin/config?tab=wards", className: "block", children: _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(MapPin, { className: "h-4 w-4 mr-2" }), "Ward Management"] }) }), _jsx(Link, { to: "/admin/config?tab=types", className: "block", children: _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "Complaint Types"] }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "System Health (Real-time)" }) }), _jsx(CardContent, { children: systemHealthLoading ? (_jsxs("div", { className: "flex items-center justify-center py-4", children: [_jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" }), _jsx("span", { className: "ml-2 text-sm", children: "Checking health..." })] })) : systemHealthError ? (_jsx("div", { className: "text-center py-4 text-red-600", children: _jsx("p", { className: "text-sm", children: "Failed to load system health" }) })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: "System Uptime" }), _jsx(Badge, { className: "bg-blue-100 text-blue-800", children: systemHealthData?.data?.uptime?.formatted || "N/A" })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: "Database Status" }), _jsxs(Badge, { className: systemHealthData?.data?.services?.database
                                                                        ?.status === "healthy"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-red-100 text-red-800", children: [systemHealthData?.data?.services?.database
                                                                            ?.status === "healthy"
                                                                            ? "Healthy"
                                                                            : "Unhealthy", systemHealthData?.data?.services?.database
                                                                            ?.responseTime &&
                                                                            ` (${systemHealthData.data.services.database.responseTime})`] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: "Email Service" }), _jsx(Badge, { className: systemHealthData?.data?.services?.emailService
                                                                        ?.status === "operational"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-red-100 text-red-800", children: systemHealthData?.data?.services?.emailService
                                                                        ?.status || "Unknown" })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: "File Storage" }), _jsxs(Badge, { className: (systemHealthData?.data?.services?.fileStorage
                                                                        ?.usedPercent || 0) > 90
                                                                        ? "bg-red-100 text-red-800"
                                                                        : (systemHealthData?.data?.services?.fileStorage
                                                                            ?.usedPercent || 0) > 75
                                                                            ? "bg-yellow-100 text-yellow-800"
                                                                            : "bg-green-100 text-green-800", children: [systemHealthData?.data?.services?.fileStorage
                                                                            ?.usedPercent || 0, "% Used"] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: "API Response" }), _jsx(Badge, { className: "bg-green-100 text-green-800", children: systemHealthData?.data?.services?.api
                                                                        ?.averageResponseTime || "N/A" })] }), systemHealthData?.data?.system?.memory && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm", children: "Memory Usage" }), _jsxs(Badge, { className: systemHealthData.data.system.memory.percentage >
                                                                        80
                                                                        ? "bg-red-100 text-red-800"
                                                                        : systemHealthData.data.system.memory
                                                                            .percentage > 60
                                                                            ? "bg-yellow-100 text-yellow-800"
                                                                            : "bg-green-100 text-green-800", children: [systemHealthData.data.system.memory.used, " (", systemHealthData.data.system.memory.percentage, "%)"] })] }))] })) })] })] }) })] })] }) }));
};
export default AdminDashboard;
