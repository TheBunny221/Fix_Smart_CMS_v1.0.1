import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = getPrisma();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const baseUploadDir =
      process.env.UPLOAD_PATH || path.join(__dirname, "../../uploads");
    const uploadDir = path.join(baseUploadDir, "complaint-photos");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `complaint-${req.params.id}-${uniqueSuffix}${fileExtension}`);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP image files are allowed!"), false);
  }
};

// Configure multer with limits
export const uploadPhoto = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files at once
  },
});

// @desc    Get photos for a complaint (from unified attachments)
// @route   GET /api/complaints/:id/photos
// @access  Private (Maintenance Team, Ward Officer, Admin)
export const getComplaintPhotos = asyncHandler(async (req, res) => {
  const { id: complaintId } = req.params;

  // Check if complaint exists and user has access
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
    });
  }

  // Check authorization
  const isAuthorized =
    req.user.role === "ADMINISTRATOR" ||
    (req.user.role === "WARD_OFFICER" && complaint.wardId === req.user.wardId) ||
    (req.user.role === "MAINTENANCE_TEAM" &&
      (complaint.assignedToId === req.user.id ||
        complaint.maintenanceTeamId === req.user.id)) ||
    complaint.submittedById === req.user.id; // Allow complaint submitter to view

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to access this complaint's photos",
    });
  }

  // Fetch attachments as photos (backward-compatible shape)
  const attachments = await prisma.attachment.findMany({
    where: {
      OR: [
        { entityType: "COMPLAINT", entityId: complaintId },
        { complaintId }, // backward-compat for any legacy rows
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: {
        select: { id: true, fullName: true, role: true },
      },
    },
  });

  const photos = attachments.map((a) => ({
    // Map to previous complaintPhoto-like shape for compatibility
    id: a.id,
    complaintId: complaintId,
    uploadedByTeamId: a.uploadedById || null,
    photoUrl: a.url, // served via /api/uploads/:filename
    fileName: a.fileName,
    originalName: a.originalName,
    mimeType: a.mimeType,
    size: a.size,
    uploadedAt: a.createdAt,
    description: null,
    entityType: a.entityType,
    entityId: a.entityId,
    uploadedByTeam: a.uploadedBy
      ? { id: a.uploadedBy.id, fullName: a.uploadedBy.fullName, role: a.uploadedBy.role }
      : null,
  }));

  res.status(200).json({
    success: true,
    message: "Photos retrieved successfully",
    data: {
      photos,
    },
  });
});

// @desc    Upload photos for a complaint (to unified attachments)
// @route   POST /api/complaints/:id/photos
// @access  Private (Maintenance Team only)
export const uploadComplaintPhotos = asyncHandler(async (req, res) => {
  const { id: complaintId } = req.params;

  // Check if complaint exists
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: "Complaint not found",
    });
  }

  // Check authorization - only maintenance team assigned to this complaint
  const isAuthorized =
    req.user.role === "MAINTENANCE_TEAM" &&
    (complaint.assignedToId === req.user.id ||
      complaint.maintenanceTeamId === req.user.id);

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: "Only assigned maintenance team members can upload photos",
    });
  }

  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No photos were uploaded",
    });
  }

  try {
    // Persist as unified attachments
    const created = await Promise.all(
      req.files.map(async (file) =>
        prisma.attachment.create({
          data: {
            fileName: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: `/api/uploads/${file.filename}`,
            complaintId: complaintId,
            entityType: "COMPLAINT",
            entityId: complaintId,
            uploadedById: req.user.id,
          },
          include: {
            uploadedBy: { select: { id: true, fullName: true, role: true } },
          },
        }),
      ),
    );

    // Map to legacy response shape
    const photos = created.map((a) => ({
      id: a.id,
      complaintId: complaintId,
      uploadedByTeamId: a.uploadedById || null,
      photoUrl: a.url,
      fileName: a.fileName,
      originalName: a.originalName,
      mimeType: a.mimeType,
      size: a.size,
      uploadedAt: a.createdAt,
      description: null,
      entityType: a.entityType,
      entityId: a.entityId,
      uploadedByTeam: a.uploadedBy
        ? { id: a.uploadedBy.id, fullName: a.uploadedBy.fullName, role: a.uploadedBy.role }
        : null,
    }));

    res.status(201).json({
      success: true,
      message: `${photos.length} photo(s) uploaded successfully`,
      data: { photos },
    });
  } catch (error) {
    // Clean up uploaded files if database save fails
    req.files.forEach((file) => {
      const filePath = file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    throw error;
  }
});

// @desc    Update photo description (not supported in unified attachments)
// @route   PUT /api/complaint-photos/:id
// @access  Private (Maintenance Team - uploader only)
export const updatePhotoDescription = asyncHandler(async (req, res) => {
  const { id: photoId } = req.params;

  const attachment = await prisma.attachment.findUnique({ where: { id: photoId } });
  if (!attachment) {
    return res.status(404).json({ success: false, message: "Attachment not found" });
  }
  if (attachment.uploadedById !== req.user.id && req.user.role !== "ADMINISTRATOR") {
    return res.status(403).json({ success: false, message: "Not authorized to update this attachment" });
  }

  return res.status(400).json({
    success: false,
    message: "Photo descriptions are not supported in the unified attachments schema",
  });
});

// @desc    Delete a photo (attachment)
// @route   DELETE /api/complaint-photos/:id
// @access  Private (Maintenance Team - uploader only)
export const deleteComplaintPhoto = asyncHandler(async (req, res) => {
  const { id: photoId } = req.params;

  // Check if attachment exists
  const attachment = await prisma.attachment.findUnique({ where: { id: photoId } });

  if (!attachment) {
    return res.status(404).json({
      success: false,
      message: "Attachment not found",
    });
  }

  // Check authorization - only the uploader or admin can delete
  if (attachment.uploadedById !== req.user.id && req.user.role !== "ADMINISTRATOR") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this attachment",
    });
  }

  try {
    // Delete physical file (attempt across known paths)
    const baseUploadDir = process.env.UPLOAD_PATH || path.join(__dirname, "../../uploads");
    const candidates = [
      path.join(baseUploadDir, attachment.fileName),
      path.join(baseUploadDir, "complaint-photos", attachment.fileName),
      path.join(baseUploadDir, "complaints", attachment.fileName),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch {}
      }
    }

    // Delete database record
    await prisma.attachment.delete({ where: { id: photoId } });

    res.status(200).json({ success: true, message: "Photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    throw error;
  }
});

// @desc    Get a single photo (as attachment)
// @route   GET /api/complaint-photos/:id
// @access  Private (Authorized users)
export const getComplaintPhoto = asyncHandler(async (req, res) => {
  const { id: photoId } = req.params;

  // Check if attachment exists
  const attachment = await prisma.attachment.findUnique({
    where: { id: photoId },
    include: {
      complaint: true,
      uploadedBy: { select: { id: true, fullName: true, role: true } },
    },
  });

  if (!attachment) {
    return res.status(404).json({ success: false, message: "Attachment not found" });
  }

  const complaint = attachment.complaint;

  // Check authorization
  const isAuthorized =
    req.user.role === "ADMINISTRATOR" ||
    (req.user.role === "WARD_OFFICER" && complaint?.wardId === req.user.wardId) ||
    (req.user.role === "MAINTENANCE_TEAM" &&
      (complaint?.assignedToId === req.user.id || complaint?.maintenanceTeamId === req.user.id)) ||
    complaint?.submittedById === req.user.id;

  if (!isAuthorized) {
    return res.status(403).json({ success: false, message: "Not authorized to view this photo" });
  }

  // Backward-compatible payload
  const photo = {
    id: attachment.id,
    complaintId: complaint?.id || attachment.entityId,
    uploadedByTeamId: attachment.uploadedById || null,
    photoUrl: attachment.url,
    fileName: attachment.fileName,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    size: attachment.size,
    uploadedAt: attachment.createdAt,
    description: null,
    entityType: attachment.entityType,
    entityId: attachment.entityId,
    uploadedByTeam: attachment.uploadedBy || null,
  };

  res.status(200).json({ success: true, message: "Photo retrieved successfully", data: { photo } });
});
