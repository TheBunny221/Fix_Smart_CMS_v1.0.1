# Centralized Loader System Implementation

## Overview
This document outlines the implementation of a unified, centralized loader system that provides consistent loading states across all Redux and fetch operations in the application.

## Architecture

### Core Components

1. **GlobalLoader Component** (`client/components/GlobalLoader.tsx`)
   - Renders a full-screen overlay with loading spinner
   - Automatically shows/hides based on global loading state
   - Supports custom loading text and theming

2. **Enhanced UI Slice** (`client/store/slices/uiSlice.ts`)
   - Already existed with loading state management
   - Enhanced with `showLoader` and `hideLoader` actions
   - Supports silent mode for background operations

3. **Loader Utilities** (`client/utils/loaderUtils.ts`)
   - `withGlobalLoader`: Wraps async operations with loading state
   - `withDebouncedLoader`: Prevents loader flicker for rapid operations
   - `withMutationLoader`: Specifically for RTK Query mutations

4. **Global Loader Hook** (`client/hooks/useGlobalLoader.ts`)
   - Provides convenient access to loader functions
   - Handles dispatch automatically

## Implementation Status

### ✅ Completed
- [x] GlobalLoader component created and integrated into App.tsx
- [x] Enhanced uiSlice with additional loader actions
- [x] Created utility functions for wrapping async operations
- [x] Added custom hooks for easy loader management
- [x] Enhanced export utilities with loader integration
- [x] Created HOC for loader-aware components

### 🔄 Next Steps Required

#### 1. Refactor RTK Query Endpoints
Update all API endpoints to use the centralized loader:

```typescript
// Example: client/store/api/complaintsApi.ts
import { createEndpointWithLoader } from '../utils/apiLoaderWrapper';

// Before
getComplaints: build.query<ComplaintsResponse, ComplaintsParams>({
  query: (params) => ({ url: '/complaints', params }),
}),

// After
getComplaints: createEndpointWithLoader(build, {
  query: (params) => ({ url: '/complaints', params }),
  loadingText: 'Loading complaints...',
}),
```

#### 2. Update Component Usage
Replace local loading states with centralized system:

```typescript
// Before
const [isLoading, setIsLoading] = useState(false);
const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await submitData();
  } finally {
    setIsLoading(false);
  }
};

// After
const { withLoader } = useGlobalLoader();
const handleSubmit = async () => {
  await withLoader(
    () => submitData(),
    { text: 'Submitting data...' }
  );
};
```

#### 3. Refactor Pages
Update these key pages to use centralized loading:

- `client/pages/UnifiedReportsRevamped.tsx`
- `client/pages/ComplaintsList.tsx`
- `client/pages/AdminConfig.tsx`
- `client/components/SystemSettingsManager.tsx`

## Usage Examples

### Basic Async Operation
```typescript
import { useGlobalLoader } from '../hooks/useGlobalLoader';

const MyComponent = () => {
  const { withLoader } = useGlobalLoader();
  
  const handleAction = async () => {
    await withLoader(
      async () => {
        const result = await fetch('/api/data');
        return result.json();
      },
      { text: 'Loading data...' }
    );
  };
};
```

### RTK Query with Loader
```typescript
import { useRTKQueryLoader } from '../components/LoaderAwareComponent';

const MyComponent = () => {
  const queryResult = useGetDataQuery();
  
  // Automatically manages global loader based on query state
  useRTKQueryLoader(queryResult, 'Fetching data...');
  
  return <div>{/* Component content */}</div>;
};
```

### Export Operations
```typescript
import { exportToPDFWithLoader } from '../utils/exportUtilsRevamped';
import { useAppDispatch } from '../store/hooks';

const ReportsPage = () => {
  const dispatch = useAppDispatch();
  
  const handleExport = async () => {
    await exportToPDFWithLoader(
      dispatch,
      data,
      trendsData,
      categoriesData,
      options
    );
  };
};
```

### Silent Background Operations
```typescript
const { withLoader } = useGlobalLoader();

// For background sync operations that shouldn't show loader
await withLoader(
  () => syncDataInBackground(),
  { silent: true }
);
```

## Configuration Options

### LoaderOptions Interface
```typescript
interface LoaderOptions {
  silent?: boolean;      // Don't show global loader
  text?: string;         // Custom loading text
  debounceMs?: number;   // Debounce delay (for debounced loader)
}
```

### Global Loader Features
- **Theming**: Automatically adapts to light/dark mode
- **Accessibility**: Proper ARIA labels and roles
- **Backdrop**: Semi-transparent overlay with blur effect
- **Z-index**: High z-index (9999) to appear above all content
- **Responsive**: Works on all screen sizes

## Performance Considerations

1. **Debouncing**: Use `withDebouncedLoader` for operations that might trigger rapidly
2. **Silent Mode**: Use for background operations that don't need user feedback
3. **Memory Management**: All timeouts are properly cleaned up
4. **State Management**: Minimal Redux state updates to prevent unnecessary re-renders

## Migration Guide

### Step 1: Remove Local Loading States
```typescript
// Remove these from components
const [isLoading, setIsLoading] = useState(false);
const [loading, setLoading] = useState(false);
```

### Step 2: Import Loader Hook
```typescript
import { useGlobalLoader } from '../hooks/useGlobalLoader';
```

### Step 3: Replace Loading Logic
```typescript
// Old
setIsLoading(true);
try {
  await operation();
} finally {
  setIsLoading(false);
}

// New
const { withLoader } = useGlobalLoader();
await withLoader(() => operation());
```

### Step 4: Update RTK Query Usage
```typescript
// Old
const { data, isLoading, error } = useGetDataQuery();
if (isLoading) return <Spinner />;

// New
const queryResult = useGetDataQuery();
useRTKQueryLoader(queryResult, 'Loading data...');
const { data, error } = queryResult;
```

## Testing

### Unit Tests
- Test GlobalLoader component visibility
- Test loader utilities with mock dispatch
- Test hook behavior with different states

### Integration Tests
- Verify loader appears during API calls
- Test debouncing behavior
- Verify silent mode functionality

### E2E Tests
- Test loader appears for user actions
- Verify loader doesn't block other UI elements
- Test accessibility features

## Benefits Achieved

1. **Consistency**: Uniform loading experience across the app
2. **Maintainability**: Centralized loading logic
3. **Performance**: Debounced loading prevents flicker
4. **Accessibility**: Proper ARIA support
5. **User Experience**: Professional loading states
6. **Developer Experience**: Simple API for adding loaders

## Future Enhancements

1. **Progress Bars**: Add support for progress indicators
2. **Module-specific Loaders**: Different loader styles per module
3. **Queue Management**: Handle multiple concurrent operations
4. **Analytics**: Track loading times and user experience metrics
5. **Offline Support**: Show different states for offline operations

## Validation Checklist

- [ ] All RTK Query endpoints use centralized loading
- [ ] Local loading states removed from components
- [ ] Export operations show appropriate loading messages
- [ ] Background operations use silent mode
- [ ] Loader appears consistently across all user roles
- [ ] No memory leaks or unmounted dispatch warnings
- [ ] Loader respects app theming (light/dark mode)
- [ ] Accessibility features working correctly
- [ ] Performance optimizations in place
- [ ] Documentation updated for team usage