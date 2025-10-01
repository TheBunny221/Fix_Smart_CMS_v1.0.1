export const getComplaintTypeLabel = (type) => {
    return type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
};
export const isResolved = (status) => {
    return ["resolved", "closed"].includes(status);
};
export const isPending = (status) => {
    return ["registered", "assigned", "in_progress", "reopened"].includes(status);
};
export const getStatusColor = (status) => {
    const statusColors = {
        registered: "bg-blue-100 text-blue-800",
        assigned: "bg-yellow-100 text-yellow-800",
        in_progress: "bg-orange-100 text-orange-800",
        resolved: "bg-green-100 text-green-800",
        closed: "bg-gray-100 text-gray-800",
        reopened: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
};
export const getPriorityColor = (priority) => {
    const priorityColors = {
        low: "bg-green-100 text-green-800",
        medium: "bg-yellow-100 text-yellow-800",
        high: "bg-orange-100 text-orange-800",
        critical: "bg-red-100 text-red-800",
    };
    return priorityColors[priority] || "bg-gray-100 text-gray-800";
};
export const getStatusLabel = (status) => {
    const statusLabels = {
        registered: "Registered",
        assigned: "Assigned",
        in_progress: "In Progress",
        resolved: "Resolved",
        closed: "Closed",
        reopened: "Reopened",
    };
    return statusLabels[status] || status;
};
export const getPriorityLabel = (priority) => {
    const priorityLabels = {
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical",
    };
    return priorityLabels[priority] || priority;
};
export const calculateSLAStatus = (submittedDate, slaHours, status) => {
    if (isResolved(status)) {
        return "completed";
    }
    const submitted = new Date(submittedDate);
    const now = new Date();
    const hoursElapsed = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
    if (hoursElapsed > slaHours) {
        return "overdue";
    }
    else if (hoursElapsed > slaHours * 0.8) {
        return "warning";
    }
    else {
        return "ontime";
    }
};
export const getSLAStatusColor = (slaStatus) => {
    const slaColors = {
        ontime: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        overdue: "bg-red-100 text-red-800",
        completed: "bg-blue-100 text-blue-800",
    };
    return slaColors[slaStatus] || "bg-gray-100 text-gray-800";
};
