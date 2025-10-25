import express from 'express';
import { getComplaintSummary } from '../controller/complaintSummary.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected route - requires authentication and appropriate role
router.get('/ward-dashboard-stats', protect, authorize("ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"), getComplaintSummary);

export default router;
