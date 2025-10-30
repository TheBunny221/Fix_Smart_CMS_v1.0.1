import swaggerJsdoc from "swagger-jsdoc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Comprehensive Swagger Configuration for Fix_Smart_CMS API
 * Version:  1.0.0
 */

const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Fix_Smart_CMS API",
      version: " 1.0.0",
      description: `
        Comprehensive API documentation for Fix_Smart_CMS (NLC-CMS) - A modern complaint management system.
        
        ## Features
        - **Multi-role Authentication**: Citizens, Ward Officers, Maintenance Teams, Administrators
        - **Complaint Management**: Complete lifecycle from registration to resolution
        - **Geographic Routing**: Ward-based automatic complaint assignment
        - **File Management**: Unified attachment system for all file types
        - **Real-time Notifications**: Email and in-app notification system
        - **Analytics & Reporting**: Comprehensive dashboard and reporting capabilities
        
        ## Authentication
        Most endpoints require JWT authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
        
        ## Rate Limiting
        API requests are rate-limited to prevent abuse. Development environment has higher limits.
        
        ## Response Format
        All API responses follow a consistent format:
        \`\`\`json
        {
          "success": boolean,
          "message": "string",
          "data": object | array | null,
          "errors": array (optional)
        }
        \`\`\`
      `,
      contact: {
        name: "API Support",
        email: "api-support@nlc-cms.gov.in",
        url: "https://github.com/nlc-cms/support"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      },
      termsOfService: "https://nlc-cms.gov.in/terms"
    },
    servers: [
      {
        url: process.env.NODE_ENV === "production" 
          ? "https://api.nlc-cms.gov.in" 
          : `http://localhost:${process.env.PORT || 4005}`,
        description: process.env.NODE_ENV === "production" 
          ? "Production server" 
          : "Development server",
      },
      {
        url: "https://staging-api.nlc-cms.gov.in",
        description: "Staging server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from login endpoint"
        }
      },
      schemas: {
        // Common response schemas
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true
            },
            message: {
              type: "string",
              example: "Operation completed successfully"
            },
            data: {
              type: "object",
              description: "Response data (varies by endpoint)"
            }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false
            },
            message: {
              type: "string",
              example: "An error occurred"
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string"
                  },
                  message: {
                    type: "string"
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false
            },
            message: {
              type: "string",
              example: "Validation failed"
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    example: "email"
                  },
                  message: {
                    type: "string",
                    example: "Invalid email format"
                  }
                }
              }
            }
          }
        },
        PaginationMeta: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1
            },
            limit: {
              type: "integer",
              example: 10
            },
            total: {
              type: "integer",
              example: 100
            },
            pages: {
              type: "integer",
              example: 10
            },
            hasNext: {
              type: "boolean",
              example: true
            },
            hasPrev: {
              type: "boolean",
              example: false
            }
          }
        },
        
        // User-related schemas
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique user identifier",
              example: "clp123abc456def789"
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "john.doe@example.com"
            },
            fullName: {
              type: "string",
              description: "User's full name",
              example: "John Doe"
            },
            phoneNumber: {
              type: "string",
              description: "User's phone number",
              example: "+91-9876543210"
            },
            role: {
              type: "string",
              enum: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR", "GUEST"],
              description: "User role in the system",
              example: "CITIZEN"
            },
            wardId: {
              type: "string",
              description: "Associated ward ID (for officers)",
              example: "ward123"
            },
            ward: {
              $ref: "#/components/schemas/Ward"
            },
            department: {
              type: "string",
              description: "Department (for staff users)",
              example: "Public Works"
            },
            language: {
              type: "string",
              enum: ["en", "hi", "ml"],
              description: "Preferred language",
              example: "en"
            },
            avatar: {
              type: "string",
              description: "Avatar image URL",
              example: "/uploads/avatars/user123.jpg"
            },
            isActive: {
              type: "boolean",
              description: "Account status",
              example: true
            },
            lastLogin: {
              type: "string",
              format: "date-time",
              description: "Last login timestamp",
              example: "2024-12-01T10:30:00Z"
            },
            joinedOn: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
              example: "2024-01-15T08:00:00Z"
            },
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        
        // Ward and geographic schemas
        Ward: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "ward123"
            },
            name: {
              type: "string",
              example: "Ward 1 - Central"
            },
            description: {
              type: "string",
              example: "Central business district ward"
            },
            isActive: {
              type: "boolean",
              example: true
            },
            boundaries: {
              type: "string",
              description: "JSON string of polygon coordinates"
            },
            centerLat: {
              type: "number",
              example: 9.9312
            },
            centerLng: {
              type: "number",
              example: 76.2673
            },
            boundingBox: {
              type: "string",
              description: "JSON string of bounding box coordinates"
            },
            subZones: {
              type: "array",
              items: {
                $ref: "#/components/schemas/SubZone"
              }
            },
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        SubZone: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "subzone123"
            },
            name: {
              type: "string",
              example: "Central Market Area"
            },
            wardId: {
              type: "string",
              example: "ward123"
            },
            description: {
              type: "string",
              example: "Main market and shopping area"
            },
            isActive: {
              type: "boolean",
              example: true
            },
            boundaries: {
              type: "string",
              description: "JSON string of polygon coordinates"
            },
            centerLat: {
              type: "number",
              example: 9.9315
            },
            centerLng: {
              type: "number",
              example: 76.2675
            },
            boundingBox: {
              type: "string",
              description: "JSON string of bounding box coordinates"
            },
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        
        // Complaint-related schemas
        Complaint: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique complaint identifier",
              example: "complaint123"
            },
            complaintId: {
              type: "string",
              description: "Human-readable complaint ID",
              example: "KSC0001"
            },
            title: {
              type: "string",
              description: "Complaint title",
              example: "Street light not working"
            },
            description: {
              type: "string",
              description: "Detailed complaint description",
              example: "The street light on MG Road has been non-functional for 3 days"
            },
            type: {
              type: "string",
              description: "Complaint type",
              example: "STREET_LIGHTING"
            },
            status: {
              type: "string",
              enum: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"],
              description: "Current complaint status",
              example: "REGISTERED"
            },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
              description: "Complaint priority level",
              example: "MEDIUM"
            },
            slaStatus: {
              type: "string",
              enum: ["ON_TIME", "WARNING", "OVERDUE", "COMPLETED"],
              description: "SLA compliance status",
              example: "ON_TIME"
            },
            
            // Location information
            wardId: {
              type: "string",
              example: "ward123"
            },
            ward: {
              $ref: "#/components/schemas/Ward"
            },
            subZoneId: {
              type: "string",
              example: "subzone123"
            },
            subZone: {
              $ref: "#/components/schemas/SubZone"
            },
            area: {
              type: "string",
              description: "Area name",
              example: "MG Road"
            },
            landmark: {
              type: "string",
              description: "Nearby landmark",
              example: "Near City Mall"
            },
            address: {
              type: "string",
              description: "Full address",
              example: "MG Road, Near City Mall, Kochi"
            },
            coordinates: {
              type: "string",
              description: "JSON string of lat/lng coordinates",
              example: '{"lat": 9.9312, "lng": 76.2673}'
            },
            latitude: {
              type: "number",
              example: 9.9312
            },
            longitude: {
              type: "number",
              example: 76.2673
            },
            
            // Contact information
            contactName: {
              type: "string",
              example: "John Doe"
            },
            contactEmail: {
              type: "string",
              format: "email",
              example: "john.doe@example.com"
            },
            contactPhone: {
              type: "string",
              example: "+91-9876543210"
            },
            isAnonymous: {
              type: "boolean",
              example: false
            },
            
            // Assignment and tracking
            submittedById: {
              type: "string",
              example: "user123"
            },
            submittedBy: {
              $ref: "#/components/schemas/User"
            },
            assignedToId: {
              type: "string",
              example: "user456"
            },
            assignedTo: {
              $ref: "#/components/schemas/User"
            },
            wardOfficerId: {
              type: "string",
              example: "officer123"
            },
            wardOfficer: {
              $ref: "#/components/schemas/User"
            },
            maintenanceTeamId: {
              type: "string",
              example: "team123"
            },
            maintenanceTeam: {
              $ref: "#/components/schemas/User"
            },
            resolvedById: {
              type: "string",
              example: "user789"
            },
            
            // Timestamps
            submittedOn: {
              type: "string",
              format: "date-time",
              example: "2024-12-01T10:00:00Z"
            },
            assignedOn: {
              type: "string",
              format: "date-time",
              example: "2024-12-01T11:00:00Z"
            },
            resolvedOn: {
              type: "string",
              format: "date-time",
              example: "2024-12-02T15:30:00Z"
            },
            closedOn: {
              type: "string",
              format: "date-time",
              example: "2024-12-02T16:00:00Z"
            },
            deadline: {
              type: "string",
              format: "date-time",
              example: "2024-12-03T10:00:00Z"
            },
            
            // Additional information
            remarks: {
              type: "string",
              description: "Internal remarks",
              example: "Requires immediate attention"
            },
            citizenFeedback: {
              type: "string",
              description: "Citizen feedback on resolution",
              example: "Issue resolved satisfactorily"
            },
            rating: {
              type: "integer",
              minimum: 1,
              maximum: 5,
              description: "Citizen rating (1-5)",
              example: 4
            },
            assignToTeam: {
              type: "boolean",
              description: "Team assignment flag",
              example: false
            },
            tags: {
              type: "string",
              description: "JSON array of tags",
              example: '["urgent", "infrastructure"]'
            },
            
            // Relations
            statusLogs: {
              type: "array",
              items: {
                $ref: "#/components/schemas/StatusLog"
              }
            },
            attachments: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Attachment"
              }
            },
            notifications: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Notification"
              }
            },
            
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        
        ComplaintType: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1
            },
            name: {
              type: "string",
              example: "STREET_LIGHTING"
            },
            description: {
              type: "string",
              example: "Issues related to street lighting"
            },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
              example: "MEDIUM"
            },
            slaHours: {
              type: "integer",
              description: "SLA hours for this complaint type",
              example: 48
            },
            isActive: {
              type: "boolean",
              example: true
            },
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        
        StatusLog: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "log123"
            },
            complaintId: {
              type: "string",
              example: "complaint123"
            },
            userId: {
              type: "string",
              example: "user123"
            },
            user: {
              $ref: "#/components/schemas/User"
            },
            fromStatus: {
              type: "string",
              description: "Previous status",
              example: "REGISTERED"
            },
            toStatus: {
              type: "string",
              description: "New status",
              example: "ASSIGNED"
            },
            comment: {
              type: "string",
              description: "Status change comment",
              example: "Assigned to maintenance team"
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2024-12-01T11:00:00Z"
            }
          }
        },
        
        Attachment: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "attachment123"
            },
            entityType: {
              type: "string",
              enum: ["COMPLAINT", "CITIZEN", "USER", "MAINTENANCE_PHOTO"],
              description: "Type of entity this attachment belongs to",
              example: "COMPLAINT"
            },
            entityId: {
              type: "string",
              description: "ID of the entity this attachment belongs to",
              example: "complaint123"
            },
            complaintId: {
              type: "string",
              description: "Complaint ID (for backward compatibility)",
              example: "complaint123"
            },
            fileName: {
              type: "string",
              description: "Stored file name",
              example: "1701234567890_image.jpg"
            },
            originalName: {
              type: "string",
              description: "Original file name",
              example: "street_light_issue.jpg"
            },
            mimeType: {
              type: "string",
              description: "File MIME type",
              example: "image/jpeg"
            },
            size: {
              type: "integer",
              description: "File size in bytes",
              example: 1024000
            },
            url: {
              type: "string",
              description: "File access URL",
              example: "/uploads/complaints/1701234567890_image.jpg"
            },
            description: {
              type: "string",
              description: "Optional file description",
              example: "Photo showing the broken street light"
            },
            uploadedById: {
              type: "string",
              example: "user123"
            },
            uploadedBy: {
              $ref: "#/components/schemas/User"
            },
            createdAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        
        Notification: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "notification123"
            },
            userId: {
              type: "string",
              example: "user123"
            },
            complaintId: {
              type: "string",
              example: "complaint123"
            },
            type: {
              type: "string",
              enum: ["IN_APP", "EMAIL", "SMS"],
              description: "Notification type",
              example: "IN_APP"
            },
            title: {
              type: "string",
              description: "Notification title",
              example: "Complaint Status Updated"
            },
            message: {
              type: "string",
              description: "Notification message",
              example: "Your complaint KSC0001 has been assigned to maintenance team"
            },
            isRead: {
              type: "boolean",
              description: "Read status",
              example: false
            },
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        
        OTPSession: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "otp123"
            },
            userId: {
              type: "string",
              example: "user123"
            },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@example.com"
            },
            phoneNumber: {
              type: "string",
              example: "+91-9876543210"
            },
            otpCode: {
              type: "string",
              description: "6-digit OTP code",
              example: "123456"
            },
            purpose: {
              type: "string",
              description: "Purpose of OTP",
              example: "GUEST_VERIFICATION"
            },
            isVerified: {
              type: "boolean",
              example: false
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              example: "2024-12-01T10:15:00Z"
            },
            createdAt: {
              type: "string",
              format: "date-time"
            },
            verifiedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        
        SystemConfig: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "config123"
            },
            key: {
              type: "string",
              description: "Configuration key",
              example: "COMPLAINT_ID_PREFIX"
            },
            value: {
              type: "string",
              description: "Configuration value",
              example: "KSC"
            },
            type: {
              type: "string",
              description: "Configuration type/category",
              example: "app"
            },
            description: {
              type: "string",
              description: "Configuration description",
              example: "Prefix for complaint IDs"
            },
            isActive: {
              type: "boolean",
              example: true
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            }
          }
        }
      },
      
      parameters: {
        PageParam: {
          name: "page",
          in: "query",
          description: "Page number for pagination",
          schema: {
            type: "integer",
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: "limit",
          in: "query",
          description: "Number of items per page",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10
          }
        },
        SortParam: {
          name: "sort",
          in: "query",
          description: "Sort field and direction (e.g., 'createdAt:desc')",
          schema: {
            type: "string",
            default: "createdAt:desc"
          }
        },
        SearchParam: {
          name: "search",
          in: "query",
          description: "Search query string",
          schema: {
            type: "string"
          }
        },
        StatusParam: {
          name: "status",
          in: "query",
          description: "Filter by status",
          schema: {
            type: "string",
            enum: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"]
          }
        },
        PriorityParam: {
          name: "priority",
          in: "query",
          description: "Filter by priority",
          schema: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
          }
        },
        WardParam: {
          name: "ward",
          in: "query",
          description: "Filter by ward ID",
          schema: {
            type: "string"
          }
        },
        DateFromParam: {
          name: "dateFrom",
          in: "query",
          description: "Filter from date (ISO format)",
          schema: {
            type: "string",
            format: "date-time"
          }
        },
        DateToParam: {
          name: "dateTo",
          in: "query",
          description: "Filter to date (ISO format)",
          schema: {
            type: "string",
            format: "date-time"
          }
        }
      },
      
      responses: {
        UnauthorizedError: {
          description: "Authentication required",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              },
              example: {
                success: false,
                message: "Authentication required. Please provide a valid token."
              }
            }
          }
        },
        ForbiddenError: {
          description: "Insufficient permissions",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              },
              example: {
                success: false,
                message: "You don't have permission to access this resource."
              }
            }
          }
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              },
              example: {
                success: false,
                message: "The requested resource was not found."
              }
            }
          }
        },
        ValidationError: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidationError"
              }
            }
          }
        },
        ServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              },
              example: {
                success: false,
                message: "An internal server error occurred. Please try again later."
              }
            }
          }
        }
      }
    },
    
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization endpoints"
      },
      {
        name: "Users",
        description: "User management operations"
      },
      {
        name: "Admin",
        description: "Administrative operations (Admin only)"
      },
      {
        name: "Complaints",
        description: "Complaint management operations"
      },
      {
        name: "Wards",
        description: "Ward and geographic boundary management"
      },
      {
        name: "Guest",
        description: "Guest user operations (anonymous complaints)"
      },
      {
        name: "Reports",
        description: "Reporting and analytics endpoints"
      },
      {
        name: "Uploads",
        description: "File upload and attachment management"
      },
      {
        name: "System Config",
        description: "System configuration management"
      },
      {
        name: "Notifications",
        description: "Notification management"
      },
      {
        name: "Maintenance",
        description: "Maintenance team operations and analytics"
      },
      {
        name: "Health",
        description: "System health and monitoring endpoints"
      }
    ],
    
    externalDocs: {
      description: "Find more info about Fix_Smart_CMS",
      url: "https://github.com/nlc-cms/documentation"
    }
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../controller/*.js"),
    path.join(__dirname, "../models/*.js")
  ]
};

const specs = swaggerJsdoc(swaggerOptions);

export { swaggerOptions, specs };
export default specs;