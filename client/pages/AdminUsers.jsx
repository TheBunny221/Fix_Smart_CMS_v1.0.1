import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
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
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  Shield,
  Settings,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  useLazyGetAllUsersQuery,
  useGetUserStatsQuery,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useDeleteUserMutation,
  useCreateUserMutation,
  useUpdateUserMutation,
  type AdminUser,
  type CreateUserRequest,
  type UpdateUserRequest,
} from "../store/api/adminApi";
import { useGetWardsQuery } from "../store/api/guestApi";
import { toast } from "../components/ui/use-toast";

const AdminUsers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName,
    email: "",
    phoneNumber: "",
    role: "CITIZEN",
    wardId: "",
    department: "",
  });

  // Initialize filters from URL parameters
  useEffect(() => {
    const roleParam = searchParams.get("role");
    const statusParam = searchParams.get("status");

    if (roleParam) {
      setRoleFilter(roleParam);
    }
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  // Check authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(token);
  }, []);

  // API queries - use lazy for users to prevent AbortErrors
  const [
    getAllUsers,
    { data, isLoading, error: usersError },
  ] = useLazyGetAllUsersQuery();

  // Use regular hook with skip for stats
  const {
    data,
    isLoading,
    error,
  } = useGetUserStatsQuery(undefined, {
    skip,
  });

  // Trigger users query when authentication and parameters are ready
  useEffect(() => {
    if (isAuthenticated) {
      try {
        getAllUsers({
          page,
          limit,
          role,
          status,
        });
      } catch (error) {
        // Silently handle any errors from lazy query in Strict Mode
        console.debug(
          "Lazy query error (likely from React Strict Mode):",
          error,
        );
      }
    }
  }, [page, limit, roleFilter, statusFilter, isAuthenticated, getAllUsers]);

  // Manual refetch function
  const refetchUsers = () => {
    if (isAuthenticated) {
      try {
        getAllUsers({
          page,
          limit,
          role,
          status,
        });
      } catch (error) {
        // Silently handle any errors from lazy query
        console.debug("Lazy query refetch error, error);
      }
    }
  };

  // Fetch wards for form dropdowns using RTK Query
  const {
    data,
    isLoading,
    error,
  } = useGetWardsQuery();

  // Extract wards data from the API response
  const wards = wardsResponse?.data || [];

  // Mutations
  const [activateUser] = useActivateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const users = usersResponse?.data?.users || [];
  const pagination = usersResponse?.data?.pagination;
  const stats = statsResponse?.data;

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMINISTRATOR":
        return "bg-red-100 text-red-800";
      case "WARD_OFFICER":
        return "bg-blue-100 text-blue-800";
      case "MAINTENANCE_TEAM":
        return "bg-green-100 text-green-800";
      case "CITIZEN":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "ADMINISTRATOR":
        return ;
      case "WARD_OFFICER":
        return ;
      case "MAINTENANCE_TEAM":
        return ;
      case "CITIZEN":
        return ;
      default:
        return ;
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await activateUser(userId).unwrap();
      toast({
        title,
        description: "User activated successfully",
      });
      refetchUsers();
    } catch (error) {
      toast({
        title,
        description: error?.data?.message || "Failed to activate user",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateUser = async (userId) => {
    try {
      await deactivateUser(userId).unwrap();
      toast({
        title,
        description: "User deactivated successfully",
      });
      refetchUsers();
    } catch (error) {
      toast({
        title,
        description: error?.data?.message || "Failed to deactivate user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(userId).unwrap();
        toast({
          title,
          description: "User deleted successfully",
        });
        refetchUsers();
      } catch (error) {
        toast({
          title,
          description: error?.data?.message || "Failed to delete user",
          variant: "destructive",
        });
      }
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPage(1);
    // Update URL parameters
    setSearchParams({});
  };

  // Handle filter changes and update URL
  const handleRoleFilterChange = (role) => {
    setRoleFilter(role);
    const newParams = new URLSearchParams(searchParams);
    if (role == "all") {
      newParams.set("role", role);
    } else {
      newParams.delete("role");
    }
    setSearchParams(newParams);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    const newParams = new URLSearchParams(searchParams);
    if (status == "all") {
      newParams.set("status", status);
    } else {
      newParams.delete("status");
    }
    setSearchParams(newParams);
  };

  // Form handlers
  const handleOpenAddDialog = () => {
    setFormData({
      fullName,
      email: "",
      phoneNumber: "",
      role: "CITIZEN",
      wardId: "",
      department: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (user) => {
    setEditingUser(user);
    setFormData({
      fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      role: user.role,
      wardId: user.wardId || "",
      department: user.department || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingUser(null);
    setFormData({
      fullName,
      email: "",
      phoneNumber: "",
      role: "CITIZEN",
      wardId: "",
      department: "",
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Update user
        await updateUser({
          id,
          data,
        }).unwrap();
        toast({
          title,
          description: "User updated successfully",
        });
      } else {
        // Create user
        await createUser(formData).unwrap();
        toast({
          title,
          description: "User created successfully",
        });
      }

      handleCloseDialogs();
      refetchUsers();
    } catch (error) {
      toast({
        title,
        description:
          error?.data?.message ||
          `Failed to ${editingUser ? "update" : "create"} user`,
        variant: "destructive",
      });
    }
  };

  // Filter users locally based on search term
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (usersError || statsError) {
    return (
      
        
          
            
            
              Error Loading Data
            
            
              Failed to load user data. Please try again.
            
             refetchUsers()}>Retry
          
        
      
    );
  }

  return (
    
      {/* Header */}
      
        
          User Management
          Manage all users in the system
        
        
          
          Add New User
        
      

      {/* Stats Cards */}
      
        
          
            
              
                Total Users
                
                  {isLoadingStats ? (
                    
                  ) : (
                    stats?.totalUsers || 0
                  )}
                
              
              
            
          
        
        
          
            
              
                
                  Active Users
                
                
                  {isLoadingStats ? (
                    
                  ) : (
                    stats?.activeUsers || 0
                  )}
                
              
              
            
          
        
        
          
            
              
                Citizens
                
                  {isLoadingStats ? (
                    
                  ) : (
                    stats?.usersByRole?.find((role) => role.role === "CITIZEN")
                      ?._count || 0
                  )}
                
              
              
            
          
        
        
          
            
              
                
                  Ward Officers
                
                
                  {isLoadingStats ? (
                    
                  ) : (
                    stats?.usersByRole?.find(
                      (role) => role.role === "WARD_OFFICER",
                    )?._count || 0
                  )}
                
              
              
            
          
        
        
          
            
              
                Maintenance
                
                  {isLoadingStats ? (
                    
                  ) : (
                    stats?.usersByRole?.find(
                      (role) => role.role === "MAINTENANCE_TEAM",
                    )?._count || 0
                  )}
                
              
              
            
          
        
      

      {/* Filters */}
      
        
          
            
              
               setSearchTerm(e.target.value)}
                className="pl-10"
              />
            
            
              
                
              
              
                All Roles
                Citizens
                Ward Officers
                
                  Maintenance Team
                
                Administrators
              
            
            
              
                
              
              
                All Status
                Active
                Inactive
              
            
            
              Reset Filters
            
          
        
      

      {/* Users Table */}
      
        
          
            
            Users ({pagination?.total || 0})
          
        
        
          {isLoadingUsers ? (
            
              
              Loading users...
            
          ) : (
            
              
                
                  User
                  Role
                  Ward
                  Status
                  Complaints
                  Actions
                
              
              
                {filteredUsers.map((user) => (
                  
                    
                      
                        {user.fullName}
                        {user.email}
                        {user.phoneNumber && (
                          
                            {user.phoneNumber}
                          
                        )}
                      
                    
                    
                      
                        
                          {getRoleIcon(user.role)}
                          
                            {user.role.replace("_", " ")}
                          
                        
                      
                    
                    
                      {user.ward?.name || "No ward assigned"}
                    
                    
                      
                        {user.isActive ? "Active" : "Inactive"}
                      
                    
                    
                      
                        
                          Submitted: {user._count?.submittedComplaints || 0}
                        
                        Assigned: {user._count?.assignedComplaints || 0}
                      
                    
                    
                      
                         handleOpenEditDialog(user)}
                        >
                          
                        
                        {user.isActive ? (
                           handleDeactivateUser(user.id)}
                          >
                            Deactivate
                          
                        ) : (
                           handleActivateUser(user.id)}
                          >
                            Activate
                          
                        )}
                         handleDeleteUser(user.id)}
                        >
                          
                        
                      
                    
                  
                ))}
              
            
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            
              
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} entries
              
              
                 setPage(page - 1)}
                  disabled={page 
                  Previous
                
                 setPage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                
              
            
          )}
        
      

      {/* Quick Actions */}
      
        
          User Management Actions
        
        
          
            
              Export Users
            
            
              Bulk Import
            
            
              User Reports
            
            
              Access Logs
            
          
        
      

      {/* Add User Dialog */}
      
        
          
            Add New User
            
              Create a new user account in the system.
            
          
          
            
              Full Name
              
                  setFormData({ ...formData, fullName)
                }
                placeholder="Enter full name"
                required
              />
            
            
              Email
              
                  setFormData({ ...formData, email)
                }
                placeholder="Enter email address"
                required
              />
            
            
              Phone Number
              
                  setFormData({ ...formData, phoneNumber)
                }
                placeholder="Enter phone number"
              />
            
            
              Role
              
                  setFormData({ ...formData, role)
                }
              >
                
                  
                
                
                  Citizen
                  Ward Officer
                  
                    Maintenance Team
                  
                  Administrator
                
              
            
            
              Ward
              
                  setFormData({
                    ...formData,
                    wardId === "none" ? "" ,
                  })
                }
              >
                
                  
                
                
                  No ward assigned
                  {wards.map((ward) => (
                    
                      {ward.name}
                    
                  ))}
                
              
            
            
              Department
              
                  setFormData({ ...formData, department)
                }
                placeholder="Enter department (optional)"
              />
            
            
              
                Cancel
              
              
                {isCreating ? (
                  
                    
                    Creating...
                  
                ) : (
                  "Create User"
                )}
              
            
          
        
      

      {/* Edit User Dialog */}
      
        
          
            Edit User
            Update user information.
          
          
            
              Full Name
              
                  setFormData({ ...formData, fullName)
                }
                placeholder="Enter full name"
                required
              />
            
            
              Email
              
                  setFormData({ ...formData, email)
                }
                placeholder="Enter email address"
                required
              />
            
            
              Phone Number
              
                  setFormData({ ...formData, phoneNumber)
                }
                placeholder="Enter phone number"
              />
            
            
              Role
              
                  setFormData({ ...formData, role)
                }
              >
                
                  
                
                
                  Citizen
                  Ward Officer
                  
                    Maintenance Team
                  
                  Administrator
                
              
            
            
              Ward
              
                  setFormData({
                    ...formData,
                    wardId === "none" ? "" ,
                  })
                }
              >
                
                  
                
                
                  No ward assigned
                  {wards.map((ward) => (
                    
                      {ward.name}
                    
                  ))}
                
              
            
            
              Department
              
                  setFormData({ ...formData, department)
                }
                placeholder="Enter department (optional)"
              />
            
            
              
                Cancel
              
              
                {isUpdating ? (
                  
                    
                    Updating...
                  
                ) : (
                  "Update User"
                )}
              
            
          
        
      
    
  );
};

export default AdminUsers;
