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
      return value.name || value.title || value.fullName || value.email || fallback;
    }
    return String(value);
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
      materials: raw.materials,
      tools: raw.tools,
      contactName: raw.contactName,
      contactPhone: raw.contactPhone,
      contactEmail: raw.contactEmail,
      fullRawData: raw
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
      submittedBy: safeRender(raw.submittedBy, "Unknown"),
      contactPhone: raw.contactPhone || raw.mobile || "",
      contactName: raw.contactName || "",
      contactEmail: raw.contactEmail || "",
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
        ...(Array.isArray(raw.attachments) ? raw.attachments : []),
        ...(Array.isArray(raw.photos) ? raw.photos.map((p: any) => ({
          id: p.id,
          fileName: p.fileName || p.originalName || p.photoUrl?.split("/").pop() || "Unknown file",
          mimeType: p.mimeType || "image/*",
          uploadedAt: p.uploadedAt,
          url: p.photoUrl || p.url,
          description: p.description || null,
          uploadedBy: safeRender(p.uploadedByTeam, "Unknown"),
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
          The task you're looking for doesn't exist or you don't have permission to view it.
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
                                  {safeRender(log.user)} ({log.user?.role || "Unknown"})
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

                  {/* Render image attachments as part of the work log so uploads appear immediately */}
                  {task.attachments &&
                    task.attachments.filter((a: any) =>
                      a.mimeType?.startsWith("image/"),
                    ).length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-sm font-medium mb-2">Photos</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {task.attachments
                            .filter((a: any) =>
                              a.mimeType?.startsWith("image/"),
                            )
                            .map((att: any) => (
                              <div key={att.id} className="border rounded p-2">
                                <img
                                  src={att.url}
                                  alt={att.fileName || att.originalName}
                                  className="w-full h-28 object-cover rounded mb-2 cursor-pointer"
                                  onClick={() => {
                                    setPreviewItem({
                                      url: att.url,
                                      mimeType: att.mimeType || "image/*",
                                      name: att.fileName || att.originalName,
                                      size: null,
                                    });
                                    setIsPreviewOpen(true);
                                  }}
                                />
                                <div className="text-xs text-gray-600">
                                  {att.fileName || att.originalName}
                                </div>
                                {att.description && (
                                  <div className="text-sm text-gray-700 mt-1">
                                    {att.description}
                                  </div>
                                )}
                                {att.uploadedBy && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Uploaded by: {att.uploadedBy}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(att.uploadedAt).toLocaleString()}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setPreviewItem({
                                        url: att.url,
                                        mimeType: att.mimeType || "image/*",
                                        name: att.fileName || att.originalName,
                                        size: null,
                                      });
                                      setIsPreviewOpen(true);
                                    }}
                                  >
                                    Preview
                                  </Button>
                                  <a
                                    href={att.url}
                                    download
                                    className="inline-flex items-center"
                                  >
                                    <Button size="sm">Download</Button>
                                  </a>
                                </div>
                              </div>
                            ))}
                        </div>
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

                {/* Attachments listed here as well (visible to same roles) */}
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Attachments
                  </h3>
                  <div className="space-y-3">
                    {task.attachments.length > 0 ? task.attachments.map((att: any) => {
                      const isImage = att.mimeType?.startsWith("image/");
                      const canDownload = [
                        "ADMINISTRATOR",
                        "WARD_OFFICER",
                        "MAINTENANCE_TEAM",
                      ].includes(user?.role || "");
                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between border rounded p-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 grid place-items-center rounded bg-gray-100">
                              {isImage ? (
                                <Image className="h-5 w-5" />
                              ) : (
                                <File className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">
                                {att.fileName || att.originalName}
                              </div>
                              {att.description && (
                                <div className="text-sm text-gray-700">
                                  {att.description}
                                </div>
                              )}
                              {att.uploadedBy && (
                                <div className="text-xs text-gray-500">
                                  Uploaded by: {att.uploadedBy}
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                {att.mimeType} •{" "}
                                {new Date(att.uploadedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
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
                              Preview
                            </Button>
                            {canDownload ? (
                              <a
                                href={att.url}
                                download
                                className="inline-flex items-center"
                              >
                                <Button size="sm">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </a>
                            ) : (
                              <Button size="sm" disabled>
                                <Download className="h-4 w-4 mr-2" />
                                Restricted
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-4 text-gray-500">
                        <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No attachments available</p>
                      </div>
                    )}
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
                      Submitted by: {safeRender(raw.submittedBy)}
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
                <div className="flex flex-col">
                  <span>{safeRender(raw?.contactEmail || task.contactEmail, 'No email provided')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
