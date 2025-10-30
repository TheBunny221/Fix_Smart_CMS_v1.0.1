import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sanitizeInputs, validateDateRange, validatePagination } from "../middleware/validation.js";
import {
  getUnifiedAnalytics,
  getComprehensiveAnalyticsRevamped,
  getHeatmapDataRevamped,
} from "../controller/reportsControllerRevamped.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports Revamped
 *   description: Enhanced reporting and analytics endpoints with professional UI support
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EnhancedAnalyticsData:
 *       type: object
 *       properties:
 *         complaints:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of complaints
 *             resolved:
 *               type: integer
 *               description: Number of resolved complaints
 *             pending:
 *               type: integer
 *               description: Number of pending complaints
 *             overdue:
 *               type: integer
 *               description: Number of overdue complaints
 *         sla:
 *           type: object
 *           properties:
 *             compliance:
 *               type: number
 *               description: SLA compliance percentage
 *             avgResolutionTime:
 *               type: number
 *               description: Average resolution time in days
 *             target:
 *               type: number
 *               description: SLA target in hours
 *         trends:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               complaints:
 *                 type: integer
 *               resolved:
 *                 type: integer
 *               slaCompliance:
 *                 type: number
 *         wards:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               complaints:
 *                 type: integer
 *               resolved:
 *                 type: integer
 *               avgTime:
 *                 type: number
 *               slaScore:
 *                 type: number
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               count:
 *                 type: integer
 *               avgTime:
 *                 type: number
 *               color:
 *                 type: string
 *         performance:
 *           type: object
 *           properties:
 *             userSatisfaction:
 *               type: number
 *               description: User satisfaction score (0-5)
 *             escalationRate:
 *               type: number
 *               description: Escalation rate percentage
 *             firstCallResolution:
 *               type: number
 *               description: First call resolution percentage
 *             repeatComplaints:
 *               type: number
 *               description: Repeat complaints percentage
 *         comparison:
 *           type: object
 *           properties:
 *             current:
 *               type: object
 *               description: Current period metrics
 *             previous:
 *               type: object
 *               description: Previous period metrics
 *             trends:
 *               type: object
 *               description: Trend percentages comparing periods
 *         metadata:
 *           type: object
 *           properties:
 *             totalRecords:
 *               type: integer
 *             pageSize:
 *               type: integer
 *             currentPage:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             dataFetchedAt:
 *               type: string
 *               format: date-time
 *             systemConfig:
 *               type: object
 *               properties:
 *                 appName:
 *                   type: string
 *                 appLogoUrl:
 *                   type: string
 *                 complaintIdPrefix:
 *                   type: string
 *             userContext:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                 wardId:
 *                   type: string
 *                 canViewAllWards:
 *                   type: boolean
 *     
 *     EnhancedHeatmapData:
 *       type: object
 *       properties:
 *         xLabels:
 *           type: array
 *           items:
 *             type: string
 *           description: X-axis labels (complaint types)
 *         yLabels:
 *           type: array
 *           items:
 *             type: string
 *           description: Y-axis labels (wards)
 *         matrix:
 *           type: array
 *           items:
 *             type: array
 *             items:
 *               type: integer
 *           description: 2D matrix of complaint counts
 *         xAxisLabel:
 *           type: string
 *         yAxisLabel:
 *           type: string
 *         metadata:
 *           type: object
 *           properties:
 *             totalComplaints:
 *               type: integer
 *             dateRange:
 *               type: object
 *             appliedFilters:
 *               type: object
 *     
 *     EnhancedExportData:
 *       type: object
 *       properties:
 *         complaints:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               formattedId:
 *                 type: string
 *                 description: Formatted complaint ID with system prefix
 *               typeName:
 *                 type: string
 *                 description: Resolved complaint type name
 *         summary:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             resolved:
 *               type: integer
 *             pending:
 *               type: integer
 *             overdue:
 *               type: integer
 *         systemConfig:
 *           type: object
 *           properties:
 *             appName:
 *               type: string
 *             appLogoUrl:
 *               type: string
 *             complaintIdPrefix:
 *               type: string
 *         exportedBy:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             role:
 *               type: string
 */

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/reports-revamped/unified:
 *   get:
 *     summary: Get unified analytics data for comprehensive dashboard
 *     tags: [Reports Revamped]
 *     description: |
 *       Retrieve comprehensive analytics data optimized for the unified dashboard.
 *       This endpoint provides all metrics in a single response for better performance.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unified analytics data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/reports-revamped/analytics:
 *   get:
 *     summary: Get unified analytics data for comprehensive dashboard
 *     tags: [Reports Revamped]
 *     description: |
 *       Retrieve comprehensive analytics data optimized for the unified dashboard.
 *       This endpoint provides all metrics in a single response for better performance.
 *       
 *       **Enhanced Features:**
 *       - Single endpoint for all dashboard data
 *       - Enhanced performance metrics and KPIs
 *       - Team performance analytics
 *       - Priority and status breakdowns
 *       - Period-over-period comparisons
 *       - Role-based data filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *         description: Ward ID filter (Admin only)
 *         example: "ward-123"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Complaint type filter
 *         example: "road_maintenance"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [registered, assigned, in_progress, resolved, closed, reopened]
 *         description: Complaint status filter
 *         example: "resolved"
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Complaint priority filter
 *         example: "high"
 *     responses:
 *       200:
 *         description: Unified analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Unified analytics data retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalComplaints:
 *                           type: integer
 *                         resolvedComplaints:
 *                           type: integer
 *                         pendingComplaints:
 *                           type: integer
 *                         overdueComplaints:
 *                           type: integer
 *                         reopenedComplaints:
 *                           type: integer
 *                         criticalComplaints:
 *                           type: integer
 *                         resolutionRate:
 *                           type: number
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           complaints:
 *                             type: integer
 *                           resolved:
 *                             type: integer
 *                           registered:
 *                             type: integer
 *                           assigned:
 *                             type: integer
 *                           inProgress:
 *                             type: integer
 *                           reopened:
 *                             type: integer
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           percentage:
 *                             type: number
 *                           avgTime:
 *                             type: number
 *                     teamPerformance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           role:
 *                             type: string
 *                           totalComplaints:
 *                             type: integer
 *                           resolvedComplaints:
 *                             type: integer
 *                           efficiency:
 *                             type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
  "/unified",
  protect,
  authorize("ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM", "CITIZEN"),
  sanitizeInputs,
  validateDateRange,
  getUnifiedAnalytics,
);

/**
 * @swagger
 * /api/reports-revamped/analytics:
 *   get:
 *     summary: Get comprehensive analytics data (Enhanced Version)
 *     tags: [Reports Revamped]
 *     description: |
 *       Retrieve enhanced analytics data with improved performance metrics, 
 *       trend analysis, and system branding integration for professional reporting.
 *       
 *       **Key Enhancements:**
 *       - Dynamic system branding (app name, logo, complaint ID prefix)
 *       - Enhanced performance metrics (user satisfaction, escalation rate, etc.)
 *       - Period-over-period comparison with trend percentages
 *       - Improved RBAC with user context metadata
 *       - Better error handling and data validation
 *       - Optimized database queries for better performance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *         description: Ward ID filter (Admin only, ignored for Ward Officers)
 *         example: "ward-123"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Complaint type filter (supports both ID and name)
 *         example: "road_maintenance"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [registered, assigned, in_progress, resolved, closed, reopened]
 *         description: Complaint status filter
 *         example: "resolved"
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Complaint priority filter
 *         example: "high"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10000
 *           default: 1000
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Enhanced analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Enhanced analytics data retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/EnhancedAnalyticsData'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid date range provided"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions for requested data scope
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve enhanced analytics data"
 *                 error:
 *                   type: string
 */
router.get(
  "/analytics",
  protect,
  authorize("ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"),
  sanitizeInputs,
  validateDateRange,
  getComprehensiveAnalyticsRevamped,
);

/**
 * @swagger
 * /api/reports-revamped/export:
 *   get:
 *     summary: Export reports with enhanced branding and formatting
 *     tags: [Reports Revamped]
 *     description: |
 *       Provides structured complaint data for frontend export processing.
 *       All export formats (PDF, Excel, CSV) are handled by the frontend for better
 *       performance and user experience.
 *       
 *       **Key Features:**
 *       - Structured JSON data with enhanced metadata
 *       - Dynamic system branding information (app name, complaint ID formatting)
 *       - Comprehensive complaint details with relationships
 *       - SLA status calculation and display
 *       - Proper complaint type name resolution
 *       - Role-based data filtering and access control
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json]
 *           default: json
 *         description: Export format (JSON returns structured data for frontend processing)
 *         example: "json"
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for export (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for export (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *         description: Ward ID filter (Admin only)
 *         example: "ward-123"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Complaint type filter
 *         example: "road_maintenance"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [registered, assigned, in_progress, resolved, closed, reopened]
 *         description: Complaint status filter
 *         example: "resolved"
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Complaint priority filter
 *         example: "high"
 *     responses:
 *       200:
 *         description: Export data prepared successfully or CSV file returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Export data prepared successfully with enhanced formatting"
 *                 data:
 *                   $ref: '#/components/schemas/EnhancedExportData'
 *       400:
 *         description: Invalid export parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User doesn't have export permissions
 *       500:
 *         description: Internal server error during export
 */
// Export route removed - using frontend-only export implementation

/**
 * @swagger
 * /api/reports-revamped/heatmap:
 *   get:
 *     summary: Get enhanced heatmap data for complaint distribution visualization
 *     tags: [Reports Revamped]
 *     description: |
 *       Retrieve enhanced heatmap data showing complaint distribution across wards and types
 *       with improved performance and better data structure for professional visualizations.
 *       
 *       **Key Enhancements:**
 *       - Optimized database queries for better performance
 *       - Complete matrix generation with all wards and complaint types
 *       - Enhanced metadata including filter context and statistics
 *       - Better complaint type name resolution
 *       - Improved RBAC enforcement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for heatmap data (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for heatmap data (YYYY-MM-DD)
 *         example: "2024-01-31"
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *         description: Ward ID filter (Admin only)
 *         example: "ward-123"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Complaint type filter
 *         example: "road_maintenance"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [registered, assigned, in_progress, resolved, closed, reopened]
 *         description: Complaint status filter
 *         example: "resolved"
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Complaint priority filter
 *         example: "high"
 *     responses:
 *       200:
 *         description: Enhanced heatmap data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Enhanced heatmap data retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/EnhancedHeatmapData'
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get(
  "/heatmap",
  protect,
  authorize("ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"),
  sanitizeInputs,
  validateDateRange,
  getHeatmapDataRevamped,
);

/**
 * @swagger
 * /api/reports-revamped/health:
 *   get:
 *     summary: Get enhanced reporting system health check
 *     tags: [Reports Revamped]
 *     description: |
 *       Health check endpoint for the enhanced reporting system with performance metrics
 *       and system status information.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reporting system health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Enhanced reporting system is healthy"
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     version:
 *                       type: string
 *                       example: "2.0.0"
 *                     features:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["enhanced-analytics", "dynamic-branding", "performance-metrics"]
 *                     uptime:
 *                       type: number
 *                       description: System uptime in seconds
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: System health check failed
 */
router.get(
  "/health",
  protect,
  authorize("ADMINISTRATOR"),
  sanitizeInputs,
  asyncHandler(async (req, res) => {
    const healthData = {
      status: "healthy",
      version: "2.0.0",
      features: [
        "enhanced-analytics",
        "dynamic-branding", 
        "performance-metrics",
        "period-comparison",
        "professional-exports",
        "optimized-queries",
        "rbac-enforcement",
      ],
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "connected",
      cache: "active",
    };

    res.status(200).json({
      success: true,
      message: "Enhanced reporting system is healthy",
      data: healthData,
    });
  }),
);

export default router;