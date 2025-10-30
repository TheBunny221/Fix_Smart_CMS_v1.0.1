# Branding Configuration

This document explains how to update and manage the application logo.

## Overview

The application supports dynamic logo management, allowing administrators to upload and change the application logo without requiring code changes or server restarts.

## How to Update the Application Logo

1. **Navigate to System Settings → Application Branding**
   - Log in as an administrator
   - Go to System Settings from the admin menu
   - Expand the "Application Branding" section

2. **Upload your logo image**
   - Click "Choose Files" to select your logo
   - Supported formats: PNG, JPG, SVG
   - Maximum file size: 2MB
   - The system will show a preview of your selected logo

3. **Apply the changes**
   - Click "Upload Logo" to apply the new logo
   - The uploaded logo replaces the existing `/uploads/logo.png` file
   - The new logo is used across all modules automatically

## Technical Details

### File Storage
- Uploaded logos are stored as `/uploads/logo.png`
- The system automatically replaces any existing logo file
- The logo is served statically and cached for performance

### Fallback Behavior
- If the uploaded logo is missing or fails to load, the system reverts to the default static logo from `/assets/`
- The fallback ensures the application always displays a logo

### Logo Display
- The logo is dynamically rendered in the navigation header
- Logo size can be configured through system settings (small, medium, large)
- The logo is responsive and adapts to different screen sizes

## File Requirements

- **Supported formats**: PNG, JPEG, SVG
- **Maximum file size**: 2MB
- **Recommended dimensions**: 200x200 pixels or similar square aspect ratio
- **Recommended format**: PNG with transparent background for best results

## Troubleshooting

### Logo not updating after upload
- Clear your browser cache and refresh the page
- Check that the file was uploaded successfully (should show success message)
- Verify the file meets the size and format requirements

### Logo appears broken or doesn't load
- The system will automatically fall back to the default logo
- Check the browser console for any error messages
- Ensure the uploaded file is not corrupted

### Upload fails
- Verify you have administrator permissions
- Check that the file size is under 2MB
- Ensure the file format is PNG, JPG, or SVG
- Try uploading a different image file

## API Integration

The logo upload feature uses the existing file upload API:
- **Endpoint**: `POST /api/uploads/logo`
- **Authentication**: Admin-level access required
- **Content-Type**: `multipart/form-data`
- **Field name**: `logo`

## Security Considerations

- Only administrators can upload logos
- File type validation prevents malicious uploads
- File size limits prevent abuse
- Uploaded files are stored in a secure directory