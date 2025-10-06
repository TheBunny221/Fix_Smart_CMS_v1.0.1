# Complaint Details Debug Guide

## Issue
The complaint details page is showing "Unknown" values instead of actual complaint data.

## Possible Causes

### 1. Field Name Mismatches
**Fixed**: Updated field names to match Prisma schema:
- `submittedDate` → `submittedOn` ✅
- Added proper null checking for all date fields ✅

### 2. API Response Issues
The API might be:
- Returning an error due to Prisma schema fixes
- Not finding the complaint with the given ID
- Having authentication/permission issues

### 3. Data Structure Issues
The complaint object structure might have changed after Prisma fixes.

## Debug Steps Applied

### 1. Added Debug Logging
```javascript
// Debug: Log the complaint data to see what we're actually receiving
useEffect(() => {
  if (complaint) {
    console.log("Complaint data received:", complaint);
    console.log("Available fields:", Object.keys(complaint));
  }
  if (error) {
    console.error("Error fetching complaint:", error);
  }
}, [complaint, error]);
```

### 2. Enhanced Error Handling
- Added proper loading state
- Added detailed error messages
- Added not found state with better messaging

### 3. Fixed Field Names
- `submittedDate` → `submittedOn`
- Added null checking for all date operations

## Testing Instructions

1. **Open Browser Console** - Check for debug logs
2. **Navigate to complaint details** - Use URL: `/complaints/{complaint-id}`
3. **Check console output**:
   - Look for "Complaint data received:" log
   - Look for "Error fetching complaint:" log
   - Check network tab for API response

## Expected Console Output

### If Working:
```
Complaint data received: {id: "...", submittedOn: "...", ...}
Available fields: ["id", "submittedOn", "status", "priority", ...]
```

### If Error:
```
Error fetching complaint: {status: 500, message: "..."}
```

## Next Steps Based on Console Output

### If No Data Received:
- Check if API endpoint `/api/complaints/{id}` returns 200
- Verify authentication token is being sent
- Check server logs for Prisma errors

### If Data Received but Fields Missing:
- Compare "Available fields" with expected fields
- Update component to use correct field names
- Add fallbacks for missing fields

### If API Error:
- Check server logs for specific error
- Verify Prisma schema compatibility
- Check if complaint ID exists in database

## Quick Test Commands

### Check if complaint exists in database:
```sql
SELECT id, complaintId, submittedOn, status, priority 
FROM complaints 
WHERE id = 'your-complaint-id' OR complaintId = 'your-complaint-id';
```

### Test API endpoint directly:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:4005/api/complaints/your-complaint-id
```

The debug logging should reveal exactly what's happening with the data flow.