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

export type ComplaintStatus =
  | "REGISTERED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

export interface ComplaintStatusLog {
  id?: string;
  fromStatus?: ComplaintStatus;
  toStatus: ComplaintStatus;
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
  status?: ComplaintStatus | Lowercase<ComplaintStatus> | string;
  submittedBy?: string;
  submittedOn?: string;
  submittedDate?: string;
  assignedOn?: string;
  lastUpdated?: string;
  resolvedOn?: string;
  resolvedDate?: string;
  closedOn?: string;
  slaDeadline?: string;
  slaStatus?: string;
  timeElapsed?: number;
  escalationLevel?: number;
  ward?: WardSummary | string | null;
  wardId?: string;
  wardOfficer?: UserSummary | null;
  maintenanceTeam?: UserSummary | null;
  maintenanceTeamId?: string;
  assignedTo?: UserSummary | string | null;
  assignedToId?: string;
  area?: string;
  location?: string;
  address?: string;
  landmark?: string;
  contactInfo?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  remarks?: string;
  feedback?: string;
  rating?: number;
  attachments?: ComplaintAttachment[];
  photos?: ComplaintPhoto[];
  statusLogs?: ComplaintStatusLog[];
  [key: string]: unknown;
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

// Service Request Types
export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceRequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  byType?: Record<string, number>;
  byStatus?: Record<string, number>;
  byPriority?: Record<string, number>;
}

export interface ServiceRequestStatusLog {
  id?: string;
  fromStatus?: string;
  toStatus: string;
  timestamp?: string;
  comment?: string;
  updatedBy?: UserSummary | null;
}

export interface ServiceRequest {
  id: string;
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
  submittedBy?: string;
  submittedOn?: string;
  assignedTo?: UserSummary | string | null;
  assignedToId?: string;
  completedOn?: string;
  statusLogs?: ServiceRequestStatusLog[];
  [key: string]: unknown;
}

// Status and Filter Types
export type StatusId = 
  | "registered" 
  | "assigned" 
  | "resolved" 
  | "closed" 
  | "reopened" 
  | "inProgress"
  | "total"
  | "none";

export interface Filters {
  mainFilter: StatusId;
  [key: string]: unknown;
}

export interface Stats {
  total: number;
  registered: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  reopened: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  timestamp?: string;
  isRead?: boolean;
  userId?: string;
  data?: Record<string, unknown>;
}
