/**
 * SystemConfig Routes
 * 
 * API routes for system configuration management
 * 
 * @version 1.0.3
 * @author Fix_Smart_CMS Team
 */

import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getPublicConfig,
  getAdminConfig,
  updateConfig,
  deleteConfig,
  refreshCache,
  getCacheStats,
  bulkUpdateConfig,
  getConfigByType,
  getConfigByPattern,
  createConfig
} from "../controller/systemConfigController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: SystemConfig
 *   description: System configuration management
 */

/**
 * @swagger
 * /api/config/public:
 *   get:
 *     summary: Get public system configuration
 *     tags: [SystemConfig]
 *     description: Retrieve public system configuration values for frontend use
 *     responses:
 *       200:
 *         description: Public configuration retrieved successfully
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
 *                     appName:
 *                       type: string
 *                       example: "Fix_Smart_CMS"
 *                     appVersion:
 *                       type: string
 *                       example: "1.0.3"
 *                     organizationName:
 *                       type: string
 *                       example: "Smart City Management"
 *                     websiteUrl:
 *                       type: string
 *                       example: "https://fix-smart-cms.gov.in"
 *                     logoUrl:
 *                       type: string
 *                       nullable: true
 *                     primaryColor:
 *                       type: string
 *                       example: "#667eea"
 *                     secondaryColor:
 *                       type: string
 *                       example: "#764ba2"
 *                     supportEmail:
 *                       type: string
 *                       example: "support@fix-smart-cms.gov.in"
 *                     complaintIdPrefix:
 *                       type: string
 *                       example: "KSC"
 *                     complaintIdLength:
 *                       type: integer
 *                       example: 4
 *                     autoAssignComplaints:
 *                       type: boolean
 *                     maintenanceMode:
 *                       type: boolean
 *                     registrationEnabled:
 *                       type: boolean
 *                 cached:
 *                   type: object
 *                   properties:
 *                     isInitialized:
 *                       type: boolean
 *                     configCount:
 *                       type: integer
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 */
router.get("/public", getPublicConfig);

// Protected routes - require authentication
router.use(protect);

/**
 * @swagger
 * /api/config/stats:
 *   get:
 *     summary: Get cache statistics
 *     tags: [SystemConfig]
 *     security:
 *       - bearerAuth: []
 *     description: Get system configuration cache statistics (Admin only)
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
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
 *                     isInitialized:
 *                       type: boolean
 *                     configCount:
 *                       type: integer
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                     refreshInterval:
 *                       type: integer
 *                     hasAutoRefresh:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/stats", authorize("ADMINISTRATOR"), getCacheStats);

/**
 * @swagger
 * /api/config/admin:
 *   get:
 *     summary: Get all system configuration (Admin only)
 *     tags: [SystemConfig]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all system configuration values including sensitive data
 *     responses:
 *       200:
 *         description: Admin configuration retrieved successfully
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
 *                     cached:
 *                       type: object
 *                       description: Cached configuration values
 *                     database:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           key:
 *                             type: string
 *                           value:
 *                             type: string
 *                           type:
 *                             type: string
 *                           description:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     cacheStats:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/admin", authorize("ADMINISTRATOR"), getAdminConfig);

/**
 * @swagger
 * /api/config/refresh:
 *   post:
 *     summary: Refresh configuration cache
 *     tags: [SystemConfig]
 *     security:
 *       - bearerAuth: []
 *     description: Manually refresh the system configuration cache
 *     responses:
 *       200:
 *         description: Cache refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post("/refresh", authorize("ADMINISTRATOR"), refreshCache);

/**
 * @swagger
 * /api/config:
 *   post:
 *     summary: Create new system configuration
 *     tags: [SystemConfig]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SystemConfigCreateRequest'
 *     responses:
 *       201:
 *         description: Configuration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/SystemConfig'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Configuration key already exists
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post("/", authorize("ADMINISTRATOR"), createConfig);

/**
 * @swagger
 * /api/config/bulk:
 *   post:
 *     summary: Bulk update system configurations
 *     tags: [SystemConfig]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SystemConfigBulkUpdateRequest'
 *     responses:
 *       200:
 *         description: Bulk update completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SystemConfig'
 *                     created:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SystemConfig'
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                           error:
 *                             type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post("/bulk", authorize("ADMINISTRATOR"), bulkUpdateConfig);

/**
 * @swagger
 * /api/config/type/{type}:
 *   get:
 *     summary: Get configurations by type
 *     tags: [SystemConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: path
 *         required: true
 *         description: Configuration type
 *         schema:
 *           type: string
 *           example: "app"
 *     responses:
 *       200:
 *         description: Configurations retrieved successfully
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
 *                     type:
 *                       type: string
 *                     configs:
 *                       type: object
 *                       additionalProperties:
 *                         type: string
 *                     count:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/type/:type", authorize("ADMINISTRATOR"), getConfigByType);

/**
 * @swagger
 * /api/config/pattern/{pattern}:
 *   get:
 *     summary: Get configurations by pattern
 *     tags: [SystemConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: pattern
 *         in: path
 *         required: true
 *         description: Pattern to match against configuration keys
 *         schema:
 *           type: string
 *           example: "COMPLAINT_"
 *       - name: matchType
 *         in: query
 *         description: Type of pattern matching
 *         schema:
 *           type: string
 *           enum: [startsWith, endsWith, includes]
 *           default: startsWith
 *     responses:
 *       200:
 *         description: Configurations retrieved successfully
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
 *                     pattern:
 *                       type: string
 *                     matchType:
 *                       type: string
 *                     configs:
 *                       type: object
 *                       additionalProperties:
 *                         type: string
 *                     count:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/pattern/:pattern", authorize("ADMINISTRATOR"), getConfigByPattern);

/**
 * @swagger
 * /api/config/{key}:
 *   put:
 *     summary: Update system configuration
 *     tags: [SystemConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         description: Configuration key to update
 *         schema:
 *           type: string
 *           example: "APP_NAME"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: string
 *                 description: Configuration value
 *                 example: "My Smart CMS"
 *               type:
 *                 type: string
 *                 description: Configuration type/category
 *                 example: "app"
 *               description:
 *                 type: string
 *                 description: Configuration description
 *                 example: "Application display name"
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put("/:key", authorize("ADMINISTRATOR"), updateConfig);

/**
 * @swagger
 * /api/config/{key}:
 *   delete:
 *     summary: Delete system configuration
 *     tags: [SystemConfig]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         description: Configuration key to delete
 *         schema:
 *           type: string
 *           example: "DEPRECATED_SETTING"
 *     responses:
 *       200:
 *         description: Configuration deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.delete("/:key", authorize("ADMINISTRATOR"), deleteConfig);

export default router;