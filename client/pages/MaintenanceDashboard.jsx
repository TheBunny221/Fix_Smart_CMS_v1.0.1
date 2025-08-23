import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  useGetComplaintsQuery,
  useUpdateComplaintMutation,
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
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Camera,
  FileText,
  BarChart3,
  TrendingUp,
  Navigation,
  Phone,
  MessageSquare,
} from "lucide-react";

const MaintenanceDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  // Fetch complaints assigned to this maintenance team member
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetComplaintsQuery({
    assignedTo,
    page,
    limit,
  });

  const complaints = complaintsResponse?.data || [];

  const [updateComplaint] = useUpdateComplaintMutation();

  const [dashboardStats, setDashboardStats] = useState({
    totalTasks,
    inProgress,
    completed,
    pending,
    todayTasks,
    avgCompletionTime,
    efficiency,
  });

  // Data fetching is handled by RTK Query hooks automatically

  useEffect(() => {
    // Filter tasks assigned to this maintenance team member
    const assignedTasks = complaints.filter(
      (c) => c.assignedToId === user?.id && c.status == "REGISTERED",
    );

    const totalTasks = assignedTasks.length;
    const inProgress = assignedTasks.filter(
      (c) => c.status === "IN_PROGRESS",
    ).length;
    const completed = assignedTasks.filter(
      (c) => c.status === "RESOLVED",
    ).length;
    const pending = assignedTasks.filter((c) => c.status === "ASSIGNED").length;

    const today = new Date().toDateString();
    const todayTasks = assignedTasks.filter(
      (c) => new Date(c.assignedOn || c.submittedOn).toDateString() === today,
    ).length;

    setDashboardStats({
      totalTasks,
      inProgress,
      completed,
      pending,
      todayTasks,
      avgCompletionTime, // Mock calculation
      efficiency, // Mock calculation
    });
  }, [complaints, user]);

  const getStatusColor = (status) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
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

  const myTasks = complaints.filter(
    (c) => c.assignedToId === user?.id && c.status == "REGISTERED",
  );

  const activeTasks = myTasks
    .filter((c) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS")
    .slice(0, 5);

  const urgentTasks = myTasks
    .filter((c) => c.priority === "CRITICAL" || c.priority === "HIGH")
    .slice(0, 3);

  const handleStatusUpdate = (complaintId, newStatus) => {
    dispatch(updateComplaintStatus({ id, status));
  };

  return (
    
      {/* Welcome Section */}
      
        🚧 Maintenance Dashboard 🛠️
        
          Manage your assigned tasks and track field work progress.
        
        
          
            
            Start Field Work
          
        
      

      {/* Statistics Cards */}
      
        
          
            Total Tasks
            
          
          
            
              {dashboardStats.totalTasks}
            
            Assigned to you
          
        

        
          
            Today's Tasks
            
          
          
            
              {dashboardStats.todayTasks}
            
            Scheduled for today
          
        

        
          
            In Progress
            
          
          
            
              {dashboardStats.inProgress}
            
            
              Currently working on
            
          
        

        
          
            Efficiency
            
          
          
            
              {dashboardStats.efficiency}%
            
            This month
          
        
      

      {/* Main Content Tabs */}
      
        
          
            Active Tasks ({activeTasks.length})
          
          
            Urgent ({urgentTasks.length})
          
          Completed
          Tools & Reports
        

        
          
            {/* Active Tasks */}
            
              
                
                  
                  Active Tasks
                
              
              
                {activeTasks.length === 0 ? (
                  
                    
                    No active tasks
                    
                      Great job All caught up.
                    
                  
                ) : (
                  
                    {activeTasks.map((task) => (
                      
                        
                          
                            {task.title || `Task #${task.id.slice(-6)}`}
                          
                          
                            
                              {task.status.replace("_", " ")}
                            
                            
                              {task.priority}
                            
                          
                        
                        
                          {task.description}
                        
                        
                          
                          {task.area}, {task.landmark}
                          
                          Due:{" "}
                          {task.deadline
                            ? new Date(task.deadline).toLocaleDateString()
                            : "No deadline"}
                        
                        
                          
                            
                              
                              Navigate
                            
                            
                              
                              Call Citizen
                            
                          
                          
                            {task.status === "ASSIGNED" && (
                              
                                  handleStatusUpdate(task.id, "IN_PROGRESS")
                                }
                              >
                                Start Work
                              
                            )}
                            {task.status === "IN_PROGRESS" && (
                              
                                  handleStatusUpdate(task.id, "RESOLVED")
                                }
                              >
                                Mark Complete
                              
                            )}
                            
                              
                                Details
                              
                            
                          
                        
                      
                    ))}
                  
                )}
              
            

            {/* Quick Actions & Progress */}
            
              {/* Quick Actions */}
              
                
                  Quick Actions
                
                
                  
                    
                    Take Work Photo
                  
                  
                    
                    Submit Report
                  
                  
                    
                    Contact Supervisor
                  
                  
                    
                    View Route Map
                  
                
              

              {/* Progress Stats */}
              
                
                  Progress Stats
                
                
                  
                    
                      Tasks Completed
                      
                        {dashboardStats.totalTasks > 0
                          ? Math.round(
                              (dashboardStats.completed /
                                dashboardStats.totalTasks) *
                                100,
                            )
                          : 0}
                        %
                      
                    
                     0
                          ? (dashboardStats.completed /
                              dashboardStats.totalTasks) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                  
                  
                    
                      {dashboardStats.avgCompletionTime}
                    
                    
                      Avg. Completion Time (days)
                    
                  
                  
                    
                      {dashboardStats.completed}
                    
                    
                      Tasks Completed This Month
                    
                  
                
              
            
          
        

        
          
            
              
                
                Urgent Tasks Requiring Immediate Attention
              
            
            
              {urgentTasks.length === 0 ? (
                
                  
                  No urgent tasks Well done
                
              ) : (
                
                  {urgentTasks.map((task) => (
                    
                      
                        
                          {task.title || `Task #${task.id.slice(-6)}`}
                        
                        
                          
                            {task.priority}
                          
                          
                            {task.status.replace("_", " ")}
                          
                        
                      
                      
                        {task.description}
                      
                      
                        
                        {task.area}
                        
                        Due:{" "}
                        {task.deadline
                          ? new Date(task.deadline).toLocaleDateString()
                          : "ASAP"}
                      
                      
                        
                          
                            
                            Navigate
                          
                          
                            
                            Emergency Contact
                          
                        
                        
                          
                            Start Immediately
                          
                          
                            
                              Details
                            
                          
                        
                      
                    
                  ))}
                
              )}
            
          
        

        
          
            
              Recently Completed Tasks
            
            
              
                {myTasks
                  .filter((task) => task.status === "RESOLVED")
                  .slice(0, 10)
                  .map((task) => (
                    
                      
                        
                          
                            {task.title || `Task #${task.id.slice(-6)}`}
                          
                          
                            Completed on{" "}
                            {task.resolvedOn
                              ? new Date(task.resolvedOn).toLocaleDateString()
                              : "Recently"}
                          
                        
                        
                          
                          
                            
                              View Report
                            
                          
                        
                      
                    
                  ))}
              
            
          
        

        
          
            
              
                Field Tools
              
              
                
                  
                  Photo Documentation
                
                
                  
                  GPS Navigation
                
                
                  
                  Work Order Scanner
                
                
                  
                  Incident Reporting
                
              
            

            
              
                Reports & Analytics
              
              
                
                  
                  Daily Work Report
                
                
                  
                  Performance Summary
                
                
                  
                  Time Tracking
                
                
                  
                  Completion Certificate
                
              
            
          
        
      
    
  );
};

export default MaintenanceDashboard;
