import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { uploadComplaintAttachment } from "../controller/uploadController.js";
import {
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaintStatus,
  assignComplaint,
  addComplaintFeedback,
  reopenComplaint,
  getComplaintStats,
  getWardUsers,
  getWardDashboardStats,
} from "../controller/complaintController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Complaints
 *   description: Complaint management operations
 */

/**
 * @swagger
 * /api/complaints/public/stats:
 *   get:
 *     summary: Get public complaint statistics
 *     tags: [Complaints]
 *     description: Retrieve general complaint statistics without authentication
 *     responses:
 *       200:
 *         description: Public statistics retrieved successfully
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
 *                     totalComplaints:
 *                       type: integer
 *                     resolvedComplaints:
 *                       type: integer
 *                     pendingComplaints:
 *                       type: integer
 *                     averageResolutionTime:
 *                       type: number
 */
router.get("/public/stats", getComplaintStats);

// Protected routes
router.use(protect); // All routes below require authentication

/**
 * @swagger
 * /api/complaints:
 *   get:
 *     summary: Get complaints with filtering and pagination
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/StatusParam'
 *       - $ref: '#/components/parameters/PriorityParam'
 *       - $ref: '#/components/parameters/WardParam'
 *       - $ref: '#/components/parameters/DateFromParam'
 *       - $ref: '#/components/parameters/DateToParam'
 *       - name: type
 *         in: query
 *         description: Filter by complaint type
 *         schema:
 *           type: string
 *       - name: assignedTo
 *         in: query
 *         description: Filter by assigned user ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Complaints retrieved successfully
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
 *                     complaints:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Complaint'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", getComplaints);

/**
 * @swagger
 * /api/complaints:
 *   post:
 *     summary: Create a new complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - wardId
 *               - area
 *               - contactPhone
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Street light not working"
 *               description:
 *                 type: string
 *                 example: "The street light on MG Road has been non-functional for 3 days"
 *               type:
 *                 type: string
 *                 example: "STREET_LIGHTING"
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 default: MEDIUM
 *               wardId:
 *                 type: string
 *                 example: "ward123"
 *               subZoneId:
 *                 type: string
 *                 example: "subzone123"
 *               area:
 *                 type: string
 *                 example: "MG Road"
 *               landmark:
 *                 type: string
 *                 example: "Near City Mall"
 *               address:
 *                 type: string
 *                 example: "MG Road, Near City Mall, Kochi"
 *               latitude:
 *                 type: number
 *                 example: 9.9312
 *               longitude:
 *                 type: number
 *                 example: 76.2673
 *               contactName:
 *                 type: string
 *                 example: "John Doe"
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               contactPhone:
 *                 type: string
 *                 example: "+91-9876543210"
 *               isAnonymous:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Complaint created successfully
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
 *                     complaint:
 *                       $ref: '#/components/schemas/Complaint'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  "/",
  authorize("CITIZEN", "ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"),
  createComplaint,
);

/**
 * @swagger
 * /api/complaints/stats:
 *   get:
 *     summary: Get complaint statistics for authenticated users
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     totalComplaints:
 *                       type: integer
 *                     myComplaints:
 *                       type: integer
 *                     resolvedComplaints:
 *                       type: integer
 *                     pendingComplaints:
 *                       type: integer
 *                     statusBreakdown:
 *                       type: object
 *                     priorityBreakdown:
 *                       type: object
 *                     averageResolutionTime:
 *                       type: number
 */
router.get("/stats", getComplaintStats);

/**
 * @swagger
 * /api/complaints/ward-users:
 *   get:
 *     summary: Get users for complaint assignment
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     description: Get list of users available for complaint assignment (Ward Officer access)
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     wardOfficers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     maintenanceTeams:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  "/ward-users",
  authorize("WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"),
  getWardUsers,
);

/**
 * @swagger
 * /api/complaints/ward-dashboard-stats:
 *   get:
 *     summary: Get ward-specific dashboard statistics
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     description: Get dashboard statistics for the ward officer's assigned ward
 *     responses:
 *       200:
 *         description: Ward statistics retrieved successfully
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
 *                     wardInfo:
 *                       $ref: '#/components/schemas/Ward'
 *                     totalComplaints:
 *                       type: integer
 *                     pendingComplaints:
 *                       type: integer
 *                     resolvedComplaints:
 *                       type: integer
 *                     overdueComplaints:
 *                       type: integer
 *                     statusBreakdown:
 *                       type: object
 *                     priorityBreakdown:
 *                       type: object
 *                     recentComplaints:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Complaint'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
  "/ward-dashboard-stats",
  authorize("WARD_OFFICER"),
  getWardDashboardStats,
);

/**
 * @swagger
 * /api/complaints/{id}:
 *   get:
 *     summary: Get a single complaint by ID
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Complaint ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Complaint retrieved successfully
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
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/:id", getComplaint);

/**
 * @swagger
 * /api/complaints/{id}:
 *   put:
 *     summary: Update complaint (general update including status, priority, assignment)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Complaint ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [REGISTERED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               assignedToId:
 *                 type: string
 *               wardOfficerId:
 *                 type: string
 *               maintenanceTeamId:
 *                 type: string
 *               remarks:
 *                 type: string
 *               comment:
 *                 type: string
 *                 description: Status change comment
 *     responses:
 *       200:
 *         description: Complaint updated successfully
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
 *                     complaint:
 *                       $ref: '#/components/schemas/Complaint'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put(
  "/:id",
  authorize("WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"),
  updateComplaintStatus,
);

/**
 * @swagger
 * /api/complaints/{id}/status:
 *   put:
 *     summary: Update complaint status (legacy endpoint)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Complaint ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [REGISTERED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED]
 *               comment:
 *                 type: string
 *                 description: Status change comment
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put(
  "/:id/status",
  authorize("WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"),
  updateComplaintStatus,
);

/**
 * @swagger
 * /api/complaints/{id}/assign:
 *   put:
 *     summary: Assign complaint to user or team
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Complaint ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedToId:
 *                 type: string
 *                 description: User ID to assign complaint to
 *               wardOfficerId:
 *                 type: string
 *                 description: Ward officer ID
 *               maintenanceTeamId:
 *                 type: string
 *                 description: Maintenance team member ID
 *               comment:
 *                 type: string
 *                 description: Assignment comment
 *     responses:
 *       200:
 *         description: Complaint assigned successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put(
  "/:id/assign",
  authorize("WARD_OFFICER", "ADMINISTRATOR"),
  assignComplaint,
);

/**
 * @swagger
 * /api/complaints/{id}/feedback:
 *   post:
 *     summary: Add citizen feedback to resolved complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Complaint ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback
 *               - rating
 *             properties:
 *               feedback:
 *                 type: string
 *                 description: Citizen feedback text
 *                 example: "The issue was resolved quickly and efficiently"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *                 example: 4
 *     responses:
 *       200:
 *         description: Feedback added successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post("/:id/feedback", authorize("CITIZEN"), addComplaintFeedback);

/**
 * @swagger
 * /api/complaints/{id}/reopen:
 *   put:
 *     summary: Reopen a closed complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Complaint ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for reopening the complaint
 *                 example: "Issue not fully resolved, requires additional work"
 *     responses:
 *       200:
 *         description: Complaint reopened successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put("/:id/reopen", authorize("ADMINISTRATOR"), reopenComplaint);

/**
 * @swagger
 * /api/complaints/{id}/attachments:
 *   post:
 *     summary: Upload attachment to complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Complaint ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               description:
 *                 type: string
 *                 description: Optional file description
 *     responses:
 *       200:
 *         description: File uploaded successfully
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
 *                     attachment:
 *                       $ref: '#/components/schemas/Attachment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/:id/attachments", (req, res, next) => {
  // Redirect to the actual upload endpoint
  req.params.complaintId = req.params.id;
  uploadComplaintAttachment(req, res, next);
});

export default router;
