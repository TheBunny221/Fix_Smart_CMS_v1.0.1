import express from "express";
import rateLimit from "express-rate-limit";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  verifyAccount,
  getWards,
  getOfficers,
  createWard,
  updateWard,
  deleteWard,
  createSubZone,
  updateSubZone,
  deleteSubZone,
  changePassword,
  sendPasswordSetupOTP,
  verifyPasswordSetupOTP,
  setPasswordAfterOTP,
} from "../controller/userController.js";
import {
  requestResetOTP,
  verifyResetOTP,
  resetPassword,
} from "../controller/authController.js";
import { protect, authorize } from "../middleware/auth.js";
import {
  validateUserRegistration,
  validateUserUpdate,
  validatePagination,
  validatePasswordReset,
  validateOTP,
  validateOTPRequest,
  validateWard,
  validateSubZone,
  validateMongoId,
  sanitizeInputs
} from "../middleware/validation.js";

// Rate limiting for password operations
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === "production" ? 3 : 20, // 3 password operations per hour in production
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again in 1 hour.",
    errorCode: "PASSWORD_RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});

// Rate limiting for OTP requests
const otpLimiter = rateLimit({
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

// General auth rate limiting (for account verification and other auth operations)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 10 : 100, // 10 attempts in production
  message: {
    success: false,
    message: "Too many authentication requests. Please try again later.",
    errorCode: "AUTH_RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management operations
 */

// Public routes
router.post("/verify-account/:token", authLimiter, sanitizeInputs, validatePasswordReset, verifyAccount);

// Password reset routes (public)
router.post("/request-reset-otp", otpLimiter, sanitizeInputs, validateOTPRequest, requestResetOTP);
router.post("/verify-reset-otp", passwordLimiter, sanitizeInputs, validateOTP, verifyResetOTP);
router.post("/reset-password", passwordLimiter, sanitizeInputs, validatePasswordReset, resetPassword);

// Ward management - GET is public (no authentication required)
router.get("/wards", sanitizeInputs, getWards);

// Protected routes
router.use(protect);
router.use(sanitizeInputs); // Sanitize all inputs for protected routes

// Password management (accessible to all authenticated users)
router.post("/change-password", passwordLimiter, changePassword);

// Password setup with OTP (accessible to all authenticated users)
router.post("/send-otp", otpLimiter, sendPasswordSetupOTP);
router.post("/verify-otp", passwordLimiter, verifyPasswordSetupOTP);
router.post("/set-password", passwordLimiter, setPasswordAfterOTP);

// Officers list (accessible to all authenticated users for officer selection)
router.get("/officers", getOfficers);

// Admin only routes
router.use(authorize("ADMINISTRATOR"));

// User management
router
  .route("/")
  .get(validatePagination, getUsers)
  .post(validateUserRegistration, createUser);

router.get("/stats", getUserStats);

router
  .route("/:id")
  .get(validateMongoId, getUser)
  .put(validateMongoId, validateUserUpdate, updateUser)
  .delete(validateMongoId, deleteUser);

// Ward management (admin only)
router.route("/wards").post(validateWard, createWard);

router.route("/wards/:id").put(validateMongoId, validateWard, updateWard).delete(validateMongoId, deleteWard);

// Sub-zone management (admin only)
router.route("/wards/:wardId/subzones").post(validateMongoId, validateSubZone, createSubZone);

router
  .route("/wards/:wardId/subzones/:id")
  .put(validateMongoId, validateSubZone, updateSubZone)
  .delete(validateMongoId, deleteSubZone);

export default router;
