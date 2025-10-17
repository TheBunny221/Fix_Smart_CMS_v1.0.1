# Centralized System Configuration Usage Guide

This document explains how to use the centralized system configuration management in the frontend.

## Overview

The system now fetches all public configuration values from the backend at application startup and stores them in Redux. This ensures consistent, dynamic configuration usage across all components.

## Key Features

- **Centralized Storage**: All config values are stored in Redux `systemConfigSlice`
- **Automatic Loading**: Configuration is fetched at app startup
- **Type Safety**: Full TypeScript support with proper types
- **Fallback Values**: Graceful handling of missing or failed config fetches
- **Easy Access**: Simple hooks for common use cases

## Basic Usage

### Using the Main Hook

```typescript
import { useSystemConfig } from "../hooks/useSystemConfig";

const MyComponent = () => {
  const { 
    loading, 
    error, 
    complaintTypes, 
    complaintPriorities,
    appName,
    maxFileSize,
    getConfigValue 
  } = useSystemConfig();

  // Get a specific config value with fallback
  const customValue = getConfigValue("CUSTOM_SETTING", "default-value");

  if (loading) return <div>Loading configuration...</div>;
  if (error) return <div>Error loading configuration</div>;

  return (
    <div>
      <h1>{appName}</h1>
      <p>Max file size: {maxFileSize}MB</p>
    </div>
  );
};
```

### Using Specific Hooks

#### Complaint Types
```typescript
import { useComplaintTypes } from "../hooks/useComplaintTypes";

const ComplaintForm = () => {
  const { complaintTypes, complaintTypeOptions, isLoading } = useComplaintTypes();

  return (
    <select>
      {complaintTypeOptions.map(type => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
};
```

#### Priorities and Statuses
```typescript
import { useComplaintPriorities, useComplaintStatuses } from "../hooks/useSystemConfig";

const FilterComponent = () => {
  const { priorityOptions } = useComplaintPriorities();
  const { statusOptions } = useComplaintStatuses();

  return (
    <div>
      <select>
        {priorityOptions.map(priority => (
          <option key={priority.value} value={priority.value}>
            {priority.label}
          </option>
        ))}
      </select>
      
      <select>
        {statusOptions.map(status => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </div>
  );
};
```

#### App Branding
```typescript
import { useAppBranding } from "../hooks/useSystemConfig";

const Header = () => {
  const { appName, appLogoUrl, themeColor } = useAppBranding();

  return (
    <header style={{ backgroundColor: themeColor }}>
      <img src={appLogoUrl} alt={appName} />
      <h1>{appName}</h1>
    </header>
  );
};
```

## Available Configuration Values

### App Settings
- `APP_NAME`: Application name
- `APP_LOGO_URL`: Logo URL
- `THEME_COLOR`: Primary theme color

### Contact Information
- `CONTACT_HELPLINE`: Support phone number
- `CONTACT_EMAIL`: Support email
- `CONTACT_OFFICE_HOURS`: Office hours
- `CONTACT_OFFICE_ADDRESS`: Physical address

### System Limits
- `MAX_FILE_SIZE_MB`: Maximum file upload size
- `CITIZEN_DAILY_COMPLAINT_LIMIT`: Daily complaint limit for citizens
- `DEFAULT_SLA_HOURS`: Default SLA time

### Feature Flags
- `SYSTEM_MAINTENANCE`: Maintenance mode flag
- `CITIZEN_REGISTRATION_ENABLED`: Allow citizen registration
- `AUTO_ASSIGN_COMPLAINTS`: Auto-assign complaints to ward officers

### Dynamic Arrays
- `COMPLAINT_PRIORITIES`: Available priority levels
- `COMPLAINT_STATUSES`: Available status values
- `complaintTypes`: Available complaint types (from dedicated table)

## Refreshing Configuration

```typescript
import { useSystemConfig } from "../hooks/useSystemConfig";

const AdminPanel = () => {
  const { refresh } = useSystemConfig();

  const handleRefresh = () => {
    refresh(); // Refetch configuration from backend
  };

  return (
    <button onClick={handleRefresh}>
      Refresh Configuration
    </button>
  );
};
```

## Error Handling

The system provides graceful error handling:

```typescript
const MyComponent = () => {
  const { loading, error, complaintTypes } = useSystemConfig();

  if (loading) {
    return <ConfigLoadingFallback message="Loading system configuration..." />;
  }

  if (error) {
    // System still works with fallback values
    console.warn("Config error:", error);
  }

  // Use configuration normally - fallbacks are handled automatically
  return <div>{/* Your component */}</div>;
};
```

## Migration from Hardcoded Values

### Before (Hardcoded)
```typescript
const COMPLAINT_TYPES = [
  { value: "WATER_SUPPLY", label: "Water Supply" },
  { value: "ELECTRICITY", label: "Electricity" },
  // ...
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
```

### After (Dynamic)
```typescript
import { useComplaintTypes, useComplaintPriorities } from "../hooks/useSystemConfig";

const MyComponent = () => {
  const { complaintTypeOptions } = useComplaintTypes();
  const { priorityOptions } = useComplaintPriorities();

  // Use complaintTypeOptions and priorityOptions instead
};
```

## Best Practices

1. **Always use hooks**: Don't access Redux state directly
2. **Handle loading states**: Show appropriate loading indicators
3. **Provide fallbacks**: Use default values for critical functionality
4. **Cache appropriately**: The system handles caching automatically
5. **Refresh when needed**: Call refresh after admin config changes

## Backend Integration

The frontend fetches configuration from:
- `/api/system-config/public` - Public system settings
- Complaint types are included in the response automatically

Admin users can update configuration through:
- `/api/system-config` - System settings management
- `/api/complaint-types` - Complaint types management

Changes are reflected immediately when components refresh their configuration.