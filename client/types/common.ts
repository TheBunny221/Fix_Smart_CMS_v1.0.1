export type Role =
  | "CITIZEN"
  | "ADMINISTRATOR"
  | "WARD_OFFICER"
  | "MAINTENANCE_TEAM"
  | "GUEST";

export interface WardSummary {
  id: string;
  name: string;
  description?: string;
}

export interface UserSummary {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  role: Role;
  wardId?: string;
  department?: string;
  avatar?: string;
  language?: string;
  isActive?: boolean;
  ward?: WardSummary | null;
}

export interface ComplaintAttachment {
  id?: string;
  url: string;
  fileName?: string;
  originalName?: string;
  mimeType?: string | null;
}

export interface ComplaintPhoto {
  id?: string;
  photoUrl: string;
  fileName?: string;
  originalName?: string;
}

export interface ComplaintStatusLog {
  id?: string;
  fromStatus?: string;
  toStatus: string;
  timestamp?: string;
  comment?: string;
  updatedBy?: UserSummary | null;
}

export interface Complaint {
  id: string;
  complaintId?: string;
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
  submittedOn?: string;
  assignedOn?: string;
  remarks?: string;
  ward?: WardSummary | null;
  wardOfficer?: UserSummary | null;
  maintenanceTeam?: UserSummary | null;
  assignedTo?: UserSummary | null;
  attachments?: ComplaintAttachment[];
  photos?: ComplaintPhoto[];
  statusLogs?: ComplaintStatusLog[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
}
