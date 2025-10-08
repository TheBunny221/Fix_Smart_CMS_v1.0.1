# Satisfaction Rating Fix

## Issue
The satisfaction rating in the reports page was showing "4.30/5" when it should be "0" because there's no feedback yet. The system was generating fake/random satisfaction data instead of using actual ratings from the database.

## Root Cause
The performance metrics in both the reports API and maintenance analytics API were using hardcoded random values instead of calculating real satisfaction from complaint ratings in the database.

## Changes Made

### 1. Fixed Reports API (`server/routes/reportRoutes.js`)
**Before:**
```javascript
performance: {
  userSatisfaction: 4.2 + Math.random() * 0.6,  // FAKE DATA
  escalationRate: Math.random() * 15,
  firstCallResolution: 60 + Math.random() * 25,
  repeatComplaints: Math.random() * 10,
}
```

**After:**
```javascript
performance: await calculatePerformanceMetrics(prisma, where, closedWhere),
```

**Added `calculatePerformanceMetrics()` function that:**
- Calculates real user satisfaction from complaint ratings (`rating` field > 0)
- Returns 0 if no ratings exist
- Calculates real escalation rate from status logs
- Calculates real first-call resolution rate
- Calculates real repeat complaints count

### 2. Fixed Maintenance Analytics API (`server/routes/maintenanceAnalyticsRoutes.js`)
**Before:**
```javascript
const performance = {
  userSatisfaction: 4.0 + Math.random() * 0.8,  // FAKE DATA
  escalationRate: Math.random() * 10,
  firstTimeFixRate: 70 + Math.random() * 20,
  repeatComplaints: Math.random() * 15,
};
```

**After:**
```javascript
const performance = await calculateMaintenancePerformanceMetrics(prisma, where, req.user.id);
```

**Added `calculateMaintenancePerformanceMetrics()` function that:**
- Calculates satisfaction from complaints assigned to specific maintenance user
- Returns 0 if no ratings exist
- Calculates real escalation rate for maintenance tasks
- Calculates real first-time fix rate
- Calculates real repeat complaints for maintenance user

### 3. Admin Dashboard Already Correct
The admin dashboard (`server/controller/adminController.js`) was already calculating satisfaction correctly:
```javascript
const satisfactionResult = await prisma.complaint.aggregate({
  where: {
    rating: { gt: 0 }
  },
  _avg: {
    rating: true,
  },
});
const citizenSatisfaction = satisfactionResult._avg.rating || 0;
```

## Expected Results

### Reports Page
- **Before**: Shows "4.30/5" even with no feedback
- **After**: Shows "0.00/5" when no ratings exist, actual average when ratings exist

### Maintenance Analytics
- **Before**: Shows fake satisfaction data
- **After**: Shows real satisfaction data for maintenance team member

### Admin Dashboard
- **Already working correctly**: Shows real satisfaction data

## Technical Details

### Database Schema
The satisfaction is calculated from the `rating` field in the `complaints` table:
- `rating` field: Integer 1-5 (nullable)
- Only complaints with `rating > 0` are included in calculations
- Average is calculated and rounded to 2 decimal places

### Calculation Logic
1. **Query**: Get all complaints with ratings > 0 within the filtered scope
2. **Aggregate**: Calculate average rating using Prisma's `_avg` function
3. **Fallback**: Return 0 if no ratings exist
4. **Format**: Round to 2 decimal places for display

### Debugging
Both functions include console logging:
```javascript
console.log('📊 Performance metrics calculated:', {
  userSatisfaction: userSatisfaction.toFixed(2),
  totalRatings,
  // ... other metrics
});
```

## Testing
To test the fix:
1. **No ratings**: Should show "0.00/5"
2. **With ratings**: Should show actual average (e.g., "4.20/5")
3. **Check console**: Should see debug logs with actual calculation details

The system now provides accurate, real-time satisfaction metrics based on actual citizen feedback.