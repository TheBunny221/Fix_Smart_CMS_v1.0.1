import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { useSystemConfig as useSystemConfigRedux } from "../hooks/useSystemConfig";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "../components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../components/ui/use-toast";
import HeatmapGrid, { HeatmapData } from "../components/charts/HeatmapGrid";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import { getAnalyticsData, getHeatmapData } from "../utils/reportUtils";
import type { AnalyticsData, FilterOptions } from "../types/reports";
import {
  CalendarDays, Download, FileText, TrendingUp, TrendingDown, MapPin, Clock, AlertTriangle,
  CheckCircle, BarChart3, PieChart as PieChartIcon, Activity, Target, Users, Zap, Filter,
  RefreshCw, Share2, FileSpreadsheet, Calendar, ChevronDown, X
} from "lucide-react";

const UnifiedReports: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);
  const { appName, appLogoUrl, getConfig } = useSystemConfig();
  const { toast } = useToast();

  const [rechartsLoaded, setRechartsLoaded] = useState(false);
  const [dateFnsLoaded, setDateFnsLoaded] = useState(false);
  const [exportUtilsLoaded, setExportUtilsLoaded] = useState(false);
  const [dynamicLibraries, setDynamicLibraries] = useState<any>({});
  const [libraryLoadError, setLibraryLoadError] = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const loadDynamicLibraries = useCallback(async () => {
    try {
      if (!rechartsLoaded) {
        const recharts = await import("recharts");
        setDynamicLibraries((prev: any) => ({ ...prev, recharts }));
        setRechartsLoaded(true);
      }
      if (!dateFnsLoaded) {
        const dateFns = await import("date-fns");
        setDynamicLibraries((prev: any) => ({ ...prev, dateFns }));
        setDateFnsLoaded(true);
      }
      if (!exportUtilsLoaded) {
        const exportUtils = await import("../utils/exportUtils");
        setDynamicLibraries((prev: any) => ({ ...prev, exportUtils }));
        setExportUtilsLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load dynamic libraries:", error);
      setLibraryLoadError(translations?.reports?.errors?.libraryLoadError || "Failed to load required libraries. Some features may not work.");
    }
  }, [rechartsLoaded, dateFnsLoaded, exportUtilsLoaded]);

  useEffect(() => {
    loadDynamicLibraries();
  }, []);

  const formatDateDisplay = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  }, []);

  const getDefaultDateRange = useCallback(() => {
    const currentDate = new Date();
    const pastDate = new Date(currentDate);
    pastDate.setMonth(currentDate.getMonth() - 1);
    const formatDateForAPI = (date: Date): string => date.toISOString().split("T")[0] || "";
    return { from: formatDateForAPI(pastDate), to: formatDateForAPI(currentDate) };
  }, []);

  const [filters, setFilters] = useState<FilterOptions>(() => ({
    dateRange: getDefaultDateRange(),
    ward: "all",
    complaintType: "all",
    status: "all",
    priority: "all",
  }));

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wards, setWards] = useState<Array<{ id: string; name: string }>>([]);
  const getWardNameById = useCallback((wardId?: string | null) => {
    if (!wardId || wardId === "all") return translations?.reports?.filters?.allWards || "All Wards";
    if (user?.wardId && wardId === user.wardId) return user?.ward?.name || wardId;
    const found = wards.find((w) => w.id === wardId);
    return found?.name || wardId;
  }, [user?.wardId, user?.ward?.name, wards]);

  const [wardsLoading, setWardsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportAbortController, setReportAbortController] = useState<AbortController | null>(null);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [didInitialFetch, setDidInitialFetch] = useState(false);

  const permissions = useMemo(() => {
    const role = user?.role;
    return {
      canViewAllWards: role === "ADMINISTRATOR",
      canViewMaintenanceTasks: role === "MAINTENANCE_TEAM" || role === "ADMINISTRATOR",
      canExportData: role === "ADMINISTRATOR" || role === "WARD_OFFICER",
      defaultWard: role === "WARD_OFFICER" ? user?.wardId : "all",
    };
  }, [user]);

  useEffect(() => {
    const loadWards = async () => {
      if (!permissions.canViewAllWards) return;
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
            setWards(list.map((w: any) => ({ id: w.id, name: w.name })));
          }
        }
      } catch (e) {
        console.warn("Failed to load wards for selector", e);
      } finally {
        setWardsLoading(false);
      }
    };
    loadWards();
  }, [permissions.canViewAllWards]);

  useEffect(() => {
    if (permissions.defaultWard !== "all") {
      setFilters((prev: FilterOptions) => ({ ...prev, ward: permissions.defaultWard || "" }));
    }
  }, [permissions.defaultWard]);

  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnalyticsData(filters, user);
      setAnalyticsData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (translations?.errors?.loadingFailed || "Failed to load analytics data");
      setError(errorMessage);
      console.error("Analytics fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, user]);

  const fetchHeatmapData = useCallback(async () => {
    setHeatmapLoading(true);
    try {
      const data = await getHeatmapData(filters, user);
      setHeatmapData(data);
    } catch (err) {
      console.warn("Heatmap fetch failed", err);
      setHeatmapData({ xLabels: [], yLabels: [], matrix: [], xAxisLabel: "", yAxisLabel: "" });
    } finally {
      setHeatmapLoading(false);
    }
  }, [filters, user]);

  useEffect(() => {
    if (!user || didInitialFetch) return;
    console.log("Initial fetch triggered");
    setDidInitialFetch(true);
    fetchAnalyticsData();
    fetchHeatmapData();
  }, [user, didInitialFetch, fetchAnalyticsData, fetchHeatmapData]);

  useEffect(() => {
    if (!user || !didInitialFetch) return;
    const timer = setTimeout(() => fetchHeatmapData(), 500);
    return () => clearTimeout(timer);
  }, [filters, user, didInitialFetch, fetchHeatmapData]);

  const { complaintTypes, isLoading: complaintTypesLoading, getComplaintTypeById } = useComplaintTypes();

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    if (!permissions.canExportData) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to export data",
        variant: "destructive"
      });
      return;
    }
    if (!analyticsData) {
      toast({
        title: translations?.common?.noData || "No Data",
        description: translations?.reports?.export?.noDataAvailable || "No data available for export",
        variant: "destructive"
      });
      return;
    }
    if (!exportUtilsLoaded || !dynamicLibraries.exportUtils) {
      toast({
        title: translations?.common?.loading || "Loading",
        description: translations?.reports?.export?.stillLoading || "Export functionality is still loading. Please try again in a moment.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      const { validateExportPermissions, validateAnalyticsData, exportAnalyticsToPDF, exportAnalyticsToExcel, exportAnalyticsToCSV } = dynamicLibraries.exportUtils;

      if (!validateExportPermissions(user?.role || "")) {
        toast({
          title: translations?.errors?.unauthorized || "Permission Denied",
          description: translations?.reports?.export?.permissionDenied || "You don't have permission to export data",
          variant: "destructive"
        });
        return;
      }

      // Fetch detailed complaint data for export
      let complaintsData: any[] = [];
      try {
        const queryParams = new URLSearchParams({
          limit: (user?.role === "ADMINISTRATOR" ? 1000 : 500).toString(),
          ...(filters.dateRange.from && { dateFrom: filters.dateRange.from }),
          ...(filters.dateRange.to && { dateTo: filters.dateRange.to }),
          ...(filters.ward !== "all" && { ward: filters.ward }),
          ...(filters.complaintType !== "all" && { 
            type: getComplaintTypeById(filters.complaintType)?.name || filters.complaintType 
          }),
          ...(filters.status !== "all" && { status: filters.status }),
          ...(filters.priority !== "all" && { priority: filters.priority }),
        });

        if (user?.role === "WARD_OFFICER" && user?.wardId) {
          queryParams.set("ward", user.wardId);
        }

        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/complaints?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          complaintsData = result.data || [];
        }
      } catch (error) {
        console.warn("Failed to fetch detailed complaint data for export:", error);
        // Continue with analytics data only
      }

      // Create comprehensive export data
      const exportData = {
        summary: {
          total: analyticsData.complaints?.total || 0,
          resolved: analyticsData.complaints?.resolved || 0,
          pending: analyticsData.complaints?.pending || 0,
          overdue: analyticsData.complaints?.overdue || 0,
          closed: (analyticsData.complaints as any)?.closed || 0,
          reopened: (analyticsData.complaints as any)?.reopened || 0,
          inProgress: (analyticsData.complaints as any)?.inProgress || 0,
        },
        sla: {
          compliance: analyticsData.sla?.compliance || 0,
          avgResolutionTime: analyticsData.sla?.avgResolutionTime || 0,
          target: analyticsData.sla?.target || 48,
          onTimeResolutions: (analyticsData.sla as any)?.onTimeResolutions || 0,
          breachedSLA: (analyticsData.sla as any)?.breachedSLA || 0,
        },
        performance: analyticsData.performance || {
          userSatisfaction: 0,
          escalationRate: 0,
          firstCallResolution: 0,
          repeatComplaints: 0,
        },
        priorities: (analyticsData as any).priorities || [],
        trends: analyticsData.trends || [],
        categories: analyticsData.categories || [],
        wards: analyticsData.wards || [],
        complaints: complaintsData, // Include actual complaint data
        filters: {
          dateRange: filters.dateRange,
          ward: filters.ward !== "all" ? filters.ward : (translations?.reports?.filters?.allWards || "All Wards"),
          complaintType: filters.complaintType !== "all" ? filters.complaintType : (translations?.reports?.filters?.allTypes || "All Types"),
          status: filters.status !== "all" ? filters.status : (translations?.reports?.filters?.allStatus || "All Statuses"),
          priority: filters.priority !== "all" ? filters.priority : "All Priorities",
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: user?.fullName || "Unknown User",
          userRole: user?.role || "Unknown",
          reportType: "Comprehensive Complaints Report",
        }
      };

      const exportOptions = {
        systemConfig: {
          appName,
          appLogoUrl,
          complaintIdPrefix: getConfig("COMPLAINT_ID_PREFIX", "KSC"),
        },
        userRole: user?.role || "Unknown",
        userWard: user?.ward?.name || permissions.defaultWard,
        includeCharts: true,
        maxRecords: user?.role === "ADMINISTRATOR" ? 1000 : 500,
        filters: filters,
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: user?.fullName || "Unknown User",
          totalRecords: analyticsData.complaints?.total || 0,
        }
      };

      // Validate data before export
      const validation = validateAnalyticsData(exportData);
      if (!validation.isValid) {
        toast({
          title: translations?.reports?.export?.noDataToExport || "No Data to Export",
          description: validation.message || translations?.reports?.export?.noDataAvailable || "No data available for export",
          variant: "destructive"
        });
        return;
      }

      switch (format) {
        case "pdf":
          await exportAnalyticsToPDF(exportData, exportOptions);
          break;
        case "excel":
          await exportAnalyticsToExcel(exportData, exportOptions);
          break;
        case "csv":
          await exportAnalyticsToCSV(exportData, exportOptions);
          break;
      }

      // Show success message
      toast({
        title: translations?.reports?.export?.successful || "Export Successful",
        description: translations?.reports?.export?.successMessage?.replace('{{format}}', format.toUpperCase()) || `${format.toUpperCase()} export completed successfully! Check your downloads folder.`,
      });
    } catch (err) {
      console.error("Export error:", err);
      const errorMessage = err instanceof Error ? err.message : (translations?.errors?.somethingWentWrong || "Unknown error");

      // Show user-friendly error message with suggestions
      if (errorMessage.includes('Failed to resolve module specifier') || errorMessage.includes('dependency loading issue')) {
        toast({
          title: translations?.reports?.export?.libraryError || "Export Library Error",
          description: translations?.reports?.export?.libraryErrorMessage || "Export library failed to load due to development cache issue. Try refreshing the page (Ctrl+F5) or use CSV export as alternative.",
          variant: "destructive"
        });
      } else if (format !== 'csv') {
        // If PDF or Excel failed, suggest CSV as fallback
        toast({
          title: translations?.reports?.export?.failed || "Export Failed",
          description: `${errorMessage}. ${translations?.reports?.export?.csvAlternative || "Try using CSV export as a reliable alternative."}`,
          variant: "destructive"
        });
      } else {
        // CSV export failed - this is more serious
        toast({
          title: translations?.reports?.export?.failed || "Export Failed",
          description: `${translations?.reports?.export?.csvFailed || "CSV export failed"}: ${errorMessage}. ${translations?.reports?.export?.tryAgainOrSupport || "Please try again or contact support."}`,
          variant: "destructive"
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    if (isGeneratingReport) return;
    setIsGeneratingReport(true);
    setShowReportModal(true);
    setReportProgress(0);

    const abortController = new AbortController();
    setReportAbortController(abortController);

    let progress = 0;
    const timer = setInterval(() => {
      progress += Math.random() * 3 + 1;
      if (progress > 95) progress = 95;
      setReportProgress(progress);
    }, 200);

    try {
      const queryParams = new URLSearchParams({
        from: filters.dateRange.from,
        to: filters.dateRange.to,
        ...(filters.ward !== "all" && { ward: filters.ward }),
        ...(filters.complaintType !== "all" && { 
          type: getComplaintTypeById(filters.complaintType)?.name || filters.complaintType 
        }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.priority !== "all" && { priority: filters.priority }),
        detailed: "true",
      });

      if (user?.role === "WARD_OFFICER" && user?.wardId) {
        queryParams.set("ward", user.wardId);
      }

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/reports/analytics?${queryParams}`, {
        signal: abortController.signal,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`Failed to generate report: ${response.statusText}`);
      const reportData = await response.json();
      fetchHeatmapData();
      clearInterval(timer);
      setReportProgress(100);

      setTimeout(() => {
        setShowReportModal(false);
        setIsGeneratingReport(false);
        setReportAbortController(null);
        setAnalyticsData(reportData.data);
        console.log(`Report generated successfully! Found ${reportData.data?.complaints?.total || 0} records.`);
      }, 500);
    } catch (error: any) {
      clearInterval(timer);
      if (error?.name === "AbortError") {
        console.log("Report generation cancelled by user");
      } else {
        console.error("Report generation error:", error);
        toast({
          title: translations?.reports?.errors?.reportGenerationFailed || "Report Generation Failed",
          description: `${translations?.reports?.errors?.reportError || "Failed to generate report"}: ${error?.message || translations?.errors?.somethingWentWrong || "Unknown error"}`,
          variant: "destructive"
        });
      }
      setShowReportModal(false);
      setIsGeneratingReport(false);
      setReportAbortController(null);
      setReportProgress(0);
    }
  };

  const handleCancelReport = () => {
    if (reportAbortController) reportAbortController.abort();
    setShowReportModal(false);
    setIsGeneratingReport(false);
    setReportAbortController(null);
    setReportProgress(0);
  };

  const getTimePeriodLabel = useCallback(() => {
    try {
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const fromFormatted = formatDateDisplay(filters.dateRange.from);
      const toFormatted = formatDateDisplay(filters.dateRange.to);

      if (diffDays <= 1) return `${fromFormatted}`;
      else if (diffDays <= 7) return `${translations?.reports?.timePeriod?.pastWeek || "Past Week"} (${fromFormatted} - ${toFormatted})`;
      else if (diffDays <= 31) return `${translations?.reports?.timePeriod?.pastMonth || "Past Month"} (${fromFormatted} - ${toFormatted})`;
      else if (diffDays <= 90) return `${translations?.reports?.timePeriod?.past3Months || "Past 3 Months"} (${fromFormatted} - ${toFormatted})`;
      else return `${fromFormatted} - ${toFormatted}`;
    } catch (error) {
      console.error("Error formatting date period:", error);
      return `${formatDateDisplay(filters.dateRange.from)} - ${formatDateDisplay(filters.dateRange.to)}`;
    }
  }, [filters.dateRange, formatDateDisplay]);

  const COLORS = ["#0f5691", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

  const processedChartData = useMemo(() => {
    if (!analyticsData) return null;
    let trendsData: any[] = [];
    if (analyticsData.trends) {
      trendsData = analyticsData.trends.map((trend) => {
        const trendDate = new Date(trend.date);
        const day = trendDate.getDate().toString().padStart(2, '0');
        const month = (trendDate.getMonth() + 1).toString().padStart(2, '0');
        const year = trendDate.getFullYear().toString().slice(-2);
        return {
          ...trend,
          date: `${day}/${month}`,
          fullDate: `${day}/${month}/${year}`,
          rawDate: trend.date,
        };
      });
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
  }, [analyticsData, filters, dateFnsLoaded, dynamicLibraries.dateFns]);

  const renderChart = (chartType: string, chartProps: any) => {
    if (!rechartsLoaded || !dynamicLibraries.recharts) {
      return (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p>{translations?.reports?.charts?.loadingChart || "Loading chart..."}</p>
          </div>
        </div>
      );
    }

    try {
      const {
        ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
        ComposedChart, LineChart, Line, XAxis, YAxis, CartesianGrid,
        Tooltip: RechartsTooltip, Legend
      } = dynamicLibraries.recharts;

      const { data, ...otherProps } = chartProps;

      switch (chartType) {
        case "area":
          return (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...otherProps.xAxis} />
                <YAxis />
                <RechartsTooltip {...otherProps.tooltip} />
                <Legend />
                {otherProps.areas?.map((area: any, index: number) => <Area key={index} {...area} />)}
              </AreaChart>
            </ResponsiveContainer>
          );
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
              </PieChart>
            </ResponsiveContainer>
          );
        case "bar":
          return (
            <ResponsiveContainer width="100%" height={otherProps.height || 300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...otherProps.xAxis} />
                <YAxis />
                <RechartsTooltip {...otherProps.tooltip} />
                <Legend />
                {otherProps.bars?.map((bar: any, index: number) => <Bar key={index} {...bar} />)}
              </BarChart>
            </ResponsiveContainer>
          );
        case "composed":
          return (
            <ResponsiveContainer width="100%" height={otherProps.height || 400}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...otherProps.xAxis} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <RechartsTooltip {...otherProps.tooltip} />
                <Legend />
                {otherProps.bars?.map((bar: any, index: number) => <Bar key={index} {...bar} />)}
                {otherProps.lines?.map((line: any, index: number) => <Line key={index} {...line} />)}
              </ComposedChart>
            </ResponsiveContainer>
          );
        default:
          return <div className="h-[300px] flex items-center justify-center text-muted-foreground"><p>{translations?.reports?.charts?.chartTypeNotSupported || "Chart type not supported"}</p></div>;
      }
    } catch (error) {
      console.error("Error rendering chart:", error);
      return (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <p>{translations?.reports?.charts?.errorLoadingChart || "Error loading chart"}</p>
          </div>
        </div>
      );
    }
  };

  if (isLoading && !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
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
            <CardHeader className="pb-3"><Skeleton className="h-5 w-28" /></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{translations?.errors?.loadingFailed || "Error Loading Data"}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {translations?.common?.retry || "Retry"}
          </Button>
        </div>
      </div>
    );
  }

  if (libraryLoadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{translations?.reports?.errors?.featureLoadingError || "Feature Loading Error"}</h2>
          <p className="text-gray-600 mb-4">{libraryLoadError}</p>
          <Button onClick={loadDynamicLibraries}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {translations?.reports?.errors?.retryLoadingFeatures || "Retry Loading Features"}
          </Button>
        </div>
      </div>
    );
  }

  if (!rechartsLoaded || !dateFnsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>{translations?.reports?.loading?.chartLibraries || "Loading chart libraries..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">

        {/* Modern Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <nav className="mb-2 text-xs text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2">
                <li><Link to="/dashboard" className="hover:text-foreground transition-colors">{translations?.nav?.dashboard || "Dashboard"}</Link></li>
                <li>/</li>
                <li className="text-slate-900 dark:text-slate-100 font-medium">{translations?.reports?.title || "Reports & Analytics"}</li>
              </ol>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              {translations?.reports?.title || "Reports & Analytics"}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>{getTimePeriodLabel()}</span>
              {user?.role === "WARD_OFFICER" && user?.wardId && (
                <Badge variant="outline" className="text-xs ml-2">
                  {translations?.complaints?.ward || "Ward"}: {getWardNameById(user.wardId)}
                </Badge>
              )}
            </div>
          </div>

          {permissions.canExportData && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => handleExport("csv")} disabled={isExporting} className="rounded-xl border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm hover:shadow">
                {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                <span className="hidden sm:inline">{isExporting ? (translations?.reports?.export?.exporting || "Exporting...") : "CSV"}</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport("excel")} disabled={isExporting} className="rounded-xl border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm hover:shadow">
                {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                <span className="hidden sm:inline">{isExporting ? (translations?.reports?.export?.exporting || "Exporting...") : "Excel"}</span>
              </Button>
              <Button size="sm" onClick={() => handleExport("pdf")} disabled={isExporting} className="rounded-xl bg-primary hover:bg-primary/90 text-white transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40">
                {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="hidden sm:inline">{isExporting ? (translations?.reports?.export?.exporting || "Exporting...") : (translations?.reports?.export?.exportPdf || "Export PDF")}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Modern Collapsible Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button onClick={() => setFiltersExpanded(!filtersExpanded)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/20">
                <Filter className="h-4 w-4" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{translations?.common?.filter || "Filters"}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{translations?.reports?.filters?.customizeView || "Customize your report view"}</p>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${filtersExpanded ? 'rotate-180' : ''}`} />
          </button>

          {filtersExpanded && (
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">

                {/* Date Range */}
                <div className="lg:col-span-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">{translations?.reports?.dateRange || "Date Range"}</Label>
                  <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between rounded-xl border-slate-200 dark:border-slate-600 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all h-11" size="sm">
                        <span className="text-slate-900 dark:text-slate-100">
                          {formatDateDisplay(filters.dateRange.from)} → {formatDateDisplay(filters.dateRange.to)}
                        </span>
                        <Calendar className="h-4 w-4 opacity-70" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] rounded-xl border-slate-200 dark:border-slate-700" align="start">
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <Label htmlFor="from-date-picker" className="text-xs font-medium">{translations?.reports?.from || "From"}</Label>
                            <Input id="from-date-picker" type="date" defaultValue={filters.dateRange.from} className="mt-1 rounded-lg border-slate-200 dark:border-slate-600" />
                          </div>
                          <div>
                            <Label htmlFor="to-date-picker" className="text-xs font-medium">{translations?.reports?.to || "To"}</Label>
                            <Input id="to-date-picker" type="date" defaultValue={filters.dateRange.to} className="mt-1 rounded-lg border-slate-200 dark:border-slate-600" />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <Button variant="ghost" size="sm" onClick={() => setDatePopoverOpen(false)} className="rounded-lg">{translations?.common?.cancel || "Cancel"}</Button>
                          <Button size="sm" onClick={() => {
                            const fromInput = (document.getElementById("from-date-picker") as HTMLInputElement)?.value || filters.dateRange.from;
                            const toInput = (document.getElementById("to-date-picker") as HTMLInputElement)?.value || filters.dateRange.to;
                            setFilters((prev) => ({ ...prev, dateRange: { from: fromInput, to: toInput } }));
                            setDatePopoverOpen(false);
                          }} className="rounded-lg bg-primary hover:bg-primary/90">{translations?.reports?.filters?.apply || "Apply"}</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Ward Filter */}
                {permissions.canViewAllWards && (
                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">{translations?.complaints?.ward || "Ward"}</Label>
                    <Select value={filters.ward} onValueChange={(value) => setFilters((prev) => ({ ...prev, ward: value }))}>
                      <SelectTrigger disabled={wardsLoading || isLoading} className="rounded-xl border-slate-200 dark:border-slate-600 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all h-11">
                        <SelectValue placeholder={wardsLoading ? (translations?.reports?.filters?.loadingWards || "Loading wards...") : (translations?.reports?.filters?.selectWard || "Select ward")} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">{translations?.reports?.filters?.allWards || "All Wards"}</SelectItem>
                        {wards.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Complaint Type */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">{translations?.complaints?.complaintType || "Complaint Type"}</Label>
                  <Select value={filters.complaintType} onValueChange={(value) => setFilters((prev) => ({ ...prev, complaintType: value }))}>
                    <SelectTrigger disabled={isLoading} className="rounded-xl border-slate-200 dark:border-slate-600 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all h-11">
                      <SelectValue placeholder={translations?.reports?.filters?.selectType || "Select type"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">{translations?.reports?.filters?.allTypes || "All Types"}</SelectItem>
                      {complaintTypesLoading ? (
                        <SelectItem value="" disabled>{translations?.reports?.filters?.loadingTypes || "Loading types..."}</SelectItem>
                      ) : complaintTypes.length === 0 ? (
                        <SelectItem value="" disabled>{translations?.reports?.filters?.noTypesAvailable || "No types available"}</SelectItem>
                      ) : (
                        complaintTypes.map((type) => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">{translations?.common?.status || "Status"}</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
                    <SelectTrigger disabled={isLoading} className="rounded-xl border-slate-200 dark:border-slate-600 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all h-11">
                      <SelectValue placeholder={translations?.reports?.filters?.selectStatus || "Select status"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">{translations?.reports?.filters?.allStatus || "All Status"}</SelectItem>
                      <SelectItem value="registered">{translations?.complaints?.statuses?.registered || "Registered"}</SelectItem>
                      <SelectItem value="assigned">{translations?.complaints?.statuses?.assigned || "Assigned"}</SelectItem>
                      <SelectItem value="in_progress">{translations?.complaints?.statuses?.in_progress || "In Progress"}</SelectItem>
                      <SelectItem value="resolved">{translations?.complaints?.statuses?.resolved || "Resolved"}</SelectItem>
                      <SelectItem value="closed">{translations?.complaints?.statuses?.closed || "Closed"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Filters Display */}
                <div className="lg:col-span-4 flex flex-wrap gap-2 items-center pt-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{translations?.reports?.filters?.activeFilters || "Active Filters"}:</span>
                  {filters.ward !== "all" && (
                    <Badge className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      {translations?.complaints?.ward || "Ward"}: {getWardNameById(filters.ward)}
                      <button onClick={() => setFilters(prev => ({ ...prev, ward: "all" }))} className="hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.complaintType !== "all" && (
                    <Badge className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                      {translations?.common?.type || "Type"}: {getComplaintTypeById(filters.complaintType)?.name || filters.complaintType}
                      <button onClick={() => setFilters(prev => ({ ...prev, complaintType: "all" }))} className="hover:bg-purple-100 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.status !== "all" && (
                    <Badge className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                      {translations?.common?.status || "Status"}: {filters.status}
                      <button onClick={() => setFilters(prev => ({ ...prev, status: "all" }))} className="hover:bg-green-100 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.ward === "all" && filters.complaintType === "all" && filters.status === "all" && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{translations?.reports?.filters?.noFiltersApplied || "No filters applied"}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <Button variant="outline" onClick={() => {
                  setFilters({
                    dateRange: getDefaultDateRange(),
                    ward: permissions.defaultWard || "all",
                    complaintType: "all",
                    status: "all",
                    priority: "all",
                  });
                }} className="rounded-xl border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {translations?.reports?.filters?.reset || "Reset"}
                </Button>
                <Button onClick={handleGenerateReport} disabled={isGeneratingReport} className="rounded-xl bg-primary hover:bg-primary/90 text-white transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {isGeneratingReport ? (translations?.reports?.generating || "Generating...") : (translations?.reports?.generate || "Generate Report")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modern KPI Cards with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: translations?.reports?.kpi?.totalComplaints || "Total Complaints", value: analyticsData?.complaints.total || 0, icon: FileText, color: "from-blue-500 to-blue-600", trend: analyticsData?.comparison?.trends?.totalComplaints },
            { label: translations?.dashboard?.resolved || "Resolved", value: analyticsData?.complaints.resolved || 0, icon: CheckCircle, color: "from-green-500 to-green-600", trend: analyticsData?.comparison?.trends?.resolvedComplaints },
            { label: translations?.dashboard?.slaCompliance || "SLA Compliance", value: `${analyticsData?.sla.compliance || 0}%`, icon: Target, color: "from-purple-500 to-purple-600", trend: analyticsData?.comparison?.trends?.slaCompliance, extra: `${translations?.reports?.kpi?.avg || "Avg"}: ${analyticsData?.sla.avgResolutionTime || 0} ${translations?.reports?.kpi?.days || "days"}` },
            { label: translations?.dashboard?.satisfaction || "Satisfaction", value: `${analyticsData?.performance.userSatisfaction.toFixed(2) || "0.00"}/5`, icon: Users, color: "from-orange-500 to-orange-600", trend: analyticsData?.comparison?.trends?.userSatisfaction }
          ].map((kpi, index) => (
            <Card key={index} className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.label}
                </CardTitle>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.color} text-white shadow-lg`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{kpi.value}</div>
                {kpi.label === (translations?.dashboard?.slaCompliance || "SLA Compliance") && <Progress value={analyticsData?.sla.compliance || 0} className="mt-2 h-2" />}
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  {kpi.trend ? (
                    <>
                      {kpi.trend.startsWith('+') ? <TrendingUp className="h-3 w-3 mr-1 text-green-600" /> : <TrendingDown className="h-3 w-3 mr-1 text-red-600" />}
                      {kpi.trend} {translations?.reports?.kpi?.fromLastPeriod || "from last period"}
                    </>
                  ) : kpi.extra ? (
                    <><Clock className="h-3 w-3 mr-1" />{kpi.extra}</>
                  ) : (
                    <><TrendingUp className="h-3 w-3 mr-1" />{translations?.reports?.kpi?.noPreviousData || "No previous data"}</>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modern Tabs with Analytics */}
        {analyticsData && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Tabs defaultValue="overview" className="w-full">
              <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
                <TabsList className="flex overflow-x-auto scrollbar-hide bg-transparent p-0 h-auto">
                  {(["overview", "trends", "performance", permissions.canViewAllWards && "wards", "categories"].filter(Boolean) as string[]).map((tab) => (
                    <TabsTrigger key={tab} value={tab} className="px-6 py-4 text-sm font-medium transition-all whitespace-nowrap relative data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                      {tab === "wards" ? (translations?.reports?.tabs?.wardAnalysis || "Ward Analysis") : 
                       tab === "overview" ? (translations?.dashboard?.overview || "Overview") :
                       tab === "trends" ? (translations?.dashboard?.trends || "Trends") :
                       tab === "performance" ? (translations?.dashboard?.performanceMetrics || "Performance") :
                       tab === "categories" ? (translations?.reports?.tabs?.categories || "Categories") :
                       tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-750 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      {translations?.reports?.charts?.complaintsTrend || "Complaints Trend"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{getTimePeriodLabel()}</p>
                    {processedChartData?.trendsData?.length ? (
                      renderChart("area", {
                        data: processedChartData.trendsData,
                        xAxis: { dataKey: "date", tick: { fontSize: 12 }, angle: -45, textAnchor: "end", height: 60 },
                        tooltip: {
                          labelFormatter: (label: any, payload: any) => payload?.[0] ? `${translations?.common?.date || "Date"}: ${payload[0].payload.fullDate || label}` : `${translations?.common?.date || "Date"}: ${label}`,
                          formatter: (value: any, name: any) => [value, name === "complaints" ? (translations?.reports?.kpi?.totalComplaints || "Total Complaints") : (translations?.reports?.charts?.resolvedComplaints || "Resolved Complaints")],
                        },
                        areas: [
                          { type: "monotone", dataKey: "complaints", stackId: "1", stroke: "#8884d8", fill: "#8884d8" },
                          { type: "monotone", dataKey: "resolved", stackId: "1", stroke: "#82ca9d", fill: "#82ca9d" },
                        ],
                      })
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center"><BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>{translations?.reports?.charts?.noTrendData || "No trend data available"}</p></div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-750 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-primary" />
                      {translations?.reports?.charts?.categoryDistribution || "Category Distribution"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{getTimePeriodLabel()}</p>
                    {processedChartData?.categoriesWithColors?.length ? (
                      renderChart("pie", {
                        data: processedChartData.categoriesWithColors,
                        pie: {
                          cx: "50%", cy: "50%", labelLine: false,
                          label: ({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`,
                          outerRadius: 80, fill: "#8884d8", dataKey: "count",
                        },
                        tooltip: { formatter: (value: any) => [`${value} complaints`] },
                      })
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center"><PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>{translations?.reports?.charts?.noCategoryData || "No category data available"}</p></div>
                      </div>
                    )}
                  </div>
                </div>

                {(user?.role === "ADMINISTRATOR" || user?.role === "WARD_OFFICER") && (
                  <div className="mt-6">
                    <HeatmapGrid
                      title={user?.role === "ADMINISTRATOR" ? (translations?.reports?.heatmap?.complaintsWardsTitle || "Complaints × Wards Heatmap") : (translations?.reports?.heatmap?.complaintsSubzonesTitle || "Complaints × Sub-zones Heatmap")}
                      description={user?.role === "ADMINISTRATOR" ? (translations?.reports?.heatmap?.complaintsWardsDesc || "Distribution of complaints by type across all wards") : `${translations?.reports?.heatmap?.complaintsSubzonesDesc || "Distribution of complaints by type across sub-zones in"} ${getWardNameById(user?.wardId)}`}
                      data={heatmapData || { xLabels: [], yLabels: [], matrix: [], xAxisLabel: translations?.complaints?.complaintType || "Complaint Type", yAxisLabel: user?.role === "ADMINISTRATOR" ? (translations?.complaints?.ward || "Ward") : (translations?.reports?.heatmap?.subzone || "Sub-zone") }}
                    />
                    {heatmapLoading && <div className="h-8 flex items-center text-xs text-muted-foreground mt-2"><RefreshCw className="h-3 w-3 mr-2 animate-spin" /> {translations?.reports?.heatmap?.updating || "Updating heatmap..."}</div>}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trends" className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-750 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{translations?.reports?.charts?.detailedTrendsAnalysis || "Detailed Trends Analysis"}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{getTimePeriodLabel()}</p>
                  {processedChartData?.trendsData?.length ? (
                    renderChart("composed", {
                      data: processedChartData.trendsData, height: 400,
                      xAxis: { dataKey: "date", tick: { fontSize: 12 }, angle: -45, textAnchor: "end", height: 60 },
                      tooltip: {
                        labelFormatter: (label: any, payload: any) => payload?.[0] ? `${translations?.common?.date || "Date"}: ${payload[0].payload.fullDate || label}` : `${translations?.common?.date || "Date"}: ${label}`,
                        formatter: (value: any, name: any) => [name === "slaCompliance" ? `${value}%` : value, name === "slaCompliance" ? (translations?.dashboard?.slaCompliance || "SLA Compliance") : name],
                      },
                      bars: [{ yAxisId: "left", dataKey: "complaints", fill: "#8884d8" }, { yAxisId: "left", dataKey: "resolved", fill: "#82ca9d" }],
                      lines: [{ yAxisId: "right", type: "monotone", dataKey: "slaCompliance", stroke: "#ff7300" }],
                    })
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground"><div className="text-center"><BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>{translations?.reports?.charts?.noTrendData || "No trend data available"}</p></div></div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="performance" className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-750 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{translations?.reports?.charts?.resolutionTimeDistribution || "Resolution Time Distribution"}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{getTimePeriodLabel()}</p>
                  {processedChartData?.categoriesWithColors?.length ? (
                    renderChart("bar", {
                      data: processedChartData.categoriesWithColors,
                      xAxis: { dataKey: "name", tick: { fontSize: 11 }, angle: -45, textAnchor: "end", height: 80 },
                      tooltip: { formatter: (value: any) => [`${value} ${translations?.reports?.kpi?.days || "days"}`, translations?.reports?.charts?.avgResolutionTime || "Avg Resolution Time"], labelFormatter: (label: any) => `${translations?.reports?.charts?.category || "Category"}: ${label}` },
                      bars: [{ dataKey: "avgTime", fill: "#8884d8", name: `${translations?.reports?.charts?.avgResolutionTime || "Avg Resolution Time"} (${translations?.reports?.kpi?.days || "days"})` }],
                    })
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground"><div className="text-center"><BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>{translations?.reports?.charts?.noCategoryMetrics || "No category metrics available"}</p></div></div>
                  )}
                </div>
              </TabsContent>

              {permissions.canViewAllWards && (
                <TabsContent value="wards" className="p-6 space-y-4">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-750 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{translations?.reports?.charts?.wardPerformanceComparison || "Ward Performance Comparison"}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{getTimePeriodLabel()}</p>
                    {processedChartData?.wardsData?.length ? (
                      renderChart("bar", {
                        data: processedChartData.wardsData, height: 400,
                        xAxis: { dataKey: "name", tick: { fontSize: 11 }, angle: -45, textAnchor: "end", height: 80 },
                        bars: [{ dataKey: "complaints", fill: "#8884d8" }, { dataKey: "resolved", fill: "#82ca9d" }],
                      })
                    ) : (
                      <div className="h-[400px] flex items-center justify-center text-muted-foreground"><div className="text-center"><BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>{translations?.reports?.charts?.noWardComparisonData || "No ward comparison data available"}</p></div></div>
                    )}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="categories" className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-750 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{translations?.reports?.charts?.categoryAnalysis || "Category Analysis"}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{getTimePeriodLabel()}</p>
                  <div className="space-y-3">
                    {(processedChartData?.categoriesWithColors || []).map((category, index) => (
                      <div key={category.name} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-medium text-slate-900 dark:text-slate-100">{category.name}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700">{category.count} {translations?.dashboard?.complaints || "complaints"}</span>
                          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700">{translations?.reports?.kpi?.avg || "Avg"}: {category.avgTime} {translations?.reports?.kpi?.days || "days"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Report Generation Modal */}
        <Dialog open={showReportModal} onOpenChange={() => { }}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-white">
                  <BarChart3 className="h-5 w-5" />
                </div>
                {translations?.reports?.modal?.generatingReport || "Generating Report"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="text-lg font-medium mb-2 text-slate-900 dark:text-slate-100">{translations?.reports?.modal?.processingData || "Processing your data..."}</div>
                <div className="text-sm text-muted-foreground mb-6">{translations?.reports?.modal?.analyzing || "Analyzing"} {getTimePeriodLabel()}</div>
                <div className="relative inline-flex items-center justify-center mb-6">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-200 dark:text-slate-700" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - reportProgress / 100)}`} className="text-primary transition-all duration-300" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{Math.floor(reportProgress)}%</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {reportProgress < 100 ? `${translations?.reports?.modal?.estimatedTime || "Estimated time"}: ${Math.max(0, Math.ceil((100 - reportProgress) * 0.05))}s ${translations?.reports?.modal?.remaining || "remaining"}` : (translations?.reports?.modal?.finalizingReport || "Finalizing report...")}
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-center mb-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mr-2">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{translations?.reports?.modal?.reportScope || "Report Scope"}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">{translations?.reports?.modal?.period || "Period"}:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{getTimePeriodLabel()}</span>
                  </div>
                  {filters.ward !== "all" && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">{translations?.complaints?.ward || "Ward"}:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{getWardNameById(filters.ward)}</span>
                    </div>
                  )}
                  {filters.complaintType !== "all" && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">{translations?.common?.type || "Type"}:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{getComplaintTypeById(filters.complaintType)?.name || filters.complaintType}</span>
                    </div>
                  )}
                  {filters.status !== "all" && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">{translations?.common?.status || "Status"}:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{filters.status}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelReport} disabled={reportProgress >= 100} className="rounded-xl">
                {translations?.common?.cancel || "Cancel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default UnifiedReports;