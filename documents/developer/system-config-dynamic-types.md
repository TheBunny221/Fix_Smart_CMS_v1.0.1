# Dynamic Complaint Types System Configuration

## Overview

The complaint management system now uses fully dynamic complaint types managed through centralized system configuration, eliminating all hardcoded type definitions across frontend and backend components.

## Architecture

### Data Flow
```
System Configuration Table (complaint_types) 
  ↓
Backend API (/api/system-config/public)
  ↓
Redux Store (systemConfigSlice.complaintTypes)
  ↓
Frontend Components (via useComplaintTypes hook)
  ↓
Dynamic UI Filters and Forms
```

### Backend Components

#### 1. Database Schema
- **Primary**: `complaint_types` table with structured complaint type data
- **Fallback**: `system_config` table with JSON-encoded complaint types (legacy support)

#### 2. API Endpoints
- `GET /api/system-config/public` - Returns all public system settings including complaint types
- `GET /api/complaint-types` - Dedicated endpoint for complaint types management
- `POST /api/complaint-types` - Create new complaint type (Admin only)
- `PUT /api/complaint-types/:id` - Update complaint type (Admin only)

#### 3. Backend Utilities

##### ComplaintTypeHelper (`server/utils/complaintTypeHelper.js`)
```javascript
// Get all active complaint types with caching
const types = await getComplaintTypes();

// Validate complaint type
const isValid = await isValidComplaintType(typeId);

// Get specific complaint type
const type = await getComplaintTypeById(typeId);

// Clear cache after admin updates
clearComplaintTypesCache();
```

##### Caching Strategy
- **Duration**: 5 minutes in-memory cache
- **Invalidation**: Automatic on create/update operations
- **Fallback**: Direct database query if cache fails

#### 4. Dynamic Validation
```javascript
// server/middleware/validation.js
body("type").custom(async (value) => {
  const { isValidComplaintType } = await import("../utils/complaintTypeHelper.js");
  const isValid = await isValidComplaintType(value);
  if (!isValid) {
    throw new Error(`Invalid complaint type: ${value}`);
  }
  return true;
});
```

#### 5. Dynamic Filtering
```javascript
// server/controller/complaintController.js
if (type) {
  const complaintType = await prisma.complaintType.findFirst({
    where: {
      OR: [
        { name: type },
        { id: isNaN(type) ? undefined : parseInt(type) }
      ],
      isActive: true
    }
  });
  
  if (complaintType) {
    filters.OR = [
      { complaintTypeId: complaintType.id },
      { type: complaintType.name },
      { type: type } // Legacy compatibility
    ];
  }
}
```

### Frontend Components

#### 1. Redux Integration

##### SystemConfigSlice
```typescript
// client/store/slices/systemConfigSlice.ts
export interface ComplaintType {
  id: string;
  name: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  slaHours: number;
  isActive: boolean;
  updatedAt: string;
}

// Selectors
export const selectComplaintTypes = (state) => 
  state.systemConfig.complaintTypes.filter(type => type.isActive);
```

#### 2. React Hooks

##### useComplaintTypes Hook
```typescript
// client/hooks/useComplaintTypes.ts
export const useComplaintTypes = () => {
  const complaintTypes = useAppSelector(selectComplaintTypes);
  const isLoading = useAppSelector(selectSystemConfigLoading);
  
  const complaintTypeOptions = useMemo(() => {
    return complaintTypes.map((type) => ({
      value: type.id,
      label: type.name,
      description: type.description,
      priority: type.priority,
      slaHours: type.slaHours,
    }));
  }, [complaintTypes]);

  const getComplaintTypeById = (id: string) => {
    return complaintTypes.find((type) => type.id === id);
  };

  return {
    complaintTypes,
    complaintTypeOptions,
    isLoading,
    getComplaintTypeById,
    getComplaintTypeByName,
  };
};
```

#### 3. Component Integration

##### Dynamic Filters (Reports Page)
```typescript
// client/pages/UnifiedReports.tsx
const { complaintTypes, isLoading: complaintTypesLoading } = useComplaintTypes();

<SelectContent>
  <SelectItem value="all">All Types</SelectItem>
  {complaintTypesLoading ? (
    <SelectItem value="" disabled>Loading types...</SelectItem>
  ) : complaintTypes.length === 0 ? (
    <SelectItem value="" disabled>No types available</SelectItem>
  ) : (
    complaintTypes.map((type) => (
      <SelectItem key={type.id} value={type.id}>
        {type.name}
      </SelectItem>
    ))
  )}
</SelectContent>
```

##### Dynamic Forms (Complaint Creation)
```typescript
// client/pages/UnifiedComplaintForm.tsx
const { complaintTypeOptions: COMPLAINT_TYPES, isLoading: complaintTypesLoading } = useComplaintTypes();

<SelectContent>
  {COMPLAINT_TYPES.map((type) => (
    <SelectItem key={type.value} value={type.value}>
      <div className="flex flex-col">
        <span className="font-medium">{type.label}</span>
        <span className="text-sm text-gray-500">{type.description}</span>
      </div>
    </SelectItem>
  ))}
</SelectContent>
```

##### Dynamic Display (Complaint Details)
```typescript
// client/pages/ComplaintDetails.tsx
const { getComplaintTypeById } = useComplaintTypes();

<p className="text-gray-600">
  {getComplaintTypeById(complaint?.complaintTypeId)?.name || 
   (complaint?.type ? complaint.type.replace("_", " ") : "Unknown Type")}
</p>
```

## Configuration Management

### Admin Interface
Administrators can manage complaint types through:
1. **System Configuration Page** - General settings and legacy types
2. **Complaint Types Management** - Dedicated CRUD interface for complaint types

### Data Structure
```json
{
  "id": "1",
  "name": "Water Supply",
  "description": "Issues with water supply, quality, or pressure",
  "priority": "HIGH",
  "slaHours": 24,
  "isActive": true,
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Legacy Compatibility
The system maintains backward compatibility with legacy complaint types stored in `system_config` table:
```json
{
  "key": "COMPLAINT_TYPE_WATER_SUPPLY",
  "value": "{\"name\":\"Water Supply\",\"description\":\"Water issues\",\"slaHours\":24}",
  "isActive": true
}
```

## API Request/Response Examples

### Get Public System Config
```http
GET /api/system-config/public

Response:
{
  "success": true,
  "data": {
    "config": [...],
    "complaintTypes": [
      {
        "id": "1",
        "name": "Water Supply",
        "description": "Water related issues",
        "priority": "HIGH",
        "slaHours": 24,
        "isActive": true,
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### Create Complaint with Dynamic Type
```http
POST /api/complaints
{
  "description": "No water supply in my area",
  "complaintTypeId": "1",
  "type": "Water Supply",
  "priority": "HIGH",
  "wardId": "ward-123"
}
```

### Filter Complaints by Type
```http
GET /api/complaints?type=1
GET /api/complaints?type=Water Supply
```

### Filter Reports by Type
```http
GET /api/reports/analytics?type=1&from=2024-01-01&to=2024-01-31
```

## Error Handling

### Frontend Error States
1. **Loading State**: Show loading indicators while fetching complaint types
2. **Empty State**: Display "No types available" when no active types exist
3. **Network Error**: Graceful fallback with cached data or default behavior
4. **Invalid Type**: Show validation errors for invalid complaint type selections

### Backend Error Handling
1. **Validation Errors**: Return 400 with descriptive error messages
2. **Database Errors**: Log errors and return 500 with generic message
3. **Cache Failures**: Fall back to direct database queries
4. **Legacy Compatibility**: Seamlessly handle both new and old data formats

## Performance Considerations

### Caching Strategy
- **Backend**: 5-minute in-memory cache for complaint types
- **Frontend**: Redux store caching with automatic refresh
- **Database**: Indexed queries on complaint type fields

### Optimization Techniques
1. **Lazy Loading**: Complaint types loaded only when needed
2. **Memoization**: React hooks use useMemo for expensive computations
3. **Batch Operations**: Multiple complaint type operations batched together
4. **Connection Pooling**: Database connections efficiently managed

## Migration Guide

### From Hardcoded Types
1. **Remove Static Arrays**: Delete all hardcoded complaint type arrays
2. **Add Hook Usage**: Import and use `useComplaintTypes` hook
3. **Update Validation**: Replace static validation with dynamic validation
4. **Test Thoroughly**: Verify all complaint type functionality works

### Database Migration
```sql
-- Create complaint_types table if not exists
CREATE TABLE IF NOT EXISTS complaint_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  priority VARCHAR(50) DEFAULT 'MEDIUM',
  slaHours INTEGER DEFAULT 48,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing system_config complaint types
INSERT INTO complaint_types (name, description, priority, slaHours)
SELECT 
  JSON_EXTRACT(value, '$.name'),
  JSON_EXTRACT(value, '$.description'),
  COALESCE(JSON_EXTRACT(value, '$.priority'), 'MEDIUM'),
  COALESCE(JSON_EXTRACT(value, '$.slaHours'), 48)
FROM system_config 
WHERE key LIKE 'COMPLAINT_TYPE_%' AND isActive = true;
```

## Testing

### Unit Tests
- Complaint type validation functions
- Cache management utilities
- React hook behavior

### Integration Tests
- API endpoint responses
- Database query performance
- Frontend-backend data flow

### End-to-End Tests
- Complete complaint creation flow
- Admin complaint type management
- Filter functionality across all pages

## Monitoring and Maintenance

### Metrics to Track
1. **Cache Hit Rate**: Monitor complaint type cache effectiveness
2. **API Response Times**: Track performance of dynamic type queries
3. **Error Rates**: Monitor validation and database errors
4. **Usage Patterns**: Analyze which complaint types are most common

### Maintenance Tasks
1. **Cache Monitoring**: Ensure cache invalidation works correctly
2. **Database Cleanup**: Remove inactive or duplicate complaint types
3. **Performance Tuning**: Optimize queries based on usage patterns
4. **Legacy Migration**: Gradually migrate remaining hardcoded references

## Security Considerations

### Access Control
- Only administrators can create/update complaint types
- Public endpoints return only non-sensitive configuration data
- Input validation prevents injection attacks

### Data Validation
- Server-side validation for all complaint type operations
- Sanitization of user inputs
- Type checking for all API parameters

### Audit Trail
- Log all complaint type changes
- Track who made changes and when
- Maintain history of complaint type modifications

## Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket integration for live complaint type updates
2. **Advanced Caching**: Redis integration for distributed caching
3. **Bulk Operations**: Import/export complaint types via CSV/JSON
4. **Workflow Integration**: Link complaint types to specific approval workflows
5. **Analytics**: Track complaint type usage and performance metrics

### Scalability Improvements
1. **Database Sharding**: Distribute complaint types across multiple databases
2. **CDN Integration**: Cache complaint type data at edge locations
3. **Microservices**: Separate complaint type management into dedicated service
4. **Event Sourcing**: Track all complaint type changes as events

This documentation provides a comprehensive guide to the dynamic complaint types system, covering all aspects from implementation to maintenance and future enhancements.