import React, { useState } from "react";
import { useAppSelector } from "../store/hooks";
import {
  useUpdateComplaintStatusMutation,
  useAssignComplaintMutation,
} from "../store/api/complaintsApi";
import { useGetWardTeamMembersQuery } from "../store/api/wardApi";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { useToast } from "../hooks/use-toast";
import { AlertCircle, CheckCircle, Clock, User, UserCheck } from "lucide-react";

 | null;
  };
  isOpen;
  onClose: () => void;
  onSuccess: () => void;
  mode: "status" | "assign" | "both";
}

const COMPLAINT_STATUSES = [
  {
    value: "REGISTERED",
    label: "Registered",
    icon,
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "ASSIGNED",
    label: "Assigned",
    icon,
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    icon,
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "RESOLVED",
    label: "Resolved",
    icon,
    color: "bg-green-100 text-green-800",
  },
  {
    value: "CLOSED",
    label: "Closed",
    icon,
    color: "bg-gray-100 text-gray-800",
  },
];

const ComplaintStatusUpdate: React.FC = ({
  complaint,
  isOpen,
  onClose,
  onSuccess,
  mode = "both",
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [updateComplaintStatus, { isLoading: isUpdatingStatus }] =
    useUpdateComplaintStatusMutation();
  const [assignComplaint, { isLoading: isAssigning }] =
    useAssignComplaintMutation();

  const [formData, setFormData] = useState({
    status,
    assignedTo: complaint.assignedTo?.id || "unassigned",
    remarks: "",
  });

  const isLoading = isUpdatingStatus || isAssigning;

  // Fetch team members for the current ward
  const { data, isLoading: teamLoading } =
    useGetWardTeamMembersQuery(user?.wardId || "", {
      skip,
    });

  const teamMembers = teamResponse?.data?.teamMembers || [];

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (
        mode === "status" ||
        (mode === "both" && formData.status == complaint.status)
      ) {
        await updateComplaintStatus({
          id,
          status: formData.status,
          remarks: formData.remarks || undefined,
        }).unwrap();
      }

      if (
        mode === "assign" ||
        (mode === "both" &&
          formData.assignedTo == (complaint.assignedTo?.id || "unassigned"))
      ) {
        await assignComplaint({
          id,
          assignedTo:
            formData.assignedTo === "unassigned" ? "" : formData.assignedTo,
          remarks: formData.remarks || undefined,
        }).unwrap();
      }

      toast({
        title,
        description: "Complaint updated successfully",
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title,
        description: error?.data?.message || "Failed to update complaint",
        variant: "destructive",
      });
    }
  };

  const getStatusInfo = (status) => {
    return (
      COMPLAINT_STATUSES.find((s) => s.value === status) ||
      COMPLAINT_STATUSES[0]
    );
  };

  const currentStatusInfo = getStatusInfo(complaint.status);
  const newStatusInfo = getStatusInfo(formData.status);

  return (
    
      
        
          
            
            Update Complaint #{complaint.complaintId || complaint.id.slice(-6)}
          
          
            Update the status and assignment for this complaint
          
        

        
          {/* Complaint Summary */}
          
            Complaint Summary
            
              
                Type: {complaint.type.replace("_", " ")}
              
              
                Area: {complaint.area}
              
              
                Description: {complaint.description}
              
              
                
                  {currentStatusInfo.label}
                
                {complaint.assignedTo && (
                  
                    
                    {complaint.assignedTo.fullName}
                  
                )}
              
            
          

          {/* Status Update */}
          {(mode === "status" || mode === "both") && (
            
              Update Status
              
                  setFormData((prev) => ({ ...prev, status))
                }
              >
                
                  
                
                
                  {COMPLAINT_STATUSES.map((status) => (
                    
                      
                        
                        {status.label}
                      
                    
                  ))}
                
              

              {formData.status == complaint.status && (
                
                  Status will change from{" "}
                  {currentStatusInfo.label} to{" "}
                  {newStatusInfo.label}
                
              )}
            
          )}

          {/* Assignment */}
          {(mode === "assign" || mode === "both") && (
            
              Assign to Team Member
              
                  setFormData((prev) => ({ ...prev, assignedTo))
                }
              >
                
                  
                
                
                  Unassigned
                  {teamLoading ? (
                    
                      Loading team members...
                    
                  ) : (
                    teamMembers.map((member) => (
                      
                        
                          {member.displayName}
                          
                            ({member.activeAssignments} active)
                          
                        
                      
                    ))
                  )}
                
              
            
          )}

          {/* Remarks */}
          
            Remarks (Optional)
            
                setFormData((prev) => ({ ...prev, remarks))
              }
              placeholder="Add any comments about this update..."
              rows={3}
            />
          

          
            
              Cancel
            
            
              {isLoading ? "Updating..." : "Update Complaint"}
            
          
        
      
    
  );
};

export default ComplaintStatusUpdate;
