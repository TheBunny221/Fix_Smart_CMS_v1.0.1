import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { CheckSquare, Calendar, User, MapPin, Clock, AlertTriangle, } from "lucide-react";
const WardTasks = () => {
    const mockTasks = [
        {
            id: "1",
            title: "Water Supply Issue - MG Road",
            priority: "HIGH",
            status: "PENDING",
            assignedTo: "Maintenance Team A",
            dueDate: "2024-01-15",
            location: "MG Road, Ward 1",
        },
        {
            id: "2",
            title: "Street Light Repair - Broadway",
            priority: "MEDIUM",
            status: "IN_PROGRESS",
            assignedTo: "Electrical Team",
            dueDate: "2024-01-16",
            location: "Broadway, Ward 1",
        },
        {
            id: "3",
            title: "Road Pothole Repair - Marine Drive",
            priority: "LOW",
            status: "COMPLETED",
            assignedTo: "Road Maintenance",
            dueDate: "2024-01-10",
            location: "Marine Drive, Ward 3",
        },
    ];
    const getPriorityColor = (priority) => {
        switch (priority) {
            case "HIGH":
                return "bg-red-100 text-red-800";
            case "MEDIUM":
                return "bg-yellow-100 text-yellow-800";
            case "LOW":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-100 text-yellow-800";
            case "IN_PROGRESS":
                return "bg-blue-100 text-blue-800";
            case "COMPLETED":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Ward Tasks" }), _jsx("p", { className: "text-gray-600", children: "Manage and track tasks assigned to your ward" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Tasks" }), _jsx("p", { className: "text-2xl font-bold", children: "12" })] }), _jsx(CheckSquare, { className: "h-8 w-8 text-blue-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Pending" }), _jsx("p", { className: "text-2xl font-bold text-yellow-600", children: "4" })] }), _jsx(Clock, { className: "h-8 w-8 text-yellow-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "In Progress" }), _jsx("p", { className: "text-2xl font-bold text-blue-600", children: "5" })] }), _jsx(AlertTriangle, { className: "h-8 w-8 text-blue-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Completed" }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: "3" })] }), _jsx(CheckSquare, { className: "h-8 w-8 text-green-600" })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Tasks" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: mockTasks.map((task) => (_jsxs("div", { className: "border rounded-lg p-4 hover:bg-gray-50", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h3", { className: "font-medium", children: task.title }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Badge, { className: getPriorityColor(task.priority), children: task.priority }), _jsx(Badge, { className: getStatusColor(task.status), children: task.status })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "h-4 w-4 mr-1" }), task.assignedTo] }), _jsxs("div", { className: "flex items-center", children: [_jsx(MapPin, { className: "h-4 w-4 mr-1" }), task.location] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1" }), "Due: ", task.dueDate] })] }), _jsxs("div", { className: "mt-3 flex justify-end space-x-2", children: [_jsx(Button, { variant: "outline", size: "sm", children: "View Details" }), _jsx(Button, { size: "sm", children: "Update Status" })] })] }, task.id))) }) })] })] }));
};
export default WardTasks;
