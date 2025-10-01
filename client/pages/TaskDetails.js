import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintQuery, useUpdateComplaintStatusMutation, } from "../store/api/complaintsApi";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { ArrowLeft, MapPin, Calendar, Camera, Navigation, CheckCircle, AlertTriangle, Phone, User, Wrench, FileText, Upload, Image, Download, File, Mail, } from "lucide-react";
import PhotoUploadModal from "../components/PhotoUploadModal";
import AttachmentPreview from "../components/AttachmentPreview";
const TaskDetails = () => {
    const { id } = useParams();
    const { user } = useAppSelector((state) => state.auth);
    const [workNote, setWorkNote] = useState("");
    const [completionNote, setCompletionNote] = useState("");
    const isMaintenanceTeam = user?.role === "MAINTENANCE_TEAM";
    // Fetch complaint dynamically
    const { data: complaintResponse, isLoading: complaintLoading, error: complaintError, refetch: refetchComplaint, } = useGetComplaintQuery(id ?? "");
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [isAddingLog, setIsAddingLog] = useState(false);
    const [updateComplaintStatus] = useUpdateComplaintStatusMutation();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);
    const raw = complaintResponse?.data?.complaint;
    const addWorkUpdate = async () => {
        if (!task)
            return;
        if (!workNote || workNote.trim().length === 0)
            return;
        try {
            setIsAddingLog(true);
            await updateComplaintStatus({
                id: task.id,
                status: "IN_PROGRESS",
                remarks: workNote.trim(),
            }).unwrap();
            setWorkNote("");
            // refresh complaint to show new status log
            refetchComplaint?.();
        }
        catch (err) {
            console.error("Failed to add work log:", err);
        }
        finally {
            setIsAddingLog(false);
        }
    };
    const task = useMemo(() => {
        if (!raw)
            return null;
        const latLng = (() => {
            let lat = raw.latitude;
            let lng = raw.longitude;
            if ((!lat || !lng) && raw.coordinates) {
                try {
                    const c = typeof raw.coordinates === "string"
                        ? JSON.parse(raw.coordinates)
                        : raw.coordinates;
                    lat = c?.latitude ?? c?.lat ?? lat;
                    lng = c?.longitude ?? c?.lng ?? lng;
                }
                catch {
                    // ignore
                }
            }
            return { lat, lng };
        })();
        return {
            id: raw.id,
            complaintId: raw.complaintId,
            title: raw.title || (raw.type ? `${raw.type} Issue` : "Task"),
            description: raw.description,
            location: raw.area || raw.address || raw.location || "",
            coordinates: `${latLng.lat || ""}, ${latLng.lng || ""}`,
            priority: raw.priority || "MEDIUM",
            status: raw.status,
            estimatedTime: raw.estimatedTime || null,
            dueDate: raw.deadline
                ? new Date(raw.deadline).toISOString().split("T")[0]
                : null,
            assignedDate: raw.assignedOn || raw.submittedOn,
            submittedBy: raw.submittedBy?.fullName || raw.submittedBy || "",
            contactPhone: raw.contactPhone || raw.mobile || "",
            materials: raw.materials || [],
            tools: raw.tools || [],
            workLog: (raw.statusLogs || []).map((s) => ({
                time: s.timestamp,
                note: s.comment || `${s.toStatus}`,
                photo: false,
                user: s.user,
            })),
            attachments: [
                ...(raw.attachments || []),
                ...((raw.photos || []).map((p) => ({
                    id: p.id,
                    fileName: p.fileName || p.originalName || p.photoUrl?.split("/").pop(),
                    mimeType: p.mimeType,
                    uploadedAt: p.uploadedAt,
                    url: p.photoUrl || p.photoUrl || p.url,
                    description: p.description || null,
                    uploadedBy: p.uploadedByTeam?.fullName || null,
                })) || []),
            ],
        };
    }, [raw]);
    if (complaintLoading) {
        return _jsx("div", { children: "Loading task..." });
    }
    if (complaintError || !task) {
        return (_jsx("div", { className: "space-y-6", children: _jsx("p", { className: "text-red-600", children: "Failed to load task details." }) }));
    }
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
            case "ASSIGNED":
                return "bg-blue-100 text-blue-800";
            case "IN_PROGRESS":
                return "bg-orange-100 text-orange-800";
            case "COMPLETED":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx(Link, { to: "/maintenance", children: _jsxs(Button, { variant: "ghost", size: "sm", children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Tasks"] }) }), _jsxs("h1", { className: "text-2xl font-bold text-gray-900", children: ["Task #", task.complaintId || task.id] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Badge, { className: getStatusColor(task.status), children: task.status.replace("_", " ") }), _jsxs(Badge, { className: getPriorityColor(task.priority), children: [task.priority, " Priority"] }), _jsxs("span", { className: "text-sm text-gray-500", children: ["Due: ", task.dueDate] })] })] }), !isMaintenanceTeam && (_jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { variant: "outline", children: [_jsx(Navigation, { className: "h-4 w-4 mr-2" }), "Navigate"] }), _jsxs(Button, { variant: "outline", children: [_jsx(Phone, { className: "h-4 w-4 mr-2" }), "Call Contact"] })] }))] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Wrench, { className: "h-5 w-5 mr-2" }), "Task Details"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-2", children: "Title" }), _jsx("p", { className: "text-gray-900", children: task.title })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-2", children: "Description" }), _jsx("p", { className: "text-gray-600", children: task.description })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-medium mb-2 flex items-center", children: [_jsx(MapPin, { className: "h-4 w-4 mr-1" }), "Location Information"] }), _jsxs("div", { className: "space-y-1 text-sm", children: [raw?.area && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Area:" }), " ", raw.area] })), raw?.ward?.name && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Ward:" }), " ", raw.ward.name] })), raw?.subZone?.name && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Sub-Zone:" }), " ", raw.subZone.name] })), raw?.landmark && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Landmark:" }), " ", raw.landmark] })), raw?.address && (_jsxs("p", { className: "text-gray-600", children: [_jsx("strong", { children: "Address:" }), " ", raw.address] })), (raw?.latitude || raw?.longitude || raw?.coordinates) && (_jsxs("p", { className: "text-gray-500 text-xs", children: [_jsx("strong", { children: "Coordinates:" }), " ", task.coordinates] }))] })] }), _jsxs("div", { children: [_jsxs("h3", { className: "font-medium mb-2 flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1" }), "Timeline"] }), _jsxs("div", { className: "space-y-1 text-sm", children: [task.assignedDate && (_jsxs("p", { className: "text-gray-600", children: ["Assigned:", " ", new Date(task.assignedDate).toLocaleString?.() ||
                                                                                task.assignedDate] })), task.dueDate && (_jsxs("p", { className: "text-gray-600", children: ["Due: ", task.dueDate] })), task.estimatedTime && (_jsxs("p", { className: "text-gray-600", children: ["Est. Time: ", task.estimatedTime] }))] })] })] })] })] }), ["ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"].includes(user?.role) && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2" }), "Work Progress Log"] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "space-y-4", children: [task.workLog.map((log, index) => (_jsx("div", { className: "border-l-4 border-blue-500 pl-4 py-2", children: _jsx("div", { className: "flex justify-between items-start", children: _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: new Date(log.time).toLocaleString
                                                                            ? new Date(log.time).toLocaleString()
                                                                            : log.time }), _jsx("p", { className: "text-sm text-gray-600", children: log.note }), log.photo && (_jsx(Badge, { variant: "secondary", className: "mt-1", children: "\uD83D\uDCF7 Photo Attached" }))] }) }) }, `log-${index}`))), task.attachments &&
                                                        task.attachments.filter((a) => a.mimeType?.startsWith("image/")).length > 0 && (_jsxs("div", { className: "pt-2", children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Photos" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: task.attachments
                                                                    .filter((a) => a.mimeType?.startsWith("image/"))
                                                                    .map((att) => (_jsxs("div", { className: "border rounded p-2", children: [_jsx("img", { src: att.url, alt: att.fileName || att.originalName, className: "w-full h-28 object-cover rounded mb-2 cursor-pointer", onClick: () => {
                                                                                setPreviewItem({
                                                                                    url: att.url,
                                                                                    mimeType: att.mimeType || "image/*",
                                                                                    name: att.fileName || att.originalName,
                                                                                    size: null,
                                                                                });
                                                                                setIsPreviewOpen(true);
                                                                            } }), _jsx("div", { className: "text-xs text-gray-600", children: att.fileName || att.originalName }), att.description && (_jsx("div", { className: "text-sm text-gray-700 mt-1", children: att.description })), att.uploadedBy && (_jsxs("div", { className: "text-xs text-gray-500 mt-1", children: ["Uploaded by: ", att.uploadedBy] })), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: new Date(att.uploadedAt).toLocaleString() }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx(Button, { size: "xs", variant: "outline", onClick: () => {
                                                                                        setPreviewItem({
                                                                                            url: att.url,
                                                                                            mimeType: att.mimeType || "image/*",
                                                                                            name: att.fileName || att.originalName,
                                                                                            size: null,
                                                                                        });
                                                                                        setIsPreviewOpen(true);
                                                                                    }, children: "Preview" }), _jsx("a", { href: att.url, download: true, className: "inline-flex items-center", children: _jsx(Button, { size: "xs", children: "Download" }) })] })] }, att.id))) })] }))] }), _jsxs("div", { className: "mt-6 pt-4 border-t", children: [_jsx(Label, { htmlFor: "workNote", children: "Add Work Update" }), _jsxs("div", { className: "flex space-x-2 mt-2", children: [_jsx(Textarea, { id: "workNote", value: workNote, onChange: (e) => setWorkNote(e.target.value), placeholder: "Describe current work status...", className: "flex-1", rows: 2 }), _jsxs("div", { className: "flex flex-col space-y-2", children: [_jsxs(Button, { size: "sm", onClick: () => setIsPhotoModalOpen(true), children: [_jsx(Camera, { className: "h-4 w-4 mr-1" }), "Photo"] }), _jsx(Button, { size: "sm", variant: "outline", onClick: addWorkUpdate, disabled: isAddingLog || !workNote.trim(), children: isAddingLog ? "Adding..." : "Add Log" })] })] })] }), _jsxs("div", { className: "mt-6 pt-4 border-t", children: [_jsxs("h3", { className: "font-medium mb-3 flex items-center", children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), "Attachments"] }), _jsx("div", { className: "space-y-3", children: task.attachments.map((att) => {
                                                            const isImage = att.mimeType?.startsWith("image/");
                                                            const canDownload = [
                                                                "ADMINISTRATOR",
                                                                "WARD_OFFICER",
                                                                "MAINTENANCE_TEAM",
                                                            ].includes(user?.role);
                                                            return (_jsxs("div", { className: "flex items-center justify-between border rounded p-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-10 w-10 grid place-items-center rounded bg-gray-100", children: isImage ? (_jsx(Image, { className: "h-5 w-5" })) : (_jsx(File, { className: "h-5 w-5" })) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: att.fileName || att.originalName }), att.description && (_jsx("div", { className: "text-sm text-gray-700", children: att.description })), att.uploadedBy && (_jsxs("div", { className: "text-xs text-gray-500", children: ["Uploaded by: ", att.uploadedBy] })), _jsxs("div", { className: "text-xs text-gray-500", children: [att.mimeType, " \u2022", " ", new Date(att.uploadedAt).toLocaleString()] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => {
                                                                                    setPreviewItem({
                                                                                        url: att.url,
                                                                                        mimeType: att.mimeType,
                                                                                        name: att.originalName || att.fileName,
                                                                                        size: att.size,
                                                                                    });
                                                                                    setIsPreviewOpen(true);
                                                                                }, children: "Preview" }), canDownload ? (_jsx("a", { href: att.url, download: true, className: "inline-flex items-center", children: _jsxs(Button, { size: "sm", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Download"] }) })) : (_jsxs(Button, { size: "sm", disabled: true, children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), "Restricted"] }))] })] }, att.id));
                                                        }) })] })] })] })), _jsx(PhotoUploadModal, { isOpen: isPhotoModalOpen, onClose: () => setIsPhotoModalOpen(false), complaintId: task?.id, onSuccess: () => {
                                    refetchComplaint?.();
                                } }), _jsx(AttachmentPreview, { open: isPreviewOpen, onOpenChange: setIsPreviewOpen, item: previewItem, canDownload: [
                                    "ADMINISTRATOR",
                                    "WARD_OFFICER",
                                    "MAINTENANCE_TEAM",
                                ].includes(user?.role) }), task.status === "IN_PROGRESS" && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(CheckCircle, { className: "h-5 w-5 mr-2" }), "Mark Task Complete"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "completionNote", children: "Completion Notes" }), _jsx(Textarea, { id: "completionNote", value: completionNote, onChange: (e) => setCompletionNote(e.target.value), placeholder: "Describe the work completed, any issues resolved, and follow-up actions needed...", rows: 4 })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { children: [_jsx(CheckCircle, { className: "h-4 w-4 mr-2" }), "Complete Task"] }), _jsxs(Button, { variant: "outline", onClick: () => setIsPhotoModalOpen(true), children: [_jsx(Camera, { className: "h-4 w-4 mr-2" }), "Add Completion Photo"] })] })] })] }))] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(User, { className: "h-5 w-5 mr-2" }), "Contact Information"] }) }), _jsxs(CardContent, { className: "space-y-3", children: [raw?.contactName && (_jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "h-4 w-4 mr-2 text-gray-400" }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium", children: raw.contactName }), raw?.submittedBy?.fullName && (_jsxs("span", { className: "text-xs text-gray-500", children: ["Registered User: ", raw.submittedBy.fullName] }))] })] })), _jsxs("div", { className: "flex items-center", children: [_jsx(Phone, { className: "h-4 w-4 mr-2 text-gray-400" }), _jsx("div", { className: "flex flex-col", children: _jsx("span", { children: raw?.contactPhone || task.contactPhone }) })] }), raw?.contactEmail && (_jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "h-4 w-4 mr-2 text-gray-400" }), _jsx("div", { className: "flex flex-col", children: _jsx("span", { children: raw.contactEmail }) })] }))] })] }), !isMaintenanceTeam && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Required Materials" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: task.materials.map((material, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: material }), _jsx(CheckCircle, { className: "h-4 w-4 text-green-600" })] }, index))) }) })] })), !isMaintenanceTeam && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Required Tools" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: task.tools.map((tool, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: tool }), _jsx(CheckCircle, { className: "h-4 w-4 text-green-600" })] }, index))) }) })] })), !isMaintenanceTeam && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Quick Actions" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Camera, { className: "h-4 w-4 mr-2" }), "Take Photo"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), "Upload Document"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(AlertTriangle, { className: "h-4 w-4 mr-2" }), "Report Issue"] })] })] }))] })] })] }));
};
export default TaskDetails;
