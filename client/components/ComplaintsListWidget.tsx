import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppTranslation } from "../utils/i18n";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintsQuery } from "../store/api/complaintsApi";
import type { Complaint } from "../store/api/complaintsApi";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  FileText,
  Calendar,
  MapPin,
  Eye,
  RefreshCw,
  Users,
  UserCheck,
} from "lucide-react";

import ComplaintQuickActions from "./ComplaintQuickActions";
import UpdateComplaintModal from "./UpdateComplaintModal";

interface ComplaintsListWidgetProps {
  filters: any;
  title?: string;
  maxHeight?: string;
  showActions?: boolean;
  onComplaintUpdate?: () => void;
  userRole?: string;
  user?: any;
}

const ComplaintsListWidget: React.FC<ComplaintsListWidgetProps> = ({
  filters,
  title = "Complaints",
  maxHeight = "400px",
  showActions = true,
  onComplaintUpdate,
  userRole,
  user,
}) => {
  const { t } = useAppTranslation();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  // Use provided user or fall back to current user from store
  const effectiveUser = user || currentUser;
  const effectiveUserRole = userRole || effectiveUser?.role;

  // Build query params with proper filtering for Ward Officers
  const queryParams = useMemo(() => {
    const params = {
      ...filters,
      page: 1,
      limit: 50,
    };

    // For Ward Officers, use ward-based filtering if wardId is not already provided
    // This allows them to see all complaints in their ward, not just assigned to them
    if (effectiveUserRole === "WARD_OFFICER" && effectiveUser?.ward?.id && !params.wardId) {
      params.wardId = effectiveUser.ward.id;
    }

    return params;
  }, [filters, effectiveUserRole, effectiveUser?.ward?.id]);

  const {
    data: complaintsResponse,
    isLoading,
    error,
    refetch,
  } = useGetComplaintsQuery(queryParams);

  // Normalize response to array of complaints
  const complaints: Complaint[] = complaintsResponse?.data?.complaints || [];

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

  // Get team assignment status based on maintenanceTeamId
  const getTeamAssignmentStatus = (complaint: any) => {
    if (complaint.maintenanceTeamId) {
      return {
        status: t("complaints.widget.assigned"),
        color: "bg-green-100 text-green-800",
        teamMember:
          complaint.maintenanceTeam?.fullName || t("complaints.widget.unknownTeamMember"),
      };
    } else {
      return {
        status: t("complaints.widget.needsAssignment"),
        color: "bg-orange-100 text-orange-800",
        teamMember: null,
      };
    }
  };

  const hasFilters = Object.keys(filters).some(
    (key) =>
      filters[key] !== undefined &&
      filters[key] !== null &&
      filters[key] !== "" &&
      !(Array.isArray(filters[key]) && filters[key].length === 0),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {title} ({complaintsResponse?.data?.pagination?.totalItems ?? complaints.length})
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {t("complaints.widget.refresh")}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-red-400 mb-4" />
            <p className="text-red-500 mb-2">{t("complaints.widget.failedToLoad")}</p>
            <Button variant="outline" onClick={() => refetch()}>
              {t("complaints.widget.tryAgain")}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">{t("complaints.widget.noComplaintsFound")}</p>
            <p className="text-sm text-gray-400">
              {hasFilters
                ? t("complaints.widget.noComplaintsMatchFilters")
                : t("complaints.widget.noComplaintsAvailable")}
            </p>
          </div>
        ) : (
          <div style={{ maxHeight, overflowY: "auto" }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("complaints.widget.id")}</TableHead>
                  <TableHead>{t("complaints.widget.description")}</TableHead>
                  <TableHead>{t("complaints.widget.location")}</TableHead>
                  <TableHead>{t("complaints.widget.status")}</TableHead>
                  <TableHead>{t("complaints.widget.priority")}</TableHead>
                  {/* {effectiveUserRole === "WARD_OFFICER" && (
                    <TableHead>{t("complaints.widget.teamAssignment")}</TableHead>
                  )} */}
                  {effectiveUserRole === "WARD_OFFICER" && (
                    <TableHead>{t("complaints.widget.team")}</TableHead>
                  )}
                  {effectiveUserRole !== "WARD_OFFICER" && (
                    <TableHead>{t("complaints.widget.rating")}</TableHead>
                  )}
                  {effectiveUserRole !== "WARD_OFFICER" && (
                    <TableHead>{t("complaints.widget.sla")}</TableHead>
                  )}
                  {effectiveUserRole !== "WARD_OFFICER" && (
                    <TableHead>{t("complaints.widget.closed")}</TableHead>
                  )}
                  <TableHead>{t("complaints.widget.updated")}</TableHead>
                  <TableHead>{t("complaints.widget.date")}</TableHead>
                  {showActions && <TableHead>{t("complaints.widget.actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((complaint: Complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium">
                      #{complaint.complaintId || (complaint.id && typeof complaint.id === 'string' ? complaint.id.slice(-6) : 'Unknown')}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate" title={complaint.description}>
                          {complaint.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {complaint.type?.replace("_", " ") || "N/A"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 mr-1" />
                        {complaint.area || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(complaint.status || '')}>
                        {complaint.status?.replace("_", " ") || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(complaint.priority || '')}>
                        {complaint.priority || "N/A"}
                      </Badge>
                    </TableCell>
                    {effectiveUserRole === "WARD_OFFICER" && (
                      <>
                        {/* <TableCell>
                          {(() => {
                            const assignment =
                              getTeamAssignmentStatus(complaint);
                            return (
                              <Badge className={assignment.color}>
                                {assignment.status}
                              </Badge>
                            );
                          })()}
                        </TableCell> */}
                        <TableCell>
                          {(() => {
                            const assignment =
                              getTeamAssignmentStatus(complaint);
                            return assignment.teamMember ? (
                              <div className="flex items-center text-sm width-fit-content">
                                <UserCheck className="h-3 w-3 mr-1" />
                                {assignment.teamMember}
                              </div>
                            ) : (
                              <div className="flex items-center text-sm text-gray-500">
                                <Users className="h-3 w-3 mr-1" />
                                {t("complaints.widget.notAssigned")}
                              </div>
                            );
                          })()}
                        </TableCell>
                      </>
                    )}
                    {effectiveUserRole !== "WARD_OFFICER" && (
                      <>
                        <TableCell>
                          {typeof complaint.rating === "number" &&
                          complaint.rating > 0 ? (
                            <span className="text-sm font-medium">
                              {complaint.rating}/5
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              (complaint.slaStatus === "overdue" &&
                                "bg-red-100 text-red-800") ||
                              (complaint.slaStatus === "warning" &&
                                "bg-yellow-100 text-yellow-800") ||
                              (complaint.slaStatus === "ontime" &&
                                "bg-green-100 text-green-800") ||
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {complaint.slaStatus?.replace("_", " ") || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {complaint.resolvedOn ? (
                            <span className="text-sm">
                              {new Date(
                                complaint.resolvedOn,
                              ).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      {complaint.updatedAt ? (
                        <span className="text-sm">
                          {new Date(complaint.updatedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        {complaint.submittedOn
                          ? new Date(complaint.submittedOn).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ComplaintQuickActions
                            complaint={{
                              id: complaint.id,
                              complaintId: complaint.complaintId,
                              status: complaint.status,
                              priority: complaint.priority,
                              type: complaint.type,
                              description: complaint.description,
                              area: complaint.area,
                              assignedTo: typeof complaint.assignedTo === 'object' ? complaint.assignedTo : null,
                            }}
                            userRole={effectiveUserRole || "WARD_OFFICER"}
                            showDetails={false}
                            onUpdate={() => {
                              refetch();
                              onComplaintUpdate?.();
                            }}
                            onShowUpdateModal={() => {
                              setSelectedComplaint(complaint);
                              setIsUpdateModalOpen(true);
                            }}
                          />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {/* Update Complaint Modal */}
      <UpdateComplaintModal
        complaint={selectedComplaint}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedComplaint(null);
        }}
        onSuccess={() => {
          setIsUpdateModalOpen(false);
          setSelectedComplaint(null);
          refetch();
          onComplaintUpdate?.();
        }}
      />
    </Card>
  );
};

export default ComplaintsListWidget;
