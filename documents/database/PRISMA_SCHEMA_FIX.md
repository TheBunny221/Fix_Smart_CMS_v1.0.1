# Prisma Schema Compatibility Fix

## Issue Identified
The complaint controller was trying to include relations that don't exist in the production Prisma schema, causing 500 errors:

```
Unknown field `materials` for include statement on model `Complaint`
```

## Root Cause
The code was referencing models/relations that were removed or renamed in the schema cleanup:
- `materials` - doesn't exist in Complaint model
- `messages` - Message model doesn't exist in production schema  
- `notifications` - Notification model doesn't exist in production schema
- `photos` - should be `complaintPhotos` based on schema

## Fixes Applied

### 1. Removed Non-Existent Relations
**File**: `server/controller/complaintController.js`

#### Removed `materials: true`
```javascript
// BEFORE (causing error)
complaintType: { select: { id: true, name: true } },
attachments: { where: { entityType: "COMPLAINT" } },
materials: true,  // ❌ This field doesn't exist
photos: {

// AFTER (fixed)
complaintType: { select: { id: true, name: true } },
attachments: { where: { entityType: "COMPLAINT" } },
photos: {
```

#### Fixed `photos` to `complaintPhotos`
```javascript
// BEFORE
photos: {
  orderBy: { uploadedAt: "desc" },
  // ...
}

// AFTER  
complaintPhotos: {
  orderBy: { uploadedAt: "desc" },
  // ...
}
```

#### Fixed `uploadedByTeam` to `uploadedBy`
```javascript
// BEFORE (ComplaintPhoto relation doesn't exist)
complaintPhotos: {
  orderBy: { uploadedAt: "desc" },
  include: {
    uploadedByTeam: {  // ❌ This relation doesn't exist
      select: { id: true, fullName: true, role: true },
    },
  },
}

// AFTER (using correct relation name)
complaintPhotos: {
  orderBy: { uploadedAt: "desc" },
  include: {
    uploadedBy: {  // ✅ Correct relation name
      select: { id: true, fullName: true, role: true },
    },
  },
}
```

#### Removed `messages` relation
```javascript
// BEFORE (Message model doesn't exist)
messages: {
  orderBy: { sentAt: "asc" },
  include: {
    sentBy: { select: { fullName: true, role: true } },
    receivedBy: { select: { fullName: true, role: true } },
  },
},

// AFTER (removed completely)
```

#### Removed `notifications` relation  
```javascript
// BEFORE (Notification model doesn't exist)
notifications: {
  where: { userId: req.user.id },
  orderBy: { sentAt: "desc" },
},

// AFTER (removed completely)
```

## Available Relations

### Complaint Model Relations
✅ **Available Relations:**
- `ward` - Ward information
- `subZone` - Sub-zone details  
- `submittedBy` - User who submitted
- `assignedTo` - Assigned user (legacy)
- `wardOfficer` - Assigned ward officer
- `maintenanceTeam` - Assigned maintenance team member
- `complaintType` - Complaint category
- `statusLogs` - Status change history
- `attachments` - File attachments
- `complaintPhotos` - Photo attachments

### ComplaintPhoto Model Relations
✅ **Available Relations:**
- `complaint` - Parent complaint
- `uploadedBy` - User who uploaded the photo

❌ **Non-Existent Relations:**
- `materials` - Not defined in Complaint schema
- `messages` - Message model doesn't exist
- `notifications` - Notification model doesn't exist  
- `photos` - Should be `complaintPhotos`
- `uploadedByTeam` - Should be `uploadedBy` in ComplaintPhoto

## Expected Results
After these fixes:
- ✅ Complaint details API should work without 500 errors
- ✅ All Prisma queries use only existing relations
- ✅ No more "Unknown field" errors in logs
- ✅ Dashboard should load complaint data properly

## Testing
1. Restart the server: `npm run dev`
2. Navigate to complaint details page
3. Check that complaint data loads without errors
4. Verify no Prisma errors in server logs

The API should now work correctly with the actual database schema.