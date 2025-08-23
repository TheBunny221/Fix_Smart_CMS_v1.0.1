import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintsQuery } from "../store/api/complaintsApi";
import { useDataManager } from "../hooks/useDataManager";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
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
} from "lucide-react";
import ComplaintQuickActions from "../components/ComplaintQuickActions";
import QuickComplaintModal from "../components/QuickComplaintModal";
import UpdateComplaintModal from "../components/UpdateComplaintModal";

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Data management
  const { cacheComplaintsList } = useDataManager();

  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query parameters for server-side filtering
  const queryParams = useMemo(() => {
    const params = { page, limit: 100 };
    if (statusFilter == "all") params.status = statusFilter.toUpperCase();

    // Handle priority filter including URL-based comma-separated values
    if (priorityFilter == "all") {
      const urlPriority = searchParams.get("priority");
      if (urlPriority && urlPriority.includes(",")) {
        // For comma-separated values from URL, send
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

    if (debouncedSearchTerm.trim()) params.search = debouncedSearchTerm.trim();

    // For MAINTENANCE_TEAM users, show only their own complaints
    if (user?.role === "MAINTENANCE_TEAM") {
      params.submittedById = user.id;
    }

    return params;
  }, [
    statusFilter,
    priorityFilter,
    debouncedSearchTerm,
    user?.role,
    user?.id,
    searchParams,
  ]);

  // Use RTK Query for better authentication handling
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetComplaintsQuery(queryParams, { skip);

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

  // Use all complaints since filtering is done server-side
  const filteredComplaints = complaints;

  // Clear all filters and refetch data
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setDebouncedSearchTerm("");
  };

  return ({/* Header */}
      
        
          
            {user?.role === "MAINTENANCE_TEAM" ? "My Complaints" )}>
            
            Refresh
          
          {(user?.role === "CITIZEN" || user?.role === "MAINTENANCE_TEAM") && (
             setIsQuickFormOpen(true)}>
              
              New Complaint
            
          )}
        
      

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
              
              {searchTerm && (
                
                  {searchTerm.match(/^[A-Za-z]/)
                    ? `Searching for complaint ID: ${searchTerm}`
                    : `Searching in descriptions and locations`}
                
              )}
            
            
              
                
              
              
                All Status
                Registered
                Assigned
                In Progress
                Resolved
                Closed
              
            
            
              
                
              
              
                All Priority
                Low
                Medium
                High
                Critical
                High & Critical
              
            
            
              
              Clear Filters
            
          
        
      

      {/* Complaints Table */}
      
        
          
            
            Complaints ({filteredComplaints.length})
          
        
        
          {error ? (
            
              
              Failed to load complaints
               refetch()}>
                Try Again
              
            
          ) : isLoading ? (
            
              {[...Array(5)].map((_, i) => (
                
                  
                  
                
              ))}
            
          ) : filteredComplaints.length === 0 ? (No complaints found
              
                {searchTerm ||
                statusFilter == "all" ||
                priorityFilter == "all"
                  ? "Try adjusting your filters or search terms"
                  ) : (
            
              
                
                  Complaint ID
                  Description
                  Location
                  Status
                  Priority
                  Date
                  Actions
                
              
              
                {filteredComplaints.map((complaint) => (
                  
                    
                      #{complaint.complaintId || complaint.id.slice(-6)}
                    
                    
                      
                        {complaint.description}
                        
                          {complaint.type.replace("_", " ")}
                        
                      
                    
                    
                      
                        
                        {complaint.area}
                      
                    
                    
                      
                        {complaint.status.replace("_", " ")}
                      
                    
                    
                      
                        {complaint.priority}
                      
                    
                    
                      
                        
                        {new Date(complaint.submittedOn).toLocaleDateString()}
                      
                    
                    
                      
                        
                          
                            
                            View
                          
                        
                        {(user?.role === "ADMINISTRATOR" ||
                          user?.role === "WARD_OFFICER") && (
                           {
                              setSelectedComplaint(complaint);
                              setIsUpdateModalOpen(true);
                            }}
                          >
                            
                            Update
                          
                        )}
                      
                    
                  
                ))}
              
            
          )}
        
      

      {/* Quick Complaint Modal */}
       setIsQuickFormOpen(false)}
        onSuccess={(complaintId) => {
          // Refresh data after successful submission
          refetch();
        }}
      />

      {/* Update Complaint Modal */}
       {
          setIsUpdateModalOpen(false);
          setSelectedComplaint(null);
        }}
        onSuccess={() => {
          setIsUpdateModalOpen(false);
          setSelectedComplaint(null);
          refetch();
        }}
      />
    
  );
};

export default ComplaintsList;
