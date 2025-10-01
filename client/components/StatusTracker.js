import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useStatusTracking, useDataSync } from '../hooks/useDataManager';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Clock, AlertCircle, CheckCircle, FileText } from 'lucide-react';
const StatusTracker = ({ complaintId, showAll = false, maxItems = 10 }) => {
    const { activeComplaints, recentUpdates, getStatusHistory } = useStatusTracking();
    const { syncData } = useDataSync();
    // Auto-sync data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            syncData();
        }, 30000);
        return () => clearInterval(interval);
    }, [syncData]);
    const getStatusColor = (status) => {
        switch (status.toUpperCase()) {
            case 'REGISTERED':
                return 'bg-yellow-100 text-yellow-800';
            case 'ASSIGNED':
                return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS':
                return 'bg-orange-100 text-orange-800';
            case 'RESOLVED':
                return 'bg-green-100 text-green-800';
            case 'CLOSED':
                return 'bg-gray-100 text-gray-800';
            case 'REOPENED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    const getStatusIcon = (status) => {
        switch (status.toUpperCase()) {
            case 'REGISTERED':
                return _jsx(FileText, { className: "h-4 w-4" });
            case 'ASSIGNED':
            case 'IN_PROGRESS':
                return _jsx(Clock, { className: "h-4 w-4" });
            case 'RESOLVED':
            case 'CLOSED':
                return _jsx(CheckCircle, { className: "h-4 w-4" });
            case 'REOPENED':
                return _jsx(AlertCircle, { className: "h-4 w-4" });
            default:
                return _jsx(FileText, { className: "h-4 w-4" });
        }
    };
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1)
            return 'Just now';
        if (diffMins < 60)
            return `${diffMins}m ago`;
        if (diffHours < 24)
            return `${diffHours}h ago`;
        if (diffDays < 7)
            return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };
    // Get updates to display
    const updatesToShow = complaintId
        ? getStatusHistory(complaintId)
        : recentUpdates.slice(0, maxItems);
    if (complaintId && updatesToShow.length === 0) {
        return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm", children: "Status History" }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-sm text-gray-500", children: "No status updates available" }) })] }));
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm flex items-center", children: [_jsx(Clock, { className: "h-4 w-4 mr-2" }), complaintId ? 'Status History' : 'Recent Updates', !complaintId && (_jsx(Badge, { variant: "secondary", className: "ml-2", children: recentUpdates.length }))] }) }), _jsxs(CardContent, { children: [_jsx(ScrollArea, { className: "h-64", children: _jsx("div", { className: "space-y-3", children: updatesToShow.length === 0 ? (_jsx("p", { className: "text-sm text-gray-500", children: "No updates available" })) : (updatesToShow.map((update, index) => (_jsxs("div", { className: "flex items-start space-x-3 p-2 rounded-lg bg-gray-50", children: [_jsx("div", { className: "flex-shrink-0 mt-1", children: getStatusIcon(update.status) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Badge, { className: `text-xs ${getStatusColor(update.status)}`, children: update.status.replace('_', ' ') }), _jsx("span", { className: "text-xs text-gray-500", children: formatTimestamp(update.timestamp) })] }), !complaintId && (_jsxs("p", { className: "text-xs text-gray-600 mt-1", children: ["Complaint #", update.complaintId?.slice(-6)] })), update.comment && (_jsx("p", { className: "text-sm text-gray-700 mt-1", children: update.comment }))] })] }, update.id || index)))) }) }), showAll && recentUpdates.length > maxItems && (_jsx("div", { className: "mt-3 text-center", children: _jsxs("p", { className: "text-xs text-gray-500", children: ["Showing ", Math.min(maxItems, updatesToShow.length), " of ", recentUpdates.length, " updates"] }) }))] })] }));
};
// Active complaints overview component
export const ActiveComplaintsTracker = () => {
    const { activeComplaints } = useStatusTracking();
    const getComplaintCount = (status) => {
        return activeComplaints.filter(complaint => complaint.status === status).length;
    };
    const statusCounts = [
        { status: 'REGISTERED', label: 'Registered', color: 'bg-yellow-100 text-yellow-800' },
        { status: 'ASSIGNED', label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
        { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-orange-100 text-orange-800' },
        { status: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-800' },
    ];
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm flex items-center", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "Active Complaints Overview"] }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "grid grid-cols-2 gap-3", children: statusCounts.map(({ status, label, color }) => {
                            const count = getComplaintCount(status);
                            return (_jsxs("div", { className: "text-center p-3 rounded-lg bg-gray-50", children: [_jsx("div", { className: `inline-flex px-2 py-1 rounded-full text-xs font-medium ${color} mb-1`, children: label }), _jsx("div", { className: "text-lg font-semibold text-gray-900", children: count })] }, status));
                        }) }), _jsx("div", { className: "mt-4 pt-3 border-t", children: _jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: "Total Active:" }), _jsx("span", { className: "font-medium", children: activeComplaints.length })] }) })] })] }));
};
export default StatusTracker;
