import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import {
  X,
  FileText,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  Download,
  Copy,
  ExternalLink,
} from "lucide-react";



const ComplaintDetailsModal: React.FC = ({
  isOpen,
  onClose,
  complaint,
  user,
}) => {
  if (complaint) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "REGISTERED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "RESOLVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CLOSED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "REGISTERED":
        return ;
      case "ASSIGNED":
        return ;
      case "IN_PROGRESS":
        return ;
      case "RESOLVED":
      case "CLOSED":
        return ;
      default:
        return ;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
  };

  const downloadComplaintDetails = () => {
    const content = `
Complaint Details
=================
Complaint ID: ${complaint.id}
Type: ${complaint.type}
Status: ${complaint.status}
Priority: ${complaint.priority}
Description: ${complaint.description}
Location: ${complaint.area}
Address: ${complaint.address || "N/A"}
Ward: ${complaint.ward || "N/A"}
Submitted On: ${new Date(complaint.submittedOn).toLocaleString()}
${complaint.assignedOn ? `Assigned On: ${new Date(complaint.assignedOn).toLocaleString()}` : ""}
${complaint.resolvedOn ? `Resolved On: ${new Date(complaint.resolvedOn).toLocaleString()}` : ""}

Contact Information
==================
Name: ${user.name}
Email: ${user.email}
Phone: ${user.phone || "N/A"}
    `;

    const blob = new Blob([content], { type);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complaint-${complaint.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (Complaint Details
                
                ID)}
              >
                
              
            
          
        

        
          {/* Status Overview */}
          
            
              
                
                  
                    {getStatusIcon(complaint.status)}
                    {complaint.status.replace("_", " ")}
                  
                  
                    {complaint.priority} Priority
                  
                
                
                  
                    Estimated Resolution
                  
                  
                    {complaint.estimatedResolution}
                  
                
              
            
          

          
            {/* Complaint Information */}
            
              
                
                  
                  Complaint Information
                
                
                  
                    
                      Type
                    
                    {complaint.type}
                  
                  
                    
                      Description
                    
                    
                      {complaint.description}
                    
                  
                  
                    
                      
                      Location
                    
                    {complaint.area}
                    {complaint.address && (
                      
                        {complaint.address}
                      
                    )}
                    {complaint.landmark && (Landmark)}
                  
                  {complaint.ward && (
                    
                      
                        Ward
                      
                      {complaint.ward}
                    
                  )}
                
              
            

            {/* Contact Information */}
            
              
                
                  
                  Contact Information
                
                
                  
                    
                      Name
                    
                    {user.name}
                  
                  
                    
                      
                      Email
                    
                    {user.email}
                  
                  {user.phone && (
                    
                      
                        
                        Phone
                      
                      {user.phone}
                    
                  )}
                  {complaint.assignedTo && (
                    
                      
                        Assigned To
                      
                      
                        {complaint.assignedTo.name}
                      
                      
                        {complaint.assignedTo.role}
                      
                    
                  )}
                
              
            
          

          {/* Timeline */}
          
            
              
                
                Status Timeline
              
              
                {/* Registered */}
                
                  
                    
                  
                  
                    
                      
                        Complaint Registered
                      
                      
                        {new Date(complaint.submittedOn).toLocaleDateString()}
                      
                    
                    
                      Your complaint has been successfully registered in our
                      system.
                    
                  
                

                {/* Assigned */}
                
                  
                    
                  
                  
                    
                      
                        Complaint Assigned
                      
                      {complaint.assignedOn && (
                        
                          {new Date(complaint.assignedOn).toLocaleDateString()}
                        
                      )}
                    
                    
                      {complaint.assignedOn
                        ? "Assigned to the appropriate team for resolution."
                        : "Waiting to be assigned to a team member."}
                    
                  
                

                {/* In Progress */}
                
                  
                    
                  
                  
                    
                      
                        Work in Progress
                      
                    
                    
                      {["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(
                        complaint.status,
                      )
                        ? "Our team is actively working on resolving your complaint."
                        : "Work will begin once the complaint is assigned."}
                    
                  
                

                {/* Resolved */}
                
                  
                    
                  
                  
                    
                      
                        Complaint Resolved
                      
                      {complaint.resolvedOn && (
                        
                          {new Date(complaint.resolvedOn).toLocaleDateString()}
                        
                      )}
                    
                    
                      {complaint.resolvedOn
                        ? "Your complaint has been successfully resolved."
                        : "Your complaint will be marked once the work is completed."}
                    
                  
                
              
            
          

          {/* Attachments */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            
              
                Attachments
                
                  {complaint.attachments.map(
                    (attachment, index) => (
                      
                        
                        
                          
                            {attachment.filename || `Attachment ${index + 1}`}
                          
                          
                            {attachment.size
                              ? `${(attachment.size / 1024).toFixed(1)} KB`
                              : ""}
                          
                        
                        
                          
                        
                      
                    ),
                  )}
                
              
            
          )}

          {/* Action Buttons */}
          
            
              Need help? Contact support at{" "}
              
                support@cochinsmartcity.in
              
            
            
              
                
                Download
              
              Close
            
          
        
      
    
  );
};

export default ComplaintDetailsModal;
