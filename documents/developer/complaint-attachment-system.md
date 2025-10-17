# Complaint Attachment System Documentation

## Overview
The complaint attachment system allows users to upload files (images and documents) when creating complaints. This system supports all user roles and provides a unified approach to handling file uploads across different complaint submission flows.

## Architecture

### Backend Components

#### 1. File Upload Middleware (multer)
Located in: `server/routes/complaintRoutes.js`

```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, complaintUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `complaint-${baseName}-${uniqueSuffix}${extension}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Max 5 files
  },
  fileFilter: fileFilter,
});
```

**Configuration:**
- **Upload Directory**: `./uploads/complaints/`
- **File Size Limit**: 10MB per file
- **File Count Limit**: 5 files per complaint
- **Supported Types**: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT

#### 2. Complaint Controller
Located in: `server/controller/complaintController.js`

The `createComplaint` function now handles both JSON and FormData submissions:

```javascript
// Handle uploaded attachments if any
const files = req.files || [];
console.log("🔥 [createComplaint] Processing attachments:", files.length);

for (const file of files) {
  try {
    // Validate file size and type
    // Create attachment record in database
    await prisma.attachment.create({
      data: {
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/api/uploads/${file.filename}`,
        complaintId: complaint.id,
        entityType: "COMPLAINT",
        entityId: complaint.id,
        uploadedById: req.user.id,
      },
    });
  } catch (error) {
    // Continue processing other files even if one fails
  }
}
```

#### 3. Database Schema
The `attachment` table stores file metadata:

```sql
CREATE TABLE attachment (
  id VARCHAR(191) PRIMARY KEY,
  fileName VARCHAR(191) NOT NULL,
  originalName VARCHAR(191) NOT NULL,
  mimeType VARCHAR(191) NOT NULL,
  size INT NOT NULL,
  url VARCHAR(191) NOT NULL,
  complaintId VARCHAR(191),
  entityType VARCHAR(191) NOT NULL,
  entityId VARCHAR(191) NOT NULL,
  uploadedById VARCHAR(191),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3)
);
```

### Frontend Components

#### 1. API Layer
Located in: `client/store/api/complaintsApi.ts`

The `createComplaint` mutation supports both FormData and JSON:

```typescript
createComplaint: builder.mutation<
  ApiResponse<Complaint>,
  CreateComplaintRequest | FormData
>({
  query: (data) => {
    // If data is FormData, send as multipart/form-data
    if (data instanceof FormData) {
      return {
        url: "/complaints",
        method: "POST",
        body: data,
        // Don't set Content-Type header, let browser set it with boundary
      };
    }
    
    // Otherwise, send as JSON (backward compatibility)
    return {
      url: "/complaints",
      method: "POST",
      body: data,
    };
  },
```

#### 2. Complaint Forms

##### CitizenComplaintForm.tsx
Uses FormData for submission with attachments:

```typescript
const handleSubmit = async () => {
  // Create FormData for multipart submission
  const formDataToSubmit = new FormData();
  
  // Add complaint data
  formDataToSubmit.append("description", formData.description);
  formDataToSubmit.append("complaintTypeId", formData.type);
  // ... other fields
  
  // Add attachments
  if (formData.attachments && formData.attachments.length > 0) {
    for (const file of formData.attachments) {
      formDataToSubmit.append("attachments", file);
    }
  }

  // Submit complaint with attachments
  const complaintResponse = await createComplaint(formDataToSubmit).unwrap();
};
```

##### UnifiedComplaintForm.tsx
Supports both citizen and guest flows:

- **Citizen Flow**: Uses FormData with immediate submission
- **Guest Flow**: Handles attachments during OTP verification

#### 3. File Upload Handling

**File Validation:**
- Size limit: 10MB per file
- Type validation: Images (JPEG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX, TXT)
- Count limit: Maximum 5 files per complaint

**User Experience:**
- Upload progress indicators
- File preview for images
- Clear error messages for validation failures
- Drag and drop support (where implemented)

## API Endpoints

### Create Complaint with Attachments
```
POST /api/complaints
Content-Type: multipart/form-data

Form Fields:
- description: string (required)
- complaintTypeId: string (required)
- type: string (required)
- priority: string (optional, default: "MEDIUM")
- wardId: string (required)
- area: string (required)
- contactName: string (required)
- contactEmail: string (required)
- contactPhone: string (required)
- attachments: File[] (optional, max 5 files)
```

### Get Complaint with Attachments
```
GET /api/complaints/:id

Response includes:
{
  "success": true,
  "data": {
    "complaint": {
      "id": "...",
      "attachments": [
        {
          "id": "...",
          "fileName": "complaint-image-123456789.jpg",
          "originalName": "pothole.jpg",
          "mimeType": "image/jpeg",
          "size": 1024000,
          "url": "/api/uploads/complaint-image-123456789.jpg",
          "uploadedBy": {
            "id": "...",
            "fullName": "John Doe",
            "role": "CITIZEN"
          },
          "createdAt": "2025-10-16T10:30:00.000Z"
        }
      ]
    }
  }
}
```

## File Storage

### Directory Structure
```
uploads/
├── complaints/          # Complaint attachments
├── complaint-photos/    # Maintenance team photos
├── profiles/           # User profile pictures
└── logos/             # System logos
```

### File Naming Convention
Format: `complaint-{originalBaseName}-{timestamp}-{random}.{extension}`

Example: `complaint-pothole-1729075800000-123456789.jpg`

### File Access
Files are served through the upload controller:
- URL: `/api/uploads/{filename}`
- Public access for complaint attachments
- Proper MIME type headers
- Original filename in Content-Disposition header

## Security Considerations

### File Validation
1. **File Size**: Maximum 10MB per file
2. **File Type**: Whitelist of allowed MIME types
3. **File Count**: Maximum 5 files per complaint
4. **File Name**: Sanitized to prevent path traversal

### Access Control
- Attachments are linked to complaints
- Access controlled through complaint permissions
- Only authorized users can view complaint attachments
- File deletion requires proper permissions

### Storage Security
- Files stored outside web root when possible
- Unique filenames prevent conflicts and guessing
- Regular cleanup of orphaned files (planned)

## Error Handling

### Backend Errors
- File size exceeded: HTTP 413 with clear message
- Invalid file type: HTTP 400 with supported types list
- Storage errors: HTTP 500 with generic message
- Validation errors: HTTP 400 with field-specific messages

### Frontend Errors
- File validation errors shown immediately
- Upload progress with cancel option
- Graceful degradation if upload fails
- Retry mechanisms for network failures

## Testing

### Manual Testing Checklist
- [ ] Upload single image attachment
- [ ] Upload multiple attachments (2-5 files)
- [ ] Upload different file types (JPG, PNG, PDF)
- [ ] Test file size limits (try >10MB file)
- [ ] Test unsupported file types
- [ ] Test with no attachments
- [ ] Verify attachments display in complaint details
- [ ] Test download functionality
- [ ] Test across all user roles

### Automated Testing
- Unit tests for file validation
- Integration tests for complaint creation with attachments
- API tests for multipart/form-data handling
- Database tests for attachment records

## Troubleshooting

### Common Issues

#### Attachments Not Displaying
1. Check if attachment records exist in database
2. Verify file exists on disk in uploads/complaints/
3. Check file permissions
4. Verify URL generation in attachment records

#### Upload Failures
1. Check file size (must be ≤10MB)
2. Verify file type is supported
3. Check disk space on server
4. Verify upload directory permissions
5. Check network connectivity

#### Performance Issues
1. Monitor file upload times
2. Check server disk I/O
3. Consider CDN for file serving
4. Implement file compression if needed

### Debug Information
Enable debug logging in complaint controller:
```javascript
console.log("🔥 [createComplaint] Files:", req.files?.length || 0);
```

### Database Queries
Check attachment records:
```sql
SELECT * FROM attachment WHERE complaintId = 'complaint-id';
```

## Future Enhancements

### Planned Features
- [ ] Image compression before upload
- [ ] Thumbnail generation for images
- [ ] Bulk file operations
- [ ] File versioning
- [ ] Cloud storage integration (S3, etc.)
- [ ] Virus scanning for uploads
- [ ] Automatic file cleanup for old complaints

### Performance Optimizations
- [ ] Lazy loading of attachments
- [ ] CDN integration for file serving
- [ ] Image optimization pipeline
- [ ] Caching strategies for frequently accessed files

## Migration Notes

### Existing Complaints
- Complaints created before this update will not have attachments
- The system gracefully handles complaints without attachments
- No database migration required for existing data

### Backward Compatibility
- JSON-based complaint creation still supported
- Existing API clients continue to work
- Gradual migration path for frontend components