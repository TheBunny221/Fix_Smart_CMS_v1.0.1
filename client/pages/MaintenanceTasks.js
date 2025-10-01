import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintsQuery, useUpdateComplaintStatusMutation, useGetComplaintPhotosQuery, useLazyGetComplaintQuery, } from "../store/api/complaintsApi";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, } from "../components/ui/dropdown-menu";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
const PhotoUploadModal = React.lazy(() => import("../components/PhotoUploadModal"));
import { Wrench, Calendar, MapPin, Clock, Camera, Navigation, CheckCircle, AlertTriangle, Play, RotateCcw, ListTodo, AlertCircle, ChevronDown, ChevronUp, Image, FileText, User, } from "lucide-react";
const MaintenanceTasks = () => {
    const { user } = useAppSelector((state) => state.auth);
    const { translations } = useAppSelector((state) => state.language);
    const [activeFilter, setActiveFilter] = useState("all");
    const [isMarkResolvedOpen, setIsMarkResolvedOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [resolveComment, setResolveComment] = useState("");
    const [resolvePhoto, setResolvePhoto] = useState(null);
    const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
    const [selectedTaskForPhotos, setSelectedTaskForPhotos] = useState(null);
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [navigatingId, setNavigatingId] = useState(null);
    const [triggerGetComplaint] = useLazyGetComplaintQuery();
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    // Fetch complaints assigned to this maintenance team member
    const { data: complaintsResponse, isLoading, error, refetch: refetchComplaints, } = useGetComplaintsQuery({
        maintenanceTeamId: user?.id,
        page: 1,
        limit: 100,
    });
    const [updateComplaintStatus] = useUpdateComplaintStatusMutation();
    // Helper function to get estimated time based on priority
    function getPriorityEstimatedTime(priority) {
        switch (priority) {
            case "CRITICAL":
                return "2-4 hours";
            case "HIGH":
                return "4-8 hours";
            case "MEDIUM":
                return "1-2 days";
            case "LOW":
                return "2-5 days";
            default:
                return "1-2 days";
        }
    }
    // Extract tasks from API response
    // Helper: normalize a complaint object into a task
    function mapComplaintToTask(complaint) {
        let lat = null;
        let lng = null;
        // Try parsing coordinates
        try {
            const coords = typeof complaint.coordinates === "string"
                ? JSON.parse(complaint.coordinates)
                : complaint.coordinates;
            lat = coords?.latitude ?? coords?.lat ?? complaint.latitude ?? null;
            lng = coords?.longitude ?? coords?.lng ?? complaint.longitude ?? null;
        }
        catch {
            lat = complaint.latitude ?? null;
            lng = complaint.longitude ?? null;
        }
        return {
            id: complaint.id,
            title: complaint.title || `${complaint.type} Issue`,
            location: complaint.area,
            address: [complaint.area, complaint.landmark, complaint.address]
                .filter(Boolean)
                .join(", "),
            priority: complaint.priority || "MEDIUM",
            status: complaint.status,
            estimatedTime: getPriorityEstimatedTime(complaint.priority),
            dueDate: complaint.deadline
                ? new Date(complaint.deadline).toISOString().split("T")[0]
                : null,
            isOverdue: complaint.deadline
                ? new Date(complaint.deadline) < new Date() &&
                    !["RESOLVED", "CLOSED"].includes(complaint.status)
                : false,
            description: complaint.description,
            assignedAt: complaint.assignedOn || complaint.submittedOn,
            resolvedAt: complaint.resolvedOn,
            photo: complaint.attachments?.[0]?.url || null,
            latitude: lat,
            longitude: lng,
            complaintId: complaint.complaintId,
            statusLogs: complaint.statusLogs || [],
        };
    }
    const tasks = useMemo(() => {
        const data = complaintsResponse?.data?.complaints ??
            (Array.isArray(complaintsResponse?.data) ? complaintsResponse.data : []);
        return Array.isArray(data) ? data.map(mapComplaintToTask) : [];
    }, [complaintsResponse]);
    // Calculate task counts with mutually exclusive buckets
    const taskCounts = {
        total: tasks.length,
        // Pending excludes overdue
        pending: tasks.filter((t) => t.status === "ASSIGNED" && !t.isOverdue)
            .length,
        // Overdue includes any active task past deadline (not RESOLVED/CLOSED)
        overdue: tasks.filter((t) => t.isOverdue).length,
        // Active (non-overdue) categories
        inProgress: tasks.filter((t) => t.status === "IN_PROGRESS" && !t.isOverdue)
            .length,
        reopened: tasks.filter((t) => t.status === "REOPENED" && !t.isOverdue)
            .length,
        // Completed categories
        resolved: tasks.filter((t) => t.status === "RESOLVED").length,
        closed: tasks.filter((t) => t.status === "CLOSED").length,
        // Additional counts for Ward-style filters
        registered: tasks.filter((t) => t.status === "REGISTERED").length,
        assigned: tasks.filter((t) => t.status === "ASSIGNED").length,
    };
    const showStatCards = false;
    // Filter tasks based on active filter
    const filteredTasks = tasks.filter((task) => {
        switch (activeFilter) {
            case "pending":
                return task.status === "ASSIGNED" && !task.isOverdue;
            case "overdue":
                return task.isOverdue;
            case "resolved":
                return task.status === "RESOLVED";
            case "closed":
                return task.status === "CLOSED";
            case "reopened":
                return task.status === "REOPENED" && !task.isOverdue;
            case "inProgress":
                return task.status === "IN_PROGRESS" && !task.isOverdue;
            case "registered":
                return task.status === "REGISTERED";
            case "assigned":
                return task.status === "ASSIGNED";
            case "total":
            case "all":
                return true;
            default:
                return true;
        }
    });
    // Handle task status updates
    const handleStartWork = async (taskId) => {
        try {
            await updateComplaintStatus({
                id: taskId,
                status: "IN_PROGRESS",
            }).unwrap();
            refetchComplaints();
        }
        catch (error) {
            console.error("Failed to start work:", error);
            // You might want to show a toast notification here
        }
    };
    const handleMarkResolved = (task) => {
        setSelectedTask(task);
        setIsMarkResolvedOpen(true);
    };
    const submitMarkResolved = async () => {
        if (selectedTask) {
            try {
                await updateComplaintStatus({
                    id: selectedTask.id,
                    status: "RESOLVED",
                    remarks: resolveComment,
                }).unwrap();
                // TODO: Handle photo upload when the photo upload modal is implemented
                if (resolvePhoto) {
                    console.log("Photo upload would happen here:", resolvePhoto.name);
                }
                setIsMarkResolvedOpen(false);
                setResolveComment("");
                setResolvePhoto(null);
                setSelectedTask(null);
                refetchComplaints();
            }
            catch (error) {
                console.error("Failed to mark as resolved:", error);
                // You might want to show a toast notification here
            }
        }
    };
    // Handle navigation
    const handleNavigate = async (task) => {
        try {
            console.log("Navigating to task:", task.coordinates);
            setNavigatingId(task.id);
            let lat = task.latitude;
            let lng = task.longitude;
            if ((!lat || !lng) && task.id) {
                const res = await triggerGetComplaint(task.id).unwrap();
                const c = res?.data || res;
                const comp = c?.complaint || c;
                lat = comp?.latitude ?? comp?.lat ?? lat;
                lng = comp?.longitude ?? comp?.lng ?? lng;
            }
            if (lat && lng) {
                const latNum = Number(lat);
                const lngNum = Number(lng);
                if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
                    const url = `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                    return;
                }
            }
            const encoded = encodeURIComponent(task.address || task.location || "");
            const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
            window.open(fallbackUrl, "_blank", "noopener,noreferrer");
        }
        catch (e) {
            const encoded = encodeURIComponent(task.address || task.location || "");
            window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank", "noopener,noreferrer");
        }
        finally {
            setNavigatingId(null);
        }
    };
    // Handle photo view
    const handleViewPhoto = (photoUrl) => {
        window.open(photoUrl, "_blank");
    };
    // Handle photo upload
    const handlePhotoUpload = (task) => {
        setSelectedTaskForPhotos(task);
        setIsPhotoUploadOpen(true);
    };
    // Toggle task expansion
    const toggleTaskExpansion = (taskId) => {
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    };
    // Work Progress Component
    const TaskProgressSection = ({ task }) => {
        const { data: photosResponse, isLoading: isLoadingPhotos, error: photosError, } = useGetComplaintPhotosQuery(task.id);
        const photos = photosResponse?.data?.photos || [];
        const statusLogs = task.statusLogs || [];
        // Combine photos and status logs into a timeline
        const timelineItems = useMemo(() => {
            const items = [];
            // Add status logs
            statusLogs.forEach((log) => {
                items.push({
                    type: "status",
                    timestamp: log.timestamp || log.createdAt,
                    content: log,
                });
            });
            // Add photos
            photos.forEach((photo) => {
                items.push({
                    type: "photo",
                    timestamp: photo.uploadedAt,
                    content: photo,
                });
            });
            // Sort by timestamp (newest first)
            return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }, [statusLogs, photos]);
        if (isLoadingPhotos) {
            return (_jsx("div", { className: "border-t bg-gray-50 p-4", children: _jsxs("div", { className: "animate-pulse motion-reduce:animate-none", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-1/3 mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-1/2" })] }) }));
        }
        return (_jsxs("div", { className: "border-t bg-gray-50 p-4", children: [_jsxs("div", { className: "flex items-center mb-3", children: [_jsx(FileText, { className: "h-4 w-4 mr-2 text-gray-600" }), _jsx("h4", { className: "font-medium text-gray-800", children: "Work Progress & Updates" })] }), timelineItems.length === 0 ? (_jsxs("div", { className: "text-center py-4 text-gray-500", children: [_jsx(Camera, { className: "h-8 w-8 mx-auto mb-2 text-gray-400" }), _jsx("p", { className: "text-sm", children: "No updates or photos yet" }), _jsx("p", { className: "text-xs", children: "Upload photos and add progress notes as you work" })] })) : (_jsx("div", { className: "space-y-3 max-h-80 overflow-y-auto", children: timelineItems.map((item, index) => (_jsx("div", { className: "border-l-2 border-blue-200 pl-4 pb-3", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "bg-white rounded-full p-1 border shadow-sm", children: item.type === "photo" ? (_jsx(Image, { className: "h-3 w-3 text-blue-600" })) : (_jsx(User, { className: "h-3 w-3 text-green-600" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("p", { className: "text-xs text-gray-500", children: new Date(item.timestamp).toLocaleString() }), item.type === "photo" && (_jsx(Badge, { variant: "outline", className: "text-xs", children: "Photo" }))] }), item.type === "photo" ? (_jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("img", { src: item.content.photoUrl, alt: "Work progress photo", className: "w-16 h-16 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity", onClick: () => handleViewPhoto(item.content.photoUrl) }), _jsxs("div", { className: "flex-1", children: [_jsxs("p", { className: "text-sm text-gray-600 mb-1", children: ["Uploaded by", " ", item.content.uploadedByTeam?.fullName ||
                                                                        "Team Member"] }), item.content.description && (_jsx("p", { className: "text-sm text-gray-800 bg-white rounded p-2 border", children: item.content.description })), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [item.content.originalName, " \u2022", " ", (item.content.size / 1024 / 1024).toFixed(1), "MB"] })] })] }) })) : (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Badge, { className: getStatusColor(item.content.toStatus), variant: "secondary", children: item.content.toStatus?.replace("_", " ") }), item.content.fromStatus && (_jsxs("span", { className: "text-xs text-gray-500", children: ["from ", item.content.fromStatus.replace("_", " ")] }))] }), item.content.comment && (_jsx("p", { className: "text-sm text-gray-700 bg-white rounded p-2 border", children: item.content.comment })), _jsxs("p", { className: "text-xs text-gray-500", children: ["by ", item.content.user?.fullName || "System"] })] }))] })] }) }, index))) })), photosError && (_jsx("div", { className: "text-center py-2 text-red-500 text-sm", children: "Failed to load photos" }))] }));
    };
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
            case "RESOLVED":
                return "bg-green-100 text-green-800";
            case "REOPENED":
                return "bg-purple-100 text-purple-800";
            case "CLOSED":
                return "bg-gray-200 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case "ASSIGNED":
                return _jsx(Clock, { className: "h-4 w-4" });
            case "IN_PROGRESS":
                return _jsx(AlertTriangle, { className: "h-4 w-4" });
            case "RESOLVED":
                return _jsx(CheckCircle, { className: "h-4 w-4" });
            case "REOPENED":
                return _jsx(RotateCcw, { className: "h-4 w-4" });
            case "CLOSED":
                return _jsx(CheckCircle, { className: "h-4 w-4" });
            default:
                return _jsx(Clock, { className: "h-4 w-4" });
        }
    };
    // Loading state
    if (isLoading) {
        return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "animate-pulse motion-reduce:animate-none", children: [_jsx("div", { className: "h-8 bg-gray-200 rounded w-1/3 mb-4" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4 mb-6", children: [...Array(5)].map((_, i) => (_jsx("div", { className: "h-24 bg-gray-200 rounded" }, i))) }), _jsx("div", { className: "h-64 bg-gray-200 rounded" })] }) }));
    }
    // Error state
    if (error) {
        return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "text-center py-12", children: [_jsx(AlertTriangle, { className: "h-12 w-12 mx-auto text-red-400 mb-4" }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Error Loading Tasks" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Failed to load your maintenance tasks. Please try again." }), _jsxs(Button, { onClick: () => refetchComplaints(), children: [_jsx(RotateCcw, { className: "h-4 w-4 mr-2" }), "Retry"] })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold mb-1", children: "Maintenance Dashboard" }), _jsx("p", { className: "text-blue-100", children: "Welcome back! Here's your current workload." })] }), _jsx("div", { className: "text-right", children: _jsx(Card, { className: `inline-flex items-center p-1 rounded-xl cursor-pointer transition-all ${activeFilter === "all" ? "ring-2 ring-primary bg-primary/10 scale-105" : "bg-white/10 hover:bg-white/20"}`, onClick: () => setActiveFilter("all"), children: _jsxs(CardHeader, { className: "flex items-center p-2 py-1 justify-between space-x-3", children: [_jsx("div", { children: _jsxs(CardTitle, { className: "text-sm font-medium text-white/90 flex items-center gap-2", children: [_jsx(ListTodo, { className: "h-4 w-4 text-white/90" }), "All"] }) }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-3xl font-extrabold text-white", children: taskCounts.total }), _jsx("div", { className: "text-xs text-white/80", children: "Total Tasks" })] })] }) }) })] }), _jsx("div", { className: "mt-4 flex flex-wrap items-center gap-2", children: _jsx(Button, { variant: "outline", size: "sm", className: "h-11 md:h-9 rounded-full px-4 border border-blue-200/40 bg-white text-blue-700 hover:bg-blue-50", onClick: () => refetchComplaints(), children: "Refresh" }) })] }), _jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "hidden md:flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Filter by Status" }), activeFilter !== "all" && (_jsx(Button, { variant: "outline", size: "sm", className: "h-11 md:h-9", onClick: () => setActiveFilter("all"), children: "Clear Filter" }))] }), _jsx("div", { className: "md:hidden sticky top-16 z-10 bg-gray-50/80 backdrop-blur border-b rounded-b-lg", children: _jsx("div", { className: "p-2", children: _jsx(Button, { variant: "outline", className: "w-full h-11 justify-center", "aria-expanded": mobileFiltersOpen, "aria-controls": "mobile-filters", onClick: () => setMobileFiltersOpen((o) => !o), children: "Filter" }) }) }), _jsx("div", { className: [
                            "mt-3",
                            mobileFiltersOpen ? "" : "hidden",
                            "md:block",
                        ].join(" "), id: "mobile-filters", children: _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4", children: [
                                // {
                                //   id: "all",
                                //   label: "All",
                                //   subtitle: "All tasks",
                                //   icon: ListTodo,
                                //   value: taskCounts.total,
                                //   style: {
                                //     ring: "ring-blue-500",
                                //     text: "text-blue-700",
                                //     textSoft: "text-blue-600",
                                //     bgSoft: "bg-blue-50",
                                //     chipRing: "ring-blue-200",
                                //   },
                                // },
                                {
                                    id: "pending",
                                    label: "Pending",
                                    subtitle: "Assigned tasks",
                                    icon: Clock,
                                    value: taskCounts.pending,
                                    style: {
                                        ring: "ring-indigo-500",
                                        text: "text-indigo-700",
                                        textSoft: "text-indigo-600",
                                        bgSoft: "bg-indigo-50",
                                        chipRing: "ring-indigo-200",
                                    },
                                },
                                {
                                    id: "overdue",
                                    label: "Overdue",
                                    subtitle: "Past deadline",
                                    icon: AlertCircle,
                                    value: taskCounts.overdue,
                                    style: {
                                        ring: "ring-red-500",
                                        text: "text-red-700",
                                        textSoft: "text-red-600",
                                        bgSoft: "bg-red-50",
                                        chipRing: "ring-red-200",
                                    },
                                },
                                {
                                    id: "inProgress",
                                    label: "In Progress",
                                    subtitle: "Active work",
                                    icon: Play,
                                    value: taskCounts.inProgress,
                                    style: {
                                        ring: "ring-orange-500",
                                        text: "text-orange-700",
                                        textSoft: "text-orange-600",
                                        bgSoft: "bg-orange-50",
                                        chipRing: "ring-orange-200",
                                    },
                                },
                                {
                                    id: "resolved",
                                    label: "Resolved",
                                    subtitle: "Resolved tasks",
                                    icon: CheckCircle,
                                    value: taskCounts.resolved,
                                    style: {
                                        ring: "ring-emerald-500",
                                        text: "text-emerald-700",
                                        textSoft: "text-emerald-600",
                                        bgSoft: "bg-emerald-50",
                                        chipRing: "ring-emerald-200",
                                    },
                                },
                                {
                                    id: "reopened",
                                    label: "Reopened",
                                    subtitle: "Reopened tasks",
                                    icon: RotateCcw,
                                    value: taskCounts.reopened,
                                    style: {
                                        ring: "ring-violet-500",
                                        text: "text-violet-700",
                                        textSoft: "text-violet-600",
                                        bgSoft: "bg-violet-50",
                                        chipRing: "ring-violet-200",
                                    },
                                },
                                {
                                    id: "closed",
                                    label: "Closed",
                                    subtitle: "Closed tasks",
                                    icon: FileText,
                                    value: taskCounts.closed,
                                    style: {
                                        ring: "ring-slate-500",
                                        text: "text-slate-700",
                                        textSoft: "text-slate-600",
                                        bgSoft: "bg-slate-50",
                                        chipRing: "ring-slate-200",
                                    },
                                },
                            ].map((m) => {
                                const active = activeFilter === m.id ||
                                    (m.id === "all" && activeFilter === "total");
                                const Icon = m.icon;
                                return (_jsxs(Card, { role: "button", tabIndex: 0, "aria-pressed": active, "aria-label": `${m.label}, ${m.value}`, onClick: () => setActiveFilter(active ? "all" : m.id), onKeyDown: (e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setActiveFilter(active ? "all" : m.id);
                                        }
                                    }, className: [
                                        "group relative cursor-pointer select-none rounded-2xl border bg-white shadow-sm transition-all",
                                        "hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                                        active
                                            ? `ring-2 ${m.style.ring} ${m.style.bgSoft} border-transparent`
                                            : "hover:border-neutral-200",
                                    ].join(" "), children: [_jsxs(CardHeader, { className: "flex flex-col items-center justify-center p-3 pb-1", children: [_jsx("div", { className: [
                                                        "mb-2 grid h-10 w-10 place-items-center rounded-full ring-1 ring-inset",
                                                        active
                                                            ? `${m.style.bgSoft} ${m.style.textSoft} ${m.style.chipRing}`
                                                            : "bg-neutral-50 text-neutral-600 ring-neutral-200",
                                                    ].join(" "), children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsx(CardTitle, { className: "text-sm font-semibold text-neutral-800", children: m.label })] }), _jsxs(CardContent, { className: "flex flex-col items-center p-2 pt-0", children: [_jsx("div", { className: [
                                                        "text-2xl font-bold leading-none tracking-tight",
                                                        active ? m.style.text : "text-neutral-900",
                                                    ].join(" "), children: m.value }), _jsx("p", { className: "mt-1 text-xs text-neutral-500", children: m.subtitle })] })] }, m.id));
                            }) }) })] }), showStatCards && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4", children: [_jsx(Card, { className: `cursor-pointer transition-colors ${activeFilter === "all" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`, onClick: () => setActiveFilter("all"), children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Tasks" }), _jsx("p", { className: "text-2xl font-bold text-blue-600", children: taskCounts.total })] }), _jsx(ListTodo, { className: "h-8 w-8 text-blue-600" })] }) }) }), _jsx(Card, { className: `cursor-pointer transition-colors ${activeFilter === "pending" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`, onClick: () => setActiveFilter("pending"), children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Pending Tasks" }), _jsx("p", { className: "text-2xl font-bold text-blue-600", children: taskCounts.pending })] }), _jsx(Clock, { className: "h-8 w-8 text-blue-600" })] }) }) }), _jsx(Card, { className: `cursor-pointer transition-colors ${activeFilter === "overdue" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`, onClick: () => setActiveFilter("overdue"), children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Overdue Tasks" }), _jsx("p", { className: "text-2xl font-bold text-red-600", children: taskCounts.overdue })] }), _jsx(AlertCircle, { className: "h-8 w-8 text-red-600" })] }) }) }), _jsx(Card, { className: `cursor-pointer transition-colors ${activeFilter === "inProgress" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`, onClick: () => setActiveFilter("inProgress"), children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "In Progress" }), _jsx("p", { className: "text-2xl font-bold text-orange-600", children: taskCounts.inProgress })] }), _jsx(Clock, { className: "h-8 w-8 text-orange-600" })] }) }) }), _jsx(Card, { className: `cursor-pointer transition-colors ${activeFilter === "resolved" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`, onClick: () => setActiveFilter("resolved"), children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Resolved Tasks" }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: taskCounts.resolved })] }), _jsx(CheckCircle, { className: "h-8 w-8 text-green-600" })] }) }) }), _jsx(Card, { className: `cursor-pointer transition-colors ${activeFilter === "reopened" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`, onClick: () => setActiveFilter("reopened"), children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Reopened Tasks" }), _jsx("p", { className: "text-2xl font-bold text-purple-600", children: taskCounts.reopened })] }), _jsx(RotateCcw, { className: "h-8 w-8 text-purple-600" })] }) }) }), _jsx(Card, { className: `cursor-pointer transition-colors ${activeFilter === "closed" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`, onClick: () => setActiveFilter("closed"), children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Closed" }), _jsx("p", { className: "text-2xl font-bold text-gray-800", children: taskCounts.closed })] }), _jsx(CheckCircle, { className: "h-8 w-8 text-gray-600" })] }) }) })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Wrench, { className: "h-5 w-5 mr-2" }), "My Tasks", " ", activeFilter !== "all" &&
                                            `(${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)})`] }), _jsxs(Badge, { variant: "secondary", children: [filteredTasks.length, " tasks"] })] }) }), _jsx(CardContent, { children: filteredTasks.length === 0 ? (_jsxs("div", { className: "text-center py-10 text-gray-500", children: [_jsx("div", { className: "mx-auto mb-3 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center", children: activeFilter === "overdue" ? (_jsx(AlertCircle, { className: "h-6 w-6 text-red-500" })) : activeFilter === "pending" ? (_jsx(Clock, { className: "h-6 w-6 text-blue-500" })) : activeFilter === "inProgress" ? (_jsx(Clock, { className: "h-6 w-6 text-orange-500" })) : activeFilter === "resolved" ? (_jsx(CheckCircle, { className: "h-6 w-6 text-green-500" })) : activeFilter === "reopened" ? (_jsx(RotateCcw, { className: "h-6 w-6 text-purple-500" })) : activeFilter === "closed" ? (_jsx(CheckCircle, { className: "h-6 w-6 text-gray-500" })) : (_jsx(ListTodo, { className: "h-6 w-6 text-blue-500" })) }), _jsx("p", { className: "font-medium", children: activeFilter === "overdue"
                                        ? "No overdue tasks"
                                        : activeFilter === "pending"
                                            ? "No pending tasks"
                                            : activeFilter === "inProgress"
                                                ? "No in-progress tasks"
                                                : activeFilter === "resolved"
                                                    ? "No resolved tasks"
                                                    : activeFilter === "reopened"
                                                        ? "No reopened tasks"
                                                        : activeFilter === "closed"
                                                            ? "No closed tasks"
                                                            : "No tasks to show" }), _jsx("p", { className: "text-sm mt-1", children: "Try a different filter or refresh." })] })) : (_jsx("div", { className: "space-y-4", children: filteredTasks.map((task) => (_jsxs("div", { className: "border rounded-lg p-4 hover:bg-gray-50", children: [_jsxs("div", { className: "flex justify-between items-start mb-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-medium text-lg", children: task.title }), _jsx("p", { className: "text-gray-600 text-sm mt-1", children: task.description })] }), _jsxs("div", { className: "flex space-x-2 ml-4", children: [_jsx(Badge, { className: getPriorityColor(task.priority), children: task.priority }), _jsx(Badge, { className: getStatusColor(task.status), children: _jsxs("span", { className: "flex items-center", children: [getStatusIcon(task.status), _jsx("span", { className: "ml-1", children: task.status.replace("_", " ") })] }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(MapPin, { className: "h-4 w-4 mr-1" }), _jsx("span", { children: task.location })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "h-4 w-4 mr-1" }), _jsxs("span", { children: ["Est. ", task.estimatedTime] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1" }), _jsxs("span", { children: ["Due: ", task.dueDate] })] })] }), _jsxs("div", { className: "flex flex-col md:flex-row md:justify-between gap-3 items-stretch md:items-center", children: [_jsxs("div", { className: "flex flex-wrap gap-2 w-full md:w-auto", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "h-11 md:h-9", onClick: () => handleNavigate(task), disabled: navigatingId === task.id, children: [_jsx(Navigation, { className: `h-3 w-3 mr-1 ${navigatingId === task.id ? "animate-pulse" : ""}` }), navigatingId === task.id ? "Opening..." : "Navigate"] }), task.photo ? (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "h-11 md:h-9", children: [_jsx(Camera, { className: "h-3 w-3 mr-1" }), "Photos"] }) }), _jsxs(DropdownMenuContent, { children: [_jsx(DropdownMenuItem, { onClick: () => handleViewPhoto(task.photo), children: "View Existing Photo" }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, { onClick: () => handlePhotoUpload(task), children: "Upload New Photos" })] })] })) : (_jsxs(Button, { variant: "outline", size: "sm", className: "h-11 md:h-9", onClick: () => handlePhotoUpload(task), children: [_jsx(Camera, { className: "h-3 w-3 mr-1" }), "Add Photos"] })), _jsxs(Button, { variant: "outline", size: "sm", className: "h-11 md:h-9", onClick: () => toggleTaskExpansion(task.id), children: [expandedTaskId === task.id ? (_jsx(ChevronUp, { className: "h-3 w-3 mr-1" })) : (_jsx(ChevronDown, { className: "h-3 w-3 mr-1" })), "Progress"] })] }), _jsxs("div", { className: "flex flex-wrap gap-2 w-full md:w-auto md:justify-end", children: [task.status === "ASSIGNED" && (_jsxs(Button, { size: "sm", className: "h-11 md:h-9", onClick: () => handleStartWork(task.id), children: [_jsx(Play, { className: "h-3 w-3 mr-1" }), "Start Work"] })), (task.status === "IN_PROGRESS" ||
                                                        task.status === "REOPENED") && (_jsxs(Button, { size: "sm", className: "h-11 md:h-9", onClick: () => handleMarkResolved(task), children: [_jsx(CheckCircle, { className: "h-3 w-3 mr-1" }), "Mark as Resolved"] })), _jsx(Link, { to: `/tasks/${task.id}`, children: _jsx(Button, { variant: "outline", size: "sm", className: "h-11 md:h-9", children: "Details" }) })] })] }), expandedTaskId === task.id && (_jsx(TaskProgressSection, { task: task }))] }, task.id))) })) })] }), _jsx(Dialog, { open: isMarkResolvedOpen, onOpenChange: setIsMarkResolvedOpen, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Mark Task as Resolved" }) }), selectedTask && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: selectedTask.title }), _jsx("p", { className: "text-sm text-gray-600", children: selectedTask.location })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "resolveComment", children: "Completion Notes" }), _jsx(Textarea, { id: "resolveComment", value: resolveComment, onChange: (e) => setResolveComment(e.target.value), placeholder: "Add notes about the work completed...", rows: 3 })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "resolvePhoto", children: "Upload Completion Photo" }), _jsx(Input, { id: "resolvePhoto", type: "file", accept: "image/*", onChange: (e) => setResolvePhoto(e.target.files?.[0] || null) }), resolvePhoto && (_jsxs("p", { className: "text-sm text-green-600 mt-1", children: ["Photo selected: ", resolvePhoto.name] }))] }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                setIsMarkResolvedOpen(false);
                                                setResolveComment("");
                                                setResolvePhoto(null);
                                                setSelectedTask(null);
                                            }, children: "Cancel" }), _jsxs(Button, { onClick: submitMarkResolved, disabled: !resolveComment.trim(), children: [_jsx(CheckCircle, { className: "h-4 w-4 mr-2" }), "Mark Resolved"] })] })] }))] }) }), selectedTaskForPhotos && (_jsx(React.Suspense, { fallback: _jsx("div", { className: "fixed inset-0 z-50 grid place-items-center bg-black/10", children: _jsx("div", { className: "rounded-md bg-white px-4 py-2 text-sm shadow", children: "Loading\u2026" }) }), children: _jsx(PhotoUploadModal, { isOpen: isPhotoUploadOpen, onClose: () => {
                        setIsPhotoUploadOpen(false);
                        setSelectedTaskForPhotos(null);
                    }, complaintId: selectedTaskForPhotos.id, onSuccess: () => {
                        refetchComplaints();
                        setExpandedTaskId(selectedTaskForPhotos.id);
                    } }) }))] }));
};
export default MaintenanceTasks;
