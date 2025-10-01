import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintQuery } from "../store/api/complaintsApi";
import { useDataManager } from "../hooks/useDataManager";
import ComplaintFeedbackDialog from "../components/ComplaintFeedbackDialog";
import UpdateComplaintModal from "../components/UpdateComplaintModal";
import AttachmentPreview from "../components/AttachmentPreview";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { FileText, Calendar, MapPin, User, Phone, Mail, Clock, CheckCircle, ArrowLeft, MessageSquare, Image, Download, Upload, } from "lucide-react";
// Dynamic import for jsPDF to avoid build issues
const ComplaintDetails = () => {
    const { id } = useParams();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const { translations } = useAppSelector((state) => state.language);
    const { config } = useSystemConfig();
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);
    // Data management hooks
    const { cacheComplaintDetails, getComplaintDetails } = useDataManager();
    // Use RTK Query to fetch complaint details
    const { data: complaintResponse, isLoading, error, } = useGetComplaintQuery(id, { skip: !id || !isAuthenticated });
    const complaint = complaintResponse?.data?.complaint;
    // Cache complaint details when loaded
    useEffect(() => {
        if (complaint && id) {
            cacheComplaintDetails(id, complaint);
        }
    }, [complaint, id, cacheComplaintDetails]);
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
    // SLA helpers
    const getTypeSlaHours = (type) => {
        if (!type)
            return null;
        try {
            const entries = Object.entries(config || {});
            let hours = null;
            for (const [key, value] of entries) {
                if (!key.startsWith("COMPLAINT_TYPE_"))
                    continue;
                try {
                    const parsed = JSON.parse(value);
                    const name = (parsed?.name || "").toString().toUpperCase();
                    const slaHours = Number(parsed?.slaHours);
                    if (name === type.toUpperCase() && Number.isFinite(slaHours)) {
                        hours = slaHours;
                        break;
                    }
                    const suffix = key.replace("COMPLAINT_TYPE_", "").toUpperCase();
                    if (suffix === type.toUpperCase() && Number.isFinite(slaHours)) {
                        hours = slaHours;
                        break;
                    }
                }
                catch (e) {
                    continue;
                }
            }
            return hours;
        }
        catch {
            return null;
        }
    };
    const getLastReopenAt = (logs) => {
        if (!Array.isArray(logs))
            return null;
        const reopenLogs = logs
            .filter((l) => l?.toStatus === "REOPENED")
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return reopenLogs.length ? new Date(reopenLogs[0].timestamp) : null;
    };
    const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);
    const computeSla = (c) => {
        if (!c)
            return { status: "N/A", deadline: null };
        const typeHours = getTypeSlaHours(c.type);
        const reopenAt = getLastReopenAt(c.statusLogs);
        const registeredAt = c.submittedOn
            ? new Date(c.submittedOn)
            : c.createdAt
                ? new Date(c.createdAt)
                : null;
        const startAt = reopenAt || registeredAt;
        let deadline = null;
        if (startAt && Number.isFinite(typeHours)) {
            deadline = addHours(startAt, typeHours);
        }
        else if (c.deadline) {
            deadline = new Date(c.deadline);
        }
        if (!deadline)
            return { status: "N/A", deadline: null };
        const now = new Date();
        const isResolved = c.status === "RESOLVED" || c.status === "CLOSED";
        const resolvedAt = c.resolvedOn
            ? new Date(c.resolvedOn)
            : c.closedOn
                ? new Date(c.closedOn)
                : null;
        if (isResolved && resolvedAt) {
            return {
                status: resolvedAt <= deadline ? "ON_TIME" : "OVERDUE",
                deadline,
            };
        }
        return {
            status: now > deadline ? "OVERDUE" : "ON_TIME",
            deadline,
        };
    };
    if (isLoading) {
        return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-8 bg-gray-200 rounded w-1/3 mb-4" }), _jsx("div", { className: "h-4 bg-gray-200 rounded w-1/2 mb-8" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2 space-y-6", children: _jsx("div", { className: "h-64 bg-gray-200 rounded" }) }), _jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "h-32 bg-gray-200 rounded" }), _jsx("div", { className: "h-32 bg-gray-200 rounded" })] })] })] }) }));
    }
    if (error) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx(FileText, { className: "h-12 w-12 mx-auto text-red-400 mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Error Loading Complaint" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Failed to load complaint details. Please try again." }), _jsx(Link, { to: "/complaints", children: _jsxs(Button, { children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Complaints"] }) })] }));
    }
    if (!complaint) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx(FileText, { className: "h-12 w-12 mx-auto text-gray-400 mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Complaint Not Found" }), _jsx("p", { className: "text-gray-600 mb-4", children: "The complaint you're looking for doesn't exist." }), _jsx(Link, { to: "/complaints", children: _jsxs(Button, { children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Complaints"] }) })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx(Link, { to: "/complaints", children: _jsxs(Button, { variant: "ghost", size: "sm", children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back"] }) }), _jsxs("h1", { className: "text-2xl font-bold text-gray-900", children: ["Complaint #", complaint?.complaintId || complaint?.id?.slice(-6) || "Unknown"] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Badge, { className: getStatusColor(complaint?.status || ""), children: complaint?.status?.replace("_", " ") || "Unknown" }), _jsxs(Badge, { className: getPriorityColor(complaint?.priority || ""), children: [complaint?.priority || "Unknown", " Priority"] }), _jsxs("span", { className: "text-sm text-gray-500", children: ["Created", " ", complaint?.submittedOn
                                            ? new Date(complaint.submittedOn).toLocaleDateString()
                                            : "Unknown"] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2" }), "Complaint Details"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-2", children: "Type" }), _jsx("p", { className: "text-gray-600", children: complaint?.type?.replace("_", " ") || "Unknown Type" })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-2", children: "Description" }), _jsx("p", { className: "text-gray-600", children: complaint?.description || "No description available" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-medium mb-2 flex items-center", children: [_jsx(MapPin, { className: "h-4 w-4 mr-1" }), "Location Information"] }), _jsxs("div", { className: "space-y-1 text-sm", children: [_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Area:" }), " ", complaint.area] }), complaint.ward && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Ward:" }), " ", complaint.ward.name] })), complaint.subZone && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Sub-Zone:" }), " ", complaint.subZone.name] })), complaint.landmark && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Landmark:" }), " ", complaint.landmark] })), complaint.address && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Address:" }), " ", complaint.address] })), (user?.role === "ADMINISTRATOR" ||
                                                                        user?.role === "WARD_OFFICER") &&
                                                                        complaint.coordinates && (_jsxs("p", { className: "text-gray-500 text-xs", children: [_jsx("strong", { children: "Coordinates:" }), " ", complaint.coordinates] }))] })] }), _jsxs("div", { children: [_jsxs("h3", { className: "font-medium mb-2 flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1" }), "Timeline"] }), _jsxs("div", { className: "space-y-1 text-sm", children: [_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Submitted:" }), " ", new Date(complaint.submittedOn).toLocaleString()] }), complaint.assignedOn && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Assigned:" }), " ", new Date(complaint.assignedOn).toLocaleString()] })), complaint.resolvedOn && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Resolved:" }), " ", new Date(complaint.resolvedOn).toLocaleString()] })), complaint.closedOn && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Closed:" }), " ", new Date(complaint.closedOn).toLocaleString()] })), (user?.role === "ADMINISTRATOR" ||
                                                                        user?.role === "WARD_OFFICER") &&
                                                                        (() => {
                                                                            const { status, deadline } = computeSla(complaint);
                                                                            return (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Deadline:" }), " ", deadline
                                                                                                ? new Date(deadline).toLocaleString()
                                                                                                : "N/A"] }), _jsxs("p", { className: `text-sm font-medium ${status === "OVERDUE"
                                                                                            ? "text-red-600"
                                                                                            : status === "ON_TIME"
                                                                                                ? "text-green-600"
                                                                                                : "text-gray-600"}`, children: [_jsx("strong", { children: "SLA Status:" }), " ", status === "ON_TIME"
                                                                                                ? "On Time"
                                                                                                : status === "OVERDUE"
                                                                                                    ? "Overdue"
                                                                                                    : "N/A"] })] }));
                                                                        })()] })] })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(MessageSquare, { className: "h-5 w-5 mr-2" }), user?.role === "CITIZEN"
                                                    ? "Status Updates"
                                                    : "Status Updates & Comments"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: complaint.statusLogs && complaint.statusLogs.length > 0 ? (complaint.statusLogs.map((log, index) => {
                                                const getStatusColor = (status) => {
                                                    switch (status) {
                                                        case "REGISTERED":
                                                            return "border-blue-500";
                                                        case "ASSIGNED":
                                                            return "border-yellow-500";
                                                        case "IN_PROGRESS":
                                                            return "border-orange-500";
                                                        case "RESOLVED":
                                                            return "border-green-500";
                                                        case "CLOSED":
                                                            return "border-gray-500";
                                                        default:
                                                            return "border-gray-400";
                                                    }
                                                };
                                                const getStatusLabel = (status) => {
                                                    switch (status) {
                                                        case "REGISTERED":
                                                            return "Complaint Registered";
                                                        case "ASSIGNED":
                                                            return "Complaint Assigned";
                                                        case "IN_PROGRESS":
                                                            return "Work in Progress";
                                                        case "RESOLVED":
                                                            return "Complaint Resolved";
                                                        case "CLOSED":
                                                            return "Complaint Closed";
                                                        default:
                                                            return `Status: ${status}`;
                                                    }
                                                };
                                                // Get citizen-friendly status messages
                                                const getCitizenStatusMessage = (status, log) => {
                                                    switch (status) {
                                                        case "REGISTERED":
                                                            return "Your complaint has been successfully registered and is under review.";
                                                        case "ASSIGNED":
                                                            return "Your complaint has been assigned to our maintenance team for resolution.";
                                                        case "IN_PROGRESS":
                                                            return "Our team is actively working on resolving your complaint.";
                                                        case "RESOLVED":
                                                            return "Your complaint has been resolved. Please verify and provide feedback.";
                                                        case "CLOSED":
                                                            return "Your complaint has been completed and closed.";
                                                        default:
                                                            return `Your complaint status has been updated to ${status.toLowerCase().replace("_", " ")}.`;
                                                    }
                                                };
                                                // Check if user is a citizen
                                                const isCitizen = user?.role === "CITIZEN";
                                                return (_jsx("div", { className: `border-l-4 ${getStatusColor(log.toStatus)} pl-4 py-2`, children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("p", { className: "font-medium", children: getStatusLabel(log.toStatus) }), !isCitizen && log.user && (_jsxs(Badge, { variant: "outline", className: "text-xs", children: [log.user.fullName, " (", log.user.role, ")"] }))] }), isCitizen ? (_jsx("p", { className: "text-sm text-gray-600 mb-1", children: getCitizenStatusMessage(log.toStatus, log) })) : (_jsx(_Fragment, { children: log.comment && (_jsxs("p", { className: "text-sm text-gray-600 mb-1", children: [_jsx("strong", { children: "Remarks:" }), " ", log.comment] })) })), log.fromStatus && (_jsxs("p", { className: "text-xs text-gray-500", children: ["Status changed from", " ", _jsx("span", { className: "font-medium", children: log.fromStatus }), " ", "to", " ", _jsx("span", { className: "font-medium", children: log.toStatus })] }))] }), _jsx("span", { className: "text-xs text-gray-500 ml-4", children: new Date(log.timestamp).toLocaleString() })] }) }, log.id || index));
                                            })) : (_jsxs("div", { className: "text-center py-4 text-gray-500", children: [_jsx(MessageSquare, { className: "h-8 w-8 mx-auto mb-2 opacity-50" }), _jsx("p", { children: user?.role === "CITIZEN"
                                                            ? "No updates available for your complaint yet"
                                                            : "No status updates available" })] })) }) })] }), (user?.role === "ADMINISTRATOR" ||
                                user?.role === "WARD_OFFICER") && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Upload, { className: "h-5 w-5 mr-2" }), "Attachment Logs (", complaint?.attachments?.length || 0, " files +", " ", complaint?.photos?.length || 0, " photos)"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium mb-2", children: ["Files (", complaint?.attachments?.length || 0, ")"] }), complaint.attachments && complaint.attachments.length > 0 ? (_jsx("div", { className: "space-y-2", children: complaint.attachments.map((att) => (_jsxs("div", { className: "border-l-4 border-blue-300 pl-4 py-2 flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: new Date(att.uploadedAt).toLocaleString() }), _jsxs("p", { className: "text-sm text-gray-800", children: [att.originalName || att.fileName, _jsxs("span", { className: "text-xs text-gray-500", children: [" ", "\u2022 ", att.mimeType, " \u2022", " ", (att.size / 1024).toFixed(1), " KB"] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => {
                                                                                setPreviewItem({
                                                                                    url: att.url,
                                                                                    mimeType: att.mimeType,
                                                                                    name: att.originalName || att.fileName,
                                                                                    size: att.size,
                                                                                });
                                                                                setIsPreviewOpen(true);
                                                                            }, children: "Preview" }), _jsx("a", { href: att.url, target: "_blank", rel: "noreferrer", children: _jsxs(Button, { size: "sm", variant: "outline", children: [_jsx(Download, { className: "h-4 w-4 mr-1" }), "Download"] }) })] })] }, att.id))) })) : (_jsx("div", { className: "text-xs text-gray-500", children: "No file attachments." }))] }), _jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium mb-2", children: ["Photos (", complaint?.photos?.length || 0, ")"] }), complaint.photos && complaint.photos.length > 0 ? (_jsx("div", { className: "space-y-2", children: complaint.photos.map((p) => (_jsxs("div", { className: "border-l-4 border-emerald-300 pl-4 py-2 flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: new Date(p.uploadedAt).toLocaleString() }), _jsxs("p", { className: "text-sm text-gray-800", children: [p.originalName || p.fileName, p.uploadedByTeam?.fullName && (_jsxs("span", { className: "ml-2 text-xs text-gray-500", children: ["by ", p.uploadedByTeam.fullName] }))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => {
                                                                                setPreviewItem({
                                                                                    url: p.photoUrl,
                                                                                    mimeType: "image/*",
                                                                                    name: p.originalName || p.fileName,
                                                                                    size: null,
                                                                                });
                                                                                setIsPreviewOpen(true);
                                                                            }, children: "Preview" }), _jsx("a", { href: p.photoUrl, target: "_blank", rel: "noreferrer", children: _jsxs(Button, { size: "sm", variant: "outline", children: [_jsx(Download, { className: "h-4 w-4 mr-1" }), "Download"] }) })] })] }, p.id))) })) : (_jsx("div", { className: "text-xs text-gray-500", children: "No photos." }))] })] })] })), user?.role === "ADMINISTRATOR" && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Clock, { className: "h-5 w-5 mr-2" }), "Administrative Information"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium mb-2", children: "Assignment Details" }), _jsxs("div", { className: "space-y-1 text-sm", children: [complaint.submittedBy && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Submitted By:" }), " ", complaint.submittedBy.fullName, complaint.submittedBy.email &&
                                                                                ` (${complaint.submittedBy.email})`] })), complaint.wardOfficer && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Ward Officer:" }), " ", complaint.wardOfficer.fullName, complaint.wardOfficer.email &&
                                                                                ` (${complaint.wardOfficer.email})`] })), complaint.maintenanceTeam && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Maintenance Team:" }), " ", complaint.maintenanceTeam.fullName, complaint.maintenanceTeam.email &&
                                                                                ` (${complaint.maintenanceTeam.email})`] })), complaint.assignedTo && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Assigned To:" }), " ", complaint.assignedTo.fullName, complaint.assignedTo.email &&
                                                                                ` (${complaint.assignedTo.email})`] })), complaint.resolvedById && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Resolved By:" }), " ", complaint.resolvedById] }))] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium mb-2", children: "Technical Details" }), _jsxs("div", { className: "space-y-1 text-sm", children: [_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Complaint ID:" }), " ", complaint.complaintId || complaint.id] }), complaint.tags && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Tags:" }), " ", JSON.parse(complaint.tags).join(", ")] })), _jsxs("p", { className: "text-gray-500 text-xs", children: [_jsx("strong", { children: "Created:" }), " ", new Date(complaint.createdAt || complaint.submittedOn).toLocaleString()] }), _jsxs("p", { className: "text-gray-500 text-xs", children: [_jsx("strong", { children: "Last Updated:" }), " ", new Date(complaint.updatedAt || complaint.submittedOn).toLocaleString()] })] })] })] }), (complaint.citizenFeedback || complaint.rating) && (_jsxs("div", { className: "border-t pt-4", children: [_jsx("h4", { className: "font-medium mb-2", children: "Citizen Feedback" }), _jsxs("div", { className: "bg-blue-50 rounded-lg p-3", children: [complaint.rating && (_jsxs("p", { className: "text-sm text-blue-800 mb-1", children: [_jsx("strong", { children: "Rating:" }), " ", complaint.rating, "/5 \u2B50"] })), complaint.citizenFeedback && (_jsxs("p", { className: "text-sm text-blue-700", children: [_jsx("strong", { children: "Feedback:" }), " ", complaint.citizenFeedback] }))] })] }))] })] })), complaint.remarks && user?.role !== "CITIZEN" && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2" }), "Internal Remarks"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "bg-gray-50 rounded-lg p-4", children: _jsx("p", { className: "text-gray-700 whitespace-pre-wrap", children: complaint.remarks }) }) })] }))] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(User, { className: "h-5 w-5 mr-2" }), "Contact Information"] }) }), _jsxs(CardContent, { className: "space-y-3", children: [complaint.contactName && (_jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "h-4 w-4 mr-2 text-gray-400" }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium", children: complaint.contactName }), (user?.role === "ADMINISTRATOR" ||
                                                                user?.role === "WARD_OFFICER") &&
                                                                complaint.submittedBy && (_jsxs("span", { className: "text-xs text-gray-500", children: ["Registered User: ", complaint.submittedBy.fullName] }))] })] })), _jsxs("div", { className: "flex items-center", children: [_jsx(Phone, { className: "h-4 w-4 mr-2 text-gray-400" }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { children: complaint.contactPhone }), (user?.role === "ADMINISTRATOR" ||
                                                                user?.role === "WARD_OFFICER") &&
                                                                complaint.submittedBy?.phoneNumber &&
                                                                complaint.submittedBy.phoneNumber !==
                                                                    complaint.contactPhone && (_jsxs("span", { className: "text-xs text-gray-500", children: ["User Phone: ", complaint.submittedBy.phoneNumber] }))] })] }), complaint.contactEmail && (_jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "h-4 w-4 mr-2 text-gray-400" }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { children: complaint.contactEmail }), (user?.role === "ADMINISTRATOR" ||
                                                                user?.role === "WARD_OFFICER") &&
                                                                complaint.submittedBy?.email &&
                                                                complaint.submittedBy.email !==
                                                                    complaint.contactEmail && (_jsxs("span", { className: "text-xs text-gray-500", children: ["User Email: ", complaint.submittedBy.email] }))] })] })), (user?.role === "ADMINISTRATOR" ||
                                                user?.role === "WARD_OFFICER") &&
                                                complaint.isAnonymous && (_jsxs("div", { className: "flex items-center text-orange-600", children: [_jsx(User, { className: "h-4 w-4 mr-2" }), _jsx("span", { className: "text-sm font-medium", children: "Anonymous Complaint" })] }))] })] }), ((complaint.wardOfficer ||
                                complaint.maintenanceTeam ||
                                user?.role === "ADMINISTRATOR" ||
                                user?.role === "WARD_OFFICER" ||
                                user?.role === "MAINTENANCE_TEAM") && user?.role !== "CITIZEN") && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(CheckCircle, { className: "h-5 w-5 mr-2" }), "Assignment & Status Information", _jsx("span", { className: "ml-2 text-xs", children: _jsx(Badge, { className: getStatusColor(complaint.status), children: complaint.status.replace("_", " ") }) })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-1 gap-3", children: [_jsxs("div", { className: "bg-blue-50 rounded-lg p-3", children: [console.log("Ward Officer:", complaint), _jsx("p", { className: "text-sm font-medium mb-1", children: "Ward Officer" }), complaint.wardOfficer ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-blue-800 font-medium", children: complaint.wardOfficer.fullName }), complaint.wardOfficer.email && (_jsx("p", { className: "text-blue-600 text-sm", children: complaint.wardOfficer.email }))] })) : (_jsx("p", { className: "text-blue-700 text-sm", children: "Not assigned" }))] }), _jsxs("div", { className: "bg-green-50 rounded-lg p-3", children: [_jsx("p", { className: "text-sm font-medium mb-1", children: "Maintenance Team" }), complaint.maintenanceTeam ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-green-800 font-medium", children: complaint.maintenanceTeam.fullName }), complaint.maintenanceTeam.email && (_jsx("p", { className: "text-green-700 text-sm", children: complaint.maintenanceTeam.email })), complaint.assignedOn && (_jsxs("p", { className: "text-green-700 text-xs mt-1", children: ["Assigned on:", " ", new Date(complaint.assignedOn).toLocaleString()] }))] })) : (_jsx("p", { className: "text-green-700 text-sm", children: "Unassigned" }))] })] }), (user?.role === "ADMINISTRATOR" ||
                                                user?.role === "WARD_OFFICER") &&
                                                (() => {
                                                    const { status, deadline } = computeSla(complaint);
                                                    return (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium mb-1", children: "SLA Deadline" }), _jsx("p", { className: `text-sm ${deadline && new Date() > deadline ? "text-red-600 font-medium" : "text-gray-600"}`, children: deadline
                                                                            ? new Date(deadline).toLocaleString()
                                                                            : "N/A" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium mb-1", children: "SLA Status" }), _jsx(Badge, { className: status === "OVERDUE"
                                                                            ? "bg-red-100 text-red-800"
                                                                            : status === "ON_TIME"
                                                                                ? "bg-green-100 text-green-800"
                                                                                : "bg-gray-100 text-gray-800", children: status === "ON_TIME"
                                                                            ? "On Time"
                                                                            : status === "OVERDUE"
                                                                                ? "Overdue"
                                                                                : "N/A" }), deadline && (_jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["by ", new Date(deadline).toLocaleString()] }))] })] }));
                                                })(), (user?.role === "ADMINISTRATOR" ||
                                                user?.role === "WARD_OFFICER") && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium mb-1", children: "Priority Level" }), _jsxs(Badge, { className: getPriorityColor(complaint.priority), children: [complaint.priority, " Priority"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium mb-1", children: "Complaint Type" }), _jsx(Badge, { variant: "outline", children: complaint.type?.replace("_", " ") })] })] }))] })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Image, { className: "h-5 w-5 mr-2" }), "Attachments"] }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("h4", { className: "font-medium mb-2", children: ["Complaint Attachments (", complaint?.attachments?.length || 0, ")"] }), complaint?.attachments && complaint.attachments.length > 0 ? (_jsx("div", { className: "space-y-3", children: complaint.attachments.map((attachment) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [attachment.mimeType?.startsWith("image/") ? (_jsx(Image, { className: "h-5 w-5 text-blue-500" })) : (_jsx(FileText, { className: "h-5 w-5 text-gray-500" })), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm", children: attachment.originalName || attachment.fileName }), _jsxs("div", { className: "text-xs text-gray-500 space-y-1", children: [_jsxs("p", { children: [(attachment.size / 1024).toFixed(1), " KB \u2022", " ", new Date(attachment.uploadedAt).toLocaleDateString()] }), (user?.role === "ADMINISTRATOR" ||
                                                                                            user?.role === "WARD_OFFICER") && (_jsxs(_Fragment, { children: [_jsxs("p", { children: ["Type: ", attachment.mimeType] }), attachment.fileName !==
                                                                                                    attachment.originalName && (_jsxs("p", { children: ["Stored as: ", attachment.fileName] })), _jsxs("p", { children: ["Uploaded:", " ", new Date(attachment.uploadedAt).toLocaleString()] })] }))] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                                                                setPreviewItem({
                                                                                    url: attachment.url,
                                                                                    mimeType: attachment.mimeType,
                                                                                    name: attachment.originalName ||
                                                                                        attachment.fileName,
                                                                                    size: attachment.size,
                                                                                });
                                                                                setIsPreviewOpen(true);
                                                                            }, children: "Preview" }), _jsx("a", { href: attachment.url, target: "_blank", rel: "noreferrer", children: _jsx(Button, { variant: "outline", size: "sm", children: _jsx(Download, { className: "h-4 w-4" }) }) })] })] }, attachment.id))) })) : (_jsx("div", { className: "text-sm text-gray-500", children: "No complaint attachments" }))] }), user?.role !== "CITIZEN" && (_jsxs("div", { children: [_jsxs("h4", { className: "font-medium mb-2", children: ["Maintenance Team Attachments (", complaint?.photos?.length || 0, ")"] }), complaint?.photos && complaint.photos.length > 0 ? (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: complaint.photos.map((p) => (_jsxs("div", { className: "border rounded-lg p-2", children: [_jsx("img", { src: p.photoUrl, alt: p.originalName || p.fileName, className: "w-full h-28 object-cover rounded mb-2 cursor-pointer", onClick: () => {
                                                                        setPreviewItem({
                                                                            url: p.photoUrl,
                                                                            mimeType: "image/*",
                                                                            name: p.originalName || p.fileName,
                                                                            size: null,
                                                                        });
                                                                        setIsPreviewOpen(true);
                                                                    } }), _jsx("div", { className: "text-xs text-gray-700 truncate", children: p.originalName || p.fileName }), p.uploadedByTeam?.fullName && (_jsxs("div", { className: "text-[11px] text-gray-500", children: ["by ", p.uploadedByTeam.fullName] })), _jsx("div", { className: "text-[11px] text-gray-500", children: new Date(p.uploadedAt).toLocaleString() }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => {
                                                                                setPreviewItem({
                                                                                    url: p.photoUrl,
                                                                                    mimeType: "image/*",
                                                                                    name: p.originalName || p.fileName,
                                                                                    size: null,
                                                                                });
                                                                                setIsPreviewOpen(true);
                                                                            }, children: "Preview" }), _jsx("a", { href: p.photoUrl, target: "_blank", rel: "noreferrer", children: _jsxs(Button, { size: "sm", variant: "outline", children: [_jsx(Download, { className: "h-3 w-3 mr-1" }), "Download"] }) })] })] }, p.id))) })) : (_jsx("div", { className: "text-sm text-gray-500", children: "No maintenance attachments" }))] }))] })] }), user?.role !== "CITIZEN" && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Quick Actions" }) }), _jsxs(CardContent, { className: "space-y-2", children: [(user?.role === "WARD_OFFICER" ||
                                                user?.role === "ADMINISTRATOR" ||
                                                user?.role === "MAINTENANCE_TEAM") && (_jsxs(Button, { className: "w-full justify-start", onClick: () => setIsUpdateModalOpen(true), children: [_jsx(CheckCircle, { className: "h-4 w-4 mr-2" }), "Update Status"] })), (complaint.status === "RESOLVED" ||
                                                complaint.status === "CLOSED") &&
                                                complaint.submittedById === user?.id &&
                                                !complaint.rating && (_jsxs(Button, { className: "w-full justify-start", onClick: () => setShowFeedbackDialog(true), children: [_jsx(MessageSquare, { className: "h-4 w-4 mr-2" }), "Provide Feedback"] }))] })] }))] })] }), _jsx(UpdateComplaintModal, { complaint: complaint, isOpen: isUpdateModalOpen, onClose: () => setIsUpdateModalOpen(false), onSuccess: () => {
                    setIsUpdateModalOpen(false);
                } }), _jsx(ComplaintFeedbackDialog, { complaintId: complaint.id, isOpen: showFeedbackDialog, onClose: () => setShowFeedbackDialog(false), onSuccess: () => {
                    // The complaint data will be automatically updated by RTK Query
                    // due to invalidation tags
                } }), _jsx(AttachmentPreview, { open: isPreviewOpen, onOpenChange: setIsPreviewOpen, item: previewItem, canDownload: user?.role !== "CITIZEN" })] }));
};
export default ComplaintDetails;
