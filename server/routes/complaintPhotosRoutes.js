import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getComplaintPhotos,
  uploadComplaintPhotos,
  updatePhotoDescription,
  deleteComplaintPhoto,
  getComplaintPhoto,
  uploadPhoto,
} from "../controller/complaintPhotosController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Complaint Photos
 *   description: Photo management for complaint documentation and progress tracking
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ComplaintPhoto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique photo identifier
 *         complaintId:
 *           type: string
 *           description: Associated complaint ID
 *         fileName:
 *           type: string
 *           description: Stored file name
 *         originalName:
 *           type: string
 *           description: Original file name
 *         url:
 *           type: string
 *           description: Photo access URL
 *         description:
 *           type: string
 *           description: Photo description or caption
 *           example: "Before repair - damaged road section"
 *         photoType:
 *           type: string
 *           enum: ["BEFORE", "DURING", "AFTER", "EVIDENCE"]
 *           description: Type of photo for categorization
 *           example: "BEFORE"
 *         uploadedById:
 *           type: string
 *           description: ID of user who uploaded the photo
 *         uploadedBy:
 *           $ref: '#/components/schemas/User'
 *         mimeType:
 *           type: string
 *           description: File MIME type
 *           example: "image/jpeg"
 *         size:
 *           type: integer
 *           description: File size in bytes
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     PhotoUploadRequest:
 *       type: object
 *       properties:
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: Photo files to upload (max 10 files)
 *         descriptions:
 *           type: array
 *           items:
 *             type: string
 *           description: Descriptions for each photo (optional)
 *         photoTypes:
 *           type: array
 *           items:
 *             type: string
 *             enum: ["BEFORE", "DURING", "AFTER", "EVIDENCE"]
 *           description: Types for each photo (optional)
 */

/**
 * @swagger
 * /api/complaints/{id}/photos:
 *   get:
 *     summary: Get photos for a complaint
 *     tags: [Complaint Photos]
 *     description: Retrieve all photos associated with a specific complaint
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *       - in: query
 *         name: photoType
 *         schema:
 *           type: string
 *           enum: ["BEFORE", "DURING", "AFTER", "EVIDENCE"]
 *         description: Filter by photo type
 *     responses:
 *       200:
 *         description: Photos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ComplaintPhoto'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Complaint not found
 */
// Complaint photos routes
router.get(
  "/complaints/:id/photos",
  protect,
  authorize("MAINTENANCE_TEAM", "WARD_OFFICER", "ADMINISTRATOR", "CITIZEN"),
  getComplaintPhotos,
);

/**
 * @swagger
 * /api/complaints/{id}/photos:
 *   post:
 *     summary: Upload photos for a complaint
 *     tags: [Complaint Photos]
 *     description: Upload multiple photos for complaint documentation (Maintenance Team only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PhotoUploadRequest'
 *           encoding:
 *             photos:
 *               contentType: image/*
 *     responses:
 *       201:
 *         description: Photos uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadedPhotos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ComplaintPhoto'
 *                     totalUploaded:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Complaint not found
 *       413:
 *         description: File too large
 *       415:
 *         description: Unsupported file type
 */
router.post(
  "/complaints/:id/photos",
  protect,
  authorize("MAINTENANCE_TEAM"),
  uploadPhoto.array("photos", 10),
  uploadComplaintPhotos,
);

/**
 * @swagger
 * /api/complaint-photos/{id}:
 *   get:
 *     summary: Get specific complaint photo
 *     tags: [Complaint Photos]
 *     description: Retrieve a specific photo by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo ID
 *     responses:
 *       200:
 *         description: Photo retrieved successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Photo not found
 */
// Individual photo routes
router.get(
  "/complaint-photos/:id",
  protect,
  authorize("MAINTENANCE_TEAM", "WARD_OFFICER", "ADMINISTRATOR", "CITIZEN"),
  getComplaintPhoto,
);

/**
 * @swagger
 * /api/complaint-photos/{id}:
 *   put:
 *     summary: Update photo description
 *     tags: [Complaint Photos]
 *     description: Update the description or metadata of a complaint photo (Maintenance Team only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: New photo description
 *               photoType:
 *                 type: string
 *                 enum: ["BEFORE", "DURING", "AFTER", "EVIDENCE"]
 *                 description: Photo type/category
 *     responses:
 *       200:
 *         description: Photo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ComplaintPhoto'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Photo not found
 */
router.put(
  "/complaint-photos/:id",
  protect,
  authorize("MAINTENANCE_TEAM"),
  updatePhotoDescription,
);

/**
 * @swagger
 * /api/complaint-photos/{id}:
 *   delete:
 *     summary: Delete complaint photo
 *     tags: [Complaint Photos]
 *     description: Remove a photo from complaint (Maintenance Team only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Photo ID
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Photo not found
 */
router.delete(
  "/complaint-photos/:id",
  protect,
  authorize("MAINTENANCE_TEAM"),
  deleteComplaintPhoto,
);

export default router;
