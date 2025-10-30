# Logo Upload Feature Test Scenarios

## Test Scenario 1: Upload a new logo and verify it updates immediately in the UI header

### Steps:
1. Log in as an administrator
2. Navigate to System Settings
3. Expand "Application Branding" section
4. Upload a new logo file (PNG/JPG/SVG, under 2MB)
5. Click "Upload Logo"
6. Verify success toast appears: "Application logo updated successfully"
7. Check that the header logo updates immediately without page reload

### Expected Result:
- Logo uploads successfully
- Success message displays
- Header logo updates immediately
- New logo is visible across all pages

## Test Scenario 2: Attempt to upload an invalid file type and confirm validation error

### Steps:
1. Log in as an administrator
2. Navigate to System Settings → Application Branding
3. Try to upload a file with invalid extension (e.g., .txt, .pdf, .doc)
4. Observe validation behavior

### Expected Result:
- File input should reject invalid file types
- Error message: "Please upload a PNG, JPG, or SVG file."
- Upload button remains disabled

## Test Scenario 3: Upload oversized file and confirm validation error

### Steps:
1. Log in as an administrator
2. Navigate to System Settings → Application Branding
3. Try to upload a file larger than 2MB
4. Observe validation behavior

### Expected Result:
- Error message: "Please upload a file smaller than 2MB."
- Upload fails gracefully

## Test Scenario 4: Delete logo.png from uploads and confirm fallback to default logo

### Steps:
1. Delete or rename `/uploads/logo.png` file
2. Refresh the application
3. Observe logo behavior

### Expected Result:
- Application falls back to `/public/logo.png`
- No broken images or errors
- Logo continues to display properly

## Test Scenario 5: Verify the upload feature only appears for admin users

### Steps:
1. Log in as a non-admin user (CITIZEN, WARD_OFFICER, MAINTENANCE_TEAM)
2. Try to access System Settings
3. Verify Application Branding section is not accessible

### Expected Result:
- Non-admin users cannot access System Settings
- Logo upload feature is restricted to administrators only

## Test Scenario 6: Restart the server and confirm logo persists

### Steps:
1. Upload a new logo as admin
2. Restart the server application
3. Refresh the browser
4. Verify logo is still displayed

### Expected Result:
- Uploaded logo persists after server restart
- Logo loads correctly on application startup
- System configuration maintains the uploaded logo URL

## API Testing

### Test Logo Upload API Endpoint

```bash
# Test with valid logo file
curl -X POST http://localhost:5000/api/uploads/logo \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "logo=@path/to/your/logo.png"

# Expected Response:
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "filename": "logo.png",
    "url": "/uploads/logo.png",
    "originalName": "your-logo.png",
    "size": 12345
  }
}
```

### Test Logo Access

```bash
# Test logo accessibility
curl -I http://localhost:5000/uploads/logo.png

# Expected: 200 OK with image content-type
```

## Manual Testing Checklist

- [ ] Admin can access Application Branding section
- [ ] File input accepts PNG, JPG, SVG files
- [ ] File input rejects invalid file types
- [ ] File size validation works (2MB limit)
- [ ] Logo preview shows before upload
- [ ] Upload button works correctly
- [ ] Success toast appears after upload
- [ ] Header logo updates immediately
- [ ] Logo persists across page navigation
- [ ] Logo persists after server restart
- [ ] Fallback to default logo works
- [ ] Non-admin users cannot access feature
- [ ] API endpoint requires admin authentication
- [ ] Uploaded file replaces existing logo.png
- [ ] System config APP_LOGO_URL updates correctly

## Performance Testing

- [ ] Logo loads quickly (under 1 second)
- [ ] Large logo files (up to 2MB) upload successfully
- [ ] Multiple rapid uploads don't cause issues
- [ ] Logo caching works properly

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Mobile Responsiveness

- [ ] Logo upload works on mobile devices
- [ ] Logo displays correctly on mobile
- [ ] Touch interactions work properly