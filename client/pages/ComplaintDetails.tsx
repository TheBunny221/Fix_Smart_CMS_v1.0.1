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
    refetchOnMountOrArgChange: true,
  });

  const complaint = (complaintResponse?.data as any)?.complaint || complaintResponse?.data;

  // Debug logging
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
                    {complaint.address && (
                      <p className="text-gray-600">
                        <strong>Address:</strong> <SafeRenderer fallback="No address provided">{safeRenderValue(complaint.address, "No address provided")}</SafeRenderer>
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
                              {!isCitizen && log.user && (
                                <Badge variant="outline" className="text-xs">
                                  {log.user.fullName} ({log.user.role})
                                </Badge>
                              )}
                            </div>

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
                          complaint.lastUpdated || complaint.updatedAt || complaint.submittedOn,
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

          {/* General Remarks - Hidden from citizens */}
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

          {/* Quick Actions */}
          {user?.role !== "CITIZEN" && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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

                {(complaint?.status === "resolved" ||
                  complaint?.status === "closed") &&
                  complaint?.submittedBy === user?.id &&
                  !complaint?.rating && (
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

          {/* Attachments */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Attachments ({complaint?.attachments?.length || 0} files)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.role === "ADMINISTRATOR" || user?.role === "WARD_OFFICER" ? (
                  // Admin/Ward Officer view - List format like TaskDetails
                  <div className="space-y-2">
                    {complaint.attachments.map((att: any) => (
                      <div
                        key={att.id}
                        className="border-l-4 border-blue-300 pl-4 py-2 flex items-start justify-between"
                      >
                        <div>
                          <p className="text-xs text-gray-500">
                            {formatDate(att.createdAt)}
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
                  // Citizen view - Grid format
                  <div className="grid grid-cols-1 gap-4">
                    {complaint.attachments.map((attachment: any) => {
                      const isImage = attachment.mimeType?.startsWith("image/");
                      const displayName = truncateFileName(attachment.fileName || attachment.originalName, 20);
                      const fullName = attachment.fileName || attachment.originalName;

                      return (
                        <div
                          key={attachment.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="mb-3">
                            {isImage ? (
                              <div className="relative group">
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
                              <h4 className="font-semibold text-gray-900 text-sm leading-tight break-words" title={attachment.fileName || attachment.originalName}>
                                {truncateFileName(attachment.fileName || attachment.originalName, 25)}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {attachment.size ? (attachment.size / 1024).toFixed(1) + 'KB' : 'Unknown size'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(attachment.uploadedAt, 'date')}
                                </span>
                              </div>
                            </div>

                            {attachment.description && (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <FileText className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-800 mb-1">Note:</p>
                                    <p className="text-xs text-gray-700 break-words leading-relaxed">{attachment.description}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {attachment.uploadedBy && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">Uploaded by {attachment.uploadedBy?.fullName || attachment.uploadedBy}</span>
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
                                  url: attachment.url,
                                  mimeType: attachment.mimeType,
                                  name: attachment.originalName || attachment.fileName,
                                  size: attachment.size,
                                });
                                setIsPreviewOpen(true);
                              }}
                            >
                              <Image className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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

          {/* Duplicaents Section */}
          {complaint && (
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
                          <h3 className="text-xl font-bold text-gray-900">Complaint Files</h3>
                          <p className="text-sm text-gray-700">Original files submitted with the complaint</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-gray-600 text-white px-3 py-1 text-sm font-semibold">
                        {complaint.attachments?.length || 0} files
                      </Badge>
                    </div>

                    {complaint.attachments && complaint.attachments.length > 0 ? (
                      <div className="grid grid-cols-1  gap-4">
                        {complaint.attachments.map((attachment: any) => {
                          const isImage = attachment.mimeType?.startsWith("image/");
                          const canDownload = [
                            "ADMINISTRATOR",
                            "WARD_OFFICER",
                            "MAINTENANCE_TEAM",
                          ].includes(user?.role || "");
                          const displayName = truncateFileName(attachment.fileName || attachment.originalName, 20);
                          const fullName = attachment.fileName || attachment.originalName;

                          return (
                            <div
                              key={attachment.id}
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="mb-3">
                                {isImage ? (
                                  <div className="relative group">
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

                              {/* File Information */}
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-sm leading-tight break-words" title={attachment.fileName || attachment.originalName}>
                                    {truncateFileName(attachment.fileName || attachment.originalName, 25)}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {attachment.size ? (attachment.size / 1024).toFixed(1) + 'KB' : 'Unknown size'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(attachment.createdAt, 'date')}
                                    </span>
                                  </div>
                                </div>

                                {/* Description */}
                                {attachment.description && (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                      <FileText className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium text-gray-800 mb-1">Note:</p>
                                        <p className="text-xs text-gray-700 break-words leading-relaxed">{attachment.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Uploader Info */}
                                {attachment.uploadedBy && (
                                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                                    <User className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">Uploaded by {attachment.uploadedBy?.fullName || attachment.uploadedBy}</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="mt-4 flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 p-2 text-xs border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                  onClick={() => {
                                    setPreviewItem({
                                      url: attachment.url,
                                      mimeType: attachment.mimeType,
                                      name: attachment.originalName || attachment.fileName,
                                      size: attachment.size,
                                    });
                                    setIsPreviewOpen(true);
                                  }}
                                >
                                  <Image className="h-3 w-3 mr-1" />
                                  Preview
                                </Button>
                                {canDownload ? (
                                  <a
                                    href={attachment.url}
                                    download={attachment.originalName || attachment.fileName}
                                    className="flex-1"
                                  >
                                    <Button size="sm" className="w-full text-xs bg-gray-600 hover:bg-gray-700 shadow-md">
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
                      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <Upload className="h-10 w-10 text-gray-500" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">No Attachments</h4>
                        <p className="text-sm text-gray-600 mb-4">No files were submitted with this complaint</p>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                          <FileText className="h-4 w-4" />
                          <span>Documents and images would appear here</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
        complaintId={complaint?.id}
        isOpen={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
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