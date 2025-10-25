# Complaint Attachment Flow Validation

## Test Cases to Validate

### 1. Citizen Complaint Form (CitizenComplaintForm.tsx)
- [x] **Fixed**: Updated to use FormData for submission with attachments
- [x] **Fixed**: Removed separate attachment upload after complaint creation
- [ ] **Test**: Create complaint with multiple image attachments
- [ ] **Test**: Create complaint without attachments
- [ ] **Test**: Verify attachments appear in complaint details

### 2. Unified Complaint Form (UnifiedComplaintForm.tsx)
- [x] **Fixed**: Updated citizen flow to use FormData with attachments
- [x] **Fixed**: Guest flow already handles attachments in OTP verification
- [ ] **Test**: Citizen creates complaint with attachments
- [ ] **Test**: Guest creates complaint with attachments
- [ ] **Test**: Verify both flows show attachments in details

### 3. Backend API (complaintController.js)
- [x] **Fixed**: Added attachment processing to createComplaint function
- [x] **Fixed**: Added file validation (size, type)
- [x] **Fixed**: Added proper error handling for attachment failures
- [ ] **Test**: API accepts FormData with attachments
- [ ] **Test**: API validates file types and sizes
- [ ] **Test**: API creates attachment records in database

### 4. Routes (complaintRoutes.js)
- [x] **Fixed**: Added multer middleware for file uploads
- [x] **Fixed**: Added file filter and size limits
- [x] **Fixed**: Added proper upload directory configuration
- [ ] **Test**: Route accepts multipart/form-data
- [ ] **Test**: Files are stored in correct directory
- [ ] **Test**: File naming convention works

### 5. Frontend API (complaintsApi.ts)
- [x] **Fixed**: Updated createComplaint mutation to handle FormData
- [x] **Fixed**: Maintained backward compatibility with JSON
- [ ] **Test**: FormData submissions work
- [ ] **Test**: JSON submissions still work (backward compatibility)

### 6. Complaint Details Display (ComplaintDetails.tsx)
- [x] **Existing**: Already displays attachments correctly
- [ ] **Test**: Attachments from all sources display properly
- [ ] **Test**: Image previews work
- [ ] **Test**: Download functionality works
- [ ] **Test**: Attachment metadata displays correctly

## Manual Testing Steps

### Test 1: Citizen with Attachments
1. Login as citizen
2. Go to complaint form
3. Fill out complaint details
4. Upload 2-3 images (JPG, PNG)
5. Submit complaint
6. Verify complaint created successfully
7. Go to complaint details
8. Verify all attachments are visible and downloadable

### Test 2: Admin Creates Complaint with Attachments
1. Login as admin
2. Use unified complaint form
3. Fill out complaint details
4. Upload attachments
5. Submit complaint
6. Verify complaint created successfully
7. Check complaint details for attachments

### Test 3: Guest with Attachments
1. Use guest complaint form
2. Fill out details and upload files
3. Submit and verify OTP
4. Complete registration
5. Check complaint details for attachments

### Test 4: File Validation
1. Try uploading file > 10MB (should fail)
2. Try uploading unsupported file type (should fail)
3. Try uploading 6+ files (should limit to 5)
4. Verify error messages are clear

### Test 5: Edge Cases
1. Create complaint without attachments (should work)
2. Network failure during upload (should handle gracefully)
3. Partial upload failure (should continue with successful files)

## Expected Outcomes

### Success Criteria
- All complaint forms support attachment uploads
- Attachments are properly stored and linked to complaints
- File validation works correctly
- Attachments display properly in complaint details
- No breaking changes to existing functionality
- Consistent behavior across all user roles

### Database Verification
- Check `attachment` table for new records
- Verify `complaintId` foreign key is set correctly
- Verify `entityType` is set to "COMPLAINT"
- Verify file metadata is stored correctly

### File System Verification
- Check files are stored in `/uploads/complaints/` directory
- Verify file naming convention includes complaint prefix
- Verify files are accessible via URL

## Rollback Plan
If issues are found:
1. Revert complaint routes to remove multer middleware
2. Revert createComplaint controller to remove attachment handling
3. Revert frontend forms to use JSON submission
4. Revert API mutations to original implementation

## Documentation Updates Needed
- Update API documentation for complaint creation endpoint
- Add multipart/form-data examples
- Document file upload limits and supported types
- Update troubleshooting guide for attachment issues

---

**Last Updated**: January 2025  
**Schema Reference**: [prisma/schema.prisma](../../prisma/schema.prisma)  
**Related Documentation**: [Architecture](../architecture/README.md) | [Database](../database/README.md) | [System](../system/README.md)