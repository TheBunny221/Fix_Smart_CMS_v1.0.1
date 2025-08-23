import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintsQuery } from "../store/api/complaintsApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import ComplaintQuickActions from "../components/ComplaintQuickActions";
import UpdateComplaintModal from "../components/UpdateComplaintModal";
import {
  MapPin,
  Users,
  BarChart3,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  Calendar,
} from "lucide-react";

const WardManagement: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("overview");

  // State for Update Complaint Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Fetch complaints for the ward officer
  const {
    data,
    isLoading,
    refetch,
  } = useGetComplaintsQuery({
    page,
    limit,
    wardId,
  });

  const complaints = Array.isArray(complaintsResponse?.data?.complaints)
    ? complaintsResponse.data.complaints
    : [];

  // Calculate real stats from complaint data
  const wardStats = {
    totalComplaints: complaints.length,
    resolved: complaints.filter(
      (c) => c.status === "RESOLVED" || c.status === "CLOSED",
    ).length,
    pending: complaints.filter(
      (c) =>
        c.status === "REGISTERED" ||
        c.status === "ASSIGNED" ||
        c.status === "IN_PROGRESS",
    ).length,
    inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    resolutionRate:
      complaints.length > 0
        ? Math.round(
            (complaints.filter(
              (c) => c.status === "RESOLVED" || c.status === "CLOSED",
            ).length /
              complaints.length) *
              100,
          )
        ,
  };

  // Group complaints by sub-zone if available
  const complaintsByArea = complaints.reduce((acc, complaint) => {
    const area = complaint.area || "Unknown Area";
    if (acc[area]) {
      acc[area] = {
        name,
        complaints,
        resolved,
        pending,
      };
    }
    acc[area].complaints++;
    if (complaint.status === "RESOLVED" || complaint.status === "CLOSED") {
      acc[area].resolved++;
    } else {
      acc[area].pending++;
    }
    return acc;
  }, {});

  const subZones = Object.values(complaintsByArea);

  // Priority complaints that need attention
  const priorityComplaints = complaints
    .filter(
      (c) =>
        c.priority === "HIGH" ||
        c.priority === "CRITICAL" ||
        c.status === "REGISTERED",
    )
    .slice(0, 10);

  if (complaintsLoading) {
    return (
      
        
          
          
          
            {[...Array(4)].map((_, i) => (
              
            ))}
          
        
      
    );
  }

  return (
    
      {/* Header */}
      
        
          Ward Management
          
            Overview and management of {user?.ward?.name || "your ward"}
          
        
        
           refetchComplaints()}>
            
            Refresh Data
          
          
            
              
              View All Complaints
            
          
        
      

      {/* Stats Overview */}
      
        
          
            
              
                
                  Total Complaints
                
                
                  {wardStats.totalComplaints}
                
              
              
            
          
        
        
          
            
              
                Resolved
                
                  {wardStats.resolved}
                
              
              
            
          
        
        
          
            
              
                Pending
                
                  {wardStats.pending}
                
              
              
            
          
        
        
          
            
              
                In Progress
                
                  {wardStats.inProgress}
                
              
              
            
          
        
      

      {/* Resolution Rate */}
      
        
          
            
            Ward Performance
          
        
        
          
            
              
                Resolution Rate
                {wardStats.resolutionRate}%
              
              
            
            
              
                2.3
                Avg. Resolution Days
              
              
                95%
                Citizen Satisfaction
              
              
                28
                Active Team Members
              
            
          
        
      

      {/* Tabbed Interface */}
      
        
          Overview
          Priority Complaints
          Areas
        

        
          
            {/* Resolution Rate */}
            
              
                
                  
                  Ward Performance
                
              
              
                
                  
                    
                      Resolution Rate
                      {wardStats.resolutionRate}%
                    
                    
                  
                  
                    
                      
                        {wardStats.totalComplaints}
                      
                      Total Complaints
                    
                    
                      
                        {wardStats.resolved}
                      
                      Resolved
                    
                    
                      
                        {wardStats.pending}
                      
                      Pending
                    
                  
                
              
            

            {/* Quick Actions */}
            
              
                
                  
                  Quick Actions
                
              
              
                
                  
                    
                      
                      New Complaints (
                      {
                        complaints.filter((c) => c.status === "REGISTERED")
                          .length
                      }
                      )
                    
                  
                  
                    
                      
                      In Progress ({wardStats.inProgress})
                    
                  
                  
                    
                      
                      High Priority (
                      {
                        complaints.filter(
                          (c) =>
                            c.priority === "HIGH" || c.priority === "CRITICAL",
                        ).length
                      }
                      )
                    
                  
                  
                    
                      
                      All Complaints
                    
                  
                
              
            
          
        

        
          
            
              
                
                Priority Complaints Requiring Attention
              
            
            
              {priorityComplaints.length === 0 ? (
                
                  
                  
                    No priority complaints requiring attention
                  
                
              ) : (
                
                  
                    
                      ID
                      Type
                      Area
                      Status
                      Priority
                      Date
                      Actions
                    
                  
                  
                    {priorityComplaints.map((complaint) => (
                      
                        
                          #{complaint.complaintId || complaint.id.slice(-6)}
                        
                        
                          {complaint.type.replace("_", " ")}
                        
                        {complaint.area}
                        
                          
                            {complaint.status.replace("_", " ")}
                          
                        
                        
                          
                            {complaint.priority}
                          
                        
                        
                          
                            
                            {new Date(
                              complaint.submittedOn,
                            ).toLocaleDateString()}
                          
                        
                        
                           refetchComplaints()}
                            onShowUpdateModal={(complaint) => {
                              setSelectedComplaint(complaint);
                              setIsUpdateModalOpen(true);
                            }}
                          />
                        
                      
                    ))}
                  
                
              )}
            
          
        

        
          
            
              
                
                Complaints by Area
              
            
            
              {subZones.length === 0 ? (
                
                  
                  No complaint data available
                
              ) : (
                
                  {subZones.map((zone, index) => ({zone.name}
                        
                          {zone.complaints} complaints
                        
                      
                      
                        
                          
                            Total) * 100
                              : 0
                          }
                          className="h-2"
                        />
                      
                      
                        
                          
                            View Complaints
                          
                        
                      
                    
                  ))}
                
              )}
            
          
        
      

      {/* Update Complaint Modal */}
       {
          setIsUpdateModalOpen(false);
          setSelectedComplaint(null);
        }}
        onSuccess={() => {
          setIsUpdateModalOpen(false);
          setSelectedComplaint(null);
          refetchComplaints();
        }}
      />
    
  );
};

export default WardManagement;
