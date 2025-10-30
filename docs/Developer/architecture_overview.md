# Architecture Overview

This document provides a comprehensive system-wide architectural explanation and component relationships for the complaint management system.

## System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend]
        B[Mobile Web Interface]
    end
    
    subgraph "API Gateway"
        C[Express.js Server]
        D[Authentication Middleware]
        E[Rate Limiting]
    end
    
    subgraph "Business Logic"
        F[Complaint Service]
        G[User Management Service]
        H[Notification Service]
        I[File Upload Service]
    end
    
    subgraph "Data Layer"
        J[PostgreSQL Database]
        K[File Storage]
        L[Redis Cache]
    end
    
    subgraph "External Services"
        M[Email Service]
        N[SMS Service]
        O[Map Services]
    end
    
    A --> C
    B --> C
    C --> D
    C --> E
    C --> F
    C --> G
    C --> H
    C --> I
    F --> J
    G --> J
    H --> M
    H --> N
    I --> K
    F --> L
    G --> L
```

### Component Architecture

#### Frontend Architecture

```mermaid
graph TD
    subgraph "React Application"
        A[App.tsx - Root Component]
        B[Router Configuration]
        C[Redux Store]
        D[Authentication Context]
    end
    
    subgraph "Feature Modules"
        E[Admin Module]
        F[Ward Officer Module]
        G[Maintenance Module]
        H[Citizen Module]
    end
    
    subgraph "Shared Components"
        I[UI Components]
        J[Form Components]
        K[Layout Components]
        L[Utility Components]
    end
    
    subgraph "Services"
        M[API Client]
        N[Authentication Service]
        O[Notification Service]
        P[I18n Service]
    end
    
    A --> B
    A --> C
    A --> D
    B --> E
    B --> F
    B --> G
    B --> H
    E --> I
    F --> I
    G --> I
    H --> I
    E --> M
    F --> M
    G --> M
    H --> M
    M --> N
    M --> O
    I --> P
```

#### Backend Architecture

```mermaid
graph TD
    subgraph "Express Server"
        A[app.js - Application Entry]
        B[server.js - Server Configuration]
        C[Middleware Stack]
    end
    
    subgraph "API Routes"
        D[Auth Routes]
        E[Complaint Routes]
        F[User Routes]
        G[Admin Routes]
        H[File Routes]
    end
    
    subgraph "Controllers"
        I[Auth Controller]
        J[Complaint Controller]
        K[User Controller]
        L[Admin Controller]
        M[File Controller]
    end
    
    subgraph "Services"
        N[Database Service]
        O[Email Service]
        P[File Service]
        Q[Validation Service]
    end
    
    subgraph "Models"
        R[User Model]
        S[Complaint Model]
        T[System Config Model]
        U[Notification Model]
    end
    
    A --> B
    A --> C
    C --> D
    C --> E
    C --> F
    C --> G
    C --> H
    D --> I
    E --> J
    F --> K
    G --> L
    H --> M
    I --> N
    J --> N
    K --> N
    L --> N
    M --> P
    N --> R
    N --> S
    N --> T
    N --> U
```

## Core Components

### Frontend Components

#### Authentication System
- **Location**: `client/contexts/AuthContext.tsx`
- **Purpose**: Manages user authentication state and JWT tokens
- **Key Features**:
  - JWT token management
  - Role-based access control
  - Automatic token refresh
  - Logout handling

```typescript
interface AuthContext {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
}
```

#### State Management
- **Location**: `client/store/`
- **Technology**: Redux Toolkit
- **Structure**:
  - `authSlice.ts` - Authentication state
  - `complaintsSlice.ts` - Complaint management
  - `usersSlice.ts` - User management
  - `configSlice.ts` - System configuration

#### Routing System
- **Location**: `client/App.tsx`
- **Technology**: React Router v6
- **Features**:
  - Role-based route protection
  - Lazy loading for code splitting
  - Nested routing for complex layouts
  - Redirect handling for authentication

#### Internationalization
- **Location**: `client/hooks/useTranslation.ts`
- **Technology**: Custom i18n implementation
- **Features**:
  - Dynamic language switching
  - Namespace-based translations
  - Fallback language support
  - Context-aware translations

### Backend Components

#### API Layer
- **Location**: `server/routes/`
- **Framework**: Express.js
- **Structure**:
  - RESTful API design
  - Consistent response formats
  - Error handling middleware
  - Request validation

#### Authentication Middleware
- **Location**: `server/middleware/auth.js`
- **Features**:
  - JWT token validation
  - Role-based access control
  - Rate limiting
  - Session management

#### Database Layer
- **Location**: `server/model/`
- **Technology**: Prisma ORM with PostgreSQL
- **Features**:
  - Type-safe database queries
  - Migration management
  - Connection pooling
  - Query optimization

#### Service Layer
- **Location**: `server/services/`
- **Purpose**: Business logic implementation
- **Components**:
  - `ComplaintService.js` - Complaint processing
  - `UserService.js` - User management
  - `NotificationService.js` - Email/SMS notifications
  - `FileService.js` - File upload/download

## Data Flow Architecture

### Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Gateway
    participant M as Middleware
    participant S as Service
    participant D as Database
    
    C->>A: HTTP Request
    A->>M: Authentication Check
    M->>A: Auth Result
    A->>S: Business Logic
    S->>D: Database Query
    D->>S: Query Result
    S->>A: Processed Data
    A->>C: HTTP Response
```

### State Management Flow

```mermaid
graph LR
    A[User Action] --> B[Action Creator]
    B --> C[Redux Reducer]
    C --> D[State Update]
    D --> E[Component Re-render]
    E --> F[UI Update]
    
    G[API Call] --> H[Async Thunk]
    H --> I[Loading State]
    I --> J[API Response]
    J --> K[State Update]
    K --> L[UI Update]
```

## Database Architecture

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Complaint : creates
    User ||--o{ Assignment : assigned_to
    Complaint ||--o{ Assignment : has
    Complaint ||--o{ StatusUpdate : has
    Complaint ||--o{ Attachment : has
    User }|--|| Role : has
    SystemConfig ||--o{ ConfigValue : contains
    
    User {
        int id PK
        string email UK
        string password
        string name
        string phone
        int role_id FK
        datetime created_at
        datetime updated_at
    }
    
    Complaint {
        int id PK
        string title
        text description
        string status
        string priority
        string category
        int user_id FK
        float latitude
        float longitude
        datetime created_at
        datetime updated_at
    }
    
    Assignment {
        int id PK
        int complaint_id FK
        int assigned_to FK
        int assigned_by FK
        datetime assigned_at
        string status
    }
    
    StatusUpdate {
        int id PK
        int complaint_id FK
        int user_id FK
        string status
        text comment
        datetime created_at
    }
    
    Attachment {
        int id PK
        int complaint_id FK
        string filename
        string filepath
        string mimetype
        int filesize
        datetime uploaded_at
    }
```

### Database Design Principles

#### Normalization
- Third Normal Form (3NF) compliance
- Elimination of data redundancy
- Proper foreign key relationships
- Indexed columns for performance

#### Data Integrity
- Primary key constraints
- Foreign key constraints
- Check constraints for data validation
- Unique constraints where appropriate

#### Performance Optimization
- Strategic indexing on frequently queried columns
- Query optimization through proper joins
- Connection pooling for concurrent access
- Caching layer for frequently accessed data

## Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth API
    participant D as Database
    
    U->>F: Login Credentials
    F->>A: POST /auth/login
    A->>D: Validate Credentials
    D->>A: User Data
    A->>A: Generate JWT
    A->>F: JWT Token + User Info
    F->>F: Store Token
    F->>U: Redirect to Dashboard
```

### Authorization Model

#### Role-Based Access Control (RBAC)
- **Admin**: Full system access and configuration
- **Ward Officer**: Area-specific complaint management
- **Maintenance**: Assigned complaint handling
- **Citizen**: Personal complaint submission and tracking

#### Permission Matrix
| Resource | Admin | Ward Officer | Maintenance | Citizen |
|----------|-------|--------------|-------------|---------|
| View All Complaints | ✓ | Area Only | Assigned Only | Own Only |
| Create Complaints | ✓ | ✓ | ✓ | ✓ |
| Assign Complaints | ✓ | ✓ | ✗ | ✗ |
| Update Status | ✓ | ✓ | ✓ | ✗ |
| User Management | ✓ | Limited | ✗ | ✗ |
| System Config | ✓ | ✗ | ✗ | ✗ |

### Data Security

#### Encryption
- Passwords hashed using bcrypt
- JWT tokens for stateless authentication
- HTTPS for all client-server communication
- File uploads validated and sanitized

#### Input Validation
- Server-side validation for all inputs
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization
- CSRF protection for state-changing operations

## Performance Architecture

### Caching Strategy

```mermaid
graph TD
    A[Client Request] --> B{Cache Check}
    B -->|Hit| C[Return Cached Data]
    B -->|Miss| D[Database Query]
    D --> E[Update Cache]
    E --> F[Return Data]
    
    G[Cache Invalidation] --> H[Data Update]
    H --> I[Clear Related Cache]
```

#### Caching Layers
1. **Browser Cache**: Static assets and API responses
2. **CDN Cache**: Public assets and images
3. **Application Cache**: Frequently accessed data
4. **Database Cache**: Query result caching

### Performance Optimization

#### Frontend Optimization
- Code splitting with React.lazy()
- Bundle optimization with Vite
- Image optimization and lazy loading
- Memoization of expensive computations

#### Backend Optimization
- Database query optimization
- Connection pooling
- Response compression
- Rate limiting to prevent abuse

#### Database Optimization
- Proper indexing strategy
- Query performance monitoring
- Connection pooling
- Read replicas for scaling

## Scalability Architecture

### Horizontal Scaling

```mermaid
graph TB
    subgraph "Load Balancer"
        A[Nginx/HAProxy]
    end
    
    subgraph "Application Servers"
        B[App Server 1]
        C[App Server 2]
        D[App Server N]
    end
    
    subgraph "Database Cluster"
        E[Primary DB]
        F[Read Replica 1]
        G[Read Replica 2]
    end
    
    subgraph "Shared Services"
        H[Redis Cache]
        I[File Storage]
        J[Message Queue]
    end
    
    A --> B
    A --> C
    A --> D
    B --> E
    B --> F
    B --> G
    C --> E
    C --> F
    C --> G
    D --> E
    D --> F
    D --> G
    B --> H
    C --> H
    D --> H
    B --> I
    C --> I
    D --> I
```

### Microservices Considerations

While currently monolithic, the architecture supports future microservices migration:

#### Service Boundaries
- **User Service**: Authentication and user management
- **Complaint Service**: Complaint processing and workflow
- **Notification Service**: Email and SMS notifications
- **File Service**: File upload and storage management
- **Reporting Service**: Analytics and reporting

#### Communication Patterns
- **Synchronous**: REST APIs for real-time operations
- **Asynchronous**: Message queues for background processing
- **Event-Driven**: Event sourcing for audit trails

## Deployment Architecture

### Environment Structure

```mermaid
graph TD
    subgraph "Development"
        A[Local Development]
        B[Feature Branches]
    end
    
    subgraph "Testing"
        C[Integration Testing]
        D[Staging Environment]
    end
    
    subgraph "Production"
        E[Production Environment]
        F[Backup Systems]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
```

#### Environment Configuration
- **Development**: Local development with hot reloading
- **Staging**: Production-like environment for testing
- **Production**: Live system with monitoring and backups

### CI/CD Pipeline

```mermaid
graph LR
    A[Code Commit] --> B[Automated Tests]
    B --> C[Build Process]
    C --> D[Security Scan]
    D --> E[Deploy to Staging]
    E --> F[Integration Tests]
    F --> G[Deploy to Production]
    G --> H[Health Checks]
```

## Monitoring and Observability

### Application Monitoring
- **Metrics**: Response times, error rates, throughput
- **Logging**: Structured logging with correlation IDs
- **Tracing**: Request tracing across components
- **Alerting**: Automated alerts for critical issues

### Health Checks
- **Application Health**: API endpoint availability
- **Database Health**: Connection and query performance
- **External Services**: Third-party service availability
- **Resource Health**: CPU, memory, and disk usage

## See Also

### Within Developer Department
- [API Contracts](./api_contracts.md) - Detailed API specifications and integration patterns
- [Code Guidelines](./code_guidelines.md) - Development standards and best practices
- [I18n Conversion Guide](./i18n_conversion_guide.md) - Internationalization implementation

### Cross-Department References
- [Database Schema Reference](../Database/schema_reference.md) - Detailed database documentation and relationships
- [Database Migration Guidelines](../Database/migration_guidelines.md) - Schema change procedures
- [System Configuration Overview](../System/system_config_overview.md) - Configuration management and hierarchy
- [System Security Standards](../System/security_standards.md) - Security architecture and policies
- [QA Test Cases](../QA/test_cases.md) - Testing procedures for architectural components
- [QA Integration Checklist](../QA/integration_checklist.md) - System integration validation
- [Deployment Linux Guide](../Deployment/linux_deployment.md) - Production deployment architecture
- [Deployment Multi-Environment Setup](../Deployment/multi_env_setup.md) - Environment-specific configurations
- [Onboarding Local Setup](../Onboarding/local_setup.md) - Development environment architecture