# System Configuration Overview

This document provides a comprehensive guide to system configuration keys, management procedures, and the configuration hierarchy used in Fix_Smart_CMS.

## 📋 Table of Contents

- [Configuration Architecture](#configuration-architecture)
- [Configuration Sources](#configuration-sources)
- [Core Configuration Keys](#core-configuration-keys)
- [Configuration Management](#configuration-management)
- [Fallback System](#fallback-system)
- [Configuration Validation](#configuration-validation)
- [Best Practices](#best-practices)

## Configuration Architecture

Fix_Smart_CMS uses a multi-layered configuration system that provides flexibility, reliability, and maintainability:

```
┌─────────────────────────────────────┐
│           Application               │
├─────────────────────────────────────┤
│        SystemConfig Service        │
├─────────────────────────────────────┤
│  Database Config ← → Cache Layer   │
├─────────────────────────────────────┤
│         Seed.json Fallback         │
├─────────────────────────────────────┤
│       Environment Variables        │
└─────────────────────────────────────┘
```

### Configuration Hierarchy (Priority Order)

1. **Database Configuration** (Highest Priority)
   - Dynamic configuration stored in `SystemConfig` table
   - Can be updated at runtime through admin interface
   - Cached for performance

2. **Seed.json Fallback**
   - Static configuration file: `prisma/seeds/seed.json`
   - Used when database is unavailable
   - Contains default system values

3. **Environment Variables** (Lowest Priority)
   - `.env` files and system environment variables
   - Infrastructure and deployment-specific settings

## Configuration Sources

### 1. Database Configuration (`SystemConfig` Table)

The primary configuration source stored in PostgreSQL:

```sql
-- SystemConfig table structure
CREATE TABLE system_config (
    id          TEXT PRIMARY KEY,
    key         TEXT UNIQUE NOT NULL,
    value       TEXT NOT NULL,
    type        TEXT,           -- Category: 'app', 'complaint', 'contact', 'system'
    description TEXT,
    is_active   BOOLEAN DEFAULT true,
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

**Key Features:**
- Runtime configuration updates
- Type categorization for organization
- Active/inactive status control
- Audit trail with timestamps

### 2. Seed Configuration (`prisma/seeds/seed.json`)

Static fallback configuration file structure:

```json
{
  "systemConfig": [
    {
      "key": "APP_NAME",
      "value": "Fix_Smart_CMS",
      "type": "app",
      "description": "Application display name"
    },
    {
      "key": "COMPLAINT_ID_PREFIX",
      "value": "KSC",
      "type": "complaint",
      "description": "Prefix for complaint IDs"
    }
  ]
}
```

### 3. Environment Variables

Infrastructure and deployment settings in `.env` files:

```bash
# Application Configuration
NODE_ENV=production
PORT=4005
HOST=0.0.0.0

# Database Configuration
DATABASE_URL="postgresql://user:pass@host:port/db"

# Security Configuration
JWT_SECRET="your-secure-secret-key"
JWT_EXPIRE="7d"
```

## Core Configuration Keys

### Application Configuration (`type: 'app'`)

| Key | Description | Default Value | Example |
|-----|-------------|---------------|---------|
| `APP_NAME` | Application display name | Fix_Smart_CMS | "Kochi Smart City" |
| `APP_VERSION` | Application version | 1.0.0 | "1.2.3" |
| `ORGANIZATION_NAME` | Organization name | Smart City Management | "Cochin Corporation" |
| `WEBSITE_URL` | Official website URL | https://fix-smart-cms.gov.in | "https://kochi.gov.in" |
| `SUPPORT_EMAIL` | Support contact email | support@fix-smart-cms.gov.in | "help@kochi.gov.in" |
| `PRIMARY_COLOR` | Brand primary color | #667eea | "#1e40af" |
| `SECONDARY_COLOR` | Brand secondary color | #764ba2 | "#7c3aed" |

### Complaint Management (`type: 'complaint'`)

| Key | Description | Default Value | Example |
|-----|-------------|---------------|---------|
| `COMPLAINT_ID_PREFIX` | Complaint ID prefix | KSC | "KOCHI" |
| `DEFAULT_SLA_HOURS` | Default SLA in hours | 48 | "72" |
| `MAX_ATTACHMENTS` | Max attachments per complaint | 5 | "10" |
| `MAX_FILE_SIZE_MB` | Max file size in MB | 10 | "25" |
| `AUTO_ASSIGNMENT` | Enable auto-assignment | true | "false" |
| `CITIZEN_FEEDBACK_REQUIRED` | Require citizen feedback | false | "true" |

### Contact Information (`type: 'contact'`)

| Key | Description | Default Value | Example |
|-----|-------------|---------------|---------|
| `CONTACT_PHONE` | Primary contact phone | +91-484-2345678 | "+91-484-1234567" |
| `CONTACT_EMAIL` | Primary contact email | contact@fix-smart-cms.gov.in | "info@kochi.gov.in" |
| `CONTACT_ADDRESS` | Physical address | Kochi, Kerala, India | "City Hall, Kochi" |
| `OFFICE_HOURS` | Office hours | Mon-Fri 9:00-17:00 | "Mon-Sat 8:00-18:00" |
| `EMERGENCY_CONTACT` | Emergency contact | +91-484-EMERGENCY | "+91-484-911" |

### System Settings (`type: 'system'`)

| Key | Description | Default Value | Example |
|-----|-------------|---------------|---------|
| `MAINTENANCE_MODE` | Enable maintenance mode | false | "true" |
| `REGISTRATION_ENABLED` | Allow new registrations | true | "false" |
| `GUEST_COMPLAINTS_ENABLED` | Allow guest complaints | true | "false" |
| `EMAIL_NOTIFICATIONS` | Enable email notifications | true | "false" |
| `SMS_NOTIFICATIONS` | Enable SMS notifications | false | "true" |
| `BACKUP_ENABLED` | Enable automatic backups | true | "false" |
| `ANALYTICS_ENABLED` | Enable analytics tracking | true | "false" |

## Configuration Management

### SystemConfig Service

The `SystemConfigService` class provides centralized configuration management:

```javascript
import SystemConfigService from './services/SystemConfigService.js';

// Initialize service
const configService = new SystemConfigService();
await configService.initialize();

// Get configuration value
const appName = await configService.getConfig('APP_NAME', 'Default App');

// Update configuration
await configService.updateConfig('APP_NAME', 'New App Name', 'Updated app name');

// Get all configurations by type
const appConfigs = await configService.getConfigsByType('app');
```

### Configuration Caching

The system implements intelligent caching for performance:

- **Cache Duration**: 5 minutes default
- **Cache Invalidation**: Automatic on updates
- **Cache Statistics**: Available through service
- **Memory Management**: LRU eviction policy

### Configuration Loading Process

```mermaid
graph TD
    A[Application Start] --> B[Initialize SystemConfig Service]
    B --> C[Check Database Connectivity]
    C --> D{Database Available?}
    D -->|Yes| E[Load from Database]
    D -->|No| F[Load from seed.json]
    E --> G[Cache Configuration]
    F --> G
    G --> H[Application Ready]
    
    I[Runtime Request] --> J[Check Cache]
    J --> K{Cache Hit?}
    K -->|Yes| L[Return Cached Value]
    K -->|No| M[Query Database]
    M --> N{Database Available?}
    N -->|Yes| O[Update Cache & Return]
    N -->|No| P[Use seed.json Fallback]
```

## Fallback System

### Fallback Triggers

The system automatically falls back to seed.json when:

1. **Database Unavailable**: Connection cannot be established
2. **Database Error**: Query execution fails
3. **Configuration Not Found**: Key doesn't exist in database
4. **Database Timeout**: Query exceeds timeout limit
5. **Connection Lost**: Database connection drops during query

### Fallback Logging

All fallback events are logged with detailed context:

```javascript
// Example fallback log entry
{
  "event": "config_fallback",
  "key": "APP_NAME",
  "reason": "database_unavailable",
  "reason_description": "Database connection is not available",
  "fallback_source": "seed.json",
  "timestamp": "2024-12-01T10:30:00Z"
}
```

### Fallback Recovery

The system automatically recovers when database becomes available:

- **Health Checks**: Periodic database connectivity checks
- **Cache Refresh**: Automatic cache refresh on recovery
- **Seamless Transition**: No application restart required

## Configuration Validation

### Validation Rules

Configuration values are validated using Zod schemas:

```javascript
const configValidationSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(1000),
  type: z.enum(['app', 'complaint', 'contact', 'system']).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true)
});
```

### Validation Process

1. **Input Validation**: All configuration updates are validated
2. **Type Checking**: Values are checked against expected types
3. **Range Validation**: Numeric values checked against valid ranges
4. **Format Validation**: URLs, emails, and other formats validated
5. **Business Rules**: Custom business logic validation

### Validation Errors

Common validation errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `INVALID_KEY_FORMAT` | Key contains invalid characters | Use alphanumeric and underscore only |
| `VALUE_TOO_LONG` | Value exceeds maximum length | Reduce value length to under 1000 chars |
| `INVALID_TYPE` | Type not in allowed list | Use: app, complaint, contact, or system |
| `DUPLICATE_KEY` | Key already exists | Use different key or update existing |
| `INVALID_URL_FORMAT` | URL format is invalid | Ensure proper URL format with protocol |

## Best Practices

### Configuration Key Naming

- Use **UPPER_SNAKE_CASE** for all keys
- Include **category prefix** when appropriate
- Keep keys **descriptive but concise**
- Avoid **abbreviations** unless commonly understood

```javascript
// Good examples
APP_NAME
COMPLAINT_ID_PREFIX
EMAIL_SMTP_HOST
MAX_FILE_SIZE_MB

// Avoid
appName
cmp_id_pfx
email_host
max_sz
```

### Configuration Values

- Store **primitive values** as strings
- Use **JSON strings** for complex objects
- Include **units** in numeric values when applicable
- Use **boolean strings** ("true"/"false") for flags

```javascript
// Good examples
"MAX_FILE_SIZE_MB": "10"
"OFFICE_HOURS": "Mon-Fri 9:00-17:00"
"NOTIFICATION_SETTINGS": '{"email": true, "sms": false}'
"MAINTENANCE_MODE": "false"

// Avoid
"MAX_FILE_SIZE": "10485760"  // No unit indication
"OFFICE_HOURS": "9-17"       // Ambiguous format
"NOTIFICATIONS": "email,sms" // Use JSON for complex data
"MAINTENANCE": "0"           // Use boolean strings
```

### Configuration Management

1. **Document Changes**: Always include descriptions for new configurations
2. **Test Fallbacks**: Verify seed.json contains all required keys
3. **Monitor Performance**: Watch cache hit rates and query performance
4. **Validate Updates**: Test configuration changes in staging first
5. **Backup Configurations**: Regular backups of SystemConfig table

### Security Considerations

- **Never store secrets** in SystemConfig (use environment variables)
- **Validate all inputs** to prevent injection attacks
- **Audit configuration changes** for security compliance
- **Restrict access** to configuration management endpoints
- **Use HTTPS** for all configuration API calls

## See Also

- [**Environment Management**](env_management.md) - Environment file management and validation
- [**Security Standards**](security_standards.md) - Security policies and access control
- [**Database Documentation**](../Database/README.md) - Database schema and operations
- [**Developer Guidelines**](../Developer/README.md) - Development standards and practices

---

*Last updated: October 2025*