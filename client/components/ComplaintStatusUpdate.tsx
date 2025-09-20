import React, { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useAppSelector } from "../store/hooks";
import {
  useAssignComplaintMutation,
  useGetWardUsersQuery,
  useUpdateComplaintMutation,
  useUpdateComplaintStatusMutation,
} from "../store/api/complaintsApi";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { useToast } from "../hooks/use-toast";
import { AlertCircle, CheckCircle, Clock, User, UserCheck } from "lucide-react";
import type { Complaint as ComplaintApiModel } from "../store/api/complaintsApi";
import type { ComplaintStatus } from "../store/slices/complaintsSlice";

interface ComplaintStatusUpdateProps {
  complaint: {
    id: string;
    complaintId?: string;
    status: ComplaintStatus;
    priority: string;
    type: string;
    description: string;
    area: string;
    assignedTo?: { id: string; fullName: string } | null;
    wardOfficer?: { id: string; fullName: string } | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: "status" | "assign" | "both";
}

type ComplaintStatusOption = {
  value: ComplaintStatus;
  label: string;
  icon: typeof AlertCircle;
  color: string;
};

const DEFAULT_STATUS: ComplaintStatusOption = {
  value: "REGISTERED",
  label: "Registered",
  icon: AlertCircle,
  color: "bg-yellow-100 text-yellow-800",
};

const COMPLAINT_STATUSES: ComplaintStatusOption[] = [
  DEFAULT_STATUS,
  {
    value: "ASSIGNED",
    label: "Assigned",
    icon: User,
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    icon: Clock,
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "RESOLVED",
    label: "Resolved",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
  },
  {
    value: "CLOSED",
    label: "Closed",
    icon: CheckCircle,
    color: "bg-gray-100 text-gray-800",
  },
  {
    value: "REOPENED",
    label: "Reopened",
    icon: AlertCircle,
    color: "bg-purple-100 text-purple-800",
  },
];

const toApiStatus = (
  status: ComplaintStatus,
): ComplaintApiModel["status"] => {
  switch (status) {
    case "REGISTERED":
      return "registered";
    case "ASSIGNED":
      return "assigned";
    case "IN_PROGRESS":
      return "in_progress";
    case "RESOLVED":
      return "resolved";
    case "CLOSED":
      return "closed";
    case "REOPENED":
      return "reopened";
    default:
      return "registered";
  }
};

const ComplaintStatusUpdate: React.FC<ComplaintStatusUpdateProps> = ({
  complaint,
  isOpen,
  onClose,
  onSuccess,
  mode = "both",
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [updateComplaintStatus, { isLoading: isUpdatingStatus }] =
    useUpdateComplaintStatusMutation();
  const [assignComplaint, { isLoading: isAssigning }] =
    useAssignComplaintMutation();
  const [updateComplaint] = useUpdateComplaintMutation();

  const [formData, setFormData] = useState<{
    status: ComplaintStatus;
    assignedTo: string;
    remarks: string;
  }>({
    status: complaint.status,
    assignedTo: "unassigned",
    remarks: "",
  });

  useEffect(() => {
    const currentAssigneeId =
      complaint.wardOfficer?.id || complaint.assignedTo?.id || "unassigned";
    setFormData({
      status: complaint.status,
      assignedTo: currentAssigneeId,
      remarks: "",
    });
  }, [complaint.assignedTo?.id, complaint.status, complaint.wardOfficer?.id]);

  const isLoading = isUpdatingStatus || isAssigning;

  const getUsersFilter = () => {
    if (user?.role === "ADMINISTRATOR") return { role: "WARD_OFFICER" };
    if (user?.role === "WARD_OFFICER") return { role: "MAINTENANCE_TEAM" };
    return {};
  };

  const { data: usersResponse, isLoading: usersLoading } = useGetWardUsersQuery(
    {
      page: 1,
      limit: 100,
      ...getUsersFilter(),
    },
  );

  const assignableUsers = useMemo(
    () => usersResponse?.data?.users ?? [],
    [usersResponse?.data?.users],
  );

  const getStatusInfo = (status: ComplaintStatus): ComplaintStatusOption =>
    COMPLAINT_STATUSES.find((item) => item.value === status) ?? DEFAULT_STATUS;

  const currentStatusInfo = getStatusInfo(complaint.status);
  const newStatusInfo = getStatusInfo(formData.status as ComplaintStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const trimmedRemarks = formData.remarks.trim();

      if (
        mode === "status" ||
        (mode === "both" && formData.status !== complaint.status)
      ) {
        const statusPayload: {
          id: string;
          status: ComplaintStatus;
          remarks?: string;
        } = {
          id: complaint.id,
          status: toApiStatus(formData.status),
        };

        if (trimmedRemarks) {
          statusPayload.remarks = trimmedRemarks;
        }

        await updateComplaintStatus(statusPayload).unwrap();
      }

      if (
        mode === "assign" ||
        (mode === "both" &&
          formData.assignedTo !==
            (complaint.wardOfficer?.id ||
              complaint.assignedTo?.id ||
              "unassigned"))
      ) {
        if (user?.role === "WARD_OFFICER") {
          const assignPayload: {
            id: string;
            assignedTo: string;
            remarks?: string;
          } = {
            id: complaint.id,
            assignedTo:
              formData.assignedTo === "unassigned" ? "" : formData.assignedTo,
          };

          if (trimmedRemarks) {
            assignPayload.remarks = trimmedRemarks;
          }

          await assignComplaint(assignPayload).unwrap();
        } else if (user?.role === "ADMINISTRATOR") {
          const updateData: Record<string, string> = {};
          if (formData.assignedTo !== "unassigned") {
            updateData.wardOfficerId = formData.assignedTo;
          }
          if (trimmedRemarks) {
            updateData.remarks = trimmedRemarks;
          }
          await updateComplaint({ id: complaint.id, ...updateData }).unwrap();
        }
      }

      toast({
        title: "Success",
        description: "Complaint updated successfully",
      });

      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const message =
        getApiErrorMessage(error) || "Failed to update complaint";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <currentStatusInfo.icon className="h-5 w-5" />
            Update Complaint #{complaint.complaintId || complaint.id.slice(-6)}
          </DialogTitle>
          <DialogDescription>
            Update the status and assignment for this complaint
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 font-medium">Complaint Summary</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Type:</strong> {complaint.type.replace("_", " ")}
              </p>
              <p>
                <strong>Area:</strong> {complaint.area}
              </p>
              <p>
                <strong>Description:</strong> {complaint.description}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge className={currentStatusInfo.color}>
                  {currentStatusInfo.label}
                </Badge>
                {(complaint.wardOfficer || complaint.assignedTo) && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {(complaint.wardOfficer || complaint.assignedTo)?.fullName}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {(mode === "status" || mode === "both") && (
            <div className="space-y-2">
              <Label htmlFor="status">Update Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as ComplaintStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPLAINT_STATUSES.filter((status) => status.value !== "REOPENED").map(
                    (status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <status.icon className="h-4 w-4" />
                          {status.label}
                        </div>
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>

              {formData.status !== complaint.status && (
                <div className="rounded bg-blue-50 p-2 text-sm text-blue-600">
                  Status will change from <strong>{currentStatusInfo.label}</strong>{" "}
                  to <strong>{newStatusInfo.label}</strong>
                </div>
              )}
            </div>
          )}

          {(mode === "assign" || mode === "both") && (
            <div className="space-y-2">
              <Label htmlFor="assignedTo">
                {user?.role === "ADMINISTRATOR"
                  ? "Assign to Ward Officer"
                  : "Assign to Team Member"}
              </Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, assignedTo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      user?.role === "ADMINISTRATOR"
                        ? "Select ward officer"
                        : "Select team member"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {usersLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading users...
                    </SelectItem>
                  ) : (
                    assignableUsers.map((assignableUser) => (
                      <SelectItem key={assignableUser.id} value={assignableUser.id}>
                        <div className="flex w-full flex-col">
                          <span>{assignableUser.fullName}</span>
                          {assignableUser.email && (
                            <span className="text-xs text-gray-500">
                              {assignableUser.email}
                            </span>
                          )}
                          {assignableUser.ward?.name && (
                            <span className="text-xs text-blue-600">
                              {assignableUser.ward.name}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, remarks: e.target.value }))
              }
              placeholder="Add any comments about this update..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? "Updating..." : "Update Complaint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintStatusUpdate;
