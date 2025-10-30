# Export Functionality Troubleshooting Guide

## Issue Description

The export feature on the Unified Reports page is not working properly. Users may experience:
- Export buttons not responding
- JavaScript errors in console
- Failed API calls (404 errors)
- Empty or corrupted export files

## Root Cause Analysis

The main issues identified:

### 1. Function Parameter Mismatches ✅ FIXED
- `exportToPDF`, `exportToExcel`, `exportToCSV` functions expect 2 parameters but were being called with 4
- `validateExportPermissions` function expects 1 parameter but was being called with 2

### 2. API Endpoint Issues ✅ FIXED
- Frontend was making calls to wrong port (3000 instead of 4005)
- **SOLUTION**: Converted to frontend-only export system using RTK Query

### 3. Missing Error Handling ✅ IMPROVED
- Insufficient error handling for dynamic library loading
- Missing validation for export data

## Fixed Issues

### ✅ Complete Frontend-Only Export System

**New Architecture:**
- **Zero Backend Dependencies**: All exports handled entirely in frontend
- **Analytics Data Based**: Uses already loaded analytics data from the reports page
- **No Additional API Calls**: Works with existing data, no extra network requests
- **Instant Processing**: Immediate export without server processing time

**Before (Backend-dependent with API calls):**
```typescript
// Made API call to backend export endpoint (caused 404 errors)
const response = await fetch(`${baseUrl}/api/reports/export?${queryParams}`);
const exportData = await response.json();
await exportToPDF(exportData.data, analyticsData.trends, analyticsData.categories, exportOptions);
```

**After (Complete Frontend-only):**
```typescript
// Use already loaded analytics data - no API calls needed
const exportData = {
  summary: analyticsData.complaints,
  trends: analyticsData.trends,
  categories: analyticsData.categories,
  wards: analyticsData.wards,
  // ... other analytics data
};
await exportToPDF(exportData, exportOptions);
```

### ✅ Function Parameter Corrections

**Before (Incorrect):**
```typescript
// Wrong parameter count
await exportToPDF(exportData.data, analyticsData.trends, analyticsData.categories, exportOptions);
exportToExcel(exportData.data, analyticsData.trends, analyticsData.categories, exportOptions);
validateExportPermissions(user?.role || "", requestedData);
```

**After (Fixed):**
```typescript
// Correct parameter count with analytics data
await exportToPDF(exportData, exportOptions);
await exportToExcel(exportData, exportOptions);
validateExportPermissions(user?.role || "");
```

### ✅ Function Signature Verification

**Export Functions:**
```typescript
// client/utils/exportUtils.ts
export const exportToPDF = async (complaints: ComplaintData[], options: ExportOptions): Promise<void>
export const exportToExcel = async (complaints: ComplaintData[], options: ExportOptions): Promise<void>
export const exportToCSV = async (complaints: ComplaintData[], options: ExportOptions): Promise<void>
export const validateExportPermissions = (userRole: string): boolean
```

## Testing the Fix

### Step 1: Verify Dependencies
```bash
# Check if required packages are installed
npm list jspdf xlsx
```

### Step 2: Test Export Functionality
1. Navigate to `/reports` page
2. Ensure you're logged in as ADMINISTRATOR or WARD_OFFICER
3. Load some complaint data
4. Try each export format:
   - Click "CSV" button
   - Click "Excel" button  
   - Click "PDF" button

### Step 3: Check Browser Console
Open browser developer tools (F12) and check for:
- No JavaScript errors
- Successful API calls to `/api/reports/export`
- Proper file downloads

### Step 4: Verify File Contents
- CSV: Should contain complaint data in comma-separated format
- Excel: Should open properly in spreadsheet applications
- PDF: Should display formatted complaint report

## Common Issues and Solutions

### Issue 1: "Export functionality is still loading"
**Symptoms:** Alert message appears when clicking export buttons
**Cause:** Dynamic libraries not loaded properly
**Solution:**
```typescript
// Wait for libraries to load
useEffect(() => {
  loadDynamicLibraries();
}, []);
```

### Issue 2: "You don't have permission to export data"
**Symptoms:** Permission denied message
**Cause:** User role not in allowed roles
**Solution:** Ensure user has ADMINISTRATOR or WARD_OFFICER role

### Issue 3: "No data available for export"
**Symptoms:** Alert when trying to export
**Cause:** Analytics data not loaded
**Solution:** Wait for data to load before attempting export

### Issue 4: API Call Fails
**Symptoms:** Network errors in console
**Cause:** Backend API issues or authentication problems
**Solution:**
```typescript
// Check API endpoint and authentication
const response = await fetch(`${baseUrl}/api/reports/export?${queryParams}`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    'Content-Type': 'application/json'
  }
});
```

### Issue 5: Empty Export Files
**Symptoms:** Files download but contain no data
**Cause:** Data formatting issues or API returning empty results
**Solution:** Check API response and data formatting functions

## Advanced Debugging

### Enable Debug Mode
Add console logging to track export process:
```typescript
const handleExport = async (format: "pdf" | "excel" | "csv") => {
  console.log("Export started:", { format, user: user?.role, dataAvailable: !!analyticsData });
  
  // ... existing code ...
  
  console.log("Export data received:", exportData);
  console.log("Export completed successfully");
};
```

### Check API Response
```typescript
const response = await fetch(`${baseUrl}/api/reports/export?${queryParams}`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }
});

console.log("API Response Status:", response.status);
console.log("API Response Headers:", response.headers);

const exportData = await response.json();
console.log("Export Data:", exportData);
```

### Verify Library Loading
```typescript
const loadDynamicLibraries = useCallback(async () => {
  try {
    console.log("Loading dynamic libraries...");
    
    if (!rechartsLoaded) {
      const recharts = await import("recharts");
      console.log("Recharts loaded:", !!recharts);
      setDynamicLibraries((prev: any) => ({ ...prev, recharts }));
      setRechartsLoaded(true);
    }
    
    if (!exportUtilsLoaded) {
      const exportUtils = await import("../utils/exportUtils");
      console.log("Export utils loaded:", !!exportUtils);
      console.log("Available functions:", Object.keys(exportUtils));
      setDynamicLibraries((prev: any) => ({ ...prev, exportUtils }));
      setExportUtilsLoaded(true);
    }
    
    console.log("All libraries loaded successfully");
  } catch (error) {
    console.error("Library loading failed:", error);
    setLibraryLoadError("Failed to load required libraries. Some features may not work.");
  }
}, [rechartsLoaded, dateFnsLoaded, exportUtilsLoaded]);
```

## Backend Verification

### Check API Endpoint
Verify the export endpoint is working:
```bash
# Test API endpoint directly
curl -X GET "http://localhost:4005/api/reports/export?from=2024-01-01&to=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Check Server Logs
Monitor server logs for export-related errors:
```bash
# Check PM2 logs
npm run pm2:logs

# Or check application logs
tail -f logs/app.log
```

## Prevention Strategies

### 1. Type Safety
Use proper TypeScript interfaces:
```typescript
interface ExportFunction {
  (complaints: ComplaintData[], options: ExportOptions): Promise<void>;
}
```

### 2. Error Boundaries
Wrap export functionality in error boundaries:
```typescript
<ErrorBoundary fallback={<ExportErrorFallback />}>
  <ExportButtons />
</ErrorBoundary>
```

### 3. Loading States
Provide clear loading indicators:
```typescript
{isExporting && (
  <div className="flex items-center space-x-2">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>Exporting...</span>
  </div>
)}
```

### 4. User Feedback
Provide clear success/error messages:
```typescript
try {
  await exportFunction();
  toast.success("Export completed successfully!");
} catch (error) {
  toast.error(`Export failed: ${error.message}`);
}
```

## Testing Checklist

- [ ] All export buttons are visible and enabled for authorized users
- [ ] CSV export downloads and contains proper data
- [ ] Excel export downloads and opens correctly
- [ ] PDF export downloads and displays properly
- [ ] Permission validation works correctly
- [ ] Loading states display during export
- [ ] Error messages are clear and helpful
- [ ] No JavaScript errors in console
- [ ] API calls succeed with proper authentication
- [ ] Export works for different user roles (Admin, Ward Officer)

## Related Files

- `client/pages/UnifiedReports.tsx` - Main reports page
- `client/utils/exportUtils.ts` - Export utility functions
- `client/utils/exportUtilsRevamped.ts` - Compatibility layer
- `server/routes/reportRoutes.js` - Backend API routes
- `server/controller/reportsControllerRevamped.js` - Backend controller

---

**Last Updated**: January 2025  
**Schema Reference**: [prisma/schema.prisma](../../prisma/schema.prisma)  
**Related Documentation**: [Export Testing Guide](../developer/EXPORT_TESTING_GUIDE.md) | [Critical Fixes](./CRITICAL_FIXES_SUMMARY.md) | [Developer Guide](../developer/README.md)