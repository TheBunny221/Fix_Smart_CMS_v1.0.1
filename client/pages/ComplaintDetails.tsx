import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintQuery } from "../store/api/complaintsApi";
import { useDataManager } from "../hooks/useDataManager";
import ComplaintFeedbackDialog from "../components/ComplaintFeedbackDialog";
import UpdateComplaintModal from "../components/UpdateComplaintModal";
import AttachmentPreview from "../components/AttachmentPreview";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  FileText,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  ArrowLeft,
  MessageSquare,
  Image,
  Download,
  Upload,
  Camera,
  Wrench,
  File,
} from "lucide-react";
import { SafeRenderer, safeRenderValue } from "../components/SafeRenderer";
// Dynamic import for jsPDF to avoid build issues

const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);
  const { config } = useSystemConfig();

  // Utility function to truncate file names
  const truncateFileName = (fileName: string, maxLength: number = 25): string => {
    if (!fileName || fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4) + '...';
    return `${truncatedName}.${extension}`;
  };

  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<{
    url: string;
    mimeType?: string | null;
    name?: string | null;
    size?: number | null;
  } | null>(null);

  // Data management hooks
  const { cacheComplaintDetails, getComplaintDetails } = useDataManager();

  // Use RTK Query to fetch complaint details
  const {
    data: complaintResponse,
    isLoading,
    error,
  } = useGetComplaintQuery(id!, { 
    skip: !id || !isAuthenticated,
    // Add retry logic for failed requests
    refetchOnMountOrArgChange: true,
  });

  const complaint = (complaintResponse?.data as any)?.complaint || complaintResponse?.data;

  // Debug: Log the complaint data to see what we're actually receiving
  useEffect(() => {
    console.log("ComplaintDetails Debug Info:", {
      id,
      isAuthenticated,
      isLoading,
      hasError: !!error,
      hasComplaintResponse: !!complaintResponse,
      hasComplaintData: !!complaint,
    });
    
    if (complaintResponse) {
      console.log("Full API response:", complaintResponse);
    }
    
    if (complaint) {
      console.log("Complaint data received:", complaint);
      console.log("Available fields:", Object.keys(complaint));
      console.log("Complaint ID:", complaint.id);
      console.log("Complaint submittedOn:", complaint.submittedOn);
      console.log("Complaint status:", complaint.status);
    }
    
    if (error) {
      console.error("Error fetching complaint:", error);
    }
  }, [id, isAuthenticated, isLoading, error, complaintResponse, complaint]);

  // Cache complaint details when loaded
  useEffect(() => {
    if (complaint && id) {
      cacheComplaintDetails(id, complaint);
    }
  }, [complaint, id, cacheComplaintDetails]);

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
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
  const getTypeSlaHours = (type?: string): number | null => {
    if (!type) return null;
    try {
      const entries = Object.entries(config || {});
      let hours: number | null = null;
      for (const [key, value] of entries) {
        if (!key.startsWith("COMPLAINT_TYPE_")) continue;
        try {
          const parsed = JSON.parse(value as string);
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
        } catch (e) {
          continue;
        }
      }
      return hours;
    } catch {
      return null;
    }
  };

  const getLastReopenAt = (logs?: any[]): Date | null => {
    if (!Array.isArray(logs)) return null;
    const reopenLogs = logs
      .filter((l) => l?.toStatus === "REOPENED")
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    return reopenLogs.length ? new Date(reopenLogs[0].timestamp) : null;
  };

  const addHours = (date: Date, hours: number) =>
    new Date(date.getTime() + hours * 60 * 60 * 1000);

  const computeSla = (c: any) => {
    if (!c) return { status: "N/A", deadline: null } as const;

    const typeHours = getTypeSlaHours(c.type);

    const reopenAt = getLastReopenAt(c.statusLogs);
    const registeredAt = c.submittedOn
      ? new Date(c.submittedOn)
      : c.createdAt
        ? new Date(c.createdAt)
        : null;
    const startAt = reopenAt || registeredAt;

    let deadline: Date | null = null;
    if (startAt && Number.isFinite(typeHours)) {
      deadline = addHours(startAt, typeHours as number);
    } else if (c.deadline) {
      deadline = new Date(c.deadline);
    }

    if (!deadline) return { status: "N/A", deadline: null } as const;

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
      } as const;
    }

    return {
      status: now > deadline ? "OVERDUE" : "ON_TIME",
      deadline,
    } as const;
  };

  if (isLoading) {
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

  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error Loading Complaint
        </h2>
        <p className="text-gray-600 mb-4">
          Failed to load complaint details. Please try again.
        </p>
        <Link to="/complaints">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Complaints
          </Button>
        </Link>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading Complaint Details...
        </h2>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error Loading Complaint
        </h2>
        <p className="text-gray-600 mb-4">
          {error && typeof error === 'object' && 'message' in error 
            ? (error as any).message 
            : 'Failed to load complaint details. Please try again.'}
        </p>
        <Link to="/complaints">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Complaints
          </Button>
        </Link>
      </div>
    );
  }

  // Show not found state
  if (!complaint) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Complaint Not Found
        </h2>
        <p className="text-gray-600 mb-4">
          The complaint you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link to="/complaints">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Complaints
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link to="/complaints">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Complaint #
              {complaint?.complaintId || (complaint?.id && typeof complaint.id === 'string' ? complaint.id.slice(-6) : "Unknown")}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={getStatusColor(complaint?.status || "")}>
              {complaint?.status?.replace("_", " ") || "Unknown"}
            </Badge>
            <Badge className={getPriorityColor(complaint?.priority || "")}>
              {complaint?.priority || "Unknown"} Priority
            </Badge>
            <span className="text-sm text-gray-500">
              Created{" "}
              {complaint?.submittedOn
                ? new Date(complaint.submittedOn).toLocaleDateString()
                : "Unknown"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Complaint Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Type</h3>
                <p className="text-gray-600">
                  <SafeRenderer fallback="Unknown Type">
                    {complaint?.type ? complaint.type.replace("_", " ") : "Unknown Type"}
                  </SafeRenderer>
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600">
                  <SafeRenderer fallback="No description available">
                    {safeRenderValue(complaint?.description, "No description available")}
                  </SafeRenderer>
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Location Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <strong>Area:</strong> <SafeRenderer fallback="Unknown Area">{safeRenderValue(complaint.area, "Unknown Area")}</SafeRenderer>
                    </p>
                    {complaint.ward && (
                      <p className="text-gray-600">
                        <strong>Ward:</strong> <SafeRenderer fallback="Unknown Ward">{safeRenderValue(complaint.ward, "Unknown Ward")}</SafeRenderer>
                      </p>
                    )}
                    {/* Sub-zone and landmark not available in current interface */}
                    {complaint.address && (
                      <p className="text-gray-600">
                        <strong>Address:</strong> <SafeRenderer fallback="No address provided">{safeRenderValue(complaint.address, "No address provided")}</SafeRenderer>
                      </p>
                    )}
                    {/* Coordinates not available in current interface */}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Timeline
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <strong>Submitted:</strong>{" "}
                      {complaint?.submittedOn ? new Date(complaint.submittedOn).toLocaleString() : "Unknown"}
                    </p>
                    {complaint.assignedOn && (
                      <p className="text-gray-600">
                        <strong>Assigned:</strong>{" "}
                        {new Date(complaint.assignedOn).toLocaleString()}
                      </p>
                    )}
                    {complaint.resolvedOn && (
                      <p className="text-gray-600">
                        <strong>Resolved:</strong>{" "}
                        {new Date(complaint.resolvedOn).toLocaleString()}
                      </p>
                    )}
                    {complaint.closedOn && (
                      <p className="text-gray-600">
                        <strong>Closed:</strong>{" "}
                        {new Date(complaint.closedOn).toLocaleString()}
                      </p>
                    )}
                    {/* Show computed deadline and SLA status for admin/ward managers */}
                    {(user?.role === "ADMINISTRATOR" ||
                      user?.role === "WARD_OFFICER") &&
                      (() => {
                        const { status, deadline } = computeSla(complaint);
                        return (
                          <>
                            <p className="text-gray-600">
                              <strong>Deadline:</strong>{" "}
                              {deadline
                                ? new Date(deadline).toLocaleString()
                                : "N/A"}
                            </p>
                            <p
                              className={`text-sm font-medium ${status === "OVERDUE"
                                ? "text-red-600"
                                : status === "ON_TIME"
                                  ? "text-green-600"
                                  : "text-gray-600"
                                }`}
                            >
                              <strong>SLA Status:</strong>{" "}
                              {status === "ON_TIME"
                                ? "On Time"
                                : status === "OVERDUE"
                                  ? "Overdue"
                                  : "N/A"}
                            </p>
                          </>
                        );
                      })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Updates / Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                {user?.role === "CITIZEN"
                  ? "Status Updates"
                  : "Status Updates & Comments"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Real status logs with remarks and comments */}
                {complaint.statusLogs && complaint.statusLogs.length > 0 ? (
                  complaint.statusLogs.map((log: any, index: number) => {
                    const getStatusColor = (status: string) => {
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

                    const getStatusLabel = (status: string) => {
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
                    const getCitizenStatusMessage = (status: string, log: any) => {
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

                    return (
                      <div
                        key={log.id || index}
                        className={`border-l-4 ${getStatusColor(log.toStatus)} pl-4 py-2`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">
                                {getStatusLabel(log.toStatus)}
                              </p>
                              {/* Show staff details only to non-citizens */}
                              {!isCitizen && log.user && (
                                <Badge variant="outline" className="text-xs">
                                  {log.user.fullName} ({log.user.role})
                                </Badge>
                              )}
                            </div>

                            {/* Show appropriate message based on user role */}
                            {isCitizen ? (
                              <p className="text-sm text-gray-600 mb-1">
                                {getCitizenStatusMessage(log.toStatus, log)}
                              </p>
                            ) : (
                              <>
                                {log.comment && (
                                  <p className="text-sm text-gray-600 mb-1">
                                    <strong>Remarks:</strong> {log.comment}
                                  </p>
                                )}
                              </>
                            )}

                            {log.fromStatus && (
                              <p className="text-xs text-gray-500">
                                Status changed from{" "}
                                <span className="font-medium">
                                  {log.fromStatus}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium">
                                  {log.toStatus}
                                </span>
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 ml-4">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>
                      {user?.role === "CITIZEN"
                        ? "No updates available for your complaint yet"
                        : "No status updates available"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attachment Logs (Admin & Ward Officer) */}
          {(user?.role === "ADMINISTRATOR" ||
            user?.role === "WARD_OFFICER") && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Attachment Logs ({complaint?.attachments?.length || 0} files)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Attachments */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Files ({complaint?.attachments?.length || 0})
                    </h4>
                    {complaint.attachments && complaint.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {complaint.attachments.map((att: any) => (
                          <div
                            key={att.id}
                            className="border-l-4 border-blue-300 pl-4 py-2 flex items-start justify-between"
                          >
                            <div>
                              <p className="text-xs text-gray-500">
                                {new Date(att.uploadedAt).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-800">
                                {att.originalName || att.fileName}
                                <span className="text-xs text-gray-500">
                                  {" "}
                                  • {att.mimeType} •{" "}
                                  {(att.size / 1024).toFixed(1)} KB
                                </span>
                              </p>
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
                              <a href={att.url} target="_blank" rel="noreferrer">
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        No file attachments.
                      </div>
                    )}
                  </div>

                  {/* Photo Attachments */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Photos (0)
                    </h4>
                    {false ? (
                      <div className="space-y-2">
                        {[].map((p: any) => (
                          <div
                            key={p.id}
                            className="border-l-4 border-emerald-300 pl-4 py-2 flex items-start justify-between"
                          >
                            <div>
                              <p className="text-xs text-gray-500">
                                {new Date(p.uploadedAt).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-800">
                                {p.originalName || p.fileName}
                                {p.uploadedByTeam?.fullName && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    by {p.uploadedByTeam.fullName}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPreviewItem({
                                    url: p.photoUrl,
                                    mimeType: "image/*",
                                    name: p.originalName || p.fileName,
                                    size: null,
                                  });
                                  setIsPreviewOpen(true);
                                }}
                              >
                                Preview
                              </Button>
                              <a
                                href={p.photoUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">No photos.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Administrative Information - Only for system admin */}
          {user?.role === "ADMINISTRATOR" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Administrative Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Assignment Details</h4>
                    <div className="space-y-1 text-sm">
                      {complaint.submittedBy && (
                        <p className="text-gray-600">
                          <strong>Submitted By:</strong>{" "}
                          {complaint.submittedBy.fullName}
                          {complaint.submittedBy.email &&
                            ` (${complaint.submittedBy.email})`}
                        </p>
                      )}
                      {complaint.wardOfficer && (
                        <p className="text-gray-600">
                          <strong>Ward Officer:</strong>{" "}
                          {complaint.wardOfficer.fullName}
                          {complaint.wardOfficer.email &&
                            ` (${complaint.wardOfficer.email})`}
                        </p>
                      )}
                      {complaint.maintenanceTeam && (
                        <p className="text-gray-600">
                          <strong>Maintenance Team:</strong>{" "}
                          {complaint.maintenanceTeam.fullName}
                          {complaint.maintenanceTeam.email &&
                            ` (${complaint.maintenanceTeam.email})`}
                        </p>
                      )}
                      {complaint.assignedTo && (
                        <p className="text-gray-600">
                          <strong>Assigned To:</strong>{" "}
                          {complaint.assignedTo.fullName}
                          {complaint.assignedTo.email &&
                            ` (${complaint.assignedTo.email})`}
                        </p>
                      )}
                      {complaint.resolvedById && (
                        <p className="text-gray-600">
                          <strong>Resolved By:</strong> {complaint.resolvedById}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Technical Details</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        <strong>Complaint ID:</strong>{" "}
                        {complaint.complaintId || complaint.id}
                      </p>
                      {complaint.tags && (
                        <p className="text-gray-600">
                          <strong>Tags:</strong>{" "}
                          {JSON.parse(complaint.tags).join(", ")}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs">
                        <strong>Created:</strong>{" "}
                        {complaint?.submittedOn ? new Date(complaint.submittedOn).toLocaleString() : "Unknown"}
                      </p>
                      <p className="text-gray-500 text-xs">
                        <strong>Last Updated:</strong>{" "}
                        {new Date(
                          complaint.lastUpdated,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Citizen Feedback Section */}
                {(complaint.feedback || complaint.rating) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Citizen Feedback</h4>
                    <div className="bg-blue-50 rounded-lg p-3">
                      {complaint.rating && (
                        <p className="text-sm text-blue-800 mb-1">
                          <strong>Rating:</strong> {complaint.rating}/5 ⭐
                        </p>
                      )}
                      {complaint.feedback && (
                        <p className="text-sm text-blue-700">
                          <strong>Feedback:</strong> {complaint.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* General Remarks - Hidden from citizens as they may contain internal notes */}
          {complaint.remarks && user?.role !== "CITIZEN" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Internal Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {complaint.remarks}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Contact & Meta Info */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {complaint.submittedBy && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <div className="flex flex-col">
                    <span className="font-medium">Complaint Submitter</span>
                    {/* Show if submitted by registered user for admin/ward managers */}
                    {(user?.role === "ADMINISTRATOR" ||
                      user?.role === "WARD_OFFICER") &&
                      complaint.submittedBy && (
                        <span className="text-xs text-gray-500">
                          Registered User: {complaint.submittedBy.fullName}
                        </span>
                      )}
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <div className="flex flex-col">
                  <SafeRenderer fallback="No phone provided">
                    {safeRenderValue(complaint.contactPhone, "No phone provided")}
                  </SafeRenderer>
                  {/* Show submitter phone for admin/ward managers if different */}
                  {(user?.role === "ADMINISTRATOR" ||
                    user?.role === "WARD_OFFICER") &&
                    complaint.submittedBy?.phoneNumber &&
                    complaint.submittedBy.phoneNumber !==
                    complaint.contactPhone && (
                      <span className="text-xs text-gray-500">
                        User Phone: {complaint.submittedBy.phoneNumber}
                      </span>
                    )}
                </div>
              </div>
              {complaint.contactEmail && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <div className="flex flex-col">
                    <SafeRenderer fallback="No email provided">
                      {safeRenderValue(complaint.contactEmail, "No email provided")}
                    </SafeRenderer>
                    {/* Show submitter email for admin/ward managers if different */}
                    {(user?.role === "ADMINISTRATOR" ||
                      user?.role === "WARD_OFFICER") &&
                      complaint.submittedBy?.email &&
                      complaint.submittedBy.email !==
                      complaint.contactEmail && (
                        <span className="text-xs text-gray-500">
                          User Email: {complaint.submittedBy.email}
                        </span>
                      )}
                  </div>
                </div>
              )}

              {/* Show anonymity status for admin/ward managers */}
              {(user?.role === "ADMINISTRATOR" ||
                user?.role === "WARD_OFFICER") &&
                complaint.isAnonymous && (
                  <div className="flex items-center text-orange-600">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">
                      Anonymous Complaint
                    </span>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Assignment Information */}
          {((complaint.wardOfficer ||
            complaint.maintenanceTeam ||
            user?.role === "ADMINISTRATOR" ||
            user?.role === "WARD_OFFICER" ||
            user?.role === "MAINTENANCE_TEAM") && user?.role !== "CITIZEN") && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Assignment & Status Information
                    <span className="ml-2 text-xs">
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status?.replace("_", " ") || "Unknown"}
                      </Badge>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">Ward Officer</p>
                      {complaint.wardOfficer ? (
                        <>
                          <p className="text-blue-800 font-medium">
                            {complaint.wardOfficer.fullName}
                          </p>
                          {complaint.wardOfficer.email && (
                            <p className="text-blue-600 text-sm">
                              {complaint.wardOfficer.email}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-blue-700 text-sm">Not assigned</p>
                      )}
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">Maintenance Team</p>
                      {complaint.maintenanceTeam ? (
                        <>
                          <p className="text-green-800 font-medium">
                            {complaint.maintenanceTeam.fullName}
                          </p>
                          {complaint.maintenanceTeam.email && (
                            <p className="text-green-700 text-sm">
                              {complaint.maintenanceTeam.email}
                            </p>
                          )}
                          {complaint.assignedOn && (
                            <p className="text-green-700 text-xs mt-1">
                              Assigned on:{" "}
                              {new Date(complaint.assignedOn).toLocaleString()}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-green-700 text-sm">Unassigned</p>
                      )}
                    </div>
                  </div>

                  {/* Show computed SLA info for admin/ward managers */}
                  {(user?.role === "ADMINISTRATOR" ||
                    user?.role === "WARD_OFFICER") &&
                    (() => {
                      const { status, deadline } = computeSla(complaint);
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium mb-1">
                              SLA Deadline
                            </p>
                            <p
                              className={`text-sm ${deadline && new Date() > deadline ? "text-red-600 font-medium" : "text-gray-600"}`}
                            >
                              {deadline
                                ? new Date(deadline).toLocaleString()
                                : "N/A"}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-1">SLA Status</p>
                            <Badge
                              className={
                                status === "OVERDUE"
                                  ? "bg-red-100 text-red-800"
                                  : status === "ON_TIME"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                              }
                            >
                              {status === "ON_TIME"
                                ? "On Time"
                                : status === "OVERDUE"
                                  ? "Overdue"
                                  : "N/A"}
                            </Badge>
                            {deadline && (
                              <p className="text-xs text-gray-500 mt-1">
                                by {new Date(deadline).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                  {/* Show priority and type for admin/ward managers */}
                  {(user?.role === "ADMINISTRATOR" ||
                    user?.role === "WARD_OFFICER") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <p className="text-sm font-medium mb-1">Priority Level</p>
                          <Badge className={getPriorityColor(complaint.priority)}>
                            <SafeRenderer fallback="Unknown Priority">
                              {safeRenderValue(complaint.priority, "Unknown")} Priority
                            </SafeRenderer>
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Complaint Type</p>
                          <Badge variant="outline">
                            <SafeRenderer fallback="Unknown Type">
                              {typeof complaint.type === 'string' 
                                ? complaint.type.replace("_", " ")
                                : complaint.type?.name || "Unknown Type"}
                            </SafeRenderer>
                          </Badge>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

          {/* Maintenance Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-blue-600" />
                Maintenance Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {complaint?.attachments?.filter((att: any) => att.entityType === "MAINTENANCE_PHOTO").length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {complaint.attachments
                    .filter((att: any) => att.entityType === "MAINTENANCE_PHOTO")
                    .map((attachment: any) => {
                      const isImage = attachment.mimeType?.startsWith("image/");
                      const displayName = truncateFileName(attachment.originalName || attachment.fileName, 20);
                      const fullName = attachment.originalName || attachment.fileName;
                      
                      return (
                        <div
                          key={attachment.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="mb-3">
                            {isImage ? (
                              <img
                                src={attachment.url}
                                alt={fullName}
                                className="w-full h-32 object-cover rounded-md cursor-pointer"
                                onClick={() => {
                                  setPreviewItem({
                                    url: attachment.url,
                                    mimeType: attachment.mimeType,
                                    name: fullName,
                                    size: attachment.size,
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
                              <span>By: {attachment.uploadedBy?.fullName || "Unknown"}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(attachment.uploadedAt || attachment.createdAt).toLocaleDateString()}
                            </div>
                            {attachment.description && (
                              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                <span className="font-medium">Note:</span> {attachment.description}
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
                                  url: attachment.url,
                                  mimeType: attachment.mimeType,
                                  name: fullName,
                                  size: attachment.size,
                                });
                                setIsPreviewOpen(true);
                              }}
                            >
                              Preview
                            </Button>
                            <a href={attachment.url} download={fullName} className="flex-1">
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
            </CardContent>
          </Card>

          {/* Complaint Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-600" />
                Complaint Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {complaint?.attachments?.filter((att: any) => att.entityType !== "MAINTENANCE_PHOTO").length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {complaint.attachments
                    .filter((att: any) => att.entityType !== "MAINTENANCE_PHOTO")
                    .map((attachment: any) => {
                      const isImage = attachment.mimeType?.startsWith("image/");
                      const displayName = truncateFileName(attachment.originalName || attachment.fileName, 20);
                      const fullName = attachment.originalName || attachment.fileName;
                      
                      return (
                        <div
                          key={attachment.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="mb-3">
                            {isImage ? (
                              <img
                                src={attachment.url}
                                alt={fullName}
                                className="w-full h-32 object-cover rounded-md cursor-pointer"
                                onClick={() => {
                                  setPreviewItem({
                                    url: attachment.url,
                                    mimeType: attachment.mimeType,
                                    name: fullName,
                                    size: attachment.size,
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
                              <span>By: {attachment.uploadedBy?.fullName || "Citizen"}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(attachment.uploadedAt || attachment.createdAt).toLocaleDateString()}
                            </div>
                            {attachment.description && (
                              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                <span className="font-medium">Note:</span> {attachment.description}
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
                                  url: attachment.url,
                                  mimeType: attachment.mimeType,
                                  name: fullName,
                                  size: attachment.size,
                                });
                                setIsPreviewOpen(true);
                              }}
                            >
                              Preview
                            </Button>
                            <a href={attachment.url} download={fullName} className="flex-1">
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
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No complaint attachments available</p>
                </div>
              )}
            </CardContent>
          </Ca
                        
                        return (
                          <div
                            key={attachment.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            {/* Image Preview */}
                            <div className="mb-3">
                              {isImage ? (
                                <img
                                  src={attachment.url}
                                  alt={fullName}
                                  className="w-full h-32 object-cover rounded-md cursor-pointer"
                                  onClick={() => {
                                    setPreviewItem({
                                      url: attachment.url,
                                      mimeType: attachment.mimeType,
                                      name: fullName,
                                      size: attachment.size,
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

                            {/* File Info */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-900 truncate" title={fullName}>
                                {displayName}
                              </h4>
                              
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>By: {attachment.uploadedBy?.fullName || "Unknown"}</span>
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                Invalid Date
                              </div>

                              {/* Description */}
                              {attachment.description && (
                                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                  <span className="font-medium">Note:</span> {attachment.description}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs"
                                onClick={() => {
                                  setPreviewItem({
                                    url: attachment.url,
                                    mimeType: attachment.mimeType,
                                    name: fullName,
                                    size: attachment.size,
                                  });
                                  setIsPreviewOpen(true);
                                }}
                              >
                                Preview
                              </Button>
                              <a
                                href={attachment.url}
                                download={fullName}
                                className="flex-1"
                              >
                                <Button size="sm" className="w-full text-xs bg-teal-600 hover:bg-teal-700">
                                  Download
                                </Button>
                              </a>
                            </div>
                          </div>
                            {/* File Icon and Preview */}
                            <div className="flex items-center justify-center mb-3">
                              {isImage ? (
                                <div className="relative">
                                  <img
                                    src={attachment.url}
                                    alt={fullName}
                                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                      setPreviewItem({
                                        url: attachment.url,
                                        mimeType: attachment.mimeType,
                                        name: fullName,
                                        size: attachment.size,
                                      });
                                      setIsPreviewOpen(true);
                                    }}
                                  />
                                  <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full p-1">
                                    <Image className="h-3 w-3" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 grid place-items-center rounded-lg bg-blue-100 border border-blue-300">
                                  <FileText className="h-8 w-8 text-blue-600" />
                                </div>
                              )}
                            </div>

                            {/* File Information */}
                            <div className="flex-1 space-y-2">
                              <div className="text-sm font-medium text-gray-900 text-center break-words" title={fullName}>
                                {truncateFileName(fullName, 20)}
                              </div>
                              
                              {/* Description */}
                              {attachment.description && (
                                <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                                  <div className="flex items-start gap-1">
                                    <FileText className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <span className="font-medium">Note:</span>
                                      <p className="mt-1 break-words">{attachment.description}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Metadata */}
                              <div className="space-y-1 text-xs text-gray-600">
                                {attachment.uploadedBy && (
                                  <div className="flex items-center gap-1 justify-center">
                                    <User className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{attachment.uploadedBy?.fullName || "Unknown"}</span>
                                  </div>
                                )}
                                <div className="text-center text-gray-500">
                                  {new Date(attachment.uploadedAt).toLocaleDateString()}
                                </div>
                                <div className="text-center text-gray-500 text-xs">
                                  {(attachment.size / 1024).toFixed(1)}KB
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-3 flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs border-blue-300 hover:bg-blue-50"
                                onClick={() => {
                                  setPreviewItem({
                                    url: attachment.url,
                                    mimeType: attachment.mimeType,
                                    name: fullName,
                                    size: attachment.size,
                                  });
                                  setIsPreviewOpen(true);
                                }}
                              >
                                <Image className="h-3 w-3 mr-1" />
                                Preview
                              </Button>
                              <a
                                href={attachment.url}
                                download={fullName}
                                className="inline-flex items-center w-full"
                              >
                                <Button size="sm" className="w-full text-xs bg-blue-600 hover:bg-blue-700">
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No maintenance photos available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Complaint Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-600" />
                Complaint Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complaint?.attachments?.filter((att: any) => att.entityType !== "MAINTENANCE_PHOTO").length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">

                    {complaint.attachments
                      .filter((att: any) => att.entityType !== "MAINTENANCE_PHOTO")
                      .map((attachment: any) => {
                        const isImage = attachment.mimeType?.startsWith("image/");
                        const displayName = truncateFileName(attachment.originalName || attachment.fileName);
                        const fullName = attachment.originalName || attachment.fileName;
                        
                        return (
                          <div
                            key={attachment.id}
                            className="flex flex-col bg-white border-2 border-gray-300 rounded-lg p-3 hover:shadow-md transition-all duration-200 h-full"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="h-12 w-12 flex-shrink-0 grid place-items-center rounded-lg bg-gray-100 border border-gray-300">
                                {isImage ? (
                                  <Image className="h-6 w-6 text-gray-600" />
                                ) : (
                                  <FileText className="h-6 w-6 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate" title={fullName}>
                                  {displayName}
                                </div>
                                {attachment.description && (
                                  <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1 border border-gray-200">
                                    <span className="font-medium">Description:</span> {attachment.description}
                                  </div>
                                )}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                                  {attachment.uploadedBy && (
                                    <div className="text-xs text-gray-600">
                                      <span className="font-medium">Uploaded by:</span> {attachment.uploadedBy?.fullName || "Unknown"}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    {(attachment.size / 1024).toFixed(1)} KB • {new Date(attachment.uploadedAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:ml-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 sm:flex-none"
                                onClick={() => {
                                  setPreviewItem({
                                    url: attachment.url,
                                    mimeType: attachment.mimeType,
                                    name: fullName,
                                    size: attachment.size,
                                  });
                                  setIsPreviewOpen(true);
                                }}
                              >
                                Preview
                              </Button>
                              <a
                                href={attachment.url}
                                download={fullName}
                                className="inline-flex items-center flex-1 sm:flex-none"
                              >
                                <Button size="sm" className="w-full">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="col-span-full text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-gray-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">No Complaint Attachments</h4>
                    <p className="text-sm text-gray-600 mb-4">Original files submitted with the complaint</p>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Upload className="h-4 w-4" />
                      <span>Documents and images from the original complaint</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>




          {/* Quick Actions */}
          {user?.role !== "CITIZEN" && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Status update button for Ward Officers, Administrators, and Maintenance Team */}
                {(user?.role === "WARD_OFFICER" ||
                  user?.role === "ADMINISTRATOR" ||
                  user?.role === "MAINTENANCE_TEAM") && (
                    <Button
                      className="w-full justify-start"
                      onClick={() => setIsUpdateModalOpen(true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Update Status
                    </Button>
                  )}

                {/* Show feedback button for resolved/closed complaints if user is the complainant */}
                {(complaint.status === "resolved" ||
                  complaint.status === "closed") &&
                  complaint.submittedBy === user?.id &&
                  !complaint.rating && (
                    <Button
                      className="w-full justify-start"
                      onClick={() => setShowFeedbackDialog(true)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Provide Feedback
                    </Button>
                  )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Update Complaint Modal */}
      <UpdateComplaintModal
        complaint={complaint}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={() => {
          setIsUpdateModalOpen(false);
        }}
      />

      {/* Feedback Dialog */}
      <ComplaintFeedbackDialog
        complaintId={complaint.id}
        isOpen={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
        onSuccess={() => {
          // The complaint data will be automatically updated by RTK Query
          // due to invalidation tags
        }}
      />

      {/* Attachment Preview Dialog */}
      <AttachmentPreview
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        item={previewItem}
        canDownload={user?.role !== "CITIZEN"}
      />
    </div>
  );
};

export default ComplaintDetails;
