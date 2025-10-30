# Configuration Manager Usage Guide

This document explains how to use the new centralized Configuration Manager system that was implemented as part of the System Config Integrity Audit.

## Overview

The Configuration Manager provides a centralized way to access system configuration values with proper error handling, logging, and fallback mechanisms. It replaces direct access to hardcoded values and ensures configuration comes from the SystemConfig API.

## Key Components

### 1. ConfigManager Class (`client/lib/ConfigManager.ts`)
- Centralized configuration access
- Automatic API fetching and caching
- Fallback mechanisms with logging
- Configuration validation

### 2. React Hooks (`client/hooks/useConfigManager.ts`)
- `useConfigManager()` - Main hook for configuration access
- `useConfigValue(key, defaultValue, component)` - Hook for specific values
- `useBrandingConfig()` - Hook for branding configuration
- `useAppName(component)` - Hook for app name

### 3. Configuration Provider (`client/components/ConfigurationProvider.tsx`)
- React Context Provider for configuration state
- Application-level configuration management
- Loading states and error handling

### 4. Error Boundary (`client/components/ConfigErrorBoundary.tsx`)
- Catches configuration-related errors
- Provides fallback UI for configuration failures
- Logging for configuration errors

## Basic Usage

### 1. Wrap Your Application

```tsx
import { ConfigurationProvider } from './components/ConfigurationProvider';

function App() {
  return (
    <ConfigurationProvider
      showLoadingFallback={true}
      enableErrorBoundary={true}
      onConfigLoaded={(stats) => console.log('Config loaded:', stats)}
      onConfigError={(error) => console.error('Config error:', error)}
    >
      <YourAppComponents />
    </ConfigurationProvider>
  );
}
```

### 2. Access Configuration in Components

```tsx
import { useConfigManager, useAppName, useBrandingConfig } from '../hooks/useConfigManager';

function MyComponent() {
  const { getConfig, isInitialized, refreshConfig } = useConfigManager();
  const appName = useAppName('MyComponent');
  const { branding, isLoaded } = useBrandingConfig();

  // Get specific config values
  const maxFileSize = getConfig('MAX_FILE_SIZE_MB', 10);
  const contactEmail = getConfig('CONTACT_EMAIL', 'support@example.com');

  if (!isInitialized) {
    return <div>Loading configuration...</div>;
  }

  return (
    <div>
      <h1>{appName}</h1>
      <img src={branding.logoUrl} alt={branding.appName} />
      <p>Max file size: {maxFileSize}MB</p>
      <p>Contact: {contactEmail}</p>
      <button onClick={refreshConfig}>Refresh Config</button>
    </div>
  );
}
```

### 3. Direct ConfigManager Usage

```tsx
import { configManager } from '../lib/ConfigManager';

// Initialize (usually done by ConfigurationProvider)
await configManager.initialize();

// Get configuration values
const appName = configManager.getAppName();
const branding = configManager.getBrandingConfig();
const contactInfo = configManager.getContactInfo();

// Validate configuration
const validation = configManager.validateConfigIntegrity();
if (!validation.isValid) {
  console.warn('Missing config keys:', validation.missingKeys);
}

// Get debug information
const debugInfo = configManager.getDebugInfo();
console.log('Config loaded from:', debugInfo?.source);
```

## Migration from Existing Systems

### From SystemConfigContext

**Before:**
```tsx
import { useSystemConfig } from '../contexts/SystemConfigContext';

function Component() {
  const { config, appName, getConfig } = useSystemConfig();
  return <div>{appName}</div>;
}
```

**After:**
```tsx
import { useAppName } from '../hooks/useConfigManager';

function Component() {
  const appName = useAppName('Component');
  return <div>{appName}</div>;
}
```

### From Redux SystemConfig

**Before:**
```tsx
import { useAppSelector } from '../store/hooks';
import { selectAppName } from '../store/slices/systemConfigSlice';

function Component() {
  const appName = useAppSelector(selectAppName);
  return <div>{appName}</div>;
}
```

**After:**
```tsx
import { useAppName } from '../hooks/useConfigManager';

function Component() {
  const appName = useAppName('Component');
  return <div>{appName}</div>;
}
```

### From Hardcoded Values

**Before:**
```tsx
function Component() {
  const appName = "NLC-CMS"; // Hardcoded
  return <div>{appName}</div>;
}
```

**After:**
```tsx
import { useAppName } from '../hooks/useConfigManager';

function Component() {
  const appName = useAppName('Component');
  return <div>{appName}</div>;
}
```

## Error Handling

### Component-Level Error Boundary

```tsx
import { ConfigErrorBoundary } from '../components/ConfigErrorBoundary';

function MyComponent() {
  return (
    <ConfigErrorBoundary>
      <ComponentThatUsesConfig />
    </ConfigErrorBoundary>
  );
}
```

### Missing Configuration Indicator

```tsx
import { ConfigMissingIndicator } from '../components/ConfigErrorBoundary';

function Component() {
  const { getConfig } = useConfigManager();
  const value = getConfig('SOME_KEY');
  
  if (!value) {
    return <ConfigMissingIndicator configKey="SOME_KEY" fallbackValue="Default" />;
  }
  
  return <div>{value}</div>;
}
```

## Configuration Validation

```tsx
import { useConfigManager } from '../hooks/useConfigManager';

function AdminPanel() {
  const { validateConfig, getDebugInfo } = useConfigManager();
  
  const handleValidate = () => {
    const validation = validateConfig();
    const debug = getDebugInfo();
    
    console.log('Validation result:', validation);
    console.log('Debug info:', debug);
    
    if (!validation.isValid) {
      alert(`Missing configuration keys: ${validation.missingKeys.join(', ')}`);
    }
  };
  
  return (
    <div>
      <button onClick={handleValidate}>Validate Configuration</button>
    </div>
  );
}
```

## Best Practices

### 1. Always Provide Component Context
```tsx
// Good - provides component context for logging
const appName = useAppName('HeaderComponent');

// Less ideal - no component context
const appName = useAppName();
```

### 2. Use Specific Hooks When Available
```tsx
// Good - uses specific hook
const appName = useAppName('Component');

// Less ideal - uses generic hook
const appName = getConfig('APP_NAME');
```

### 3. Handle Loading States
```tsx
function Component() {
  const { isInitialized } = useConfigManager();
  const appName = useAppName('Component');
  
  if (!isInitialized) {
    return <ConfigLoadingFallback />;
  }
  
  return <div>{appName}</div>;
}
```

### 4. Provide Fallback Values
```tsx
// Good - provides fallback
const maxSize = getConfig('MAX_FILE_SIZE_MB', 10);

// Less ideal - no fallback
const maxSize = getConfig('MAX_FILE_SIZE_MB');
```

## Logging and Monitoring

The Configuration Manager automatically logs:
- Configuration loading events
- Fallback usage
- Missing configuration access
- API errors and response times

Check browser console and backend logs for configuration-related events.

## Troubleshooting

### Configuration Not Loading
1. Check network requests to `/api/system-config/public`
2. Verify SystemConfig API is working
3. Check browser console for errors
4. Use `getDebugInfo()` to see configuration source

### Missing Configuration Values
1. Check if key exists in database SystemConfig table
2. Verify key is marked as `isActive: true`
3. Check if key is in public keys list in backend
4. Use validation methods to identify missing keys

### Performance Issues
1. Configuration is cached after first load
2. Use `refreshConfig()` sparingly
3. Check API response times in debug info
4. Consider using specific hooks instead of generic `getConfig()`

## Integration with Existing Code

The new Configuration Manager is designed to work alongside existing systems during migration:

1. **ConfigurationProvider** can wrap the entire app
2. **Existing SystemConfigContext** can continue to work
3. **Redux SystemConfig** can coexist
4. **Gradual migration** component by component

This allows for incremental adoption without breaking existing functionality.