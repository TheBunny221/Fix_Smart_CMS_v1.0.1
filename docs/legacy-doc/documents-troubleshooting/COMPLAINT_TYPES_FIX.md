# Complaint Types Chart Fix

## Issue
The "Complaints by Type" chart in the admin dashboard was showing "Unknown (0)" instead of actual complaint type names.

## Root Cause
The system was using the legacy `type` field (string) instead of the new `ComplaintType` model relationship, and there were issues with null/empty values being displayed.

## Changes Made

### 1. Updated Admin Controller (`server/controller/adminController.js`)
- Modified the complaints by type query to use both `complaintTypeId` (new) and `type` (legacy) fields
- **Added deduplication logic** to prevent duplicate complaint types from appearing
- Added comprehensive filtering to exclude null, empty, and zero-value entries
- Added proper error handling and debugging
- Improved the `getTypeColor` function to handle different naming conventions
- Added `cleanTypeName` helper function to sanitize type names
- Added fallback logic for when no data is available
- **Prioritizes ComplaintType model data over legacy string data** when duplicates exist

### 2. Updated Frontend (`client/pages/AdminDashboard.tsx`)
- Added client-side filtering to exclude entries with zero values
- Improved PieChart data filtering to only show valid entries
- Enhanced legend display to hide empty/invalid entries
- Updated debug information to show filtered counts

### 3. Created Test Data Scripts
- `server/scripts/seedComplaintTypes.js` - Seeds default complaint types
- `server/scripts/createTestData.js` - Creates test complaint types and complaints

### 4. Added Package.json Scripts
```json
{
  "seed:complaint-types": "node server/scripts/seedComplaintTypes.js",
  "seed:test-data": "node server/scripts/createTestData.js"
}
```

## How to Fix the Issue

### Option 1: Create Complaint Types via Admin Interface
1. Go to Admin Dashboard → System Config → Complaint Types
2. Create complaint types with proper names and SLA hours
3. Refresh the dashboard

### Option 2: Run the Seeding Scripts
```bash
# Create default complaint types
npm run seed:complaint-types

# Or create both types and test complaints
npm run seed:test-data
```

### Option 3: Manual Database Update
If you have existing complaints with legacy `type` values, you can:
1. Create complaint types in the admin interface
2. Update existing complaints to link to the new complaint types

## Expected Result
After implementing the fix, the "Complaints by Type" chart should show:
- Proper complaint type names (e.g., "Water Supply", "Electricity")
- Correct counts for each type
- Appropriate colors for each segment

## Debugging
The controller now includes extensive logging. Check the server console for:
- `📊 Complaints by type debug:` - Shows query results
- `✅ Sending complaints by type data:` - Shows final data sent to client
- `🔍 Database check` - Shows database state when no data is found

## Technical Details
The fix handles three scenarios:
1. **New approach**: Complaints linked via `complaintTypeId` to `ComplaintType` table
2. **Legacy approach**: Complaints using string `type` field
3. **Fallback**: Empty state with default complaint types

### Deduplication Strategy
To prevent duplicate complaint types from appearing in the chart:
1. **Priority System**: ComplaintType model data takes precedence over legacy string data
2. **Case-insensitive matching**: "Water Supply" and "WATER_SUPPLY" are treated as the same type
3. **Count aggregation**: If duplicates are found, their counts are combined
4. **Two-level deduplication**: 
   - First at the database query level (prevents mixing new and legacy for same type)
   - Second at the final data preparation level (ensures no duplicates reach the frontend)

The system now gracefully handles all three cases and provides meaningful, deduplicated data to the chart.