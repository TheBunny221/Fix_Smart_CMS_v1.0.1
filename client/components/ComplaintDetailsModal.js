import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { FileText, MapPin, Clock, CheckCircle, AlertCircle, User, Phone, Mail, Download, Copy, ExternalLink, } from "lucide-react";
const ComplaintDetailsModal = ({ isOpen, onClose, complaint, user, }) => {
    if (!complaint)
        return null;
    const getStatusColor = (status) => {
        switch (status) {
            case "REGISTERED":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "ASSIGNED":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "IN_PROGRESS":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "RESOLVED":
                return "bg-green-100 text-green-800 border-green-200";
            case "CLOSED":
                return "bg-gray-100 text-gray-800 border-gray-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case "LOW":
                return "bg-green-100 text-green-800 border-green-200";
            case "MEDIUM":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "HIGH":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "URGENT":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case "REGISTERED":
                return _jsx(FileText, { className: "h-4 w-4" });
            case "ASSIGNED":
                return _jsx(AlertCircle, { className: "h-4 w-4" });
            case "IN_PROGRESS":
                return _jsx(Clock, { className: "h-4 w-4" });
            case "RESOLVED":
            case "CLOSED":
                return _jsx(CheckCircle, { className: "h-4 w-4" });
            default:
                return _jsx(FileText, { className: "h-4 w-4" });
        }
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // You can add a toast notification here
    };
    const downloadComplaintDetails = () => {
        const content = `
Complaint Details
=================
Complaint ID: ${complaint.id}
Type: ${complaint.type}
Status: ${complaint.status}
Priority: ${complaint.priority}
Description: ${complaint.description}
Location: ${complaint.area}
Address: ${complaint.address || "N/A"}
Ward: ${complaint.ward || "N/A"}
Submitted On: ${new Date(complaint.submittedOn).toLocaleString()}
${complaint.assignedOn ? `Assigned On: ${new Date(complaint.assignedOn).toLocaleString()}` : ""}
${complaint.resolvedOn ? `Resolved On: ${new Date(complaint.resolvedOn).toLocaleString()}` : ""}

Contact Information
==================
Name: ${user.name}
Email: ${user.email}
Phone: ${user.phone || "N/A"}
    `;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `complaint-${complaint.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "p-2 bg-blue-100 rounded-lg", children: _jsx(FileText, { className: "h-6 w-6 text-blue-600" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Complaint Details" }), _jsxs("p", { className: "text-sm text-gray-500", children: ["ID: ", complaint.id] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: downloadComplaintDetails, className: "hidden sm:flex", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Download"] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => copyToClipboard(complaint.id), children: _jsx(Copy, { className: "h-4 w-4" }) })] })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsx(Card, { className: "border-l-4 border-l-blue-500", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs(Badge, { className: `${getStatusColor(complaint.status)} border flex items-center space-x-1`, children: [getStatusIcon(complaint.status), _jsx("span", { children: complaint.status.replace("_", " ") })] }), _jsxs(Badge, { className: `${getPriorityColor(complaint.priority)} border`, children: [complaint.priority, " Priority"] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-sm text-gray-500", children: "Estimated Resolution" }), _jsx("div", { className: "font-medium text-blue-600", children: complaint.estimatedResolution })] })] }) }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("h3", { className: "font-semibold text-lg mb-4 flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2 text-blue-600" }), "Complaint Information"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Type" }), _jsx("p", { className: "text-gray-900", children: complaint.type })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Description" }), _jsx("p", { className: "text-gray-900 leading-relaxed", children: complaint.description })] }), _jsxs("div", { children: [_jsxs("label", { className: "text-sm font-medium text-gray-500 flex items-center", children: [_jsx(MapPin, { className: "h-4 w-4 mr-1" }), "Location"] }), _jsx("p", { className: "text-gray-900", children: complaint.area }), complaint.address && (_jsx("p", { className: "text-sm text-gray-600 mt-1", children: complaint.address })), complaint.landmark && (_jsxs("p", { className: "text-sm text-gray-600", children: ["Landmark: ", complaint.landmark] }))] }), complaint.ward && (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Ward" }), _jsx("p", { className: "text-gray-900", children: complaint.ward })] }))] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("h3", { className: "font-semibold text-lg mb-4 flex items-center", children: [_jsx(User, { className: "h-5 w-5 mr-2 text-green-600" }), "Contact Information"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Name" }), _jsx("p", { className: "text-gray-900", children: user.name })] }), _jsxs("div", { children: [_jsxs("label", { className: "text-sm font-medium text-gray-500 flex items-center", children: [_jsx(Mail, { className: "h-4 w-4 mr-1" }), "Email"] }), _jsx("p", { className: "text-gray-900", children: user.email })] }), user.phone && (_jsxs("div", { children: [_jsxs("label", { className: "text-sm font-medium text-gray-500 flex items-center", children: [_jsx(Phone, { className: "h-4 w-4 mr-1" }), "Phone"] }), _jsx("p", { className: "text-gray-900", children: user.phone })] })), (complaint.wardOfficer || complaint.assignedTo) && (_jsxs("div", { className: "pt-4 border-t", children: [_jsx("label", { className: "text-sm font-medium text-gray-500", children: "Assigned To" }), _jsx("p", { className: "text-gray-900", children: (complaint.wardOfficer || complaint.assignedTo).name }), _jsx("p", { className: "text-sm text-gray-600", children: (complaint.wardOfficer || complaint.assignedTo).role })] }))] })] }) })] }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsxs("h3", { className: "font-semibold text-lg mb-4 flex items-center", children: [_jsx(Clock, { className: "h-5 w-5 mr-2 text-orange-600" }), "Status Timeline"] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center", children: _jsx(CheckCircle, { className: "h-5 w-5 text-green-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "font-medium text-green-600", children: "Complaint Registered" }), _jsx("p", { className: "text-sm text-gray-500", children: new Date(complaint.submittedOn).toLocaleDateString() })] }), _jsx("p", { className: "text-sm text-gray-600", children: "Your complaint has been successfully registered in our system." })] })] }), _jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: `flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${complaint.assignedOn ? "bg-green-100" : "bg-gray-100"}`, children: _jsx(AlertCircle, { className: `h-5 w-5 ${complaint.assignedOn
                                                                ? "text-green-600"
                                                                : "text-gray-400"}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: `font-medium ${complaint.assignedOn
                                                                            ? "text-green-600"
                                                                            : "text-gray-400"}`, children: "Complaint Assigned" }), complaint.assignedOn && (_jsx("p", { className: "text-sm text-gray-500", children: new Date(complaint.assignedOn).toLocaleDateString() }))] }), _jsx("p", { className: "text-sm text-gray-600", children: complaint.assignedOn
                                                                    ? "Assigned to the appropriate team for resolution."
                                                                    : "Waiting to be assigned to a team member." })] })] }), _jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: `flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(complaint.status)
                                                            ? "bg-green-100"
                                                            : "bg-gray-100"}`, children: _jsx(Clock, { className: `h-5 w-5 ${["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(complaint.status)
                                                                ? "text-green-600"
                                                                : "text-gray-400"}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("p", { className: `font-medium ${["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(complaint.status)
                                                                        ? "text-green-600"
                                                                        : "text-gray-400"}`, children: "Work in Progress" }) }), _jsx("p", { className: "text-sm text-gray-600", children: ["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(complaint.status)
                                                                    ? "Our team is actively working on resolving your complaint."
                                                                    : "Work will begin once the complaint is assigned." })] })] }), _jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: `flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${complaint.resolvedOn ? "bg-green-100" : "bg-gray-100"}`, children: _jsx(CheckCircle, { className: `h-5 w-5 ${complaint.resolvedOn
                                                                ? "text-green-600"
                                                                : "text-gray-400"}` }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: `font-medium ${complaint.resolvedOn
                                                                            ? "text-green-600"
                                                                            : "text-gray-400"}`, children: "Complaint Resolved" }), complaint.resolvedOn && (_jsx("p", { className: "text-sm text-gray-500", children: new Date(complaint.resolvedOn).toLocaleDateString() }))] }), _jsx("p", { className: "text-sm text-gray-600", children: complaint.resolvedOn
                                                                    ? "Your complaint has been successfully resolved."
                                                                    : "Your complaint will be marked as resolved once the work is completed." })] })] })] })] }) }), complaint.attachments && complaint.attachments.length > 0 && (_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsx("h3", { className: "font-semibold text-lg mb-4", children: "Attachments" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: complaint.attachments.map((attachment, index) => (_jsxs("div", { className: "flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50", children: [_jsx(FileText, { className: "h-8 w-8 text-blue-600" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: attachment.originalName ||
                                                                attachment.fileName ||
                                                                `Attachment ${index + 1}` }), _jsx("p", { className: "text-xs text-gray-500", children: attachment.size
                                                                ? `${(attachment.size / 1024).toFixed(1)} KB`
                                                                : "" })] }), _jsx(Button, { variant: "ghost", size: "sm", children: _jsx(ExternalLink, { className: "h-4 w-4" }) })] }, index))) })] }) })), _jsxs("div", { className: "flex justify-between items-center pt-4 border-t", children: [_jsxs("div", { className: "text-sm text-gray-500", children: ["Need help? Contact support at", " ", _jsx("a", { href: "mailto:support@cochinsmartcity.in", className: "text-blue-600 hover:underline", children: "support@cochinsmartcity.in" })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsxs(Button, { variant: "outline", onClick: downloadComplaintDetails, className: "sm:hidden", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Download"] }), _jsx(Button, { onClick: onClose, children: "Close" })] })] })] })] }) }));
};
export default ComplaintDetailsModal;
