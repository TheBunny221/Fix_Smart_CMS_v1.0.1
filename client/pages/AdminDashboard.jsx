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

const AdminDashboard = () => {
  const { translations } = useAppSelector((state) => state.language);

  // Fetch real-time data using API queries
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
  } = useGetDashboardStatsQuery();

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useGetDashboardAnalyticsQuery();

  const {
    data: recentActivityData,
    isLoading: activityLoading,
    error: activityError,
  } = useGetRecentActivityQuery({ limit: 10 });

  const {
    data: userActivityData,
    isLoading: userActivityLoading,
    error: userActivityError,
  } = useGetUserActivityQuery({ period: "24h" });

  const {
    data: systemHealthData,
    isLoading: systemHealthLoading,
    error: systemHealthError,
  } = useGetSystemHealthQuery();

  const systemStats = dashboardStats?.data || {
    totalComplaints: 0,
    totalUsers: 0,
    activeComplaints: 0,
    resolvedComplaints: 0,
    overdue: 0,
    wardOfficers: 0,
    maintenanceTeam: 0,
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
    avgResolutionTime: 0,
    slaCompliance: 0,
    citizenSatisfaction: 0,
    resolutionRate: 0,
  };

  // Development debugging
  if (process.env.NODE_ENV === "development") {
    console.log("Dashboard Data Debug", {
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
      <div className="flex items-center justify-center h-64">
        Loading dashboard data...
      </div>
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
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-medium mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600">
            Error loading dashboard data. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-2 text-xs">
              Errors: {JSON.stringify({ statsError, analyticsError, activityError })}
            </pre>
          )}
        </div>
      </div>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case "complaint":
        return <FileText className="w-4 h-4" />;
      case "resolution":
        return <CheckCircle className="w-4 h-4" />;
      case "assignment":
        return <UserCheck className="w-4 h-4" />;
      case "login":
        return <Activity className="w-4 h-4" />;
      case "user_created":
        return <Users className="w-4 h-4" />;
      case "user":
        return <Users className="w-4 h-4" />;
      case "alert":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              🛡️ Administrator Dashboard 🛠️
            </h1>
            <p className="opacity-90">
              Complete system overview and management controls for Cochin Smart
              City
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {systemStats.totalComplaints}
            </div>
            <div className="text-sm opacity-80">Total Complaints</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {systemStats.wardOfficers + systemStats.maintenanceTeam}
            </div>
            <div className="text-sm opacity-80">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {metrics?.slaCompliance || 0}%
            </div>
            <div className="text-sm opacity-80">SLA Compliance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {(metrics?.citizenSatisfaction || 0).toFixed(1)}/5
            </div>
            <div className="text-sm opacity-80">Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Active Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStats.activeComplaints}
            </div>
            <p className="text-xs text-gray-500">Pending resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Overdue Tasks
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {systemStats.overdue}
            </div>
            <p className="text-xs text-gray-500">Past deadline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              System Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStats.wardOfficers + systemStats.maintenanceTeam}
            </div>
            <p className="text-xs text-gray-500">
              {systemStats.wardOfficers} officers, {systemStats.maintenanceTeam}{" "}
              maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              Avg Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics?.avgResolutionTime || 0).toFixed(1)}d
            </div>
            <p className="text-xs text-gray-500">Target: 3 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaint Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Complaint Trends (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                {complaintTrends && complaintTrends.length > 0 ? (
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={complaintTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={([value, name]) => [
                            value,
                            name === "complaints" ? "Complaints" : name,
                          ]}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="complaints"
                          stroke="#3b82f6"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    {process.env.NODE_ENV === "development" && (
                      <p className="text-xs text-gray-500 mt-2">
                        Data points: {complaintTrends.reduce(
                          (sum, trend) => sum + (trend.complaints || 0),
                          0,
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No complaint trend data available</p>
                    {process.env.NODE_ENV === "development" && analytics && (
                      <p className="text-xs mt-2">
                        Analytics loaded: {JSON.stringify(analytics)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complaints by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Complaints by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {complaintsByType && complaintsByType.length > 0 ? (
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={complaintsByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          dataKey="value"
                        >
                          {complaintsByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={([value, name]) => [
                            `${value} complaints`,
                            "Count",
                          ]}
                          labelFormatter={(label) => `Type: ${label}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {complaintsByType.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: `hsl(${index * 45}, 70%, 60%)` }}
                          />
                          <span className="text-sm">
                            {item?.name || "Unknown"} ({item?.value || 0})
                          </span>
                        </div>
                      ))}
                    </div>
                    {process.env.NODE_ENV === "development" && (
                      <p className="text-xs text-gray-500 mt-2">
                        Total types: {complaintsByType.reduce(
                          (sum, type) => sum + (type.value || 0),
                          0,
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No complaint type data available</p>
                    {process.env.NODE_ENV === "development" && analytics && (
                      <p className="text-xs mt-2">
                        Analytics loaded: {JSON.stringify(analytics)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent System Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{activity.message}</p>
                            <Badge variant="secondary" className="text-xs">
                              {activity.type}
                            </Badge>
                          </div>
                        </div>
                        {activity.user && (
                          <p className="text-sm text-gray-500 mt-1">
                            {activity.user.name}
                            {activity.user.email ? (
                              <span className="text-gray-400">
                                {" "}
                                · {activity.user.email}
                              </span>
                            ) : null}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent activity available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Performance KPIs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics?.avgResolutionTime || 0).toFixed(1)}d
                </div>
                <p className="text-sm text-gray-500">Average resolution time</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs">
                    <span>Target: 3d</span>
                    <span className={
                      (metrics?.avgResolutionTime || 0) <= 3
                        ? "text-green-600"
                        : "text-red-600"
                    }>
                      {(metrics?.avgResolutionTime || 0) <= 3 ? "On target" : "Over target"}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, ((metrics?.avgResolutionTime || 0) / 3) * 100)} 
                    className="h-1 mt-1" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Resolution Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.resolutionRate || 0}%
                </div>
                <p className="text-sm text-gray-500">Complaints resolved</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs">
                    <span>Target: 90%</span>
                    <span className={
                      (metrics?.resolutionRate || 0) >= 90
                        ? "text-green-600"
                        : (metrics?.resolutionRate || 0) >= 75
                          ? "text-yellow-600"
                          : "text-red-600"
                    }>
                      {(metrics?.resolutionRate || 0) >= 90
                        ? "Excellent"
                        : (metrics?.resolutionRate || 0) >= 75
                          ? "Good"
                          : "Needs improvement"}
                    </span>
                  </div>
                  <Progress value={metrics?.resolutionRate || 0} className="h-1 mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">SLA Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.slaCompliance || 0}%
                </div>
                <p className="text-sm text-gray-500">Meeting deadlines</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs">
                    <span>Target: 85%</span>
                    <span className={
                      (metrics?.slaCompliance || 0) >= 85
                        ? "text-green-600"
                        : (metrics?.slaCompliance || 0) >= 70
                          ? "text-yellow-600"
                          : "text-red-600"
                    }>
                      {(metrics?.slaCompliance || 0) >= 85
                        ? "Excellent"
                        : (metrics?.slaCompliance || 0) >= 70
                          ? "Good"
                          : "Below target"}
                    </span>
                  </div>
                  <Progress value={metrics?.slaCompliance || 0} className="h-1 mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Satisfaction Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics?.citizenSatisfaction || 0).toFixed(1)}/5
                </div>
                <p className="text-sm text-gray-500">Citizen feedback</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs">
                    <span>Target: 4.0</span>
                    <span className={
                      (metrics?.citizenSatisfaction || 0) >= 4.0
                        ? "text-green-600"
                        : "text-red-600"
                    }>
                      {(metrics?.citizenSatisfaction || 0) >= 4.0
                        ? "Above target"
                        : "Below target"}
                    </span>
                  </div>
                  <Progress 
                    value={((metrics?.citizenSatisfaction || 0) / 5) * 100} 
                    className="h-1 mt-1" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        Overall Resolution Rate
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {metrics?.resolutionRate || 0}%
                      </div>
                    </div>
                    <Progress value={metrics?.resolutionRate || 0} className="h-4" />

                    <div className="text-center">
                      <div className="text-lg font-bold">
                        SLA Compliance
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {metrics?.slaCompliance || 0}%
                      </div>
                    </div>
                    <Progress value={metrics?.slaCompliance || 0} className="h-4" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {(metrics?.avgResolutionTime || 0).toFixed(1)}d
                      </div>
                      <div className="text-sm text-gray-500">
                        Average Resolution Time
                      </div>
                      <div className="text-xs text-gray-400">
                        Target: 3 days
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {(metrics?.citizenSatisfaction || 0).toFixed(1)}/5
                      </div>
                      <div className="text-sm text-gray-500">
                        Satisfaction Score
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link to="/admin/reports">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Detailed Reports
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link to="/admin/analytics">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analytics
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link to="/admin/users">
                      <Users className="w-4 h-4 mr-2" />
                      Add User
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link to="/admin/config">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full justify-start" asChild>
                    <Link to="/admin/users">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Users (
                      {systemStats.wardOfficers + systemStats.maintenanceTeam})
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link to="/admin/ward-officers">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Ward Officers ({systemStats.wardOfficers})
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link to="/admin/maintenance">
                      <Users className="w-4 h-4 mr-2" />
                      Maintenance Team ({systemStats.maintenanceTeam})
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity (Real-time)</CardTitle>
              </CardHeader>
              <CardContent>
                {userActivityLoading ? (
                  <div className="text-center py-4">
                    <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
                    Loading activity...
                  </div>
                ) : userActivityError ? (
                  <div className="text-red-500 text-center py-4">
                    Failed to load user activity
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {userActivityData?.data?.metrics?.activeUsers || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          Active Users (24h)
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {userActivityData?.data?.metrics?.newRegistrations || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          New Registrations (24h)
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {userActivityData?.data?.metrics?.loginSuccessRate || 0}
                          %
                        </div>
                        <div className="text-xs text-gray-500">
                          Login Success Rate
                        </div>
                      </div>
                    </div>
                    {userActivityData?.data?.activities &&
                      userActivityData.data.activities.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">
                            Recent Activity
                          </h4>
                          <div className="space-y-2">
                            {userActivityData.data.activities
                              .slice(0, 3)
                              .map((activity) => (
                                <div key={activity.id} className="text-sm">
                                  <p className="font-medium">
                                    {activity.message}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {activity.time}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link to="/admin/config">
                      <Settings className="w-4 h-4 mr-2" />
                      System Settings
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link to="/admin/wards">
                      <MapPin className="w-4 h-4 mr-2" />
                      Ward Management
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link to="/admin/complaint-types">
                      <FileText className="w-4 h-4 mr-2" />
                      Complaint Types
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health (Real-time)</CardTitle>
              </CardHeader>
              <CardContent>
                {systemHealthLoading ? (
                  <div className="text-center py-4">
                    <Database className="w-6 h-6 mx-auto mb-2 animate-spin" />
                    Checking health...
                  </div>
                ) : systemHealthError ? (
                  <div className="text-red-500 text-center py-4">
                    Failed to load system health
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">System Uptime</span>
                      <span className="text-sm font-medium">
                        {systemHealthData?.data?.uptime?.formatted || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Database Status</span>
                      <Badge className={
                        systemHealthData?.data?.services?.database?.status ===
                        "healthy"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }>
                        {systemHealthData?.data?.services?.database?.status ===
                        "healthy"
                          ? "Healthy"
                          : "Offline"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Email Service</span>
                      <span className="text-sm font-medium">
                        {systemHealthData?.data?.services?.emailService
                          ?.status || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">File Storage</span>
                      <Badge className={
                        (systemHealthData?.data?.services?.fileStorage
                          ?.usedPercent || 0) > 90
                          ? "bg-red-100 text-red-800"
                          : (systemHealthData?.data?.services?.fileStorage
                                ?.usedPercent || 0) > 75
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }>
                        {systemHealthData?.data?.services?.fileStorage
                          ?.usedPercent || 0}
                        % Used
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">API Response</span>
                      <span className="text-sm font-medium">
                        {systemHealthData?.data?.services?.api
                          ?.averageResponseTime || "N/A"}
                      </span>
                    </div>
                    {systemHealthData?.data?.system?.memory && (
                      <div className="flex justify-between">
                        <span className="text-sm">Memory Usage</span>
                        <Badge className={
                          (systemHealthData?.data?.system?.memory
                            ?.usedPercent || 0) > 80
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }>
                          {systemHealthData?.data?.system?.memory?.usedPercent || 0}% Used
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
