import express from "express";
import {
  getSystemSettings,
  getSystemSettingByKey,
  createOrUpdateSystemSetting,
  updateSystemSetting,
  deleteSystemSetting,
  resetSystemSettings,
  getSystemHealth,
  getPublicSystemSettings,
  bulkUpdateSystemSettings,
  syncConfigurationsFromSeedEndpoint,
  auditSystemConfiguration,
  validateSystemConfiguration,
  getCanonicalKeysMapping,
} from "../controller/systemConfigController.js";
import { protect, authorize } from "../middleware/auth.js";
import { body, param } from "express-validator";
import { handleValidationErrors, validateSystemConfigBulk, sanitizeInputs } from "../middleware/validation.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/public", getPublicSystemSettings);

/**
 * @swagger
 * /api/system-config/boundary/data:
 *   get:
 *     summary: Get system boundary configuration (public endpoint)
 *     tags: [System Config]
 *     responses:
 *       200:
 *         description: Boundary configuration data
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
 *                     boundary:
 *                       type: object
 *                       description: GeoJSON boundary data
 *                     defaultLat:
 *                       type: number
 *                     defaultLng:
 *                       type: number
 *                     mapPlace:
 *                       type: string
 *                     countryCodes:
 *                       type: string
 *                     bbox:
 *                       type: object
 *                       properties:
 *                         north:
 *                           type: number
 *                         south:
 *                           type: number
 *                         east:
 *                           type: number
 *                         west:
 *                           type: number
 */
// Public endpoint for boundary data (no authentication required)
router.get("/boundary/data", async (req, res) => {
  try {
    const { getActiveSystemConfigs } = await import("../controller/systemConfigController.js");
    
    const configs = await getActiveSystemConfigs([
      "SERVICE_AREA_BOUNDARY",
      "SERVICE_AREA_VALIDATION_ENABLED",
      "MAP_DEFAULT_LAT",
      "MAP_DEFAULT_LNG", 
      "MAP_SEARCH_PLACE",
      "MAP_COUNTRY_CODES"
    ]);

    // Parse SERVICE_AREA_BOUNDARY to extract boundary and derive bbox
    let boundary = null;
    let bbox = null;
    
    if (configs.SERVICE_AREA_BOUNDARY) {
      try {
        boundary = JSON.parse(configs.SERVICE_AREA_BOUNDARY);
        
        // Extract bounding box from GeoJSON polygon
        if (boundary && boundary.type === 'Polygon' && boundary.coordinates && boundary.coordinates[0]) {
          const coordinates = boundary.coordinates[0];
          let minLat = Infinity, maxLat = -Infinity;
          let minLng = Infinity, maxLng = -Infinity;
          
          coordinates.forEach(([lng, lat]) => {
            if (typeof lat === 'number' && typeof lng === 'number') {
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
            }
          });
          
          if (isFinite(minLat) && isFinite(maxLat) && isFinite(minLng) && isFinite(maxLng)) {
            bbox = {
              north: maxLat,
              south: minLat,
              east: maxLng,
              west: minLng
            };
          }
        }
      } catch (error) {
        console.warn("Invalid SERVICE_AREA_BOUNDARY configuration:", error);
      }
    }
    
    // Fallback bbox if boundary parsing failed (using Ahmedabad coordinates)
    if (!bbox) {
      bbox = {
        north: 23.1500,
        south: 22.9500,
        east: 72.7000,
        west: 72.4500
      };
    }

    // Default values as fallback (using Ahmedabad coordinates)
    const defaultLat = parseFloat(configs.MAP_DEFAULT_LAT || "23.0225");
    const defaultLng = parseFloat(configs.MAP_DEFAULT_LNG || "72.5714");
    const mapPlace = configs.MAP_SEARCH_PLACE || "Ahmedabad, Gujarat, India";
    const countryCodes = configs.MAP_COUNTRY_CODES || "in";
    const validationEnabled = configs.SERVICE_AREA_VALIDATION_ENABLED === "true";

    res.status(200).json({
      success: true,
      data: {
        boundary,
        bbox,
        defaultLat,
        defaultLng,
        mapPlace,
        countryCodes,
        validationEnabled
      }
    });
  } catch (error) {
    console.error("Error fetching boundary configuration:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch boundary configuration",
      error: error.message
    });
  }
});

// Validation middleware for system settings
const validateSystemSetting = [
  body("key")
    .notEmpty()
    .withMessage("Key is required")
    .matches(/^[A-Z_][A-Z0-9_]*$/)
    .withMessage("Key must be uppercase letters and underscores only"),
  body("value").notEmpty().withMessage("Value is required"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("type")
    .optional()
    .isIn(["string", "number", "boolean", "json"])
    .withMessage("Type must be one of: string, number, boolean, json"),
  handleValidationErrors,
];

const validateKeyParam = [
  param("key")
    .matches(/^[A-Z_][A-Z0-9_]*$/)
    .withMessage("Key must be uppercase letters and underscores only"),
  handleValidationErrors,
];

// All routes require admin access
router.use(protect);
router.use(authorize("ADMINISTRATOR"));
router.use(sanitizeInputs); // Sanitize all inputs for system config routes

/**
 * @swagger
 * components:
 *   schemas:
 *     SystemSetting:
 *       type: object
 *       required:
 *         - key
 *         - value
 *       properties:
 *         key:
 *           type: string
 *           description: Setting key (uppercase with underscores)
 *         value:
 *           type: string
 *           description: Setting value
 *         description:
 *           type: string
 *           description: Description of the setting
 *         type:
 *           type: string
 *           enum: [string, number, boolean, json]
 *           description: Data type of the value
 *         isActive:
 *           type: boolean
 *           description: Whether the setting is active
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/system-config:
 *   get:
 *     summary: Get all system settings
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all system settings
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
 *                     $ref: '#/components/schemas/SystemSetting'
 */
router.get("/", getSystemSettings);

/**
 * @swagger
 * /api/system-config/health:
 *   get:
 *     summary: Get system health status
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health information
 */
router.get("/health", getSystemHealth);

/**
 * @swagger
 * /api/system-config/reset:
 *   post:
 *     summary: Reset system settings to defaults
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings reset successfully
 */
router.post("/reset", resetSystemSettings);

/**
 * @swagger
 * /api/system-config/sync:
 *   post:
 *     summary: Sync configurations from seed.json
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configurations synced successfully
 */
router.post("/sync", syncConfigurationsFromSeedEndpoint);

/**
 * @swagger
 * /api/system-config/audit:
 *   get:
 *     summary: Audit system configuration for inconsistencies and issues
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration audit completed successfully
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
 *                     databaseConfigs:
 *                       type: array
 *                       items:
 *                         type: object
 *                     seedConfigs:
 *                       type: array
 *                       items:
 *                         type: object
 *                     duplicateKeys:
 *                       type: array
 *                       items:
 *                         type: string
 *                     missingKeys:
 *                       type: array
 *                       items:
 *                         type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get("/audit", auditSystemConfiguration);

/**
 * @swagger
 * /api/system-config/validate:
 *   get:
 *     summary: Validate system configuration integrity
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration validation completed successfully
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
 *                     isValid:
 *                       type: boolean
 *                     validationErrors:
 *                       type: array
 *                       items:
 *                         type: object
 *                     configIntegrity:
 *                       type: object
 *                     statistics:
 *                       type: object
 */
router.get("/validate", validateSystemConfiguration);

/**
 * @swagger
 * /api/system-config/canonical-keys:
 *   get:
 *     summary: Get canonical configuration keys mapping
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Canonical keys mapping generated successfully
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
 *                     canonicalKeys:
 *                       type: object
 *                     duplicateGroups:
 *                       type: array
 *                       items:
 *                         type: object
 *                     migrationPlan:
 *                       type: array
 *                       items:
 *                         type: object
 *                     statistics:
 *                       type: object
 */
router.get("/canonical-keys", getCanonicalKeysMapping);

/**
 * @swagger
 * /api/system-config/bulk:
 *   put:
 *     summary: Bulk update system settings
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/SystemSetting'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put("/bulk", validateSystemConfigBulk, bulkUpdateSystemSettings);

/**
 * @swagger
 * /api/system-config:
 *   post:
 *     summary: Create or update system setting
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SystemSetting'
 *     responses:
 *       200:
 *         description: System setting saved successfully
 */
router.post("/", validateSystemSetting, createOrUpdateSystemSetting);

/**
 * @swagger
 * /api/system-config/{key}:
 *   get:
 *     summary: Get system setting by key
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: System setting details
 *       404:
 *         description: Setting not found
 */
router.get("/:key", validateKeyParam, getSystemSettingByKey);

/**
 * @swagger
 * /api/system-config/{key}:
 *   put:
 *     summary: Update system setting
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *       404:
 *         description: Setting not found
 */
router.put("/:key", validateKeyParam, updateSystemSetting);

/**
 * @swagger
 * /api/system-config/{key}:
 *   delete:
 *     summary: Delete system setting
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setting deleted successfully
 *       404:
 *         description: Setting not found
 */
router.delete("/:key", validateKeyParam, deleteSystemSetting);

export default router;