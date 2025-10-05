# NLC-CMS System Architecture

## Overview
The NLC-CMS (Complaint Management System) is a modern, full-stack web application designed for municipal complaint management. This document provides a comprehensive overview of the system architecture, design patterns, and technical implementation.

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Technology Stack](#technology-stack)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Design](#database-design)
6. [Security Architecture](#security-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Data Flow](#data-flow)
9. [Integration Points](#integration-points)
10. [Scalability Considerations](#scalability-considerations)

## High-Level Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SYSTEMS                        │
├─────────────────────────────────────────────────────────────┤
│  • SMTP Email Service (Notifications)                      │
│  • File Storage (Local/Cloud)                             │
│  • SSL Certificate Authority                              │
│  • DNS Services                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NLC-CMS SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   FRONTEND      │  │    BACKEND      │  │   DATABASE   │ │
│  │   (React SPA)   │◄─┤   (Express.js)  │◄─┤  (PostgreSQL)│ │
│  │                 │  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      USER TYPES                            │
├─────────────────────────────────────────────────────────────┤
│  • Guest Users (Anonymous)                                 │
│  • Citizens (Registered)                                   │
│  • Ward Officers                                           │
│  • Maintenance Teams                                       │
│  • System Administrators                                   │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles
- **Separation of Concerns**: Clear division between presentation, business logic, and data layers
- **Scalability**: Designed for horizontal and vertical scaling
- **Security**: Defense in depth with multiple security layers
- **Maintainability**: Modular design with clear interfaces
- **Performance**: Optimized for fast response times and efficient resource usage
- **Reliability**: Fault-tolerant design with comprehensive error handling

## Technology Stack

### Frontend Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYERS                         │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer                                        │
│  ├── React 18.3.1 (Component Framework)                   │
│  ├── TypeScript 5.5.3 (Type Safety)                       │
│  ├── TailwindCSS 3.4.11 (Styling)                         │
│  └── Radix UI (Accessible Components)                      │
├─────────────────────────────────────────────────────────────┤
│  State Management Layer                                    │
│  ├── Redux Toolkit 2.8.2 (Global State)                   │
│  ├── RTK Query (Data Fetching)                            │
│  └── React Hook Form (Form State)                          │
├─────────────────────────────────────────────────────────────┤
│  Routing & Navigation                                      │
│  ├── React Router 6.26.2 (Client-side Routing)            │
│  └── Role-based Route Protection                           │
├─────────────────────────────────────────────────────────────┤
│  Build & Development                                       │
│  ├── Vite 6.2.2 (Build Tool)                              │
│  ├── Hot Module Replacement                                │
│  └── Code Splitting                                        │
└─────────────────────────────────────────────────────────────┘
```

### Backend Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│  API Layer                                                 │
│  ├── Express.js 4.18.2 (Web Framework)                     │
│  ├── RESTful API Design                                    │
│  ├── Swagger/OpenAPI 3.0 (Documentation)                  │
│  └── CORS & Security Headers                               │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                      │
│  ├── Controllers (Request Handling)                        │
│  ├── Services (Business Logic)                             │
│  ├── Middleware (Cross-cutting Concerns)                   │
│  └── Validation (Input Sanitization)                       │
├─────────────────────────────────────────────────────────────┤
│  Data Access Layer                                         │
│  ├── Prisma ORM 5.7.1 (Database Abstraction)              │
│  ├── Connection Pooling                                    │
│  ├── Query Optimization                                    │
│  └── Migration Management                                  │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                      │
│  ├── Winston Logging                                       │
│  ├── JWT Authentication                                    │
│  ├── File Upload (Multer)                                  │
│  └── Email Service (Nodemailer)                            │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Hierarchy
```
App (Root Component)
├── ErrorBoundary (Global Error Handling)
├── AppInitializer (App Initialization)
├── SystemConfigProvider (System Configuration)
├── OtpProvider (OTP Flow Management)
└── Router (Route Management)
    ├── Layout (Main Application Layout)
    │   ├── Navigation (Role-based Navigation)
    │   ├── Sidebar (Contextual Navigation)
    │   └── Footer (Application Footer)
    ├── Public Routes
    │   ├── Index (Home/Guest Form)
    │   ├── Login (Authentication)
    │   ├── Register (User Registration)
    │   └── GuestTrackComplaint (Anonymous Tracking)
    ├── Protected Routes (Role-based)
    │   ├── Dashboard (Role-specific Dashboards)
    │   ├── ComplaintsList (Complaint Management)
    │   ├── ComplaintDetails (Detailed View)
    │   ├── Profile (User Profile Management)
    │   └── Admin Routes (Administrative Functions)
    ├── UI Components (Reusable Components)
    │   ├── Forms (Form Components)
    │   ├── Tables (Data Display)
    │   ├── Modals (Dialog Components)
    │   └── Charts (Data Visualization)
    └── Global Components
        ├── Toaster (Notifications)
        ├── LoadingSpinner (Loading States)
        └── ErrorFallback (Error Display)
```

### State Management Architecture
```
Redux Store
├── Auth Slice (Authentication State)
│   ├── User Information
│   ├── Authentication Status
│   ├── Permissions
│   └── Session Management
├── Complaints Slice (Complaint Management)
│   ├── Complaint List
│   ├── Current Complaint
│   ├── Filters & Pagination
│   └── Statistics
├── Guest Slice (Anonymous User State)
│   ├── Guest Complaint Data
│   ├── OTP Session
│   └── Tracking Information
├── UI Slice (User Interface State)
│   ├── Notifications
│   ├── Modal States
│   ├── Loading States
│   └── Theme Settings
├── Language Slice (Internationalization)
│   ├── Current Language
│   ├── Translations
│   └── Language Preferences
└── RTK Query APIs
    ├── Auth API
    ├── Complaints API
    ├── Users API
    ├── Admin API
    └── System Config API
```

### Data Flow Pattern
```
User Interaction → Component → Action Creator → RTK Query/Thunk
                                                      ↓
Store Update ← Reducer ← API Response ← Backend API ←┘
     ↓
Component Re-render ← Selector ← Store State
```

## Backend Architecture

### Layered Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  • Express Routes (API Endpoints)                          │
│  • Request/Response Handling                               │
│  • Input Validation                                        │
│  • Error Handling                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                    │
├─────────────────────────────────────────────────────────────┤
│  • Controllers (Request Processing)                        │
│  • Services (Business Rules)                               │
│  • Middleware (Cross-cutting Concerns)                     │
│  • Authentication & Authorization                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  • Prisma ORM (Database Abstraction)                       │
│  • Repository Pattern                                      │
│  • Query Optimization                                      │
│  • Transaction Management                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                    │
├─────────────────────────────────────────────────────────────┤
│  • Database (PostgreSQL/SQLite)                            │
│  • File System (Upload Storage)                            │
│  • Email Service (SMTP)                                    │
│  • Logging System (Winston)                                │
└─────────────────────────────────────────────────────────────┘
```

### API Design Patterns

#### RESTful Endpoints
```
Authentication:
POST   /api/auth/login              # User authentication
POST   /api/auth/register           # User registration
GET    /api/auth/me                 # Current user info
POST   /api/auth/logout             # User logout

Complaints:
GET    /api/complaints              # List complaints
POST   /api/complaints              # Create complaint
GET    /api/complaints/:id          # Get complaint details
PUT    /api/complaints/:id          # Update complaint
DELETE /api/complaints/:id          # Delete complaint (admin)

Guest Operations:
POST   /api/guest/send-otp          # Send OTP for guest
POST   /api/guest/verify-otp        # Verify OTP
POST   /api/guest/track-complaint   # Track complaint

Administration:
GET    /api/admin/users             # User management
GET    /api/admin/dashboard         # Admin dashboard
GET    /api/admin/reports           # System reports
```

#### Response Format Standardization
```json
{
  "success": boolean,
  "message": "Human-readable message",
  "data": object | array | null,
  "errors": array | null,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "pages": number
  }
}
```

## Database Design

### Entity Relationship Model
```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Ward     │       │    User     │       │  SubZone    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄─────┤│ wardId (FK) │       │ id (PK)     │
│ name        │       │ id (PK)     │       │ wardId (FK) │◄─┐
│ description │       │ email       │       │ name        │  │
│ isActive    │       │ fullName    │       │ description │  │
└─────────────┘       │ role        │       └─────────────┘  │
                      │ isActive    │                        │
                      └─────────────┘                        │
                              │                              │
                              │submittedBy                   │
                              ▼                              │
                      ┌─────────────┐       ┌─────────────┐  │
                      │ Complaint   │       │ StatusLog   │  │
                      ├─────────────┤       ├─────────────┤  │
                      │ id (PK)     │◄──────┤ complaintId │  │
                      │ title       │       │ userId (FK) │◄─┘
                      │ description │       │ fromStatus  │
                      │ type        │       │ toStatus    │
                      │ status      │       │ timestamp   │
                      │ priority    │       └─────────────┘
                      │ wardId (FK) │
                      │ subZoneId   │◄──────────────────────┘
                      │ coordinates │
                      └─────────────┘
                              │
                              │
                              ▼
                      ┌─────────────┐
                      │ Attachment  │
                      ├─────────────┤
                      │ id (PK)     │
                      │ complaintId │
                      │ fileName    │
                      │ mimeType    │
                      │ size        │
                      └─────────────┘
```

### Database Schema Highlights

#### Core Entities
- **Users**: Multi-role user management with RBAC
- **Complaints**: Central complaint entity with full lifecycle tracking
- **Wards**: Geographic organization structure
- **Attachments**: File management with metadata
- **StatusLogs**: Complete audit trail of complaint changes

#### Data Integrity Features
- **Foreign Key Constraints**: Maintain referential integrity
- **Indexes**: Optimized for common query patterns
- **Enums**: Type-safe status and role definitions
- **Validation**: Database-level constraints and application validation

## Security Architecture

### Multi-Layer Security Model
```
┌─────────────────────────────────────────────────────────────┐
│                    NETWORK SECURITY                        │
├─────────────────────────────────────────────────────────────┤
│  • HTTPS/TLS Encryption                                    │
│  • Firewall Configuration                                  │
│  • DDoS Protection                                         │
│  • Rate Limiting                                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION SECURITY                      │
├─────────────────────────────────────────────────────────────┤
│  • JWT Authentication                                      │
│  • Role-Based Access Control (RBAC)                        │
│  • Input Validation & Sanitization                         │
│  • CORS Configuration                                      │
│  • Security Headers (Helmet.js)                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA SECURITY                           │
├─────────────────────────────────────────────────────────────┤
│  • Password Hashing (bcrypt)                               │
│  • SQL Injection Prevention (Prisma ORM)                   │
│  • File Upload Validation                                  │
│  • Sensitive Data Encryption                               │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow
```
1. User Credentials → Frontend
2. Frontend → POST /api/auth/login → Backend
3. Backend → Validate Credentials → Database
4. Database → User Data → Backend
5. Backend → Generate JWT → Frontend
6. Frontend → Store Token → LocalStorage
7. Subsequent Requests → Include Bearer Token
8. Backend → Verify Token → Protected Resource
```

### Authorization Matrix
```
Resource/Action    | Guest | Citizen | Ward Officer | Maintenance | Admin
-------------------|-------|---------|--------------|-------------|-------
Submit Complaint   |   ✓   |    ✓    |      ✓       |      ✓      |   ✓
View Own Complaints|   ✗   |    ✓    |      ✓       |      ✓      |   ✓
View All Complaints|   ✗   |    ✗    |      ✓       |      ✓      |   ✓
Assign Complaints  |   ✗   |    ✗    |      ✓       |      ✗      |   ✓
Update Status      |   ✗   |    ✗    |      ✓       |      ✓      |   ✓
User Management    |   ✗   |    ✗    |      ✗       |      ✗      |   ✓
System Config      |   ✗   |    ✗    |      ✗       |      ✗      |   ✓
```

## Deployment Architecture

### Production Environment
```
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                           │
│                   (Nginx/CloudFlare)                       │
│                      Port 80/443                           │
├─────────────────────────────────────────────────────────────┤
│            │                           │                   │
│    ┌───────▼────────┐         ┌────────▼─────────┐        │
│    │  Static Files  │         │    API Server    │        │
│    │     (SPA)      │         │                  │        │
│    │   Nginx        │         │    ┌─────────┐   │        │
│    │   Cached       │         │    │   PM2   │   │        │
│    └────────────────┘         │    │ Cluster │   │        │
│                               │    │ :4005   │   │        │
│                               │    └─────────┘   │        │
│                               └──────────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                    DATABASE LAYER                          │
│                   PostgreSQL Cluster                       │
│                      Port 5432                             │
│                   (Master/Replica)                         │
└─────────────────────────────────────────────────────────────┘
```

### Container Architecture (Docker)
```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Nginx    │  │   App       │  │ PostgreSQL  │        │
│  │  (Reverse   │  │ (Node.js)   │  │ (Database)  │        │
│  │   Proxy)    │  │             │  │             │        │
│  │   :80/443   │  │    :4005    │  │    :5432    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                │               │
│         └────────────────┼────────────────┘               │
│                          │                                │
│  ┌─────────────┐  ┌─────────────┐                        │
│  │   Volumes   │  │  Networks   │                        │
│  │ (Persistent │  │ (Internal   │                        │
│  │   Storage)  │  │ Communication)                       │
│  └─────────────┘  └─────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Complaint Submission Flow
```
1. User Input → Frontend Form Validation
2. Form Data → Redux State Management
3. Submit Action → RTK Query API Call
4. API Request → Backend Route Handler
5. Route Handler → Controller Function
6. Controller → Business Logic Validation
7. Validation → Database Transaction (Prisma)
8. Database → Response Data
9. Response → Frontend State Update
10. State Update → UI Re-render
11. Success → Notification Display
```

### Authentication Flow
```
1. Login Form → Credentials Validation
2. Submit → API Call (/api/auth/login)
3. Backend → Credential Verification
4. Database → User Lookup
5. Password Check → bcrypt Comparison
6. Success → JWT Token Generation
7. Token → Frontend Storage (localStorage)
8. Subsequent Requests → Authorization Header
9. Backend → Token Verification
10. Valid Token → Protected Resource Access
```

## Integration Points

### External Service Integrations
```
┌─────────────────────────────────────────────────────────────┐
│                  EMAIL SERVICES                            │
├─────────────────────────────────────────────────────────────┤
│  • SMTP Integration (Nodemailer)                           │
│  • OTP Email Delivery                                      │
│  • Notification Emails                                     │
│  • Template-based Emails                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  FILE STORAGE                              │
├─────────────────────────────────────────────────────────────┤
│  • Local File System (Development)                         │
│  • Cloud Storage Ready (AWS S3, CloudFlare R2)             │
│  • File Type Validation                                    │
│  • Size Restrictions                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  MAPPING SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│  • Leaflet Maps Integration                                │
│  • Geographic Coordinate Storage                           │
│  • Ward Boundary Management                                │
│  • Location-based Complaint Routing                        │
└─────────────────────────────────────────────────────────────┘
```

### API Integration Patterns
- **RESTful APIs**: Standard HTTP methods and status codes
- **JSON Communication**: Structured data exchange
- **Error Handling**: Consistent error response format
- **Rate Limiting**: Protection against abuse
- **Versioning**: API version management strategy

## Scalability Considerations

### Horizontal Scaling
```
┌─────────────────────────────────────────────────────────────┐
│                  LOAD BALANCER                             │
│                 (Nginx/HAProxy)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼───┐ ┌───▼───┐ ┌───▼───┐
            │  App      │ │  App  │ │  App  │
            │ Instance  │ │ Inst. │ │ Inst. │
            │    #1     │ │   #2  │ │   #3  │
            └───────────┘ └───────┘ └───────┘
                    │         │         │
                    └─────────┼─────────┘
                              │
            ┌─────────────────▼─────────────────┐
            │         DATABASE CLUSTER         │
            │      (Master/Replica Setup)      │
            └───────────────────────────────────┘
```

### Performance Optimization Strategies
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis integration ready
- **CDN Integration**: Static asset delivery
- **Code Splitting**: Reduced initial bundle size
- **Lazy Loading**: On-demand resource loading

### Monitoring & Observability
```
┌─────────────────────────────────────────────────────────────┐
│                  MONITORING STACK                          │
├─────────────────────────────────────────────────────────────┤
│  Application Monitoring                                    │
│  ├── Health Check Endpoints                                │
│  ├── Performance Metrics                                   │
│  ├── Error Tracking                                        │
│  └── User Activity Monitoring                              │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Monitoring                                 │
│  ├── Server Resource Usage                                 │
│  ├── Database Performance                                  │
│  ├── Network Latency                                       │
│  └── Storage Utilization                                   │
├─────────────────────────────────────────────────────────────┤
│  Logging & Alerting                                        │
│  ├── Centralized Logging (Winston)                         │
│  ├── Log Aggregation                                       │
│  ├── Alert Configuration                                   │
│  └── Incident Response                                     │
└─────────────────────────────────────────────────────────────┘
```

## Conclusion

The NLC-CMS architecture is designed with modern best practices, emphasizing:

- **Scalability**: Ready for growth and increased load
- **Security**: Multiple layers of protection
- **Maintainability**: Clean, modular design
- **Performance**: Optimized for speed and efficiency
- **Reliability**: Fault-tolerant and robust
- **Extensibility**: Easy to add new features and integrations

This architecture provides a solid foundation for a production-ready complaint management system that can serve municipal needs effectively while maintaining high standards of security, performance, and user experience.

---

**Architecture Document Version**: 1.0.0  
**Last Updated**: December 10, 2024  
**System Version**: NLC-CMS v1.0.0