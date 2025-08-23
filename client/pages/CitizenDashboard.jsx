import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import {
  useGetComplaintsQuery,
  useGetComplaintStatisticsQuery,
} from "../store/api/complaintsApi";
import { formatDate } from "../lib/dateUtils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Input } from "../components/ui/input";
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
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  MapPin,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Star,
  MessageSquare,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import FeedbackDialog from "../components/FeedbackDialog";
import QuickComplaintModal from "../components/QuickComplaintModal";

const CitizenDashboard = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);
  const { complaintTypeOptions } = useComplaintTypes();

  // Set document title
  useDocumentTitle("Dashboard");

  // Debug: Log authentication state
  console.log("Authentication state", {
    user: user,
    isAuthenticated,
    userId: user?.id,
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Use RTK Query for better authentication handling
  const {
    data: complaintsResponse,
    isLoading: complaintsLoading,
    error: complaintsError,
    refetch: refetchComplaints,
  } = useGetComplaintsQuery({ page: 1, limit: 20 }, // Get more complaints for better stats
    { skip: !isAuthenticated || !user },
  );

  const {
    data: statsResponse,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useGetComplaintStatisticsQuery({}, { skip: !isAuthenticated || !user });

  // Debug: Log raw API responses
  console.log("Raw API responses", {
    complaintsResponse,
    statsResponse,
    complaintsResponseKeys: complaintsResponse
      ? Object.keys(complaintsResponse)
      : null,
    statsResponseKeys: statsResponse ? Object.keys(statsResponse) : null,
  });

  // Extract complaints from the actual API response structure
  // Backend returns: { success, data: { complaints: [...], pagination: {...} } }
  const complaints = Array.isArray(complaintsResponse?.data?.complaints)
    ? complaintsResponse.data.complaints
    : [];

  console.log("Extracted complaints", complaints);
  console.log("Complaints count", complaints.length);
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

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [typeFilter, setTypeFilter] = useState(
    searchParams.get("type") || "all",
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "submittedOn",
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("order") || "desc",
  );
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
    if (searchTerm) params.set("search", searchTerm);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
    if (sortBy) params.set("sort", sortBy);
    if (sortOrder) params.set("order", sortOrder);

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
    console.log("Dashboard data debug", {
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
      const pending =
        stats.byStatus?.REGISTERED || stats.byStatus?.registered || 0;
      const inProgress =
        stats.byStatus?.IN_PROGRESS || stats.byStatus?.in_progress || 0;
      const resolved =
        stats.byStatus?.RESOLVED || stats.byStatus?.resolved || 0;
      const resolutionRate =
        total > 0 ? Math.round((resolved / total) * 100) : 0;

      console.log("Using API stats", {
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
        avgResolutionTime: stats.avgResolutionTime || 0,
        resolutionRate,
      });
    } else {
      // Calculate from complaints list
      const total = complaints.length;

      console.log("Fallback calculation - analyzing complaints",
        complaints.map((c) => ({
          id: c.id,
          status: c.status,
          type: typeof c.status,
        })),
      );

      const pending = complaints.filter(
        (c) => c.status === "registered" || c.status === "REGISTERED",
      ).length;
      const inProgress = complaints.filter(
        (c) => c.status === "in_progress" || c.status === "IN_PROGRESS",
      ).length;
      const resolved = complaints.filter(
        (c) =>
          c.status === "resolved" ||
          c.status === "RESOLVED" ||
          c.status === "closed" ||
          c.status === "CLOSED",
      ).length;
      const resolutionRate =
        total > 0 ? Math.round((resolved / total) * 100) : 0;

      console.log("Using fallback calculation", {
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
  if (
    complaintsError &&
    "status" in complaintsError &&
    complaintsError.status === 401
  ) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-lg font-medium mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">Please log in again to access your dashboard.</p>
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              🚀 Welcome back, {user?.fullName || "Citizen"} 👋
            </h1>
            <p className="opacity-90">
              Track your complaints and stay updated with the latest progress.
            </p>
          </div>
          <Button
            onClick={() => setIsQuickFormOpen(true)}
            className="bg-white text-blue-600 hover:bg-gray-50"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            New Complaint
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Complaints
            </CardTitle>
            <FileText className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.total}</div>
            <p className="text-xs text-gray-500">
              All time submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="w-5 h-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardStats.pending}
            </div>
            <p className="text-xs text-gray-500">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardStats.inProgress}
            </div>
            <p className="text-xs text-gray-500">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats.resolved}
            </div>
            <p className="text-xs text-gray-500">
              Successfully resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Rate Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Resolution Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  Overall Resolution Rate
                </p>
                <p className="text-sm text-gray-500">
                  {dashboardStats.resolved} of {dashboardStats.total} complaints
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  Progress
                </p>
                <p className="text-lg font-bold">{dashboardStats.resolutionRate}%</p>
              </div>
            </div>
            <Progress
              value={dashboardStats.resolutionRate}
              className="h-2"
            />
            {dashboardStats.avgResolutionTime > 0 && (
              <p className="text-sm text-gray-500">
                <span className="font-medium">Average Resolution Time:</span>{" "}
                {dashboardStats.avgResolutionTime} days
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Complaints Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>My Complaints</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} size="sm" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsQuickFormOpen(true)} size="sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                New Complaint
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  title="Search by complaint ID (e.g., KSC0001), description, or location"
                />
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm("")}
                    className="h-4 w-4 p-0 hover:bg-gray-200"
                    variant="ghost"
                    size="sm"
                  >
                    ×
                  </Button>
                )}
              </div>
              <Button onClick={handleSearch} size="sm">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="flex gap-4 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {complaintTypeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split("-");
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submittedOn-desc">Newest First</SelectItem>
                  <SelectItem value="submittedOn-asc">Oldest First</SelectItem>
                  <SelectItem value="priority-desc">
                    High Priority First
                  </SelectItem>
                  <SelectItem value="status-asc">Status</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm ||
                (statusFilter && statusFilter !== "all") ||
                (typeFilter && typeFilter !== "all")) && (
                <Button onClick={clearAllFilters} variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Complaints Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 mx-auto mb-4 animate-spin" />
              Loading complaints...
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="font-medium mb-2">No complaints found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter || typeFilter
                  ? "No complaints match your current filters."
                  : "You haven't submitted any complaints yet."}
              </p>
              <Button onClick={() => setIsQuickFormOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Submit Your First Complaint
              </Button>
            </div>
          ) : (
            <div>
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {complaints.map((complaint) => (
                  <Card key={complaint.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium">{complaint.title}</h4>
                          <p className="text-sm text-gray-500">
                            ID: {complaint.complaintId.slice(-8)}
                          </p>
                        </div>

                        <div className="flex justify-between text-sm">
                          <Badge className={getComplaintTypeLabel(complaint.type)}>
                            {getComplaintTypeLabel(complaint.type)}
                          </Badge>
                          <span className="text-gray-500">{formatDate(complaint.submittedOn)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <Badge className={getStatusColor(complaint.status)}>
                            {complaint.status.replace("_", " ")}
                          </Badge>
                          <Badge className={getPriorityColor(complaint.priority)}>
                            {complaint.priority}
                          </Badge>
                          {complaint.ward && (
                            <span className="text-sm text-gray-500">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {complaint.ward.name}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate(`/complaints/${complaint.id}`)
                            }
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>

                          {isResolved(complaint.status) && (
                            <Button size="sm" variant="outline">
                              <Star className="w-4 h-4 mr-1" />
                              {complaint.rating ? "Update" : "Rate"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-mono">
                          {complaint.complaintId.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {complaint.title}
                            </p>
                            {complaint.description && (
                              <p className="text-sm text-gray-500">
                                {complaint.description.slice(0, 50)}...
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getComplaintTypeLabel(complaint.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(complaint.status)}>
                            {complaint.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(complaint.priority)}>
                            {complaint.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {complaint.ward && (
                            <span className="text-sm">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {complaint.ward.name}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(complaint.submittedOn)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {complaint.rating ? (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="text-sm">
                                {complaint.rating}/5
                              </span>
                            </div>
                          ) : isResolved(complaint.status) ? (
                            <span className="text-sm text-gray-500">
                              Not rated
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(`/complaints/${complaint.id}`)
                              }
                            >
                              <Eye className="w-3 h-3" />
                            </Button>

                            {isResolved(complaint.status) && (
                              <Button size="sm" variant="outline">
                                <Star className="w-3 h-3">
                                  <Star className="w-3 h-3" />
                                </Star>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-gray-500">
                    Showing{" "}
                    {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.limit,
                      pagination.totalItems,
                    )}{" "}
                    of {pagination.totalItems} complaints
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrev}
                      onClick={() => {
                        // RTK Query handles pagination automatically via refetch
                        refetchComplaints();
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => {
                        // RTK Query handles pagination automatically via refetch
                        refetchComplaints();
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions & Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => setIsQuickFormOpen(true)}
              className="w-full justify-start"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Submit New Complaint
            </Button>
            <Button
              onClick={() => navigate("/complaints")}
              variant="outline"
              className="w-full justify-start"
            >
              <FileText className="w-4 h-4 mr-2" />
              View All Complaints
            </Button>
            <Button
              onClick={() => navigate("/guest/track")}
              variant="outline"
              className="w-full justify-start"
            >
              <Search className="w-4 h-4 mr-2" />
              Track Complaint Status
            </Button>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle>Help & Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Need help with your complaints?
            </p>
            <ul className="text-sm space-y-1 mb-4">
              <li>• Check complaint status regularly</li>
              <li>• Provide feedback when resolved</li>
              <li>• Include photos for faster resolution</li>
              <li>• Contact support if urgent issues</li>
            </ul>
            <Button variant="outline" className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Complaint Modal */}
      <QuickComplaintModal
        open={isQuickFormOpen}
        onOpenChange={() => setIsQuickFormOpen(false)}
        onSuccess={(complaintId) => {
          // Refresh data after successful submission
          handleRefresh();
        }}
      />
    </div>
  );
};

export default CitizenDashboard;
