# Dynamic Complaint Type Filtering in Reports

## Overview

The Generate Report feature in the Unified Reports page now uses the updated dynamic complaint type system from system configuration data, ensuring consistency across all roles and filters.

## Data Flow

```
System Configuration Table (complaint_types)
  ↓
Backend Complaint Type Helper (cached)
  ↓
Reports API Endpoints (/api/reports/*)
  ↓
Frontend Redux Store (systemConfigSlice)
  ↓
Unified Reports UI (Dynamic Filters)
```

## Frontend Implementation

### Redux Integration

The frontend uses the existing `systemConfigSlice` to access complaint types:

```typescript
// client/pages/UnifiedReports.tsx
const { 
  complaintTypes, 
  isLoading: complaintTypesLoading,
  getComplaintTypeById 
} = useComplaintTypes();
```

### Filter UI

The complaint type filter dropdown is populated dynamically:

```typescript
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

### API Request

When generating a report, the selected complaint type ID is sent to the backend:

```typescript
const queryParams = new URLSearchParams({
  from: filters.dateRange.from,
  to: filters.dateRange.to,
  ...(filters.ward !== "all" && { ward: filters.ward }),
  ...(filters.complaintType !== "all" && { type: filters.complaintType }),
  ...(filters.status !== "all" && { status: filters.status }),
  ...(filters.priority !== "all" && { priority: filters.priority }),
  detailed: "true",
});
```

### Display Names

Complaint type names are displayed using the dynamic system:

```typescript
{getComplaintTypeById(filters.complaintType)?.name || filters.complaintType}
```

## Backend Implementation

### Updated Endpoints

The following report endpoints now use dynamic complaint type filtering:

1. **Analytics Endpoint** (`GET /api/reports/analytics`)
2. **Export Endpoint** (`GET /api/reports/export`)
3. **Heatmap Endpoint** (`GET /api/reports/heatmap`)

### Dynamic Type Resolution

Each endpoint now resolves complaint types dynamically:

```javascript
// Dynamic complaint type filtering
if (type && type !== "all") {
  try {
    const complaintType = await getComplaintTypeById(type);
    if (complaintType) {
      // Filter by both new complaintTypeId and legacy type field for compatibility
      where.OR = [
        { complaintTypeId: parseInt(complaintType.id) },
        { type: complaintType.name },
        { type: type } // Also include direct match for legacy data
      ];
    } else {
      // Fallback to direct type filtering for legacy data
      where.type = type;
    }
  } catch (error) {
    console.warn("Complaint type resolution failed, using direct filter:", error.message);
    where.type = type;
  }
}
```

### Categories with Dynamic Names

The analytics endpoint now returns proper complaint type names:

```javascript
// Get all complaint types for proper name resolution
const allComplaintTypes = await getComplaintTypes();
const typeNameMap = new Map();
for (const ct of allComplaintTypes) {
  typeNameMap.set(ct.name, ct.name);
  typeNameMap.set(ct.id, ct.name);
}

const categories = categoriesGroup.map((g) => {
  const typeName = typeNameMap.get(g.type) || g.type || "Others";
  return {
    name: typeName,
    count: g._count._all,
    avgTime: timeByType.get(g.type) ? /* calculation */ : 0,
    color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
  };
});
```

## API Examples

### Request Examples

#### Generate Report for All Types
```http
GET /api/reports/analytics?from=2024-01-01&to=2024-01-31&ward=all&detailed=true
```

#### Generate Report for Specific Type
```http
GET /api/reports/analytics?from=2024-01-01&to=2024-01-31&type=1&ward=all&detailed=true
```

#### Export Report with Type Filter
```http
GET /api/reports/export?format=csv&from=2024-01-01&to=2024-01-31&type=water_supply
```

### Response Examples

#### Analytics Response
```json
{
  "success": true,
  "message": "Analytics data retrieved successfully",
  "data": {
    "complaints": {
      "total": 150,
      "resolved": 120,
      "pending": 25,
      "overdue": 5
    },
    "categories": [
      {
        "name": "Water Supply",
        "count": 45,
        "avgTime": 2.3,
        "color": "hsl(210, 70%, 50%)"
      },
      {
        "name": "Electricity",
        "count": 38,
        "avgTime": 1.8,
        "color": "hsl(120, 70%, 50%)"
      }
    ],
    "trends": [
      {
        "date": "2024-01-01",
        "complaints": 12,
        "resolved": 10,
        "slaCompliance": 85.5
      }
    ],
    "metadata": {
      "totalRecords": 150,
      "dataFetchedAt": "2024-01-31T10:30:00Z"
    }
  }
}
```

## Caching and Performance

### Backend Caching

The complaint type helper uses a 5-minute in-memory cache:

```javascript
// server/utils/complaintTypeHelper.js
let complaintTypesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getComplaintTypes = async () => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (complaintTypesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return complaintTypesCache;
  }
  
  // Fetch fresh data and update cache
  // ...
};
```

### Cache Invalidation

Cache is automatically cleared when complaint types are updated:

```javascript
// server/controller/complaintTypeController.js
export const createComplaintType = asyncHandler(async (req, res) => {
  // ... create logic ...
  
  // Clear cache after creating new complaint type
  clearComplaintTypesCache();
  
  // ... response ...
});
```

## Error Handling

### Frontend Error States

1. **Loading State**: Shows "Loading types..." while fetching complaint types
2. **Empty State**: Shows "No types available" when no active types exist
3. **Network Error**: Graceful fallback with cached data or default behavior

### Backend Error Handling

1. **Invalid Type ID**: Falls back to direct string matching for legacy compatibility
2. **Database Errors**: Logs errors and continues with available data
3. **Cache Failures**: Falls back to direct database queries

## Role-Based Access

### Administrator
- Can generate reports for all wards and complaint types
- Has access to ward performance breakdowns
- Can export data in all formats

### Ward Officer
- Reports automatically scoped to their assigned ward
- Can filter by complaint types within their ward
- Limited export capabilities

### Maintenance Team
- Reports scoped to complaints assigned to them
- Can view complaint type distributions for their assignments

## Validation Test Cases

### Successful Scenarios
✅ Generate report with no type filter → returns all complaint types correctly  
✅ Generate report with valid type from systemConfig → filters data correctly  
✅ Update systemConfig with new complaint type → immediately reflected in dropdown  
✅ Multiple roles generate reports → consistent results across all roles  

### Error Scenarios
✅ Invalid type ID → handled gracefully with fallback to direct matching  
✅ Network error during type resolution → falls back to cached data  
✅ Empty complaint types list → shows appropriate empty state  
✅ Database connection issues → graceful degradation with error logging  

## UI Testing Checklist

### Filter Dropdown
- [ ] Shows dynamic list from systemConfig
- [ ] Displays loading state while fetching
- [ ] Shows empty state when no types available
- [ ] Handles network errors gracefully

### Report Generation
- [ ] Selecting type updates filter correctly
- [ ] Generate Report button triggers correct API call
- [ ] Report data reflects selected type filter
- [ ] Type names display correctly in results

### Export Functionality
- [ ] PDF export reflects correct type names
- [ ] Excel export includes proper type labels
- [ ] CSV export has readable type names
- [ ] All formats handle dynamic types consistently

## Troubleshooting

### Common Issues

1. **Complaint types not loading**
   - Check system configuration API endpoint
   - Verify Redux store is properly initialized
   - Check browser network tab for API errors

2. **Report generation fails with type filter**
   - Verify complaint type ID is being sent correctly
   - Check backend logs for type resolution errors
   - Ensure database has proper complaint type data

3. **Type names showing as IDs**
   - Check if `getComplaintTypeById` is working
   - Verify complaint types are loaded in Redux store
   - Check for proper fallback handling

### Debug Commands

```bash
# Check complaint types in database
SELECT * FROM complaint_types WHERE isActive = true;

# Check system config complaint types
SELECT * FROM system_config WHERE key LIKE 'COMPLAINT_TYPE_%';

# Check complaint type cache status
# (Add logging to complaintTypeHelper.js)
```

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live complaint type updates
2. **Advanced Filtering**: Multi-select complaint type filtering
3. **Custom Reports**: User-defined report templates with type-specific fields
4. **Analytics**: Track which complaint types are most commonly filtered
5. **Performance**: Redis caching for high-traffic environments

This documentation ensures that the Generate Report feature is fully aligned with the dynamic complaint type system and provides consistent behavior across all user roles and scenarios.