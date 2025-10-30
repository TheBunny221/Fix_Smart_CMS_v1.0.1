# Security Standards

This document outlines the security policies, access control mechanisms, and best practices implemented in Fix_Smart_CMS to ensure data protection and system integrity.

## 📋 Table of Contents

- [Security Architecture](#security-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Access Control Matrix](#access-control-matrix)
- [Security Middleware](#security-middleware)
- [Data Protection](#data-protection)
- [Security Headers](#security-headers)
- [Rate Limiting](#rate-limiting)
- [Input Validation & Sanitization](#input-validation--sanitization)
- [Audit & Logging](#audit--logging)
- [Security Best Practices](#security-best-practices)

## Security Architecture

Fix_Smart_CMS implements a multi-layered security architecture with defense-in-depth principles:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
│  • HTTPS/TLS Encryption                                     │
│  • Content Security Policy                                  │
│  • Secure Cookie Settings                                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 Reverse Proxy Layer                         │
│  • SSL Termination                                          │
│  • Rate Limiting                                            │
│  • DDoS Protection                                          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                Application Layer                            │
│  • JWT Authentication                                       │
│  • Role-Based Access Control                                │
│  • Input Validation & Sanitization                          │
│  • Security Headers (Helmet.js)                             │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer                             │
│  • Encrypted Connections                                    │
│  • Parameterized Queries                                    │
│  • Data Encryption at Rest                                  │
│  • Access Control & Auditing                                │
└─────────────────────────────────────────────────────────────┘
```

## Authentication & Authorization

### JWT-Based Authentication

Fix_Smart_CMS uses JSON Web Tokens (JWT) for stateless authentication:

#### JWT Configuration
```javascript
// JWT Settings
{
  algorithm: "HS256",           // HMAC SHA-256
  expiresIn: "7d",             // 7 days default
  issuer: "fix-smart-cms",     // Token issuer
  audience: "fix-smart-cms",   // Token audience
  clockTolerance: 60           // 60 seconds clock skew tolerance
}
```

#### Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "CITIZEN",
    "iat": 1701234567,
    "exp": 1701838367
  }
}
```

### Authentication Middleware

The authentication system provides multiple middleware functions:

#### 1. Protected Routes (`protect`)
```javascript
// Requires valid JWT token
app.use('/api/complaints', protect, complaintRoutes);
```

#### 2. Role-Based Authorization (`authorize`)
```javascript
// Requires specific roles
app.use('/api/admin', protect, authorize('ADMINISTRATOR'), adminRoutes);
```

#### 3. Optional Authentication (`optionalAuth`)
```javascript
// Authentication optional, provides user context if available
app.use('/api/public', optionalAuth, publicRoutes);
```

#### 4. Token Expiry Check (`checkTokenExpiry`)
```javascript
// Warns about token expiry
app.use('/api', protect, checkTokenExpiry, routes);
```

### User Roles & Permissions

#### Role Hierarchy
```
ADMINISTRATOR
    ├── Full system access
    ├── User management
    ├── System configuration
    └── All complaint operations

WARD_OFFICER
    ├── Ward-specific complaints
    ├── Assignment management
    ├── Status updates
    └── Ward analytics

MAINTENANCE_TEAM
    ├── Assigned complaints
    ├── Status updates
    ├── Photo uploads
    └── Work completion

CITIZEN
    ├── Submit complaints
    ├── View own complaints
    ├── Provide feedback
    └── Profile management

GUEST
    ├── Submit anonymous complaints
    ├── OTP verification
    └── Limited access
```

## Access Control Matrix

### API Endpoint Access Control

| Endpoint Category | ADMIN | WARD_OFFICER | MAINTENANCE | CITIZEN | GUEST |
|-------------------|-------|--------------|-------------|---------|-------|
| **Authentication** |
| POST /api/auth/login | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /api/auth/register | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /api/auth/logout | ✅ | ✅ | ✅ | ✅ | ❌ |
| **User Management** |
| GET /api/users | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /api/users | ✅ | ❌ | ❌ | ❌ | ❌ |
| PUT /api/users/:id | ✅ | 🔒 | 🔒 | 🔒 | ❌ |
| DELETE /api/users/:id | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Complaints** |
| GET /api/complaints | ✅ | 🔒 | 🔒 | 🔒 | ❌ |
| POST /api/complaints | ✅ | ✅ | ❌ | ✅ | ❌ |
| PUT /api/complaints/:id | ✅ | 🔒 | 🔒 | 🔒 | ❌ |
| DELETE /api/complaints/:id | ✅ | ❌ | ❌ | 🔒 | ❌ |
| **Admin Operations** |
| GET /api/admin/* | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /api/admin/* | ✅ | ❌ | ❌ | ❌ | ❌ |
| **System Config** |
| GET /api/system-config | ✅ | ❌ | ❌ | ❌ | ❌ |
| PUT /api/system-config | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Guest Operations** |
| POST /api/guest/complaints | ❌ | ❌ | ❌ | ❌ | ✅ |
| POST /api/guest-otp/* | ❌ | ❌ | ❌ | ❌ | ✅ |

**Legend:**
- ✅ Full Access
- 🔒 Restricted Access (own resources or ward-specific)
- ❌ No Access

### Resource-Level Access Control

#### Complaint Access Rules
```javascript
// Citizens can only access their own complaints
if (user.role === 'CITIZEN') {
  return complaint.submittedById === user.id;
}

// Ward Officers can access complaints in their ward
if (user.role === 'WARD_OFFICER') {
  return complaint.wardId === user.wardId;
}

// Maintenance Team can access assigned complaints
if (user.role === 'MAINTENANCE_TEAM') {
  return complaint.assignedToId === user.id || 
         complaint.maintenanceTeamId === user.id;
}

// Administrators have full access
if (user.role === 'ADMINISTRATOR') {
  return true;
}
```

#### User Profile Access Rules
```javascript
// Users can update their own profile
if (targetUserId === user.id) {
  return true;
}

// Administrators can update any profile
if (user.role === 'ADMINISTRATOR') {
  return true;
}

// Ward Officers can update users in their ward (limited fields)
if (user.role === 'WARD_OFFICER' && targetUser.wardId === user.wardId) {
  return ['phoneNumber', 'department'].includes(field);
}
```

## Security Middleware

### Helmet.js Security Headers

Helmet.js provides comprehensive security headers:

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true,
}));
```

### CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured restrictively:

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'https://fix-smart-cms.gov.in'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));
```

### Trust Proxy Configuration

For deployments behind reverse proxies:

```javascript
// Production: Trust only first proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', 'loopback');
}
```

## Data Protection

### Password Security

#### Password Hashing
```javascript
import bcrypt from 'bcryptjs';

// Hash password with salt rounds
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

#### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Data Encryption

#### Database Encryption
- **Connection Encryption**: All database connections use TLS/SSL
- **Field-Level Encryption**: Sensitive fields encrypted at application level
- **Backup Encryption**: Database backups encrypted with AES-256

#### File Upload Security
```javascript
// File upload restrictions
const uploadConfig = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5                     // 5 files max per request
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
};
```

### Sensitive Data Handling

#### Data Sanitization in Logs
```javascript
// Automatic sanitization of sensitive fields
const sensitiveFields = [
  'password', 'token', 'secret', 'key', 'otp', 'otpCode',
  'authorization', 'cookie', 'session', 'jwt', 'auth'
];

const sanitizeLogData = (data) => {
  // Replace sensitive values with [REDACTED]
  return sanitizeValue(data);
};
```

#### PII Protection
- **Data Minimization**: Collect only necessary personal information
- **Anonymization**: Support for anonymous complaints
- **Data Retention**: Automatic cleanup of expired data
- **Access Logging**: All PII access is logged and audited

## Security Headers

### Implemented Security Headers

| Header | Purpose | Configuration |
|--------|---------|---------------|
| `Strict-Transport-Security` | Force HTTPS | `max-age=31536000; includeSubDomains; preload` |
| `Content-Security-Policy` | Prevent XSS | Restrictive policy with specific sources |
| `X-Frame-Options` | Prevent clickjacking | `DENY` |
| `X-Content-Type-Options` | Prevent MIME sniffing | `nosniff` |
| `Referrer-Policy` | Control referrer info | `no-referrer` |
| `X-XSS-Protection` | XSS filtering | `1; mode=block` |
| `Permissions-Policy` | Feature policy | Restrictive permissions |

### Custom Security Headers

```javascript
// Additional custom headers
app.use((req, res, next) => {
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Rate-Limit-Policy', 'strict');
  res.setHeader('X-Security-Policy', 'enforced');
  next();
});
```

## Rate Limiting

### Rate Limiting Configuration

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 200,                    // 200 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for development
    if (process.env.NODE_ENV === 'development') return true;
    
    // Skip for authenticated admin operations
    if (req.path.startsWith('/api/admin') && req.headers.authorization) {
      return true;
    }
    
    return false;
  }
});
```

### Endpoint-Specific Rate Limits

| Endpoint Category | Window | Max Requests | Notes |
|-------------------|--------|--------------|-------|
| Authentication | 15 min | 10 | Login attempts |
| Guest OTP | 5 min | 3 | OTP generation |
| File Upload | 1 hour | 50 | Upload operations |
| API General | 15 min | 200 | General API calls |
| Admin Operations | No limit | - | Authenticated admins |

### Rate Limit Bypass

```javascript
// Development bypass
if (process.env.NODE_ENV === 'development') {
  app.get('/api/rate-limit/reset', (req, res) => {
    limiter.resetKey(req.ip);
    res.json({ success: true, message: 'Rate limit reset' });
  });
}
```

## Input Validation & Sanitization

### Validation Middleware

```javascript
import { body, param, query } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

// Input sanitization middleware
export const sanitizeInputs = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = DOMPurify.sanitize(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
```

### Validation Rules

#### User Registration Validation
```javascript
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must meet complexity requirements'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name must contain only letters and spaces'),
  body('phoneNumber')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format')
];
```

#### Complaint Validation
```javascript
const validateComplaint = [
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('area')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Area is required'),
  body('contactPhone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Valid phone number is required'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude')
];
```

### SQL Injection Prevention

```javascript
// Using Prisma ORM with parameterized queries
const complaints = await prisma.complaint.findMany({
  where: {
    status: status,           // Parameterized
    wardId: user.wardId,     // Parameterized
    submittedOn: {
      gte: new Date(dateFrom) // Type-safe
    }
  }
});

// Raw queries with parameters (when needed)
const result = await prisma.$queryRaw`
  SELECT * FROM complaints 
  WHERE status = ${status} 
  AND ward_id = ${wardId}
`;
```

## Audit & Logging

### Security Event Logging

```javascript
// Security event types
const securityEvents = {
  'unauthorized_access': 'Unauthorized configuration access attempt',
  'permission_denied': 'Configuration permission denied',
  'sensitive_data_access': 'Sensitive configuration data accessed',
  'config_tampering': 'Configuration tampering detected',
  'audit_trail': 'Configuration audit trail event'
};

// Log security events
logger.security('Failed login attempt', {
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  email: req.body.email,
  timestamp: new Date().toISOString()
});
```

### Audit Trail

All security-relevant events are logged:

- **Authentication Events**: Login, logout, failed attempts
- **Authorization Events**: Access denied, role changes
- **Data Access Events**: Sensitive data access, modifications
- **Configuration Changes**: System config updates
- **File Operations**: Upload, download, deletion
- **Admin Operations**: User management, system changes

### Log Security

```javascript
// Secure logging configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Encrypted log files
    new DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d',
      auditFile: 'logs/security-audit.json'
    })
  ]
});
```

## Security Best Practices

### Development Security

1. **Secure Coding Practices**
   - Use parameterized queries
   - Validate all inputs
   - Sanitize outputs
   - Handle errors securely
   - Follow principle of least privilege

2. **Dependency Management**
   ```bash
   # Regular security audits
   npm audit
   npm audit fix
   
   # Check for vulnerabilities
   npm run security:audit
   ```

3. **Environment Security**
   - Use different secrets for each environment
   - Never commit secrets to version control
   - Rotate secrets regularly
   - Use secure secret management

### Deployment Security

1. **Server Hardening**
   - Keep OS and software updated
   - Disable unnecessary services
   - Configure firewall rules
   - Use fail2ban for intrusion prevention

2. **Network Security**
   - Use HTTPS everywhere
   - Configure proper SSL/TLS
   - Implement network segmentation
   - Monitor network traffic

3. **Database Security**
   - Use encrypted connections
   - Implement proper access controls
   - Regular security updates
   - Backup encryption

### Monitoring & Response

1. **Security Monitoring**
   - Real-time log analysis
   - Anomaly detection
   - Failed authentication monitoring
   - Unusual access pattern detection

2. **Incident Response**
   - Security incident procedures
   - Automated alerting
   - Forensic logging
   - Recovery procedures

### Security Checklist

#### Pre-Deployment Security Checklist

- [ ] All secrets are properly configured
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented
- [ ] SQL injection prevention is in place
- [ ] XSS protection is enabled
- [ ] CSRF protection is implemented
- [ ] File upload restrictions are configured
- [ ] Logging and monitoring are enabled
- [ ] Error handling doesn't leak information
- [ ] Dependencies are up to date
- [ ] Security tests pass

#### Runtime Security Monitoring

- [ ] Monitor failed authentication attempts
- [ ] Track unusual access patterns
- [ ] Monitor file upload activities
- [ ] Watch for SQL injection attempts
- [ ] Track configuration changes
- [ ] Monitor system resource usage
- [ ] Check for unauthorized access attempts
- [ ] Verify backup integrity

## See Also

- [**System Configuration Overview**](system_config_overview.md) - System configuration keys and management
- [**Environment Management**](env_management.md) - Environment file management and validation
- [**Logging & Monitoring**](logging_monitoring.md) - Server logs and monitoring systems
- [**Developer Guidelines**](../Developer/README.md) - Development standards and practices

---

*Last updated: October 2025*