import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  useGetComplaintsQuery,
  useUpdateComplaintStatusMutation,
} from "../store/api/complaintsApi";
import type { Complaint } from "@/types/common";
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
import { useAppTranslation } from "../utils/i18n";

const MaintenanceDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);
  const { t } = useAppTranslation();

  // Fetch complaints assigned to this maintenance team member
  // Let the backend handle role-based filtering automatically for maintenance team
  const {
    data: complaintsResponse,
    isLoading,
    error,
    refetch: refetchComplaints,
  } = useGetComplaintsQuery({
    page: 1,
    limit: 100,
  });

  const complaints = useMemo(() => {
    const complaintsData = complaintsResponse?.data as any;
    if (Array.isArray(complaintsData?.complaints)) {
      return complaintsData.complaints as Complaint[];
    }
    if (Array.isArray(complaintsData)) {
      return complaintsData as Complaint[];
    }
    return [] as Complaint[];
  }, [complaintsResponse]);

  const [updateComplaintStatus] = useUpdateComplaintStatusMutation();

  const dashboardStats = useMemo(() => {
    const assignedTasks = complaints.filter((c: Complaint) => {
      const assigneeId = c.assignedToId || (typeof c.assignedTo === 'object' ? c.assignedTo?.id : c.assignedTo);
      const maintenanceTeamId = c.maintenanceTeamId || (typeof c.maintenanceTeam === 'object' ? c.maintenanceTeam?.id : c.maintenanceTeam);
      return (
        (assigneeId === user?.id || maintenanceTeamId === user?.id) &&
        c.status !== "REGISTERED"
      );
    });

    //   useEffect(() => {
    //     // Filter tasks assigned to this maintenance team member
    //     const assignedTasks = complaints.filter(
    //       (c) => c.assignedToId === user?.id && c.status !== "REGISTERED",
    //     );
    //     const assignedTasks = complaints.filter(
    //       (c) => c.assignedToId === user?.id && c.status !== "REGISTERED",
    //     );

    const totalTasks = assignedTasks.length;
    const inProgress = assignedTasks.filter(
      (c: Complaint) => c.status === "IN_PROGRESS",
    ).length;
    const completed = assignedTasks.filter(
      (c: Complaint) => c.status === "RESOLVED",
    ).length;
    const pending = assignedTasks.filter((c: Complaint) => c.status === "ASSIGNED").length;

    const today = new Date().toDateString();
    const todayTasks = assignedTasks.filter(
      (c: Complaint) => new Date(c.assignedOn || c.submittedOn || '').toDateString() === today,
    ).length;

    // Calculate average completion time for resolved tasks
    const resolvedTasks = assignedTasks.filter(
      (c: Complaint) => c.status === "RESOLVED" && c.resolvedOn && c.assignedOn,
    );
    const avgCompletionTime =
      resolvedTasks.length > 0
        ? resolvedTasks.reduce((acc: number, task: Complaint) => {
          const assignedDate = new Date(task.assignedOn || '');
          const resolvedDate = new Date(task.resolvedOn || '');
          const diffInDays =
            (resolvedDate.getTime() - assignedDate.getTime()) /
            (1000 * 60 * 60 * 24);
          return acc + diffInDays;
        }, 0) / resolvedTasks.length
        : 0;

    // Calculate efficiency as percentage of tasks completed on time
    const tasksWithDeadlines = assignedTasks.filter((c: Complaint) => c.slaDeadline);
    const onTimeTasks = tasksWithDeadlines.filter((c: Complaint) => {
      if (c.status === "RESOLVED" && c.resolvedOn) {
        return new Date(c.resolvedOn) <= new Date(c.slaDeadline || '');
      }
      return c.status !== "RESOLVED" && new Date() <= new Date(c.slaDeadline || '');
    });
    const efficiency =
      tasksWithDeadlines.length > 0
        ? Math.round((onTimeTasks.length / tasksWithDeadlines.length) * 100)
        : totalTasks === 0
          ? 100
          : Math.round((completed / totalTasks) * 100);

    return {
      totalTasks,
      inProgress,
      completed,
      pending,
      todayTasks,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10, // Round to 1 decimal
      efficiency,
    };
  }, [complaints, user?.id]);

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
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

  const myTasks = useMemo(() => {
    return complaints.filter((c: Complaint) => {
      const assigneeId = c.assignedToId || (typeof c.assignedTo === 'object' ? c.assignedTo?.id : c.assignedTo);
      const maintenanceTeamId = c.maintenanceTeamId || (typeof c.maintenanceTeam === 'object' ? c.maintenanceTeam?.id : c.maintenanceTeam);
      return (
        (assigneeId === user?.id || maintenanceTeamId === user?.id) &&
        c.status !== "REGISTERED"
      );
    });
  }, [complaints, user?.id]);

  const activeTasks = useMemo(
    () =>
      myTasks
        .filter((c: Complaint) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS")
        .slice(0, 5),
    [myTasks],
  );

  const urgentTasks = useMemo(
    () =>
      myTasks
        .filter((c: Complaint) => c.priority === "CRITICAL" || c.priority === "HIGH")
        .slice(0, 3),
    [myTasks],
  );

  const handleStatusUpdate = async (complaintId: string, newStatus: "REGISTERED" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REOPENED") => {
    try {
      await updateComplaintStatus({
        id: complaintId,
        status: newStatus,
      }).unwrap();
      refetchComplaints();
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            🚧 {t('maintenance.dashboard.title')} 🛠️
          </h1>
          <p className="text-green-100">{t('maintenance.dashboard.loadingTasks')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-12 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">⚠️ {t('maintenance.dashboard.error')}</h1>
          <p className="text-red-100">
            {t('maintenance.dashboard.errorMessage')}
          </p>
          <div className="mt-4">
            <Button
              className="bg-white text-red-600 hover:bg-gray-100"
              onClick={() => refetchComplaints()}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {t('common.retry')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
  {/* Modern Maintenance Welcome Section - Ward Officer Style */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
            🚧 {t('maintenance.dashboard.title')} 🛠️
          </h1>
          <p className="text-primary-foreground/90 text-sm md:text-base">
            {t('maintenance.dashboard.subtitle')}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Card
            className="w-full md:w-44 p-4 cursor-pointer rounded-2xl transition-all duration-300 bg-white/10 hover:bg-white/20 border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl backdrop-blur-sm border"
            onClick={() => {/* Navigate to field work */}}
          >
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-3 space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
                <div className="p-1.5 rounded-lg bg-white/20">
                  <Navigation className="h-4 w-4 text-white" />
                </div>
                {t('maintenance.dashboard.fieldWork')}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="text-xs text-white/80">{t('maintenance.dashboard.startTasks')}</div>
            </CardContent>
          </Card>

          <Card
            className="w-full md:w-44 p-4 cursor-pointer rounded-2xl transition-all duration-300 bg-white/10 hover:bg-white/20 border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl backdrop-blur-sm border"
            onClick={() => refetchComplaints()}
          >
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-3 space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-white">
                <div className="p-1.5 rounded-lg bg-white/20">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                {t('common.refresh')}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="text-xs text-white/80">{t('maintenance.dashboard.updateData')}</div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Debug Info - Development Only */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-800">
              {t('maintenance.dashboard.debugInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-yellow-700">
            <div>{t('maintenance.dashboard.totalComplaintsFetched')}: {complaints.length}</div>
            <div>{t('maintenance.dashboard.userId')}: {user?.id}</div>
            <div>{t('maintenance.dashboard.userRole')}: {user?.role}</div>
            <div>{t('maintenance.dashboard.myTasksCount')}: {myTasks.length}</div>
            {complaints.length > 0 && (
              <div>
                {t('maintenance.dashboard.sampleTask')}:{" "}
                {JSON.stringify(complaints[0], null, 2).substring(0, 200)}...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('maintenance.dashboard.totalTasks')}</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.totalTasks}
            </div>
            <p className="text-xs text-muted-foreground">{t('maintenance.dashboard.assignedToYou')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('maintenance.dashboard.todaysTasks')}</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardStats.todayTasks}
            </div>
            <p className="text-xs text-muted-foreground">{t('maintenance.dashboard.scheduledForToday')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('maintenance.dashboard.inProgress')}</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardStats.inProgress}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('maintenance.dashboard.currentlyWorkingOn')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('maintenance.dashboard.efficiency')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats.efficiency}%
            </div>
            <p className="text-xs text-muted-foreground">{t('maintenance.dashboard.thisMonth')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">
            {t('maintenance.dashboard.activeTasks')} ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="urgent">
            {t('maintenance.dashboard.urgent')} ({urgentTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">{t('maintenance.dashboard.completed')}</TabsTrigger>
          <TabsTrigger value="tools">{t('maintenance.dashboard.toolsReports')}</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Tasks */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  {t('maintenance.dashboard.activeTasks')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                    <p className="text-gray-500">{t('maintenance.dashboard.noActiveTasks')}</p>
                    <p className="text-sm text-gray-400">
                      {t('maintenance.dashboard.allCaughtUp')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeTasks.map((task) => (
                      <div
                        key={task.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-sm">
                            {task.title || `Task #${task.id.slice(-6)}`}
                          </h3>
                          <div className="flex space-x-2">
                            <Badge className={getStatusColor(task.status || "")}>
                              {(task.status || "").replace("_", " ")}
                            </Badge>
                            <Badge className={getPriorityColor(task.priority || "")}>
                              {task.priority || ""}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 mb-3">
                          <MapPin className="h-3 w-3 mr-1" />
                          {task.area}, {task.landmark}
                          <Calendar className="h-3 w-3 ml-3 mr-1" />
                          {t('maintenance.dashboard.due')}:{" "}
                          {task.deadline && typeof task.deadline === 'string'
                            ? new Date(task.deadline).toLocaleDateString()
                            : t('maintenance.dashboard.noDeadline')}
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Navigation className="h-3 w-3 mr-1" />
                              {t('maintenance.dashboard.navigate')}
                            </Button>
                            <Button size="sm" variant="outline">
                              <Phone className="h-3 w-3 mr-1" />
                              {t('maintenance.dashboard.callCitizen')}
                            </Button>
                          </div>
                          <div className="flex space-x-2">
                            {task.status === "assigned" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusUpdate(task.id, "IN_PROGRESS")
                                }
                              >
                                {t('maintenance.dashboard.startWork')}
                              </Button>
                            )}
                            {task.status === "IN_PROGRESS" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusUpdate(task.id, "RESOLVED")
                                }
                              >
                                {t('maintenance.dashboard.markComplete')}
                              </Button>
                            )}
                            <Link to={`/tasks/${task.id}`}>
                              <Button size="sm" variant="outline">
                                {t('common.details')}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions & Progress */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('maintenance.dashboard.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start">
                    <Camera className="h-4 w-4 mr-2" />
                    {t('maintenance.dashboard.takeWorkPhoto')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('maintenance.dashboard.submitReport')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('maintenance.dashboard.contactSupervisor')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Navigation className="h-4 w-4 mr-2" />
                    {t('maintenance.dashboard.viewRouteMap')}
                  </Button>
                </CardContent>
              </Card>

              {/* Progress Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('maintenance.dashboard.progressStats')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{t('maintenance.dashboard.tasksCompleted')}</span>
                      <span>
                        {dashboardStats.totalTasks > 0
                          ? Math.round(
                            (dashboardStats.completed /
                              dashboardStats.totalTasks) *
                            100,
                          )
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        dashboardStats.totalTasks > 0
                          ? (dashboardStats.completed /
                            dashboardStats.totalTasks) *
                          100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardStats.avgCompletionTime}
                    </div>
                    <p className="text-xs text-gray-500">
                      {t('maintenance.dashboard.avgCompletionTime')}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {dashboardStats.completed}
                    </div>
                    <p className="text-xs text-gray-500">
                      {t('maintenance.dashboard.tasksCompletedThisMonth')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="urgent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {t('maintenance.dashboard.urgentTasksTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {urgentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                  <p className="text-gray-500">{t('maintenance.dashboard.noUrgentTasks')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {urgentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-sm">
                          {task.title || `Task #${task.id.slice(-6)}`}
                        </h3>
                        <div className="flex space-x-2">
                          <Badge className="bg-red-100 text-red-800">
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status || "")}>
                            {(task.status || "").replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {task.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-600 mb-3">
                        <MapPin className="h-3 w-3 mr-1" />
                        {task.area}
                        <Clock className="h-3 w-3 ml-3 mr-1" />
                        {t('maintenance.dashboard.due')}:{" "}
                        {task.deadline && typeof task.deadline === 'string'
                          ? new Date(task.deadline).toLocaleDateString()
                          : t('maintenance.dashboard.asap')}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Navigation className="h-3 w-3 mr-1" />
                            {t('maintenance.dashboard.navigate')}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Phone className="h-3 w-3 mr-1" />
                            {t('maintenance.dashboard.emergencyContact')}
                          </Button>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="destructive">
                            {t('maintenance.dashboard.startImmediately')}
                          </Button>
                          <Link to={`/tasks/${task.id}`}>
                            <Button size="sm" variant="outline">
                              {t('common.details')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('maintenance.dashboard.recentlyCompletedTasks')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myTasks
                  .filter((task) => task.status === "RESOLVED")
                  .slice(0, 10)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="border rounded-lg p-4 bg-green-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-sm">
                            {task.title || `${t('maintenance.dashboard.task')} #${task.id.slice(-6)}`}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            {t('maintenance.dashboard.completedOn')}{" "}
                            {task.resolvedOn
                              ? new Date(task.resolvedOn).toLocaleDateString()
                              : t('maintenance.dashboard.recently')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <Link to={`/tasks/${task.id}`}>
                            <Button size="sm" variant="outline">
                              {t('maintenance.dashboard.viewReport')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('maintenance.dashboard.fieldTools')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start">
                  <Camera className="h-4 w-4 mr-2" />
                  {t('maintenance.dashboard.photoDocumentation')}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Navigation className="h-4 w-4 mr-2" />
                  {t('maintenance.dashboard.gpsNavigation')}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  {t('maintenance.dashboard.workOrderScanner')}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('maintenance.dashboard.incidentReporting')}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('maintenance.dashboard.reportsAnalytics')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {t('maintenance.dashboard.dailyWorkReport')}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {t('maintenance.dashboard.performanceSummary')}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('maintenance.dashboard.timeTracking')}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  {t('maintenance.dashboard.completionCertificate')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaintenanceDashboard;
