import express from "express";
import rateLimit from "express-rate-limit";
import { receiveFrontendLogs, getLogStats } from "../controller/logController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Application logging and monitoring endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LogEntry:
 *       type: object
 *       required:
 *         - level
 *         - message
 *       properties:
 *         level:
 *           type: string
 *           enum: ["error", "warn", "info", "debug"]
 *           description: Log level
 *           example: "error"
 *         message:
 *           type: string
 *           description: Log message
 *           example: "Failed to submit complaint"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the log occurred
 *         userId:
 *           type: string
 *           description: User ID (if available)
 *         sessionId:
 *           type: string
 *           description: Session identifier
 *         userAgent:
 *           type: string
 *           description: Browser user agent
 *         url:
 *           type: string
 *           description: URL where error occurred
 *         stack:
 *           type: string
 *           description: Error stack trace (for errors)
 *         metadata:
 *           type: object
 *           description: Additional context data
 *     
 *     LogStats:
 *       type: object
 *       properties:
 *         totalLogs:
 *           type: integer
 *           description: Total number of logs
 *         logsByLevel:
 *           type: object
 *           properties:
 *             error:
 *               type: integer
 *             warn:
 *               type: integer
 *             info:
 *               type: integer
 *             debug:
 *               type: integer
 *         recentErrors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LogEntry'
 *         topErrors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               count:
 *                 type: integer
 */

// Rate limiting for log submission
const logSubmissionLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 log submissions per minute
  message: {
    success: false,
    message: "Too many log submissions, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: Submit frontend logs
 *     tags: [Logs]
 *     description: Submit client-side logs to the server for monitoring and debugging
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/LogEntry'
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/LogEntry'
 *           examples:
 *             singleLog:
 *               summary: Single log entry
 *               value:
 *                 level: "error"
 *                 message: "Failed to submit complaint"
 *                 timestamp: "2024-12-01T10:30:00Z"
 *                 url: "/complaints/new"
 *                 stack: "Error: Network request failed..."
 *             multipleLogs:
 *               summary: Multiple log entries
 *               value:
 *                 - level: "info"
 *                   message: "User logged in"
 *                   timestamp: "2024-12-01T10:00:00Z"
 *                 - level: "error"
 *                   message: "API request failed"
 *                   timestamp: "2024-12-01T10:30:00Z"
 *     responses:
 *       200:
 *         description: Logs received successfully
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
 *                     received:
 *                       type: integer
 *                       description: Number of log entries received
 *       400:
 *         description: Invalid log format
 *       429:
 *         description: Too many log submissions (rate limited)
 */
// Public routes (with rate limiting)
router.post("/", logSubmissionLimit, receiveFrontendLogs);

/**
 * @swagger
 * /api/logs/stats:
 *   get:
 *     summary: Get log statistics
 *     tags: [Logs]
 *     description: Retrieve statistics about application logs (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: ["1h", "24h", "7d", "30d"]
 *           default: "24h"
 *         description: Time frame for statistics
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: ["error", "warn", "info", "debug"]
 *         description: Filter by log level
 *     responses:
 *       200:
 *         description: Log statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LogStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
// Protected routes (admin only)
router.get("/stats", protect, authorize("ADMINISTRATOR"), getLogStats);

export default router;
