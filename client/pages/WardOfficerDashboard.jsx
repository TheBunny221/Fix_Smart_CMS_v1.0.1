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

const WardOfficerDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  // Fetch complaints for the ward officer's ward
  const {
    data: complaintsResponse,
    isLoading,
    error,
    refetch,
  } = useGetComplaintsQuery({
    ward: user?.wardId,
    page: 1,
    limit: 50,
  });

  const complaints = complaintsResponse?.data || [];

  // Fetch complaint statistics
  const { data: statsResponse, isLoading: statsLoading } =
    useGetComplaintStatisticsQuery({
      ward: user?.wardId,
    });

  const [updateComplaint] = useUpdateComplaintMutation();
  const [assignComplaintMutation] = useAssignComplaintMutation();

  const [dashboardStats, setDashboardStats] = useState({
    totalAssigned: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0,
    resolved: 0,
    slaCompliance: 85,
    avgResolutionTime: 2.8,
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
      if (!c.slaDeadline) return false;
      return new Date(c.slaDeadline) < new Date();
    }).length;

    const slaCompliance = totalAssigned > 0 
      ? Math.round(((totalAssigned - overdue) / totalAssigned) * 100)
      : 100;

    setDashboardStats({
      totalAssigned,
      pending,
      inProgress,
      overdue,
      resolved,
      slaCompliance,
      avgResolutionTime: 2.8, // Mock data
    });
  }, [complaints, user]);

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

  const wardComplaints = Array.isArray(complaints) 
    ? complaints.filter((c) => c.assignedTo === user?.id || c.ward === user?.wardId)
    : [];

  const urgentComplaints = wardComplaints
    .filter((c) => c.priority === "critical" || c.priority === "high")
    .slice(0, 5);

  const recentComplaints = wardComplaints.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Ward Officer Dashboard</h1>
        <p className="opacity-90">
          Manage complaints for {user?.ward?.name || "your assigned ward"} and
          monitor team performance.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Total Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.totalAssigned}
            </div>
            <p className="text-xs text-gray-500">
              Complaints in your ward
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Pending Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardStats.pending}
            </div>
            <p className="text-xs text-gray-500">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardStats.overdue}
            </div>
            <p className="text-xs text-gray-500">Past deadline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              SLA Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats.slaCompliance}%
            </div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="urgent">
            Urgent ({urgentComplaints.length})
          </TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Complaints */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Recent Complaints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentComplaints.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No complaints in your ward
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentComplaints.map((complaint) => (
                        <div key={complaint.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">
                              {complaint.title ||
                                `Complaint #${complaint.id.slice(-6)}`}
                            </h4>
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(complaint.status)}>
                                {complaint.status.replace("_", " ")}
                              </Badge>
                              <Badge className={getPriorityColor(complaint.priority)}>
                                {complaint.priority}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {complaint.description}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <MapPin className="w-4 h-4 mr-1" />
                            {complaint.area}
                            <Calendar className="w-4 h-4 ml-4 mr-1" />
                            {new Date(
                              complaint.submittedOn,
                            ).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" asChild>
                              <Link to={`/complaints/${complaint.id}`}>
                                Manage
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" asChild>
                  <Link to="/assignments">
                    <Users className="w-4 h-4 mr-2" />
                    Assign Complaints ({dashboardStats.pending})
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/urgent">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Handle Urgent ({urgentComplaints.length})
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/reports">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Reports
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Team Communication
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="urgent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Urgent Complaints Requiring Immediate Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {urgentComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No urgent complaints! Great job.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {urgentComplaints.map((complaint) => (
                    <div key={complaint.id} className="border-l-4 border-red-500 pl-4 py-2">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">
                          {complaint.title ||
                            `Complaint #${complaint.id.slice(-6)}`}
                        </h4>
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(complaint.priority)}>
                            {complaint.priority}
                          </Badge>
                          <Badge className={getStatusColor(complaint.status)}>
                            {complaint.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        {complaint.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        {complaint.area}
                        <Calendar className="w-4 h-4 ml-4 mr-1" />
                        {complaint.deadline &&
                          new Date(complaint.deadline).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          Assign Now
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/complaints/${complaint.id}`}>
                            View Details
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

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Complaint Assignment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium mb-2">
                  Unassigned Complaints
                </h3>
                <p className="text-gray-500 mb-4">
                  {dashboardStats.pending} pending
                </p>
                {/* Assignment interface would go here */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    Assignment interface will be implemented here
                  </p>
                  <p className="text-xs text-gray-500">
                    Drag and drop complaints to maintenance team members
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SLA Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Resolution Rate</span>
                    <span className="font-bold">{dashboardStats.slaCompliance}%</span>
                  </div>
                  <Progress value={dashboardStats.slaCompliance} className="h-2" />
                </div>
                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold">
                    {dashboardStats.avgResolutionTime}
                  </div>
                  <div className="text-sm text-gray-500">
                    Average Resolution Time (days)
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Complaints Resolved</span>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-bold">+12%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Response Time</span>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-bold">-8%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Citizen Satisfaction</span>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-bold">4.2/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WardOfficerDashboard;
