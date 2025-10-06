# Schema Reference

Complete documentation of the Fix_Smart_CMS v1.0.3 database schema, including all active models, relationships, and field descriptions.

## Database Overview

- **Production Database**: PostgreSQL
- **Development Database**: SQLite (for local development)
- **ORM**: Prisma 6.16.3
- **Schema Version**: v1.0.3 (Production-ready, active models only)
- **Schema File**: `prisma/schema.prisma` (Unified production schema)

## Schema Evolution (v1.0.3)

### Active Models
The current schema includes only production-ready, actively used models:
- User, Ward, SubZone, ComplaintType, Complaint, StatusLog
- Attachment (unified), OTPSession, Notification, SystemConfig

### Removed Models
The following models were deprecated and removed in v1.0.3:
- **Message**: Replaced by unified notification system
- **Material**: Simplified to string-based tracking in complaints
- **Tool**: Simplified to string-based tracking in complaints  
- **Department**: Integrated into User model as string field
- **Photo**: Merged into unified Attachment model
- **ServiceRequest**: Removed from core schema
- **Report**: Moved to application-level reporting

## Core Enums

### UserRole
```prisma
enum UserRole {
  CITIZEN           // Regular citizens submitting complaints
  WARD_OFFICER      // Ward-level officers managing complaints
  MAINTENANCE_TEAM  // Field staff resolving complaints
  ADMINISTRATOR     // System administrators
  GUEST            // Temporary users for complaint submission
}
```

### ComplaintStatus
```prisma
enum ComplaintStatus {
  REGISTERED       // Initial status when complaint is submitted
  ASSIGNED         // Assigned to ward officer or maintenance team
  IN_PROGRESS      // Work has started on the complaint
  RESOLVED         // Work completed, awaiting citizen confirmation
  CLOSED           // Complaint closed after citizen confirmation
  REOPENED         // Reopened due to citizen dispute or new issues
}
```

### Priority
```prisma
enum Priority {
  LOW              // Non-urgent issues
  MEDIUM           // Standard priority (default)
  HIGH             // Urgent issues requiring quick attention
  CRITICAL         // Emergency issues requiring immediate attention
}
```

### SLAStatus
```prisma
enum SLAStatus {
  ON_TIME          // Within SLA timeframe
  WARNING          // Approaching SLA deadline
  OVERDUE          // Past SLA deadline
  COMPLETED        // Completed within SLA
}
```



### AttachmentEntityType
```prisma
enum AttachmentEntityType {
  COMPLAINT        // Complaint-related attachments
  CITIZEN          // Citizen profile attachments
  USER             // User profile attachments
  MAINTENANCE_PHOTO // Maintenance work photos
}
```

## Core Models

### User Model
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  fullName    String
  phoneNumber String?
  password    String?
  role        UserRole @default(CITIZEN)
  wardId      String?
  department  String?
  language    String   @default("en")
  avatar      String?
  isActive    Boolean  @default(true)
  lastLogin   DateTime?
  joinedOn    DateTime @default(now())

  // Relations - Only active models
  ward                      Ward?          @relation(fields: [wardId], references: [id])
  submittedComplaints       Complaint[]    @relation("SubmittedBy")
  assignedComplaints        Complaint[]    @relation("AssignedTo")
  wardOfficerComplaints     Complaint[]    @relation("WardOfficer")
  maintenanceTeamComplaints Complaint[]    @relation("MaintenanceTeam")
  statusLogs                StatusLog[]
  otpSessions               OTPSession[]
  uploadedAttachments       Attachment[]   @relation("AttachmentUploadedBy")
  notifications             Notification[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([role, isActive])
  @@index([wardId])
  @@index([email])
  @@map("users")
}
```

**Field Descriptions:**
- `id`: Unique identifier using CUID
- `email`: User's email address (unique)
- `fullName`: User's full name
- `phoneNumber`: Optional phone number
- `password`: Hashed password (nullable for OTP-only users)
- `role`: User role from UserRole enum
- `wardId`: Associated ward (for ward officers)
- `department`: Department name (for staff users)
- `language`: Preferred language (default: "en")
- `avatar`: Profile picture URL
- `isActive`: Account status
- `lastLogin`: Last login timestamp
- `joinedOn`: Account creation date

### Ward Model
```prisma
model Ward {
  id          String  @id @default(cuid())
  name        String  @unique
  description String?
  isActive    Boolean @default(true)

  // Relations
  users      User[]
  complaints Complaint[]
  subZones   SubZone[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([name])
  @@index([isActive])
  @@map("wards")
}
```

**Field Descriptions:**
- `id`: Unique ward identifier
- `name`: Ward name (unique)
- `description`: Optional ward description
- `isActive`: Ward status

### SubZone Model
```prisma
model SubZone {
  id          String  @id @default(cuid())
  name        String
  wardId      String
  description String?
  isActive    Boolean @default(true)

  // Relations
  ward       Ward        @relation(fields: [wardId], references: [id], onDelete: Cascade)
  complaints Complaint[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([wardId])
  @@index([name])
  @@map("sub_zones")
}
```

### ComplaintType Model
```prisma
model ComplaintType {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?
  priority    Priority  @default(MEDIUM)
  slaHours    Int       @default(48)
  isActive    Boolean   @default(true)
  complaints  Complaint[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([name])
  @@index([isActive])
  @@map("complaint_types")
}
```

**Field Descriptions:**
- `id`: Auto-incrementing integer ID
- `name`: Complaint type name (unique)
- `description`: Type description
- `priority`: Default priority for this type
- `slaHours`: SLA hours for resolution
- `isActive`: Type availability status

### Complaint Model
```prisma
model Complaint {
  id              String            @id @default(cuid())
  complaintId     String?           @unique  // Human-readable ID like NLC0001
  title           String?
  description     String
  type            String?           // Legacy string type
  complaintTypeId Int?
  status          ComplaintStatus   @default(REGISTERED)
  priority        Priority          @default(MEDIUM)
  slaStatus       SLAStatus         @default(ON_TIME)
  
  // Location Information
  wardId          String
  subZoneId       String?
  area            String
  landmark        String?
  address         String?
  coordinates     String?           // JSON string for lat/lng
  latitude        Float?            // Explicit latitude field
  longitude       Float?            // Explicit longitude field
  
  // Contact Information
  contactName     String?
  contactEmail    String?
  contactPhone    String
  isAnonymous     Boolean           @default(false)
  
  // Assignment and Tracking
  submittedById   String?
  assignedToId    String?           // Generic assignment field
  resolvedById    String?
  wardOfficerId   String?           // Automatically assigned ward officer
  maintenanceTeamId String?         // Assigned maintenance team member
  
  // Timestamps
  submittedOn     DateTime          @default(now())
  assignedOn      DateTime?
  resolvedOn      DateTime?
  closedOn        DateTime?
  deadline        DateTime?
  
  // Additional Information
  remarks         String?
  citizenFeedback String?
  rating          Int?              // 1-5 rating
  assignToTeam    Boolean           @default(false)
  tags            String?           // JSON array of tags
  
  // Relations - Only active models
  ward            Ward           @relation(fields: [wardId], references: [id])
  subZone         SubZone?       @relation(fields: [subZoneId], references: [id])
  submittedBy     User?          @relation("SubmittedBy", fields: [submittedById], references: [id])
  assignedTo      User?          @relation("AssignedTo", fields: [assignedToId], references: [id])
  wardOfficer     User?          @relation("WardOfficer", fields: [wardOfficerId], references: [id])
  maintenanceTeam User?          @relation("MaintenanceTeam", fields: [maintenanceTeamId], references: [id])
  complaintType   ComplaintType? @relation(fields: [complaintTypeId], references: [id])
  statusLogs      StatusLog[]
  attachments     Attachment[]
  notifications   Notification[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Performance indexes
  @@index([submittedById, createdAt])
  @@index([wardId, status])
  @@index([assignedToId, status])
  @@index([maintenanceTeamId, status])
  @@index([type, status])
  @@index([complaintTypeId, status])
  @@index([priority, status])
  @@index([submittedOn])
  @@index([status, createdAt])
  @@index([complaintId])
  @@map("complaints")
}
```

**Key Field Descriptions:**
- `complaintId`: Human-readable ID (e.g., "NLC0001")
- `type`: Legacy string-based complaint type
- `complaintTypeId`: New structured complaint type reference
- `coordinates`: JSON string containing latitude/longitude
- `latitude/longitude`: Explicit coordinate fields
- `isAnonymous`: Whether complaint was submitted anonymously
- `assignToTeam`: Flag for team-based assignment
- `tags`: JSON array of searchable tags

### StatusLog Model
```prisma
model StatusLog {
  id          String   @id @default(cuid())
  complaintId String
  userId      String
  fromStatus  String?  // Previous status
  toStatus    String   // New status
  comment     String?
  timestamp   DateTime @default(now())
  
  // Relations
  complaint   Complaint @relation(fields: [complaintId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])

  @@index([complaintId, timestamp])
  @@index([userId])
  @@index([timestamp])
  @@map("status_logs")
}
```

### Attachment Model (Unified)
```prisma
model Attachment {
  id           String                @id @default(cuid())
  entityType   AttachmentEntityType  @default(COMPLAINT)
  entityId     String                // Generic entity ID
  complaintId  String?               // Specific complaint reference
  fileName     String
  originalName String
  mimeType     String
  size         Int
  url          String
  description  String?
  createdAt    DateTime              @default(now())
  uploadedById String?

  // Relations
  complaint   Complaint? @relation(fields: [complaintId], references: [id], onDelete: Cascade)
  uploadedBy  User?      @relation("AttachmentUploadedBy", fields: [uploadedById], references: [id], onDelete: SetNull)

  @@index([entityType, entityId])
  @@index([fileName])
  @@index([complaintId])
  @@index([uploadedById])
  @@index([createdAt])
  @@map("attachments")
}
```

**Field Descriptions:**
- `entityType`: Type of entity the attachment belongs to
- `entityId`: Generic ID of the parent entity
- `complaintId`: Specific complaint ID (for backward compatibility)
- `fileName`: Stored filename on disk
- `originalName`: Original filename from user
- `mimeType`: File MIME type
- `size`: File size in bytes
- `url`: Accessible URL path
- `description`: Optional file description

## Notification Model

### Notification Model
```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String
  complaintId String?
  type        String   @default("IN_APP") // IN_APP, EMAIL, SMS
  title       String
  message     String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  complaint Complaint? @relation(fields: [complaintId], references: [id], onDelete: SetNull)

  @@index([userId, isRead])
  @@index([createdAt])
  @@index([complaintId])
  @@map("notifications")
}
```

**Field Descriptions:**
- `type`: Notification channel (IN_APP, EMAIL, SMS)
- `title`: Notification title/subject
- `message`: Notification content
- `isRead`: Whether user has read the notification
- `createdAt`: When notification was created
- `updatedAt`: Last update timestamp

## Authentication Models

### OTPSession Model
```prisma
model OTPSession {
  id          String    @id @default(cuid())
  userId      String?
  email       String
  phoneNumber String?
  otpCode     String
  purpose     String    @default("GUEST_VERIFICATION")
  isVerified  Boolean   @default(false)
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  verifiedAt  DateTime?
  
  // Relations
  user        User?     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([email, purpose, isVerified])
  @@index([expiresAt])
  @@index([userId])
  @@index([otpCode])
  @@map("otp_sessions")
}
```

**Field Descriptions:**
- `purpose`: OTP purpose (GUEST_VERIFICATION, PASSWORD_RESET, LOGIN, REGISTRATION)
- `otpCode`: 6-digit OTP code
- `expiresAt`: OTP expiration timestamp
- `isVerified`: Whether OTP has been verified
- `verifiedAt`: Verification timestamp



## System Configuration Model

### SystemConfig Model
```prisma
model SystemConfig {
  id          String    @id @default(cuid())
  key         String    @unique
  value       String
  type        String?   // Category: 'app', 'complaint', 'contact', 'system'
  description String?
  isActive    Boolean   @default(true)
  updatedAt   DateTime  @updatedAt

  @@index([key, isActive])
  @@index([type])
  @@map("system_config")
}
```

**Common Configuration Keys:**
- `app_name`: Application name
- `app_version`: Current version
- `contact_email`: Support email
- `contact_phone`: Support phone
- `max_file_size`: Maximum upload size
- `supported_languages`: Available languages
- `sla_default_hours`: Default SLA hours
- `email_notifications_enabled`: Email notification toggle



## Database Relationships

### One-to-Many Relationships
- **Ward → Users**: One ward can have many users
- **Ward → Complaints**: One ward can have many complaints
- **Ward → SubZones**: One ward can have many sub-zones
- **User → Complaints**: One user can submit many complaints
- **Complaint → StatusLogs**: One complaint can have many status logs
- **Complaint → Attachments**: One complaint can have many attachments
- **Complaint → Messages**: One complaint can have many messages

### Many-to-One Relationships
- **Complaints → Ward**: Many complaints belong to one ward
- **Users → Ward**: Many users can belong to one ward
- **StatusLogs → User**: Many status logs created by one user
- **Attachments → User**: Many attachments uploaded by one user

### Optional Relationships
- **User → Ward**: Users may or may not belong to a ward
- **Complaint → SubZone**: Complaints may or may not have a sub-zone
- **Complaint → ComplaintType**: Complaints may use legacy string types

## Indexes and Performance

### Primary Indexes
- All models have primary key indexes on `id` field
- Unique indexes on email, complaint ID, ward names

### Composite Indexes
- `[role, isActive]` on User for role-based queries
- `[wardId, status]` on Complaint for ward-specific filtering
- `[submittedById, createdAt]` on Complaint for user complaint history
- `[entityType, entityId]` on Attachment for entity-specific files

### Query Optimization
- Status-based queries use compound indexes
- Date range queries use timestamp indexes
- Search queries use text indexes where applicable

## Migration Strategy

### Development Migrations
```bash
# Create new migration
npm run db:migrate:create

# Apply migrations
npm run db:migrate:dev

# Reset database
npm run db:migrate:reset:dev
```

### Production Migrations
```bash
# Deploy migrations
npm run db:migrate:prod

# Check migration status
npm run db:migrate:status
```

### Schema Evolution
1. **Backward Compatible Changes**: Add new optional fields
2. **Breaking Changes**: Use multi-step migrations
3. **Data Migrations**: Include data transformation scripts
4. **Rollback Strategy**: Maintain rollback scripts for critical changes

---

**Next**: [State Management](STATE_MANAGEMENT.md) | **Previous**: [API Reference](API_REFERENCE.md) | **Up**: [Documentation Home](../README.md)