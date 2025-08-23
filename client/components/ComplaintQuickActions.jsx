import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import ComplaintStatusUpdate from "./ComplaintStatusUpdate";
import {
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  MapPin,
} from "lucide-react";

 | null;
  };
  userRole;
  showDetails?;
  onUpdate: () => void;
  onShowUpdateModal: (complaint) => void;
}

const ComplaintQuickActions: React.FC = ({
  complaint,
  userRole,
  showDetails = true,
  onUpdate,
  onShowUpdateModal,
}) => {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

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

  const canManageComplaint =
    userRole === "WARD_OFFICER" || userRole === "ADMINISTRATOR";
  const canAssign = userRole === "WARD_OFFICER" || userRole === "ADMINISTRATOR";

  return (
    
      
        {/* Quick Status Indicator */}
        {showDetails && (
          
            
              {complaint.status.replace("_", " ")}
            
            
              {complaint.priority}
            
          
        )}

        {/* Quick Actions */}
        
          {/* View Details */}
          
            
              
            
          

          {/* Quick Status Change Buttons for Ward Officers */}
          {canManageComplaint && (
            
              {complaint.status === "REGISTERED" && (
                 setAssignDialogOpen(true)}
                  title="Assign Complaint"
                  className="text-blue-600 hover:text-blue-700"
                >
                  
                
              )}

              {complaint.status === "ASSIGNED" && (
                 setStatusDialogOpen(true)}
                  title="Start Progress"
                  className="text-orange-600 hover:text-orange-700"
                >
                  
                
              )}

              {complaint.status === "IN_PROGRESS" && (
                 setStatusDialogOpen(true)}
                  title="Mark Resolved"
                  className="text-green-600 hover:text-green-700"
                >
                  
                
              )}
            
          )}

          {/* More Actions Dropdown */}
          {canManageComplaint && (
            
              
                
                  
                
              
              
                {onShowUpdateModal && (
                  
                     onShowUpdateModal(complaint)}
                    >
                      
                      Update Complaint
                    
                    
                  
                )}

                 setStatusDialogOpen(true)}>
                  
                  Quick Status Update
                

                {canAssign && (
                   setAssignDialogOpen(true)}>
                    
                    Quick Reassign
                  
                )}

                

                
                  
                    
                    View Full Details
                  
                
              
            
          )}
        
      

      {/* Status Update Dialog */}
       setStatusDialogOpen(false)}
        onSuccess={() => {
          setStatusDialogOpen(false);
          onUpdate?.();
        }}
        mode="status"
      />

      {/* Assignment Dialog */}
       setAssignDialogOpen(false)}
        onSuccess={() => {
          setAssignDialogOpen(false);
          onUpdate?.();
        }}
        mode="assign"
      />
    
  );
};

export default ComplaintQuickActions;
