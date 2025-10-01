import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "../components/ui/tabs";
import { PlusCircle, FileText, Clock, CheckCircle, Calendar, Eye, Search, Bell, Settings, TrendingUp, } from "lucide-react";
import QuickComplaintModal from "../components/QuickComplaintModal";
// Mock data - in real app this would come from API
const mockProfile = {
    fullName: "John Doe",
    email: "john.doe@example.com",
    phoneNumber: "+91-9876543210",
    address: "123 Marine Drive, Fort Kochi",
    joinedDate: "2024-01-15",
    totalRequests: 12,
    resolvedRequests: 8,
};
const mockComplaints = [
    {
        id: "CMP001",
        title: "Water Supply Issue",
        type: "WATER_SUPPLY",
        status: "IN_PROGRESS",
        priority: "HIGH",
        submittedOn: "2024-01-20",
        ward: "Fort Kochi",
        description: "No water supply for 3 days",
    },
    {
        id: "CMP002",
        title: "Street Light Repair",
        type: "STREET_LIGHTING",
        status: "RESOLVED",
        priority: "MEDIUM",
        submittedOn: "2024-01-15",
        resolvedOn: "2024-01-18",
        ward: "Fort Kochi",
        description: "Street light not working on Marine Drive",
    },
];
const mockServiceRequests = [
    {
        id: "SRV001",
        title: "Birth Certificate",
        type: "BIRTH_CERTIFICATE",
        status: "PROCESSING",
        submittedOn: "2024-01-22",
        expectedCompletion: "2024-01-29",
        description: "Birth certificate for newborn",
    },
    {
        id: "SRV002",
        title: "Trade License Renewal",
        type: "TRADE_LICENSE",
        status: "APPROVED",
        submittedOn: "2024-01-10",
        completedOn: "2024-01-25",
        description: "Renewal of trade license for restaurant",
    },
];
const mockPayments = [
    {
        id: "PAY001",
        description: "Property Tax - Q1 2024",
        amount: 15000,
        status: "PAID",
        paidOn: "2024-01-15",
        method: "Online Banking",
    },
    {
        id: "PAY002",
        description: "Trade License Fee",
        amount: 5000,
        status: "PAID",
        paidOn: "2024-01-25",
        method: "Credit Card",
    },
    {
        id: "PAY003",
        description: "Water Connection Fee",
        amount: 2500,
        status: "PENDING",
        dueDate: "2024-02-05",
    },
];
const mockNotifications = [
    {
        id: "NOT001",
        title: "Complaint Status Update",
        message: "Your water supply complaint has been assigned to a technician",
        type: "COMPLAINT_UPDATE",
        timestamp: "2024-01-23T10:30:00Z",
        read: false,
    },
    {
        id: "NOT002",
        title: "Service Request Approved",
        message: "Your trade license renewal has been approved",
        type: "SERVICE_UPDATE",
        timestamp: "2024-01-25T14:15:00Z",
        read: true,
    },
];
const GuestDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [searchTerm, setSearchTerm] = useState("");
    const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
    const getStatusColor = (status) => {
        switch (status) {
            case "REGISTERED":
            case "PROCESSING":
                return "bg-yellow-100 text-yellow-800";
            case "ASSIGNED":
                return "bg-blue-100 text-blue-800";
            case "IN_PROGRESS":
                return "bg-orange-100 text-orange-800";
            case "RESOLVED":
            case "APPROVED":
            case "PAID":
                return "bg-green-100 text-green-800";
            case "CLOSED":
                return "bg-gray-100 text-gray-800";
            case "PENDING":
                return "bg-red-100 text-red-800";
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
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 py-8", children: [_jsxs("div", { className: "max-w-7xl mx-auto px-4", children: [_jsx("div", { className: "bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white mb-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold mb-2", children: ["Welcome back, ", mockProfile.fullName, "!"] }), _jsx("p", { className: "text-blue-100", children: "Manage your complaints, service requests, and profile" })] }), _jsxs("div", { className: "hidden md:flex items-center space-x-4", children: [_jsxs(Button, { onClick: () => setIsQuickFormOpen(true), className: "bg-white text-blue-600 hover:bg-gray-50", children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "New Complaint"] }), _jsxs(Button, { onClick: () => navigate("/guest/service-request"), variant: "outline", className: "border-white text-white hover:bg-white hover:text-blue-600", children: [_jsx(FileText, { className: "mr-2 h-4 w-4" }), "New Service Request"] })] })] }) }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "space-y-6", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-6", children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "complaints", children: "Complaints" }), _jsx(TabsTrigger, { value: "services", children: "Services" }), _jsx(TabsTrigger, { value: "payments", children: "Payments" }), _jsx(TabsTrigger, { value: "notifications", children: "Notifications" }), _jsx(TabsTrigger, { value: "profile", children: "Profile" })] }), _jsxs(TabsContent, { value: "overview", className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Requests" }), _jsx(FileText, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: mockProfile.totalRequests }), _jsx("p", { className: "text-xs text-muted-foreground", children: "All time submissions" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Resolved" }), _jsx(CheckCircle, { className: "h-4 w-4 text-green-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: mockProfile.resolvedRequests }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Successfully resolved" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "In Progress" }), _jsx(Clock, { className: "h-4 w-4 text-orange-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: mockProfile.totalRequests - mockProfile.resolvedRequests }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Being worked on" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Success Rate" }), _jsx(TrendingUp, { className: "h-4 w-4 text-blue-600" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold text-blue-600", children: [Math.round((mockProfile.resolvedRequests /
                                                                        mockProfile.totalRequests) *
                                                                        100), "%"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Resolution rate" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Recent Complaints" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "space-y-4", children: mockComplaints.slice(0, 3).map((complaint) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-medium text-sm", children: complaint.title }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["ID: ", complaint.id] })] }), _jsx(Badge, { className: getStatusColor(complaint.status), children: complaint.status.replace("_", " ") })] }, complaint.id))) }), _jsx("div", { className: "mt-4", children: _jsx(Button, { variant: "outline", onClick: () => setActiveTab("complaints"), className: "w-full", children: "View All Complaints" }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Recent Service Requests" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "space-y-4", children: mockServiceRequests.slice(0, 3).map((service) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-medium text-sm", children: service.title }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["ID: ", service.id] })] }), _jsx(Badge, { className: getStatusColor(service.status), children: service.status })] }, service.id))) }), _jsx("div", { className: "mt-4", children: _jsx(Button, { variant: "outline", onClick: () => setActiveTab("services"), className: "w-full", children: "View All Services" }) })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Quick Actions" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs(Button, { onClick: () => navigate("/guest/complaint"), className: "justify-start h-auto p-4", children: [_jsx(PlusCircle, { className: "mr-2 h-5 w-5" }), _jsxs("div", { className: "text-left", children: [_jsx("div", { className: "font-medium", children: "Submit Complaint" }), _jsx("div", { className: "text-xs opacity-75", children: "Report civic issues" })] })] }), _jsxs(Button, { onClick: () => navigate("/guest/service-request"), variant: "outline", className: "justify-start h-auto p-4", children: [_jsx(FileText, { className: "mr-2 h-5 w-5" }), _jsxs("div", { className: "text-left", children: [_jsx("div", { className: "font-medium", children: "Request Service" }), _jsx("div", { className: "text-xs opacity-75", children: "Municipal services" })] })] }), _jsxs(Button, { onClick: () => navigate("/guest/track"), variant: "outline", className: "justify-start h-auto p-4", children: [_jsx(Search, { className: "mr-2 h-5 w-5" }), _jsxs("div", { className: "text-left", children: [_jsx("div", { className: "font-medium", children: "Track Status" }), _jsx("div", { className: "text-xs opacity-75", children: "Check progress" })] })] })] }) })] })] }), _jsx(TabsContent, { value: "complaints", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-lg", children: "My Complaints" }), _jsxs(Button, { onClick: () => setIsQuickFormOpen(true), children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "New Complaint"] })] }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "mb-4", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" }), _jsx(Input, { placeholder: "Search complaints...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10" })] }) }), _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "ID" }), _jsx(TableHead, { children: "Title" }), _jsx(TableHead, { children: "Type" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Priority" }), _jsx(TableHead, { children: "Submitted" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: mockComplaints.map((complaint) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-mono text-xs", children: complaint.id }), _jsx(TableCell, { children: _jsxs("div", { className: "max-w-48", children: [_jsx("div", { className: "font-medium text-sm truncate", children: complaint.title }), _jsx("div", { className: "text-xs text-gray-500 truncate", children: complaint.description })] }) }), _jsx(TableCell, { children: complaint.type.replace("_", " ") }), _jsx(TableCell, { children: _jsx(Badge, { className: getStatusColor(complaint.status), children: complaint.status.replace("_", " ") }) }), _jsx(TableCell, { children: _jsx(Badge, { variant: "outline", className: getPriorityColor(complaint.priority), children: complaint.priority }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center text-sm", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), formatDate(complaint.submittedOn)] }) }), _jsx(TableCell, { children: _jsx(Button, { variant: "ghost", size: "sm", children: _jsx(Eye, { className: "h-4 w-4" }) }) })] }, complaint.id))) })] })] })] }) }), _jsx(TabsContent, { value: "services", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-lg", children: "My Service Requests" }), _jsxs(Button, { onClick: () => navigate("/guest/service-request"), children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "New Service Request"] })] }) }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "ID" }), _jsx(TableHead, { children: "Service" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Submitted" }), _jsx(TableHead, { children: "Expected Completion" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: mockServiceRequests.map((service) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-mono text-xs", children: service.id }), _jsx(TableCell, { children: _jsxs("div", { className: "max-w-48", children: [_jsx("div", { className: "font-medium text-sm", children: service.title }), _jsx("div", { className: "text-xs text-gray-500", children: service.description })] }) }), _jsx(TableCell, { children: _jsx(Badge, { className: getStatusColor(service.status), children: service.status }) }), _jsx(TableCell, { children: formatDate(service.submittedOn) }), _jsx(TableCell, { children: service.status === "APPROVED" && service.completedOn
                                                                        ? formatDate(service.completedOn)
                                                                        : service.expectedCompletion
                                                                            ? formatDate(service.expectedCompletion)
                                                                            : "TBD" }), _jsx(TableCell, { children: _jsx(Button, { variant: "ghost", size: "sm", children: _jsx(Eye, { className: "h-4 w-4" }) }) })] }, service.id))) })] }) })] }) }), _jsx(TabsContent, { value: "payments", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Payment History" }) }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "ID" }), _jsx(TableHead, { children: "Description" }), _jsx(TableHead, { children: "Amount" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Date" }), _jsx(TableHead, { children: "Method" })] }) }), _jsx(TableBody, { children: mockPayments.map((payment) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-mono text-xs", children: payment.id }), _jsx(TableCell, { className: "font-medium", children: payment.description }), _jsx(TableCell, { className: "font-semibold", children: formatCurrency(payment.amount) }), _jsx(TableCell, { children: _jsx(Badge, { className: getStatusColor(payment.status), children: payment.status }) }), _jsx(TableCell, { children: payment.status === "PAID"
                                                                        ? formatDate(payment.paidOn)
                                                                        : `Due: ${formatDate(payment.dueDate)}` }), _jsx(TableCell, { children: payment.method || "—" })] }, payment.id))) })] }) })] }) }), _jsx(TabsContent, { value: "notifications", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Notifications" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: mockNotifications.map((notification) => (_jsx("div", { className: `p-4 border rounded-lg ${!notification.read
                                                        ? "bg-blue-50 border-blue-200"
                                                        : "bg-white"}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-medium text-sm", children: notification.title }), !notification.read && (_jsx(Badge, { className: "bg-blue-100 text-blue-800 text-xs", children: "New" }))] }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: notification.message }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: new Date(notification.timestamp).toLocaleString() })] }), _jsx(Bell, { className: "h-4 w-4 text-gray-400" })] }) }, notification.id))) }) })] }) }), _jsx(TabsContent, { value: "profile", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Profile Information" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "fullName", children: "Full Name" }), _jsx(Input, { id: "fullName", value: mockProfile.fullName, readOnly: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email Address" }), _jsx(Input, { id: "email", value: mockProfile.email, readOnly: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "phone", children: "Phone Number" }), _jsx(Input, { id: "phone", value: mockProfile.phoneNumber, readOnly: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "address", children: "Address" }), _jsx(Input, { id: "address", value: mockProfile.address, readOnly: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "joinedDate", children: "Member Since" }), _jsx(Input, { id: "joinedDate", value: formatDate(mockProfile.joinedDate), readOnly: true })] }), _jsxs(Button, { className: "w-full", disabled: true, children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), "Edit Profile (Coming Soon)"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Account Summary" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center p-4 bg-blue-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: mockProfile.totalRequests }), _jsx("div", { className: "text-sm text-blue-700", children: "Total Requests" })] }), _jsxs("div", { className: "text-center p-4 bg-green-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: mockProfile.resolvedRequests }), _jsx("div", { className: "text-sm text-green-700", children: "Resolved" })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Success Rate" }), _jsxs("span", { className: "font-medium", children: [Math.round((mockProfile.resolvedRequests /
                                                                                    mockProfile.totalRequests) *
                                                                                    100), "%"] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Active Requests" }), _jsx("span", { className: "font-medium", children: mockProfile.totalRequests -
                                                                                mockProfile.resolvedRequests })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Member Since" }), _jsx("span", { className: "font-medium", children: formatDate(mockProfile.joinedDate) })] })] }), _jsxs("div", { className: "border-t pt-4", children: [_jsx("h3", { className: "font-medium mb-2", children: "Account Features" }), _jsxs("ul", { className: "text-sm text-gray-600 space-y-1", children: [_jsx("li", { children: "\u2022 Submit unlimited complaints" }), _jsx("li", { children: "\u2022 Request municipal services" }), _jsx("li", { children: "\u2022 Track request status in real-time" }), _jsx("li", { children: "\u2022 Receive email notifications" }), _jsx("li", { children: "\u2022 Access payment history" })] })] })] })] })] }) })] })] }), _jsx(QuickComplaintModal, { isOpen: isQuickFormOpen, onClose: () => setIsQuickFormOpen(false), onSuccess: (complaintId) => {
                    // Could add refresh logic here if needed
                    setActiveTab("complaints");
                } })] }));
};
export default GuestDashboard;
