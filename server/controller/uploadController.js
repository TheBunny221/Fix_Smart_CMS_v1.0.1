import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import fs from "fs";
import path from "path";

const prisma = getPrisma();

// @desc    Upload complaint attachment
// @route   POST /api/uploads/complaint/:complaintId/attachment
// @access  Public (for guest complaints) / Private (for authenticated users)
export const uploadComplaintAttachment = asyncHandler(async (req, res) => {
  const { complaintId } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
      data: null,
    });
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (req.file.size > maxSize) {
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(413).json({
      success: false,
      message: "File size too large. Maximum allowed size is 10MB.",
      data: null,
    });
  }

  // Validate mime type (images and documents only)
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message:
        "Invalid file type. Only images (JPEG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX, TXT) are allowed.",
      data: null,
    });
  }

  // Check if complaint exists and user has permission
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: {
      id: true,
      submittedById: true,
      wardId: true,
      assignedToId: true,
      maintenanceTeamId: true,
      wardOfficerId: true,
    },
  });

  if (!complaint) {
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
      data: null,
    });
  }

  // Server-side authorization check - only allow authorized users to upload attachments
  if (req.user) {
    const isAuthorized =
      req.user.role === "ADMINISTRATOR" ||
      complaint.submittedById === req.user.id ||
      (req.user.role === "WARD_OFFICER" && 
       (complaint.wardId === req.user.wardId || complaint.wardOfficerId === req.user.id)) ||
      (req.user.role === "MAINTENANCE_TEAM" && 
       (complaint.assignedToId === req.user.id || complaint.maintenanceTeamId === req.user.id));

    if (!isAuthorized) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to upload attachments to this complaint.",
        data: null,
      });
    }
  }

  // Create attachment record
  const attachment = await prisma.attachment.create({
    data: {
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/api/uploads/${req.file.filename}`,
      complaintId: complaintId,
      entityType: "COMPLAINT",
      entityId: complaintId,
      uploadedById: req.user?.id ?? null,
    },
  });

  res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    data: {
      id: attachment.id,
      fileName: attachment.fileName,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      url: attachment.url,
      entityType: attachment.entityType,
      entityId: attachment.entityId,
      createdAt: attachment.createdAt,
    },
  });
});

// @desc    Upload profile picture
// @route   POST /api/uploads/profile/picture
// @access  Private
export const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
      data: null,
    });
  }

  // Update user's avatar field
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      avatar: `/api/uploads/profile/${req.file.filename}`,
    },
  });

  res.status(200).json({
    success: true,
    message: "Profile picture uploaded successfully",
    data: {
      filename: req.file.filename,
      url: `/api/uploads/profile/${req.file.filename}`,
    },
  });
});

// @desc    Upload app logo
// @route   POST /api/uploads/logo
// @access  Private (Admin only)
export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
      data: null,
    });
  }

  // Validate file size (max 5MB for logos)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (req.file.size > maxSize) {
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(413).json({
      success: false,
      message: "File size too large. Maximum allowed size is 5MB.",
      data: null,
    });
  }

  // Validate mime type (images only for logos)
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message:
        "Invalid file type. Please upload a valid image file (JPEG, PNG, GIF, WEBP, SVG).",
      data: null,
    });
  }

  // Move the uploaded file to uploads/logo.png (replacing any existing logo)
  const uploadDir = process.env.UPLOAD_PATH || "./uploads";
  const targetPath = path.join(uploadDir, "logo.png");
  
  // Remove existing logo.png if it exists
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
  
  // Move the uploaded file to logo.png
  fs.renameSync(req.file.path, targetPath);
  
  // Update APP_LOGO_URL system setting to point to the uploads folder
  const logoUrl = "/uploads/logo.png";

  await prisma.systemConfig.upsert({
    where: { key: "APP_LOGO_URL" },
    create: {
      key: "APP_LOGO_URL",
      value: logoUrl,
      description: "URL for the application logo",
    },
    update: {
      value: logoUrl,
    },
  });

  res.status(200).json({
    success: true,
    message: "Logo uploaded successfully",
    data: {
      filename: "logo.png",
      url: logoUrl,
      originalName: req.file.originalname,
      size: req.file.size,
    },
  });
});

// @desc    Get uploaded file
// @route   GET /api/uploads/:filename
// @access  Public
export const getAttachment = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const uploadDir = process.env.UPLOAD_PATH || "./uploads";

  // Find attachment in database for authorization check
  const attachment = await prisma.attachment.findFirst({
    where: { fileName: filename },
    include: {
      complaint: {
        select: {
          id: true,
          submittedById: true,
          wardId: true,
          assignedToId: true,
          maintenanceTeamId: true,
          wardOfficerId: true,
        },
      },
    },
  });

  // Server-side authorization check
  if (attachment && attachment.complaint && req.user) {
    const complaint = attachment.complaint;
    const isAuthorized =
      req.user.role === "ADMINISTRATOR" ||
      complaint.submittedById === req.user.id ||
      (req.user.role === "WARD_OFFICER" && 
       (complaint.wardId === req.user.wardId || complaint.wardOfficerId === req.user.id)) ||
      (req.user.role === "MAINTENANCE_TEAM" && 
       (complaint.assignedToId === req.user.id || complaint.maintenanceTeamId === req.user.id));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to view this file.",
        data: null,
      });
    }
  }

  // Try different possible file paths
  const possiblePaths = [
    path.join(uploadDir, filename), // Direct in uploads
    path.join(uploadDir, "complaints", filename), // In complaints subdirectory
    path.join(uploadDir, "profiles", filename), // In profiles subdirectory
    path.join(uploadDir, "logos", filename), // In logos subdirectory
    path.join(uploadDir, "complaint-photos", filename), // In complaint-photos subdirectory
  ];

  let filePath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      filePath = possiblePath;
      break;
    }
  }

  // Check if file exists on disk
  if (!filePath) {
    return res.status(404).json({
      success: false,
      message: "File not found on server",
      data: null,
    });
  }

  if (attachment) {
    // Set appropriate headers with original name
    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${attachment.originalName}"`,
    );
  } else {
    // Fallback for files not in database
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".pdf": "application/pdf",
    };
    res.setHeader(
      "Content-Type",
      contentTypes[ext] || "application/octet-stream",
    );
  }

  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// @desc    Delete uploaded file
// @route   DELETE /api/uploads/:id
// @access  Private
export const deleteAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: {
      complaint: {
        select: {
          id: true,
          submittedById: true,
        },
      },
    },
  });

  if (!attachment) {
    return res.status(404).json({
      success: false,
      message: "File not found",
      data: null,
    });
  }

  // Check permissions - only complaint owner or admin can delete
  const isAdmin = req.user.role === "ADMINISTRATOR";
  const isComplaintOwner =
    attachment.entityType === "COMPLAINT" &&
    attachment.complaint &&
    attachment.complaint.submittedById === req.user.id;
  const isUploader = attachment.uploadedById === req.user.id;

  if (!isAdmin && !isComplaintOwner && !isUploader) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this file",
      data: null,
    });
  }

  // Construct file path
  const baseUploadPath = process.env.UPLOAD_PATH || "./uploads";
  const possibleLocations = [
    path.join(baseUploadPath, attachment.fileName),
    path.join(baseUploadPath, "complaints", attachment.fileName),
    path.join(baseUploadPath, "profiles", attachment.fileName),
    path.join(baseUploadPath, "logos", attachment.fileName),
  ];

  let filePath = null;
  for (const candidate of possibleLocations) {
    if (fs.existsSync(candidate)) {
      filePath = candidate;
      break;
    }
  }

  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete file from disk
  // Delete database record
  await prisma.attachment.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: "File deleted successfully",
    data: null,
  });
});

// @desc    Get profile picture
// @route   GET /api/uploads/profile/:filename
// @access  Public
export const getProfilePicture = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(
    process.env.UPLOAD_PATH || "./uploads",
    "profiles",
    filename,
  );

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: "Profile picture not found",
      data: null,
    });
  }

  // Determine content type based on file extension
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
  };

  const contentType = contentTypes[ext] || "application/octet-stream";

  // Set headers and stream file
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});
