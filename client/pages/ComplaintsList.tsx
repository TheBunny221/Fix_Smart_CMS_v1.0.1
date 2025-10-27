import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintsQuery, type Complaint } from "../store/api/complaintsApi";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useGetWardsForFilteringQuery } from "../store/api/adminApi";
import { useDataManager } from "../hooks/useDataManager";
import { useComplaintPriorities, useComplaintStatuses } from "../hooks/useSystemConfig";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Calendar,
  MapPin,
  Eye,
  Edit,
  ChevronDown,
  X,
  Download,
  RefreshCw,
} from "lucide-react";
import ComplaintQuickActions from "../components/ComplaintQuickActions";
import QuickComplaintModal from "../components/QuickComplaintModal";
import UpdateComplaintModal from "../components/UpdateComplaintModal";
import { ExportButton } from "../components/ExportButton";
import { useSystemConfig } from "../contexts/SystemConfigContext";

const ComplaintsList: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);
  const [searchParams] = useSearchParams();

  // Initialize filters from URL parameters
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [priorityFilter, setPriorityFilter] = useState(() => {
    const priority = searchParams.get("priority");
    // Handle comma-separated values like "CRITICAL,HIGH"
    if (priority && priority.includes(",")) {
      return "high_critical"; // Use a combined filter for UI purposes
    }
    return priority || "all";
  });
  const [wardFilter, setWardFilter] = useState(
    searchParams.get("ward") || "all",
  );
  const [subZoneFilter, setSubZoneFilter] = useState(
    searchParams.get("subZone") || "all",
  );
  const [needsMaintenanceAssignment, setNeedsMaintenanceAssignment] = useState(
    searchParams.get("needsMaintenanceAssignment") === "true" || false,
  );
  const [slaStatusFilter, setSlaStatusFilter] = useState(
    searchParams.get("slaStatus") || "all",
  );
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // Export functionality moved to ExportButton component

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] = useState<number>(25);

  // Data management
  const { cacheComplaintsList } = useDataManager();

  // Fetch wards for filtering (only for admin users)
  const { data: wardsResponse, isLoading: isLoadingWards } =
    useGetWardsForFilteringQuery(undefined, {
      skip: !isAuthenticated || user?.role === "CITIZEN",
    });

  const wards = wardsResponse?.data?.wards || [];

  // Get sub-zones for selected ward
  const selectedWard = wards.find((ward) => ward.id === wardFilter);
  const availableSubZones = selectedWard?.subZones || [];

  // Get system config from centralized Redux store
  const { priorities: configuredPriorities } = useComplaintPriorities();
  const { statuses: configuredStatuses } = useComplaintStatuses();
  const { getComplaintTypeById } = useComplaintTypes();
  const { appName, appLogoUrl, getConfig } = useSystemConfig();

  const prettyLabel = (v: string) =>
    v
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
    const params: any = { page: currentPage, limit: recordsPerPage };
    if (statusFilter !== "all") params.status = statusFilter.toUpperCase();

    // Handle priority filter including URL-based comma-separated values
    if (priorityFilter !== "all") {
      const urlPriority = searchParams.get("priority");
      if (urlPriority && urlPriority.includes(",")) {
        // For comma-separated values from URL, send as array
        params.priority = urlPriority
          .split(",")
          .map((p) => p.trim().toUpperCase());
      } else if (priorityFilter === "high_critical") {
        // Handle the combined high & critical filter
        params.priority = ["HIGH", "CRITICAL"];
      } else {
        params.priority = priorityFilter.toUpperCase();
      }
    }

    // Add ward and sub-zone filters
    if (wardFilter !== "all") params.wardId = wardFilter;
    if (subZoneFilter !== "all") params.subZoneId = subZoneFilter;

    // Enforce officer-based filtering for Ward Officers
    if (user?.role === "WARD_OFFICER" && user?.id) {
      params.officerId = user.id;
    }

    // Add new filters
    if (needsMaintenanceAssignment) params.needsTeamAssignment = true;
    if (slaStatusFilter !== "all")
      params.slaStatus = slaStatusFilter.toUpperCase();

    if (debouncedSearchTerm.trim()) params.search = debouncedSearchTerm.trim();

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
  const {
    data: complaintsResponse,
    isLoading,
    error,
    refetch,
  } = useGetComplaintsQuery(queryParams, { skip: !isAuthenticated || !user });

  const complaintsData = complaintsResponse?.data as any;
  const complaints: Complaint[] = Array.isArray(complaintsData?.complaints)
    ? complaintsData.complaints
    : Array.isArray(complaintsData)
      ? complaintsData
      : [];

  // Cache complaints data when loaded
  useEffect(() => {
    if (complaints.length > 0) {
      cacheComplaintsList(complaints);
    }
  }, [complaints, cacheComplaintsList]);

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
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

  const getSLAColor = (sla: string) => {
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
  const handleWardChange = (value: string) => {
    setWardFilter(value);
    setSubZoneFilter("all");
  };

  // Export functionality moved to ExportButton component

  // Pagination helpers
  const totalItems = complaintsData?.pagination?.totalItems ?? 0;
  const totalPages = Math.max(
    1,
    complaintsData?.pagination?.totalPages ??
    Math.ceil((totalItems || 0) / recordsPerPage || 1),
  );

  // Ensure currentPage stays within bounds when totalPages or totalItems change
  useEffect(() => {
    if (totalPages && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === "MAINTENANCE_TEAM" ? (translations?.nav?.myComplaints || "My Complaints") : (translations?.nav?.complaints || "Complaints")}
          </h1>
          <p className="text-gray-600">
            {user?.role === "MAINTENANCE_TEAM"
              ? (translations?.complaints?.viewAndManageSubmitted || "View and manage complaints you have submitted")
              : (translations?.complaints?.manageAndTrackAll || "Manage and track all complaints")}
          </p>
        </div>
        <div className="flex gap-2">
          {(user?.role === "CITIZEN" ||
            user?.role === "MAINTENANCE_TEAM" ||
            user?.role === "ADMINISTRATOR" ||
            user?.role === "WARD_OFFICER") && (
              <Button onClick={() => setIsQuickFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {translations?.complaints?.newComplaint || "New Complaint"}
              </Button>
            )}
        </div>
      </div>

      {/* Ultra Compact Filters - Modern Single Line */}
      <Card className="rounded-2xl shadow-lg border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          {/* Primary Filter Row - Single Line Layout */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
            {/* Search Bar - Expandable */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={translations?.complaints?.searchPlaceholder || "Search complaints..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-10 text-sm rounded-xl border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                title={translations?.complaints?.searchTooltip || "Search by complaint ID, description, or location"}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Primary Filters - Compact Pills */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-10 text-sm rounded-xl border-slate-200 dark:border-slate-600 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all">
                <SelectValue placeholder={translations?.common?.status || "Status"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">{translations?.complaints?.allStatus || "All Status"}</SelectItem>
                {configuredStatuses.map((s: string) => (
                  <SelectItem key={s} value={s}>
                    {prettyLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px] h-10 text-sm rounded-xl border-slate-200 dark:border-slate-600 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all">
                <SelectValue placeholder={translations?.common?.priority || "Priority"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">{translations?.complaints?.allPriority || "All Priority"}</SelectItem>
                {configuredPriorities.map((p: string) => (
                  <SelectItem key={p} value={p}>
                    {prettyLabel(p)}
                  </SelectItem>
                ))}
                {configuredPriorities.includes("HIGH") &&
                  configuredPriorities.includes("CRITICAL") && (
                    <SelectItem value="high_critical">
                      {translations?.complaints?.highAndCritical || "High & Critical"}
                    </SelectItem>
                  )}
              </SelectContent>
            </Select>

            {/* Ward Filter - Only for administrators */}
            {user?.role === "ADMINISTRATOR" && (
              <Select value={wardFilter} onValueChange={handleWardChange}>
                <SelectTrigger className="w-[130px] h-10 text-sm rounded-xl border-slate-200 dark:border-slate-600 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder={translations?.complaints?.ward || "Ward"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">{translations?.complaints?.allWards || "All Wards"}</SelectItem>
                  {wards.map((ward) => (
                    <SelectItem key={ward.id} value={ward.id}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Advanced Filters Toggle with Badge */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`relative h-10 px-4 text-sm rounded-xl transition-all ${showAdvancedFilters
                ? 'border-primary bg-primary text-white hover:bg-primary/90'
                : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                }`}
            >
              <Filter className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">{translations?.common?.more || "More"}</span>
              {(subZoneFilter !== 'all' || slaStatusFilter !== 'all' || needsMaintenanceAssignment) && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shadow-lg">
                  {[subZoneFilter !== 'all', slaStatusFilter !== 'all', needsMaintenanceAssignment].filter(Boolean).length}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 ml-1.5 transition-transform duration-300 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </Button>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-10 px-3 text-sm rounded-xl border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                title={translations?.complaints?.clearAllFilters || "Clear all filters"}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="h-10 px-3 text-sm rounded-xl bg-primary hover:bg-primary/90 text-white border-transparent shadow-lg shadow-primary/30 transition-all"
                title={translations?.complaints?.refreshData || "Refresh data"}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters - Collapsible */}
          {showAdvancedFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2">
              {/* Sub-Zone Filter - Only for admin and when ward is selected */}
              {user?.role === "ADMINISTRATOR" &&
                wardFilter !== "all" &&
                availableSubZones.length > 0 && (
                  <Select value={subZoneFilter} onValueChange={setSubZoneFilter}>
                    <SelectTrigger className="w-[140px] h-10 text-sm rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-750 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all">
                      <SelectValue placeholder={translations?.complaints?.subZone || "Sub-Zone"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">{translations?.complaints?.allSubZones || "All Sub-Zones"}</SelectItem>
                      {availableSubZones.map((subZone) => (
                        <SelectItem key={subZone.id} value={subZone.id}>
                          {subZone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

              {/* SLA Status Filter */}
              <Select value={slaStatusFilter} onValueChange={setSlaStatusFilter}>
                <SelectTrigger className="w-[140px] h-10 text-sm rounded-xl border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-750 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder={translations?.complaints?.slaStatus || "SLA"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">{translations?.complaints?.allSLA || "All SLA"}</SelectItem>
                  <SelectItem value="ON_TIME">{translations?.complaints?.slaStatuses?.ontime || "On Time"}</SelectItem>
                  <SelectItem value="WARNING">{translations?.complaints?.slaStatuses?.warning || "Warning"}</SelectItem>
                  <SelectItem value="OVERDUE">{translations?.complaints?.slaStatuses?.overdue || "Overdue"}</SelectItem>
                  <SelectItem value="COMPLETED">{translations?.complaints?.slaStatuses?.completed || "Done"}</SelectItem>
                </SelectContent>
              </Select>

              {/* Assignment Filter - Only for Ward Officers */}
              {user?.role === "WARD_OFFICER" && (
                <div className="flex items-center space-x-2 px-4 py-2 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-750 rounded-xl h-10 hover:border-primary/50 transition-all cursor-pointer">
                  <Checkbox
                    id="needsMaintenanceAssignment"
                    checked={needsMaintenanceAssignment}
                    onCheckedChange={(checked) => setNeedsMaintenanceAssignment(checked === true)}
                    className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor="needsMaintenanceAssignment"
                    className="text-sm font-medium cursor-pointer whitespace-nowrap text-slate-900 dark:text-slate-100"
                  >
                    {translations?.complaints?.needsAssignment || "Needs Assignment"}
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Active Filters Display */}
          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || wardFilter !== 'all' || subZoneFilter !== 'all' || slaStatusFilter !== 'all' || needsMaintenanceAssignment) && (
            <div className="flex flex-wrap gap-2 items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{translations?.complaints?.activeFilters || "Active Filters"}:</span>

              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800">
                  {translations?.common?.search || "Search"}: {searchTerm.slice(0, 20)}{searchTerm.length > 20 ? '...' : ''}
                  <button onClick={() => setSearchTerm('')} className="hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium border border-green-200 dark:border-green-800">
                  {translations?.common?.status || "Status"}: {prettyLabel(statusFilter)}
                  <button onClick={() => setStatusFilter('all')} className="hover:bg-green-100 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {priorityFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium border border-orange-200 dark:border-orange-800">
                  {translations?.common?.priority || "Priority"}: {prettyLabel(priorityFilter)}
                  <button onClick={() => setPriorityFilter('all')} className="hover:bg-orange-100 dark:hover:bg-orange-800 rounded-full p-0.5 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {wardFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium border border-purple-200 dark:border-purple-800">
                  {translations?.complaints?.ward || "Ward"}: {wards.find(w => w.id === wardFilter)?.name || wardFilter}
                  <button onClick={() => handleWardChange('all')} className="hover:bg-purple-100 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {subZoneFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-800">
                  {translations?.complaints?.subZone || "Sub-Zone"}: {availableSubZones.find(z => z.id === subZoneFilter)?.name || subZoneFilter}
                  <button onClick={() => setSubZoneFilter('all')} className="hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-full p-0.5 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {slaStatusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs font-medium border border-pink-200 dark:border-pink-800">
                  {translations?.complaints?.slaStatus || "SLA"}: {prettyLabel(slaStatusFilter)}
                  <button onClick={() => setSlaStatusFilter('all')} className="hover:bg-pink-100 dark:hover:bg-pink-800 rounded-full p-0.5 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {needsMaintenanceAssignment && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium border border-yellow-200 dark:border-yellow-800">
                  {translations?.complaints?.needsAssignment || "Needs Assignment"}
                  <button onClick={() => setNeedsMaintenanceAssignment(false)} className="hover:bg-yellow-100 dark:hover:bg-yellow-800 rounded-full p-0.5 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Search Helper Text */}
          {searchTerm && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {searchTerm.match(/^[A-Za-z]/)
                  ? `${translations?.complaints?.searchingFor || "Searching for"}: "${searchTerm}"`
                  : (translations?.complaints?.searchingInDescriptions || "Searching in descriptions and locations")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              {translations?.nav?.complaints || "Complaints"} (
              {complaintsData?.pagination?.totalItems ??
                filteredComplaints.length}
              )
            </div>
            {/* Export Button */}
            {(user?.role === "ADMINISTRATOR" || user?.role === "WARD_OFFICER") && (
              <ExportButton
                complaints={filteredComplaints}
                systemConfig={{
                  appName: appName || 'Smart CMS',
                  appLogoUrl: appLogoUrl || '/logo.png',
                  complaintIdPrefix: getConfig("COMPLAINT_ID_PREFIX", "CMS")
                }}
                user={{
                  role: user?.role || 'GUEST',
                  ...(user?.wardId && { wardId: user.wardId })
                }}
                disabled={filteredComplaints.length === 0}
                className="flex items-center gap-2"
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">{translations?.complaints?.pleaseSignIn || "Please sign in to view complaints."}</p>
              <Link to="/login">
                <Button>{translations?.auth?.login || "Go to Sign In"}</Button>
              </Link>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <p className="text-red-500 mb-2">{getApiErrorMessage(error as any) || (translations?.complaints?.failedToLoad || "Failed to load complaints")}</p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={() => refetch()}>{translations?.common?.retry || "Try Again"}</Button>
                <Link to="/login">
                  <Button variant="outline">{translations?.auth?.login || "Sign In"}</Button>
                </Link>
              </div>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">{translations?.complaints?.noComplaintsFound || "No complaints found"}</p>
              <p className="text-sm text-gray-400">
                {searchTerm ||
                  statusFilter !== "all" ||
                  priorityFilter !== "all"
                  ? (translations?.complaints?.tryAdjustingFilters || "Try adjusting your filters or search terms")
                  : (translations?.complaints?.submitFirstComplaint || "Submit your first complaint to get started")}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translations?.complaints?.complaintId || "Complaint ID"}</TableHead>
                    <TableHead>{translations?.common?.description || "Description"}</TableHead>
                    <TableHead>{translations?.complaints?.location || "Location"}</TableHead>
                    <TableHead>{translations?.common?.status || "Status"}</TableHead>
                    <TableHead>{translations?.common?.priority || "Priority"}</TableHead>
                    {(user?.role === "ADMINISTRATOR" ||
                      user?.role === "WARD_OFFICER") && (
                        <TableHead>{translations?.complaints?.team || "Team"}</TableHead>
                      )}
                    {user?.role === "ADMINISTRATOR" && (
                      <TableHead>{translations?.complaints?.officer || "Officer"}</TableHead>
                    )}
                    {user?.role !== "CITIZEN" && (
                      <>
                        <TableHead>{translations?.complaints?.rating || "Rating"}</TableHead>
                        <TableHead>{translations?.complaints?.slaStatus || "SLA"}</TableHead>
                        <TableHead>{translations?.complaints?.registeredOn || "Registered On"}</TableHead>
                        <TableHead>{translations?.complaints?.updated || "Updated"}</TableHead>
                        <TableHead>{translations?.complaints?.closed || "Closed"}</TableHead>
                        {/* {user?.role === "ADMINISTRATOR" && (
                          <>
                            <TableHead>Maintenance Team ID</TableHead>
                            <TableHead>Ward Officer ID</TableHead>
                          </>
                        )} */}
                      </>
                    )}
                    <TableHead>{translations?.common?.actions || "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((complaint: any) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">
                        #{complaint.complaintId || (complaint.id && typeof complaint.id === 'string' ? complaint.id.slice(-6) : (translations?.common?.unknown || 'Unknown'))}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate">{complaint.description}</p>
                          <p className="text-sm text-gray-500">
                            {getComplaintTypeById(complaint.complaintTypeId)?.name ||
                              (typeof complaint.type === 'string' ? complaint.type.replace("_", " ") : complaint.type?.name || (translations?.complaints?.unknownType || "Unknown Type"))}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          {complaint.area}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status?.replace("_", " ") || (translations?.common?.unknown || "Unknown")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            className={getPriorityColor(complaint.priority)}
                          >
                            {complaint.priority}
                          </Badge>
                          {/* {(complaint as any).needsTeamAssignment &&
                            !["RESOLVED", "CLOSED"].includes(
                              complaint.status,
                            ) && (
                              <Badge className="bg-orange-100 text-orange-800 text-xs">
                                Needs Team Assignment
                              </Badge>
                            )} */}
                        </div>
                      </TableCell>
                      {(user?.role === "ADMINISTRATOR" ||
                        user?.role === "WARD_OFFICER") && (
                          <TableCell>
                            {complaint.maintenanceTeam?.fullName ? (
                              <span className="text-sm">
                                {complaint.maintenanceTeam.fullName}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">-</span>
                            )}
                          </TableCell>
                        )}
                      {user?.role === "ADMINISTRATOR" && (
                        <TableCell>
                          {complaint.wardOfficer?.fullName ? (
                            <span className="text-sm">
                              {complaint.wardOfficer.fullName}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                        </TableCell>
                      )}
                      {user?.role !== "CITIZEN" && (
                        <>
                          <TableCell>
                            {typeof complaint.rating === "number" &&
                              complaint.rating > 0 ? (
                              <span className="text-sm font-medium">
                                {complaint.rating}/5
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">{translations?.common?.notAvailable || "N/A"}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getSLAColor(complaint.slaStatus)}>
                              {complaint.slaStatus?.replace("_", " ") || (translations?.common?.unknown || "Unknown")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(
                                complaint.submittedOn,
                              ).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {new Date(
                                complaint.updatedAt,
                              ).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {complaint.closedOn ? (
                              <span className="text-sm">
                                {new Date(
                                  complaint.closedOn,
                                ).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">-</span>
                            )}
                          </TableCell>

                          {/* {user?.role === "ADMINISTRATOR" && (
                            <>
                              <TableCell>
                                {complaint.maintenanceTeam?.id ||
                                  complaint.maintenanceTeam ||
                                  "-"}
                              </TableCell>
                              <TableCell>
                                {complaint.wardOfficer?.id ||
                                  complaint.wardOfficer ||
                                  "-"}
                              </TableCell>
                            </>
                          )} */}
                        </>
                      )}
                      <TableCell>
                        <ComplaintQuickActions
                          complaint={{
                            id: complaint.id,
                            complaintId: complaint.complaintId,
                            status: complaint.status,
                            priority: complaint.priority,
                            type: complaint.type,
                            description: complaint.description,
                            area: complaint.area,
                            assignedTo: complaint.assignedTo,
                          }}
                          userRole={user?.role || ""}
                          showDetails={false}
                          onUpdate={() => refetch()}
                          onShowUpdateModal={(c) => {
                            setSelectedComplaint(complaint);
                            setIsUpdateModalOpen(true);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination and records-per-page controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{translations?.complaints?.rowsPerPage || "Rows per page"}:</span>
                  <Select
                    value={String(recordsPerPage)}
                    onValueChange={(v) => {
                      setRecordsPerPage(Number(v));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-24 px-2 py-1 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">
                    {totalItems === 0
                      ? (translations?.complaints?.showing0of0 || "Showing 0 of 0")
                      : `${translations?.complaints?.showing || "Showing"} ${(currentPage - 1) * recordsPerPage + 1} - ${Math.min(currentPage * recordsPerPage, totalItems)} ${translations?.common?.of || "of"} ${totalItems}`}
                  </span>
                </div>

                <div className="flex items-center space-x-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-1 py-0.5 text-xs rounded-sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    {translations?.common?.first || "First"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-1 py-0.5 text-xs rounded-sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    {translations?.common?.previous || "Prev"}
                  </Button>

                  {getPageNumbers().map((p) => (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-1 py-0.5 text-xs rounded-sm min-w-[28px]"
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-1 py-0.5 text-xs rounded-sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    {translations?.common?.next || "Next"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-1 py-0.5 text-xs rounded-sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    {translations?.common?.last || "Last"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Complaint Modal */}
      <QuickComplaintModal
        isOpen={isQuickFormOpen}
        onClose={() => setIsQuickFormOpen(false)}
        onSuccess={(complaintId) => {
          // Refresh data after successful submission
          refetch();
        }}
      />

      {/* Update Complaint Modal */}
      <UpdateComplaintModal
        complaint={selectedComplaint}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedComplaint(null);
        }}
        onSuccess={() => {
          setIsUpdateModalOpen(false);
          setSelectedComplaint(null);
          refetch();
        }}
      />
    </div>
  );
};

export default ComplaintsList;
