import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintsQuery, useUpdateComplaintStatusMutation, } from "../store/api/complaintsApi";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "../components/ui/tabs";
import { Wrench, Clock, CheckCircle, AlertTriangle, MapPin, Calendar, Camera, FileText, BarChart3, TrendingUp, Navigation, Phone, MessageSquare, } from "lucide-react";
const MaintenanceDashboard = () => {
    const { user } = useAppSelector((state) => state.auth);
    const { translations } = useAppSelector((state) => state.language);
    // Fetch complaints assigned to this maintenance team member
    // Let the backend handle role-based filtering automatically for maintenance team
    const { data: complaintsResponse, isLoading, error, refetch: refetchComplaints, } = useGetComplaintsQuery({
        page: 1,
        limit: 100,
    });
    const complaints = useMemo(() => {
        if (Array.isArray(complaintsResponse?.data?.complaints)) {
            return complaintsResponse.data.complaints;
        }
        if (Array.isArray(complaintsResponse?.data)) {
            return complaintsResponse.data;
        }
        return [];
    }, [complaintsResponse]);
    const [updateComplaintStatus] = useUpdateComplaintStatusMutation();
    const dashboardStats = useMemo(() => {
        const assignedTasks = complaints.filter((c) => {
            const assigneeId = c.assignedToId || c.assignedTo?.id || c.assignedTo;
            const maintenanceTeamId = c.maintenanceTeamId || c.maintenanceTeam?.id;
            return ((assigneeId === user?.id || maintenanceTeamId === user?.id) &&
                c.status !== "REGISTERED");
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
        const inProgress = assignedTasks.filter((c) => c.status === "IN_PROGRESS").length;
        const completed = assignedTasks.filter((c) => c.status === "RESOLVED").length;
        const pending = assignedTasks.filter((c) => c.status === "ASSIGNED").length;
        const today = new Date().toDateString();
        const todayTasks = assignedTasks.filter((c) => new Date(c.assignedOn || c.submittedOn).toDateString() === today).length;
        // Calculate average completion time for resolved tasks
        const resolvedTasks = assignedTasks.filter((c) => c.status === "RESOLVED" && c.resolvedOn && c.assignedOn);
        const avgCompletionTime = resolvedTasks.length > 0
            ? resolvedTasks.reduce((acc, task) => {
                const assignedDate = new Date(task.assignedOn);
                const resolvedDate = new Date(task.resolvedOn);
                const diffInDays = (resolvedDate.getTime() - assignedDate.getTime()) /
                    (1000 * 60 * 60 * 24);
                return acc + diffInDays;
            }, 0) / resolvedTasks.length
            : 0;
        // Calculate efficiency as percentage of tasks completed on time
        const tasksWithDeadlines = assignedTasks.filter((c) => c.deadline);
        const onTimeTasks = tasksWithDeadlines.filter((c) => {
            if (c.status === "RESOLVED" && c.resolvedOn) {
                return new Date(c.resolvedOn) <= new Date(c.deadline);
            }
            return c.status !== "RESOLVED" && new Date() <= new Date(c.deadline);
        });
        const efficiency = tasksWithDeadlines.length > 0
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
    const myTasks = useMemo(() => {
        return complaints.filter((c) => {
            const assigneeId = c.assignedToId || c.assignedTo?.id || c.assignedTo;
            const maintenanceTeamId = c.maintenanceTeamId || c.maintenanceTeam?.id;
            return ((assigneeId === user?.id || maintenanceTeamId === user?.id) &&
                c.status !== "REGISTERED");
        });
    }, [complaints, user?.id]);
    const activeTasks = useMemo(() => myTasks
        .filter((c) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS")
        .slice(0, 5), [myTasks]);
    const urgentTasks = useMemo(() => myTasks
        .filter((c) => c.priority === "CRITICAL" || c.priority === "HIGH")
        .slice(0, 3), [myTasks]);
    const handleStatusUpdate = async (complaintId, newStatus) => {
        try {
            await updateComplaintStatus({
                id: complaintId,
                status: newStatus,
            }).unwrap();
            refetchComplaints();
        }
        catch (e) {
            console.error("Failed to update status", e);
        }
    };
    // Loading state
    if (isLoading) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white", children: [_jsx("h1", { className: "text-2xl font-bold mb-2", children: "\uD83D\uDEA7 Maintenance Dashboard \uD83D\uDEE0\uFE0F" }), _jsx("p", { className: "text-green-100", children: "Loading your assigned tasks..." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [...Array(4)].map((_, i) => (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-20 animate-pulse" }), _jsx("div", { className: "h-4 w-4 bg-gray-200 rounded animate-pulse" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "h-8 bg-gray-200 rounded w-12 animate-pulse mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-24 animate-pulse" })] })] }, i))) })] }));
    }
    // Error state
    if (error) {
        return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-6 text-white", children: [_jsx("h1", { className: "text-2xl font-bold mb-2", children: "\u26A0\uFE0F Dashboard Error" }), _jsx("p", { className: "text-red-100", children: "Failed to load your tasks. Please try again." }), _jsx("div", { className: "mt-4", children: _jsxs(Button, { className: "bg-white text-red-600 hover:bg-gray-100", onClick: () => refetchComplaints(), children: [_jsx(AlertTriangle, { className: "h-4 w-4 mr-2" }), "Retry"] }) })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white", children: [_jsx("h1", { className: "text-2xl font-bold mb-2", children: "\uD83D\uDEA7 Maintenance Dashboard \uD83D\uDEE0\uFE0F" }), _jsx("p", { className: "text-green-100", children: "Manage your assigned tasks and track field work progress." }), _jsxs("div", { className: "mt-4 flex space-x-2", children: [_jsxs(Button, { className: "bg-white text-green-600 hover:bg-gray-100", children: [_jsx(Navigation, { className: "h-4 w-4 mr-2" }), "Start Field Work"] }), _jsxs(Button, { variant: "outline", className: "bg-white/10 border-white/20 text-white hover:bg-white/20", onClick: () => refetchComplaints(), children: [_jsx(Clock, { className: "h-4 w-4 mr-2" }), "Refresh Data"] })] })] }), process.env.NODE_ENV === "development" && (_jsxs(Card, { className: "bg-yellow-50 border-yellow-200", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm text-yellow-800", children: "Debug Info (Dev Mode)" }) }), _jsxs(CardContent, { className: "text-xs text-yellow-700", children: [_jsxs("div", { children: ["Total Complaints Fetched: ", complaints.length] }), _jsxs("div", { children: ["User ID: ", user?.id] }), _jsxs("div", { children: ["User Role: ", user?.role] }), _jsxs("div", { children: ["My Tasks Count: ", myTasks.length] }), complaints.length > 0 && (_jsxs("div", { children: ["Sample Task:", " ", JSON.stringify(complaints[0], null, 2).substring(0, 200), "..."] }))] })] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Tasks" }), _jsx(Wrench, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: dashboardStats.totalTasks }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Assigned to you" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Today's Tasks" }), _jsx(Calendar, { className: "h-4 w-4 text-blue-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: dashboardStats.todayTasks }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Scheduled for today" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "In Progress" }), _jsx(Clock, { className: "h-4 w-4 text-orange-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: dashboardStats.inProgress }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Currently working on" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Efficiency" }), _jsx(TrendingUp, { className: "h-4 w-4 text-green-600" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold text-green-600", children: [dashboardStats.efficiency, "%"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "This month" })] })] })] }), _jsxs(Tabs, { defaultValue: "active", className: "space-y-4", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsxs(TabsTrigger, { value: "active", children: ["Active Tasks (", activeTasks.length, ")"] }), _jsxs(TabsTrigger, { value: "urgent", children: ["Urgent (", urgentTasks.length, ")"] }), _jsx(TabsTrigger, { value: "completed", children: "Completed" }), _jsx(TabsTrigger, { value: "tools", children: "Tools & Reports" })] }), _jsx(TabsContent, { value: "active", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs(Card, { className: "lg:col-span-2", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Wrench, { className: "h-5 w-5 mr-2" }), "Active Tasks"] }) }), _jsx(CardContent, { children: activeTasks.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(CheckCircle, { className: "h-12 w-12 mx-auto text-green-400 mb-4" }), _jsx("p", { className: "text-gray-500", children: "No active tasks" }), _jsx("p", { className: "text-sm text-gray-400", children: "Great job! All caught up." })] })) : (_jsx("div", { className: "space-y-4", children: activeTasks.map((task) => (_jsxs("div", { className: "border rounded-lg p-4 hover:bg-gray-50 transition-colors", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h3", { className: "font-medium text-sm", children: task.title || `Task #${task.id.slice(-6)}` }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Badge, { className: getStatusColor(task.status), children: task.status.replace("_", " ") }), _jsx(Badge, { className: getPriorityColor(task.priority), children: task.priority })] })] }), _jsx("p", { className: "text-sm text-gray-600 mb-3 line-clamp-2", children: task.description }), _jsxs("div", { className: "flex items-center text-xs text-gray-500 mb-3", children: [_jsx(MapPin, { className: "h-3 w-3 mr-1" }), task.area, ", ", task.landmark, _jsx(Calendar, { className: "h-3 w-3 ml-3 mr-1" }), "Due:", " ", task.deadline
                                                                    ? new Date(task.deadline).toLocaleDateString()
                                                                    : "No deadline"] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { size: "sm", variant: "outline", children: [_jsx(Navigation, { className: "h-3 w-3 mr-1" }), "Navigate"] }), _jsxs(Button, { size: "sm", variant: "outline", children: [_jsx(Phone, { className: "h-3 w-3 mr-1" }), "Call Citizen"] })] }), _jsxs("div", { className: "flex space-x-2", children: [task.status === "ASSIGNED" && (_jsx(Button, { size: "sm", onClick: () => handleStatusUpdate(task.id, "IN_PROGRESS"), children: "Start Work" })), task.status === "IN_PROGRESS" && (_jsx(Button, { size: "sm", onClick: () => handleStatusUpdate(task.id, "RESOLVED"), children: "Mark Complete" })), _jsx(Link, { to: `/tasks/${task.id}`, children: _jsx(Button, { size: "sm", variant: "outline", children: "Details" }) })] })] })] }, task.id))) })) })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Quick Actions" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs(Button, { className: "w-full justify-start", children: [_jsx(Camera, { className: "h-4 w-4 mr-2" }), "Take Work Photo"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "Submit Report"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(MessageSquare, { className: "h-4 w-4 mr-2" }), "Contact Supervisor"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Navigation, { className: "h-4 w-4 mr-2" }), "View Route Map"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Progress Stats" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: "Tasks Completed" }), _jsxs("span", { children: [dashboardStats.totalTasks > 0
                                                                                    ? Math.round((dashboardStats.completed /
                                                                                        dashboardStats.totalTasks) *
                                                                                        100)
                                                                                    : 0, "%"] })] }), _jsx(Progress, { value: dashboardStats.totalTasks > 0
                                                                        ? (dashboardStats.completed /
                                                                            dashboardStats.totalTasks) *
                                                                            100
                                                                        : 0, className: "h-2" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: dashboardStats.avgCompletionTime }), _jsx("p", { className: "text-xs text-gray-500", children: "Avg. Completion Time (days)" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-lg font-bold text-blue-600", children: dashboardStats.completed }), _jsx("p", { className: "text-xs text-gray-500", children: "Tasks Completed This Month" })] })] })] })] })] }) }), _jsx(TabsContent, { value: "urgent", className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center text-red-600", children: [_jsx(AlertTriangle, { className: "h-5 w-5 mr-2" }), "Urgent Tasks Requiring Immediate Attention"] }) }), _jsx(CardContent, { children: urgentTasks.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(CheckCircle, { className: "h-12 w-12 mx-auto text-green-400 mb-4" }), _jsx("p", { className: "text-gray-500", children: "No urgent tasks! Well done!" })] })) : (_jsx("div", { className: "space-y-4", children: urgentTasks.map((task) => (_jsxs("div", { className: "border-l-4 border-red-500 bg-red-50 rounded-lg p-4", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h3", { className: "font-medium text-sm", children: task.title || `Task #${task.id.slice(-6)}` }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Badge, { className: "bg-red-100 text-red-800", children: task.priority }), _jsx(Badge, { className: getStatusColor(task.status), children: task.status.replace("_", " ") })] })] }), _jsx("p", { className: "text-sm text-gray-700 mb-3", children: task.description }), _jsxs("div", { className: "flex items-center text-xs text-gray-600 mb-3", children: [_jsx(MapPin, { className: "h-3 w-3 mr-1" }), task.area, _jsx(Clock, { className: "h-3 w-3 ml-3 mr-1" }), "Due:", " ", task.deadline
                                                            ? new Date(task.deadline).toLocaleDateString()
                                                            : "ASAP"] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { size: "sm", variant: "outline", children: [_jsx(Navigation, { className: "h-3 w-3 mr-1" }), "Navigate"] }), _jsxs(Button, { size: "sm", variant: "outline", children: [_jsx(Phone, { className: "h-3 w-3 mr-1" }), "Emergency Contact"] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { size: "sm", variant: "destructive", children: "Start Immediately" }), _jsx(Link, { to: `/tasks/${task.id}`, children: _jsx(Button, { size: "sm", variant: "outline", children: "Details" }) })] })] })] }, task.id))) })) })] }) }), _jsx(TabsContent, { value: "completed", className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recently Completed Tasks" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: myTasks
                                            .filter((task) => task.status === "RESOLVED")
                                            .slice(0, 10)
                                            .map((task) => (_jsx("div", { className: "border rounded-lg p-4 bg-green-50", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm", children: task.title || `Task #${task.id.slice(-6)}` }), _jsxs("p", { className: "text-xs text-gray-600 mt-1", children: ["Completed on", " ", task.resolvedOn
                                                                        ? new Date(task.resolvedOn).toLocaleDateString()
                                                                        : "Recently"] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(CheckCircle, { className: "h-5 w-5 text-green-600" }), _jsx(Link, { to: `/tasks/${task.id}`, children: _jsx(Button, { size: "sm", variant: "outline", children: "View Report" }) })] })] }) }, task.id))) }) })] }) }), _jsx(TabsContent, { value: "tools", className: "space-y-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Field Tools" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs(Button, { className: "w-full justify-start", children: [_jsx(Camera, { className: "h-4 w-4 mr-2" }), "Photo Documentation"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Navigation, { className: "h-4 w-4 mr-2" }), "GPS Navigation"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "Work Order Scanner"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(MessageSquare, { className: "h-4 w-4 mr-2" }), "Incident Reporting"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Reports & Analytics" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(BarChart3, { className: "h-4 w-4 mr-2" }), "Daily Work Report"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(TrendingUp, { className: "h-4 w-4 mr-2" }), "Performance Summary"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Calendar, { className: "h-4 w-4 mr-2" }), "Time Tracking"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "Completion Certificate"] })] })] })] }) })] })] }));
};
export default MaintenanceDashboard;
