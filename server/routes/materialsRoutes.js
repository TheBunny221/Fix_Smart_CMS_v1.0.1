import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getComplaintMaterials,
  addComplaintMaterial,
  updateMaterial,
  deleteMaterial,
} from "../controller/materialsController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Materials
 *   description: Material management for complaint resolution
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Material:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique material identifier
 *         complaintId:
 *           type: string
 *           description: Associated complaint ID
 *         name:
 *           type: string
 *           description: Material name
 *           example: "Cement bags"
 *         description:
 *           type: string
 *           description: Material description
 *           example: "50kg cement bags for road repair"
 *         quantity:
 *           type: number
 *           description: Quantity required/used
 *           example: 10
 *         unit:
 *           type: string
 *           description: Unit of measurement
 *           example: "bags"
 *         estimatedCost:
 *           type: number
 *           description: Estimated cost per unit
 *           example: 350.00
 *         actualCost:
 *           type: number
 *           description: Actual cost incurred
 *           example: 340.00
 *         supplier:
 *           type: string
 *           description: Material supplier
 *           example: "ABC Construction Supplies"
 *         status:
 *           type: string
 *           enum: ["REQUIRED", "ORDERED", "DELIVERED", "USED"]
 *           description: Material status
 *           example: "DELIVERED"
 *         addedById:
 *           type: string
 *           description: ID of user who added the material
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     MaterialRequest:
 *       type: object
 *       required:
 *         - name
 *         - quantity
 *         - unit
 *       properties:
 *         name:
 *           type: string
 *           example: "Cement bags"
 *         description:
 *           type: string
 *           example: "50kg cement bags for road repair"
 *         quantity:
 *           type: number
 *           example: 10
 *         unit:
 *           type: string
 *           example: "bags"
 *         estimatedCost:
 *           type: number
 *           example: 350.00
 *         supplier:
 *           type: string
 *           example: "ABC Construction Supplies"
 *         status:
 *           type: string
 *           enum: ["REQUIRED", "ORDERED", "DELIVERED", "USED"]
 *           default: "REQUIRED"
 */

/**
 * @swagger
 * /api/complaints/{id}/materials:
 *   get:
 *     summary: Get materials for a complaint
 *     tags: [Materials]
 *     description: Retrieve all materials associated with a specific complaint
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Materials retrieved successfully
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
 *                     $ref: '#/components/schemas/Material'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Complaint not found
 */
// Complaint materials routes
router.get(
  "/complaints/:id/materials",
  protect,
  authorize("MAINTENANCE_TEAM", "WARD_OFFICER", "ADMINISTRATOR"),
  getComplaintMaterials,
);

/**
 * @swagger
 * /api/complaints/{id}/materials:
 *   post:
 *     summary: Add material to complaint
 *     tags: [Materials]
 *     description: Add a new material requirement to a complaint (Maintenance Team only)
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MaterialRequest'
 *     responses:
 *       201:
 *         description: Material added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Material'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Complaint not found
 */
router.post(
  "/complaints/:id/materials",
  protect,
  authorize("MAINTENANCE_TEAM"),
  addComplaintMaterial,
);

/**
 * @swagger
 * /api/materials/{id}:
 *   put:
 *     summary: Update material details
 *     tags: [Materials]
 *     description: Update material information (Maintenance Team only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Material ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               estimatedCost:
 *                 type: number
 *               actualCost:
 *                 type: number
 *               supplier:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: ["REQUIRED", "ORDERED", "DELIVERED", "USED"]
 *     responses:
 *       200:
 *         description: Material updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Material'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Material not found
 */
// Individual material routes
router.put(
  "/materials/:id",
  protect,
  authorize("MAINTENANCE_TEAM"),
  updateMaterial,
);

/**
 * @swagger
 * /api/materials/{id}:
 *   delete:
 *     summary: Delete material
 *     tags: [Materials]
 *     description: Remove a material from complaint (Maintenance Team only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Material ID
 *     responses:
 *       200:
 *         description: Material deleted successfully
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
 *         description: Material not found
 */
router.delete(
  "/materials/:id",
  protect,
  authorize("MAINTENANCE_TEAM"),
  deleteMaterial,
);

export default router;
