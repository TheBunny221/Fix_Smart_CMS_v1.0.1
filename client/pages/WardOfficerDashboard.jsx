import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  useGetComplaintsQuery,
  useUpdateComplaintMutation,
  useAssignComplaintMutation,
  useGetComplaintStatisticsQuery,
} from "../store/api/complaintsApi";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  AlertTriangle,
  Clock,
  Users,
  BarChart3,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  Settings,
  MessageSquare,
} from "lucide-react";

const WardOfficerDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  // Fetch complaints for the ward officer's ward
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetComplaintsQuery({
    ward,
    page,
    limit,
  });

  const complaints = complaintsResponse?.data || [];

  // Fetch complaint statistics
  const { data, isLoading: statsLoading } =
    useGetComplaintStatisticsQuery({
      ward,
    });

  const [updateComplaint] = useUpdateComplaintMutation();
  const [assignComplaintMutation] = useAssignComplaintMutation();

  const [dashboardStats, setDashboardStats] = useState({
    totalAssigned,
    pending,
    inProgress,
    overdue,
    resolved,
    slaCompliance,
    avgResolutionTime,
  });

  // Data fetching is handled by RTK Query hooks automatically

  useEffect(() => {
    // Filter complaints for this ward officer
    const wardComplaints = Array.isArray(complaints) 
    ? complaints.filter((c) => c.assignedTo === user?.id || c.ward === user?.wardId)
    : [];

    const totalAssigned = wardComplaints.length;
    const pending = wardComplaints.filter(
      (c) => c.status === "registered",
    ).length;
    const inProgress = wardComplaints.filter(
      (c) => c.status === "in_progress",
    ).length;
    const resolved = wardComplaints.filter(
      (c) => c.status === "resolved",
    ).length;
    const overdue = wardComplaints.filter((c) => {
      if (c.slaDeadline) return false;
      return new Date(c.slaDeadline)  {
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

  const wardComplaints = Array.isArray(complaints) 
    ? complaints.filter((c) => c.assignedTo === user?.id || c.ward === user?.wardId)
    : [];

  const urgentComplaints = wardComplaints
    .filter((c) => c.priority === "critical" || c.priority === "high")
    .slice(0, 5);

  const recentComplaints = wardComplaints.slice(0, 5);

  return (
    
      {/* Welcome Section */}
      
        🚧 Ward Officer Dashboard 🛠️
        
          Manage complaints for {user?.ward?.name || "your assigned ward"} and
          monitor team performance.
        
      

      {/* Statistics Cards */}
      
        
          
            
              Total Assigned
            
            
          
          
            
              {dashboardStats.totalAssigned}
            
            
              Complaints in your ward
            
          
        

        
          
            
              Pending Action
            
            
          
          
            
              {dashboardStats.pending}
            
            Awaiting assignment
          
        

        
          
            Overdue
            
          
          
            
              {dashboardStats.overdue}
            
            Past deadline
          
        

        
          
            
              SLA Compliance
            
            
          
          
            
              {dashboardStats.slaCompliance}%
            
            This month
          
        
      

      {/* Main Content Tabs */}
      
        
          Overview
          
            Urgent ({urgentComplaints.length})
          
          Assignments
          Performance
        

        
          
            {/* Recent Complaints */}
            
              
                
                  
                  Recent Complaints
                
              
              
                {recentComplaints.length === 0 ? (
                  
                    
                    No complaints in your ward
                  
                ) : (
                  
                    {recentComplaints.map((complaint) => (
                      
                        
                          
                            {complaint.title ||
                              `Complaint #${complaint.id.slice(-6)}`}
                          
                          
                            
                              {complaint.status.replace("_", " ")}
                            
                            
                              {complaint.priority}
                            
                          
                        
                        
                          {complaint.description}
                        
                        
                          
                            
                            {complaint.area}
                            
                            {new Date(
                              complaint.submittedOn,
                            ).toLocaleDateString()}
                          
                          
                            
                              Manage
                            
                          
                        
                      
                    ))}
                  
                )}
              
            

            {/* Quick Actions */}
            
              
                Quick Actions
              
              
                
                  
                    
                    Assign Complaints ({dashboardStats.pending})
                  
                
                
                  
                    
                    Handle Urgent ({urgentComplaints.length})
                  
                
                
                  
                    
                    Generate Reports
                  
                
                
                  
                    
                    Team Communication
                  
                
              
            
          
        

        
          
            
              
                
                Urgent Complaints Requiring Immediate Attention
              
            
            
              {urgentComplaints.length === 0 ? (
                
                  
                  
                    No urgent complaints Great job
                  
                
              ) : (
                
                  {urgentComplaints.map((complaint) => (
                    
                      
                        
                          {complaint.title ||
                            `Complaint #${complaint.id.slice(-6)}`}
                        
                        
                          
                            {complaint.priority}
                          
                          
                            {complaint.status.replace("_", " ")}
                          
                        
                      
                      
                        {complaint.description}
                      
                      
                        
                          
                          {complaint.area}
                          
                          {complaint.deadline &&
                            new Date(complaint.deadline).toLocaleDateString()}
                        
                        
                          
                            Assign Now
                          
                          
                            
                              View Details
                            
                          
                        
                      
                    
                  ))}
                
              )}
            
          
        

        
          
            
              Complaint Assignment Management
            
            
              
                
                  Unassigned Complaints
                  
                    {dashboardStats.pending} pending
                  
                
                {/* Assignment interface would go here */}
                
                  
                  
                    Assignment interface will be implemented here
                  
                  
                    Drag and drop complaints to maintenance team members
                  
                
              
            
          
        

        
          
            
              
                SLA Performance
              
              
                
                  
                    Resolution Rate
                    {dashboardStats.slaCompliance}%
                  
                  
                
                
                  
                    {dashboardStats.avgResolutionTime}
                  
                  
                    Average Resolution Time (days)
                  
                
              
            

            
              
                Monthly Trends
              
              
                
                  
                    Complaints Resolved
                    
                      
                      +12%
                    
                  
                  
                    Response Time
                    
                      
                      -8%
                    
                  
                  
                    Citizen Satisfaction
                    
                      
                      4.2/5
                    
                  
                
              
            
          
        
      
    
  );
};

export default WardOfficerDashboard;
