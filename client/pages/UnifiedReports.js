import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Popover, PopoverTrigger, PopoverContent, } from "../components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "../components/ui/dialog";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent, TooltipProvider, } from "../components/ui/tooltip";
import HeatmapGrid from "../components/charts/HeatmapGrid";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import { getAnalyticsData, getHeatmapData } from "../utils/reportUtils";
// Recharts components will be loaded dynamically to prevent module loading issues
import { Download, FileText, TrendingUp, Clock, AlertTriangle, CheckCircle, BarChart3, PieChart as PieChartIcon, Target, Users, Filter, RefreshCw, FileSpreadsheet, Calendar, Info, } from "lucide-react";
// date-fns and export utilities will be loaded dynamically
const UnifiedReports = () => {
    const { user } = useAppSelector((state) => state.auth);
    const { translations } = useAppSelector((state) => state.language);
    const { appName, appLogoUrl, getConfig } = useSystemConfig();
    // Dynamic imports state
    const [rechartsLoaded, setRechartsLoaded] = useState(false);
    const [dateFnsLoaded, setDateFnsLoaded] = useState(false);
    const [exportUtilsLoaded, setExportUtilsLoaded] = useState(false);
    const [dynamicLibraries, setDynamicLibraries] = useState({});
    const [libraryLoadError, setLibraryLoadError] = useState(null);
    // Load dynamic libraries
    const loadDynamicLibraries = useCallback(async () => {
        try {
            // Load recharts
            if (!rechartsLoaded) {
                const recharts = await import("recharts");
                setDynamicLibraries((prev) => ({ ...prev, recharts }));
                setRechartsLoaded(true);
            }
            // Load date-fns
            if (!dateFnsLoaded) {
                const dateFns = await import("date-fns");
                setDynamicLibraries((prev) => ({ ...prev, dateFns }));
                setDateFnsLoaded(true);
            }
            // Load export utilities
            if (!exportUtilsLoaded) {
                const exportUtils = await import("../utils/exportUtils");
                setDynamicLibraries((prev) => ({ ...prev, exportUtils }));
                setExportUtilsLoaded(true);
            }
        }
        catch (error) {
            console.error("Failed to load dynamic libraries:", error);
            setLibraryLoadError("Failed to load required libraries. Some features may not work.");
        }
    }, [rechartsLoaded, dateFnsLoaded, exportUtilsLoaded]);
    // Load libraries on component mount - memoized to prevent infinite loops
    useEffect(() => {
        loadDynamicLibraries();
    }, []); // Empty dependency array since loadDynamicLibraries is memoized with useCallback
    // Date filters are initialized to the current month using native Date APIs
    // This avoids race conditions where the first fetch used only today's date
    // and resulted in empty analytics when there was no data for that single day.
    // State for filters - initialize with current month (YYYY-MM-DD)
    const [filters, setFilters] = useState(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split("T")[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            .toISOString()
            .split("T")[0];
        return {
            dateRange: { from: firstDay, to: lastDay },
            ward: "all",
            complaintType: "all",
            status: "all",
            priority: "all",
        };
    });
    // State for data
    const [analyticsData, setAnalyticsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [wards, setWards] = useState([]);
    const getWardNameById = useCallback((wardId) => {
        if (!wardId || wardId === "all")
            return "All Wards";
        if (user?.wardId && wardId === user.wardId)
            return user?.ward?.name || wardId;
        const found = wards.find((w) => w.id === wardId);
        return found?.name || wardId;
    }, [user?.wardId, user?.ward?.name, wards]);
    const [wardsLoading, setWardsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [heatmapData, setHeatmapData] = useState(null);
    const [heatmapLoading, setHeatmapLoading] = useState(false);
    const [reportProgress, setReportProgress] = useState(0);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportAbortController, setReportAbortController] = useState(null);
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [didInitialFetch, setDidInitialFetch] = useState(false);
    // Get role-based access permissions
    const permissions = useMemo(() => {
        const role = user?.role;
        return {
            canViewAllWards: role === "ADMINISTRATOR",
            canViewMaintenanceTasks: role === "MAINTENANCE_TEAM" || role === "ADMINISTRATOR",
            canExportData: role === "ADMINISTRATOR" || role === "WARD_OFFICER",
            defaultWard: role === "WARD_OFFICER" ? user?.wardId : "all",
        };
    }, [user]);
    // Load wards for admin selector
    useEffect(() => {
        const loadWards = async () => {
            if (!permissions.canViewAllWards)
                return;
            setWardsLoading(true);
            try {
                const baseUrl = window.location.origin;
                const resp = await fetch(`${baseUrl}/api/users/wards`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                if (resp.ok) {
                    const data = await resp.json();
                    const list = (data?.data || data)?.wards || data?.wards || data;
                    if (Array.isArray(list)) {
                        setWards(list.map((w) => ({ id: w.id, name: w.name })));
                    }
                }
            }
            catch (e) {
                console.warn("Failed to load wards for selector", e);
            }
            finally {
                setWardsLoading(false);
            }
        };
        loadWards();
    }, [permissions.canViewAllWards]);
    // Apply role-based filter restrictions
    useEffect(() => {
        if (permissions.defaultWard !== "all") {
            setFilters((prev) => ({
                ...prev,
                ward: permissions.defaultWard,
            }));
        }
    }, [permissions.defaultWard]);
    const fetchAnalyticsData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAnalyticsData(filters, user);
            setAnalyticsData(data);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load analytics data";
            setError(errorMessage);
            console.error("Analytics fetch error:", err);
        }
        finally {
            setIsLoading(false);
        }
    }, [filters, user]);
    const fetchHeatmapData = useCallback(async () => {
        setHeatmapLoading(true);
        try {
            const data = await getHeatmapData(filters, user);
            setHeatmapData(data);
        }
        catch (err) {
            console.warn("Heatmap fetch failed", err);
            // Set to empty state on failure
            setHeatmapData({
                xLabels: [],
                yLabels: [],
                matrix: [],
                xAxisLabel: "",
                yAxisLabel: "",
            });
        }
        finally {
            setHeatmapLoading(false);
        }
    }, [filters, user]);
    // First load: fetch analytics for the initialized date range only once
    useEffect(() => {
        if (!user || didInitialFetch)
            return;
        console.log("Initial fetch triggered");
        setDidInitialFetch(true);
        fetchAnalyticsData();
        fetchHeatmapData();
    }, [user, didInitialFetch, fetchAnalyticsData, fetchHeatmapData]);
    // Update heatmap dynamically on filter changes with debouncing
    useEffect(() => {
        if (!user || !didInitialFetch)
            return;
        const timer = setTimeout(() => {
            fetchHeatmapData();
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [filters, user, didInitialFetch, fetchHeatmapData]);
    // Complaint types for readable labels
    const { complaintTypes, isLoading: complaintTypesLoading, getComplaintTypeById, getComplaintTypeByName, } = useComplaintTypes();
    // Export functionality with enhanced features
    const handleExport = async (format) => {
        if (!permissions.canExportData) {
            alert("You don't have permission to export data");
            return;
        }
        if (!analyticsData) {
            alert("No data available for export");
            return;
        }
        if (!exportUtilsLoaded || !dynamicLibraries.exportUtils) {
            alert("Export functionality is still loading. Please try again in a moment.");
            return;
        }
        setIsExporting(true);
        try {
            const { validateExportPermissions, exportToPDF, exportToExcel, exportToCSV, } = dynamicLibraries.exportUtils;
            const queryParams = new URLSearchParams({
                from: filters.dateRange.from,
                to: filters.dateRange.to,
                ...(filters.ward !== "all" && { ward: filters.ward }),
                ...(filters.complaintType !== "all" && { type: filters.complaintType }),
                ...(filters.status !== "all" && { status: filters.status }),
                ...(filters.priority !== "all" && { priority: filters.priority }),
            });
            // Enforce ward scope for Ward Officers
            if (user?.role === "WARD_OFFICER" && user?.wardId) {
                queryParams.set("ward", user.wardId);
            }
            // Validate export permissions based on role
            const requestedData = {
                includesOtherWards: filters.ward === "all" && user?.role !== "ADMINISTRATOR",
                includesUnassignedComplaints: user?.role === "MAINTENANCE_TEAM" && filters.ward === "all",
            };
            if (!validateExportPermissions(user?.role || "", requestedData)) {
                alert("You don't have permission to export data outside your assigned scope");
                return;
            }
            // Fetch detailed data for export with real-time backend call
            const baseUrl = window.location.origin;
            const response = await fetch(`${baseUrl}/api/reports/export?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch export data");
            }
            const exportData = await response.json();
            if (!exportData.success) {
                throw new Error(exportData.message || "Export failed");
            }
            // Prepare export options with system config
            const exportOptions = {
                systemConfig: {
                    appName,
                    appLogoUrl,
                    complaintIdPrefix: getConfig("COMPLAINT_ID_PREFIX", "KSC"),
                },
                userRole: user?.role || "Unknown",
                userWard: user?.ward || permissions.defaultWard,
                includeCharts: true,
                maxRecords: user?.role === "ADMINISTRATOR" ? 1000 : 500,
            };
            // Use appropriate export utility based on format
            switch (format) {
                case "pdf":
                    await exportToPDF(exportData.data, analyticsData.trends, analyticsData.categories, exportOptions);
                    break;
                case "excel":
                    exportToExcel(exportData.data, analyticsData.trends, analyticsData.categories, exportOptions);
                    break;
                case "csv":
                    exportToCSV(exportData.data, exportOptions);
                    break;
            }
        }
        catch (err) {
            console.error("Export error:", err);
            alert(`Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
        finally {
            setIsExporting(false);
        }
    };
    // Generate custom report with countdown and cancellation
    const handleGenerateReport = async () => {
        if (isGeneratingReport)
            return;
        setIsGeneratingReport(true);
        setShowReportModal(true);
        setReportProgress(0);
        // Create abort controller for cancellation
        const abortController = new AbortController();
        setReportAbortController(abortController);
        try {
            // Start countdown timer - more realistic progression
            let progress = 0;
            const timer = setInterval(() => {
                progress += Math.random() * 3 + 1; // Random increment between 1-4
                if (progress > 95)
                    progress = 95; // Cap at 95% until API responds
                setReportProgress(progress);
            }, 200); // Update every 200ms
            // Prepare query parameters
            const queryParams = new URLSearchParams({
                from: filters.dateRange.from,
                to: filters.dateRange.to,
                ...(filters.ward !== "all" && { ward: filters.ward }),
                ...(filters.complaintType !== "all" && { type: filters.complaintType }),
                ...(filters.status !== "all" && { status: filters.status }),
                ...(filters.priority !== "all" && { priority: filters.priority }),
                detailed: "true",
            });
            // Enforce ward scope for Ward Officers
            if (user?.role === "WARD_OFFICER" && user?.wardId) {
                queryParams.set("ward", user.wardId);
            }
            // Make API call with abort signal
            const baseUrl = window.location.origin;
            const response = await fetch(`${baseUrl}/api/reports/analytics?${queryParams}`, {
                signal: abortController.signal,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to generate report: ${response.statusText}`);
            }
            const reportData = await response.json();
            // In parallel, refresh heatmap based on same filters
            fetchHeatmapData();
            // Clear timer
            clearInterval(timer);
            setReportProgress(100);
            // Wait a bit to show completion
            setTimeout(() => {
                setShowReportModal(false);
                setIsGeneratingReport(false);
                setReportAbortController(null);
                // Update analytics data with fresh report data
                setAnalyticsData(reportData.data);
                // Report completed successfully - no alert needed
                console.log(`Report generated successfully! Found ${reportData.data?.complaints?.total || 0} records based on applied filters.`);
            }, 500);
        }
        catch (error) {
            clearInterval(timer);
            if (error.name === "AbortError") {
                console.log("Report generation cancelled by user");
            }
            else {
                console.error("Report generation error:", error);
                alert(`Failed to generate report: ${error.message}`);
            }
            setShowReportModal(false);
            setIsGeneratingReport(false);
            setReportAbortController(null);
            setReportProgress(0);
        }
    };
    // Cancel report generation
    const handleCancelReport = () => {
        if (reportAbortController) {
            reportAbortController.abort();
        }
        setShowReportModal(false);
        setIsGeneratingReport(false);
        setReportAbortController(null);
        setReportProgress(0);
    };
    // Calculate time period for chart titles
    const getTimePeriodLabel = useCallback(() => {
        if (!dateFnsLoaded || !dynamicLibraries.dateFns) {
            return `${filters.dateRange.from} - ${filters.dateRange.to}`;
        }
        try {
            const { format } = dynamicLibraries.dateFns;
            const fromDate = new Date(filters.dateRange.from);
            const toDate = new Date(filters.dateRange.to);
            const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            // Format dates for display
            const formatDate = (date) => format(date, "MMM dd, yyyy");
            const fromFormatted = formatDate(fromDate);
            const toFormatted = formatDate(toDate);
            // Determine period type
            if (diffDays <= 1) {
                return `${fromFormatted}`;
            }
            else if (diffDays <= 7) {
                return `Past Week (${fromFormatted} - ${toFormatted})`;
            }
            else if (diffDays <= 31) {
                return `Past Month (${fromFormatted} - ${toFormatted})`;
            }
            else if (diffDays <= 90) {
                return `Past 3 Months (${fromFormatted} - ${toFormatted})`;
            }
            else {
                return `${fromFormatted} - ${toFormatted}`;
            }
        }
        catch (error) {
            console.error("Error formatting date period:", error);
            return `${filters.dateRange.from} - ${filters.dateRange.to}`;
        }
    }, [filters.dateRange, dateFnsLoaded, dynamicLibraries.dateFns]);
    // Chart colors
    const COLORS = [
        "#0088FE",
        "#00C49F",
        "#FFBB28",
        "#FF8042",
        "#8884D8",
        "#82CA9D",
    ];
    // Memoized chart data processing for better performance
    const processedChartData = useMemo(() => {
        if (!analyticsData)
            return null;
        console.log("Processing chart data:", analyticsData);
        let trendsData = [];
        if (analyticsData.trends) {
            if (dateFnsLoaded && dynamicLibraries.dateFns) {
                try {
                    const { format } = dynamicLibraries.dateFns;
                    trendsData = analyticsData.trends.map((trend) => ({
                        ...trend,
                        date: format(new Date(trend.date), "MMM dd"),
                        fullDate: format(new Date(trend.date), "MMM dd, yyyy"),
                        rawDate: trend.date,
                    }));
                }
                catch (error) {
                    console.error("Error formatting trend dates:", error);
                    trendsData = analyticsData.trends.map((trend) => ({
                        ...trend,
                        date: new Date(trend.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        }),
                        fullDate: new Date(trend.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        }),
                        rawDate: trend.date,
                    }));
                }
            }
            else {
                // Fallback formatting without date-fns
                trendsData = analyticsData.trends.map((trend) => ({
                    ...trend,
                    date: new Date(trend.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                    }),
                    fullDate: new Date(trend.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    }),
                    rawDate: trend.date,
                }));
            }
        }
        return {
            trendsData,
            categoriesWithColors: analyticsData.categories?.map((category, index) => ({
                ...category,
                color: COLORS[index % COLORS.length],
            })) || [],
            wardsData: analyticsData.wards?.map((ward) => ({
                ...ward,
                efficiency: ward.complaints > 0 ? (ward.resolved / ward.complaints) * 100 : 0,
            })) || [],
        };
    }, [analyticsData, filters, dateFnsLoaded, dynamicLibraries.dateFns]); // Added dependencies
    // Helper function to render charts with dynamic recharts
    const renderChart = (chartType, chartProps) => {
        if (!rechartsLoaded || !dynamicLibraries.recharts) {
            return (_jsx("div", { className: "h-[300px] flex items-center justify-center text-muted-foreground", children: _jsxs("div", { className: "text-center", children: [_jsx(RefreshCw, { className: "h-6 w-6 animate-spin mx-auto mb-2" }), _jsx("p", { children: "Loading chart..." })] }) }));
        }
        try {
            const { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, ComposedChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip: RechartsTooltip, Legend, } = dynamicLibraries.recharts;
            const { data, ...otherProps } = chartProps;
            switch (chartType) {
                case "area":
                    return (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: data, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { ...otherProps.xAxis }), _jsx(YAxis, {}), _jsx(RechartsTooltip, { ...otherProps.tooltip }), _jsx(Legend, {}), otherProps.areas?.map((area, index) => (_jsx(Area, { ...area }, index)))] }) }));
                case "pie":
                    return (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { ...otherProps.pie, data: data, children: data.map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) }), _jsx(RechartsTooltip, { ...otherProps.tooltip })] }) }));
                case "bar":
                    return (_jsx(ResponsiveContainer, { width: "100%", height: otherProps.height || 300, children: _jsxs(BarChart, { data: data, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { ...otherProps.xAxis }), _jsx(YAxis, {}), _jsx(RechartsTooltip, { ...otherProps.tooltip }), _jsx(Legend, {}), otherProps.bars?.map((bar, index) => (_jsx(Bar, { ...bar }, index)))] }) }));
                case "composed":
                    return (_jsx(ResponsiveContainer, { width: "100%", height: otherProps.height || 400, children: _jsxs(ComposedChart, { data: data, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { ...otherProps.xAxis }), _jsx(YAxis, { yAxisId: "left" }), _jsx(YAxis, { yAxisId: "right", orientation: "right" }), _jsx(RechartsTooltip, { ...otherProps.tooltip }), _jsx(Legend, {}), otherProps.bars?.map((bar, index) => (_jsx(Bar, { ...bar }, index))), otherProps.lines?.map((line, index) => (_jsx(Line, { ...line }, index)))] }) }));
                default:
                    return (_jsx("div", { className: "h-[300px] flex items-center justify-center text-muted-foreground", children: _jsx("p", { children: "Chart type not supported" }) }));
            }
        }
        catch (error) {
            console.error("Error rendering chart:", error);
            return (_jsx("div", { className: "h-[300px] flex items-center justify-center text-muted-foreground", children: _jsxs("div", { className: "text-center", children: [_jsx(AlertTriangle, { className: "h-6 w-6 mx-auto mb-2 text-red-500" }), _jsx("p", { children: "Error loading chart" })] }) }));
        }
    };
    if (isLoading && !analyticsData) {
        return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx(Skeleton, { className: "h-8 w-64 mb-2" }), _jsx(Skeleton, { className: "h-4 w-80" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Skeleton, { className: "h-10 w-28" }), _jsx(Skeleton, { className: "h-10 w-28" }), _jsx(Skeleton, { className: "h-10 w-28" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(Skeleton, { className: "h-5 w-28" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", children: [...Array(5)].map((_, i) => (_jsx(Skeleton, { className: "h-10 w-full" }, i))) }) })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [...Array(4)].map((_, i) => (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(Skeleton, { className: "h-4 w-32" }) }), _jsxs(CardContent, { children: [_jsx(Skeleton, { className: "h-8 w-24 mb-2" }), _jsx(Skeleton, { className: "h-3 w-full" })] })] }, i))) })] }));
    }
    if (error) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx(AlertTriangle, { className: "h-12 w-12 text-red-500 mx-auto mb-4" }), _jsx("h2", { className: "text-xl font-semibold mb-2", children: "Error Loading Data" }), _jsx("p", { className: "text-gray-600 mb-4", children: error }), _jsxs(Button, { onClick: fetchAnalyticsData, children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Retry"] })] }) }));
    }
    if (libraryLoadError) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx(AlertTriangle, { className: "h-12 w-12 text-orange-500 mx-auto mb-4" }), _jsx("h2", { className: "text-xl font-semibold mb-2", children: "Feature Loading Error" }), _jsx("p", { className: "text-gray-600 mb-4", children: libraryLoadError }), _jsxs(Button, { onClick: loadDynamicLibraries, children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Retry Loading Features"] })] }) }));
    }
    if (!rechartsLoaded || !dateFnsLoaded) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RefreshCw, { className: "h-6 w-6 animate-spin" }), _jsx("span", { children: "Loading chart libraries..." })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "border-b pb-4", children: [_jsx("nav", { className: "mb-2 text-xs text-muted-foreground", "aria-label": "Breadcrumb", children: _jsxs("ol", { className: "flex items-center gap-1", children: [_jsx("li", { children: _jsx(Link, { to: "/dashboard", className: "hover:text-foreground", children: "Dashboard" }) }), _jsx("li", { children: "/" }), _jsx("li", { className: "text-foreground font-medium", children: "Reports" })] }) }), _jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h1", { className: "text-2xl lg:text-3xl font-bold tracking-tight", children: translations?.reports?.title || "Reports & Analytics" }), _jsxs("p", { className: "text-sm text-muted-foreground hidden md:block", children: [appName, " \u2013", " ", user?.role === "ADMINISTRATOR"
                                                ? "Comprehensive system-wide insights and analytics"
                                                : user?.role === "WARD_OFFICER"
                                                    ? `Analytics for ${getWardNameById(user?.wardId)}`
                                                    : "Your assigned task analytics and performance metrics"] }), _jsxs("div", { className: "mt-1 flex flex-wrap gap-2", children: [_jsxs(Badge, { variant: "secondary", className: "text-xs", children: [_jsx(Calendar, { className: "h-3 w-3 mr-2" }), "Data Period: ", getTimePeriodLabel()] }), user?.role === "WARD_OFFICER" && user?.wardId && (_jsxs(Badge, { variant: "outline", className: "text-xs", children: ["Ward: ", getWardNameById(user.wardId)] }))] })] }), permissions.canExportData && (_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleExport("csv"), disabled: isExporting, children: [_jsx(FileText, { className: "h-4 w-4" }), _jsx("span", { className: "hidden sm:inline", children: "Export CSV" })] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleExport("excel"), disabled: isExporting, children: [_jsx(FileSpreadsheet, { className: "h-4 w-4" }), _jsx("span", { className: "hidden sm:inline", children: "Export Excel" })] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleExport("pdf"), disabled: isExporting, children: [_jsx(Download, { className: "h-4 w-4" }), _jsx("span", { className: "hidden sm:inline", children: "Export PDF" })] })] }))] })] }), _jsxs(Card, { className: "sticky top-20 z-10 bg-card shadow-sm ring-1 ring-border", children: [_jsx(CardHeader, { className: "pb-3 border-b", children: _jsxs(CardTitle, { className: "flex items-center text-base font-semibold", children: [_jsx(Filter, { className: "h-4 w-4 mr-2" }), "Filters"] }) }), _jsxs(CardContent, { className: "pt-0", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-3", children: [_jsxs("div", { className: "col-span-1 lg:col-span-2", children: [_jsx(Label, { children: "Date Range" }), _jsxs(Popover, { open: datePopoverOpen, onOpenChange: setDatePopoverOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: "w-full justify-between", size: "sm", children: [_jsxs("span", { children: [filters.dateRange.from, " \u2192 ", filters.dateRange.to] }), _jsx(Calendar, { className: "h-4 w-4 opacity-70" })] }) }), _jsx(PopoverContent, { className: "w-[320px]", align: "start", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-1 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "from-date-picker", children: "From" }), _jsx(Input, { id: "from-date-picker", type: "date", defaultValue: filters.dateRange.from })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "to-date-picker", children: "To" }), _jsx(Input, { id: "to-date-picker", type: "date", defaultValue: filters.dateRange.to })] })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => setDatePopoverOpen(false), children: "Cancel" }), _jsx(Button, { size: "sm", onClick: () => {
                                                                                const fromInput = document.getElementById("from-date-picker")?.value || filters.dateRange.from;
                                                                                const toInput = document.getElementById("to-date-picker")?.value || filters.dateRange.to;
                                                                                setFilters((prev) => ({
                                                                                    ...prev,
                                                                                    dateRange: { from: fromInput, to: toInput },
                                                                                }));
                                                                                setDatePopoverOpen(false);
                                                                            }, children: "Apply" })] })] }) })] })] }), permissions.canViewAllWards && (_jsxs("div", { children: [_jsx(Label, { htmlFor: "ward-filter", children: "Ward" }), _jsxs(Select, { value: filters.ward, onValueChange: (value) => setFilters((prev) => ({ ...prev, ward: value })), children: [_jsx(SelectTrigger, { disabled: wardsLoading || isLoading, children: _jsx(SelectValue, { placeholder: wardsLoading ? "Loading wards..." : "Select ward" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Wards" }), wards.map((w) => (_jsx(SelectItem, { value: w.id, children: w.name }, w.id)))] })] })] })), _jsxs("div", { children: [_jsx(Label, { htmlFor: "type-filter", children: "Complaint Type" }), _jsxs(Select, { value: filters.complaintType, onValueChange: (value) => setFilters((prev) => ({ ...prev, complaintType: value })), children: [_jsx(SelectTrigger, { disabled: isLoading, children: _jsx(SelectValue, { placeholder: "Select type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), _jsx(SelectItem, { value: "water", children: "Water Supply" }), _jsx(SelectItem, { value: "electricity", children: "Electricity" }), _jsx(SelectItem, { value: "road", children: "Road Repair" }), _jsx(SelectItem, { value: "garbage", children: "Garbage Collection" }), _jsx(SelectItem, { value: "lighting", children: "Street Lighting" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "status-filter", children: "Status" }), _jsxs(Select, { value: filters.status, onValueChange: (value) => setFilters((prev) => ({ ...prev, status: value })), children: [_jsx(SelectTrigger, { disabled: isLoading, children: _jsx(SelectValue, { placeholder: "Select status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "registered", children: "Registered" }), _jsx(SelectItem, { value: "assigned", children: "Assigned" }), _jsx(SelectItem, { value: "in_progress", children: "In Progress" }), _jsx(SelectItem, { value: "resolved", children: "Resolved" }), _jsx(SelectItem, { value: "closed", children: "Closed" })] })] })] })] }), _jsxs("div", { className: "flex justify-end mt-4 space-x-2 border-t pt-3", children: [_jsxs(Button, { variant: "outline", onClick: () => {
                                            console.log("Resetting filters...");
                                            // Reset to original data range if available
                                            if (analyticsData?.trends && analyticsData.trends.length > 0) {
                                                const dates = analyticsData.trends
                                                    .map((t) => new Date(t.date))
                                                    .sort((a, b) => a.getTime() - b.getTime());
                                                // Use fallback date formatting
                                                const earliestDate = dates[0].toISOString().split("T")[0];
                                                const latestDate = dates[dates.length - 1]
                                                    .toISOString()
                                                    .split("T")[0];
                                                setFilters({
                                                    dateRange: {
                                                        from: earliestDate,
                                                        to: latestDate,
                                                    },
                                                    ward: permissions.defaultWard,
                                                    complaintType: "all",
                                                    status: "all",
                                                    priority: "all",
                                                });
                                            }
                                            else {
                                                // Fallback to current month if no data
                                                const now = new Date();
                                                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                                                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                                                setFilters({
                                                    dateRange: {
                                                        from: firstDay.toISOString().split("T")[0],
                                                        to: lastDay.toISOString().split("T")[0],
                                                    },
                                                    ward: permissions.defaultWard,
                                                    complaintType: "all",
                                                    status: "all",
                                                    priority: "all",
                                                });
                                            }
                                        }, children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Reset Filters"] }), _jsxs(Button, { onClick: handleGenerateReport, disabled: isGeneratingReport, children: [_jsx(BarChart3, { className: "h-4 w-4 mr-2" }), isGeneratingReport ? "Generating..." : "Generate Report"] })] })] })] }), _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Key Metrics" }), _jsxs(Badge, { variant: "outline", className: "text-xs", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), getTimePeriodLabel()] })] }), isLoading && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", "aria-live": "polite", children: [...Array(4)].map((_, i) => (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(Skeleton, { className: "h-4 w-32" }) }), _jsxs(CardContent, { children: [_jsx(Skeleton, { className: "h-8 w-24 mb-2" }), _jsx(Skeleton, { className: "h-3 w-full" })] })] }, i))) })), analyticsData && (_jsx(TooltipProvider, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: ["Total Complaints", _jsxs(UITooltip, { children: [_jsx(TooltipTrigger, { children: _jsx(Info, { className: "h-4 w-4 text-muted-foreground" }) }), _jsx(TooltipContent, { children: "All complaints matching your selected filters and date range." })] })] }), _jsx(FileText, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: analyticsData.complaints.total }), _jsxs("div", { className: "flex items-center text-xs text-muted-foreground", children: [_jsx(TrendingUp, { className: "h-3 w-3 mr-1" }), "+12% from last month"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: ["Resolved", _jsxs(UITooltip, { children: [_jsx(TooltipTrigger, { children: _jsx(Info, { className: "h-4 w-4 text-muted-foreground" }) }), _jsx(TooltipContent, { children: "Number of complaints marked resolved in the selected period. The rate shows Resolved \u00F7 Total." })] })] }), _jsx(CheckCircle, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: analyticsData.complaints.resolved }), _jsxs("div", { className: "flex items-center text-xs text-muted-foreground", children: [_jsx(TrendingUp, { className: "h-3 w-3 mr-1" }), (analyticsData.complaints.total > 0
                                                    ? (analyticsData.complaints.resolved /
                                                        analyticsData.complaints.total) *
                                                        100
                                                    : 0).toFixed(1), "% resolution rate"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: ["SLA Compliance", _jsxs(UITooltip, { children: [_jsx(TooltipTrigger, { children: _jsx(Info, { className: "h-4 w-4 text-muted-foreground" }) }), _jsx(TooltipContent, { children: "Average on\u2011time performance across complaint types, using each type\u2019s configured SLA hours." })] })] }), _jsx(Target, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold", children: [analyticsData.sla.compliance, "%"] }), _jsx(Progress, { value: analyticsData.sla.compliance, className: "mt-2" }), _jsxs("div", { className: "flex items-center text-xs text-muted-foreground mt-2", children: [_jsx(Clock, { className: "h-3 w-3 mr-1" }), "Avg: ", analyticsData.sla.avgResolutionTime, " days"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: ["Satisfaction", _jsxs(UITooltip, { children: [_jsx(TooltipTrigger, { children: _jsx(Info, { className: "h-4 w-4 text-muted-foreground" }) }), _jsx(TooltipContent, { children: "Average citizen feedback rating during the selected period." })] })] }), _jsx(Users, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold", children: [analyticsData.performance.userSatisfaction.toFixed(2), "/5"] }), _jsxs("div", { className: "flex items-center text-xs text-muted-foreground", children: [_jsx(TrendingUp, { className: "h-3 w-3 mr-1" }), "+0.2 from last month"] })] })] })] }) })), analyticsData && (_jsxs(Tabs, { defaultValue: "overview", className: "space-y-4", children: [_jsxs(TabsList, { className: "grid grid-cols-5 w-full", children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "trends", children: "Trends" }), _jsx(TabsTrigger, { value: "performance", children: "Performance" }), permissions.canViewAllWards && (_jsx(TabsTrigger, { value: "wards", children: "Ward Analysis" })), _jsx(TabsTrigger, { value: "categories", children: "Categories" })] }), _jsxs(TabsContent, { value: "overview", className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Complaints Trend" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: getTimePeriodLabel() })] }), _jsx(CardContent, { children: _jsx("div", { id: "trends-chart", children: processedChartData?.trendsData?.length > 0 ? (renderChart("area", {
                                                        data: processedChartData.trendsData,
                                                        xAxis: {
                                                            dataKey: "date",
                                                            tick: { fontSize: 12 },
                                                            angle: -45,
                                                            textAnchor: "end",
                                                            height: 60,
                                                        },
                                                        tooltip: {
                                                            labelFormatter: (label, payload) => {
                                                                if (payload && payload[0]) {
                                                                    return `Date: ${payload[0].payload.fullDate || label}`;
                                                                }
                                                                return `Date: ${label}`;
                                                            },
                                                            formatter: (value, name) => [
                                                                value,
                                                                name === "complaints"
                                                                    ? "Total Complaints"
                                                                    : "Resolved Complaints",
                                                            ],
                                                        },
                                                        areas: [
                                                            {
                                                                type: "monotone",
                                                                dataKey: "complaints",
                                                                stackId: "1",
                                                                stroke: "#8884d8",
                                                                fill: "#8884d8",
                                                            },
                                                            {
                                                                type: "monotone",
                                                                dataKey: "resolved",
                                                                stackId: "1",
                                                                stroke: "#82ca9d",
                                                                fill: "#82ca9d",
                                                            },
                                                        ],
                                                    })) : (_jsx("div", { className: "h-[300px] flex items-center justify-center text-muted-foreground", children: _jsxs("div", { className: "text-center", children: [_jsx(BarChart3, { className: "h-12 w-12 mx-auto mb-2 opacity-50" }), _jsx("p", { children: "No trend data available for selected period" }), _jsx("p", { className: "text-sm font-medium", children: getTimePeriodLabel() }), _jsx("p", { className: "text-xs", children: "Try adjusting your date range or filters" })] }) })) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Complaint Categories" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: getTimePeriodLabel() })] }), _jsx(CardContent, { children: _jsx("div", { id: "categories-chart", children: processedChartData?.categoriesWithColors?.length > 0 ? (renderChart("pie", {
                                                        data: processedChartData.categoriesWithColors,
                                                        pie: {
                                                            cx: "50%",
                                                            cy: "50%",
                                                            labelLine: false,
                                                            label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`,
                                                            outerRadius: 80,
                                                            fill: "#8884d8",
                                                            dataKey: "count",
                                                        },
                                                        tooltip: {
                                                            formatter: (value, name) => [
                                                                `${value} complaints`,
                                                                name,
                                                            ],
                                                            labelFormatter: (label) => `Category: ${label}`,
                                                        },
                                                    })) : (_jsx("div", { className: "h-[300px] flex items-center justify-center text-muted-foreground", children: _jsxs("div", { className: "text-center", children: [_jsx(PieChartIcon, { className: "h-12 w-12 mx-auto mb-2 opacity-50" }), _jsx("p", { children: "No category data available for selected period" }), _jsx("p", { className: "text-sm font-medium", children: getTimePeriodLabel() }), _jsx("p", { className: "text-xs", children: "Try adjusting your filters or date range" })] }) })) }) })] })] }), (user?.role === "ADMINISTRATOR" ||
                                user?.role === "WARD_OFFICER") && (_jsxs("div", { className: "mt-6", children: [_jsx(HeatmapGrid, { title: user?.role === "ADMINISTRATOR"
                                            ? "Complaints × Wards Heatmap"
                                            : "Complaints × Sub-zones Heatmap", description: user?.role === "ADMINISTRATOR"
                                            ? "Distribution of complaints by type across all wards"
                                            : `Distribution of complaints by type across sub-zones in ${getWardNameById(user?.wardId)}`, data: heatmapData || {
                                            xLabels: [],
                                            yLabels: [],
                                            matrix: [],
                                            xAxisLabel: "Complaint Type",
                                            yAxisLabel: user?.role === "ADMINISTRATOR" ? "Ward" : "Sub-zone",
                                        } }), heatmapLoading && (_jsxs("div", { className: "h-8 flex items-center text-xs text-muted-foreground mt-2", children: [_jsx(RefreshCw, { className: "h-3 w-3 mr-2 animate-spin" }), " Updating heatmap..."] }))] }))] }), _jsx(TabsContent, { value: "trends", className: "space-y-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Detailed Trends Analysis" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: getTimePeriodLabel() })] }), _jsx(CardContent, { children: _jsx("div", { id: "detailed-trends-chart", children: processedChartData?.trendsData?.length ? (renderChart("composed", {
                                            data: processedChartData.trendsData,
                                            height: 400,
                                            xAxis: {
                                                dataKey: "date",
                                                tick: { fontSize: 12 },
                                                angle: -45,
                                                textAnchor: "end",
                                                height: 60,
                                            },
                                            tooltip: {
                                                labelFormatter: (label, payload) => {
                                                    if (payload && payload[0]) {
                                                        return `Date: ${payload[0].payload.fullDate || label}`;
                                                    }
                                                    return `Date: ${label}`;
                                                },
                                                formatter: (value, name) => [
                                                    name === "slaCompliance" ? `${value}%` : value,
                                                    name === "slaCompliance" ? "SLA Compliance" : name,
                                                ],
                                            },
                                            bars: [
                                                {
                                                    yAxisId: "left",
                                                    dataKey: "complaints",
                                                    fill: "#8884d8",
                                                },
                                                {
                                                    yAxisId: "left",
                                                    dataKey: "resolved",
                                                    fill: "#82ca9d",
                                                },
                                            ],
                                            lines: [
                                                {
                                                    yAxisId: "right",
                                                    type: "monotone",
                                                    dataKey: "slaCompliance",
                                                    stroke: "#ff7300",
                                                },
                                            ],
                                        })) : (_jsx("div", { className: "h-[400px] flex items-center justify-center text-muted-foreground", children: _jsxs("div", { className: "text-center", children: [_jsx(BarChart3, { className: "h-12 w-12 mx-auto mb-2 opacity-50" }), _jsx("p", { children: "No trend data available for selected filters" }), _jsx("p", { className: "text-sm font-medium", children: getTimePeriodLabel() }), _jsx("p", { className: "text-xs", children: "Try adjusting your date range or filters" })] }) })) }) })] }) }), _jsx(TabsContent, { value: "performance", className: "space-y-4", children: _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-1 gap-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Resolution Time Distribution" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: getTimePeriodLabel() })] }), _jsx(CardContent, { children: _jsx("div", { id: "resolution-time-chart", children: (processedChartData?.categoriesWithColors?.length || 0) >
                                                0 ? (renderChart("bar", {
                                                data: processedChartData?.categoriesWithColors || [],
                                                xAxis: {
                                                    dataKey: "name",
                                                    tick: { fontSize: 11 },
                                                    angle: -45,
                                                    textAnchor: "end",
                                                    height: 80,
                                                },
                                                tooltip: {
                                                    formatter: (value) => [
                                                        `${value} days`,
                                                        "Avg Resolution Time",
                                                    ],
                                                    labelFormatter: (label) => `Category: ${label}`,
                                                },
                                                bars: [
                                                    {
                                                        dataKey: "avgTime",
                                                        fill: "#8884d8",
                                                        name: "Avg Resolution Time (days)",
                                                    },
                                                ],
                                            })) : (_jsx("div", { className: "h-[300px] flex items-center justify-center text-muted-foreground", children: _jsxs("div", { className: "text-center", children: [_jsx(BarChart3, { className: "h-12 w-12 mx-auto mb-2 opacity-50" }), _jsx("p", { children: "No category metrics to display for selected filters" }), _jsx("p", { className: "text-sm font-medium", children: getTimePeriodLabel() }), _jsx("p", { className: "text-xs", children: "Refine filters to include more data" })] }) })) }) })] }) }) }), permissions.canViewAllWards && (_jsx(TabsContent, { value: "wards", className: "space-y-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Ward Performance Comparison" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: getTimePeriodLabel() })] }), _jsx(CardContent, { children: _jsx("div", { id: "ward-performance-chart", children: (processedChartData?.wardsData?.length || 0) > 0 ? (renderChart("bar", {
                                            data: processedChartData?.wardsData || [],
                                            height: 400,
                                            xAxis: {
                                                dataKey: "name",
                                                tick: { fontSize: 11 },
                                                angle: -45,
                                                textAnchor: "end",
                                                height: 80,
                                            },
                                            bars: [
                                                { dataKey: "complaints", fill: "#8884d8" },
                                                { dataKey: "resolved", fill: "#82ca9d" },
                                            ],
                                        })) : (_jsx("div", { className: "h-[400px] flex items-center justify-center text-muted-foreground", children: _jsxs("div", { className: "text-center", children: [_jsx(BarChart3, { className: "h-12 w-12 mx-auto mb-2 opacity-50" }), _jsx("p", { children: "No ward comparison data for current filters" }), _jsx("p", { className: "text-xs", children: "Adjust filters or date range" })] }) })) }) })] }) })), _jsx(TabsContent, { value: "categories", className: "space-y-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Category Analysis" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: getTimePeriodLabel() })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: (processedChartData?.categoriesWithColors || []).map((category, index) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-4 h-4 rounded", style: {
                                                                backgroundColor: COLORS[index % COLORS.length],
                                                            } }), _jsx("span", { className: "font-medium", children: category.name })] }), _jsxs("div", { className: "flex items-center space-x-4 text-sm text-muted-foreground", children: [_jsxs("span", { children: [category.count, " complaints"] }), _jsxs("span", { children: ["Avg: ", category.avgTime, " days"] })] })] }, category.name))) }) })] }) })] })), _jsx(Dialog, { open: showReportModal, onOpenChange: () => { }, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center", children: [_jsx(BarChart3, { className: "h-5 w-5 mr-2" }), "Generating Report"] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-lg font-medium mb-2", children: "Generating Report..." }), _jsxs("div", { className: "text-sm text-muted-foreground mb-4", children: ["Processing ", getTimePeriodLabel(), " data"] }), _jsxs("div", { className: "relative inline-flex items-center justify-center mb-4", children: [_jsx("div", { className: "w-20 h-20 rounded-full border-4 border-border", children: _jsx("div", { className: "w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin" }) }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs("span", { className: "text-lg font-bold text-primary", children: [Math.floor(reportProgress), "%"] }) })] }), _jsx("div", { className: "text-sm text-muted-foreground", children: reportProgress < 100
                                                ? `Estimated time remaining: ${Math.max(0, Math.ceil((100 - reportProgress) * 0.05))} seconds`
                                                : "Finalizing report..." })] }), _jsxs("div", { className: "bg-muted border border-border rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx(Calendar, { className: "h-4 w-4 text-primary mr-2" }), _jsx("span", { className: "font-medium text-foreground", children: "Report Scope" })] }), _jsxs("div", { className: "space-y-2 text-sm text-muted-foreground", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Period:" }), _jsx("span", { className: "font-medium", children: getTimePeriodLabel() })] }), filters.ward !== "all" && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Ward:" }), _jsx("span", { className: "font-medium", children: getWardNameById(filters.ward) })] })), filters.complaintType !== "all" && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Type:" }), _jsx("span", { className: "font-medium", children: filters.complaintType })] })), filters.status !== "all" && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Status:" }), _jsx("span", { className: "font-medium", children: filters.status })] }))] })] })] }), _jsx(DialogFooter, { children: _jsx(Button, { variant: "outline", onClick: handleCancelReport, disabled: reportProgress >= 100, children: "Cancel" }) })] }) })] }));
};
export default UnifiedReports;
