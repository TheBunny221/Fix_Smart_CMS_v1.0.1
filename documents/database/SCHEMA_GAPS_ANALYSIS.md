# Schema Gaps Analysis - Prisma vs Swagger

## Overview
This document analyzes the differences between the current Prisma schema definitions and the Swagger/OpenAPI schema definitions to identify gaps, inconsistencies, and missing elements.

## Model-by-Model Analysis

### 1. User Model

**Prisma Schema Fields:**
```prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  fullName    String
  phoneNumber String?
  password    String?
  role        UserRole  @default(CITIZEN)
  wardId      String?
  department  String?
  language    String    @default("en")
  avatar      String?
  isActive    Boolean   @default(true)
  lastLogin   DateTime?
  joinedOn    DateTime  @default(now())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Swagger Schema Status:** ✅ MOSTLY COMPLETE
**Issues Found:**
- ✅ All fields present in Swagger
- ✅ Enums match (UserRole)
- ✅ Relationships documented
- ⚠️ Missing request/response schemas for user operations
- ⚠️ No filtered schemas (public vs private fields)

**Missing Schemas:**
- `UserCreateRequest`
- `UserUpdateRequest` 
- `UserPublicProfile` (filtered fields)
- `UserListResponse` (paginated)

### 2. Ward Model

**Prisma Schema Fields:**
```prisma
model Ward {
  id          String  @id @default(cuid())
  name        String  @unique
  description String?
  isActive    Boolean @default(true)
  // Geographic fields missing from Prisma but in Swagger
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Swagger Schema Status:** ⚠️ INCONSISTENT
**Issues Found:**
- ❌ Swagger includes geographic fields not in Prisma:
  - `boundaries` (JSON string)
  - `centerLat`, `centerLng` (numbers)
  - `boundingBox` (JSON string)
- ✅ Basic fields match
- ✅ Relationships documented

**Action Required:**
- Verify if geographic fields exist in actual database
- Update either Prisma or Swagger to match reality

### 3. SubZone Model

**Prisma Schema Fields:**
```prisma
model SubZone {
  id          String  @id @default(cuid())
  name        String
  wardId      String
  description String?
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Swagger Schema Status:** ⚠️ INCONSISTENT
**Issues Found:**
- ❌ Swagger includes geographic fields not in Prisma:
  - `boundaries`, `centerLat`, `centerLng`, `boundingBox`
- ✅ Basic fields match
- ✅ Ward relationship documented

**Action Required:**
- Same as Ward model - verify geographic field existence

### 4. Complaint Model

**Prisma Schema Fields:**
```prisma
model Complaint {
  id              String          @id @default(cuid())
  complaintId     String?         @unique
  title           String?
  description     String
  type            String?         // Legacy field
  complaintTypeId Int?           // New field
  status          ComplaintStatus @default(REGISTERED)
  priority        Priority        @default(MEDIUM)
  slaStatus       SLAStatus       @default(ON_TIME)
  
  // Location fields
  wardId      String
  subZoneId   String?
  area        String
  landmark    String?
  address     String?
  coordinates String? // JSON string
  latitude    Float?  // Explicit fields
  longitude   Float?
  
  // Contact fields
  contactName  String?
  contactEmail String?
  contactPhone String
  isAnonymous  Boolean @default(false)
  
  // Assignment fields
  submittedById     String?
  assignedToId      String?
  resolvedById      String?
  wardOfficerId     String?
  maintenanceTeamId String?
  
  // Timestamps
  submittedOn DateTime  @default(now())
  assignedOn  DateTime?
  resolvedOn  DateTime?
  closedOn    DateTime?
  deadline    DateTime?
  
  // Additional fields
  remarks         String?
  citizenFeedback String?
  rating          Int?
  assignToTeam    Boolean @default(false)
  tags            String? // JSON array
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Swagger Schema Status:** ✅ COMPREHENSIVE
**Issues Found:**
- ✅ All fields documented
- ✅ Enums match
- ✅ Relationships documented
- ⚠️ Missing request schemas for different operations
- ⚠️ No validation schemas

**Missing Schemas:**
- `ComplaintCreateRequest`
- `ComplaintUpdateRequest`
- `ComplaintStatusUpdateRequest`
- `ComplaintAssignmentRequest`
- `ComplaintFeedbackRequest`
- `ComplaintSearchFilters`

### 5. ComplaintType Model

**Prisma Schema Fields:**
```prisma
model ComplaintType {
  id          Int         @id @default(autoincrement())
  name        String      @unique
  description String?
  priority    Priority    @default(MEDIUM)
  slaHours    Int         @default(48)
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

**Swagger Schema Status:** ✅ COMPLETE
**Issues Found:**
- ✅ All fields match
- ✅ Proper integer ID type
- ✅ Enums match

**Missing Schemas:**
- `ComplaintTypeCreateRequest`
- `ComplaintTypeUpdateRequest`

### 6. StatusLog Model

**Prisma Schema Fields:**
```prisma
model StatusLog {
  id          String   @id @default(cuid())
  complaintId String
  userId      String
  fromStatus  String?
  toStatus    String
  comment     String?
  timestamp   DateTime @default(now())
}
```

**Swagger Schema Status:** ✅ COMPLETE
**Issues Found:**
- ✅ All fields match
- ✅ Relationships documented

### 7. Attachment Model

**Prisma Schema Fields:**
```prisma
model Attachment {
  id           String               @id @default(cuid())
  entityType   AttachmentEntityType @default(COMPLAINT)
  entityId     String
  complaintId  String? // Backward compatibility
  fileName     String
  originalName String
  mimeType     String
  size         Int
  url          String
  description  String?
  createdAt    DateTime             @default(now())
  uploadedById String?
}
```

**Swagger Schema Status:** ✅ COMPLETE
**Issues Found:**
- ✅ All fields match
- ✅ Enum documented
- ✅ Relationships documented

**Missing Schemas:**
- `AttachmentUploadRequest`
- `AttachmentUploadResponse`

### 8. OTPSession Model

**Prisma Schema Fields:**
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
}
```

**Swagger Schema Status:** ✅ COMPLETE
**Issues Found:**
- ✅ All fields match
- ✅ Relationships documented

**Missing Schemas:**
- `OTPRequestSchema`
- `OTPVerificationSchema`

### 9. Notification Model

**Prisma Schema Fields:**
```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String
  complaintId String?
  type        String   @default("IN_APP")
  title       String
  message     String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Swagger Schema Status:** ✅ COMPLETE
**Issues Found:**
- ✅ All fields match
- ✅ Enum documented (IN_APP, EMAIL, SMS)
- ✅ Relationships documented

### 10. SystemConfig Model

**Prisma Schema Fields:**
```prisma
model SystemConfig {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  type        String?
  description String?
  isActive    Boolean  @default(true)
  updatedAt   DateTime @updatedAt
}
```

**Swagger Schema Status:** ✅ COMPLETE
**Issues Found:**
- ✅ All fields match
- ✅ Proper documentation

**Missing Schemas:**
- `SystemConfigUpdateRequest`
- `SystemConfigCreateRequest`

## Enum Verification

### UserRole Enum
**Prisma:** `CITIZEN | WARD_OFFICER | MAINTENANCE_TEAM | ADMINISTRATOR | GUEST`
**Swagger:** ✅ MATCHES

### ComplaintStatus Enum  
**Prisma:** `REGISTERED | ASSIGNED | IN_PROGRESS | RESOLVED | CLOSED | REOPENED`
**Swagger:** ✅ MATCHES

### Priority Enum
**Prisma:** `LOW | MEDIUM | HIGH | CRITICAL`
**Swagger:** ✅ MATCHES

### SLAStatus Enum
**Prisma:** `ON_TIME | WARNING | OVERDUE | COMPLETED`
**Swagger:** ✅ MATCHES

### AttachmentEntityType Enum
**Prisma:** `COMPLAINT | CITIZEN | USER | MAINTENANCE_PHOTO`
**Swagger:** ✅ MATCHES

## Missing Request/Response Schemas

### High Priority Missing Schemas:

1. **Authentication Schemas:**
   - `LoginRequest`
   - `LoginResponse`
   - `RegisterRequest`
   - `RegisterResponse`
   - `OTPVerificationRequest`
   - `PasswordChangeRequest`

2. **Complaint Operation Schemas:**
   - `ComplaintCreateRequest`
   - `ComplaintUpdateRequest`
   - `ComplaintListResponse` (with pagination)
   - `ComplaintSearchFilters`
   - `ComplaintStatusUpdateRequest`
   - `ComplaintAssignmentRequest`

3. **User Management Schemas:**
   - `UserCreateRequest`
   - `UserUpdateRequest`
   - `UserListResponse`
   - `UserPublicProfile`

4. **File Upload Schemas:**
   - `FileUploadRequest`
   - `FileUploadResponse`
   - `MultipartFormData` definitions

5. **Pagination and Filtering:**
   - `PaginatedResponse<T>` generic
   - `FilterParams` for each entity
   - `SortParams` definitions

## Geographic Data Inconsistency

**Critical Issue:** Ward and SubZone models show geographic fields in Swagger that don't exist in Prisma:
- `boundaries` (JSON polygon coordinates)
- `centerLat`, `centerLng` (center coordinates)  
- `boundingBox` (bounding rectangle)

**Investigation Required:**
1. Check actual database schema
2. Verify if these fields exist in production
3. Update either Prisma or Swagger to match reality
4. Consider migration if fields are needed

## Recommendations

### Immediate Actions:
1. **Verify Geographic Fields** - Resolve Ward/SubZone inconsistencies
2. **Create Request/Response Schemas** - Add missing operation schemas
3. **Add Validation Schemas** - Include field validation rules
4. **Document File Upload** - Proper multipart/form-data schemas

### Schema Organization:
1. **Modularize Schemas** - Split into logical files
2. **Create Schema Inheritance** - Base schemas with extensions
3. **Add Schema Validation** - Runtime validation matching docs
4. **Implement Schema Sync** - Automated Prisma-to-Swagger sync

### Quality Improvements:
1. **Add Realistic Examples** - All schemas need proper examples
2. **Document Business Rules** - Add validation constraints
3. **Create Test Schemas** - Schemas for testing scenarios
4. **Add Deprecation Markers** - Mark legacy fields appropriately