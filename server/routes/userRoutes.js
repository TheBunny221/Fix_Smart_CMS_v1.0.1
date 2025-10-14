import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  verifyAccount,
  getWards,
  createWard,
  updateWard,
  deleteWard,
  createSubZone,
  updateSubZone,
  deleteSubZone,
  changePassword,
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
} from "../middleware/validation.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management operations
 */

// Public routes
router.post("/verify-account/:token", verifyAccount);

// Password reset routes (public)
router.post("/request-reset-otp", requestResetOTP);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);

// Protected routes
router.use(protect);

// Password management (accessible to all authenticated users)
router.post("/change-password", changePassword);

// Ward management (accessible to all authenticated users for ward list)
router.get("/wards", getWards);

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
  .get(getUser)
  .put(validateUserUpdate, updateUser)
  .delete(deleteUser);

// Ward management (admin only)
router.route("/wards").post(createWard);

router.route("/wards/:id").put(updateWard).delete(deleteWard);

// Sub-zone management (admin only)
router.route("/wards/:wardId/subzones").post(createSubZone);

router
  .route("/wards/:wardId/subzones/:id")
  .put(updateSubZone)
  .delete(deleteSubZone);

export default router;
