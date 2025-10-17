# Daily Complaint Limit System Documentation

## Overview
The daily complaint limit system restricts citizens from submitting more than a configurable number of complaints per day to prevent system misuse while allowing admins and staff unrestricted access.

## Architecture

### Backend Implementation

#### 1. System Configuration
**Location**: `server/controller/systemConfigController.js`

A new system configuration parameter `CITIZEN_DAILY_COMPLAINT_LIMIT` has been added:

```javascript
{
  key: "CITIZEN_DAILY_COMPLAINT_LIMIT",
  value: "5",
  description: "Maximum number of complaints a citizen can submit per day",
}
```

**Default Value**: 5 complaints per day
**Configurable**: Yes, through admin panel
**Takes Effect**: Immediately without system restart

#### 2. Daily Limit Check Function
**Location**: `server/controller/complaintController.js`

```javascript
const checkDailyComplaintLimit = async (userId) => {
  // Get the daily complaint limit from system configuration
  const limitConfig = await prisma.systemConfig.findUnique({
    where: { key: "CITIZEN_DAILY_COMPLAINT_LIMIT" },
  });

  // Default to 5 complaints per day if not configured
  const dailyLimit = limitConfig ? parseInt(limitConfig.value) : 5;

  // Calculate start of today (server local time)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  // Count complaints submitted by this user today
  const todayCount = await prisma.complaint.count({
    where: {
      submittedById: userId,
      submittedOn: {
        gte: startOfToday,
        lt: endOfToday,
      },
    },
  });

  const remaining = Math.max(0, dailyLimit - todayCount);
  const allowed = todayCount < dailyLimit;

  return {
    allowed,
    todayCount,
    limit: dailyLimit,
    remaining,
    resetTime: endOfToday.toISOString(),
  };
};
```

**Key Features**:
- Uses server local time for consistent 24-hour periods
- Fails safely (allows submission if check fails)
- Returns comprehensive status information
- Atomic check to prevent race conditions

#### 3. Complaint Creation Integration
**Location**: `server/controller/complaintController.js` - `createComplaint` function

The daily limit check is integrated into the complaint creation process:

```javascript
// Check daily complaint limit for citizens
if (req.user.role === "CITIZEN") {
  try {
    const dailyLimitCheck = await checkDailyComplaintLimit(req.user.id);
    if (!dailyLimitCheck.allowed) {
      // Log the blocked attempt for audit
      await logComplaintAttempt(req.user.id, "BLOCKED_LIMIT_EXCEEDED", {
        todayCount: dailyLimitCheck.todayCount,
        limit: dailyLimitCheck.limit,
        reason: "Daily complaint limit exceeded"
      });

      return res.status(429).json({
        success: false,
        code: "LIMIT_EXCEEDED",
        message: "You have reached the maximum number of complaints allowed for today. Please try again tomorrow.",
        data: {
          remaining: 0,
          todayCount: dailyLimitCheck.todayCount,
          limit: dailyLimitCheck.limit,
          resetTime: dailyLimitCheck.resetTime
        }
      });
    }
  } catch (error) {
    // Continue with complaint creation if limit check fails (fail-safe)
  }
}
```

**Behavior**:
- Only applies to users with role "CITIZEN"
- Admins, Ward Officers, and Maintenance Staff are unrestricted
- Returns HTTP 429 (Too Many Requests) when limit exceeded
- Includes detailed error information for frontend handling

#### 4. Audit Logging
**Location**: `server/controller/complaintController.js`

All complaint submission attempts are logged for transparency:

```javascript
const logComplaintAttempt = async (userId, status, metadata = {}) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action: "COMPLAINT_SUBMISSION_ATTEMPT",
      status,
      metadata,
    };
    
    console.log("🔍 [AUDIT] Complaint Submission Attempt:", JSON.stringify(logEntry, null, 2));
  } catch (error) {
    console.error("Error logging complaint attempt:", error);
  }
};
```

**Logged Events**:
- `SUCCESS`: Successful complaint submission
- `BLOCKED_LIMIT_EXCEEDED`: Submission blocked due to daily limit

#### 5. Daily Limit Status API
**Location**: `server/routes/complaintRoutes.js`

New endpoint for citizens to check their daily limit status:

```
GET /api/complaints/daily-limit-status
Authorization: Bearer <token>
Role: CITIZEN only
```

**Response**:
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "todayCount": 2,
    "limit": 5,
    "remaining": 3,
    "resetTime": "2025-10-17T00:00:00.000Z"
  }
}
```

### Frontend Implementation

#### 1. API Integration
**Location**: `client/store/api/complaintsApi.ts`

New query hook for daily limit status:

```typescript
getDailyLimitStatus: builder.query<
  ApiResponse<{
    allowed: boolean;
    todayCount: number;
    limit: number;
    remaining: number;
    resetTime: string;
  }>,
  void
>({
  query: () => ({
    url: "/complaints/daily-limit-status",
    method: "GET",
  }),
  providesTags: [{ type: "Complaint", id: "DAILY_LIMIT" }],
}),
```

**Hook**: `useGetDailyLimitStatusQuery()`

#### 2. CitizenComplaintForm Integration
**Location**: `client/pages/CitizenComplaintForm.tsx`

**Features Added**:
- Daily limit status display
- Submit button disabled when limit reached
- Specific error handling for limit exceeded

**UI Components**:
```tsx
{/* Daily Limit Status Alert */}
{!isDailyLimitLoading && dailyLimitData?.data && (
  <Alert className={
    dailyLimitData.data.remaining > 0 
      ? "border-green-200 bg-green-50" 
      : "border-red-200 bg-red-50"
  }>
    <Info className="h-4 w-4" />
    <AlertDescription className={
      dailyLimitData.data.remaining > 0 
        ? "text-green-800" 
        : "text-red-800"
    }>
      {dailyLimitData.data.remaining > 0 ? (
        <>
          <strong>Daily Limit:</strong> You can submit {dailyLimitData.data.remaining} more complaint{dailyLimitData.data.remaining !== 1 ? 's' : ''} today 
          ({dailyLimitData.data.todayCount} of {dailyLimitData.data.limit} used).
        </>
      ) : (
        <>
          <strong>Daily Limit Reached:</strong> You have reached the maximum number of complaints allowed for today ({dailyLimitData.data.limit}). 
          Please try again tomorrow.
        </>
      )}
    </AlertDescription>
  </Alert>
)}
```

**Submit Button**:
```tsx
<Button
  type="button"
  onClick={handleSubmit}
  disabled={
    isSubmitting || 
    uploadingFiles || 
    (dailyLimitData?.data && dailyLimitData.data.remaining <= 0)
  }
>
```

#### 3. UnifiedComplaintForm Integration
**Location**: `client/pages/UnifiedComplaintForm.tsx`

Similar integration as CitizenComplaintForm but with conditional loading:

```tsx
const { 
  data: dailyLimitData, 
  isLoading: isDailyLimitLoading,
  error: dailyLimitError 
} = useGetDailyLimitStatusQuery(undefined, {
  skip: !isAuthenticated || user?.role !== "CITIZEN"
});
```

**Features**:
- Only fetches data for authenticated citizens
- Shows daily limit status in citizen mode
- Disables submit button when limit reached
- Handles limit exceeded errors

#### 4. Error Handling
Both forms include specific error handling for daily limit exceeded:

```tsx
if (error?.data?.code === "LIMIT_EXCEEDED") {
  toast({
    title: "Daily Limit Reached",
    description: error.data.message || "You have reached the maximum number of complaints allowed for today. Please try again tomorrow.",
    variant: "destructive",
  });
}
```

## Configuration

### Admin Panel Configuration
Administrators can configure the daily complaint limit through the System Configuration panel:

1. Navigate to Admin Panel → System Configuration
2. Find "CITIZEN_DAILY_COMPLAINT_LIMIT" setting
3. Update the value (must be a positive integer)
4. Save changes

**Changes take effect immediately** without requiring system restart.

### Default Settings
- **Default Limit**: 5 complaints per day
- **Fallback Behavior**: If configuration is missing, defaults to 5
- **Fail-Safe**: If limit check fails, allows complaint submission

## Security Considerations

### Race Condition Prevention
- Atomic database queries prevent race conditions
- Limit check happens within the same transaction context
- Multiple rapid submissions are handled correctly

### Role-Based Access
- Only applies to users with role "CITIZEN"
- Admins, Ward Officers, and Maintenance Staff are unrestricted
- API endpoints verify user roles before applying limits

### Time Zone Consistency
- Uses server local time for all calculations
- Consistent 24-hour periods regardless of client time zone
- Daily reset happens at server midnight

## Monitoring and Audit

### Audit Logging
All complaint submission attempts are logged with:
- User ID
- Timestamp
- Action (SUCCESS or BLOCKED_LIMIT_EXCEEDED)
- Current count and limit values
- Metadata (complaint type, priority, etc.)

### Log Format
```json
{
  "timestamp": "2025-10-16T10:30:00.000Z",
  "userId": "user123",
  "action": "COMPLAINT_SUBMISSION_ATTEMPT",
  "status": "BLOCKED_LIMIT_EXCEEDED",
  "metadata": {
    "todayCount": 5,
    "limit": 5,
    "reason": "Daily complaint limit exceeded"
  }
}
```

### Monitoring Queries
Check blocked attempts:
```sql
-- Count blocked attempts today
SELECT COUNT(*) FROM complaint 
WHERE submittedById = 'user_id' 
AND submittedOn >= CURRENT_DATE 
AND submittedOn < CURRENT_DATE + INTERVAL 1 DAY;
```

## Testing

### Manual Test Cases

#### 1. Under Limit Submission
- **Setup**: Citizen with 2 complaints today, limit = 5
- **Action**: Submit new complaint
- **Expected**: Success, remaining = 2

#### 2. At Limit Submission
- **Setup**: Citizen with 5 complaints today, limit = 5
- **Action**: Submit new complaint
- **Expected**: HTTP 429, "LIMIT_EXCEEDED" error

#### 3. Admin Unrestricted
- **Setup**: Admin user, any number of complaints
- **Action**: Submit complaint
- **Expected**: Always succeeds

#### 4. Limit Reset
- **Setup**: Citizen at limit yesterday
- **Action**: Submit complaint today
- **Expected**: Success (limit resets daily)

#### 5. Configuration Change
- **Setup**: Limit = 5, citizen has 3 complaints
- **Action**: Admin changes limit to 2
- **Expected**: Next submission blocked (immediate effect)

### Edge Cases

#### 1. Rapid Submissions
- **Test**: Multiple simultaneous submissions
- **Expected**: Atomic counting prevents over-limit

#### 2. Configuration Missing
- **Test**: Delete CITIZEN_DAILY_COMPLAINT_LIMIT config
- **Expected**: Defaults to 5, system continues working

#### 3. Database Error
- **Test**: Database unavailable during limit check
- **Expected**: Allows submission (fail-safe behavior)

#### 4. Invalid Configuration
- **Test**: Set limit to non-numeric value
- **Expected**: Defaults to 5, logs error

## API Reference

### Check Daily Limit Status
```
GET /api/complaints/daily-limit-status
Authorization: Bearer <token>
Role: CITIZEN
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Daily complaint limit status retrieved successfully",
  "data": {
    "allowed": true,
    "todayCount": 2,
    "limit": 5,
    "remaining": 3,
    "resetTime": "2025-10-17T00:00:00.000Z"
  }
}
```

**Response (Forbidden)**:
```json
{
  "success": false,
  "message": "This endpoint is only available for citizens"
}
```

### Create Complaint (Limit Exceeded)
```
POST /api/complaints
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Response (Limit Exceeded)**:
```json
{
  "success": false,
  "code": "LIMIT_EXCEEDED",
  "message": "You have reached the maximum number of complaints allowed for today. Please try again tomorrow.",
  "data": {
    "remaining": 0,
    "todayCount": 5,
    "limit": 5,
    "resetTime": "2025-10-17T00:00:00.000Z"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Limit Not Enforced
- **Check**: User role is "CITIZEN"
- **Check**: System configuration exists
- **Check**: Server time zone settings

#### 2. Incorrect Count
- **Check**: Database time zone consistency
- **Check**: Complaint submission timestamps
- **Check**: Daily reset timing

#### 3. Configuration Not Taking Effect
- **Check**: Configuration saved correctly
- **Check**: No caching issues
- **Check**: Database connection

### Debug Queries

**Check user's today count**:
```sql
SELECT COUNT(*) as today_count
FROM complaint 
WHERE submittedById = 'user_id' 
AND submittedOn >= CURRENT_DATE 
AND submittedOn < CURRENT_DATE + INTERVAL 1 DAY;
```

**Check system configuration**:
```sql
SELECT * FROM systemConfig 
WHERE key = 'CITIZEN_DAILY_COMPLAINT_LIMIT';
```

**Check recent submissions**:
```sql
SELECT submittedOn, status 
FROM complaint 
WHERE submittedById = 'user_id' 
ORDER BY submittedOn DESC 
LIMIT 10;
```

## Future Enhancements

### Planned Features
- [ ] Different limits per complaint type
- [ ] Time-based limits (hourly, weekly)
- [ ] User-specific limit overrides
- [ ] Automatic limit adjustment based on system load
- [ ] Email notifications when approaching limit
- [ ] Dashboard for monitoring limit usage

### Performance Optimizations
- [ ] Cache daily counts for frequent users
- [ ] Batch limit checks for multiple users
- [ ] Optimize database queries with indexes
- [ ] Background cleanup of old audit logs

## Migration Notes

### Existing Data
- No database migration required
- Existing complaints are counted toward daily limits
- System works immediately after deployment

### Backward Compatibility
- API remains compatible for non-citizen users
- Existing complaint forms continue to work
- No breaking changes to existing functionality

### Rollback Plan
If issues arise, the system can be disabled by:
1. Setting `CITIZEN_DAILY_COMPLAINT_LIMIT` to a very high value (e.g., 1000)
2. Or removing the limit check code temporarily
3. System will continue to function normally without limits