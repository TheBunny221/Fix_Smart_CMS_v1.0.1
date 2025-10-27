import express from "express";
import rateLimit from "express-rate-limit";
import {
  generateCaptcha,
  verifyCaptcha,
} from "../controller/captchaController.js";

// Rate limiting for CAPTCHA verification (prevent brute force)
const captchaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === "production" ? 10 : 100, // 10 attempts per 5 minutes in production
  message: {
    success: false,
    message: "Too many CAPTCHA verification attempts. Please try again later.",
    errorCode: "CAPTCHA_RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Captcha
 *   description: CAPTCHA generation and verification for security
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CaptchaResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             captchaId:
 *               type: string
 *               description: Unique CAPTCHA session ID
 *             captchaImage:
 *               type: string
 *               description: Base64 encoded CAPTCHA image
 *             expiresAt:
 *               type: string
 *               format: date-time
 *               description: CAPTCHA expiration time
 *     
 *     CaptchaVerificationRequest:
 *       type: object
 *       required:
 *         - captchaId
 *         - captchaText
 *       properties:
 *         captchaId:
 *           type: string
 *           description: CAPTCHA session ID from generation
 *         captchaText:
 *           type: string
 *           description: User-entered CAPTCHA text
 *           example: "ABC123"
 */

/**
 * @swagger
 * /api/captcha/generate:
 *   get:
 *     summary: Generate a new CAPTCHA
 *     tags: [Captcha]
 *     description: Generate a new CAPTCHA image and session for security verification
 *     responses:
 *       200:
 *         description: CAPTCHA generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CaptchaResponse'
 *       500:
 *         description: Failed to generate CAPTCHA
 */
// Generate new CAPTCHA
router.get("/generate", generateCaptcha);

/**
 * @swagger
 * /api/captcha/verify:
 *   post:
 *     summary: Verify CAPTCHA text
 *     tags: [Captcha]
 *     description: Verify the user-entered CAPTCHA text against the generated CAPTCHA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CaptchaVerificationRequest'
 *     responses:
 *       200:
 *         description: CAPTCHA verification result
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
 *                       description: Whether CAPTCHA was verified successfully
 *       400:
 *         description: Invalid CAPTCHA or expired session
 */
// Verify CAPTCHA (optional standalone endpoint)
router.post("/verify", captchaLimiter, verifyCaptcha);

export default router;
