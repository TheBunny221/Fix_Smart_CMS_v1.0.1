import express from "express";
import rateLimit from "express-rate-limit";
import {
  requestComplaintOtp,
  verifyComplaintOtp,
  getComplaintDetailsWithOtp,
} from "../controller/guestOtpController.js";

// Rate limiting for guest OTP requests
const guestOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === "production" ? 3 : 50, // 3 OTP requests per 5 minutes in production
  message: {
    success: false,
    message: "Too many OTP requests. Please wait 5 minutes before requesting again.",
    errorCode: "OTP_RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Guest OTP
 *   description: OTP-based operations for guest users
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ComplaintOTPRequest:
 *       type: object
 *       required:
 *         - complaintId
 *         - email
 *       properties:
 *         complaintId:
 *           type: string
 *           description: Complaint tracking ID
 *           example: "KSC0001"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address associated with the complaint
 *           example: "john.doe@example.com"
 *     
 *     ComplaintOTPVerification:
 *       type: object
 *       required:
 *         - complaintId
 *         - email
 *         - otpCode
 *       properties:
 *         complaintId:
 *           type: string
 *           description: Complaint tracking ID
 *           example: "KSC0001"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address associated with the complaint
 *           example: "john.doe@example.com"
 *         otpCode:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *           description: 6-digit OTP code
 *           example: "123456"
 */

/**
 * @swagger
 * /api/guest-otp/test:
 *   get:
 *     summary: Test guest OTP routes accessibility
 *     tags: [Guest OTP]
 *     description: Test endpoint to verify that guest OTP routes are accessible
 *     responses:
 *       200:
 *         description: Routes are accessible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
// Test endpoint to verify routing
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Guest OTP routes are accessible",
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/guest-otp/request-complaint-otp:
 *   post:
 *     summary: Request OTP for complaint access
 *     tags: [Guest OTP]
 *     description: Request an OTP to access complaint details for guest users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComplaintOTPRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *                     otpSent:
 *                       type: boolean
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid complaint ID or email
 *       404:
 *         description: Complaint not found
 */
// Public endpoints - no authentication required
router.post("/request-complaint-otp", guestOtpLimiter, requestComplaintOtp);

/**
 * @swagger
 * /api/guest-otp/verify-complaint-otp:
 *   post:
 *     summary: Verify OTP for complaint access
 *     tags: [Guest OTP]
 *     description: Verify the OTP to gain access to complaint details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComplaintOTPVerification'
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                     verified:
 *                       type: boolean
 *                     accessToken:
 *                       type: string
 *                       description: Temporary access token for complaint details
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: OTP session not found
 */
router.post("/verify-complaint-otp", guestOtpLimiter, verifyComplaintOtp);

/**
 * @swagger
 * /api/guest-otp/complaint-details:
 *   post:
 *     summary: Get complaint details with OTP verification
 *     tags: [Guest OTP]
 *     description: Retrieve detailed complaint information after OTP verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - complaintId
 *               - accessToken
 *             properties:
 *               complaintId:
 *                 type: string
 *                 description: Complaint tracking ID
 *               accessToken:
 *                 type: string
 *                 description: Access token from OTP verification
 *     responses:
 *       200:
 *         description: Complaint details retrieved successfully
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
 *                     complaint:
 *                       $ref: '#/components/schemas/Complaint'
 *                     statusHistory:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StatusLog'
 *                     attachments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Attachment'
 *       401:
 *         description: Invalid or expired access token
 *       404:
 *         description: Complaint not found
 */
router.post("/complaint-details", getComplaintDetailsWithOtp);

export default router;
