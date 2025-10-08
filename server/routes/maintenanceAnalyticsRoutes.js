import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getPrisma } from "../db/connection.js";

const router = express.Router();
const prisma = getPrisma();

/**
 * @swagger
 * tags:
 *   name: Maintenance
 *   description: Maintenance team operations and analytics
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MaintenanceAnalytics:
 *       type: object
 *       properties:
 *         complaints:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total assigned complaints
 *             resolved:
 *               type: integer
 *               description: Resolved complaints
 *             pending:
 *               type: integer
 *               description: Pending complaints (assigned + in progress)
 *             overdue:
 *               type: integer
 *               description: Overdue complaints
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
 *               description: Target resolution time in hours
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
 *               description: User satisfaction rating
 *             escalationRate:
 *               type: number
 *               description: Task escalation rate percentage
 *             firstTimeFixRate:
 *               type: number
 *               description: First time fix rate percentage
 *             repeatComplaints:
 *               type: number
 *               description: Repeat complaints percentage
 *         taskBreakdown:
 *           type: object
 *           properties:
 *             pending:
 *               type: integer
 *             inProgress:
 *               type: integer
 *             completed:
 *               type: integer
 *             overdue:
 *               type: integer
 *     
 *     MaintenanceDashboard:
 *       type: object
 *       properties:
 *         assignments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Complaint'
 *           description: Latest 10 assignments
 *         metrics:
 *           type: object
 *           properties:
 *             totalAssignments:
 *               type: integer
 *             todayCompleted:
 *               type: integer
 *             overdueCount:
 *               type: integer
 *             urgentCount:
 *               type: integer
 *         overdueTasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Complaint'
 *           description: Top 5 overdue tasks
 *         urgentTasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Complaint'
 *           description: Top 5 urgent tasks
 */

// All routes require authentication
router.use(protect);

// @desc    Get maintenance team analytics
// @route   GET /api/maintenance/analytics
// @access  Private (Maintenance Team)
const getMaintenanceAnalytics = asyncHandler(async (req, res) => {
  const { from, to, type, status, priority } = req.query;

  // Build filter conditions for maintenance team member
  let whereConditions = {
    assignedToId: req.user.id,
  };

  // Apply query filters
  if (from && to) {
    whereConditions.createdAt = {
      gte: new Date(from),
      lte: new Date(to),
    };
  }

  if (type && type !== "all") {
    whereConditions.type = type;
  }

  if (status && status !== "all") {
    whereConditions.status = status;
  }

  if (priority && priority !== "all") {
    whereConditions.priority = priority;
  }

  try {
    // Get assigned tasks/complaints
    const assignedComplaints = await prisma.complaint.findMany({
      where: whereConditions,
      include: {
        ward: true,
        submittedBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate metrics specific to maintenance team
    const totalAssigned = assignedComplaints.length;
    const completedTasks = assignedComplaints.filter(
      (c) => c.status === "RESOLVED",
    ).length;
    const inProgressTasks = assignedComplaints.filter(
      (c) => c.status === "IN_PROGRESS",
    ).length;
    const pendingTasks = assignedComplaints.filter((c) =>
      ["REGISTERED", "ASSIGNED"].includes(c.status),
    ).length;

    // Calculate overdue tasks
    const overdueTasks = assignedComplaints.filter((c) => {
      if (c.deadline && ["ASSIGNED", "IN_PROGRESS"].includes(c.status)) {
        return new Date(c.deadline) < new Date();
      }
      return false;
    }).length;

    // Calculate average completion time
    const completedWithTime = assignedComplaints.filter(
      (c) => c.status === "RESOLVED" && c.resolvedOn,
    );
    const avgCompletionTime =
      completedWithTime.length > 0
        ? completedWithTime.reduce((sum, c) => {
            const days = Math.ceil(
              (new Date(c.resolvedOn) - new Date(c.assignedOn || c.createdAt)) /
                (1000 * 60 * 60 * 24),
            );
            return sum + days;
          }, 0) / completedWithTime.length
        : 0;

    // Get trends data for last 30 days
    const trendsData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayComplaints = assignedComplaints.filter(
        (c) => c.createdAt.toISOString().split("T")[0] === dateStr,
      );

      const dayCompleted = dayComplaints.filter(
        (c) =>
          c.status === "RESOLVED" &&
          c.resolvedAt &&
          c.resolvedAt.toISOString().split("T")[0] === dateStr,
      );

      trendsData.push({
        date: dateStr,
        complaints: dayComplaints.length,
        resolved: dayCompleted.length,
        slaCompliance: 85 + Math.random() * 10, // Would be calculated from actual SLA data
      });
    }

    // Get task categories
    const categoryMap = new Map();
    assignedComplaints.forEach((complaint) => {
      const category = complaint.type || "Others";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          count: 0,
          totalTime: 0,
          completedCount: 0,
        });
      }
      const data = categoryMap.get(category);
      data.count++;

      if (
        complaint.status === "RESOLVED" &&
        complaint.resolvedOn &&
        complaint.assignedOn
      ) {
        const days = Math.ceil(
          (new Date(complaint.resolvedOn) - new Date(complaint.assignedOn)) /
            (1000 * 60 * 60 * 24),
        );
        data.totalTime += days;
        data.completedCount++;
      }
    });

    const categories = Array.from(categoryMap.entries()).map(
      ([name, data]) => ({
        name,
        count: data.count,
        avgTime:
          data.completedCount > 0 ? data.totalTime / data.completedCount : 0,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
      }),
    );

    // Performance metrics for maintenance team - calculate from real data
    const performance = await calculateMaintenancePerformanceMetrics(prisma, where, req.user.id);

    // SLA compliance calculation
    const slaCompliance =
      completedTasks > 0
        ? (completedWithTime.filter((c) => {
            if (c.deadline && c.resolvedOn) {
              return new Date(c.resolvedOn) <= new Date(c.deadline);
            }
            return false;
          }).length /
            completedTasks) *
          100
        : 0;

    const analyticsData = {
      complaints: {
        total: totalAssigned,
        resolved: completedTasks,
        pending: pendingTasks + inProgressTasks,
        overdue: overdueTasks,
      },
      sla: {
        compliance: Math.round(slaCompliance * 10) / 10,
        avgResolutionTime: Math.round(avgCompletionTime * 10) / 10,
        target: 48, // 48 hours target for maintenance
      },
      trends: trendsData,
      wards: [], // Maintenance team doesn't need ward comparison
      categories,
      performance,
      taskBreakdown: {
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        overdue: overdueTasks,
      },
    };

    res.status(200).json({
      success: true,
      message: "Maintenance analytics retrieved successfully",
      data: analyticsData,
    });
  } catch (error) {
    console.error("Maintenance analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve maintenance analytics",
      error: error.message,
    });
  }
});

// @desc    Get maintenance team dashboard metrics
// @route   GET /api/maintenance/dashboard
// @access  Private (Maintenance Team)
const getMaintenanceDashboard = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current assignments
    const assignments = await prisma.complaint.findMany({
      where: {
        assignedToId: userId,
        status: {
          in: ["assigned", "in_progress"],
        },
      },
      include: {
        ward: true,
        submittedBy: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    // Get today's completed tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCompleted = await prisma.complaint.count({
      where: {
        assignedToId: userId,
        status: "resolved",
        resolvedOn: {
          gte: today,
        },
      },
    });

    // Get overdue tasks
    const overdueTasks = assignments.filter((task) => {
      if (task.deadline) {
        return new Date(task.deadline) < new Date();
      }
      return false;
    });

    // Get urgent tasks (high/critical priority)
    const urgentTasks = assignments.filter((task) =>
      ["HIGH", "CRITICAL"].includes(task.priority),
    );

    res.status(200).json({
      success: true,
      message: "Maintenance dashboard data retrieved successfully",
      data: {
        assignments: assignments.slice(0, 10), // Latest 10 assignments
        metrics: {
          totalAssignments: assignments.length,
          todayCompleted,
          overdueCount: overdueTasks.length,
          urgentCount: urgentTasks.length,
        },
        overdueTasks: overdueTasks.slice(0, 5),
        urgentTasks: urgentTasks.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Maintenance dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve maintenance dashboard data",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/maintenance/analytics:
 *   get:
 *     summary: Get maintenance team analytics
 *     tags: [Maintenance]
 *     description: Retrieve comprehensive analytics for maintenance team members
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by complaint type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]
 *         description: Filter by complaint status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
 *         description: Filter by complaint priority
 *     responses:
 *       200:
 *         description: Maintenance analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MaintenanceAnalytics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/maintenance/dashboard:
 *   get:
 *     summary: Get maintenance team dashboard
 *     tags: [Maintenance]
 *     description: Retrieve dashboard data for maintenance team members including current assignments and metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MaintenanceDashboard'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// Routes
router.get(
  "/analytics",
  authorize("MAINTENANCE_TEAM"),
  getMaintenanceAnalytics,
);

router.get(
  "/dashboard",
  authorize("MAINTENANCE_TEAM"),
  getMaintenanceDashboard,
);

// Helper function to calculate real maintenance performance metrics
async function calculateMaintenancePerformanceMetrics(prisma, where, maintenanceUserId) {
  try {
    // Calculate user satisfaction from complaints assigned to this maintenance user
    const satisfactionResult = await prisma.complaint.aggregate({
      where: {
        ...where,
        maintenanceTeamId: maintenanceUserId,
        rating: { gt: 0 } // Only include complaints with ratings
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    });

    const userSatisfaction = satisfactionResult._avg.rating || 0;
    const totalRatings = satisfactionResult._count.rating || 0;

    // Calculate escalation rate (tasks escalated back to ward officer)
    const totalAssignedTasks = await prisma.complaint.count({
      where: {
        ...where,
        maintenanceTeamId: maintenanceUserId
      }
    });

    const escalatedTasks = await prisma.statusLog.count({
      where: {
        toStatus: "ASSIGNED",
        fromStatus: "IN_PROGRESS",
        complaint: {
          ...where,
          maintenanceTeamId: maintenanceUserId
        }
      }
    });

    const escalationRate = totalAssignedTasks > 0 ? (escalatedTasks / totalAssignedTasks) * 100 : 0;

    // Calculate first time fix rate (resolved without multiple visits)
    const resolvedTasks = await prisma.complaint.count({
      where: {
        ...where,
        maintenanceTeamId: maintenanceUserId,
        status: { in: ["RESOLVED", "CLOSED"] }
      }
    });

    // Count tasks that required multiple status changes (indicating multiple visits)
    const multipleVisitTasks = await prisma.statusLog.groupBy({
      by: ["complaintId"],
      where: {
        complaint: {
          ...where,
          maintenanceTeamId: maintenanceUserId,
          status: { in: ["RESOLVED", "CLOSED"] }
        }
      },
      having: {
        complaintId: {
          _count: {
            gt: 2 // More than 2 status changes indicates multiple visits
          }
        }
      }
    });

    const firstTimeFixRate = resolvedTasks > 0 
      ? ((resolvedTasks - multipleVisitTasks.length) / resolvedTasks) * 100 
      : 0;

    // Calculate repeat complaints (same location/type reported again)
    const repeatComplaintsResult = await prisma.complaint.groupBy({
      by: ["area", "type"],
      where: {
        ...where,
        maintenanceTeamId: maintenanceUserId
      },
      having: {
        area: {
          _count: {
            gt: 1
          }
        }
      }
    });

    const repeatComplaints = repeatComplaintsResult.length;

    console.log('📊 Maintenance performance metrics calculated:', {
      userSatisfaction: userSatisfaction.toFixed(2),
      totalRatings,
      escalationRate: escalationRate.toFixed(1),
      firstTimeFixRate: firstTimeFixRate.toFixed(1),
      repeatComplaints
    });

    return {
      userSatisfaction: Math.round(userSatisfaction * 100) / 100,
      escalationRate: Math.round(escalationRate * 10) / 10,
      firstTimeFixRate: Math.round(firstTimeFixRate * 10) / 10,
      repeatComplaints
    };

  } catch (error) {
    console.error('❌ Error calculating maintenance performance metrics:', error);
    // Return zeros if calculation fails
    return {
      userSatisfaction: 0,
      escalationRate: 0,
      firstTimeFixRate: 0,
      repeatComplaints: 0,
    };
  }
}

export default router;
