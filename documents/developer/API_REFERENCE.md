# API Reference

Comprehensive documentation for all REST API endpoints in the NLC-CMS system.

## Base URL

- **Development**: `http://localhost:4005/api`
- **Production**: `https://your-domain.com/api`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": boolean,
  "message": string,
  "data": object | array | null
}
```

### Success Response Example
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "id": "user123",
    "name": "John Doe"
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+91-9876543210",
  "password": "SecurePass123",
  "role": "CITIZEN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration initiated. Please check your email for verification code.",
  "data": {
    "requiresOtpVerification": true,
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "role": "CITIZEN"
  }
}
```

### Login with Password
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user123",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "role": "CITIZEN",
      "hasPassword": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login with OTP
```http
POST /api/auth/login-otp
```

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "data": {
    "email": "john.doe@example.com",
    "expiresAt": "2024-01-01T12:10:00.000Z"
  }
}
```

### Verify OTP
```http
POST /api/auth/verify-otp
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otpCode": "123456"
}
```

### Get Current User
```http
GET /api/auth/me
```
*Requires Authentication*

**Response:**
```json
{
  "success": true,
  "message": "User details retrieved successfully",
  "data": {
    "user": {
      "id": "user123",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+91-9876543210",
      "role": "CITIZEN",
      "wardId": "ward123",
      "language": "en",
      "hasPassword": true,
      "ward": {
        "id": "ward123",
        "name": "Ward 1",
        "description": "Central Ward"
      }
    }
  }
}
```

### Update Profile
```http
PUT /api/auth/profile
```
*Requires Authentication*

**Request Body:**
```json
{
  "fullName": "John Updated Doe",
  "phoneNumber": "+91-9876543211",
  "language": "hi"
}
```

### Change Password
```http
PUT /api/auth/change-password
```
*Requires Authentication*

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "NewSecurePassword123"
}
```

## Complaint Endpoints

### Get Complaints
```http
GET /api/complaints
```
*Requires Authentication*

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status
- `priority` (string): Filter by priority
- `wardId` (string): Filter by ward
- `search` (string): Search in title/description
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): asc/desc (default: desc)

**Response:**
```json
{
  "success": true,
  "message": "Complaints retrieved successfully",
  "data": {
    "complaints": [
      {
        "id": "complaint123",
        "complaintId": "NLC0001",
        "title": "Street Light Issue",
        "description": "Street light not working",
        "status": "REGISTERED",
        "priority": "MEDIUM",
        "submittedOn": "2024-01-01T10:00:00.000Z",
        "ward": {
          "id": "ward123",
          "name": "Ward 1"
        },
        "submittedBy": {
          "id": "user123",
          "fullName": "John Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Create Complaint
```http
POST /api/complaints
```
*Requires Authentication*

**Request Body:**
```json
{
  "title": "Street Light Issue",
  "description": "Street light not working on Main Street",
  "type": "INFRASTRUCTURE",
  "priority": "MEDIUM",
  "wardId": "ward123",
  "area": "Main Street",
  "landmark": "Near City Mall",
  "address": "123 Main Street",
  "coordinates": {
    "latitude": 9.9312,
    "longitude": 76.2673
  },
  "contactName": "John Doe",
  "contactEmail": "john.doe@example.com",
  "contactPhone": "+91-9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Complaint submitted successfully",
  "data": {
    "complaint": {
      "id": "complaint123",
      "complaintId": "NLC0001",
      "title": "Street Light Issue",
      "status": "REGISTERED",
      "submittedOn": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

### Get Single Complaint
```http
GET /api/complaints/:id
```
*Requires Authentication*

**Response:**
```json
{
  "success": true,
  "message": "Complaint details retrieved successfully",
  "data": {
    "complaint": {
      "id": "complaint123",
      "complaintId": "NLC0001",
      "title": "Street Light Issue",
      "description": "Street light not working on Main Street",
      "status": "REGISTERED",
      "priority": "MEDIUM",
      "submittedOn": "2024-01-01T10:00:00.000Z",
      "ward": {
        "id": "ward123",
        "name": "Ward 1"
      },
      "submittedBy": {
        "id": "user123",
        "fullName": "John Doe",
        "email": "john.doe@example.com"
      },
      "attachments": [
        {
          "id": "attachment123",
          "fileName": "street_light.jpg",
          "originalName": "street_light_issue.jpg",
          "url": "/uploads/complaints/street_light.jpg",
          "mimeType": "image/jpeg",
          "size": 1024000
        }
      ],
      "statusLogs": [
        {
          "id": "log123",
          "fromStatus": null,
          "toStatus": "REGISTERED",
          "comment": "Complaint submitted",
          "timestamp": "2024-01-01T10:00:00.000Z",
          "user": {
            "fullName": "John Doe"
          }
        }
      ]
    }
  }
}
```

### Update Complaint Status
```http
PUT /api/complaints/:id/status
```
*Requires Authentication (Ward Officer, Maintenance Team, Administrator)*

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "comment": "Work started on the issue",
  "priority": "HIGH"
}
```

### Assign Complaint
```http
PUT /api/complaints/:id/assign
```
*Requires Authentication (Ward Officer, Administrator)*

**Request Body:**
```json
{
  "assignedToId": "user456",
  "comment": "Assigned to maintenance team"
}
```

### Add Complaint Feedback
```http
POST /api/complaints/:id/feedback
```
*Requires Authentication (Citizen)*

**Request Body:**
```json
{
  "citizenFeedback": "Issue resolved satisfactorily",
  "rating": 5
}
```

## User Management Endpoints

### Get Users
```http
GET /api/users
```
*Requires Authentication (Administrator)*

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `role` (string): Filter by role
- `wardId` (string): Filter by ward
- `search` (string): Search in name/email

### Create User
```http
POST /api/users
```
*Requires Authentication (Administrator)*

**Request Body:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane.smith@example.com",
  "phoneNumber": "+91-9876543211",
  "role": "WARD_OFFICER",
  "wardId": "ward123",
  "department": "Public Works"
}
```

### Update User
```http
PUT /api/users/:id
```
*Requires Authentication (Administrator)*

### Deactivate User
```http
DELETE /api/users/:id
```
*Requires Authentication (Administrator)*

## Ward Management Endpoints

### Get Wards
```http
GET /api/wards
```
*Requires Authentication*

**Response:**
```json
{
  "success": true,
  "message": "Wards retrieved successfully",
  "data": {
    "wards": [
      {
        "id": "ward123",
        "name": "Ward 1",
        "description": "Central Ward",
        "isActive": true,
        "subZones": [
          {
            "id": "subzone123",
            "name": "Zone A",
            "description": "Commercial area"
          }
        ]
      }
    ]
  }
}
```

### Create Ward
```http
POST /api/wards
```
*Requires Authentication (Administrator)*

**Request Body:**
```json
{
  "name": "Ward 5",
  "description": "New residential ward",
  "subZones": [
    {
      "name": "Zone A",
      "description": "Residential area"
    }
  ]
}
```

## Guest Endpoints

### Submit Guest Complaint
```http
POST /api/guest/complaint
```
*No Authentication Required*

**Request Body:**
```json
{
  "fullName": "Anonymous User",
  "email": "anonymous@example.com",
  "phoneNumber": "+91-9876543210",
  "type": "INFRASTRUCTURE",
  "description": "Pothole on Main Road",
  "priority": "MEDIUM",
  "wardId": "ward123",
  "area": "Main Road",
  "landmark": "Near Bus Stop",
  "coordinates": {
    "latitude": 9.9312,
    "longitude": 76.2673
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Complaint submitted successfully. Please check your email for verification.",
  "data": {
    "complaintId": "NLC0002",
    "trackingNumber": "TRACK123456",
    "requiresOtpVerification": true
  }
}
```

### Track Guest Complaint
```http
GET /api/guest/track/:trackingNumber
```
*No Authentication Required*

**Response:**
```json
{
  "success": true,
  "message": "Complaint details retrieved successfully",
  "data": {
    "complaint": {
      "complaintId": "NLC0002",
      "title": "Road Issue",
      "status": "REGISTERED",
      "submittedOn": "2024-01-01T10:00:00.000Z",
      "statusLogs": [
        {
          "status": "REGISTERED",
          "timestamp": "2024-01-01T10:00:00.000Z",
          "comment": "Complaint registered"
        }
      ]
    }
  }
}
```

## File Upload Endpoints

### Upload File
```http
POST /api/uploads
```
*Requires Authentication*

**Request Body:** (multipart/form-data)
- `file`: File to upload
- `entityType`: COMPLAINT | USER | SYSTEM
- `entityId`: ID of the related entity
- `description`: Optional file description

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "attachment": {
      "id": "attachment123",
      "fileName": "document.pdf",
      "originalName": "my_document.pdf",
      "url": "/uploads/complaints/document.pdf",
      "mimeType": "application/pdf",
      "size": 2048000
    }
  }
}
```

### Get File
```http
GET /uploads/:filename
```
*No Authentication Required for public files*

## System Configuration Endpoints

### Get System Config
```http
GET /api/system-config
```
*Requires Authentication*

**Response:**
```json
{
  "success": true,
  "message": "System configuration retrieved successfully",
  "data": {
    "config": {
      "app_name": "NLC-CMS",
      "app_version": "1.0.0",
      "contact_email": "support@nlc-cms.gov.in",
      "contact_phone": "+91-1234567890",
      "max_file_size": "10mb",
      "supported_languages": ["en", "hi", "ml"]
    }
  }
}
```

### Update System Config
```http
PUT /api/system-config
```
*Requires Authentication (Administrator)*

**Request Body:**
```json
{
  "contact_email": "newsupport@nlc-cms.gov.in",
  "contact_phone": "+91-9876543210"
}
```

## Analytics & Reports Endpoints

### Get Dashboard Stats
```http
GET /api/reports/dashboard-stats
```
*Requires Authentication*

**Response:**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "stats": {
      "totalComplaints": 150,
      "activeComplaints": 45,
      "resolvedComplaints": 95,
      "overdueComplaints": 10,
      "averageResolutionTime": 3.5,
      "complaintsByStatus": {
        "REGISTERED": 20,
        "ASSIGNED": 15,
        "IN_PROGRESS": 10,
        "RESOLVED": 95,
        "CLOSED": 85
      },
      "complaintsByPriority": {
        "LOW": 50,
        "MEDIUM": 70,
        "HIGH": 25,
        "CRITICAL": 5
      }
    }
  }
}
```

### Generate Report
```http
POST /api/reports/generate
```
*Requires Authentication*

**Request Body:**
```json
{
  "reportType": "COMPLAINT_SUMMARY",
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "filters": {
    "wardId": "ward123",
    "status": "RESOLVED"
  },
  "format": "PDF"
}
```

## Health Check Endpoints

### Basic Health Check
```http
GET /api/health
```
*No Authentication Required*

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T10:00:00.000Z",
    "uptime": 3600,
    "version": "1.0.0",
    "environment": "production"
  }
}
```

### Detailed Health Check
```http
GET /api/health/detailed
```
*No Authentication Required*

**Response:**
```json
{
  "success": true,
  "message": "All systems operational",
  "data": {
    "database": {
      "healthy": true,
      "message": "Database connection successful"
    },
    "server": {
      "healthy": true,
      "message": "Server is running"
    },
    "environment": "production"
  }
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation Error |
| 401 | Unauthorized - Authentication Required |
| 403 | Forbidden - Insufficient Permissions |
| 404 | Not Found |
| 409 | Conflict - Resource Already Exists |
| 429 | Too Many Requests - Rate Limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Development**: 2000 requests per 15 minutes
- **Production**: 100 requests per 15 minutes
- **Authentication endpoints**: More lenient limits
- **Admin endpoints**: Higher limits for authenticated users

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes pagination metadata:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering and Sorting

Most list endpoints support filtering and sorting:

**Query Parameters:**
- `search`: Text search in relevant fields
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc`
- Entity-specific filters (status, priority, etc.)

## Example cURL Commands

### Login
```bash
curl -X POST http://localhost:4005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

### Get Complaints
```bash
curl -X GET "http://localhost:4005/api/complaints?page=1&limit=10&status=REGISTERED" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Complaint
```bash
curl -X POST http://localhost:4005/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Street Light Issue",
    "description": "Street light not working",
    "type": "INFRASTRUCTURE",
    "wardId": "ward123",
    "area": "Main Street"
  }'
```

### Upload File
```bash
curl -X POST http://localhost:4005/api/uploads \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/file.jpg" \
  -F "entityType=COMPLAINT" \
  -F "entityId=complaint123"
```

---

**Next**: [Schema Reference](SCHEMA_REFERENCE.md) | **Previous**: [Developer Guide](DEVELOPER_GUIDE.md) | **Up**: [Documentation Home](../README.md)