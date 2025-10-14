import React, { useState, useEffect } from "react";
import { useAppSelector } from "../store/hooks";
import { getApiErrorMessage } from "../store/api/baseApi";
import {
  useUpdateComplaintMutation,
  useGetWardUsersQuery,
  useReopenComplaintMutation,
} from "../store/api/complaintsApi";
import type {
  Complaint as StoreComplaint,
  User as BaseComplaintUser,
} from "../store/slices/complaintsSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { SafeRenderer, safeRenderValue } from "./SafeRenderer";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { toast } from "./ui/use-toast";
import {
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Settings,
  RotateCcw,
} from "lucide-react";
import UserSelectDropdown from "./UserSelectDropdown";
import { cn } from "../lib/utils";

type AssignmentUser = BaseComplaintUser & {
  ward?: { name: string } | null;
};

type AssignmentRelation = AssignmentUser | string | null;

type ComplaintWithAssignments = Partial<StoreComplaint> & {
  id: string;
  complaintId?: string;
  assignedTo?: AssignmentRelation;
  wardOfficer?: AssignmentRelation;
  maintenanceTeam?: AssignmentRelation;
  needsTeamAssignment?: boolean;
  status?: StoreComplaint["status"] | string;
  priority?: StoreComplaint["priority"] | string;
};

interface UpdateComplaintModalProps {
  complaint: ComplaintWithAssignments | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateComplaintModal: React.FC<UpdateComplaintModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    status: "",
    priority: "",
    // New primary field for ward officer assignment
    wardOfficerId: "",
    // Legacy field kept for backward compatibility where needed
    assignedToId: "",
    maintenanceTeamId: "",
    remarks: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Admins need both ward officers and maintenance team lists
  const {
    data: wardOfficerResponse,
    isLoading: isLoadingWardOfficers,
    error: wardOfficersError,
  } = useGetWardUsersQuery(
    { page: 1, limit: 200, role: "WARD_OFFICER" },
    { skip: user?.role !== "ADMINISTRATOR" && user?.role !== "WARD_OFFICER" },
  );

  const {
    data: maintenanceResponse,
    isLoading: isLoadingMaintenance,
    error: maintenanceError,
  } = useGetWardUsersQuery(
    { page: 1, limit: 200, role: "MAINTENANCE_TEAM" },
    { skip: user?.role !== "ADMINISTRATOR" && user?.role !== "WARD_OFFICER" },
  );

  // For legacy single-list flows, present available users based on role
  const wardOfficerUsers = wardOfficerResponse?.data?.users || [];
  const maintenanceUsers = maintenanceResponse?.data?.users || [];
  const availableUsers =
    user?.role === "WARD_OFFICER" ? maintenanceUsers : wardOfficerUsers;

  const [updateComplaint, { isLoading: isUpdating }] =
    useUpdateComplaintMutation();
  const [reopenComplaint, { isLoading: isReopening }] =
    useReopenComplaintMutation();

  // Filter users based on search term
  const filteredUsers = availableUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const resolveAssignmentId = (assignment: unknown): string => {
    if (!assignment) return "none";
    if (typeof assignment === "string") return assignment;
    if (
      typeof assignment === "object" &&
      assignment !== null &&
      "id" in assignment &&
      typeof (assignment as { id?: unknown }).id === "string"
    ) {
      return (assignment as { id: string }).id;
    }
    return "none";
  };

  const resolveAssignmentName = (assignment: unknown): string | null => {
    if (!assignment) return null;
    if (typeof assignment === "string") {
      const trimmed = assignment.trim();
      if (!trimmed || trimmed.toLowerCase() === "none") return null;
      return trimmed;
    }
    if (typeof assignment === "object" && assignment !== null) {
      const { fullName, email, id } = assignment as {
        fullName?: string;
        email?: string;
        id?: string;
      };
      return fullName || email || id || null;
    }
    return null;
  };

  useEffect(() => {
    if (complaint && isOpen) {
      // Extract IDs from complaint (prefer new wardOfficer field but keep legacy support)
      const wardOfficerId = resolveAssignmentId(complaint.wardOfficer);

      const assignedToId = resolveAssignmentId(complaint.assignedTo);

      const maintenanceTeamId = resolveAssignmentId(complaint.maintenanceTeam);

      setFormData({
        status: complaint.status ?? "REGISTERED",
        priority: complaint.priority ?? "MEDIUM",
        wardOfficerId: wardOfficerId ?? "none",
        assignedToId: assignedToId ?? "none",
        maintenanceTeamId: maintenanceTeamId ?? "none",
        remarks: "",
      });

      setSearchTerm("");
      setValidationErrors([]);
    }
  }, [complaint, isOpen]);

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

  const getUserRoleIcon = (role: string) => {
    switch (role) {
      case "WARD_OFFICER":
        return <User className="h-4 w-4" />;
      case "MAINTENANCE_TEAM":
        return <Settings className="h-4 w-4" />;
      case "ADMINISTRATOR":
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getDropdownLabel = () => {
    if (user?.role === "ADMINISTRATOR")
      return "Select Ward Officer & Team Member";
    if (user?.role === "WARD_OFFICER") return "Select Maintenance Team Member";
    return "Select User";
  };

  const getAvailableStatusOptions = () => {
    const currentStatus = complaint?.status;

    if (user?.role === "MAINTENANCE_TEAM") {
      const statusFlow: Record<string, string[]> = {
        ASSIGNED: ["ASSIGNED", "IN_PROGRESS"],
        IN_PROGRESS: ["IN_PROGRESS", "RESOLVED"],
        RESOLVED: ["RESOLVED"],
        REOPENED: ["REOPENED", "IN_PROGRESS"],
      };
      if (currentStatus && statusFlow[currentStatus]) {
        return statusFlow[currentStatus];
      }
      return ["IN_PROGRESS", "RESOLVED"];
    }

    if (user?.role === "WARD_OFFICER") {
      return ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    }

    if (user?.role === "ADMINISTRATOR") {
      // Admin can set REOPENED, but it will automatically transition to ASSIGNED
      return [
        "REGISTERED",
        "ASSIGNED",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
        "REOPENED",
      ];
    }

    return ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
  };

  const validateForm = () => {
    const errors: string[] = [];
    const availableStatuses = getAvailableStatusOptions();
    const complaintStatus = complaint?.status ?? "REGISTERED";
    const complaintPriority = complaint?.priority ?? "MEDIUM";

    if (formData.status && !availableStatuses.includes(formData.status)) {
      errors.push(
        `You don't have permission to set status to '${formData.status}'. Available options: ${availableStatuses.join(", ")}`,
      );
    }

    if (user?.role === "MAINTENANCE_TEAM") {
      if (formData.status === "ASSIGNED" && complaint?.status !== "ASSIGNED") {
        errors.push("Maintenance team cannot set status back to 'Assigned'.");
      }
      if (formData.status === "REGISTERED") {
        errors.push("Maintenance team cannot set status to 'Registered'.");
      }
      if (complaintPriority && formData.priority !== complaintPriority) {
        errors.push(
          "Maintenance team cannot change complaint priority. Contact your supervisor if needed.",
        );
      }
    }

    const isComplaintFinalized = ["RESOLVED", "CLOSED"].includes(
      formData.status,
    );

    // Enhanced validation for ASSIGNED status requiring maintenance team
    if (formData.status === "ASSIGNED" && !isComplaintFinalized) {
      if (user?.role === "WARD_OFFICER") {
        if (!formData.maintenanceTeamId || formData.maintenanceTeamId === "none") {
          errors.push(
            "Please assign a maintenance team member before setting status to 'Assigned'.",
          );
        }
      } else if (user?.role === "ADMINISTRATOR") {
        // Admin needs both ward officer and maintenance team for ASSIGNED status
        if (!formData.wardOfficerId || formData.wardOfficerId === "none") {
          errors.push(
            "Please select a Ward Officer before setting status to 'Assigned'.",
          );
        }
        if (!formData.maintenanceTeamId || formData.maintenanceTeamId === "none") {
          errors.push(
            "Please assign a maintenance team member before setting status to 'Assigned'.",
          );
        }
      }
    }

    // Additional validation for REOPENED status (Admin only)
    if (formData.status === "REOPENED") {
      if (user?.role !== "ADMINISTRATOR") {
        errors.push("Only administrators can reopen complaints.");
      } else if (complaintStatus !== "CLOSED") {
        errors.push("Only closed complaints can be reopened.");
      } else {
        // Inform admin that REOPENED will transition to ASSIGNED
        // This is informational, not an error
      }
    }

    if (user?.role === "WARD_OFFICER" && !isComplaintFinalized) {
      if (
        (complaint as any)?.needsTeamAssignment &&
        (!formData.maintenanceTeamId || formData.maintenanceTeamId === "none") &&
        formData.status !== "REGISTERED" &&
        complaintStatus &&
        !["RESOLVED", "CLOSED"].includes(complaintStatus)
      ) {
        errors.push(
          "This complaint needs a maintenance team assignment. Please select a team member.",
        );
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    if (!validateForm()) return;

    try {
      const updateData: any = { status: formData.status };
      if (user?.role !== "MAINTENANCE_TEAM")
        updateData.priority = formData.priority;

      // Handle REOPENED status - use dedicated reopen endpoint
      if (formData.status === "REOPENED" && user?.role === "ADMINISTRATOR") {
        const reopenData: any = {};
        if (formData.remarks && formData.remarks.trim()) {
          reopenData.comment = formData.remarks.trim();
        } else {
          reopenData.comment = "Complaint reopened by administrator";
        }

        const reopenResponse = await reopenComplaint({
          id: complaint.id,
          ...reopenData,
        }).unwrap();

        toast({
          title: "Success",
          description: "Complaint reopened successfully. It has been set to ASSIGNED status and requires reassignment.",
        });

        if (reopenResponse?.data) {
          const reopenedComplaint = reopenResponse.data as unknown as ComplaintWithAssignments;
          const wardOfficerId = resolveAssignmentId(reopenedComplaint.wardOfficer);
          const assignedToId = resolveAssignmentId(reopenedComplaint.assignedTo);
          const maintenanceTeamId = resolveAssignmentId(reopenedComplaint.maintenanceTeam);

          setFormData({
            status: reopenedComplaint.status ?? "ASSIGNED",
            priority: reopenedComplaint.priority ?? "MEDIUM",
            wardOfficerId: wardOfficerId ?? "none",
            assignedToId: assignedToId ?? "none",
            maintenanceTeamId: maintenanceTeamId ?? "none",
            remarks: "",
          });
        }

        onSuccess();
        return; // Exit early since we used the reopen endpoint
      }

      if (user?.role === "WARD_OFFICER") {
        if (
          formData.maintenanceTeamId &&
          formData.maintenanceTeamId !== "none"
        ) {
          updateData.maintenanceTeamId = formData.maintenanceTeamId;
        }
      } else if (user?.role === "ADMINISTRATOR") {
        // Admin sets wardOfficerId (new primary field); keep assignedToId for backward compatibility
        if (formData.wardOfficerId && formData.wardOfficerId !== "none") {
          updateData.wardOfficerId = formData.wardOfficerId;
          // also set legacy assignedToId to preserve older expectations
          updateData.assignedToId = formData.wardOfficerId;
        }
        if (
          formData.maintenanceTeamId &&
          formData.maintenanceTeamId !== "none"
        ) {
          updateData.maintenanceTeamId = formData.maintenanceTeamId;
        }
      } else {
        // fallback: include legacy assignedToId if present
        if (formData.assignedToId && formData.assignedToId !== "none")
          updateData.assignedToId = formData.assignedToId;
      }

      if (formData.remarks && formData.remarks.trim() && formData.status !== "REOPENED")
        updateData.remarks = formData.remarks.trim();

      const updatedComplaintResponse = await updateComplaint({
        id: complaint.id,
        ...updateData,
      }).unwrap();

      toast({
        title: "Success",
        description:
          "Complaint updated successfully. You can see the updated assignment below.",
      });

      if (updatedComplaintResponse?.data) {
        const updatedComplaint = updatedComplaintResponse
          .data as unknown as ComplaintWithAssignments;
        const wardOfficerId = resolveAssignmentId(updatedComplaint.wardOfficer);
        const assignedToId = resolveAssignmentId(updatedComplaint.assignedTo);
        const maintenanceTeamId = resolveAssignmentId(
          updatedComplaint.maintenanceTeam,
        );

        setFormData({
          status: updatedComplaint.status ?? "REGISTERED",
          priority: updatedComplaint.priority ?? "MEDIUM",
          wardOfficerId: wardOfficerId ?? "none",
          assignedToId: assignedToId ?? "none",
          maintenanceTeamId: maintenanceTeamId ?? "none",
          remarks: "",
        });
      }

      onSuccess();
    } catch (error: any) {
      const message =
        error?.data?.message ||
        getApiErrorMessage(error) ||
        "Failed to update complaint";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleClose = () => {
    setFormData({
      status: "",
      priority: "",
      wardOfficerId: "none",
      assignedToId: "none",
      maintenanceTeamId: "none",
      remarks: "",
    });
    setSearchTerm("");
    setValidationErrors([]);
    onClose();
  };

  const wardOfficerName = complaint
    ? resolveAssignmentName(complaint.wardOfficer)
    : null;
  const maintenanceTeamName = complaint
    ? resolveAssignmentName(complaint.maintenanceTeam)
    : null;

  if (!complaint) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="flex items-center text-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                {user?.role === "MAINTENANCE_TEAM"
                  ? "Update Task Status"
                  : user?.role === "WARD_OFFICER"
                    ? "Manage Complaint"
                    : "Update Complaint"}
              </h2>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                <SafeRenderer fallback="Update complaint status">
                  {(() => {
                    const complaintId = safeRenderValue(complaint.complaintId) ||
                      (complaint.id && typeof complaint.id === 'string' ? complaint.id.slice(-6) : 'Unknown');

                    if (user?.role === "MAINTENANCE_TEAM") {
                      return `Update your work status for complaint #${complaintId}`;
                    } else if (user?.role === "WARD_OFFICER") {
                      return `Assign and manage complaint #${complaintId}`;
                    } else {
                      return `Update the status and assignment of complaint #${complaintId}`;
                    }
                  })()}
                </SafeRenderer>
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Role Banner */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Acting as: {user?.role?.replace("_", " ")}
                </p>
                <p className="text-xs text-blue-700">
                  {user?.role === "MAINTENANCE_TEAM"
                    ? "You can update work status and add progress notes"
                    : user?.role === "WARD_OFFICER"
                      ? "You can assign complaints and manage their status"
                      : "You have full administrative control over this complaint"
                  }
                </p>
              </div>
            </div>
            {user?.role === "MAINTENANCE_TEAM" && (
              <Badge
                variant="outline"
                className="text-xs text-blue-600 border-blue-300 bg-white"
              >
                Limited Permissions
              </Badge>
            )}
          </div>

          {/* Complaint Summary */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Complaint Summary</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Type:</span>
                  <span className="text-gray-900">
                    <SafeRenderer fallback="UNKNOWN">
                      {(complaint.type ?? "UNKNOWN").replace("_", " ")}
                    </SafeRenderer>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Area:</span>
                  <span className="text-gray-900">
                    <SafeRenderer fallback="Unknown Area">
                      {safeRenderValue(complaint.area, "Unknown Area")}
                    </SafeRenderer>
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Status:</span>
                  <Badge
                    className={`${getStatusColor(complaint.status ?? "REGISTERED")}`}
                  >
                    <SafeRenderer fallback="REGISTERED">
                      {(complaint.status ?? "REGISTERED").replace("_", " ")}
                    </SafeRenderer>
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Priority:</span>
                  <Badge
                    className={`${getPriorityColor(complaint.priority ?? "MEDIUM")}`}
                  >
                    <SafeRenderer fallback="MEDIUM">
                      {safeRenderValue(complaint.priority, "MEDIUM")}
                    </SafeRenderer>
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-gray-600 font-medium">Description:</span>
              <p className="text-sm mt-2 text-gray-700 leading-relaxed">
                <SafeRenderer fallback="No description available">
                  {safeRenderValue(complaint.description, "No description available")}
                </SafeRenderer>
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200">
              <div className="flex items-center mb-3">
                <Users className="h-4 w-4 text-gray-600 mr-2" />
                <h4 className="font-medium text-sm text-gray-900">Current Assignments</h4>
              </div>

              {process.env.NODE_ENV === "development" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs my-3">
                  <strong className="text-yellow-800">Debug Info:</strong>
                  <div className="mt-1 space-y-1 text-yellow-700">
                    <div>wardOfficer: {JSON.stringify(complaint.wardOfficer) || "null"}</div>
                    <div>maintenanceTeam: {JSON.stringify(complaint.maintenanceTeam) || "null"}</div>
                    <div>needsTeamAssignment: {String((complaint as any).needsTeamAssignment)}</div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 items-center">
                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Ward Officer</p>
                        <p className="text-xs text-gray-500">Complaint oversight</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {wardOfficerName ? (
                        <div>
                          <p className="text-sm font-medium text-blue-600">{wardOfficerName}</p>
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Assigned
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          Not assigned
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <Settings className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Maintenance Team</p>
                        <p className="text-xs text-gray-500">Field work execution</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {maintenanceTeamName ? (
                        <div>
                          <p className="text-sm font-medium text-green-600">{maintenanceTeamName}</p>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Assigned
                          </Badge>
                        </div>
                      ) : (complaint as any).needsTeamAssignment ? (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          Needs Assignment
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          Not assigned
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Transition Warning for REOPENED */}
          {formData.status === "REOPENED" && user?.role === "ADMINISTRATOR" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-800 font-medium">Status Transition Notice</p>
                  <p className="text-amber-700 mt-1">
                    When you reopen this complaint, it will automatically transition to <strong>ASSIGNED</strong> status
                    and require reassignment to a maintenance team member.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status and Priority Section */}
          <div className="space-y-4">
            <div className="flex items-center mb-2">
              <Settings className="h-4 w-4 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Status & Priority</h4>
            </div>

            <div
              className={`grid gap-6 ${user?.role === "MAINTENANCE_TEAM" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}
            >
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>

                {user?.role === "ADMINISTRATOR" && (
                  <p className="text-xs text-gray-500">Set complaint priority level</p>
                )}
                {user?.role === "MAINTENANCE_TEAM" && (
                  <p className="text-xs text-gray-500">
                    You can update status to In Progress or mark as Resolved
                  </p>
                )}
                {/* Validation error display for status */}
                {validationErrors.some(error => error.includes('status') || error.includes('Assigned')) && (
                  <div className="text-xs text-red-600">
                    {validationErrors.find(error => error.includes('status') || error.includes('Assigned'))}
                  </div>
                )}
                <Select
                  value={formData.status}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, status: value }));
                    setValidationErrors([]);
                  }}
                >
                  <SelectTrigger className={cn(
                    "h-11",
                    validationErrors.some(error => error.includes('status') || error.includes('Assigned')) && "border-red-300 focus:border-red-500"
                  )}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStatusOptions().map((status: string) => {
                      const statusConfig: Record<string, any> = {
                        REGISTERED: { icon: Clock, label: "Registered", color: "text-yellow-600" },
                        ASSIGNED: { icon: User, label: "Assigned", color: "text-blue-600" },
                        IN_PROGRESS: { icon: Settings, label: "In Progress", color: "text-orange-600" },
                        RESOLVED: { icon: CheckCircle, label: "Resolved", color: "text-green-600" },
                        CLOSED: { icon: FileText, label: "Closed", color: "text-gray-600" },
                        REOPENED: { icon: RotateCcw, label: "Reopened", color: "text-amber-600" },
                      };
                      const config = statusConfig[status];
                      if (!config) return null;
                      const IconComponent = config.icon;
                      return (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center">
                            <IconComponent className={cn("h-4 w-4 mr-3", config.color)} />
                            <span className="font-medium">{config.label}</span>
                            {status === "REOPENED" && user?.role === "ADMINISTRATOR" && (
                              <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                → Assigned
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {user?.role !== "MAINTENANCE_TEAM" && (
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                  <p className="text-xs text-gray-500">Set complaint priority level</p>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <span className="font-medium">Low</span>
                          <span className="ml-2 text-xs text-gray-500">Non-urgent</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEDIUM">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                          <span className="font-medium">Medium</span>
                          <span className="ml-2 text-xs text-gray-500">Standard</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="HIGH">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                          <span className="font-medium">High</span>
                          <span className="ml-2 text-xs text-gray-500">Urgent</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="CRITICAL">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                          <span className="font-medium">Critical</span>
                          <span className="ml-2 text-xs text-gray-500">Emergency</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {(user?.role === "WARD_OFFICER" ||
            user?.role === "ADMINISTRATOR") && (
              <div className="space-y-4">
                {/* Assignment Required Notice */}
                {user?.role === "WARD_OFFICER" &&
                  (complaint as any)?.needsTeamAssignment &&
                  !["RESOLVED", "CLOSED"].includes(
                    complaint.status ?? "REGISTERED",
                  ) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-blue-500 mr-3 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            Assignment Required
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            This complaint needs to be assigned to a maintenance team member to proceed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* User Assignment Section */}
                <div className="space-y-4">
                  {user?.role === "ADMINISTRATOR" ? (
                    // Admin: Two-column layout for Ward Officer + Maintenance Team
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">User Assignments</h4>
                        <Badge variant="outline" className="text-xs">
                          Admin Controls
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <UserSelectDropdown
                          users={wardOfficerUsers}
                          value={formData.wardOfficerId}
                          onValueChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              wardOfficerId: value,
                            }));
                            setValidationErrors([]);
                          }}
                          label="Ward Officer"
                          placeholder="Select Ward Officer"
                          disabled={isLoadingWardOfficers}
                          isLoading={isLoadingWardOfficers}
                          error={validationErrors.find(error => error.includes('Ward Officer'))}
                          allowNone={true}
                        />

                        <UserSelectDropdown
                          users={maintenanceUsers}
                          value={formData.maintenanceTeamId}
                          onValueChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              maintenanceTeamId: value,
                            }));
                            setValidationErrors([]);
                          }}
                          label="Maintenance Team"
                          placeholder="Select Maintenance Team"
                          disabled={isLoadingMaintenance}
                          isLoading={isLoadingMaintenance}
                          error={validationErrors.find(error =>
                            error.includes('maintenance team') || error.includes('team member')
                          )}
                          allowNone={true}
                        />
                      </div>
                    </div>
                  ) : (
                    // Ward Officer: Single dropdown for Maintenance Team
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {getDropdownLabel()}
                        </h4>
                        {(complaint as any)?.needsTeamAssignment &&
                          !["RESOLVED", "CLOSED"].includes(
                            complaint.status ?? "REGISTERED",
                          ) && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">
                              Assignment Required
                            </Badge>
                          )}
                      </div>

                      <UserSelectDropdown
                        users={availableUsers}
                        value={
                          user?.role === "WARD_OFFICER"
                            ? formData.maintenanceTeamId
                            : formData.wardOfficerId
                        }
                        onValueChange={(value) => {
                          if (user?.role === "WARD_OFFICER") {
                            setFormData((prev) => ({
                              ...prev,
                              maintenanceTeamId: value,
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              wardOfficerId: value,
                            }));
                          }
                          setValidationErrors([]);
                        }}
                        placeholder={getDropdownLabel()}
                        disabled={availableUsers.length === 0}
                        isLoading={isLoadingMaintenance || isLoadingWardOfficers}
                        error={validationErrors.find(error =>
                          error.includes('maintenance team') ||
                          error.includes('team member') ||
                          error.includes('Ward Officer')
                        )}
                        allowNone={true}
                      />
                    </div>
                  )}

                  {/* Loading and Error States */}
                  {(wardOfficersError || maintenanceError) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-sm text-red-700">
                          Error loading users. Please try again.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="text-red-800 font-medium">Please fix the following issues:</p>
                  <ul className="text-red-700 mt-1 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Remarks Section */}
          <div className="space-y-2">
            <div className="flex items-center mb-2">
              <FileText className="h-4 w-4 text-gray-600 mr-2" />
              <Label htmlFor="remarks" className="text-sm font-medium">
                {user?.role === "MAINTENANCE_TEAM"
                  ? "Work Notes (Optional)"
                  : "Remarks (Optional)"}
              </Label>
            </div>
            <Textarea
              id="remarks"
              placeholder={
                user?.role === "MAINTENANCE_TEAM"
                  ? "Add notes about work progress, issues encountered, or completion details..."
                  : user?.role === "WARD_OFFICER"
                    ? "Add notes about assignment, instructions, or status changes..."
                    : "Add any additional comments or remarks about this update..."
              }
              value={formData.remarks}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, remarks: e.target.value }))
              }
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              {user?.role === "MAINTENANCE_TEAM"
                ? "Document your work progress and any issues for future reference"
                : "Add context or instructions that will help with complaint resolution"
              }
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || isReopening}
              className={cn(
                "w-full sm:w-auto order-1 sm:order-2",
                formData.status === "REOPENED" && "bg-amber-600 hover:bg-amber-700",
                user?.role === "MAINTENANCE_TEAM" && "bg-green-600 hover:bg-green-700"
              )}
            >
              {isUpdating || isReopening ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {formData.status === "REOPENED" ? "Reopening..." : "Updating..."}
                </div>
              ) : (
                <>
                  {formData.status === "REOPENED" ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reopen Complaint
                    </>
                  ) : user?.role === "MAINTENANCE_TEAM" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Update Status
                    </>
                  ) : user?.role === "WARD_OFFICER" ? (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Update Complaint
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateComplaintModal;
