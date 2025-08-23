import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintQuery } from "../store/api/complaintsApi";
import { useDataManager } from "../hooks/useDataManager";
import ComplaintFeedbackDialog from "../components/ComplaintFeedbackDialog";
import ComplaintStatusUpdate from "../components/ComplaintStatusUpdate";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  FileText,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  ArrowLeft,
  MessageSquare,
  Image,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";

const ComplaintDetails: React.FC = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  // Data management hooks
  const { cacheComplaintDetails, getComplaintDetails } = useDataManager();

  // Use RTK Query to fetch complaint details
  const {
    data,
    isLoading,
    error,
  } = useGetComplaintQuery(id, { skip);

  const complaint = complaintResponse?.data?.complaint;

  // Cache complaint details when loaded
  useEffect(() => {
    if (complaint && id) {
      cacheComplaintDetails(id, complaint);
    }
  }, [complaint, id, cacheComplaintDetails]);

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

  const handleExportDetails = () => {
    if (complaint) {
      console.error("No complaint data available for export");
      return;
    }

    try {
      // Get current translations for the user's language
      const t = translations || {};

      // Create PDF document
      const doc = new jsPDF();
      let yPosition = 20;
      const lineHeight = 10;
      const sectionSpacing = 5;

      // Helper function to add text with word wrapping
      const addText = (text, fontSize = 10, isBold = false) => {
        if (isBold) {
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFont("helvetica", "normal");
        }
        doc.setFontSize(fontSize);

        // Simple word wrapping for long text
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;
        const lines = doc.splitTextToSize(text, maxWidth);

        lines.forEach((line) => {
          if (yPosition > 280) {
            // Check if we need a new page
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });

        return yPosition;
      };

      // Header
      addText(t.common?.export || "Export Details", 16, true);
      yPosition += sectionSpacing;

      // Complaint Information Section
      yPosition += sectionSpacing;
      addText(t.complaints?.complaintId || "Complaint ID", 12, true);
      addText(complaint.complaintId || complaint.id);
      yPosition += sectionSpacing;

      if (complaint.type) {
        addText(t.complaints?.complaintType || "Complaint Type", 12, true);
        addText(complaint.type);
        yPosition += sectionSpacing;
      }

      if (complaint.title) {
        addText(t.complaints?.title || "Title", 12, true);
        addText(complaint.title);
        yPosition += sectionSpacing;
      }

      if (complaint.description) {
        addText(t.complaints?.description || "Description", 12, true);
        addText(complaint.description);
        yPosition += sectionSpacing;
      }

      if (complaint.status) {
        addText(t.complaints?.status || "Status", 12, true);
        // Translate status if available
        const statusKey =
          complaint.status.toLowerCase() typeof t.complaints;
        const translatedStatus = t.complaints?.[statusKey] || complaint.status;
        addText(translatedStatus);
        yPosition += sectionSpacing;
      }

      if (complaint.priority) {
        addText(t.complaints?.priority || "Priority", 12, true);
        // Translate priority if available
        const priorityKey =
          complaint.priority.toLowerCase() typeof t.complaints;
        const translatedPriority =
          t.complaints?.[priorityKey] || complaint.priority;
        addText(translatedPriority);
        yPosition += sectionSpacing;
      }

      // Location Information
      yPosition += sectionSpacing;
      addText(t.complaints?.locationDetails || "Location Details", 14, true);
      yPosition += sectionSpacing;

      if (complaint.ward?.name) {
        addText(t.complaints?.ward || "Ward", 12, true);
        addText(complaint.ward.name);
        yPosition += sectionSpacing;
      }

      if (complaint.area) {
        addText(t.complaints?.area || "Area", 12, true);
        addText(complaint.area);
        yPosition += sectionSpacing;
      }

      if (complaint.location) {
        addText(t.complaints?.location || "Location", 12, true);
        addText(complaint.location);
        yPosition += sectionSpacing;
      }

      if (complaint.address) {
        addText(t.complaints?.address || "Address", 12, true);
        addText(complaint.address);
        yPosition += sectionSpacing;
      }

      // Contact Information
      yPosition += sectionSpacing;
      addText(t.forms?.contactInformation || "Contact Information", 14, true);
      yPosition += sectionSpacing;

      if (complaint.submittedBy?.fullName) {
        addText(t.complaints?.submittedBy || "Submitted By", 12, true);
        addText(complaint.submittedBy.fullName);
        yPosition += sectionSpacing;
      }

      if (complaint.mobile) {
        addText(t.complaints?.mobile || "Mobile", 12, true);
        addText(complaint.mobile);
        yPosition += sectionSpacing;
      }

      if (complaint.email) {
        addText(t.auth?.email || "Email", 12, true);
        addText(complaint.email);
        yPosition += sectionSpacing;
      }

      // Dates
      yPosition += sectionSpacing;
      addText(t.common?.dates || "Important Dates", 14, true);
      yPosition += sectionSpacing;

      if (complaint.submittedOn) {
        addText(t.complaints?.submittedDate || "Submitted Date", 12, true);
        addText(new Date(complaint.submittedOn).toLocaleDateString());
        yPosition += sectionSpacing;
      }

      if (complaint.lastUpdated) {
        addText(t.complaints?.lastUpdated || "Last Updated", 12, true);
        addText(new Date(complaint.lastUpdated).toLocaleDateString());
        yPosition += sectionSpacing;
      }

      if (complaint.resolvedDate) {
        addText(t.complaints?.resolvedDate || "Resolved Date", 12, true);
        addText(new Date(complaint.resolvedDate).toLocaleDateString());
        yPosition += sectionSpacing;
      }

      // Assignment Information
      if (complaint.assignedTo?.fullName) {
        yPosition += sectionSpacing;
        addText(t.complaints?.assignedTo || "Assigned To", 12, true);
        addText(complaint.assignedTo.fullName);
        yPosition += sectionSpacing;
      }

      // Remarks and Feedback
      if (complaint.remarks) {
        yPosition += sectionSpacing;
        addText(t.complaints?.remarks || "Remarks", 12, true);
        addText(complaint.remarks);
        yPosition += sectionSpacing;
      }

      if (complaint.feedback) {
        yPosition += sectionSpacing;
        addText(t.complaints?.feedback || "Feedback", 12, true);
        addText(complaint.feedback);
        yPosition += sectionSpacing;
      }

      if (complaint.rating) {
        yPosition += sectionSpacing;
        addText(t.complaints?.rating || "Rating", 12, true);
        addText(`${complaint.rating}/5`);
        yPosition += sectionSpacing;
      }

      // Attachments
      if (complaint.attachments && complaint.attachments.length > 0) {
        yPosition += sectionSpacing;
        addText(t.complaints?.attachments || "Attachments", 14, true);
        yPosition += sectionSpacing;

        complaint.attachments.forEach((attachment, index) => {
          addText(
            `${index + 1}. ${attachment.originalName || attachment.fileName}`,
          );
        });
        yPosition += sectionSpacing;
      }

      // Footer with export information
      yPosition += sectionSpacing * 2;
      addText(`${t.common?.export || "Exported"}).toLocaleString()}`,
        8,
      );
      if (user?.fullName) {
        addText(`${t.common?.by || "By"}, 8);
      }

      // Save PDF
      const fileName = `complaint-${complaint.complaintId || complaint.id}-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      console.log("Complaint details exported successfully");
    } catch (error) {
      console.error("Failed to export complaint details, error);
    }
  };

  if (isLoading) {
    return (
      
        
          
          
          
            
              
            
            
              
              
            
          
        
      
    );
  }

  if (error) {
    return (
      
        
        
          Error Loading Complaint
        
        
          Failed to load complaint details. Please try again.
        
        
          
            
            Back to Complaints
          
        
      
    );
  }

  if (complaint) {
    return (
      
        
        
          Complaint Not Found
        
        
          The complaint you're looking for doesn't exist.
        
        
          
            
            Back to Complaints
          
        
      
    );
  }

  return (
    
      {/* Header */}
      
        
          
            
              
                
                Back
              
            
            
              Complaint #
              {complaint?.complaintId || complaint?.id?.slice(-6) || "Unknown"}
            
          
          
            
              {complaint?.status?.replace("_", " ") || "Unknown"}
            
            
              {complaint?.priority || "Unknown"} Priority
            
            
              Created{" "}
              {complaint?.submittedOn
                ? new Date(complaint.submittedOn).toLocaleDateString()
                : "Unknown"}
            
          
        
      

      {/* Main Content */}
      
        {/* Left Column - Main Details */}
        
          {/* Complaint Details */}
          
            
              
                
                Complaint Details
              
            
            
              
                Type
                
                  {complaint?.type?.replace("_", " ") || "Unknown Type"}
                
              
              
                Description
                
                  {complaint?.description || "No description available"}
                
              
              
                
                  
                    
                    Location
                  
                  {complaint.area}
                  {complaint.landmark && (Near)}
                
                
                  
                    
                    Timeline
                  
                  
                    
                      Submitted:{" "}
                      {new Date(complaint.submittedOn).toLocaleString()}
                    
                    {complaint.assignedOn && (Assigned).toLocaleString()}
                      
                    )}
                    {complaint.resolvedOn && (Resolved).toLocaleString()}
                      
                    )}
                  
                
              
            
          

          {/* Status Updates / Comments */}
          
            
              
                
                {user?.role === "CITIZEN"
                  ? "Status Updates"
                  : "Status Updates & Comments"}
              
            
            
              
                {/* Real status logs with remarks and comments */}
                {complaint.statusLogs && complaint.statusLogs.length > 0 ? (
                  complaint.statusLogs.map((log, index) => {
                    const getStatusColor = (status) => {
                      switch (status) {
                        case "REGISTERED":
                          return "border-blue-500";
                        case "ASSIGNED":
                          return "border-yellow-500";
                        case "IN_PROGRESS":
                          return "border-orange-500";
                        case "RESOLVED":
                          return "border-green-500";
                        case "CLOSED":
                          return "border-gray-500";
                        default:
                          return "border-gray-400";
                      }
                    };

                    const getStatusLabel = (status) => {
                      switch (status) {
                        case "REGISTERED":
                          return "Complaint Registered";
                        case "ASSIGNED":
                          return "Complaint Assigned";
                        case "IN_PROGRESS":
                          return "Work in Progress";
                        case "RESOLVED":
                          return "Complaint Resolved";
                        case "CLOSED":
                          return "Complaint Closed";
                        default:
                          return `Status: ${status}`;
                      }
                    };

                    // Get citizen-friendly status messages
                    const getCitizenStatusMessage = (status, log) => {
                      switch (status) {
                        case "REGISTERED":
                          return "Your complaint has been successfully registered and is under review.";
                        case "ASSIGNED":
                          return "Your complaint has been assigned to our maintenance team for resolution.";
                        case "IN_PROGRESS":
                          return "Our team is actively working on resolving your complaint.";
                        case "RESOLVED":
                          return "Your complaint has been resolved. Please verify and provide feedback.";
                        case "CLOSED":
                          return "Your complaint has been completed and closed.";
                        default:
                          return `Your complaint status has been updated to ${status.toLowerCase().replace("_", " ")}.`;
                      }
                    };

                    // Check if user is a citizen
                    const isCitizen = user?.role === "CITIZEN";

                    return (
                      
                        
                          
                            
                              
                                {getStatusLabel(log.toStatus)}
                              
                              {/* Show staff details only to non-citizens */}
                              {isCitizen && log.user && (
                                
                                  {log.user.fullName} ({log.user.role})
                                
                              )}
                            

                            {/* Show appropriate message based on user role */}
                            {isCitizen ? (
                              
                                {getCitizenStatusMessage(log.toStatus, log)}
                              
                            ) : ({log.comment && (
                                  
                                    Remarks)}
                              
                            )}

                            {log.fromStatus && (
                              
                                Status changed from{" "}
                                
                                  {log.fromStatus}
                                {" "}
                                to{" "}
                                
                                  {log.toStatus}
                                
                              
                            )}
                          
                          
                            {new Date(log.timestamp).toLocaleString()}
                          
                        
                      
                    );
                  })
                ) : ({user?.role === "CITIZEN"
                        ? "No updates available for your complaint yet"
                        )}
              
            
          

          {/* General Remarks - Hidden from citizens may contain internal notes */}
          {complaint.remarks && user?.role == "CITIZEN" && (
            
              
                
                  
                  General Remarks
                
              
              
                
                  
                    {complaint.remarks}
                  
                
              
            
          )}
        

        {/* Right Column - Contact & Meta Info */}
        
          {/* Contact Information */}
          
            
              
                
                Contact Information
              
            
            
              {complaint.contactName && (
                
                  
                  {complaint.contactName}
                
              )}
              
                
                {complaint.contactPhone}
              
              {complaint.contactEmail && (
                
                  
                  {complaint.contactEmail}
                
              )}
            
          

          {/* Assignment Information */}
          {complaint.assignedTo && (Assignment Info
              
              
                
                  Assigned To
                  
                    {typeof complaint.assignedTo === "object" &&
                    complaint.assignedTo
                      ? complaint.assignedTo.fullName
                      ).toLocaleDateString()}
                    
                  
                )}
              
            
          )}

          {/* Attachments */}
          
            
              
                
                Attachments ({complaint?.attachments?.length || 0})
              
            
            
              {complaint?.attachments && complaint.attachments.length > 0 ? (
                
                  {complaint.attachments.map((attachment) => (
                    
                      
                        {attachment.mimeType?.startsWith("image/") ? (
                          
                        ) : (
                          
                        )}
                        
                          
                            {attachment.originalName}
                          
                          
                            {(attachment.size / 1024).toFixed(1)} KB •{" "}
                            {new Date(
                              attachment.uploadedAt,
                            ).toLocaleDateString()}
                          
                        
                      
                      
                         window.open(attachment.url, "_blank")}
                        >
                          
                        
                        {attachment.mimeType?.startsWith("image/") && (
                          
                              window.open(attachment.url, "_blank")
                            }
                          >
                            View
                          
                        )}
                      
                    
                  ))}
                
              ) : (
                
                  
                  No attachments
                
              )}
            
          

          {/* Quick Actions */}
          
            
              Quick Actions
            
            
              {/* Status update button for Ward Officers and Administrators */}
              {(user?.role === "WARD_OFFICER" ||
                user?.role === "ADMINISTRATOR") && (
                 setShowStatusDialog(true)}
                >
                  
                  Update Status
                
              )}

              {/* Show feedback button for resolved/closed complaints if user is the complainant */}
              {(complaint.status === "RESOLVED" ||
                complaint.status === "CLOSED") &&
                complaint.submittedById === user?.id &&
                complaint.rating && (
                   setShowFeedbackDialog(true)}
                  >
                    
                    Provide Feedback
                  
                )}

              
                
                Export Details
              
            
          
        
      

      {/* Status Update Dialog */}
       setShowStatusDialog(false)}
        onSuccess={() => {
          setShowStatusDialog(false);
          // The complaint data will be automatically updated by RTK Query
        }}
      />

      {/* Feedback Dialog */}
       setShowFeedbackDialog(false)}
        onSuccess={() => {
          // The complaint data will be automatically updated by RTK Query
          // due to invalidation tags
        }}
      />
    
  );
};

export default ComplaintDetails;
