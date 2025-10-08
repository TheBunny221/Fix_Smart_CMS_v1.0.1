import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  useGetComplaintQuery,
  useUpdateComplaintStatusMutation,
} from "../store/api/complaintsApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Camera,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Phone,
  User,
  Wrench,
  FileText,
  Upload,
  Image,
  Download,
  File,
  Mail,
} from "lucide-react";
import PhotoUploadModal from "../components/PhotoUploadModal";
import AttachmentPreview from "../components/AttachmentPreview";

const TaskDetails: React.FC = () => {
  const { id } = useParams();
  const { user } = useAppSelector((state) => state.auth);
  const [workNote, setWorkNote] = useState("");
  const [completionNote, setCompletionNote] = useState("");

  // Safe rendering utility to prevent object rendering errors
  const safeRender = (value: any, fallback: string = "Unknown"): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "object") {
      // Handle user objects specifically
      if (value.fullName) return value.fullName;
      if (value.name) return value.name;
      if (value.title) return value.title;
      if (value.email) return value.email;
      // If it's an object but no recognizable fields, return fallback
      return fallback;
    }
    return String(value);
  };

  // Utility function to truncate file names
  const truncateFileName = (fileName: string, maxLength: number = 25): string => {
    if (!fileName || fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4) + '...';
    return `${truncatedName}.${extension}`;
  };

  // Utility function to safely format dates
  const formatDate = (dateValue: any, format: 'date' | 'datetime' = 'datetime'): string => {
    if (!dateValue) return 'Unknown date';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format === 'date' ? date.toLocaleDateString() : date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const isMaintenanceTeam = user?.role === "MAINTENANCE_TEAM";

  // Fetch complaint dynamically
  const {
    data: complaintResponse,
    isLoading: complaintLoading,
    error: complaintError,
    refetch: refetchComplaint,
  } = useGetComplaintQuery(id ?? "");

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [updateComplaintStatus] = useUpdateComplaintStatusMutation();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<{
    url: string;
    mimeType?: string | null;
    name?: string | null;
    size?: number | null;
  } | null>(null);

  // Handle both response structures: { data: { complaint: {...} } } and { data: {...} }
  const raw = (complaintResponse?.data as any)?.complaint || complaintResponse?.data;

  const addWorkUpdate = async () => {
    if (!task) return;
    if (!workNote || workNote.trim().length === 0) return;
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
    } catch (err) {
      console.error("Failed to add work log:", err);
    } finally {
      setIsAddingLog(false);
    }
  };

  const task = useMemo(() => {
    if (!raw) return null;

    // Debug: Log the raw data to identify object issues
    console.log("TaskDetails Debug Info:", {
      id,
      hasComplaintResponse: !!complaintResponse,
      hasRawData: !!raw,
      rawDataKeys: raw ? Object.keys(raw) : [],
      complaintError: complaintError ? String(complaintError) : null,
      responseStructure: complaintResponse ? {
        hasData: !!complaintResponse.data,
        hasComplaint: !!(complaintResponse.data as any)?.complaint,
        dataKeys: complaintResponse.data ? Object.keys(complaintResponse.data) : []
      } : null
    });

    const latLng = (() => {
      let lat = raw.latitude;
      let lng = raw.longitude;
      if ((!lat || !lng) && raw.coordinates) {
        try {
          const c =
            typeof raw.coordinates === "string"
              ? JSON.parse(raw.coordinates)
              : raw.coordinates;
          lat = c?.latitude ?? c?.lat ?? lat;
          lng = c?.longitude ?? c?.lng ?? lng;
        } catch {
          // ignore
        }
      }
      return { lat, lng };
    })();

    return {
      id: raw.id,
      complaintId: raw.complaintId,
      title: raw.title || (raw.type ? `${raw.type.replace("_", " ")} Issue` : "Task"),
      description: raw.description || "No description available",
      location: raw.area || raw.address || raw.location || "",
      coordinates: `${latLng.lat || ""}, ${latLng.lng || ""}`,
      priority: raw.priority || "MEDIUM",
      status: raw.status || "UNKNOWN",
      estimatedTime: raw.estimatedTime || null,
      dueDate: raw.deadline
        ? new Date(raw.deadline).toISOString().split("T")[0]
        : (raw.submittedOn ? new Date(new Date(raw.submittedOn).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null),
      assignedDate: raw.assignedOn || raw.submittedOn,
      submittedBy: raw.submittedBy?.fullName || "Unknown",
      contactPhone: raw.contactPhone || raw.mobile || "",
      contactName: safeRender(raw.contactName, ""),
      contactEmail: safeRender(raw.contactEmail, ""),
      materials: Array.isArray(raw.materials) ? raw.materials : [],
      tools: Array.isArray(raw.tools) ? raw.tools : [],
      workLog: (Array.isArray(raw.statusLogs) ? raw.statusLogs : []).map((s: any) => ({
        time: s.timestamp,
        note: s.comment || `Status changed to ${s.toStatus?.replace("_", " ") || "Unknown"}`,
        photo: false,
        user: s.user,
        fromStatus: s.fromStatus,
        toStatus: s.toStatus,
      })),
      attachments: [
        ...(Array.isArray(raw.attachments) ? raw.attachments.map((a: any) => ({
          ...a,
          uploadedBy: safeRender(a.uploadedBy, "Unknown"),
        })) : []),
        ...(Array.isArray(raw.photos) ? raw.photos.map((p: any) => ({
          id: p.id,
          fileName: p.fileName || p.originalName || p.photoUrl?.split("/").pop() || "Unknown file",
          mimeType: p.mimeType || "image/*",
          uploadedAt: p.uploadedAt,
          url: p.photoUrl || p.url,
          description: p.description || null,
          uploadedBy: safeRender(p.uploadedByTeam, "Unknown"),
          entityType: p.entityType || "COMPLAINT",
        })) : []),
      ],
    } as any;
  }, [raw]);

  if (complaintLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (complaintError) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error Loading Task
        </h2>
        <p className="text-gray-600 mb-4">
          {complaintError && typeof complaintError === 'object' && 'message' in complaintError
            ? (complaintError as any).message
            : 'Failed to load task details. Please try again.'}
        </p>
        <Link to="/maintenance">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Task Not Found
        </h2>
        <p className="text-gray-600 mb-4">
          {complaintError
            ? `Error loading task: ${typeof complaintError === 'object' && complaintError && 'message' in complaintError ? (complaintError as any).message : 'Unknown error'}`
            : "The task you're looking for doesn't exist or you don't have permission to view it."
          }
        </p>
        <div className="space-y-2">
          <Link to="/maintenance">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
          {complaintError && (
            <Button
              variant="outline"
              onClick={() => refetchComplaint?.()}
              className="ml-2"
            >
              Try Again
            </Button>
          )}
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-left text-sm">
            <strong>Debug Info:</strong>
            <pre className="mt-2 text-xs">
              {JSON.stringify({
                id,
                hasComplaintResponse: !!complaintResponse,
                hasRawData: !!raw,
                complaintError: complaintError ? String(complaintError) : null
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
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

  const getStatusColor = (status: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link to="/maintenance">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tasks
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Task #{task.complaintId || task.id}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={getStatusColor(task.status)}>
              {task.status?.replace("_", " ") || "Unknown"}
            </Badge>
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority} Priority
            </Badge>
            <span className="text-sm text-gray-500">Due: {task.dueDate}</span>
          </div>
        </div>
        {!isMaintenanceTeam && (
          <div className="flex space-x-2">
            <Button variant="outline">
              <Navigation className="h-4 w-4 mr-2" />
              Navigate
            </Button>
            <Button variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Call Contact
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Task Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Title</h3>
                <p className="text-gray-900">{safeRender(task.title)}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600">{task.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Location Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    {raw?.area && (
                      <p className="text-gray-600">
                        <strong>Area:</strong> {raw.area}
                      </p>
                    )}
                    {raw?.ward?.name && (
                      <p className="text-gray-600">
                        <strong>Ward:</strong> {raw.ward.name}
                      </p>
                    )}
                    {raw?.subZone?.name && (
                      <p className="text-gray-600">
                        <strong>Sub-Zone:</strong> {raw.subZone.name}
                      </p>
                    )}
                    {raw?.landmark && (
                      <p className="text-gray-600">
                        <strong>Landmark:</strong> {raw.landmark}
                      </p>
                    )}
                    {raw?.address && (
                      <p className="text-gray-600">
                        <strong>Address:</strong> {raw.address}
                      </p>
                    )}
                    {(raw?.latitude || raw?.longitude || raw?.coordinates) && (
                      <p className="text-gray-500 text-xs">
                        <strong>Coordinates:</strong> {task.coordinates}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Timeline
                  </h3>
                  <div className="space-y-1 text-sm">
                    {task.assignedDate && (
                      <p className="text-gray-600">
                        Assigned:{" "}
                        {new Date(task.assignedDate).toLocaleString?.() ||
                          task.assignedDate}
                      </p>
                    )}
                    {task.dueDate && (
                      <p className="text-gray-600">Due: {task.dueDate}</p>
                    )}
                    {task.estimatedTime && (
                      <p className="text-gray-600">
                        Est. Time: {task.estimatedTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Log - visible only to Admin, Ward Officer, Maintenance Team */}
          {["ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"].includes(
            user?.role || "",
          ) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Work Progress Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {task.workLog.length > 0 ? task.workLog.map((log: any, index: number) => {
                      const getStatusColor = (status: string) => {
                        switch (status) {
                          case "REGISTERED":
                            return "border-blue-500";
                          case "ASSIGNED":
                            return "border-yellow-500";
                          case "IN_PROGRESS":
                            return "border-orange-500";
                          case "RESOLVED":
                          case "COMPLETED":
                            return "border-green-500";
                          case "CLOSED":
                            return "border-gray-500";
                          default:
                            return "border-gray-400";
                        }
                      };

                      return (
                        <div
                          key={`log-${index}`}
                          className={`border-l-4 ${getStatusColor(log.toStatus)} pl-4 py-2`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">
                                  {log.toStatus ? `Status: ${log.toStatus.replace("_", " ")}` : "Status Update"}
                                </p>
                                {log.user && (
                                  <Badge variant="outline" className="text-xs">
                                    {log.user?.fullName || "Unknown"} ({log.user?.role || "Unknown"})
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{log.note}</p>
                              {log.fromStatus && (
                                <p className="text-xs text-gray-500">
                                  Changed from <span className="font-medium">{log.fromStatus.replace("_", " ")}</span> to <span className="font-medium">{log.toStatus?.replace("_", " ")}</span>
                                </p>
                              )}
                              {log.photo && (
                                <Badge variant="secondary" className="mt-1">
                                  📷 Photo Attached
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 ml-4">
                              {new Date(log.time).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-4 text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No work progress updates available yet</p>
                      </div>
                    )}


                  </div>

                  {/* Add New Log Entry */}
                  <div className="mt-6 pt-4 border-t">
                    <Label htmlFor="workNote">Add Work Update</Label>
                    <div className="flex space-x-2 mt-2">
                      <Textarea
                        id="workNote"
                        value={workNote}
                        onChange={(e) => setWorkNote(e.target.value)}
                        placeholder="Describe current work status..."
                        className="flex-1"
                        rows={2}
                      />
                      <div className="flex flex-col space-y-2">
                        <Button
                          size="sm"
                          onClick={() => setIsPhotoModalOpen(true)}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Photo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={addWorkUpdate}
                          disabled={isAddingLog || !workNote.trim()}
                        >
                          {isAddingLog ? "Adding..." : "Add Log"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Photos 
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center mb-4">
                      <Wrench className="h-5 w-5 mr-2 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Maintenance Photos</h3>
                    </div>
                    
                    {task.attachments.filter((att: any) => att.entityType === "MAINTENANCE_PHOTO").length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {task.attachments
                          .filter((att: any) => att.entityType === "MAINTENANCE_PHOTO")
                          .map((att: any) => {
                            const isImage = att.mimeType?.startsWith("image/");
                            const displayName = truncateFileName(att.fileName || att.originalName, 20);
                            const fullName = att.fileName || att.originalName;
                            
                            return (
                              <div
                                key={att.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="mb-3">
                                  {isImage ? (
                                    <img
                                      src={att.url}
                                      alt={fullName}
                                      className="w-full h-32 object-cover rounded-md cursor-pointer"
                                      onClick={() => {
                                        setPreviewItem({
                                          url: att.url,
                                          mimeType: att.mimeType,
                                          name: fullName,
                                          size: att.size,
                                        });
                                        setIsPreviewOpen(true);
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
                                      <File className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm text-gray-900 truncate" title={fullName}>
                                    {displayName}
                                  </h4>
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>By: {att.uploadedBy || "Unknown"}</span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(att.uploadedAt, 'date')}
                                  </div>
                                  {att.description && (
                                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                      <span className="font-medium">Note:</span> {att.description}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    onClick={() => {
                                      setPreviewItem({
                                        url: att.url,
                                        mimeType: att.mimeType,
                                        name: fullName,
                                        size: att.size,
                                      });
                                      setIsPreviewOpen(true);
                                    }}
                                  >
                                    Preview
                                  </Button>
                                  <a href={att.url} download={fullName} className="flex-1">
                                    <Button size="sm" className="w-full text-xs bg-teal-600 hover:bg-teal-700">
                                      Download
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No maintenance photos available</p>
                      </div>
                    )}
                  </div>

                  {/* Complaint Attachments 
                  <div className="mt-8">
                    <div className="flex items-center mb-4">
                      <Upload className="h-5 w-5 mr-2 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Complaint Attachments</h3>
                    </div>
                    
                    {task.attachments.filter((att: any) => att.entityType !== "MAINTENANCE_PHOTO").length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {task.attachments
                          .filter((att: any) => att.entityType !== "MAINTENANCE_PHOTO")
                          .map((att: any) => {
                            const isImage = att.mimeType?.startsWith("image/");
                            const displayName = truncateFileName(att.fileName || att.originalName, 20);
                            const fullName = att.fileName || att.originalName;
                            
                            return (
                              <div
                                key={att.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="mb-3">
                                  {isImage ? (
                                    <img
                                      src={att.url}
                                      alt={fullName}
                                      className="w-full h-32 object-cover rounded-md cursor-pointer"
                                      onClick={() => {
                                        setPreviewItem({
                                          url: att.url,
                                          mimeType: att.mimeType,
                                          name: fullName,
                                          size: att.size,
                                        });
                                        setIsPreviewOpen(true);
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
                                      <File className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm text-gray-900 truncate" title={fullName}>
                                    {displayName}
                                  </h4>
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>By: {att.uploadedBy || "Citizen"}</span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(att.uploadedAt, 'date')}
                                  </div>
                                  {att.description && (
                                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                      <span className="font-medium">Note:</span> {att.description}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    onClick={() => {
                                      setPreviewItem({
                                        url: att.url,
                                        mimeType: att.mimeType,
                                        name: fullName,
                                        size: att.size,
                                      });
                                      setIsPreviewOpen(true);
                                    }}
                                  >
                                    Preview
                                  </Button>
                                  <a href={att.url} download={fullName} className="flex-1">
                                    <Button size="sm" className="w-full text-xs bg-gray-600 hover:bg-gray-700">
                                      Download
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No complaint attachments available</p>
                      </div>
                    )}
                  </div>*/}
                </CardContent>
              </Card>
            )}

          {/* Duplicate attachment sections removed - now handled in sidebar after contact info */}
          {false && task && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  Maintenance Work Photos & Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Maintenance Photos Section */}
                  <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-blue-900">Maintenance Photos</h3>
                          <p className="text-sm text-blue-700">Photos taken during maintenance work</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-600 text-white px-3 py-1 text-sm font-semibold">
                        {task.attachments.filter((att: any) => att.entityType === "MAINTENANCE_PHOTO").length} photos
                      </Badge>
                    </div>

                    {task.attachments.filter((att: any) => att.entityType === "MAINTENANCE_PHOTO").length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                        {task.attachments
                          .filter((att: any) => att.entityType === "MAINTENANCE_PHOTO")
                          .map((att: any) => {
                            const isImage = att.mimeType?.startsWith("image/");
                            const canDownload = [
                              "ADMINISTRATOR",
                              "WARD_OFFICER",
                              "MAINTENANCE_TEAM",
                            ].includes(user?.role || "");
                            const displayName = truncateFileName(att.fileName || att.originalName, 20);
                            const fullName = att.fileName || att.originalName;

                            return (
                              <div
                                key={att.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="mb-3">
                                  {isImage ? (
                                    <div className="relative group">
                                      <img
                                        src={att.url}
                                        alt={fullName}
                                        className="w-full h-32 object-cover rounded-md cursor-pointer"
                                        onClick={() => {
                                          setPreviewItem({
                                            url: att.url,
                                            mimeType: att.mimeType,
                                            name: fullName,
                                            size: att.size,
                                          });
                                          setIsPreviewOpen(true);
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                          <div className="bg-white rounded-full p-2 shadow-lg">
                                            <Image className="h-5 w-5 text-blue-600" />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-32 sm:h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                                      <div className="text-center">
                                        <File className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                                        <span className="text-xs text-blue-700 font-medium">Document</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* File Information */}
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 text-sm leading-tight break-words" title={att.fileName || att.originalName}>
                                      {truncateFileName(att.fileName || att.originalName, 25)}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {(att.size / 1024).toFixed(1)}KB
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {formatDate(att.uploadedAt, 'date')}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Description */}
                                  {att.description && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                          <p className="text-xs font-medium text-blue-800 mb-1">Maintenance Note:</p>
                                          <p className="text-xs text-blue-700 break-words leading-relaxed">{att.description}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Uploader Info */}
                                  {att.uploadedBy && (
                                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                                      <User className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">Uploaded by {att.uploadedBy}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-4 flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 p-2 text-xs border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                                    onClick={() => {
                                      setPreviewItem({
                                        url: att.url,
                                        mimeType: att.mimeType,
                                        name: att.originalName || att.fileName,
                                        size: att.size,
                                      });
                                      setIsPreviewOpen(true);
                                    }}
                                  >
                                    <Image className="h-3 w-3 mr-1" />
                                    Preview
                                  </Button>
                                  {canDownload ? (
                                    <a
                                      href={att.url}
                                      download={att.originalName || att.fileName}
                                      className="flex-1"
                                    >
                                      <Button size="sm" className="w-full text-xs bg-blue-600 hover:bg-blue-700 shadow-md">
                                        <Download className="h-3 w-3 mr-1" />
                                        Download
                                      </Button>
                                    </a>
                                  ) : (
                                    <Button size="sm" disabled className="flex-1 text-xs">
                                      <Download className="h-3 w-3 mr-1" />
                                      Restricted
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-dashed border-blue-300">
                        <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <Wrench className="h-10 w-10 text-blue-500" />
                        </div>
                        <h4 className="text-lg font-semibold text-blue-800 mb-2">No Maintenance Attachments</h4>
                        <p className="text-sm text-blue-600 mb-4">Upload photos and documents from your maintenance work</p>
                        <div className="flex items-center justify-center gap-2 text-xs text-blue-500">
                          <Camera className="h-4 w-4" />
                          <span>Photos, documents, and reports will appear here</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Duplicate attachment sections removed - now handled in sidebar after contact info */}
          {false && task && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Complaint Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 rounded-xl p-6 border-2 border-gray-200 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-600 rounded-lg shadow-md">
                          <Upload className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Complaint Attachments</h3>
                          <p className="text-sm text-gray-700">Original files submitted with the complaint</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-gray-600 text-white px-3 py-1 text-sm font-semibold">
                        {task.attachments.filter((att: any) => att.entityType !== "MAINTENANCE_PHOTO").length} files
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                      {task.attachments.filter((att: any) => att.entityType !== "MAINTENANCE_PHOTO").length > 0 ?
                        task.attachments
                          .filter((att: any) => att.entityType !== "MAINTENANCE_PHOTO")
                          .map((att: any) => {
                            const isImage = att.mimeType?.startsWith("image/");
                            const canDownload = [
                              "ADMINISTRATOR",
                              "WARD_OFFICER",
                              "MAINTENANCE_TEAM",
                            ].includes(user?.role || "");
                            return (
                              <div
                                key={att.id}
                                className="group relative bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-gray-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                              >
                                {/* File Icon and Preview */}
                                <div className="flex items-center justify-center mb-3">
                                  {isImage ? (
                                    <div className="relative">
                                      <img
                                        src={att.url}
                                        alt={att.fileName || att.originalName}
                                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => {
                                          setPreviewItem({
                                            url: att.url,
                                            mimeType: att.mimeType,
                                            name: att.originalName || att.fileName,
                                            size: att.size,
                                          });
                                          setIsPreviewOpen(true);
                                        }}
                                      />
                                      <div className="absolute -top-1 -right-1 bg-gray-600 text-white rounded-full p-1">
                                        <Image className="h-3 w-3" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 grid place-items-center rounded-lg bg-gray-100 border border-gray-300">
                                      <File className="h-8 w-8 text-gray-600" />
                                    </div>
                                  )}
                                </div>

                                {/* File Information */}
                                <div className="flex-1 space-y-2">
                                  <div className="text-sm font-medium text-gray-900 text-center break-words" title={att.fileName || att.originalName}>
                                    {truncateFileName(att.fileName || att.originalName, 20)}
                                  </div>

                                  {/* Description */}
                                  {att.description && (
                                    <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                                      <div className="flex items-start gap-1">
                                        <FileText className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <span className="font-medium">Note:</span>
                                          <p className="mt-1 break-words">{att.description}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Metadata */}
                                  <div className="space-y-1 text-xs text-gray-600">
                                    {att.uploadedBy && (
                                      <div className="flex items-center gap-1 justify-center">
                                        <User className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{att.uploadedBy}</span>
                                      </div>
                                    )}
                                    <div className="text-center text-gray-500">
                                      {formatDate(att.uploadedAt, 'date')}
                                    </div>
                                    <div className="text-center text-gray-500 text-xs">
                                      {(att.size / 1024).toFixed(1)}KB
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-3 flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs border-gray-300 hover:bg-gray-50"
                                    onClick={() => {
                                      setPreviewItem({
                                        url: att.url,
                                        mimeType: att.mimeType,
                                        name: att.originalName || att.fileName,
                                        size: att.size,
                                      });
                                      setIsPreviewOpen(true);
                                    }}
                                  >
                                    <Image className="h-3 w-3 mr-1" />
                                    Preview
                                  </Button>
                                  {canDownload ? (
                                    <a
                                      href={att.url}
                                      download
                                      className="inline-flex items-center flex-1 sm:flex-none"
                                    >
                                      <Button size="sm" className="w-full">
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                      </Button>
                                    </a>
                                  ) : (
                                    <Button size="sm" disabled className="flex-1 sm:flex-none">
                                      <Download className="h-4 w-4 mr-1" />
                                      Restricted
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          }) : (
                          <div className="col-span-full text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                            <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                              <Upload className="h-10 w-10 text-gray-500" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">No Complaint Attachments</h4>
                            <p className="text-sm text-gray-600 mb-4">Original files submitted with the complaint</p>
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                              <FileText className="h-4 w-4" />
                              <span>Documents and images from the original complaint</span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completion Form */}

          <PhotoUploadModal
            isOpen={isPhotoModalOpen}
            onClose={() => setIsPhotoModalOpen(false)}
            complaintId={task?.id}
            isMaintenancePhoto={true}
            onSuccess={() => {
              refetchComplaint?.();
            }}
          />
          <AttachmentPreview
            open={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            item={previewItem}
            canDownload={[
              "ADMINISTRATOR",
              "WARD_OFFICER",
              "MAINTENANCE_TEAM",
            ].includes(user?.role || "")}
          />
          {task.status === "IN_PROGRESS" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Mark Task Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="completionNote">Completion Notes</Label>
                  <Textarea
                    id="completionNote"
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder="Describe the work completed, any issues resolved, and follow-up actions needed..."
                    rows={4}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Task
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsPhotoModalOpen(true)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Add Completion Photo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {safeRender(raw?.contactName || task.contactName, 'Unknown Contact')}
                  </span>
                  {raw?.submittedBy && (
                    <span className="text-xs text-gray-500">
                      Submitted by: {raw.submittedBy?.fullName || "Unknown"}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <div className="flex flex-col">
                  <span>{safeRender(raw?.contactPhone || task.contactPhone, 'No phone provided')}</span>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <div className="flex flex-col wrap-text">
                  <span>{safeRender(raw?.contactEmail || task.contactEmail, 'No email provided')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <>
              {/* Maintenance Photos */}
              {task.attachments.filter((att: any) => att.entityType === "MAINTENANCE_PHOTO").length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Wrench className="h-5 w-5 mr-2 text-blue-600" />
                      Maintenance Photos ({task.attachments.filter((att: any) => att.entityType === "MAINTENANCE_PHOTO").length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1  gap-4">
                      {task.attachments
                        .filter((att: any) => att.entityType === "MAINTENANCE_PHOTO")
                        .map((att: any) => {
                          const isImage = att.mimeType?.startsWith("image/");
                          const displayName = truncateFileName(att.fileName || att.originalName, 20);
                          const fullName = att.fileName || att.originalName;

                          return (
                            <div
                              key={att.id}
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="mb-3">
                                {isImage ? (
                                  <div className="relative group">
                                    <img
                                      src={att.url}
                                      alt={fullName}
                                      className="w-full h-32 object-cover rounded-md cursor-pointer"
                                      onClick={() => {
                                        setPreviewItem({
                                          url: att.url,
                                          mimeType: att.mimeType,
                                          name: fullName,
                                          size: att.size,
                                        });
                                        setIsPreviewOpen(true);
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="bg-white rounded-full p-2 shadow-lg">
                                          <Image className="h-5 w-5 text-blue-600" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-32 sm:h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                                    <div className="text-center">
                                      <File className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                                      <span className="text-xs text-blue-700 font-medium">Document</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-sm leading-tight break-words" title={att.fileName || att.originalName}>
                                    {truncateFileName(att.fileName || att.originalName, 25)}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {(att.size / 1024).toFixed(1)}KB
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(att.createdAt, 'date')}
                                    </span>
                                  </div>
                                </div>

                                {att.description && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                      <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium text-blue-800 mb-1">Maintenance Note:</p>
                                        <p className="text-xs text-blue-700 break-words leading-relaxed">{att.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {att.uploadedBy && (
                                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                                    <User className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">Uploaded by {att.uploadedBy}</span>
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 p-2 text-xs border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                                  onClick={() => {
                                    setPreviewItem({
                                      url: att.url,
                                      mimeType: att.mimeType,
                                      name: att.originalName || att.fileName,
                                      size: att.size,
                                    });
                                    setIsPreviewOpen(true);
                                  }}
                                >
                                  <Image className="h-3 w-3 mr-1" />
                                  Preview
                                </Button>
                                <a
                                  href={att.url}
                                  download
                                  className="inline-flex items-center"
                                >
                                  <Button size="sm" className="w-full p-2 text-xs">
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </a>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Original Attachments */}
              {task.attachments.filter((att: any) => att.entityType !== "MAINTENANCE_PHOTO").length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Upload className="h-5 w-5 mr-2" />
                      Original Attachments ({task.attachments.filter((att: any) => att.entityType !== "MAINTENANCE_PHOTO").length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      {task.attachments
                        .filter((att: any) => att.entityType !== "MAINTENANCE_PHOTO")
                        .map((att: any) => {
                          const isImage = att.mimeType?.startsWith("image/");
                          const displayName = truncateFileName(att.fileName || att.originalName, 20);
                          const fullName = att.fileName || att.originalName;

                          return (
                            <div
                              key={att.id}
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="mb-3">
                                {isImage ? (
                                  <div className="relative group">
                                    <img
                                      src={att.url}
                                      alt={fullName}
                                      className="w-full h-32 object-cover rounded-md cursor-pointer"
                                      onClick={() => {
                                        setPreviewItem({
                                          url: att.url,
                                          mimeType: att.mimeType,
                                          name: fullName,
                                          size: att.size,
                                        });
                                        setIsPreviewOpen(true);
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="bg-white rounded-full p-2 shadow-lg">
                                          <Image className="h-5 w-5 text-gray-600" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-32 sm:h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                                    <div className="text-center">
                                      <File className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                                      <span className="text-xs text-gray-700 font-medium">Document</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-sm leading-tight break-words" title={att.fileName || att.originalName}>
                                    {truncateFileName(att.fileName || att.originalName, 25)}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {(att.size / 1024).toFixed(1)}KB
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(att.createdAt, 'date')}
                                    </span>
                                  </div>
                                </div>

                                {att.description && (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                      <FileText className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium text-gray-800 mb-1">Note:</p>
                                        <p className="text-xs text-gray-700 break-words leading-relaxed">{att.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {att.uploadedBy && (
                                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                                    <User className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">Uploaded by {att.uploadedBy}</span>
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 p-2 text-xs border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                  onClick={() => {
                                    setPreviewItem({
                                      url: att.url,
                                      mimeType: att.mimeType,
                                      name: att.originalName || att.fileName,
                                      size: att.size,
                                    });
                                    setIsPreviewOpen(true);
                                  }}
                                >
                                  <Image className="h-3 w-3 mr-1" />
                                  Preview
                                </Button>
                                <a
                                  href={att.url}
                                  download
                                  className="inline-flex items-center"
                                >
                                  <Button size="sm" className="w-full p-2 text-xs">
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </a>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Required Materials - Hidden for Maintenance Team */}
          {!isMaintenanceTeam && (
            <Card>
              <CardHeader>
                <CardTitle>Required Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.materials.length > 0 ? (
                    task.materials.map((material: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{safeRender(material, 'Unknown material')}</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No materials specified for this task</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Required Tools - Hidden for Maintenance Team */}
          {!isMaintenanceTeam && (
            <Card>
              <CardHeader>
                <CardTitle>Required Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.tools.length > 0 ? (
                    task.tools.map((tool: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{safeRender(tool, 'Unknown tool')}</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No tools specified for this task</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions - Hidden for Maintenance Team */}
          {!isMaintenanceTeam && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
