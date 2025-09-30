import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getComplaintMaterials,
  addComplaintMaterial,
  updateMaterial,
  deleteMaterial,
} from "../controller/materialsController.js";

const router = express.Router();

// Complaint materials routes
router.get(
  "/complaints/:id/materials",
  protect,
  authorize("MAINTENANCE_TEAM", "WARD_OFFICER", "ADMINISTRATOR"),
  getComplaintMaterials,
);

router.post(
  "/complaints/:id/materials",
  protect,
  authorize("MAINTENANCE_TEAM"),
  addComplaintMaterial,
);

// Individual material routes
router.put(
  "/materials/:id",
  protect,
  authorize("MAINTENANCE_TEAM"),
  updateMaterial,
);

router.delete(
  "/materials/:id",
  protect,
  authorize("MAINTENANCE_TEAM"),
  deleteMaterial,
);

export default router;
