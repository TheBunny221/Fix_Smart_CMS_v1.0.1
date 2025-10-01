import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, } from "recharts";
import { TrendingUp, BarChart3, Users, Clock, Target, Download, RefreshCw, } from "lucide-react";
const AdminAnalytics = () => {
    // Mock data for charts
    const complaintTrends = [
        { month: "Jan", complaints: 45, resolved: 40, satisfaction: 4.2 },
        { month: "Feb", complaints: 52, resolved: 48, satisfaction: 4.1 },
        { month: "Mar", complaints: 61, resolved: 55, satisfaction: 4.3 },
        { month: "Apr", complaints: 38, resolved: 42, satisfaction: 4.5 },
        { month: "May", complaints: 67, resolved: 61, satisfaction: 4.2 },
        { month: "Jun", complaints: 74, resolved: 69, satisfaction: 4.4 },
    ];
    const wardPerformance = [
        {
            ward: "Ward 1",
            complaints: 45,
            resolved: 42,
            efficiency: 93,
            avgTime: 2.1,
        },
        {
            ward: "Ward 2",
            complaints: 38,
            resolved: 35,
            efficiency: 92,
            avgTime: 2.3,
        },
        {
            ward: "Ward 3",
            complaints: 52,
            resolved: 46,
            efficiency: 88,
            avgTime: 2.8,
        },
        {
            ward: "Ward 4",
            complaints: 29,
            resolved: 28,
            efficiency: 97,
            avgTime: 1.9,
        },
        {
            ward: "Ward 5",
            complaints: 41,
            resolved: 37,
            efficiency: 90,
            avgTime: 2.5,
        },
    ];
    const complaintTypes = [
        { name: "Water Supply", value: 35, color: "#3B82F6", resolved: 32 },
        { name: "Electricity", value: 28, color: "#EF4444", resolved: 25 },
        { name: "Road Repair", value: 22, color: "#10B981", resolved: 20 },
        { name: "Garbage", value: 15, color: "#F59E0B", resolved: 14 },
    ];
    const resolutionTimes = [
        { timeRange: "< 1 day", count: 45, percentage: 35 },
        { timeRange: "1-3 days", count: 52, percentage: 40 },
        { timeRange: "3-7 days", count: 25, percentage: 20 },
        { timeRange: "> 7 days", count: 8, percentage: 5 },
    ];
    const teamEfficiency = [
        { team: "Electrical", efficiency: 95, workload: 18, satisfaction: 4.6 },
        { team: "Water Works", efficiency: 92, workload: 22, satisfaction: 4.3 },
        {
            team: "Road Maintenance",
            efficiency: 88,
            workload: 15,
            satisfaction: 4.1,
        },
        { team: "Sanitation", efficiency: 97, workload: 12, satisfaction: 4.7 },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "System Analytics" }), _jsx("p", { className: "text-gray-600", children: "Comprehensive analytics and insights" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { variant: "outline", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Refresh Data"] }), _jsxs(Button, { children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Export Report"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Complaints" }), _jsx("p", { className: "text-2xl font-bold", children: "1,247" }), _jsx("p", { className: "text-xs text-green-600", children: "\u2191 12% from last month" })] }), _jsx(BarChart3, { className: "h-8 w-8 text-blue-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Resolution Rate" }), _jsx("p", { className: "text-2xl font-bold", children: "92.3%" }), _jsx("p", { className: "text-xs text-green-600", children: "\u2191 3% from last month" })] }), _jsx(Target, { className: "h-8 w-8 text-green-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Avg Resolution" }), _jsx("p", { className: "text-2xl font-bold", children: "2.3 days" }), _jsx("p", { className: "text-xs text-green-600", children: "\u2193 0.5 days improved" })] }), _jsx(Clock, { className: "h-8 w-8 text-orange-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Satisfaction" }), _jsx("p", { className: "text-2xl font-bold", children: "4.3/5" }), _jsx("p", { className: "text-xs text-green-600", children: "\u2191 0.2 points" })] }), _jsx(TrendingUp, { className: "h-8 w-8 text-purple-600" })] }) }) })] }), _jsxs(Tabs, { defaultValue: "trends", className: "space-y-4", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsx(TabsTrigger, { value: "trends", children: "Trends" }), _jsx(TabsTrigger, { value: "performance", children: "Performance" }), _jsx(TabsTrigger, { value: "types", children: "Complaint Types" }), _jsx(TabsTrigger, { value: "teams", children: "Team Analytics" })] }), _jsxs(TabsContent, { value: "trends", className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Monthly Complaint Trends" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: complaintTrends, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "month", tick: { fontSize: 12 }, angle: -45, textAnchor: "end", height: 60 }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(Tooltip, { formatter: (value, name) => [
                                                                    value,
                                                                    name === "complaints"
                                                                        ? "Complaints"
                                                                        : name === "resolved"
                                                                            ? "Resolved"
                                                                            : name,
                                                                ], labelFormatter: (label) => `Month: ${label}` }), _jsx(Area, { type: "monotone", dataKey: "complaints", stackId: "1", stroke: "#3B82F6", fill: "#3B82F6", fillOpacity: 0.6 }), _jsx(Area, { type: "monotone", dataKey: "resolved", stackId: "2", stroke: "#10B981", fill: "#10B981", fillOpacity: 0.6 })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Citizen Satisfaction Trends" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: complaintTrends, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "month", tick: { fontSize: 12 }, angle: -45, textAnchor: "end", height: 60 }), _jsx(YAxis, { domain: [3.5, 5], tick: { fontSize: 12 } }), _jsx(Tooltip, { formatter: (value, name) => [
                                                                    `${value}/5`,
                                                                    "Satisfaction Score",
                                                                ], labelFormatter: (label) => `Month: ${label}` }), _jsx(Line, { type: "monotone", dataKey: "satisfaction", stroke: "#F59E0B", strokeWidth: 3 })] }) }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Resolution Time Distribution" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: resolutionTimes.map((item, index) => (_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center space-x-4 flex-1", children: [_jsx("span", { className: "text-sm font-medium w-20", children: item.timeRange }), _jsx(Progress, { value: item.percentage, className: "flex-1" }), _jsxs("span", { className: "text-sm text-gray-600 w-16 text-right", children: [item.count, " cases"] })] }) }, index))) }) })] })] }), _jsx(TabsContent, { value: "performance", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Ward Performance Comparison" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: wardPerformance, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "ward", tick: { fontSize: 12 }, angle: -45, textAnchor: "end", height: 60 }), _jsx(YAxis, { tick: { fontSize: 12 } }), _jsx(Tooltip, { formatter: (value, name) => [`${value}%`, "Efficiency"], labelFormatter: (label) => `Ward: ${label}` }), _jsx(Bar, { dataKey: "efficiency", fill: "#3B82F6" })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Ward Performance Details" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: wardPerformance.map((ward, index) => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("h3", { className: "font-medium", children: ward.ward }), _jsxs(Badge, { className: `${ward.efficiency >= 95
                                                                        ? "bg-green-100 text-green-800"
                                                                        : ward.efficiency >= 90
                                                                            ? "bg-yellow-100 text-yellow-800"
                                                                            : "bg-red-100 text-red-800"}`, children: [ward.efficiency, "%"] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-sm", children: [_jsx("div", { children: _jsxs("p", { className: "text-gray-600", children: ["Total: ", ward.complaints] }) }), _jsx("div", { children: _jsxs("p", { className: "text-gray-600", children: ["Resolved: ", ward.resolved] }) }), _jsx("div", { children: _jsxs("p", { className: "text-gray-600", children: ["Avg: ", ward.avgTime, "d"] }) })] })] }, index))) }) })] })] }) }), _jsx(TabsContent, { value: "types", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Complaint Types Distribution" }) }), _jsxs(CardContent, { children: [_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: complaintTypes, cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 120, paddingAngle: 5, dataKey: "value", children: complaintTypes.map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value, name) => [
                                                                    `${value} complaints`,
                                                                    "Count",
                                                                ], labelFormatter: (label) => `Type: ${label}` })] }) }), _jsx("div", { className: "grid grid-cols-2 gap-2 mt-4", children: complaintTypes.map((item, index) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: item.color } }), _jsx("span", { className: "text-sm", children: item.name })] }, index))) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Resolution Performance by Type" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: complaintTypes.map((type, index) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm font-medium", children: type.name }), _jsxs("span", { className: "text-sm text-gray-600", children: [type.resolved, "/", type.value, " (", Math.round((type.resolved / type.value) * 100), "%)"] })] }), _jsx(Progress, { value: (type.resolved / type.value) * 100, className: "h-2" })] }, index))) }) })] })] }) }), _jsx(TabsContent, { value: "teams", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Users, { className: "h-5 w-5 mr-2" }), "Team Efficiency Analytics"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: teamEfficiency.map((team, index) => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsx("h3", { className: "font-medium mb-3", children: team.team }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: "Efficiency" }), _jsxs("span", { children: [team.efficiency, "%"] })] }), _jsx(Progress, { value: team.efficiency, className: "h-2" })] }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsxs("p", { children: ["Active Jobs: ", team.workload] }), _jsxs("p", { children: ["Satisfaction: ", team.satisfaction, "/5"] })] })] })] }, index))) }) })] }) })] })] }));
};
export default AdminAnalytics;
