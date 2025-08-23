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

const MaintenanceDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  // Fetch complaints assigned to this maintenance team member
  const {
    data: complaintsResponse,
    isLoading,
    error,
    refetch,
  } = useGetComplaintsQuery({
    assignedTo: user?.id,
    page: 1,
    limit: 50,
  });

  const complaints = complaintsResponse?.data || [];

  const [updateComplaint] = useUpdateComplaintMutation();

  const [dashboardStats, setDashboardStats] = useState({
    totalTasks: 0,
    inProgress: 0,
    completed: 0,
    pending: 0,
    todayTasks: 0,
    avgCompletionTime: 2.5,
    efficiency: 85,
  });

  // Data fetching is handled by RTK Query hooks automatically

  useEffect(() => {
    // Filter tasks assigned to this maintenance team member
    const assignedTasks = complaints.filter(
      (c) => c.assignedToId === user?.id && c.status !== "REGISTERED",
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
      avgCompletionTime: 2.5, // Mock calculation
      efficiency: 85, // Mock calculation
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
    (c) => c.assignedToId === user?.id && c.status !== "REGISTERED",
  );

  const activeTasks = myTasks
    .filter((c) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS")
    .slice(0, 5);

  const urgentTasks = myTasks
    .filter((c) => c.priority === "CRITICAL" || c.priority === "HIGH")
    .slice(0, 3);

  const handleStatusUpdate = (complaintId, newStatus) => {
    updateComplaint({ id: complaintId, status: newStatus });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">
          🚧 Maintenance Dashboard 🛠️
        </h1>
        <p className="opacity-90">
          Manage your assigned tasks and track field work progress.
        </p>
        <div className="mt-4">
          <Button className="bg-white text-orange-600 hover:bg-gray-50">
            <Wrench className="w-4 h-4 mr-2" />
            Start Field Work
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="w-5 h-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.totalTasks}
            </div>
            <p className="text-xs text-gray-500">Assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <Calendar className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardStats.todayTasks}
            </div>
            <p className="text-xs text-gray-500">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardStats.inProgress}
            </div>
            <p className="text-xs text-gray-500">
              Currently working on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats.efficiency}%
            </div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active Tasks ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="urgent">
            Urgent ({urgentTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="tools">Tools & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Tasks */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Active Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="font-medium">No active tasks</h3>
                      <p className="text-gray-500 text-sm">
                        Great job! All caught up.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeTasks.map((task) => (
                        <div key={task.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">
                              {task.title || `Task #${task.id.slice(-6)}`}
                            </h4>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(task.status)}>
                                {task.status.replace("_", " ")}
                              </Badge>
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {task.description}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <MapPin className="w-4 h-4 mr-1" />
                            {task.area}, {task.landmark}
                            <Calendar className="w-4 h-4 ml-4 mr-1" />
                            Due:{" "}
                            {task.deadline
                              ? new Date(task.deadline).toLocaleDateString()
                              : "No deadline"}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Navigation className="w-4 h-4 mr-1" />
                              Navigate
                            </Button>
                            <Button size="sm" variant="outline">
                              <Phone className="w-4 h-4 mr-1" />
                              Call Citizen
                            </Button>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {task.status === "ASSIGNED" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusUpdate(task.id, "IN_PROGRESS")
                                }
                              >
                                Start Work
                              </Button>
                            )}
                            {task.status === "IN_PROGRESS" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStatusUpdate(task.id, "RESOLVED")
                                }
                              >
                                Mark Complete
                              </Button>
                            )}
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/complaints/${task.id}`}>
                                Details
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Progress */}
            <div className="space-y-4">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" variant="outline">
                    <Camera className="w-4 h-4 mr-2" />
                    Take Work Photo
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Submit Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Supervisor
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Navigation className="w-4 h-4 mr-2" />
                    View Route Map
                  </Button>
                </CardContent>
              </Card>

              {/* Progress Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Progress Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tasks Completed</span>
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
                    <div className="text-2xl font-bold">
                      {dashboardStats.avgCompletionTime}
                    </div>
                    <div className="text-sm text-gray-500">
                      Avg. Completion Time (days)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardStats.completed}
                    </div>
                    <div className="text-sm text-gray-500">
                      Tasks Completed This Month
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="urgent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Urgent Tasks Requiring Immediate Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {urgentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No urgent tasks! Well done.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {urgentTasks.map((task) => (
                    <div key={task.id} className="border-l-4 border-red-500 pl-4 py-2">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">
                          {task.title || `Task #${task.id.slice(-6)}`}
                        </h4>
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {task.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        {task.area}
                        <Calendar className="w-4 h-4 ml-4 mr-1" />
                        Due:{" "}
                        {task.deadline
                          ? new Date(task.deadline).toLocaleDateString()
                          : "ASAP"}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Navigation className="w-4 h-4 mr-1" />
                          Navigate
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4 mr-1" />
                          Emergency Contact
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          Start Immediately
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/complaints/${task.id}`}>
                            Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Recently Completed Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myTasks
                  .filter((task) => task.status === "RESOLVED")
                  .slice(0, 10)
                  .map((task) => (
                    <div key={task.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h4 className="font-medium">
                          {task.title || `Task #${task.id.slice(-6)}`}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Completed on{" "}
                          {task.resolvedOn
                            ? new Date(task.resolvedOn).toLocaleDateString()
                            : "Recently"}
                        </p>
                      </div>
                      <div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/complaints/${task.id}`}>
                            View Report
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Field Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Camera className="w-4 h-4 mr-2" />
                  Photo Documentation
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Navigation className="w-4 h-4 mr-2" />
                  GPS Navigation
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Work Order Scanner
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Incident Reporting
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reports & Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Daily Work Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Performance Summary
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Time Tracking
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completion Certificate
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
