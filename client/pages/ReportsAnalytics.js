import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "../components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, } from "recharts";
import { FileText, TrendingUp, TrendingDown, Clock, CheckCircle, Target, RefreshCw, } from "lucide-react";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
const ReportsAnalytics = () => {
    const dispatch = useAppDispatch();
    const { translations } = useAppSelector((state) => state.language);
    const [dateRange, setDateRange] = useState("30d");
    const [selectedWard, setSelectedWard] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isExporting, setIsExporting] = useState(false);
    // Mock analytics data
    const [analyticsData] = useState({
        complaints: {
            total: 1248,
            resolved: 1094,
            pending: 154,
            overdue: 23,
        },
        sla: {
            compliance: 87.6,
            avgResolutionTime: 2.3,
            target: 3.0,
        },
        trends: [
            { date: "2024-01", complaints: 98, resolved: 89, slaCompliance: 85 },
            { date: "2024-02", complaints: 112, resolved: 98, slaCompliance: 88 },
            { date: "2024-03", complaints: 87, resolved: 82, slaCompliance: 92 },
            { date: "2024-04", complaints: 134, resolved: 121, slaCompliance: 89 },
            { date: "2024-05", complaints: 156, resolved: 142, slaCompliance: 87 },
            { date: "2024-06", complaints: 143, resolved: 138, slaCompliance: 91 },
        ],
        wards: [
            {
                id: "ward1",
                name: "Ward 1 - Central",
                complaints: 245,
                resolved: 228,
                avgTime: 2.1,
                slaScore: 93,
                coordinates: { lat: 9.9312, lng: 76.2673 },
            },
            {
                id: "ward2",
                name: "Ward 2 - North",
                complaints: 198,
                resolved: 182,
                avgTime: 2.8,
                slaScore: 89,
                coordinates: { lat: 9.9816, lng: 76.2999 },
            },
            {
                id: "ward3",
                name: "Ward 3 - South",
                complaints: 312,
                resolved: 267,
                avgTime: 3.2,
                slaScore: 82,
                coordinates: { lat: 9.8997, lng: 76.2749 },
            },
        ],
        categories: [
            { name: "Water Supply", count: 356, avgTime: 2.1, color: "#3B82F6" },
            { name: "Electricity", count: 287, avgTime: 1.8, color: "#EF4444" },
            { name: "Road Repair", count: 234, avgTime: 4.2, color: "#10B981" },
            { name: "Garbage", count: 198, avgTime: 1.5, color: "#F59E0B" },
            { name: "Street Lighting", count: 173, avgTime: 2.3, color: "#8B5CF6" },
        ],
        performance: [
            { metric: "Response Time", current: 2.3, target: 4.0, change: -12 },
            { metric: "Resolution Rate", current: 87.6, target: 85.0, change: 8 },
            { metric: "Citizen Satisfaction", current: 4.2, target: 4.0, change: 5 },
            { metric: "SLA Compliance", current: 89.2, target: 85.0, change: 3 },
        ],
    });
    const exportReport = async (format) => {
        setIsExporting(true);
        try {
            // Simulate export process
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const fileName = `complaint-report-${dateRange}.${format}`;
            dispatch(showSuccessToast("Export Successful", `Report exported as ${fileName}`));
        }
        catch (error) {
            dispatch(showErrorToast("Export Failed", "Failed to export report"));
        }
        finally {
            setIsExporting(false);
        }
    };
    const generateHeatmapData = () => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const hours = Array.from({ length: 24 }, (_, i) => i);
        return days.flatMap((day, dayIndex) => hours.map((hour) => ({
            day: dayIndex,
            hour,
            value: Math.floor(Math.random() * 50) + 1,
            dayName: day,
        })));
    };
    const heatmapData = generateHeatmapData();
    const HeatmapCell = ({ x, y, width, height, value }) => {
        const intensity = Math.min(value / 50, 1);
        return (_jsx("rect", { x: x, y: y, width: width, height: height, fill: `rgba(59, 130, 246, ${intensity})`, stroke: "#fff", strokeWidth: 1, rx: 2 }));
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: translations?.admin?.reportsAnalytics || "Reports & Analytics" }), _jsx("p", { className: "text-muted-foreground", children: "Comprehensive insights and performance metrics" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Select, { value: dateRange, onValueChange: setDateRange, children: [_jsx(SelectTrigger, { className: "w-32", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "7d", children: "Last 7 days" }), _jsx(SelectItem, { value: "30d", children: "Last 30 days" }), _jsx(SelectItem, { value: "90d", children: "Last 90 days" }), _jsx(SelectItem, { value: "1y", children: "Last year" })] })] }), _jsxs(Button, { variant: "outline", children: [_jsx(RefreshCw, { className: "mr-2 h-4 w-4" }), "Refresh"] }), _jsxs(Select, { value: "pdf", onValueChange: (value) => exportReport(value), children: [_jsx(SelectTrigger, { className: "w-32", children: _jsx(SelectValue, { placeholder: "Export" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "pdf", children: "PDF Report" }), _jsx(SelectItem, { value: "excel", children: "Excel File" }), _jsx(SelectItem, { value: "csv", children: "CSV Data" })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Complaints" }), _jsx(FileText, { className: "h-4 w-4 text-blue-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: analyticsData.complaints.total }), _jsx("p", { className: "text-xs text-muted-foreground", children: "+12% from last month" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Resolution Rate" }), _jsx(CheckCircle, { className: "h-4 w-4 text-green-600" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold", children: [((analyticsData.complaints.resolved /
                                                analyticsData.complaints.total) *
                                                100).toFixed(1), "%"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "+5% improvement" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Avg Resolution Time" }), _jsx(Clock, { className: "h-4 w-4 text-orange-600" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold", children: [analyticsData.sla.avgResolutionTime, "d"] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Target: ", analyticsData.sla.target, "d"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "SLA Compliance" }), _jsx(Target, { className: "h-4 w-4 text-purple-600" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold", children: [analyticsData.sla.compliance, "%"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Above target (85%)" })] })] })] }), _jsxs(Tabs, { defaultValue: "overview", className: "space-y-4", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-6", children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "trends", children: "Trends" }), _jsx(TabsTrigger, { value: "heatmap", children: "Heatmap" }), _jsx(TabsTrigger, { value: "performance", children: "Performance" }), _jsx(TabsTrigger, { value: "wards", children: "Ward Analysis" }), _jsx(TabsTrigger, { value: "categories", children: "Categories" })] }), _jsxs(TabsContent, { value: "overview", className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Complaint Trends (6 Months)" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(ComposedChart, { data: analyticsData.trends, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, { yAxisId: "left" }), _jsx(YAxis, { yAxisId: "right", orientation: "right" }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { yAxisId: "left", dataKey: "complaints", fill: "#3B82F6" }), _jsx(Bar, { yAxisId: "left", dataKey: "resolved", fill: "#10B981" }), _jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "slaCompliance", stroke: "#F59E0B", strokeWidth: 3 })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Complaints by Category" }) }), _jsxs(CardContent, { children: [_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: analyticsData.categories, cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 120, paddingAngle: 5, dataKey: "count", children: analyticsData.categories.map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) }), _jsx(Tooltip, {})] }) }), _jsx("div", { className: "mt-4 space-y-2", children: analyticsData.categories.map((category, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: category.color } }), _jsx("span", { className: "text-sm", children: category.name })] }), _jsxs("div", { className: "text-sm text-muted-foreground", children: [category.count, " (", category.avgTime, "d avg)"] })] }, index))) })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Key Performance Indicators" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: analyticsData.performance.map((metric, index) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: metric.metric }), _jsxs("div", { className: "flex items-center space-x-1", children: [metric.change > 0 ? (_jsx(TrendingUp, { className: "h-3 w-3 text-green-600" })) : (_jsx(TrendingDown, { className: "h-3 w-3 text-red-600" })), _jsxs("span", { className: `text-xs ${metric.change > 0
                                                                            ? "text-green-600"
                                                                            : "text-red-600"}`, children: [Math.abs(metric.change), "%"] })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("span", { children: ["Current: ", metric.current] }), _jsxs("span", { children: ["Target: ", metric.target] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-primary h-2 rounded-full", style: {
                                                                        width: `${Math.min((metric.current / metric.target) * 100, 100)}%`,
                                                                    } }) })] })] }, index))) }) })] })] }), _jsx(TabsContent, { value: "trends", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Detailed Trend Analysis" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 400, children: _jsxs(AreaChart, { data: analyticsData.trends, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Area, { type: "monotone", dataKey: "complaints", stackId: "1", stroke: "#3B82F6", fill: "#3B82F6", fillOpacity: 0.6 }), _jsx(Area, { type: "monotone", dataKey: "resolved", stackId: "2", stroke: "#10B981", fill: "#10B981", fillOpacity: 0.6 })] }) }) })] }) }), _jsx(TabsContent, { value: "heatmap", className: "space-y-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Complaint Activity Heatmap" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Peak hours and days for complaint submissions" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-sm", children: "Days of Week vs Hours" }), _jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsx("span", { children: "Low" }), _jsx("div", { className: "w-20 h-3 bg-gradient-to-r from-blue-100 to-blue-600 rounded" }), _jsx("span", { children: "High" })] })] }), _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(ScatterChart, { children: [_jsx(XAxis, { type: "number", dataKey: "hour", domain: [0, 23], ticks: [0, 6, 12, 18, 23] }), _jsx(YAxis, { type: "number", dataKey: "day", domain: [0, 6], tickFormatter: (value) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][value] }), _jsx(Tooltip, { content: ({ active, payload }) => {
                                                                if (active && payload && payload[0]) {
                                                                    const data = payload[0].payload;
                                                                    return (_jsxs("div", { className: "bg-white p-2 border rounded shadow", children: [_jsxs("p", { children: [data.dayName, " ", data.hour, ":00"] }), _jsxs("p", { children: ["Complaints: ", data.value] })] }));
                                                                }
                                                                return null;
                                                            } }), _jsx(Scatter, { data: heatmapData, shape: HeatmapCell })] }) })] }) })] }) }), _jsx(TabsContent, { value: "performance", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "SLA Performance Over Time" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: analyticsData.trends, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "slaCompliance", stroke: "#8B5CF6", strokeWidth: 3 })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Resolution Time Distribution" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: [
                                                    { range: "< 1 day", count: 342, percentage: 27 },
                                                    { range: "1-2 days", count: 456, percentage: 37 },
                                                    { range: "2-3 days", count: 298, percentage: 24 },
                                                    { range: "3-5 days", count: 124, percentage: 10 },
                                                    { range: "> 5 days", count: 28, percentage: 2 },
                                                ].map((item, index) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm font-medium", children: item.range }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [item.count, " (", item.percentage, "%)"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-primary h-2 rounded-full", style: { width: `${item.percentage}%` } }) })] }, index))) }) })] })] }) }), _jsx(TabsContent, { value: "wards", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Ward Performance Comparison" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 400, children: _jsxs(BarChart, { data: analyticsData.wards, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, { yAxisId: "left" }), _jsx(YAxis, { yAxisId: "right", orientation: "right" }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { yAxisId: "left", dataKey: "complaints", fill: "#3B82F6" }), _jsx(Bar, { yAxisId: "left", dataKey: "resolved", fill: "#10B981" }), _jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "slaScore", stroke: "#F59E0B" })] }) }) })] }) }), _jsx(TabsContent, { value: "categories", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Category Analysis" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 400, children: _jsxs(BarChart, { data: analyticsData.categories, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, { yAxisId: "left" }), _jsx(YAxis, { yAxisId: "right", orientation: "right" }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { yAxisId: "left", dataKey: "count", fill: "#3B82F6" }), _jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "avgTime", stroke: "#EF4444" })] }) }) })] }) })] }), isExporting && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsx(Card, { className: "w-80", children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: "Generating Report" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Please wait while we compile your analytics data..." })] })] }) }) }) }))] }));
};
export default ReportsAnalytics;
