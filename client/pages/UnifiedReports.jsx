import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Progress } from "../components/ui/progress";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
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
  PieChart,
  Activity,
  Target,
  Users,
  Zap,
  Filter,
  RefreshCw,
  Share2,
  FileSpreadsheet,
  Calendar,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  validateExportPermissions,
} from "../utils/exportUtils";

;
  sla: {
    compliance;
    avgResolutionTime;
    target;
  };
  trends: Array;
  wards: Array;
  categories: Array;
  performance: {
    userSatisfaction;
    escalationRate;
    firstCallResolution;
    repeatComplaints;
  };
}

;
  ward;
  complaintType;
  status;
  priority;
}

const UnifiedReports: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);
  const { appName, appLogoUrl, getConfig } = useSystemConfig();

  // State for filters
  const [filters, setFilters] = useState({
    dateRange)), "yyyy-MM-dd"),
      to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    },
    ward: "all",
    complaintType: "all",
    status: "all",
    priority: "all",
  });

  // State for data
  const [analyticsData, setAnalyticsData] = useState(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportAbortController, setReportAbortController] =
    useState(null);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Get role-based access permissions
  const permissions = useMemo(() => {
    const role = user?.role;
    return {
      canViewAllWards === "ADMINISTRATOR",
      canViewMaintenanceTasks === "MAINTENANCE_TEAM" || role === "ADMINISTRATOR",
      canExportData === "ADMINISTRATOR" || role === "WARD_OFFICER",
      defaultWard === "WARD_OFFICER" ? user?.wardId : "all",
    };
  }, [user]);

  // Apply role-based filter restrictions
  useEffect(() => {
    if (permissions.defaultWard == "all") {
      setFilters((prev) => ({
        ...prev,
        ward,
      }));
    }
  }, [permissions.defaultWard]);

  // Initial data fetch to get actual date range
  useEffect(() => {
    const fetchInitialData = async () => {
      if (filtersInitialized) return;

      try {
        // Fetch data without date filters to get full range
        const queryParams = new URLSearchParams();

        // Only apply role-based filters for initial fetch
        if (user?.role === "WARD_OFFICER" && user?.wardId) {
          queryParams.set("ward", user.wardId);
        } else if (user?.role === "MAINTENANCE_TEAM") {
          queryParams.set("assignedTo", user.id);
        }

        let endpoint = "/api/reports/analytics";
        if (user?.role === "MAINTENANCE_TEAM") {
          endpoint = "/api/maintenance/analytics";
        }

        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}${endpoint}?${queryParams}`, {
          headers)}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Initial data fetch, data);

          // Initialize filters from this data
          if (data.data?.trends && data.data.trends.length > 0) {
            const dates = data.data.trends
              .map((t) => new Date(t.date))
              .sort((a, b) => a.getTime() - b.getTime());
            const earliestDate = format(dates[0], "yyyy-MM-dd");
            const latestDate = format(dates[dates.length - 1], "yyyy-MM-dd");

            console.log("Setting initial date range, {
              earliestDate,
              latestDate,
            });

            // Set filters without triggering a new fetch loop
            setFilters((prev) => ({
              ...prev,
              dateRange,
                to,
              },
            }));

            // Also set the initial analytics data
            const transformedData = {
              complaints: {
                total: data.data?.complaints?.total || 0,
                resolved: data.data?.complaints?.resolved || 0,
                pending: data.data?.complaints?.pending || 0,
                overdue: data.data?.complaints?.overdue || 0,
              },
              sla: {
                compliance: data.data?.sla?.compliance || 0,
                avgResolutionTime: data.data?.sla?.avgResolutionTime || 0,
                target: data.data?.sla?.target || 3,
              },
              trends: data.data?.trends || [],
              wards: data.data?.wards || [],
              categories: data.data?.categories || [],
              performance: {
                userSatisfaction: data.data?.performance?.userSatisfaction || 0,
                escalationRate: data.data?.performance?.escalationRate || 0,
                firstCallResolution:
                  data.data?.performance?.firstCallResolution || 0,
                repeatComplaints: data.data?.performance?.repeatComplaints || 0,
              },
            };

            setAnalyticsData(transformedData);
            setIsLoading(false);
          }
          setFiltersInitialized(true);
        }
      } catch (error) {
        console.error("Initial data fetch error, error);
        // Fallback to current month if initial fetch fails
        setFiltersInitialized(true);
      }
    };

    if (user && filtersInitialized) {
      fetchInitialData();
    }
  }, [user, filtersInitialized]);

  // Memoized analytics fetching with debouncing
  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        from,
        to: filters.dateRange.to,
        ...(filters.ward == "all" && { ward),
        ...(filters.complaintType == "all" && { type),
        ...(filters.status == "all" && { status),
        ...(filters.priority == "all" && { priority),
      });

      console.log("Fetching analytics with params, {
        filters,
        queryString: queryParams.toString(),
        url: `/api/reports/analytics?${queryParams}`,
      });

      // Use different endpoints based on user role
      let endpoint = "/api/reports/analytics";
      if (user?.role === "MAINTENANCE_TEAM") {
        endpoint = "/api/maintenance/analytics";
      }

      // Use absolute URL to match the deployed environment
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}${endpoint}?${queryParams}`, {
        headers)}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        throw new Error(`Failed to fetch analytics data,
        );
      }

      const data = await response.json();
      console.log("Received analytics data, data);

      // Transform the API response to match the expected format
      const transformedData = {
        complaints: {
          total: data.data?.complaints?.total || 0,
          resolved: data.data?.complaints?.resolved || 0,
          pending: data.data?.complaints?.pending || 0,
          overdue: data.data?.complaints?.overdue || 0,
        },
        sla: {
          compliance: data.data?.sla?.compliance || 0,
          avgResolutionTime: data.data?.sla?.avgResolutionTime || 0,
          target: data.data?.sla?.target || 3,
        },
        trends: data.data?.trends || [],
        wards: data.data?.wards || [],
        categories: data.data?.categories || [],
        performance: {
          userSatisfaction: data.data?.performance?.userSatisfaction || 0,
          escalationRate: data.data?.performance?.escalationRate || 0,
          firstCallResolution: data.data?.performance?.firstCallResolution || 0,
          repeatComplaints: data.data?.performance?.repeatComplaints || 0,
        },
      };

      setAnalyticsData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message ,
      );
      console.error("Analytics fetch error, err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, user?.role, filtersInitialized]);

  // Debounced effect for filter changes to improve performance
  useEffect(() => {
    if (filtersInitialized) return;

    const timeoutId = setTimeout(() => {
      console.log("Filters changed, fetching new data, filters);
      fetchAnalyticsData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchAnalyticsData, filtersInitialized]);

  // Force re-fetch when filters change (only after initialization)
  useEffect(() => {
    if (filtersInitialized) return;

    console.log("Filter state updated, filters);
    setAnalyticsData(null); // Clear existing data to show loading
  }, [filters, filtersInitialized]);

  // Export functionality with enhanced features
  const handleExport = async (format) => {
    if (permissions.canExportData) {
      alert("You don't have permission to export data");
      return;
    }

    if (analyticsData) {
      alert("No data available for export");
      return;
    }

    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams({
        from,
        to: filters.dateRange.to,
        ...(filters.ward == "all" && { ward),
        ...(filters.complaintType == "all" && { type),
        ...(filters.status == "all" && { status),
        ...(filters.priority == "all" && { priority),
      });

      // Validate export permissions based on role
      const requestedData = {
        includesOtherWards:
          filters.ward === "all" && user?.role == "ADMINISTRATOR",
        includesUnassignedComplaints:
          user?.role === "MAINTENANCE_TEAM" && filters.ward === "all",
      };

      if (validateExportPermissions(user?.role || "", requestedData)) {
        alert(
          "You don't have permission to export data outside your assigned scope",
        );
        return;
      }

      // Fetch detailed data for export with real-time backend call
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/reports/export?${queryParams}`,
        {
          headers)}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        throw new Error("Failed to fetch export data");
      }

      const exportData = await response.json();

      if (exportData.success) {
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
        includeCharts,
        maxRecords: user?.role === "ADMINISTRATOR" ? 1000 ,
      };

      // Use appropriate export utility based on format
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
    } catch (err) {
      console.error("Export error, err);
      alert(`Export failed,
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Generate custom report with countdown and cancellation
  const handleGenerateReport = async () => {
    if (isGeneratingReport) return;

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
        if (progress > 95) progress = 95; // Cap at 95% until API responds
        setReportProgress(progress);
      }, 200); // Update every 200ms

      // Prepare query parameters
      const queryParams = new URLSearchParams({
        from,
        to: filters.dateRange.to,
        ...(filters.ward == "all" && { ward),
        ...(filters.complaintType == "all" && { type),
        ...(filters.status == "all" && { status),
        ...(filters.priority == "all" && { priority),
        detailed: "true",
      });

      // Make API call with abort signal
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/reports/analytics?${queryParams}`,
        {
          signal,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        throw new Error(`Failed to generate report);
      }

      const reportData = await response.json();

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
        console.log(
          `Report generated successfully Found ${reportData.data?.complaints?.total || 0} records based on applied filters.`,
        );
      }, 500);
    } catch (error) {
      clearInterval(timer);

      if (error.name === "AbortError") {
        console.log("Report generation cancelled by user");
      } else {
        console.error("Report generation error, error);
        alert(`Failed to generate report);
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
    const fromDate = new Date(filters.dateRange.from);
    const toDate = new Date(filters.dateRange.to);
    const diffTime = Math.abs(toDate - fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Format dates for display
    const formatDate = (date) => format(date, "MMM dd, yyyy");
    const fromFormatted = formatDate(fromDate);
    const toFormatted = formatDate(toDate);

    // Determine period type
    if (diffDays  {
    if (analyticsData) return null;

    console.log("Processing chart data, analyticsData);

    return {
      trendsData:
        analyticsData.trends?.map((trend) => ({
          ...trend,
          date), "MMM dd"),
          fullDate: format(new Date(trend.date), "MMM dd, yyyy"),
          rawDate: trend.date,
        })) || [],
      categoriesWithColors:
        analyticsData.categories?.map((category, index) => ({
          ...category,
          color,
        })) || [],
      wardsData:
        analyticsData.wards?.map((ward) => ({
          ...ward,
          efficiency) * 100 ,
        })) || [],
    };
  }, [analyticsData, filters]); // Added filters dependency to force re-processing

  if (isLoading) {
    return (
      
        
          
          Loading analytics data...
        
      
    );
  }

  if (error) {
    return (
      
        
          
          Error Loading Data
          {error}
          
            
            Retry
          
        
      
    );
  }

  return ({/* Header */}
      
        
          
            {translations?.reports?.title || "Reports & Analytics"}
          
          
            {appName} -{" "}
            {user?.role === "ADMINISTRATOR"
              ? "Comprehensive system-wide insights and analytics"
              )}
            
          
        

        {permissions.canExportData && (
          
             handleExport("csv")}
              disabled={isExporting}
            >
              
              Export CSV
            
             handleExport("excel")}
              disabled={isExporting}
            >
              
              Export Excel
            
             handleExport("pdf")}
              disabled={isExporting}
            >
              
              Export PDF
            
          
        )}
      

      {/* Filters */}
      
        
          
            
            Filters & Settings
          
        
        
          
            {/* Date Range */}
            
              From Date
              
                  setFilters((prev) => ({
                    ...prev,
                    dateRange, from: e.target.value },
                  }))
                }
              />
            
            
              To Date
              
                  setFilters((prev) => ({
                    ...prev,
                    dateRange, to: e.target.value },
                  }))
                }
              />
            

            {/* Ward Filter (only for admins) */}
            {permissions.canViewAllWards && (
              
                Ward
                
                    setFilters((prev) => ({ ...prev, ward))
                  }
                >
                  
                    
                  
                  
                    All Wards
                    Ward 1
                    Ward 2
                    Ward 3
                    Ward 4
                    Ward 5
                  
                
              
            )}

            {/* Complaint Type */}
            
              Complaint Type
              
                  setFilters((prev) => ({ ...prev, complaintType))
                }
              >
                
                  
                
                
                  All Types
                  Water Supply
                  Electricity
                  Road Repair
                  Garbage Collection
                  Street Lighting
                
              
            

            {/* Status */}
            
              Status
              
                  setFilters((prev) => ({ ...prev, status))
                }
              >
                
                  
                
                
                  All Status
                  Registered
                  Assigned
                  In Progress
                  Resolved
                  Closed
                
              
            
          

          
             {
                console.log("Resetting filters...");
                // Reset to original data range if available
                if (analyticsData?.trends && analyticsData.trends.length > 0) {
                  const dates = analyticsData.trends
                    .map((t) => new Date(t.date))
                    .sort((a, b) => a.getTime() - b.getTime());
                  const earliestDate = format(dates[0], "yyyy-MM-dd");
                  const latestDate = format(
                    dates[dates.length - 1],
                    "yyyy-MM-dd",
                  );

                  setFilters({
                    dateRange,
                      to,
                    },
                    ward: permissions.defaultWard,
                    complaintType: "all",
                    status: "all",
                    priority: "all",
                  });
                } else {
                  // Fallback to current month if no data
                  setFilters({
                    dateRange)), "yyyy-MM-dd"),
                      to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
                    },
                    ward: permissions.defaultWard,
                    complaintType: "all",
                    status: "all",
                    priority: "all",
                  });
                }
              }}
            >
              
              Reset Filters
            
            
              
              {isGeneratingReport ? "Generating..." : "Generate Report"}
            
          
        
      

      {/* Key Metrics */}
      
        Key Metrics
        
          
          {getTimePeriodLabel()}
        
      
      {analyticsData && (
        
          
            
              
                Total Complaints
              
              
            
            
              
                {analyticsData.complaints.total}
              
              
                
                +12% from last month
              
            
          

          
            
              Resolved
              
            
            
              
                {analyticsData.complaints.resolved}
              
              
                
                {(
                  (analyticsData.complaints.resolved /
                    analyticsData.complaints.total) *
                  100
                ).toFixed(1)}
                % resolution rate
              
            
          

          
            
              
                SLA Compliance
              
              
            
            
              
                {analyticsData.sla.compliance}%
              
              
                
                Avg: {analyticsData.sla.avgResolutionTime} days
              
            
          

          
            
              
                Satisfaction
              
              
            
            
              
                {analyticsData.performance.userSatisfaction.toFixed(2)}/5
              
              
                
                +0.2 from last month
              
            
          
        
      )}

      {/* Analytics Tabs */}
      {analyticsData && (
        
          
            Overview
            Trends
            Performance
            {permissions.canViewAllWards && (
              Ward Analysis
            )}
            Categories
          

          {/* Overview Tab */}
          
            
              {/* Complaints Trend */}
              
                
                  Complaints Trend
                  
                    {getTimePeriodLabel()}
                  
                
                
                  
                    {processedChartData?.trendsData?.length > 0 ? (
                      
                        
                          
                          
                          
                           {
                              if (payload && payload[0]) {
                                return `Date: ${payload[0].payload.fullDate || label}`;
                              }
                              return `Date: ${label}`;
                            }}
                            formatter={(value, name) => [
                              value,
                              name === "complaints"
                                ? "Total Complaints"
                                : "Resolved Complaints",
                            ]}
                          />
                          
                          
                          
                        
                      
                    ) : (
                      
                        
                          
                          No trend data available for selected period
                          
                            {getTimePeriodLabel()}
                          
                          
                            Try adjusting your date range or filters
                          
                        
                      
                    )}
                  
                
              

              {/* Category Breakdown */}
              
                
                  Complaint Categories
                  
                    {getTimePeriodLabel()}
                  
                
                
                  
                    {processedChartData?.categoriesWithColors?.length > 0 ? (`${name}).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {processedChartData.categoriesWithColors.map(
                              (entry, index) => (
                                
                              ),
                            )}
                          
                           [
                              `${value} complaints`,
                              name,
                            ]}
                            labelFormatter={(label) => `Category: ${label}`}
                          />
                        
                      
                    ) : (
                      
                        
                          
                          No category data available for selected period
                          
                            {getTimePeriodLabel()}
                          
                          
                            Try adjusting your filters or date range
                          
                        
                      
                    )}
                  
                
              
            
          

          {/* Trends Tab */}
          
            
              
                Detailed Trends Analysis
                
                  {getTimePeriodLabel()}
                
              
              
                
                  
                    
                      
                      
                      
                      
                       {
                          if (payload && payload[0]) {
                            return `Date: ${payload[0].payload.fullDate || label}`;
                          }
                          return `Date: ${label}`;
                        }}
                        formatter={(value, name) => [
                          name === "slaCompliance" ? `${value}%` ,
                          name === "slaCompliance" ? "SLA Compliance" ,
                        ]}
                      />
                      
                      
                      
                      
                    
                  
                
              
            
          

          {/* Performance Tab */}
          
            
              
                
                  Performance Metrics
                  
                    {getTimePeriodLabel()}
                  
                
                
                  
                    
                      User Satisfaction
                      
                        {analyticsData.performance.userSatisfaction.toFixed(2)}
                        /5
                      
                    
                    
                      Escalation Rate
                      
                        {analyticsData.performance.escalationRate.toFixed(2)}%
                      
                    
                    
                      First Call Resolution
                      
                        {analyticsData.performance.firstCallResolution.toFixed(
                          2,
                        )}
                        %
                      
                    
                    
                      Repeat Complaints
                      
                        {analyticsData.performance.repeatComplaints.toFixed(2)}%
                      
                    
                  
                
              

              
                
                  Resolution Time Distribution
                  
                    {getTimePeriodLabel()}
                  
                
                
                  
                    
                      
                        
                        
                        
                        
                        
                      
                    
                  
                
              
            
          

          {/* Ward Analysis Tab (Admin only) */}
          {permissions.canViewAllWards && (
            
              
                
                  Ward Performance Comparison
                  
                    {getTimePeriodLabel()}
                  
                
                
                  
                    
                      
                        
                        
                        
                        
                        
                        
                        
                      
                    
                  
                
              
            
          )}

          {/* Categories Tab */}
          
            
              
                Category Analysis
                
                  {getTimePeriodLabel()}
                
              
              
                
                  {(processedChartData?.categoriesWithColors || []).map(
                    (category, index) => ({category.name}
                        
                        
                          {category.count} complaints
                          Avg),
                  )}
                
              
            
          
        
      )}

      {/* Report Generation Modal */}
       {}}>
        
          
            
              
              Generating Report
            
          
          
            
              
                Generating Report...
              
              
                Processing {getTimePeriodLabel()} data
              

              {/* Circular Progress with Timer */}
              
                
                  
                
                
                  
                    {Math.floor(reportProgress)}%
                  
                
              

              
              
                {reportProgress 
            

            
              
                
                Report Scope
              
              
                
                  Period:
                  {getTimePeriodLabel()}
                
                {filters.ward == "all" && (Ward)}
                {filters.complaintType == "all" && (Type)}
                {filters.status == "all" && (Status)}
              
            
          
          
            = 100}
            >
              Cancel
            
          
        
      
    
  );
};

export default UnifiedReports;
