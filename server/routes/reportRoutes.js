import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getPrisma } from "../db/connection.js";
import { computeSlaComplianceClosed, getTypeSlaMap } from "../utils/sla.js";
import { getComplaintTypeById, getComplaintTypes } from "../utils/complaintTypeHelper.js";

const router = express.Router();
const prisma = getPrisma();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reporting and analytics endpoints for complaint management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardMetrics:
 *       type: object
 *       properties:
 *         complaints:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             registered:
 *               type: integer
 *             assigned:
 *               type: integer
 *             inProgress:
 *               type: integer
 *             resolved:
 *               type: integer
 *             closed:
 *               type: integer
 *         users:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               count:
 *                 type: integer
 *         today:
 *           type: object
 *           properties:
 *             todayTotal:
 *               type: integer
 *             todayResolved:
 *               type: integer
 *     
 *     TrendData:
 *       type: object
 *       properties:
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
 *                 description: SLA compliance percentage
 *     
 *     SLAReport:
 *       type: object
 *       properties:
 *         slaReport:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
 *               total:
 *                 type: integer
 *               onTime:
 *                 type: integer
 *               warning:
 *                 type: integer
 *               overdue:
 *                 type: integer
 *     
 *     AnalyticsData:
 *       type: object
 *       properties:
 *         complaints:
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
 *         sla:
 *           type: object
 *           properties:
 *             compliance:
 *               type: number
 *             avgResolutionTime:
 *               type: number
 *             target:
 *               type: number
 *         trends:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
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
 *             escalationRate:
 *               type: number
 *             firstCallResolution:
 *               type: number
 *             repeatComplaints:
 *               type: number
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
 *     
 *     HeatmapData:
 *       type: object
 *       properties:
 *         xLabels:
 *           type: array
 *           items:
 *             type: string
 *           description: X-axis labels (complaint types)
 *         xTypeKeys:
 *           type: array
 *           items:
 *             type: string
 *           description: Original type keys
 *         yLabels:
 *           type: array
 *           items:
 *             type: string
 *           description: Y-axis labels (wards or sub-zones)
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
 *         meta:
 *           type: object
 *           properties:
 *             yIds:
 *               type: array
 *               items:
 *                 type: string
 */

// All routes require authentication
router.use(protect);

// @desc    Get dashboard metrics
// @route   GET /api/reports/dashboard
// @access  Private (Admin, Ward Officer)
const getDashboardMetrics = asyncHandler(async (req, res) => {
  // Build base where clause with RBAC
  const where = {};
  if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
    where.wardId = req.user.wardId;
  } else if (req.user.role === "MAINTENANCE_TEAM") {
    where.assignedToId = req.user.id;
  }

  // Compute complaint counts by status via Prisma
  const [
    totalCount,
    registeredCount,
    assignedCount,
    inProgressCount,
    resolvedCount,
    closedCount,
  ] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.count({ where: { ...where, status: "REGISTERED" } }),
    prisma.complaint.count({ where: { ...where, status: "ASSIGNED" } }),
    prisma.complaint.count({ where: { ...where, status: "IN_PROGRESS" } }),
    prisma.complaint.count({ where: { ...where, status: "RESOLVED" } }),
    prisma.complaint.count({ where: { ...where, status: "CLOSED" } }),
  ]);

  // Today's stats (based on submittedOn)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [todayTotal, todayResolved] = await Promise.all([
    prisma.complaint.count({
      where: { ...where, submittedOn: { gte: startOfToday } },
    }),
    prisma.complaint.count({
      where: {
        ...where,
        status: "RESOLVED",
        resolvedOn: { gte: startOfToday },
      },
    }),
  ]);

  // User statistics (admin only)
  let userStats = [];
  if (req.user.role === "ADMINISTRATOR") {
    const grouped = await prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    });
    userStats = grouped.map((g) => ({ _id: g.role, count: g._count._all }));
  }

  res.status(200).json({
    success: true,
    message: "Dashboard metrics retrieved successfully",
    data: {
      complaints: {
        total: totalCount,
        registered: registeredCount,
        assigned: assignedCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
      },
      users: userStats,
      today: { todayTotal, todayResolved },
    },
  });
});

// @desc    Get complaint trends
// @route   GET /api/reports/trends
// @access  Private (Admin, Ward Officer)
const getComplaintTrends = asyncHandler(async (req, res) => {
  const { period = "month", from, to, ward } = req.query;

  // RBAC scope
  const where = {};
  if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
    where.wardId = req.user.wardId;
  } else if (req.user.role === "ADMINISTRATOR" && ward && ward !== "all") {
    where.wardId = ward;
  }

  // Date range
  const start = from
    ? new Date(from)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = to ? new Date(to) : new Date();
  where.submittedOn = { gte: start, lte: end };

  // Prefill continuous dates based on period granularity (daily)
  const days = Math.max(
    1,
    Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
  );
  const trendsMap = new Map();
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime());
    d.setDate(start.getDate() + i);
    const key = d.toISOString().split("T")[0];
    trendsMap.set(key, { complaints: 0, resolved: 0 });
  }

  // Fetch minimal fields
  const rows = await prisma.complaint.findMany({
    where,
    select: { submittedOn: true, status: true, resolvedOn: true },
  });

  for (const c of rows) {
    const key = c.submittedOn.toISOString().split("T")[0];
    if (trendsMap.has(key)) {
      const t = trendsMap.get(key);
      t.complaints += 1;
    }
    if (c.status === "RESOLVED" && c.resolvedOn) {
      const rkey = c.resolvedOn.toISOString().split("T")[0];
      if (trendsMap.has(rkey)) {
        trendsMap.get(rkey).resolved += 1;
      }
    }
  }

  const trends = Array.from(trendsMap.entries()).map(([date, v]) => ({
    date,
    complaints: v.complaints,
    resolved: v.resolved,
  }));

  res.status(200).json({
    success: true,
    message: "Complaint trends retrieved successfully",
    data: { trends },
  });
});

// @desc    Get SLA report
// @route   GET /api/reports/sla
// @access  Private (Admin, Ward Officer)
const getSLAReport = asyncHandler(async (req, res) => {
  // RBAC scope
  const where = {};
  if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
    where.wardId = req.user.wardId;
  }

  // Only consider active pipeline statuses for SLA
  const activeStatuses = ["REGISTERED", "ASSIGNED", "IN_PROGRESS"];

  const rows = await prisma.complaint.findMany({
    where: { ...where, status: { in: activeStatuses } },
    select: { priority: true, deadline: true },
  });

  const now = new Date();
  const warningThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const byPriority = new Map();
  for (const r of rows) {
    const key = r.priority || "MEDIUM";
    if (!byPriority.has(key))
      byPriority.set(key, { total: 0, onTime: 0, warning: 0, overdue: 0 });
    const stat = byPriority.get(key);
    stat.total += 1;
    if (!r.deadline) {
      stat.onTime += 1; // No deadline considered on-time
      continue;
    }
    if (r.deadline < now) stat.overdue += 1;
    else if (r.deadline <= warningThreshold) stat.warning += 1;
    else stat.onTime += 1;
  }

  const slaReport = Array.from(byPriority.entries()).map(([priority, v]) => ({
    priority,
    total: v.total,
    onTime: v.onTime,
    warning: v.warning,
    overdue: v.overdue,
  }));

  res.status(200).json({
    success: true,
    message: "SLA report retrieved successfully",
    data: { slaReport },
  });
});

// @desc    Get comprehensive analytics data for unified reports
// @route   GET /api/reports/analytics
// @access  Private (Admin, Ward Officer, Maintenance)
const getComprehensiveAnalytics = asyncHandler(async (req, res) => {
  const {
    from,
    to,
    ward,
    type,
    status,
    priority,
    page = 1,
    limit = 1000,
  } = req.query;

  // Helper: normalize enums
  const normalizeStatus = (s) => {
    if (!s) return undefined;
    const map = {
      registered: "REGISTERED",
      assigned: "ASSIGNED",
      in_progress: "IN_PROGRESS",
      inprogress: "IN_PROGRESS",
      resolved: "RESOLVED",
      closed: "CLOSED",
      reopened: "REOPENED",
    };
    return map[String(s).toLowerCase()] || undefined;
  };
  const normalizePriority = (p) => {
    if (!p) return undefined;
    const map = {
      low: "LOW",
      medium: "MEDIUM",
      high: "HIGH",
      critical: "CRITICAL",
    };
    return map[String(p).toLowerCase()] || undefined;
  };

  // Build where conditions with strict RBAC
  const where = {};
  if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
    where.wardId = req.user.wardId; // ignore client ward filter
  } else if (req.user.role === "MAINTENANCE_TEAM") {
    where.assignedToId = req.user.id;
  } else if (req.user.role === "ADMINISTRATOR" && ward && ward !== "all") {
    where.wardId = ward;
  }

  // Date filters based on submittedOn
  if (from || to) {
    where.submittedOn = {};
    if (from) where.submittedOn.gte = new Date(from);
    if (to) where.submittedOn.lte = new Date(to);
  }

  // Dynamic complaint type filtering
  if (type && type !== "all") {
    try {
      const complaintType = await getComplaintTypeById(type);
      if (complaintType) {
        // Filter by both new complaintTypeId and legacy type field for compatibility
        where.OR = [
          { complaintTypeId: parseInt(complaintType.id) },
          { type: complaintType.name },
          { type: type } // Also include direct match for legacy data
        ];
      } else {
        // Fallback to direct type filtering for legacy data
        where.type = type;
      }
    } catch (error) {
      console.warn("Complaint type resolution failed in analytics, using direct filter:", error.message);
      where.type = type;
    }
  }
  const normalizedStatus = normalizeStatus(status);
  if (normalizedStatus) where.status = normalizedStatus;
  const normalizedPriority = normalizePriority(priority);
  if (normalizedPriority) where.priority = normalizedPriority;

  // Build a separate filter for CLOSED metrics using closedOn within range
  const closedWhere = { ...where };
  if (closedWhere.submittedOn) delete closedWhere.submittedOn;
  closedWhere.status = "CLOSED";
  if (from || to) {
    closedWhere.closedOn = {};
    if (from) closedWhere.closedOn.gte = new Date(from);
    if (to) closedWhere.closedOn.lte = new Date(to);
  }

  try {
    const pageNumber = parseInt(page) || 1;
    const pageSize = Math.min(parseInt(limit) || 1000, 10000);
    const skip = (pageNumber - 1) * pageSize;

    const [totalComplaints, complaints] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        include: {
          ward: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, fullName: true } },
          submittedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { submittedOn: "desc" },
        ...(pageSize < 10000 && { skip, take: pageSize }),
      }),
    ]);

    // Metrics
    const resolvedComplaints = await prisma.complaint.count({
      where: { ...where, status: "RESOLVED" },
    });
    const pendingComplaints = await prisma.complaint.count({
      where: {
        ...where,
        status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
      },
    });
    const overdueComplaints = await prisma.complaint.count({
      where: {
        ...where,
        status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
        deadline: { lt: new Date() },
      },
    });

    // SLA compliance over CLOSED/RESOLVED complaints within selected window (shared logic)
    const { compliance: slaCompliance } = await computeSlaComplianceClosed(
      prisma,
      closedWhere,
    );

    // Build type SLA map for downstream calculations (trends, categories)
    const typeSlaMap = await getTypeSlaMap(prisma);

    // Average resolution time in days (resolved only)
    const closedRows = await prisma.complaint.findMany({
      where: { ...closedWhere, closedOn: { not: null } },
      select: { submittedOn: true, closedOn: true },
    });
    let totalResolutionDays = 0;
    for (const c of closedRows) {
      if (c.closedOn && c.submittedOn) {
        const days = Math.ceil(
          (new Date(c.closedOn).getTime() - new Date(c.submittedOn).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        totalResolutionDays += days;
      }
    }
    const avgResolutionTime = closedRows.length
      ? totalResolutionDays / closedRows.length
      : 0;

    // Trends last N days (or specified range)
    const rangeStart = from
      ? new Date(from)
      : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    const rangeEnd = to ? new Date(to) : new Date();
    const dayCount = Math.max(
      1,
      Math.ceil(
        (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1,
    );
    const trendsMap = new Map();
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(rangeStart.getTime());
      d.setDate(rangeStart.getDate() + i);
      const key = d.toISOString().split("T")[0];
      trendsMap.set(key, {
        complaints: 0,
        resolved: 0,
        slaCompliance: 0,
        slaResolved: 0,
      });
    }

    const trendsRows = await prisma.complaint.findMany({
      where: { ...where, submittedOn: { gte: rangeStart, lte: rangeEnd } },
      select: {
        submittedOn: true,
        status: true,
        closedOn: true,
        type: true,
      },
    });

    for (const c of trendsRows) {
      const k = c.submittedOn.toISOString().split("T")[0];
      if (trendsMap.has(k)) trendsMap.get(k).complaints += 1;
      if (c.status === "CLOSED" && c.closedOn) {
        const rk = c.closedOn.toISOString().split("T")[0];
        if (trendsMap.has(rk)) {
          const t = trendsMap.get(rk);
          t.resolved += 1;
          const slaHours = typeSlaMap.get(c.type);
          if (slaHours) {
            const targetTs =
              new Date(c.submittedOn).getTime() + slaHours * 60 * 60 * 1000;
            if (new Date(c.closedOn).getTime() <= targetTs)
              t.slaCompliance += 1;
            t.slaResolved += 1;
          }
        }
      }
    }

    const trends = Array.from(trendsMap.entries()).map(([date, v]) => ({
      date,
      complaints: v.complaints,
      resolved: v.resolved,
      slaCompliance: v.slaResolved
        ? Math.round((v.slaCompliance / v.slaResolved) * 1000) / 10
        : 0,
    }));

    // Ward performance (admin only) using groupBy for counts
    let wards = [];
    if (req.user.role === "ADMINISTRATOR") {
      const totals = await prisma.complaint.groupBy({
        by: ["wardId"],
        where,
        _count: { _all: true },
      });
      const resolvedByWard = await prisma.complaint.groupBy({
        by: ["wardId"],
        where: closedWhere,
        _count: { _all: true },
      });
      const resolvedTimes = await prisma.complaint.findMany({
        where: closedWhere,
        select: { wardId: true, submittedOn: true, closedOn: true },
      });
      const avgByWard = new Map();
      for (const r of resolvedTimes) {
        if (r.submittedOn && r.closedOn) {
          const days = Math.ceil(
            (r.closedOn.getTime() - r.submittedOn.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          const acc = avgByWard.get(r.wardId) || { sum: 0, count: 0 };
          acc.sum += days;
          acc.count += 1;
          avgByWard.set(r.wardId, acc);
        }
      }
      const wardsMeta = await prisma.ward.findMany({
        select: { id: true, name: true },
      });
      const resMap = new Map(
        resolvedByWard.map((x) => [x.wardId, x._count._all]),
      );
      const wardName = new Map(wardsMeta.map((w) => [w.id, w.name]));
      wards = totals.map((t) => {
        const resolved = resMap.get(t.wardId) || 0;
        const avg = avgByWard.get(t.wardId);
        return {
          id: t.wardId,
          name: wardName.get(t.wardId) || t.wardId,
          complaints: t._count._all,
          resolved,
          avgTime: avg ? Math.round((avg.sum / avg.count) * 10) / 10 : 0,
          slaScore: t._count._all
            ? Math.round((resolved / t._count._all) * 1000) / 10
            : 0,
        };
      });
    }

    // Categories breakdown with dynamic complaint type names
    const categoriesGroup = await prisma.complaint.groupBy({
      by: ["type"],
      where,
      _count: { _all: true },
    });
    const categoryResolvedTimes = await prisma.complaint.findMany({
      where: closedWhere,
      select: { type: true, submittedOn: true, closedOn: true },
    });
    const timeByType = new Map();
    for (const r of categoryResolvedTimes) {
      if (r.submittedOn && r.closedOn) {
        const days = Math.ceil(
          (r.closedOn.getTime() - r.submittedOn.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const acc = timeByType.get(r.type) || { sum: 0, count: 0 };
        acc.sum += days;
        acc.count += 1;
        timeByType.set(r.type, acc);
      }
    }
    
    // Get all complaint types for proper name resolution
    const allComplaintTypes = await getComplaintTypes();
    const typeNameMap = new Map();
    for (const ct of allComplaintTypes) {
      typeNameMap.set(ct.name, ct.name);
      typeNameMap.set(ct.id, ct.name);
    }
    
    const categories = categoriesGroup.map((g) => {
      const typeName = typeNameMap.get(g.type) || g.type || "Others";
      return {
        name: typeName,
        count: g._count._all,
        avgTime: timeByType.get(g.type)
          ? Math.round(
              (timeByType.get(g.type).sum / timeByType.get(g.type).count) * 10,
            ) / 10
          : 0,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
      };
    });

    // Calculate previous period metrics for trend comparison
    const currentPeriodMetrics = {
      total: totalComplaints,
      resolved: resolvedComplaints,
      pending: pendingComplaints,
      overdue: overdueComplaints,
      slaCompliance: Math.round(slaCompliance * 10) / 10,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
    };

    const performanceMetrics = await calculatePerformanceMetrics(prisma, where, closedWhere);
    const previousPeriodMetrics = await calculatePreviousPeriodMetrics(prisma, where, closedWhere, from, to, req.user);

    const analyticsData = {
      complaints: {
        total: totalComplaints,
        resolved: resolvedComplaints,
        pending: pendingComplaints,
        overdue: overdueComplaints,
      },
      sla: {
        compliance: Math.round(slaCompliance * 10) / 10,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        target: 72,
      },
      trends,
      wards,
      categories,
      performance: performanceMetrics,
      comparison: {
        current: currentPeriodMetrics,
        previous: previousPeriodMetrics,
        trends: calculateTrendPercentages(currentPeriodMetrics, previousPeriodMetrics, performanceMetrics),
      },
      metadata: {
        totalRecords: totalComplaints,
        pageSize,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalComplaints / pageSize),
        dataFetchedAt: new Date().toISOString(),
      },
    };

    res.set({ "Cache-Control": "public, max-age=300" });
    res.status(200).json({
      success: true,
      message: "Analytics data retrieved successfully",
      data: analyticsData,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve analytics data",
      error: error.message,
    });
  }
});

// Export functionality has been moved to frontend-only implementation

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get dashboard metrics
 *     tags: [Reports]
 *     description: Retrieve key metrics for the dashboard (Admin, Ward Officer, Maintenance Team)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardMetrics'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/reports/trends:
 *   get:
 *     summary: Get complaint trends
 *     tags: [Reports]
 *     description: Retrieve complaint trends over time (Admin, Ward Officer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ["day", "week", "month"]
 *           default: "month"
 *         description: Time period for trends
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for trends
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for trends
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *         description: Filter by ward ID (Admin only)
 *     responses:
 *       200:
 *         description: Trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TrendData'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/reports/sla:
 *   get:
 *     summary: Get SLA compliance report
 *     tags: [Reports]
 *     description: Retrieve SLA compliance metrics by priority (Admin, Ward Officer)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SLA report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SLAReport'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/reports/analytics:
 *   get:
 *     summary: Get comprehensive analytics data
 *     tags: [Reports]
 *     description: Retrieve comprehensive analytics for unified reports (Admin, Ward Officer, Maintenance Team)
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
 *         name: ward
 *         schema:
 *           type: string
 *         description: Filter by ward ID (Admin only)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by complaint type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["registered", "assigned", "in_progress", "resolved", "closed", "reopened"]
 *         description: Filter by complaint status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: ["low", "medium", "high", "critical"]
 *         description: Filter by complaint priority
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AnalyticsData'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

// Routes
router.get(
  "/dashboard",
  protect,
  authorize("ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"),
  getDashboardMetrics,
);
router.get(
  "/trends",
  protect,
  authorize("ADMINISTRATOR", "WARD_OFFICER"),
  getComplaintTrends,
);
router.get("/sla", protect, authorize("ADMINISTRATOR", "WARD_OFFICER"), getSLAReport);
router.get(
  "/analytics",
  protect,
  authorize("ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"),
  getComprehensiveAnalytics,
);

// Heatmap data endpoint
// Returns matrix counts for Complaints × Wards (Admin) or Complaints × Sub-zones (Ward Officer)
router.get(
  "/heatmap",
  protect,
  authorize("ADMINISTRATOR", "WARD_OFFICER"),
  asyncHandler(async (req, res) => {
    const { from, to, type, status, priority, ward } = req.query;

    // Normalizers aligned with analytics endpoint
    const normalizeStatus = (s) => {
      if (!s) return undefined;
      const map = {
        registered: "REGISTERED",
        assigned: "ASSIGNED",
        in_progress: "IN_PROGRESS",
        inprogress: "IN_PROGRESS",
        resolved: "RESOLVED",
        closed: "CLOSED",
        reopened: "REOPENED",
      };
      return map[String(s).toLowerCase()] || undefined;
    };
    const normalizePriority = (p) => {
      if (!p) return undefined;
      const map = {
        low: "LOW",
        medium: "MEDIUM",
        high: "HIGH",
        critical: "CRITICAL",
      };
      return map[String(p).toLowerCase()] || undefined;
    };

    // Build base where with strict RBAC
    const where = {};
    if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
      where.wardId = req.user.wardId; // Ward Officer always scoped to own ward
    }
    // Allow admins to scope to a specific ward via query param
    if (req.user.role === "ADMINISTRATOR" && ward && ward !== "all") {
      where.wardId = String(ward);
    }
    if (from || to) {
      where.submittedOn = {};
      if (from) where.submittedOn.gte = new Date(from);
      if (to) where.submittedOn.lte = new Date(to);
    }
    
    // Dynamic complaint type filtering for heatmap
    if (type && type !== "all") {
      try {
        const complaintType = await getComplaintTypeById(type);
        if (complaintType) {
          // Filter by both new complaintTypeId and legacy type field for compatibility
          where.OR = [
            { complaintTypeId: parseInt(complaintType.id) },
            { type: complaintType.name },
            { type: type } // Also include direct match for legacy data
          ];
        } else {
          // Fallback to direct type filtering for legacy data
          where.type = type;
        }
      } catch (error) {
        console.warn("Complaint type resolution failed in heatmap, using direct filter:", error.message);
        where.type = type;
      }
    }
    const st = normalizeStatus(status);
    if (st) where.status = st;
    const pr = normalizePriority(priority);
    if (pr) where.priority = pr;

    try {
      if (req.user.role === "ADMINISTRATOR") {
        // Admin: Y-axis wards (all wards), X-axis complaint types present in filtered data
        const [wards, typesGroup] = await Promise.all([
          prisma.ward.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          }),
          prisma.complaint.groupBy({
            by: ["type"],
            where,
            _count: { _all: true },
          }),
        ]);

        // Original type keys sorted by count
        const xTypeKeys = typesGroup
          .map((g) => ({ key: g.type || "Others", count: g._count._all }))
          .sort((a, b) => b.count - a.count)
          .map((g) => g.key);

        // Counts grouped by wardId + type
        const grouped = await prisma.complaint.groupBy({
          by: ["wardId", "type"],
          where,
          _count: { _all: true },
        });
        const countMap = new Map();
        for (const g of grouped) {
          const key = `${g.wardId}||${g.type || "Others"}`;
          countMap.set(key, g._count._all);
        }

        const yLabels = wards.map((w) => w.name);
        const yIds = wards.map((w) => w.id);
        const matrix = yIds.map((wid) =>
          xTypeKeys.map((t) => countMap.get(`${wid}||${t}`) || 0),
        );

        // Map type keys to display names using ComplaintType table
        const complaintTypes = await prisma.complaintType.findMany({
          select: { id: true, name: true }
        });
        const typeNameMap = new Map();
        for (const ct of complaintTypes) {
          typeNameMap.set(String(ct.id), ct.name);
          typeNameMap.set(ct.name, ct.name); // Also map by name for legacy compatibility
        }
        
        // Fallback to legacy system config if needed
        if (typeNameMap.size === 0) {
          const complaintTypeConfigs = await prisma.systemConfig.findMany({
            where: { key: { startsWith: "COMPLAINT_TYPE_" } },
          });
          for (const cfg of complaintTypeConfigs) {
            try {
              const data = JSON.parse(cfg.value);
              const id = cfg.key.replace("COMPLAINT_TYPE_", "");
              typeNameMap.set(id, data.name);
            } catch (e) {
              // ignore parse errors
            }
          }
        }
        const xLabelsDisplay = xTypeKeys.map(
          (k) => typeNameMap.get(k) || k || "Others",
        );

        return res.json({
          success: true,
          message: "Heatmap data retrieved successfully",
          data: {
            xLabels: xLabelsDisplay,
            xTypeKeys,
            yLabels,
            matrix,
            xAxisLabel: "Complaint Type",
            yAxisLabel: "Ward",
            meta: { yIds },
          },
        });
      }

      if (req.user.role === "WARD_OFFICER") {
        // Ward Officer: Y-axis sub-zones of their ward, X-axis complaint types
        const wardId = req.user.wardId;
        const [subZones, typesGroup] = await Promise.all([
          prisma.subZone.findMany({
            where: { wardId },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          }),
          prisma.complaint.groupBy({
            by: ["type"],
            where: { ...where, wardId },
            _count: { _all: true },
          }),
        ]);

        const xTypeKeys = typesGroup
          .map((g) => ({ key: g.type || "Others", count: g._count._all }))
          .sort((a, b) => b.count - a.count)
          .map((g) => g.key);

        const grouped = await prisma.complaint.groupBy({
          by: ["subZoneId", "type"],
          where: { ...where, wardId },
          _count: { _all: true },
        });
        const countMap = new Map();
        for (const g of grouped) {
          const key = `${g.subZoneId || "__none"}||${g.type || "Others"}`;
          countMap.set(key, g._count._all);
        }

        const yLabels = subZones.map((s) => s.name);
        const yIds = subZones.map((s) => s.id);
        const matrix = yIds.map((sid) =>
          xTypeKeys.map((t) => countMap.get(`${sid}||${t}`) || 0),
        );

        // Map type keys to display names using ComplaintType table
        const complaintTypes = await prisma.complaintType.findMany({
          select: { id: true, name: true }
        });
        const typeNameMap = new Map();
        for (const ct of complaintTypes) {
          typeNameMap.set(String(ct.id), ct.name);
          typeNameMap.set(ct.name, ct.name); // Also map by name for legacy compatibility
        }
        
        // Fallback to legacy system config if needed
        if (typeNameMap.size === 0) {
          const complaintTypeConfigs = await prisma.systemConfig.findMany({
            where: { key: { startsWith: "COMPLAINT_TYPE_" } },
          });
          for (const cfg of complaintTypeConfigs) {
            try {
              const data = JSON.parse(cfg.value);
              const id = cfg.key.replace("COMPLAINT_TYPE_", "");
              typeNameMap.set(id, data.name);
            } catch (e) {
              // ignore parse errors
            }
          }
        }
        const xLabelsDisplay = xTypeKeys.map(
          (k) => typeNameMap.get(k) || k || "Others",
        );

        return res.json({
          success: true,
          message: "Heatmap data retrieved successfully",
          data: {
            xLabels: xLabelsDisplay,
            xTypeKeys,
            yLabels,
            matrix,
            xAxisLabel: "Complaint Type",
            yAxisLabel: "Sub-zone",
            meta: { yIds, wardId },
          },
        });
      }

      return res.status(403).json({ success: false, message: "Not allowed" });
    } catch (error) {
      console.error("Heatmap error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve heatmap data",
        error: error.message,
      });
    }
  }),
);

/**
 * @swagger
 * /api/reports/heatmap:
 *   get:
 *     summary: Get heatmap data for complaints
 *     tags: [Reports]
 *     description: Retrieve heatmap data showing complaint distribution across wards/sub-zones and types
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for heatmap data
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for heatmap data
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *         description: Filter by ward ID (Admin only)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by complaint type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by complaint status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by complaint priority
 *     responses:
 *       200:
 *         description: Heatmap data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/HeatmapData'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/reports/export:
 *   get:
 *     summary: Export reports in various formats
 *     tags: [Reports]
 *     description: Export complaint reports in CSV or JSON format (Admin, Ward Officer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["csv", "json"]
 *         description: Export format
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for export
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for export
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *         description: Filter by ward ID (Admin only)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by complaint type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by complaint status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by complaint priority
 *     responses:
 *       200:
 *         description: Report exported successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
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
 *                     summary:
 *                       type: object
 *                     filters:
 *                       type: object
 *                     exportedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

// Helper function to calculate real performance metrics
async function calculatePerformanceMetrics(prisma, where, closedWhere) {
  try {
    // Calculate user satisfaction from actual ratings
    const satisfactionResult = await prisma.complaint.aggregate({
      where: {
        ...closedWhere,
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

    // Calculate escalation rate (complaints that were escalated or reopened)
    const totalComplaints = await prisma.complaint.count({ where });
    const escalatedComplaints = await prisma.complaint.count({
      where: {
        ...where,
        OR: [
          { status: "REOPENED" },
          { priority: "CRITICAL" }
        ]
      }
    });
    const escalationRate = totalComplaints > 0 ? (escalatedComplaints / totalComplaints) * 100 : 0;

    // Calculate first call resolution (complaints resolved without reassignment)
    const resolvedComplaints = await prisma.complaint.count({
      where: {
        ...closedWhere,
        status: { in: ["RESOLVED", "CLOSED"] }
      }
    });
    
    // Count complaints that were reassigned (indicating not first-call resolution)
    const reassignedComplaints = await prisma.statusLog.groupBy({
      by: ["complaintId"],
      where: {
        toStatus: "ASSIGNED",
        complaint: closedWhere
      },
      _count: {
        complaintId: true
      }
    });

    // Filter for complaints with more than one assignment
    const actualReassignedComplaints = reassignedComplaints.filter(item => item._count.complaintId > 1);

    const firstCallResolution = resolvedComplaints > 0 
      ? ((resolvedComplaints - actualReassignedComplaints.length) / resolvedComplaints) * 100 
      : 0;

    // Calculate repeat complaints (same citizen submitting multiple complaints)
    let repeatComplaintsResult = [];
    try {
      // Use a simpler approach to avoid groupBy issues
      const allComplaintsWithPhone = await prisma.complaint.findMany({
        where: {
          ...where,
          contactPhone: { not: "" }
        },
        select: { contactPhone: true }
      });
      
      // Count duplicates manually
      const phoneCount = {};
      allComplaintsWithPhone.forEach(c => {
        if (c.contactPhone) {
          phoneCount[c.contactPhone] = (phoneCount[c.contactPhone] || 0) + 1;
        }
      });
      repeatComplaintsResult = Object.values(phoneCount).filter(count => count > 1);
    } catch (error) {
      console.warn("Repeat complaints calculation failed, using fallback:", error.message);
      // Fallback: simple count of complaints with duplicate phone numbers
      repeatComplaintsResult = [];
    }

    const repeatComplaints = repeatComplaintsResult.length;

    console.log('📊 Performance metrics calculated:', {
      userSatisfaction: userSatisfaction.toFixed(2),
      totalRatings,
      escalationRate: escalationRate.toFixed(1),
      firstCallResolution: firstCallResolution.toFixed(1),
      repeatComplaints
    });

    return {
      userSatisfaction: Math.round(userSatisfaction * 100) / 100, // Round to 2 decimal places
      escalationRate: Math.round(escalationRate * 10) / 10, // Round to 1 decimal place
      firstCallResolution: Math.round(firstCallResolution * 10) / 10,
      repeatComplaints
    };

  } catch (error) {
    console.error('❌ Error calculating performance metrics:', error);
    // Return zeros if calculation fails
    return {
      userSatisfaction: 0,
      escalationRate: 0,
      firstCallResolution: 0,
      repeatComplaints: 0,
    };
  }
}

// Helper function to calculate previous period metrics for trend comparison
async function calculatePreviousPeriodMetrics(prisma, currentWhere, currentClosedWhere, from, to, user) {
  try {
    // Calculate the previous period date range
    const currentStart = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const currentEnd = to ? new Date(to) : new Date();
    const periodDuration = currentEnd.getTime() - currentStart.getTime();
    
    const previousStart = new Date(currentStart.getTime() - periodDuration);
    const previousEnd = new Date(currentStart.getTime());

    // Build previous period where conditions
    const previousWhere = { ...currentWhere };
    delete previousWhere.submittedOn; // Remove current date filter
    previousWhere.submittedOn = {
      gte: previousStart,
      lte: previousEnd
    };

    const previousClosedWhere = { ...currentClosedWhere };
    delete previousClosedWhere.closedOn; // Remove current date filter
    delete previousClosedWhere.submittedOn; // Remove current date filter
    previousClosedWhere.status = "CLOSED";
    previousClosedWhere.closedOn = {
      gte: previousStart,
      lte: previousEnd
    };

    // Calculate previous period metrics
    const [
      prevTotalComplaints,
      prevResolvedComplaints,
      prevPendingComplaints,
      prevOverdueComplaints
    ] = await Promise.all([
      prisma.complaint.count({ where: previousWhere }),
      prisma.complaint.count({ where: { ...previousWhere, status: "RESOLVED" } }),
      prisma.complaint.count({
        where: {
          ...previousWhere,
          status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "REOPENED"] }
        }
      }),
      prisma.complaint.count({
        where: {
          ...previousWhere,
          status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
          deadline: { lt: previousEnd }
        }
      })
    ]);

    // Calculate previous SLA compliance
    const { compliance: prevSlaCompliance } = await computeSlaComplianceClosed(prisma, previousClosedWhere);

    // Calculate previous average resolution time
    const prevClosedRows = await prisma.complaint.findMany({
      where: { ...previousClosedWhere, closedOn: { not: null } },
      select: { submittedOn: true, closedOn: true }
    });

    let prevTotalResolutionDays = 0;
    for (const c of prevClosedRows) {
      if (c.closedOn && c.submittedOn) {
        const days = Math.ceil(
          (new Date(c.closedOn).getTime() - new Date(c.submittedOn).getTime()) / (1000 * 60 * 60 * 24)
        );
        prevTotalResolutionDays += days;
      }
    }
    const prevAvgResolutionTime = prevClosedRows.length ? prevTotalResolutionDays / prevClosedRows.length : 0;

    // Calculate previous satisfaction
    const prevSatisfactionResult = await prisma.complaint.aggregate({
      where: {
        ...previousClosedWhere,
        rating: { gt: 0 }
      },
      _avg: { rating: true }
    });

    return {
      total: prevTotalComplaints,
      resolved: prevResolvedComplaints,
      pending: prevPendingComplaints,
      overdue: prevOverdueComplaints,
      slaCompliance: Math.round(prevSlaCompliance * 10) / 10,
      avgResolutionTime: Math.round(prevAvgResolutionTime * 10) / 10,
      userSatisfaction: Math.round((prevSatisfactionResult._avg.rating || 0) * 100) / 100,
    };

  } catch (error) {
    console.error('❌ Error calculating previous period metrics:', error);
    // Return zeros if calculation fails
    return {
      total: 0,
      resolved: 0,
      pending: 0,
      overdue: 0,
      slaCompliance: 0,
      avgResolutionTime: 0,
      userSatisfaction: 0,
    };
  }
}

// Helper function to calculate trend percentages
function calculateTrendPercentages(current, previous, performance) {
  const calculateChange = (currentVal, previousVal) => {
    if (previousVal === 0) {
      return currentVal > 0 ? "+100%" : "0%";
    }
    const change = ((currentVal - previousVal) / previousVal) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${Math.round(change * 10) / 10}%`;
  };

  const calculateAbsoluteChange = (currentVal, previousVal) => {
    const change = currentVal - previousVal;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${Math.round(change * 100) / 100}`;
  };

  return {
    totalComplaints: calculateChange(current.total, previous.total),
    resolvedComplaints: calculateChange(current.resolved, previous.resolved),
    slaCompliance: calculateChange(current.slaCompliance, previous.slaCompliance),
    avgResolutionTime: calculateChange(current.avgResolutionTime, previous.avgResolutionTime),
    userSatisfaction: calculateAbsoluteChange(performance.userSatisfaction, previous.userSatisfaction),
  };
}

// @desc    Get complaint data for export with RBAC enforcement
// @route   GET /api/reports/export-data
// @access  Private (Admin, Ward Officer)
const getExportData = asyncHandler(async (req, res) => {
  const {
    from,
    to,
    ward,
    type,
    status,
    priority,
    format = 'json',
    limit = 10000
  } = req.query;

  // Strict RBAC enforcement - only Admin and Ward Officer can export
  if (!['ADMINISTRATOR', 'WARD_OFFICER'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to export data'
    });
  }

  // Helper: normalize enums
  const normalizeStatus = (s) => {
    if (!s) return undefined;
    const map = {
      registered: "REGISTERED",
      assigned: "ASSIGNED",
      in_progress: "IN_PROGRESS",
      inprogress: "IN_PROGRESS",
      resolved: "RESOLVED",
      closed: "CLOSED",
      reopened: "REOPENED",
    };
    return map[String(s).toLowerCase()] || s.toUpperCase();
  };

  const normalizePriority = (p) => {
    if (!p) return undefined;
    const map = {
      low: "LOW",
      medium: "MEDIUM",
      high: "HIGH",
      critical: "CRITICAL",
    };
    return map[String(p).toLowerCase()] || p.toUpperCase();
  };

  // Build where conditions with strict RBAC
  const where = {};
  
  // Ward Officer can only export from their ward
  if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
    where.wardId = req.user.wardId;
  } else if (req.user.role === "ADMINISTRATOR" && ward && ward !== "all") {
    // Admin can filter by specific ward
    where.wardId = ward;
  }

  // Date filters
  if (from || to) {
    where.submittedOn = {};
    if (from) where.submittedOn.gte = new Date(from);
    if (to) where.submittedOn.lte = new Date(to);
  }

  // Dynamic complaint type filtering
  if (type && type !== "all") {
    try {
      const complaintType = await getComplaintTypeById(type);
      if (complaintType) {
        where.OR = [
          { complaintTypeId: parseInt(complaintType.id) },
          { type: complaintType.name },
          { type: type }
        ];
      } else {
        where.type = type;
      }
    } catch (error) {
      console.warn("Complaint type resolution failed in export, using direct filter:", error.message);
      where.type = type;
    }
  }

  // Status and priority filters
  const normalizedStatus = normalizeStatus(status);
  if (normalizedStatus) where.status = normalizedStatus;
  
  const normalizedPriority = normalizePriority(priority);
  if (normalizedPriority) where.priority = normalizedPriority;

  try {
    // Limit export size to prevent memory issues
    const exportLimit = Math.min(parseInt(limit) || 10000, 50000);

    // Fetch complaints with complete data for export
    const complaints = await prisma.complaint.findMany({
      where,
      take: exportLimit,
      orderBy: { submittedOn: "desc" },
      include: {
        ward: { select: { id: true, name: true } },
        subZone: { select: { id: true, name: true } },
        submittedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
        wardOfficer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        maintenanceTeam: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        complaintType: { select: { id: true, name: true } },
        attachments: {
          where: {
            entityType: {
              in: ["COMPLAINT", "MAINTENANCE_PHOTO"]
            }
          },
          select: {
            id: true,
            name: true,
            url: true,
            entityType: true,
          },
        },
        statusLogs: {
          orderBy: { timestamp: "desc" },
          take: 5, // Include recent status changes
          include: {
            user: { select: { fullName: true, role: true } },
          },
        },
      },
    });

    // Calculate SLA status for each complaint
    const now = new Date();
    const enrichedComplaints = complaints.map((complaint) => {
      let slaStatus = complaint.slaStatus;
      if (complaint.status === "RESOLVED" || complaint.status === "CLOSED") {
        slaStatus = "COMPLETED";
      } else if (complaint.deadline instanceof Date) {
        const daysRemaining = (complaint.deadline - now) / (1000 * 60 * 60 * 24);
        if (daysRemaining < 0) slaStatus = "OVERDUE";
        else if (daysRemaining <= 1) slaStatus = "WARNING";
        else slaStatus = "ON_TIME";
      }

      return {
        ...complaint,
        type: complaint.complaintType?.name || complaint.type,
        slaStatus,
        citizenName: complaint.submittedBy?.fullName,
        contactPhone: complaint.submittedBy?.phoneNumber,
        contactEmail: complaint.submittedBy?.email,
      };
    });

    // Get total count for metadata
    const totalCount = await prisma.complaint.count({ where });

    // Prepare response with metadata
    const responseData = {
      complaints: enrichedComplaints,
      metadata: {
        totalRecords: totalCount,
        exportedRecords: enrichedComplaints.length,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.fullName || req.user.email,
        userRole: req.user.role,
        userWard: req.user.wardId,
        filters: {
          dateRange: { from, to },
          ward: req.user.role === "WARD_OFFICER" ? req.user.wardId : ward,
          type,
          status: normalizedStatus,
          priority: normalizedPriority,
        },
        exportLimit,
        truncated: totalCount > exportLimit,
      },
    };

    res.status(200).json({
      success: true,
      message: "Export data retrieved successfully",
      data: responseData,
    });

  } catch (error) {
    console.error("Export data error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve export data",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/reports/export-data:
 *   get:
 *     summary: Get complaint data for export with RBAC enforcement
 *     tags: [Reports]
 *     description: Retrieve complaint data for export with proper authorization checks (Admin, Ward Officer only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for export
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for export
 *       - in: query
 *         name: ward
 *         schema:
 *           type: string
 *         description: Ward ID filter (Admin only)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Complaint type filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [registered, assigned, in_progress, resolved, closed, reopened]
 *         description: Status filter
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Priority filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 50000
 *           default: 10000
 *         description: Maximum number of records to export
 *     responses:
 *       200:
 *         description: Export data retrieved successfully
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
 *                     complaints:
 *                       type: array
 *                       items:
 *                         type: object
 *                     metadata:
 *                       type: object
 *       403:
 *         description: Insufficient permissions for export
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 */
router.get("/export-data", protect, authorize("ADMINISTRATOR", "WARD_OFFICER"), getExportData);

export default router;
