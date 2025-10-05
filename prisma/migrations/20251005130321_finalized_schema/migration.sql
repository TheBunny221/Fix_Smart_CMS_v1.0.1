-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'WARD_OFFICER', 'MAINTENANCE_TEAM', 'ADMINISTRATOR', 'GUEST');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('REGISTERED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SLAStatus" AS ENUM ('ON_TIME', 'WARNING', 'OVERDUE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('SUBMITTED', 'VERIFIED', 'PROCESSING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "AttachmentEntityType" AS ENUM ('COMPLAINT', 'CITIZEN', 'USER', 'SERVICE_REQUEST', 'SYSTEM_CONFIG', 'MAINTENANCE_PHOTO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CITIZEN',
    "wardId" TEXT,
    "department" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "joinedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "slaHours" INTEGER NOT NULL DEFAULT 48,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaint_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "type" TEXT,
    "complaintTypeId" INTEGER,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'REGISTERED',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "slaStatus" "SLAStatus" NOT NULL DEFAULT 'ON_TIME',
    "wardId" TEXT NOT NULL,
    "subZoneId" TEXT,
    "area" TEXT NOT NULL,
    "landmark" TEXT,
    "address" TEXT,
    "coordinates" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "submittedById" TEXT,
    "assignedToId" TEXT,
    "resolvedById" TEXT,
    "wardOfficerId" TEXT,
    "maintenanceTeamId" TEXT,
    "submittedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedOn" TIMESTAMP(3),
    "resolvedOn" TIMESTAMP(3),
    "closedOn" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "remarks" TEXT,
    "citizenFeedback" TEXT,
    "rating" INTEGER,
    "assignToTeam" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_logs" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "comment" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "entityType" "AttachmentEntityType" NOT NULL DEFAULT 'COMPLAINT',
    "entityId" TEXT NOT NULL,
    "complaintId" TEXT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "complaintId" TEXT,
    "serviceRequestId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "sentById" TEXT NOT NULL,
    "receivedById" TEXT,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "otpCode" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'GUEST_VERIFICATION',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "otp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "wardId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "landmark" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "submittedById" TEXT,
    "assignedToId" TEXT,
    "submittedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferredDateTime" TIMESTAMP(3),
    "assignedOn" TIMESTAMP(3),
    "expectedCompletion" TIMESTAMP(3),
    "completedOn" TIMESTAMP(3),
    "remarks" TEXT,
    "citizenFeedback" TEXT,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_status_logs" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "comment" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "headUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filters" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "schema_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE INDEX "users_wardId_idx" ON "users"("wardId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wards_name_key" ON "wards"("name");

-- CreateIndex
CREATE INDEX "wards_name_idx" ON "wards"("name");

-- CreateIndex
CREATE INDEX "wards_isActive_idx" ON "wards"("isActive");

-- CreateIndex
CREATE INDEX "sub_zones_wardId_idx" ON "sub_zones"("wardId");

-- CreateIndex
CREATE INDEX "sub_zones_name_idx" ON "sub_zones"("name");

-- CreateIndex
CREATE UNIQUE INDEX "complaint_types_name_key" ON "complaint_types"("name");

-- CreateIndex
CREATE INDEX "complaint_types_name_idx" ON "complaint_types"("name");

-- CreateIndex
CREATE INDEX "complaint_types_isActive_idx" ON "complaint_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_complaintId_key" ON "complaints"("complaintId");

-- CreateIndex
CREATE INDEX "complaints_submittedById_createdAt_idx" ON "complaints"("submittedById", "createdAt");

-- CreateIndex
CREATE INDEX "complaints_wardId_status_idx" ON "complaints"("wardId", "status");

-- CreateIndex
CREATE INDEX "complaints_assignedToId_status_idx" ON "complaints"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "complaints_maintenanceTeamId_status_idx" ON "complaints"("maintenanceTeamId", "status");

-- CreateIndex
CREATE INDEX "complaints_type_status_idx" ON "complaints"("type", "status");

-- CreateIndex
CREATE INDEX "complaints_complaintTypeId_status_idx" ON "complaints"("complaintTypeId", "status");

-- CreateIndex
CREATE INDEX "complaints_priority_status_idx" ON "complaints"("priority", "status");

-- CreateIndex
CREATE INDEX "complaints_submittedOn_idx" ON "complaints"("submittedOn");

-- CreateIndex
CREATE INDEX "complaints_status_createdAt_idx" ON "complaints"("status", "createdAt");

-- CreateIndex
CREATE INDEX "complaints_complaintId_idx" ON "complaints"("complaintId");

-- CreateIndex
CREATE INDEX "status_logs_complaintId_timestamp_idx" ON "status_logs"("complaintId", "timestamp");

-- CreateIndex
CREATE INDEX "status_logs_userId_idx" ON "status_logs"("userId");

-- CreateIndex
CREATE INDEX "status_logs_timestamp_idx" ON "status_logs"("timestamp");

-- CreateIndex
CREATE INDEX "attachments_entityType_entityId_idx" ON "attachments"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "attachments_fileName_idx" ON "attachments"("fileName");

-- CreateIndex
CREATE INDEX "attachments_complaintId_idx" ON "attachments"("complaintId");

-- CreateIndex
CREATE INDEX "attachments_uploadedById_idx" ON "attachments"("uploadedById");

-- CreateIndex
CREATE INDEX "attachments_createdAt_idx" ON "attachments"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_complaintId_idx" ON "notifications"("complaintId");

-- CreateIndex
CREATE INDEX "notifications_serviceRequestId_idx" ON "notifications"("serviceRequestId");

-- CreateIndex
CREATE INDEX "notifications_sentAt_idx" ON "notifications"("sentAt");

-- CreateIndex
CREATE INDEX "messages_complaintId_idx" ON "messages"("complaintId");

-- CreateIndex
CREATE INDEX "messages_sentById_idx" ON "messages"("sentById");

-- CreateIndex
CREATE INDEX "messages_sentAt_idx" ON "messages"("sentAt");

-- CreateIndex
CREATE INDEX "otp_sessions_email_purpose_isVerified_idx" ON "otp_sessions"("email", "purpose", "isVerified");

-- CreateIndex
CREATE INDEX "otp_sessions_expiresAt_idx" ON "otp_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "otp_sessions_userId_idx" ON "otp_sessions"("userId");

-- CreateIndex
CREATE INDEX "otp_sessions_otpCode_idx" ON "otp_sessions"("otpCode");

-- CreateIndex
CREATE INDEX "service_requests_submittedById_createdAt_idx" ON "service_requests"("submittedById", "createdAt");

-- CreateIndex
CREATE INDEX "service_requests_wardId_status_idx" ON "service_requests"("wardId", "status");

-- CreateIndex
CREATE INDEX "service_requests_assignedToId_status_idx" ON "service_requests"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "service_requests_serviceType_status_idx" ON "service_requests"("serviceType", "status");

-- CreateIndex
CREATE INDEX "service_requests_submittedOn_idx" ON "service_requests"("submittedOn");

-- CreateIndex
CREATE INDEX "service_request_status_logs_serviceRequestId_timestamp_idx" ON "service_request_status_logs"("serviceRequestId", "timestamp");

-- CreateIndex
CREATE INDEX "service_request_status_logs_userId_idx" ON "service_request_status_logs"("userId");

-- CreateIndex
CREATE INDEX "service_request_status_logs_timestamp_idx" ON "service_request_status_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE INDEX "departments_name_idx" ON "departments"("name");

-- CreateIndex
CREATE INDEX "departments_isActive_idx" ON "departments"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "system_config_key_isActive_idx" ON "system_config"("key", "isActive");

-- CreateIndex
CREATE INDEX "system_config_type_idx" ON "system_config"("type");

-- CreateIndex
CREATE INDEX "reports_type_generatedAt_idx" ON "reports"("type", "generatedAt");

-- CreateIndex
CREATE INDEX "reports_generatedBy_idx" ON "reports"("generatedBy");

-- CreateIndex
CREATE INDEX "reports_generatedAt_idx" ON "reports"("generatedAt");

-- CreateIndex
CREATE INDEX "materials_complaintId_idx" ON "materials"("complaintId");

-- CreateIndex
CREATE INDEX "materials_addedById_idx" ON "materials"("addedById");

-- CreateIndex
CREATE INDEX "materials_usedAt_idx" ON "materials"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "schema_versions_version_key" ON "schema_versions"("version");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_zones" ADD CONSTRAINT "sub_zones_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_subZoneId_fkey" FOREIGN KEY ("subZoneId") REFERENCES "sub_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_wardOfficerId_fkey" FOREIGN KEY ("wardOfficerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_maintenanceTeamId_fkey" FOREIGN KEY ("maintenanceTeamId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_complaintTypeId_fkey" FOREIGN KEY ("complaintTypeId") REFERENCES "complaint_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_logs" ADD CONSTRAINT "status_logs_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_logs" ADD CONSTRAINT "status_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_sessions" ADD CONSTRAINT "otp_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_status_logs" ADD CONSTRAINT "service_request_status_logs_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_status_logs" ADD CONSTRAINT "service_request_status_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
