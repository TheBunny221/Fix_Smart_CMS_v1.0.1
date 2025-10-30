# SystemSettingsManager Refactor Example

## Before: Local Loading State

```typescript
// Current implementation in SystemSettingsManager.tsx
const {
  data: settingsResponse,
  isLoading,
  error,
  refetch,
} = useGetAllSystemConfigQuery();

if (isLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="h-8 w-8 animate-spin" />
      <span className="ml-2">Loading system settings...</span>
    </div>
  );
}
```

## After: Centralized Loading

```typescript
// Refactored implementation
import { useRTKQueryLoader } from './LoaderAwareComponent';
import { useGlobalLoader } from '../hooks/useGlobalLoader';

const SystemSettingsManager: React.FC = () => {
  const { withLoader } = useGlobalLoader();
  
  const queryResult = useGetAllSystemConfigQuery();
  const { data: settingsResponse, error, refetch } = queryResult;
  
  // Automatically manage global loader for this query
  useRTKQueryLoader(queryResult, 'Loading system settings...');
  
  const [bulkUpdate] = useBulkUpdateSystemConfigMutation();
  
  const handleSaveAll = async () => {
    await withLoader(
      async () => {
        const result = await bulkUpdate(pendingChanges);
        return result.unwrap();
      },
      { text: 'Saving system settings...' }
    );
  };
  
  // Remove the local loading check - GlobalLoader handles it
  if (error) {
    return (
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Settings</h2>
        <p className="text-gray-600 mb-4">Failed to load system configuration</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }
  
  // Component renders normally, GlobalLoader shows loading state
  return (
    <div className="space-y-6">
      {/* Component content */}
    </div>
  );
};
```

## Key Changes Made

1. **Removed Local Loading UI**: No more local spinner/loading state
2. **Added useRTKQueryLoader**: Automatically manages global loader for queries
3. **Used withLoader for Mutations**: Wraps save operations with loading text
4. **Simplified Component Logic**: Component focuses on business logic, not loading states

## Benefits

- **Consistent UX**: All loading states look the same across the app
- **Cleaner Code**: No loading UI logic in components
- **Better Performance**: Single global loader instead of multiple local ones
- **Accessibility**: Centralized loader has proper ARIA attributes
- **Maintainability**: Loading behavior managed in one place

## Implementation Steps

1. Import the necessary hooks
2. Replace local loading checks with `useRTKQueryLoader`
3. Wrap async operations with `withLoader`
4. Remove local loading UI components
5. Test that loading states work correctly