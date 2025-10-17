import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppSelector } from "../store/hooks";
import { useGlobalLoader } from "../hooks/useGlobalLoader";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { parseReportError, handleExportError } from "../utils/reportErrorHandler";
import { TemplateSelector } from "../components/TemplateSelector";
import { ExportTestPanel } from "../components/ExportTestPanel";
import { exportToPDF, exportToExcel, exportToCSV, prepareReportData, validateExportPermissions, exportWithTemplate, prepareUnifiedReportData, validateExportRequest } from "../utils/exportUtilsRevamped";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "../components/ui/popover";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import {
    Tooltip as UITooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "../components/ui/tooltip";
import HeatmapGrid, { HeatmapData } from "../components/charts/HeatmapGrid";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import { getAnalyticsData, getHeatmapData } from "../utils/reportUtils";
import type { AnalyticsData, FilterOptions } from "../types/reports";
import {
    CalendarDays,
    Download,
    FileText,
    TrendingUp,
    TrendingDown,
    MapPin,
    Clock,
    AlertTriangle,
    CheckCircle,
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
    Target,
    Users,
    Zap,
    Filter,
    RefreshCw,
    Share2,
    FileSpreadsheet,
    Calendar,
    Info,
    RotateCcw,
    ChevronDown,
    Eye,
    EyeOff,
    Settings,
} from "lucide-react";

// Enhanced color palette for professional theming
const CHART_COLORS = {
    primary: "#0f5691",
    success: "#27ae60", 
    warning: "#f39c12",
    danger: "#e74c3c",
    purple: "#9b59b6",
    blue: "#1e40af",
    gray: "#34495e",
    yellow: "#f1c40f",
    orange: "#e67e22",
    violet: "#7c3aed",
};

const STATUS_COLORS = {
    REGISTERED: "#6b7280",
    ASSIGNED: "#3b82f6", 
    IN_PROGRESS: "#f59e0b",
    RESOLVED: "#10b981",
    CLOSED: "#059669",
    REOPENED: "#ef4444",
};

const PRIORITY_COLORS = {
    LOW: "#10b981",
    MEDIUM: "#f59e0b", 
    HIGH: "#f97316",
    CRITICAL: "#ef4444",
};

// Date range presets
const DATE_PRESETS = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "This Week", value: "thisWeek" },
    { label: "Last Week", value: "lastWeek" },
    { label: "This Month", value: "thisMonth" },
    { label: "Last Month", value: "lastMonth" },
    { label: "Last 3 Months", value: "last3Months" },
    { label: "This Year", value: "thisYear" },
    { label: "Custom", value: "custom" },
];

interface EnhancedFilterOptions {
    dateRange: { from: string; to: string };
    ward: string;
    complaintType: string;
    status: string;
    priority: string;
    complaintTypes: string[];
    statuses: string[];
    priorities: string[];
    wards: string[];
    officers: string[];
}

interface DashboardCard {
    title: string;
    metric: string;
    icon: React.ComponentType<any>;
    color: keyof typeof CHART_COLORS;
    description: string;
    value: number;
    change?: number;
    changeType?: 'increase' | 'decrease';
}

const UnifiedReportsRevamped: React.FC = () => {
    const { user } = useAppSelector((state) => state.auth);
    const { appName, appLogoUrl, getConfig } = useSystemConfig();
    const { withLoader } = useGlobalLoader();

    // Dynamic imports state
    const [rechartsLoaded, setRechartsLoaded] = useState(false);
    const [exportUtilsLoaded, setExportUtilsLoaded] = useState(false);
    const [dynamicLibraries, setDynamicLibraries] = useState<any>({});
    const [libraryLoadError, setLibraryLoadError] = useState<string | null>(null);

    // Enhanced state management with proper initialization
    const [enhancedFilters, setEnhancedFilters] = useState<EnhancedFilterOptions>(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
            dateRange: { 
                from: startOfMonth.toISOString().split("T")[0] || "", 
                to: now.toISOString().split("T")[0] || ""
            },
            ward: "all",
            complaintType: "all",
            status: "all",
            priority: "all",
            complaintTypes: [],
            statuses: [],
            priorities: [],
            wards: [],
            officers: [],
        };
    });

    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [wards, setWards] = useState<Array<{ id: string; name: string }>>([]);
    const [officers, setOfficers] = useState<Array<{ id: string; name: string; role: string }>>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
    const [datePreset, setDatePreset] = useState("thisMonth");
    const [visibleCharts, setVisibleCharts] = useState({
        typeDistribution: true,
        wardOverview: true,
        statusTrend: true,
        slaCompliance: true,
        priorityBreakdown: true,
        teamPerformance: true,
    });
    const [isInitialized, setIsInitialized] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [debugMode, setDebugMode] = useState(false);

    // Load dynamic libraries
    const loadDynamicLibraries = useCallback(async () => {
        try {
            if (!rechartsLoaded) {
                const recharts = await import("recharts");
                setDynamicLibraries((prev: any) => ({ ...prev, recharts }));
                setRechartsLoaded(true);
            }

            if (!exportUtilsLoaded) {
                const exportUtils = await import("../utils/exportUtilsRevamped");
                setDynamicLibraries((prev: any) => ({ ...prev, exportUtils }));
                setExportUtilsLoaded(true);
            }
        } catch (error) {
            console.error("Failed to load dynamic libraries:", error);
            setLibraryLoadError("Failed to load required libraries. Some features may not work.");
        }
    }, [rechartsLoaded, exportUtilsLoaded]);

    useEffect(() => {
        loadDynamicLibraries();
    }, [loadDynamicLibraries]);

    // Get role-based permissions
    const permissions = useMemo(() => {
        const role = user?.role;
        return {
            canViewAllWards: role === "ADMINISTRATOR",
            canViewTeamPerformance: role === "ADMINISTRATOR" || role === "WARD_OFFICER",
            canExportData: role === "ADMINISTRATOR" || role === "WARD_OFFICER",
            canViewOfficerData: role === "ADMINISTRATOR",
            defaultWard: role === "WARD_OFFICER" ? user?.wardId : "all",
            restrictedToPersonal: role === "CITIZEN",
            restrictedToAssigned: role === "MAINTENANCE_TEAM",
        };
    }, [user]);

    // Date range calculation helper - removed dependency to prevent infinite loop
    const calculateDateRange = useCallback((preset: string) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (preset) {
            case "today":
                return { from: today.toISOString().split("T")[0], to: today.toISOString().split("T")[0] };
            case "yesterday":
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return { from: yesterday.toISOString().split("T")[0], to: yesterday.toISOString().split("T")[0] };
            case "thisWeek":
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                return { from: startOfWeek.toISOString().split("T")[0], to: today.toISOString().split("T")[0] };
            case "lastWeek":
                const lastWeekStart = new Date(today);
                lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
                const lastWeekEnd = new Date(lastWeekStart);
                lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
                return { from: lastWeekStart.toISOString().split("T")[0], to: lastWeekEnd.toISOString().split("T")[0] };
            case "thisMonth":
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                return { from: startOfMonth.toISOString().split("T")[0], to: today.toISOString().split("T")[0] };
            case "lastMonth":
                const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                return { from: lastMonthStart.toISOString().split("T")[0], to: lastMonthEnd.toISOString().split("T")[0] };
            case "last3Months":
                const threeMonthsAgo = new Date(today);
                threeMonthsAgo.setMonth(today.getMonth() - 3);
                return { from: threeMonthsAgo.toISOString().split("T")[0], to: today.toISOString().split("T")[0] };
            case "thisYear":
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                return { from: startOfYear.toISOString().split("T")[0], to: today.toISOString().split("T")[0] };
            default:
                // Return a default range instead of depending on state
                const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
                return { from: defaultStart.toISOString().split("T")[0], to: today.toISOString().split("T")[0] };
        }
    }, []); // Remove dependency to prevent infinite loop

    // Initialize flag after component mounts
    useEffect(() => {
        setIsInitialized(true);
    }, []);

    // Load wards and officers
    useEffect(() => {
        const loadData = async () => {
            if (!permissions.canViewAllWards) return;
            
            try {
                const baseUrl = window.location.origin;
                const [wardsResp, officersResp] = await Promise.all([
                    fetch(`${baseUrl}/api/users/wards`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    }),
                    fetch(`${baseUrl}/api/users/officers`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    }).catch(() => ({ ok: false, json: () => Promise.resolve({}) })) // Graceful fallback if endpoint doesn't exist
                ]);

                if (wardsResp.ok) {
                    const wardsData = await wardsResp.json();
                    const wardsList = (wardsData?.data || wardsData)?.wards || wardsData?.wards || wardsData;
                    if (Array.isArray(wardsList)) {
                        setWards(wardsList.map((w: any) => ({ id: w.id, name: w.name })));
                    }
                }

                if (officersResp.ok) {
                    const officersData = await officersResp.json();
                    const officersList = (officersData?.data || officersData)?.officers || officersData?.officers || officersData;
                    if (Array.isArray(officersList)) {
                        setOfficers(officersList.map((o: any) => ({ 
                            id: o.id, 
                            name: o.fullName || o.name, 
                            role: o.role 
                        })));
                    }
                }
            } catch (e) {
                console.warn("Failed to load wards/officers", e);
            }
        };
        loadData();
    }, [permissions.canViewAllWards]);

    // Fetch unified analytics data - with proper fetch control
    const fetchAnalyticsData = useCallback(async () => {
        if (!user || isFetching || !enhancedFilters.dateRange.from) return;
        
        setIsFetching(true);
        setIsLoading(true);
        setError(null);
        
        try {
            const queryParams = new URLSearchParams({
                from: enhancedFilters.dateRange.from,
                to: enhancedFilters.dateRange.to,
                ...(enhancedFilters.wards.length > 0 && { ward: enhancedFilters.wards.join(",") }),
                ...(enhancedFilters.complaintTypes.length > 0 && { type: enhancedFilters.complaintTypes.join(",") }),
                ...(enhancedFilters.statuses.length > 0 && { status: enhancedFilters.statuses.join(",") }),
                ...(enhancedFilters.priorities.length > 0 && { priority: enhancedFilters.priorities.join(",") }),
            });

            const baseUrl = window.location.origin;
            
            // Try the new unified endpoint first, fallback to old endpoint if it fails
            let response;
            let usedFallback = false;
            
            try {
                response = await fetch(`${baseUrl}/api/reports-revamped/unified?${queryParams}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                    signal: AbortSignal.timeout(10000), // 10 second timeout
                });
                
                if (!response.ok) {
                    if (response.status === 403) {
                        setError("You are not authorized to access this report. Please contact your administrator.");
                        return;
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (unifiedError) {
                console.warn("Unified endpoint failed, falling back to standard analytics:", unifiedError);
                usedFallback = true;
                
                // Fallback to the standard analytics endpoint
                const standardFilters: FilterOptions = {
                    dateRange: enhancedFilters.dateRange,
                    ward: enhancedFilters.wards.length > 0 ? (enhancedFilters.wards[0] || "all") : "all",
                    complaintType: enhancedFilters.complaintTypes.length > 0 ? (enhancedFilters.complaintTypes[0] || "all") : "all",
                    status: enhancedFilters.statuses.length > 0 ? (enhancedFilters.statuses[0] || "all") : "all",
                    priority: enhancedFilters.priorities.length > 0 ? (enhancedFilters.priorities[0] || "all") : "all",
                };
                
                try {
                    const data = await getAnalyticsData(standardFilters, user);
                    setAnalyticsData(data);
                    return;
                } catch (fallbackError) {
                    throw new Error(`Both unified and fallback endpoints failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
                }
            }

            if (usedFallback) return; // Already handled in fallback

            // Response is already checked in the try block above

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || "Failed to load analytics data");
            }

            // Transform unified data to match existing AnalyticsData interface
            const transformedData: AnalyticsData = {
                complaints: {
                    total: result.data.summary?.totalComplaints || 0,
                    resolved: result.data.summary?.resolvedComplaints || 0,
                    pending: result.data.summary?.pendingComplaints || 0,
                    overdue: result.data.summary?.overdueComplaints || 0,
                },
                sla: {
                    compliance: result.data.sla?.compliance || 0,
                    avgResolutionTime: result.data.sla?.avgResolutionTime || 0,
                    target: result.data.sla?.target || 72,
                },
                trends: result.data.trends || [],
                wards: result.data.wards || [],
                categories: result.data.categories || [],
                performance: result.data.performance || {
                    userSatisfaction: 0,
                    escalationRate: 0,
                    firstCallResolution: 0,
                    repeatComplaints: 0,
                },
            };

            setAnalyticsData(transformedData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load analytics data";
            setError(errorMessage);
            console.error("Analytics fetch error:", err);
        } finally {
            setIsLoading(false);
            setIsFetching(false);
        }
    }, [
        user?.id, 
        enhancedFilters.dateRange.from, 
        enhancedFilters.dateRange.to,
        enhancedFilters.wards.join(","),
        enhancedFilters.complaintTypes.join(","),
        enhancedFilters.statuses.join(","),
        enhancedFilters.priorities.join(","),
        isFetching
    ]);

    // Fetch heatmap data - with proper fetch control
    const fetchHeatmapData = useCallback(async () => {
        if (!user || !enhancedFilters.dateRange.from) return;
        
        try {
            const standardFilters: FilterOptions = {
                dateRange: enhancedFilters.dateRange,
                ward: enhancedFilters.wards.length > 0 ? (enhancedFilters.wards[0] || "all") : "all",
                complaintType: enhancedFilters.complaintTypes.length > 0 ? (enhancedFilters.complaintTypes[0] || "all") : "all",
                status: enhancedFilters.statuses.length > 0 ? (enhancedFilters.statuses[0] || "all") : "all",
                priority: enhancedFilters.priorities.length > 0 ? (enhancedFilters.priorities[0] || "all") : "all",
            };

            const data = await getHeatmapData(standardFilters, user);
            setHeatmapData(data);
        } catch (err) {
            console.warn("Heatmap fetch failed", err);
            setHeatmapData({
                xLabels: [],
                yLabels: [],
                matrix: [],
                xAxisLabel: "",
                yAxisLabel: "",
            });
        }
    }, [
        user?.id,
        enhancedFilters.dateRange.from,
        enhancedFilters.dateRange.to,
        enhancedFilters.wards.join(","),
        enhancedFilters.complaintTypes.join(","),
        enhancedFilters.statuses.join(","),
        enhancedFilters.priorities.join(",")
    ]);

    // Initial data fetch - controlled and debounced
    useEffect(() => {
        if (!user || !enhancedFilters.dateRange.from || !isInitialized || isFetching) return;
        
        // Debounce the fetch to prevent excessive calls
        const timeoutId = setTimeout(() => {
            fetchAnalyticsData();
            fetchHeatmapData();
        }, 1000); // Increased debounce time

        return () => clearTimeout(timeoutId);
    }, [
        user?.id, 
        isInitialized,
        enhancedFilters.dateRange.from, 
        enhancedFilters.dateRange.to, 
        enhancedFilters.wards.join(","), 
        enhancedFilters.complaintTypes.join(","), 
        enhancedFilters.statuses.join(","), 
        enhancedFilters.priorities.join(",")
    ]); // Removed function dependencies to prevent infinite loops

    // Complaint types for filters
    const { complaintTypes, isLoading: complaintTypesLoading } = useComplaintTypes();

    // Dashboard cards configuration
    const dashboardCards: DashboardCard[] = useMemo(() => {
        if (!analyticsData) return [];

        return [
            {
                title: "Total Complaints",
                metric: "count",
                icon: FileText,
                color: "primary",
                description: "Total complaints registered in selected date range.",
                value: analyticsData.complaints.total,
                change: 12,
                changeType: 'increase',
            },
            {
                title: "Resolved Complaints", 
                metric: "count",
                icon: CheckCircle,
                color: "success",
                description: "Complaints successfully resolved within SLA.",
                value: analyticsData.complaints.resolved,
                change: 8,
                changeType: 'increase',
            },
            {
                title: "Overdue Complaints",
                metric: "count", 
                icon: AlertTriangle,
                color: "danger",
                description: "Complaints exceeding their SLA deadlines.",
                value: analyticsData.complaints.overdue,
                change: 3,
                changeType: 'decrease',
            },
            {
                title: "Reopened Complaints",
                metric: "count",
                icon: RotateCcw, 
                color: "warning",
                description: "Complaints reopened by citizens after closure.",
                value: analyticsData.complaints.pending, // Using pending as proxy for reopened
                change: 2,
                changeType: 'decrease',
            },
        ];
    }, [analyticsData]);

    // Export functionality
    const handleExport = async (format: "pdf" | "excel" | "csv") => {
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

        // Validate export request
        const validation = validateExportRequest(enhancedFilters, user?.role || '');
        if (!validation.isValid && validation.error) {
            alert(validation.error.message);
            return;
        }

        // Use centralized loader
        await withLoader(async () => {
            // Build query parameters with current filters
            const queryParams = new URLSearchParams({
                format: format, // Specify the format for backend
                from: enhancedFilters.dateRange.from,
                to: enhancedFilters.dateRange.to,
                ...(enhancedFilters.wards.length > 0 && { ward: enhancedFilters.wards.join(",") }),
                ...(enhancedFilters.complaintTypes.length > 0 && { type: enhancedFilters.complaintTypes.join(",") }),
                ...(enhancedFilters.statuses.length > 0 && { status: enhancedFilters.statuses.join(",") }),
                ...(enhancedFilters.priorities.length > 0 && { priority: enhancedFilters.priorities.join(",") }),
            });

            // Override ward for Ward Officers
            if (user?.role === "WARD_OFFICER" && user?.wardId) {
                queryParams.set("ward", user.wardId);
            }

            // Validate export permissions
            const requestedData = {
                includesOtherWards: enhancedFilters.wards.length === 0 && user?.role !== "ADMINISTRATOR",
                includesUnassignedComplaints: user?.role === "MAINTENANCE_TEAM" && enhancedFilters.wards.length === 0,
            };

            // Check permissions if validation function is available
            if (dynamicLibraries.exportUtils?.validateExportPermissions) {
                const { validateExportPermissions } = dynamicLibraries.exportUtils;
                if (!validateExportPermissions(user?.role || "", requestedData)) {
                    alert("You don't have permission to export data outside your assigned scope");
                    return;
                }
            }

            const baseUrl = window.location.origin;
            const response = await fetch(`${baseUrl}/api/reports-revamped/export?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Export failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            // Handle different response types based on format
            if (format === "csv" || format === "pdf" || format === "excel") {
                // Backend returns file directly - trigger download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                
                // Get filename from Content-Disposition header or generate one
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `${(appName || 'App').replace(/\s+/g, "-")}-Report-${new Date().toISOString().split('T')[0]}`;
                
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1];
                    }
                } else {
                    // Add appropriate extension
                    const extensions: Record<string, string> = { csv: '.csv', pdf: '.pdf', excel: '.xlsx' };
                    filename += extensions[format as string] || '.txt';
                }
                
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                // Show success message
                if (dynamicLibraries.ui?.showSuccessToast) {
                    dynamicLibraries.ui.showSuccessToast("Export Successful", `${format.toUpperCase()} file downloaded successfully`);
                }
            } else {
                // JSON response - use client-side export (fallback)
                const exportData = await response.json();

                if (!exportData.success) {
                    throw new Error(exportData.message || "Export failed");
                }

                // Use client-side export as fallback
                if (dynamicLibraries.exportUtils) {
                    const { exportToPDF, exportToExcel, exportToCSV } = dynamicLibraries.exportUtils;
                    
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

                    switch (format) {
                        case "pdf":
                            await exportToPDF(
                                exportData.data,
                                analyticsData.trends,
                                analyticsData.categories,
                                exportOptions,
                            );
                            break;
                        case "excel":
                            exportToExcel(
                                exportData.data,
                                analyticsData.trends,
                                analyticsData.categories,
                                exportOptions,
                            );
                            break;
                        case "csv":
                            exportToCSV(exportData.data, exportOptions);
                            break;
                    }
                }
            }
        }, { text: `Generating ${format.toUpperCase()} export...` }).catch((err) => {
            console.error("Export error:", err);
            const reportError = handleExportError(err, format);
            
            // Show error toast if available
            if (dynamicLibraries.ui?.showErrorToast) {
                dynamicLibraries.ui.showErrorToast("Export Failed", reportError.message);
            } else {
                alert(`Export failed: ${reportError.message}`);
            }
        });
    };

    // Template-based export functionality
    const handleTemplateExport = async (templateId: string, format: "pdf" | "excel" | "html") => {
        if (!permissions.canExportData) {
            alert("You don't have permission to export data");
            return;
        }

        if (!analyticsData) {
            alert("No data available for export");
            return;
        }

        // Enhanced RBAC validation
        const validation = validateExportRequest(enhancedFilters, user?.role || '', user?.wardId);
        if (!validation.isValid && validation.error) {
            alert(validation.error.message);
            return;
        }

        setIsExporting(true);
        
        try {
            // Prepare template data with enhanced error handling
            console.log('🔄 Preparing template data for export...', {
                templateId,
                format,
                hasAnalyticsData: !!analyticsData,
                userRole: user?.role,
                filtersApplied: Object.keys(enhancedFilters).length
            });

            const templateData = prepareUnifiedReportData(
                analyticsData,
                { 
                    appName, 
                    appLogoUrl, 
                    complaintIdPrefix: getConfig("COMPLAINT_ID_PREFIX", "KSC") 
                },
                user,
                enhancedFilters
            );

            // Validate template data before export
            if (!templateData || Object.keys(templateData).length === 0) {
                throw new Error('Template data preparation failed - no data to export');
            }

            if (!templateData.summary || templateData.totalRecords === 0) {
                console.warn('⚠️ Exporting report with no records');
            }

            // Export using template
            await exportWithTemplate(templateId, templateData, format);
            
            // Show success message
            alert(`${format.toUpperCase()} export completed successfully!`);
            
        } catch (error) {
            console.error("Template export error:", error);
            const reportError = handleExportError(error, format);
            alert(`Export failed: ${reportError.message}`);
        } finally {
            setIsExporting(false);
            setIsTemplateSelectorOpen(false);
        }
    };

    // Chart rendering helper
    const renderChart = (chartType: string, chartProps: any) => {
        if (!rechartsLoaded || !dynamicLibraries.recharts) {
            return (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p>Loading chart...</p>
                    </div>
                </div>
            );
        }

        try {
            const {
                ResponsiveContainer,
                AreaChart,
                Area,
                PieChart,
                Pie,
                Cell,
                BarChart,
                Bar,
                LineChart,
                Line,
                XAxis,
                YAxis,
                CartesianGrid,
                Tooltip: RechartsTooltip,
                Legend,
            } = dynamicLibraries.recharts;

            const { data, ...otherProps } = chartProps;

            switch (chartType) {
                case "pie":
                    return (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie {...otherProps.pie} data={data}>
                                    {data.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip {...otherProps.tooltip} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    );
                case "bar":
                    return (
                        <ResponsiveContainer width="100%" height={otherProps.height || 300}>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis {...otherProps.xAxis} />
                                <YAxis />
                                <RechartsTooltip {...otherProps.tooltip} />
                                <Legend />
                                {otherProps.bars?.map((bar: any, index: number) => (
                                    <Bar key={index} {...bar} />
                                )) || []}
                            </BarChart>
                        </ResponsiveContainer>
                    );
                case "line":
                    return (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis {...otherProps.xAxis} />
                                <YAxis />
                                <RechartsTooltip {...otherProps.tooltip} />
                                <Legend />
                                {otherProps.lines?.map((line: any, index: number) => (
                                    <Line key={index} {...line} />
                                )) || []}
                            </LineChart>
                        </ResponsiveContainer>
                    );
                default:
                    return (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            <p>Chart type not supported</p>
                        </div>
                    );
            }
        } catch (error) {
            console.error("Error rendering chart:", error);
            return (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                        <p>Error loading chart</p>
                    </div>
                </div>
            );
        }
    };

    // Process chart data
    const processedChartData = useMemo(() => {
        if (!analyticsData) return null;

        return {
            typeDistribution: analyticsData.categories?.map((category, index) => ({
                name: category.name.replace(/_/g, " "),
                value: category.count,
                color: Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length],
            })) || [],
            wardOverview: analyticsData.wards?.map((ward) => ({
                name: ward.name,
                total: ward.complaints,
                resolved: ward.resolved,
                pending: ward.complaints - ward.resolved,
            })) || [],
            statusTrend: analyticsData.trends?.map((trend) => ({
                date: new Date(trend.date).toLocaleDateString(),
                registered: trend.complaints,
                resolved: trend.resolved,
                slaCompliance: trend.slaCompliance,
            })) || [],
            priorityBreakdown: [
                { name: "Low", value: 45, color: PRIORITY_COLORS.LOW },
                { name: "Medium", value: 30, color: PRIORITY_COLORS.MEDIUM },
                { name: "High", value: 20, color: PRIORITY_COLORS.HIGH },
                { name: "Critical", value: 5, color: PRIORITY_COLORS.CRITICAL },
            ],
        };
    }, [analyticsData]);

    // Loading state
    if (isLoading && !analyticsData) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <div className="flex space-x-2">
                        <Skeleton className="h-10 w-28" />
                        <Skeleton className="h-10 w-28" />
                        <Skeleton className="h-10 w-28" />
                    </div>
                </div>
                <Card>
                    <CardHeader className="pb-3">
                        <Skeleton className="h-5 w-28" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-24 mb-2" />
                                <Skeleton className="h-3 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={fetchAnalyticsData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
                {/* Enhanced Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {appLogoUrl && (
                            <img src={appLogoUrl} alt={appName} className="h-10 w-10 object-contain" />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <BarChart3 className="h-8 w-8 text-blue-600" />
                                Unified Analytics Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Comprehensive insights and analytics for {appName}
                            </p>
                        </div>
                    </div>
                    
                    {/* Export Actions */}
                    {permissions.canExportData && (
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" disabled={isExporting}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setIsTemplateSelectorOpen(true)}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export with Template
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Quick Export PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport("excel")}>
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        Quick Export Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        Quick Export CSV
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                                size="sm"
                                onClick={() => {
                                    if (!isFetching) {
                                        fetchAnalyticsData();
                                        fetchHeatmapData();
                                    }
                                }}
                                disabled={isLoading || isFetching}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading || isFetching ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    )}
                </div>

                {/* Enhanced Filters Section */}
                <Card className="shadow-sm border-0 bg-white">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters & Date Range
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Date Range with Presets */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Date Range Preset</Label>
                                    <Select
                                        value={datePreset}
                                        onValueChange={(value) => {
                                            setDatePreset(value);
                                            if (value !== "custom") {
                                                const range = calculateDateRange(value);
                                                setEnhancedFilters(prev => ({
                                                    ...prev,
                                                    dateRange: {
                                                        from: range.from || "",
                                                        to: range.to || ""
                                                    }
                                                }));
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DATE_PRESETS.map((preset) => (
                                                <SelectItem key={preset.value} value={preset.value}>
                                                    {preset.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {datePreset === "custom" && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-sm font-medium">From Date</Label>
                                            <Input
                                                type="date"
                                                value={enhancedFilters.dateRange.from}
                                                onChange={(e) => setEnhancedFilters(prev => ({
                                                    ...prev,
                                                    dateRange: { ...prev.dateRange, from: e.target.value }
                                                }))}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">To Date</Label>
                                            <Input
                                                type="date"
                                                value={enhancedFilters.dateRange.to}
                                                onChange={(e) => setEnhancedFilters(prev => ({
                                                    ...prev,
                                                    dateRange: { ...prev.dateRange, to: e.target.value }
                                                }))}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Multi-select Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Complaint Types */}
                                <div>
                                    <Label className="text-sm font-medium">Complaint Types</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                {enhancedFilters.complaintTypes.length > 0 
                                                    ? `${enhancedFilters.complaintTypes.length} selected`
                                                    : "All Types"
                                                }
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="space-y-2">
                                                {complaintTypes.map((type) => (
                                                    <div key={type.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`type-${type.id}`}
                                                            checked={enhancedFilters.complaintTypes.includes(type.name)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setEnhancedFilters(prev => ({
                                                                        ...prev,
                                                                        complaintTypes: [...prev.complaintTypes, type.name]
                                                                    }));
                                                                } else {
                                                                    setEnhancedFilters(prev => ({
                                                                        ...prev,
                                                                        complaintTypes: prev.complaintTypes.filter(t => t !== type.name)
                                                                    }));
                                                                }
                                                            }}
                                                        />
                                                        <Label htmlFor={`type-${type.id}`} className="text-sm">
                                                            {type.name.replace(/_/g, " ")}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                {enhancedFilters.statuses.length > 0 
                                                    ? `${enhancedFilters.statuses.length} selected`
                                                    : "All Statuses"
                                                }
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="space-y-2">
                                                {Object.keys(STATUS_COLORS).map((status) => (
                                                    <div key={status} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`status-${status}`}
                                                            checked={enhancedFilters.statuses.includes(status)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setEnhancedFilters(prev => ({
                                                                        ...prev,
                                                                        statuses: [...prev.statuses, status]
                                                                    }));
                                                                } else {
                                                                    setEnhancedFilters(prev => ({
                                                                        ...prev,
                                                                        statuses: prev.statuses.filter(s => s !== status)
                                                                    }));
                                                                }
                                                            }}
                                                        />
                                                        <Badge 
                                                            style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }}
                                                            className="text-white"
                                                        >
                                                            {status.replace(/_/g, " ")}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Priority Filter */}
                                <div>
                                    <Label className="text-sm font-medium">Priority</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between">
                                                {enhancedFilters.priorities.length > 0 
                                                    ? `${enhancedFilters.priorities.length} selected`
                                                    : "All Priorities"
                                                }
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="space-y-2">
                                                {Object.keys(PRIORITY_COLORS).map((priority) => (
                                                    <div key={priority} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`priority-${priority}`}
                                                            checked={enhancedFilters.priorities.includes(priority)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setEnhancedFilters(prev => ({
                                                                        ...prev,
                                                                        priorities: [...prev.priorities, priority]
                                                                    }));
                                                                } else {
                                                                    setEnhancedFilters(prev => ({
                                                                        ...prev,
                                                                        priorities: prev.priorities.filter(p => p !== priority)
                                                                    }));
                                                                }
                                                            }}
                                                        />
                                                        <Badge 
                                                            style={{ backgroundColor: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] }}
                                                            className="text-white"
                                                        >
                                                            {priority}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Ward Filter (Admin only) */}
                                {permissions.canViewAllWards && (
                                    <div>
                                        <Label className="text-sm font-medium">Wards</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between">
                                                    {enhancedFilters.wards.length > 0 
                                                        ? `${enhancedFilters.wards.length} selected`
                                                        : "All Wards"
                                                    }
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80">
                                                <div className="space-y-2">
                                                    {wards.map((ward) => (
                                                        <div key={ward.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`ward-${ward.id}`}
                                                                checked={enhancedFilters.wards.includes(ward.id)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setEnhancedFilters(prev => ({
                                                                            ...prev,
                                                                            wards: [...prev.wards, ward.id]
                                                                        }));
                                                                    } else {
                                                                        setEnhancedFilters(prev => ({
                                                                            ...prev,
                                                                            wards: prev.wards.filter(w => w !== ward.id)
                                                                        }));
                                                                    }
                                                                }}
                                                            />
                                                            <Label htmlFor={`ward-${ward.id}`} className="text-sm">
                                                                {ward.name}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}
                            </div>

                            {/* Filter Actions */}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const defaultRange = calculateDateRange("thisMonth");
                                        setEnhancedFilters({
                                            dateRange: {
                                                from: defaultRange.from || "",
                                                to: defaultRange.to || ""
                                            },
                                            ward: "all",
                                            complaintType: "all",
                                            status: "all",
                                            priority: "all",
                                            complaintTypes: [],
                                            statuses: [],
                                            priorities: [],
                                            wards: [],
                                            officers: [],
                                        });
                                        setDatePreset("thisMonth");
                                    }}
                                >
                                    Reset Filters
                                </Button>
                                <Button 
                                    onClick={() => {
                                        if (!isFetching) {
                                            fetchAnalyticsData();
                                            fetchHeatmapData();
                                        }
                                    }}
                                    disabled={isFetching || isLoading}
                                >
                                    {isFetching ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Apply Filters"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Dashboard Summary Cards */}
                {analyticsData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {dashboardCards.map((card, index) => {
                            const IconComponent = card.icon;
                            return (
                                <UITooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow cursor-pointer">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                                        <p className="text-3xl font-bold" style={{ color: CHART_COLORS[card.color] }}>
                                                            {card.value.toLocaleString()}
                                                        </p>
                                                        {card.change && (
                                                            <div className="flex items-center mt-2">
                                                                {card.changeType === 'increase' ? (
                                                                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                                                ) : (
                                                                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                                                )}
                                                                <span className={`text-sm ${card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {card.change}% from last period
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <IconComponent 
                                                        className="h-8 w-8" 
                                                        style={{ color: CHART_COLORS[card.color] }}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{card.description}</p>
                                    </TooltipContent>
                                </UITooltip>
                            );
                        })}
                    </div>
                )}

                {/* Charts Section */}
                {analyticsData && processedChartData && (
                    <div className="space-y-6">
                        {/* Chart Visibility Controls */}
                        <Card className="shadow-sm border-0 bg-white">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Chart Visibility
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {Object.entries(visibleCharts).map(([key, visible]) => (
                                        <div key={key} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`chart-${key}`}
                                                checked={visible}
                                                onCheckedChange={(checked) => {
                                                    setVisibleCharts(prev => ({
                                                        ...prev,
                                                        [key]: checked as boolean
                                                    }));
                                                }}
                                            />
                                            <Label htmlFor={`chart-${key}`} className="text-sm">
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Complaint Type Distribution */}
                            {visibleCharts.typeDistribution && (
                                <Card className="shadow-sm border-0 bg-white">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <PieChartIcon className="h-5 w-5" />
                                            Complaint Type Distribution
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {renderChart("pie", {
                                            data: processedChartData.typeDistribution,
                                            pie: {
                                                cx: "50%",
                                                cy: "50%",
                                                labelLine: false,
                                                label: ({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`,
                                                outerRadius: 80,
                                                fill: "#8884d8",
                                                dataKey: "value",
                                            },
                                            tooltip: {
                                                formatter: (value: number, name: string) => [
                                                    `${value} complaints`,
                                                    name
                                                ]
                                            },
                                        })}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Ward-wise Overview */}
                            {visibleCharts.wardOverview && permissions.canViewAllWards && (
                                <Card className="shadow-sm border-0 bg-white">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            Ward-wise Complaints Overview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {renderChart("bar", {
                                            data: processedChartData.wardOverview,
                                            height: 400,
                                            xAxis: { dataKey: "name" },
                                            tooltip: {
                                                formatter: (value: number, name: string) => [
                                                    value,
                                                    name === "total" ? "Total Complaints" :
                                                    name === "resolved" ? "Resolved" :
                                                    name === "pending" ? "Pending" : name
                                                ]
                                            },
                                            bars: [
                                                {
                                                    dataKey: "total",
                                                    fill: CHART_COLORS.primary,
                                                    name: "Total",
                                                },
                                                {
                                                    dataKey: "resolved",
                                                    fill: CHART_COLORS.success,
                                                    name: "Resolved",
                                                },
                                                {
                                                    dataKey: "pending",
                                                    fill: CHART_COLORS.warning,
                                                    name: "Pending",
                                                },
                                            ],
                                        })}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Status Trend Over Time */}
                            {visibleCharts.statusTrend && (
                                <Card className="shadow-sm border-0 bg-white">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5" />
                                            Status Trend Over Time
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {renderChart("line", {
                                            data: processedChartData.statusTrend,
                                            xAxis: { dataKey: "date" },
                                            tooltip: {
                                                labelFormatter: (label: string) => `Date: ${label}`,
                                                formatter: (value: number, name: string) => [
                                                    value,
                                                    name === "registered" ? "New Complaints" :
                                                    name === "resolved" ? "Resolved" :
                                                    name === "slaCompliance" ? "SLA Compliance %" : name
                                                ]
                                            },
                                            lines: [
                                                {
                                                    type: "monotone",
                                                    dataKey: "registered",
                                                    stroke: CHART_COLORS.primary,
                                                    strokeWidth: 2,
                                                },
                                                {
                                                    type: "monotone",
                                                    dataKey: "resolved",
                                                    stroke: CHART_COLORS.success,
                                                    strokeWidth: 2,
                                                },
                                            ],
                                        })}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Priority Breakdown */}
                            {visibleCharts.priorityBreakdown && (
                                <Card className="shadow-sm border-0 bg-white">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="h-5 w-5" />
                                            Priority Breakdown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {renderChart("pie", {
                                            data: processedChartData.priorityBreakdown,
                                            pie: {
                                                cx: "50%",
                                                cy: "50%",
                                                innerRadius: 60,
                                                outerRadius: 100,
                                                paddingAngle: 5,
                                                dataKey: "value",
                                            },
                                            tooltip: {
                                                formatter: (value: number, name: string) => [
                                                    `${value}%`,
                                                    `${name} Priority`
                                                ]
                                            },
                                        })}
                                    </CardContent>
                                </Card>
                            )}

                            {/* SLA Compliance Performance */}
                            {visibleCharts.slaCompliance && analyticsData.sla && (
                                <Card className="shadow-sm border-0 bg-white lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Zap className="h-5 w-5" />
                                            SLA Compliance Performance
                                            <Badge 
                                                className="ml-auto"
                                                style={{ 
                                                    backgroundColor: analyticsData.sla.compliance >= 85 ? CHART_COLORS.success : 
                                                                   analyticsData.sla.compliance >= 70 ? CHART_COLORS.warning : 
                                                                   CHART_COLORS.danger 
                                                }}
                                            >
                                                {analyticsData.sla.compliance.toFixed(1)}% Compliance
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-blue-600">
                                                    {analyticsData.sla.compliance.toFixed(1)}%
                                                </div>
                                                <div className="text-sm text-gray-600">Overall Compliance</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-green-600">
                                                    {analyticsData.sla.avgResolutionTime.toFixed(1)}
                                                </div>
                                                <div className="text-sm text-gray-600">Avg Resolution (days)</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-orange-600">
                                                    {analyticsData.sla.target}
                                                </div>
                                                <div className="text-sm text-gray-600">SLA Target (days)</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <Card className="shadow-sm border-0 bg-white">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <span>Generated by {appName}</span>
                                <span>•</span>
                                <span>{new Date().toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                                <span>Version 2.0.0</span>
                                <span>•</span>
                                <span>Last updated: {new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Template Selector Modal */}
            <TemplateSelector
                isOpen={isTemplateSelectorOpen}
                onClose={() => setIsTemplateSelectorOpen(false)}
                onExport={handleTemplateExport}
                isExporting={isExporting}
            />

            {/* Debug Mode Toggle - Only in development */}
            {process.env.NODE_ENV === 'development' && !debugMode && (
                <Button
                    className="fixed bottom-4 right-4 z-40"
                    size="sm"
                    variant="outline"
                    onClick={() => setDebugMode(true)}
                >
                    Debug Export
                </Button>
            )}
        </TooltipProvider>
    );
};

export default UnifiedReportsRevamped;