import React, { useState, useEffect } from "react";
import { useAppSelector } from "../store/hooks";
import {
  useUpdateComplaintMutation,
  useGetWardUsersQuery,
} from "../store/api/complaintsApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { toast } from "./ui/use-toast";
import {
  Search,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Settings,
} from "lucide-react";





const UpdateComplaintModal: React.FC = ({
  complaint,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    status,
    priority: "",
    assignedToId: "",
    remarks: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  // Get users based on current user role
  const getUsersFilter = () => {
    if (user?.role === "ADMINISTRATOR") {
      return { role: "WARD_OFFICER" };
    } else if (user?.role === "WARD_OFFICER") {
      return { role: "MAINTENANCE_TEAM" };
    }
    return {};
  };

  const {
    data,
    isLoading,
    error,
  } = useGetWardUsersQuery({
    page,
    limit,
    ...getUsersFilter(),
  });

  const [updateComplaint, { isLoading: isUpdating }] =
    useUpdateComplaintMutation();

  const availableUsers = usersResponse?.data?.users || [];

  // Filter users based on search term
  const filteredUsers = availableUsers.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    if (complaint && isOpen) {
      setFormData({
        status,
        priority: complaint.priority,
        assignedToId:
          typeof complaint.assignedTo === "object" && complaint.assignedTo?.id
            ? complaint.assignedTo.id
            : complaint.assignedTo || "none",
        remarks: "",
      });
      setSearchTerm("");
      setValidationErrors([]);
    }
  }, [complaint, isOpen]);

  const validateForm = () => {
    const errors = [];

    // Check if status is being changed to ASSIGNED but no user is selected
    if (
      formData.status === "ASSIGNED" &&
      (formData.assignedToId || formData.assignedToId === "none")
    ) {
      if (user?.role === "ADMINISTRATOR") {
        errors.push(
          "Please select a Ward Officer before assigning the complaint.",
        );
      } else if (user?.role === "WARD_OFFICER") {
        errors.push(
          "Please select a Maintenance Team member before assigning the complaint.",
        );
      }
    }

    // Check if status is being changed from REGISTERED to ASSIGNED
    if (
      complaint?.status === "REGISTERED" &&
      formData.status === "ASSIGNED" &&
      (formData.assignedToId || formData.assignedToId === "none")
    ) {
      if (user?.role === "ADMINISTRATOR") {
        errors.push(
          "Please select a Ward Officer before assigning the complaint.",
        );
      } else if (user?.role === "WARD_OFFICER") {
        errors.push(
          "Please select a Maintenance Team member before assigning the complaint.",
        );
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (complaint) return;

    if (validateForm()) {
      return;
    }

    try {
      const updateData = {
        status: formData.status,
        priority: formData.priority,
      };

      // Only include assignedToId if it's provided and not "none"
      if (formData.assignedToId && formData.assignedToId == "none") {
        updateData.assignedToId = formData.assignedToId;
      }

      // Only include remarks if provided
      if (formData.remarks.trim()) {
        updateData.remarks = formData.remarks.trim();
      }

      await updateComplaint({
        id,
        ...updateData,
      }).unwrap();

      toast({
        title,
        description: "Complaint updated successfully",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating complaint, error);
      toast({
        title,
        description: error?.data?.message || "Failed to update complaint",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFormData({
      status,
      priority: "",
      assignedToId: "none",
      remarks: "",
    });
    setSearchTerm("");
    setValidationErrors([]);
    onClose();
  };

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

  const getUserRoleIcon = (role) => {
    switch (role) {
      case "WARD_OFFICER":
        return ;
      case "MAINTENANCE_TEAM":
        return ;
      case "ADMINISTRATOR":
        return ;
      default:
        return ;
    }
  };

  const getDropdownLabel = () => {
    if (user?.role === "ADMINISTRATOR") {
      return "Select Ward Officer";
    } else if (user?.role === "WARD_OFFICER") {
      return "Select Maintenance Team Member";
    }
    return "Select User";
  };

  if (complaint) {
    return null;
  }

  return (
    
      
        
          
            
            Update Complaint
          
          
            Update the status and assignment of complaint #
            {complaint.complaintId || complaint.id.slice(-6)}
          
        

        
          {/* Complaint Summary */}
          
            Complaint Summary
            
              
                Type:{" "}
                {complaint.type.replace("_", " ")}
              
              
                Area: {complaint.area}
              
              
                Current Status:
                
                  {complaint.status.replace("_", " ")}
                
              
              
                Current Priority:
                
                  {complaint.priority}
                
              
            
            
              Description:
              {complaint.description}
            
          

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            
              
                
                Validation Errors
              
              
                {validationErrors.map((error, index) => (
                  
                    {error}
                  
                ))}
              
            
          )}

          {/* Status Update */}
          
            
              Status
               {
                  setFormData((prev) => ({ ...prev, status));
                  // Clear validation errors when user makes changes
                  setValidationErrors([]);
                }}
              >
                
                  
                
                
                  
                    
                      
                      Registered
                    
                  
                  
                    
                      
                      Assigned
                    
                  
                  
                    
                      
                      In Progress
                    
                  
                  
                    
                      
                      Resolved
                    
                  
                  
                    
                      
                      Closed
                    
                  
                
              
            

            
              Priority
              
                  setFormData((prev) => ({ ...prev, priority))
                }
              >
                
                  
                
                
                  Low
                  Medium
                  High
                  Critical
                
              
            
          

          {/* Assignment Section */}
          
            {getDropdownLabel()}
            
              {/* Search Box */}
              
                
                 setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              

              {/* User Selection */}
               {
                  setFormData((prev) => ({ ...prev, assignedToId));
                  // Clear validation errors when user makes a selection
                  setValidationErrors([]);
                }}
              >
                
                  
                
                
                  
                    
                      
                      No Assignment
                    
                  
                  {filteredUsers.map((user) => (
                    
                      
                        
                          {getUserRoleIcon(user.role)}
                          
                            {user.fullName}
                            
                              {user.email}
                            
                            {user.ward && (
                              
                                {user.ward.name}
                              
                            )}
                          
                        
                        
                          {user.role.replace("_", " ")}
                        
                      
                    
                  ))}
                  {filteredUsers.length === 0 && searchTerm && (
                    
                      No users found matching "{searchTerm}"
                    
                  )}
                
              

              {isLoadingUsers && (
                Loading users...
              )}

              {usersError && (
                
                  Error loading users. Please try again.
                
              )}
            
          

          {/* Remarks */}
          
            Remarks (Optional)
            
                setFormData((prev) => ({ ...prev, remarks))
              }
              rows={3}
            />
          

          
            
              Cancel
            
            
              {isUpdating ? "Updating..." : "Update Complaint"}
            
          
        
      
    
  );
};

export default UpdateComplaintModal;
