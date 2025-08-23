import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  useGetComplaintsQuery,
  useGetComplaintStatisticsQuery,
} from "../store/api/complaintsApi";
import {
  useGetDashboardAnalyticsQuery,
  useGetRecentActivityQuery,
  useGetDashboardStatsQuery,
  useGetUserActivityQuery,
  useGetSystemHealthQuery,
} from "../store/api/adminApi";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Shield,
  Users,
  FileText,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  BarChart3,
  UserCheck,
  Database,
  MessageSquare,
  Activity,
  Target,
} from "lucide-react";

const AdminDashboard: React.FC = () => {
  const { translations } = useAppSelector((state) => state.language);

  // Fetch real-time data using API queries
  const {
    data,
    isLoading,
    error,
  } = useGetDashboardStatsQuery();

  const {
    data,
    isLoading,
    error,
  } = useGetDashboardAnalyticsQuery();

  const {
    data,
    isLoading,
    error,
  } = useGetRecentActivityQuery({ limit);

  const {
    data,
    isLoading,
    error,
  } = useGetUserActivityQuery({ period);

  const {
    data,
    isLoading,
    error,
  } = useGetSystemHealthQuery();

  const systemStats = dashboardStats?.data || {
    totalComplaints,
    totalUsers,
    activeComplaints,
    resolvedComplaints,
    overdue,
    wardOfficers,
    maintenanceTeam,
  };

  const analytics = analyticsData?.data;
  const recentActivity = recentActivityData?.data || [];
  const isLoading =
    statsLoading ||
    analyticsLoading ||
    activityLoading ||
    userActivityLoading ||
    systemHealthLoading;

  // Use real data from APIs with fallbacks
  const complaintTrends = analytics?.complaintTrends || [];
  const complaintsByType = analytics?.complaintsByType || [];
  const wardPerformance = analytics?.wardPerformance || [];
  const metrics = analytics?.metrics || {
    avgResolutionTime,
    slaCompliance,
    citizenSatisfaction,
    resolutionRate,
  };

  // Development debugging
  if (process.env.NODE_ENV === "development") {
    console.log("Dashboard Data Debug, {
      analytics,
      complaintTrends,
      complaintsByType,
      wardPerformance,
      metrics,
      systemStats,
    });
  }

  // Show loading state
  if (isLoading) {
    return (
      
        Loading dashboard data...
      
    );
  }

  // Show error state
  if (
    statsError ||
    analyticsError ||
    activityError ||
    userActivityError ||
    systemHealthError
  ) {
    return (Error loading dashboard data. Please try refreshing the page.
          {process.env.NODE_ENV === "development" && (
            
              Errors, analyticsError, activityError })}
            
          )}
        
      
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case "complaint":
        return ;
      case "resolution":
        return ;
      case "assignment":
        return ;
      case "login":
        return ;
      case "user_created":
        return ;
      case "user":
        return ;
      case "alert":
        return ;
      default:
        return ;
    }
  };

  return (
    
      {/* Welcome Header */}
      
        
          
            🛡️ Administrator Dashboard 🛠️
            
              Complete system overview and management controls for Cochin Smart
              City
            
          
          
        
        
          
            
              {systemStats.totalComplaints}
            
            Total Complaints
          
          
            
              {systemStats.wardOfficers + systemStats.maintenanceTeam}
            
            Active Users
          
          
            
              {metrics?.slaCompliance || 0}%
            
            SLA Compliance
          
          
            
              {(metrics?.citizenSatisfaction || 0).toFixed(1)}/5
            
            Satisfaction
          
        
      

      {/* Key Metrics */}
      
        
          
            
              Active Complaints
            
            
          
          
            
              {systemStats.activeComplaints}
            
            Pending resolution
          
        

        
          
            Overdue Tasks
            
          
          
            
              {systemStats.overdue}
            
            Past deadline
          
        

        
          
            System Users
            
          
          
            
              {systemStats.wardOfficers + systemStats.maintenanceTeam}
            
            
              {systemStats.wardOfficers} officers, {systemStats.maintenanceTeam}{" "}
              maintenance
            
          
        

        
          
            
              Avg Resolution
            
            
          
          
            
              {(metrics?.avgResolutionTime || 0).toFixed(1)}d
            
            Target: 3 days
          
        
      

      {/* Main Dashboard Tabs */}
      
        
          Overview
          Performance
          Users
          System
        

        
          
            {/* Complaint Trends */}
            
              
                Complaint Trends (Last 6 Months)
              
              
                {complaintTrends && complaintTrends.length > 0 ? ([
                            value,
                            name === "complaints" ? "Complaints" ,
                          ]}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        
                        
                      
                    
                    {process.env.NODE_ENV === "development" && (Data points, trend) => sum + (trend.complaints || 0),
                          0,
                        )}
                      
                    )}
                  
                ) : (No complaint trend data available
                      
                      {process.env.NODE_ENV === "development" && analytics && (
                        
                          Analytics loaded)}
                    
                  
                )}
              
            

            {/* Complaints by Type */}
            
              
                Complaints by Type
              
              
                {complaintsByType && complaintsByType.length > 0 ? (
                  
                    
                      
                        
                          {complaintsByType.map((entry, index) => (
                            
                          ))}
                        
                         [
                            `${value} complaints`,
                            "Count",
                          ]}
                          labelFormatter={(label) => `Type: ${label}`}
                        />
                      
                    
                    
                      {complaintsByType.map((item, index) => (
                        
                          
                          
                            {item?.name || "Unknown"} ({item?.value || 0})
                          
                        
                      ))}
                    
                    {process.env.NODE_ENV === "development" && (Types, type) => sum + (type.value || 0),
                          0,
                        )}
                      
                    )}
                  
                ) : (No complaint type data available
                      
                      {process.env.NODE_ENV === "development" && analytics && (
                        
                          Analytics loaded)}
                    
                  
                )}
              
            
          

          {/* Recent Activity */}
          
            
              
                
                Recent System Activity
              
            
            
              {recentActivity.length > 0 ? (
                
                  {recentActivity.map((activity) => (
                    
                      {getActivityIcon(activity.type)}
                      
                        
                          
                            {activity.message}
                          
                          
                            {activity.type}
                          
                        
                        {activity.user && (
                          
                            {activity.user.name}
                            {activity.user.email ? (
                              
                                {" "}
                                · {activity.user.email}
                              
                            ) : null}
                          
                        )}
                        {activity.time}
                      
                    
                  ))}
                
              ) : (
                
                  No recent activity available
                
              )}
            
          
        

        
          {/* Performance KPIs */}
          
            
              
                Response Time
              
              
                
                  {(metrics?.avgResolutionTime || 0).toFixed(1)}d
                
                Average resolution time
                
                  
                    Target: 3d
                    
                      {(metrics?.avgResolutionTime || 0) 
                  
                  
                
              
            

            
              
                Resolution Rate
              
              
                
                  {metrics?.resolutionRate || 0}%
                
                Complaints resolved
                
                  
                    Target: 90%
                    
                      {(metrics?.resolutionRate || 0) >= 90
                        ? "Excellent"
                        : (metrics?.resolutionRate || 0) >= 75
                          ? "Good"
                          : "Needs improvement"}
                    
                  
                  
                
              
            

            
              
                SLA Compliance
              
              
                
                  {metrics?.slaCompliance || 0}%
                
                Meeting deadlines
                
                  
                    Target: 85%
                    
                      {(metrics?.slaCompliance || 0) >= 85
                        ? "Excellent"
                        : (metrics?.slaCompliance || 0) >= 70
                          ? "Good"
                          : "Below target"}
                    
                  
                  
                
              
            

            
              
                Satisfaction Score
              
              
                
                  {(metrics?.citizenSatisfaction || 0).toFixed(1)}/5
                
                Citizen feedback
                
                  
                    Target: 4.0
                    
                      {(metrics?.citizenSatisfaction || 0) >= 4.0
                        ? "Above target"
                        : "Below target"}
                    
                  
                  
                
              
            
          

          {/* Performance Charts */}
          
            {/* Performance Summary */}
            
              
                Performance Summary
              
              
                
                  
                    
                      Overall Resolution Rate
                      
                        {metrics?.resolutionRate || 0}%
                      
                    
                    

                    
                      SLA Compliance
                      
                        {metrics?.slaCompliance || 0}%
                      
                    
                    
                  

                  
                    
                      
                        {(metrics?.avgResolutionTime || 0).toFixed(1)}d
                      
                      
                        Average Resolution Time
                      
                      
                        Target: 3 days
                      
                    

                    
                      
                        {(metrics?.citizenSatisfaction || 0).toFixed(1)}/5
                      
                      
                        Satisfaction Score
                      
                    
                  
                
              
            

            {/* Quick Actions */}
            
              
                Quick Actions
              
              
                
                  
                    
                      
                      Detailed Reports
                    
                  
                  
                    
                      
                      Analytics
                    
                  
                  
                    
                      
                      Add User
                    
                  
                  
                    
                      
                      Settings
                    
                  
                
              
            
          
        

        
          
            
              
                User Management
              
              
                
                  
                    
                    Manage Users (
                    {systemStats.wardOfficers + systemStats.maintenanceTeam})
                  
                
                
                  
                    
                    Ward Officers ({systemStats.wardOfficers})
                  
                
                
                  
                    
                    Maintenance Team ({systemStats.maintenanceTeam})
                  
                
              
            

            
              
                User Activity (Real-time)
              
              
                {userActivityLoading ? (
                  
                    
                    Loading activity...
                  
                ) : userActivityError ? (
                  
                    Failed to load user activity
                  
                ) : (
                  
                    
                      Active Users (24h)
                      
                        {userActivityData?.data?.metrics?.activeUsers || 0}
                      
                    
                    
                      New Registrations (24h)
                      
                        {userActivityData?.data?.metrics?.newRegistrations || 0}
                      
                    
                    
                      Login Success Rate
                      
                        {userActivityData?.data?.metrics?.loginSuccessRate || 0}
                        %
                      
                    
                    {userActivityData?.data?.activities &&
                      userActivityData.data.activities.length > 0 && (
                        
                          
                            Recent Activity
                          
                          
                            {userActivityData.data.activities
                              .slice(0, 3)
                              .map((activity) => (
                                
                                  
                                    {activity.message}
                                  
                                  
                                    {activity.time}
                                  
                                
                              ))}
                          
                        
                      )}
                  
                )}
              
            
          
        

        
          
            
              
                System Configuration
              
              
                
                  
                    
                    System Settings
                  
                
                
                  
                    
                    Ward Management
                  
                
                
                  
                    
                    Complaint Types
                  
                
              
            

            
              
                System Health (Real-time)
              
              
                {systemHealthLoading ? (
                  
                    
                    Checking health...
                  
                ) : systemHealthError ? (
                  
                    Failed to load system health
                  
                ) : (System Uptime
                      
                        {systemHealthData?.data?.uptime?.formatted || "N/A"}
                      
                    
                    
                      Database Status
                      
                        {systemHealthData?.data?.services?.database?.status ===
                        "healthy"
                          ? "Healthy"
                          )`}
                      
                    
                    
                      Email Service
                      
                        {systemHealthData?.data?.services?.emailService
                          ?.status || "Unknown"}
                      
                    
                    
                      File Storage
                       90
                            ? "bg-red-100 text-red-800"
                            : (systemHealthData?.data?.services?.fileStorage
                                  ?.usedPercent || 0) > 75
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }
                      >
                        {systemHealthData?.data?.services?.fileStorage
                          ?.usedPercent || 0}
                        % Used
                      
                    
                    
                      API Response
                      
                        {systemHealthData?.data?.services?.api
                          ?.averageResponseTime || "N/A"}
                      
                    
                    {systemHealthData?.data?.system?.memory && (Memory Usage
                         80
                              ? "bg-red-100 text-red-800"
                              )
                        
                      
                    )}
                  
                )}
              
            
          
        
      
    
  );
};

export default AdminDashboard;
