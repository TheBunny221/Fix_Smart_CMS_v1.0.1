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

const CitizenDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);
  const { complaintTypeOptions } = useComplaintTypes();

  // Set document title
  useDocumentTitle("Dashboard");

  // Debug: Log authentication state
  console.log("Authentication state, {
    user: user,
    isAuthenticated,
    userId: user?.id,
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Use RTK Query for better authentication handling
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetComplaintsQuery({ page, limit, // Get more complaints for better stats
    { skip: isAuthenticated || user },
  );

  const {
    data,
    isLoading,
    refetch,
  } = useGetComplaintStatisticsQuery({}, { skip);

  // Debug: Log raw API responses
  console.log("Raw API responses, {
    complaintsResponse,
    statsResponse,
    complaintsResponseKeys: complaintsResponse
      ? Object.keys(complaintsResponse)
      ,
    statsResponseKeys: statsResponse ? Object.keys(statsResponse) ,
  });

  // Extract complaints from the actual API response structure
  // Backend returns: { success, data: { complaints: [...], pagination: {...} } }
  const complaints = Array.isArray(complaintsResponse?.data?.complaints)
    ? complaintsResponse.data.complaints
    : [];

  console.log("Extracted complaints, complaints);
  console.log("Complaints count, complaints.length);
  const pagination = complaintsResponse?.data?.pagination || {
    currentPage,
    totalPages,
    totalItems,
    hasNext,
    hasPrev,
  };
  const isLoading = complaintsLoading;

  const [dashboardStats, setDashboardStats] = useState({
    total,
    pending,
    inProgress,
    resolved,
    avgResolutionTime,
    resolutionRate,
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
    if (statusFilter && statusFilter == "all")
      params.set("status", statusFilter);
    if (typeFilter && typeFilter == "all") params.set("type", typeFilter);
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
    console.log("Dashboard data debug, {
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
        total > 0 ? Math.round((resolved / total) * 100) ;

      console.log("Using API stats, {
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
        avgResolutionTime,
        resolutionRate,
      });
    } else {
      // Calculate from complaints list
      const total = complaints.length;

      console.log("Fallback calculation - analyzing complaints,
        complaints.map((c) => ({
          id,
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
        total > 0 ? Math.round((resolved / total) * 100) ;

      console.log("Using fallback calculation, {
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
        avgResolutionTime, // Will be calculated by backend stats API
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
      
        
          Authentication Error
          Please log in again to access your dashboard.
        
        
          Go to Login
        
      
    );
  }

  return (
    
      {/* Welcome Section */}
      
        
          
            
             🚀 Welcome back, {user?.fullName || "Citizen"} 👋
            
            
              Track your complaints and stay updated with the latest progress.
            
          
          
             setIsQuickFormOpen(true)}
              className="bg-white text-blue-600 hover:bg-gray-50"
            >
              
              New Complaint
            
          
        
      

      {/* Quick Stats */}
      
        
          
            
              Total Complaints
            
            
          
          
            {dashboardStats.total}
            
              All time submissions
            
          
        

        
          
            Pending
            
          
          
            
              {dashboardStats.pending}
            
            Awaiting assignment
          
        

        
          
            In Progress
            
          
          
            
              {dashboardStats.inProgress}
            
            Being worked on
          
        

        
          
            Resolved
            
          
          
            
              {dashboardStats.resolved}
            
            
              Successfully resolved
            
          
        
      

      {/* Resolution Rate Progress */}
      
        
          Resolution Progress
        
        
          
            
              
                Overall Resolution Rate
              
              
                {dashboardStats.resolved} of {dashboardStats.total} complaints
              
            
            
              
                Progress
                {dashboardStats.resolutionRate}%
              
              
            
            {dashboardStats.avgResolutionTime > 0 && (
              
                Average Resolution Time
                {dashboardStats.avgResolutionTime} days
              
            )}
          
        
      

      {/* My Complaints Section */}
      
        
          
            My Complaints
            
              
                
                Refresh
              
               setIsQuickFormOpen(true)} size="sm">
                
                New Complaint
              
            
          
        
        
          {/* Filters */}
          
            
              
                
                  
                   setSearchTerm(e.target.value)}
                    className="pl-10"
                    title="Search by complaint ID (e.g., KSC0001), description, or location"
                  />
                  {searchTerm && (
                    
                       setSearchTerm("")}
                        className="h-4 w-4 p-0 hover:bg-gray-200"
                      >
                        ×
                      
                    
                  )}
                
              
              
                
              
            

            
              
                
                  
                
                
                  All Status
                  Registered
                  Assigned
                  In Progress
                  Resolved
                  Closed
                
              

              
                
                  
                
                
                  All Types
                  {complaintTypeOptions.map((type) => (
                    
                      {type.label}
                    
                  ))}
                
              

               {
                  const [newSortBy, newSortOrder] = value.split("-");
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
              >
                
                  
                
                
                  Newest First
                  Oldest First
                  
                    High Priority First
                  
                  Status
                
              

              {(searchTerm ||
                (statusFilter && statusFilter == "all") ||
                (typeFilter && typeFilter == "all")) && (
                
                  
                  Clear Filters
                
              )}
            
          

          {/* Complaints Table */}
          {isLoading ? (
            
              
              Loading complaints...
            
          ) : complaints.length === 0 ? (No complaints found
              
              
                {searchTerm || statusFilter || typeFilter
                  ? "No complaints match your current filters."
                  )}>
                
                Submit Your First Complaint
              
            
          ) : (
            
              {/* Mobile View */}
              
                {complaints.map((complaint) => ({complaint.title}
                          
                          
                            ID, " ")}
                        
                      

                      
                        {getComplaintTypeLabel(complaint.type)}
                        {formatDate(complaint.submittedOn)}
                      

                      
                        
                          {complaint.priority}
                        
                        {complaint.ward && (
                          
                            
                            {complaint.ward.name}
                          
                        )}
                      

                      
                        
                            navigate(`/complaints/${complaint.id}`)
                          }
                          className="flex-1"
                        >
                          
                          View
                        

                        {isResolved(complaint.status) && ({complaint.rating ? "Update" )}
                      
                    
                  
                ))}
              

              {/* Desktop Table View */}
              
                
                  
                    
                      ID
                      Title
                      Type
                      Status
                      Priority
                      Location
                      Submitted
                      Rating
                      Actions
                    
                  
                  
                    {complaints.map((complaint) => (
                      
                        
                          {complaint.complaintId.slice(-8)}
                        
                        
                          
                            
                              {complaint.title}
                            
                            {complaint.description && (
                              
                                {complaint.description.slice(0, 50)}...
                              
                            )}
                          
                        
                        
                          
                            {getComplaintTypeLabel(complaint.type)}
                          
                        
                        
                          
                            {complaint.status.replace("_", " ")}
                          
                        
                        
                          
                            {complaint.priority}
                          
                        
                        
                          {complaint.ward && (
                            
                              
                              {complaint.ward.name}
                            
                          )}
                        
                        
                          
                            
                            {formatDate(complaint.submittedOn)}
                          
                        
                        
                          {complaint.rating ? (
                            
                              
                              
                                {complaint.rating}/5
                              
                            
                          ) : isResolved(complaint.status) ? (
                            
                              Not rated
                            
                          ) : (
                            —
                          )}
                        
                        
                          
                            
                                navigate(`/complaints/${complaint.id}`)
                              }
                            >
                              
                            

                            {isResolved(complaint.status) && (
                              
                                
                                  
                                
                              
                            )}
                          
                        
                      
                    ))}
                  
                
              

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                
                  
                    Showing{" "}
                    {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.limit,
                      pagination.totalItems,
                    )}{" "}
                    of {pagination.totalItems} complaints
                  
                  
                     {
                        // RTK Query handles pagination automatically via refetch
                        refetchComplaints();
                      }}
                    >
                      Previous
                    
                     {
                        // RTK Query handles pagination automatically via refetch
                        refetchComplaints();
                      }}
                    >
                      Next
                    
                  
                
              )}
            
          )}
        
      

      {/* Quick Actions & Additional Info */}
      
        {/* Quick Actions */}
        
          
            Quick Actions
          
          
             setIsQuickFormOpen(true)}
              className="w-full justify-start"
            >
              
              Submit New Complaint
            
             navigate("/complaints")}
              className="w-full justify-start"
            >
              
              View All Complaints
            
             navigate("/guest/track")}
              className="w-full justify-start"
            >
              
              Track Complaint Status
            
          
        

        {/* Help & Support */}
        
          
            Help & Support
          
          
            
              Need help with your complaints?
              
                • Check complaint status regularly
                • Provide feedback when resolved
                • Include photos for faster resolution
                • Contact support if urgentissues
              
            
            
              
              Contact Support
            
          
        
      

      {/* Quick Complaint Modal */}
       setIsQuickFormOpen(false)}
        onSuccess={(complaintId) => {
          // Refresh data after successful submission
          handleRefresh();
        }}
      />
    
  );
};

export default CitizenDashboard;
