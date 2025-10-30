# Data Flow Diagram

This document illustrates the data flow between components, backend controllers, and database entities in the NLC-CMS system.

## System Overview Flow

```mermaid
graph TB
    subgraph "Client Layer"
        A[React App]
        B[Redux Store]
        C[RTK Query]
    end
    
    subgraph "Server Layer"
        D[Express Server]
        E[Route Handlers]
        F[Controllers]
        G[Middleware]
    end
    
    subgraph "Data Layer"
        H[Prisma ORM]
        I[PostgreSQL]
    end
    
    subgraph "External Services"
        J[Email Service]
        K[File Storage]
        L[Logging Service]
    end
    
    A --> B
    B --> C
    C --> D
    D --> G
    G --> E
    E --> F
    F --> H
    H --> I
    
    F --> J
    F --> K
    F --> L
    
    I --> H
    H --> F
    F --> E
    E --> D
    D --> C
    C --> B
    B --> A
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client App
    participant S as Server
    participant DB as Database
    participant E as Email Service
    
    Note over U,E: Login Flow
    U->>C: Enter credentials
    C->>S: POST /api/auth/login
    S->>DB: Verify user credentials
    DB->>S: User data
    S->>S: Generate JWT token
    S->>C: Token + user data
    C->>C: Store in Redux store
    
    Note over U,E: OTP Verification Flow
    U->>C: Request OTP
    C->>S: POST /api/guest-otp/send
    S->>DB: Create OTP session
    S->>E: Send OTP email
    E->>U: OTP email
    U->>C: Enter OTP
    C->>S: POST /api/guest-otp/verify
    S->>DB: Verify OTP
    DB->>S: Validation result
    S->>C: Success/failure response
```

## Complaint Submission Flow

```mermaid
flowchart TD
    A[User Fills Form] --> B[Client Validation]
    B --> C{Valid?}
    C -->|No| A
    C -->|Yes| D[Upload Attachments]
    D --> E[Submit to Server]
    E --> F[Server Validation]
    F --> G{Valid?}
    G -->|No| H[Return Error]
    G -->|Yes| I[Save to Database]
    I --> J[Auto-assign Ward]
    J --> K[Generate Complaint ID]
    K --> L[Send Notifications]
    L --> M[Return Success]
    
    H --> A
    M --> N[Update Client State]
    N --> O[Show Success Message]
```

## Complaint Processing Flow

```mermaid
stateDiagram-v2
    [*] --> Registered: Citizen submits
    Registered --> Assigned: Auto-assign to ward
    Assigned --> InProgress: Officer/Team starts work
    InProgress --> Resolved: Work completed
    Resolved --> Closed: Citizen confirms
    Resolved --> Reopened: Citizen disputes
    Reopened --> InProgress: Re-investigation
    
    note right of Registered: Email notification sent
    note right of Assigned: Ward officer notified
    note right of InProgress: Progress updates logged
    note right of Resolved: Citizen feedback requested
    note right of Closed: Final notification sent
```

## Database Entity Relationships

```mermaid
erDiagram
    User ||--o{ Complaint : submits
    User ||--o{ Complaint : "assigned to"
    User ||--o{ StatusLog : creates
    User ||--o{ Notification : receives
    User ||--o{ Message : sends
    User ||--o{ Attachment : uploads
    
    Ward ||--o{ User : contains
    Ward ||--o{ Complaint : "belongs to"
    Ward ||--o{ SubZone : contains
    
    Complaint ||--o{ StatusLog : has
    Complaint ||--o{ Attachment : has
    Complaint ||--o{ Notification : triggers
    Complaint ||--o{ Message : has
    Complaint ||--o{ Material : uses
    Complaint }o--|| ComplaintType : "is of type"
    
    SubZone }o--|| Ward : "belongs to"
    SubZone ||--o{ Complaint : contains
    
    OTPSession }o--|| User : "belongs to"
    ServiceRequest }o--|| User : "submitted by"
    ServiceRequest }o--|| Ward : "belongs to"
```

## API Request/Response Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant M as Middleware
    participant R as Route Handler
    participant Ctrl as Controller
    participant P as Prisma
    participant DB as Database
    
    C->>M: HTTP Request
    M->>M: Authentication check
    M->>M: Rate limiting
    M->>M: Request logging
    M->>R: Validated request
    R->>Ctrl: Route to controller
    Ctrl->>Ctrl: Business logic
    Ctrl->>P: Database query
    P->>DB: SQL query
    DB->>P: Query result
    P->>Ctrl: Formatted data
    Ctrl->>R: Response data
    R->>M: HTTP response
    M->>M: Response formatting
    M->>C: JSON response
```

## File Upload Flow

```mermaid
flowchart TD
    A[User Selects File] --> B[Client Validation]
    B --> C{Valid File?}
    C -->|No| D[Show Error]
    C -->|Yes| E[Create FormData]
    E --> F[POST /api/uploads]
    F --> G[Multer Middleware]
    G --> H[File Validation]
    H --> I{Valid?}
    I -->|No| J[Delete Temp File]
    I -->|Yes| K[Save to Disk]
    K --> L[Create DB Record]
    L --> M[Return File Info]
    
    J --> N[Return Error]
    M --> O[Update Client State]
    N --> D
```

## Notification Flow

```mermaid
graph TD
    A[Event Trigger] --> B{Notification Type}
    B -->|Email| C[Email Service]
    B -->|In-App| D[Database Insert]
    B -->|SMS| E[SMS Service - Future]
    
    C --> F[SMTP Server]
    F --> G[User Email]
    
    D --> H[Client Polling]
    H --> I[Show Notification]
    
    E --> J[SMS Gateway]
    J --> K[User Phone]
```

## Real-time Data Updates

```mermaid
sequenceDiagram
    participant U1 as User 1 (Citizen)
    participant U2 as User 2 (Officer)
    participant S as Server
    participant DB as Database
    
    Note over U1,DB: Status Update Flow
    U2->>S: Update complaint status
    S->>DB: Save status change
    S->>DB: Create status log
    S->>DB: Create notification
    DB->>S: Confirm updates
    
    Note over U1,DB: Notification Delivery
    U1->>S: Poll for notifications
    S->>DB: Query notifications
    DB->>S: Return new notifications
    S->>U1: Send notifications
    U1->>U1: Update UI
```

## Ward-based Routing Flow

```mermaid
flowchart TD
    A[Complaint Submitted] --> B[Extract Location]
    B --> C[Determine Ward]
    C --> D{Ward Found?}
    D -->|Yes| E[Auto-assign to Ward]
    D -->|No| F[Assign to Default Ward]
    E --> G[Notify Ward Officer]
    F --> G
    G --> H[Update Complaint Status]
    H --> I[Log Assignment]
```

## Search and Filter Flow

```mermaid
graph TD
    A[User Input] --> B[Client-side Debounce]
    B --> C[Build Query Parameters]
    C --> D[API Request]
    D --> E[Server Validation]
    E --> F[Build Prisma Query]
    F --> G[Database Query]
    G --> H[Apply Filters]
    H --> I[Paginate Results]
    I --> J[Return Data]
    J --> K[Update Client State]
    K --> L[Render Results]
```

## Report Generation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant DB as Database
    participant F as File System
    
    U->>C: Request report
    C->>S: POST /api/reports/generate
    S->>DB: Query data with filters
    DB->>S: Return dataset
    S->>S: Process data
    S->>S: Generate report (PDF/Excel)
    S->>F: Save report file
    S->>C: Return download link
    C->>U: Show download option
    U->>S: Download report
    S->>F: Serve file
    F->>U: Report file
```

## Error Handling Flow

```mermaid
flowchart TD
    A[Error Occurs] --> B{Error Type}
    B -->|Validation| C[400 Bad Request]
    B -->|Authentication| D[401 Unauthorized]
    B -->|Authorization| E[403 Forbidden]
    B -->|Not Found| F[404 Not Found]
    B -->|Server Error| G[500 Internal Error]
    
    C --> H[Log Error]
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I[Format Response]
    I --> J[Send to Client]
    J --> K[Show User Message]
```

## Performance Monitoring Flow

```mermaid
graph TD
    A[Request Start] --> B[Record Timestamp]
    B --> C[Process Request]
    C --> D[Record End Time]
    D --> E[Calculate Duration]
    E --> F[Log Performance]
    F --> G{Slow Request?}
    G -->|Yes| H[Alert Admin]
    G -->|No| I[Continue]
    H --> I
```

## Data Backup Flow

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant B as Backup Script
    participant DB as Database
    participant FS as File System
    participant C as Cloud Storage
    
    S->>B: Trigger backup
    B->>DB: Create dump
    DB->>B: Database dump
    B->>FS: Save local backup
    B->>C: Upload to cloud
    C->>B: Confirm upload
    B->>S: Backup complete
```

## Cache Strategy Flow

```mermaid
graph TD
    A[API Request] --> B{Cache Hit?}
    B -->|Yes| C[Return Cached Data]
    B -->|No| D[Query Database]
    D --> E[Store in Cache]
    E --> F[Return Fresh Data]
    
    G[Data Update] --> H[Invalidate Cache]
    H --> I[Next Request Refreshes]
```

---

**Previous**: [Module Breakdown](MODULE_BREAKDOWN.md) | **Next**: [Developer Guide](../developer/DEVELOPER_GUIDE.md) | **Up**: [Documentation Home](../README.md)