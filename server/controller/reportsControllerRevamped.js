import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { computeSlaComplianceClosed, getTypeSlaMap } from "../utils/sla.js";
import { getComplaintTypeById, getComplaintTypes } from "../utils/complaintTypeHelper.js";
import { getActiveSystemConfig } from "./systemConfigController.js";

const prisma = getPrisma();

/**
 * Enhanced helper functions for performance metrics calculation
 */

// Calculate performance metrics with proper data validation
const calculatePerformanceMetrics = async (prisma, where, closedWhere) => {
    try {
        // Get total complaints for the period
        const totalComplaints = await prisma.complaint.count({ where });

        if (totalComplaints === 0) {
            return {
                userSatisfaction: 0,
                escalationRate: 0,
                firstCallResolution: 0,
                repeatComplaints: 0,
            };
        }

        // Calculate escalation rate (complaints that were escalated or reopened)
        const escalatedComplaints = await prisma.complaint.count({
            where: {
                ...where,
                OR: [
                    { status: "REOPENED" },
                    { priority: "CRITICAL" }, // Assuming critical priority indicates escalation
                ],
            },
        });

        // Calculate first call resolution (resolved without being reopened)
        const firstCallResolved = await prisma.complaint.count({
            where: {
                ...where,
                status: "RESOLVED",
                // Add condition to check if complaint was never reopened
                // This would require tracking complaint history in a separate table
            },
        });

        // Calculate repeat complaints using safer Prisma approach with enhanced error handling
        let repeatCount = 0;
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            // Validate date to prevent invalid queries
            if (isNaN(thirtyDaysAgo.getTime())) {
                console.warn("Invalid date calculation for repeat complaints, using fallback");
                repeatCount = 0;
            } else {
                // Use simpler approach to avoid groupBy issues
                const allComplaintsWithPhone = await Promise.race([
                    prisma.complaint.findMany({
                        where: {
                            submittedOn: { gte: thirtyDaysAgo },
                            contactPhone: { not: "" }
                        },
                        select: { contactPhone: true }
                    }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Query timeout')), 5000)
                    )
                ]);

                // Count duplicates manually
                if (Array.isArray(allComplaintsWithPhone)) {
                    const phoneCount = {};
                    allComplaintsWithPhone.forEach(c => {
                        if (c.contactPhone) {
                            phoneCount[c.contactPhone] = (phoneCount[c.contactPhone] || 0) + 1;
                        }
                    });
                    repeatCount = Object.values(phoneCount).filter(count => count > 1).length;
                } else {
                    repeatCount = 0;
                }
            }
        } catch (error) {
            console.warn("Failed to calculate repeat complaints, using fallback:", {
                error: error.message,
                timestamp: new Date().toISOString(),
                function: 'calculatePerformanceMetrics'
            });
            repeatCount = 0;
        }

        // Mock user satisfaction (in real implementation, this would come from feedback/ratings)
        // For now, calculate based on resolution time vs SLA
        const resolvedComplaints = await prisma.complaint.findMany({
            where: closedWhere,
            select: {
                submittedOn: true,
                closedOn: true,
                type: true,
            },
        });

        let satisfactionScore = 4.0; // Default good score
        if (resolvedComplaints.length > 0) {
            const typeSlaMap = await getTypeSlaMap(prisma);
            let onTimeResolutions = 0;

            for (const complaint of resolvedComplaints) {
                if (complaint.closedOn && complaint.submittedOn) {
                    const slaHours = typeSlaMap.get(complaint.type) || 48;
                    const targetTime = new Date(complaint.submittedOn.getTime() + slaHours * 60 * 60 * 1000);
                    if (complaint.closedOn <= targetTime) {
                        onTimeResolutions++;
                    }
                }
            }

            const onTimeRate = onTimeResolutions / resolvedComplaints.length;
            satisfactionScore = 2.0 + (onTimeRate * 3.0); // Scale from 2.0 to 5.0 based on SLA compliance
        }

        return {
            userSatisfaction: Math.round(satisfactionScore * 10) / 10,
            escalationRate: Math.round((escalatedComplaints / totalComplaints) * 1000) / 10,
            firstCallResolution: Math.round((firstCallResolved / totalComplaints) * 1000) / 10,
            repeatComplaints: Math.round((repeatCount / totalComplaints) * 1000) / 10,
        };
    } catch (error) {
        console.error("Error calculating performance metrics:", error);
        return {
            userSatisfaction: 0,
            escalationRate: 0,
            firstCallResolution: 0,
            repeatComplaints: 0,
        };
    }
};

// Calculate previous period metrics for comparison
const calculatePreviousPeriodMetrics = async (prisma, where, closedWhere, from, to, user) => {
    try {
        if (!from || !to) {
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

        // Calculate previous period dates
        const currentStart = new Date(from);
        const currentEnd = new Date(to);
        const periodDuration = currentEnd.getTime() - currentStart.getTime();

        const previousStart = new Date(currentStart.getTime() - periodDuration);
        const previousEnd = new Date(currentStart.getTime());

        // Build previous period where clause
        const previousWhere = { ...where };
        delete previousWhere.submittedOn;
        previousWhere.submittedOn = {
            gte: previousStart,
            lte: previousEnd,
        };

        const previousClosedWhere = { ...closedWhere };
        delete previousClosedWhere.closedOn;
        previousClosedWhere.closedOn = {
            gte: previousStart,
            lte: previousEnd,
        };

        // Get previous period metrics
        const [
            prevTotal,
            prevResolved,
            prevPending,
            prevOverdue,
        ] = await Promise.all([
            prisma.complaint.count({ where: previousWhere }),
            prisma.complaint.count({ where: { ...previousWhere, status: "RESOLVED" } }),
            prisma.complaint.count({
                where: {
                    ...previousWhere,
                    status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
                },
            }),
            prisma.complaint.count({
                where: {
                    ...previousWhere,
                    status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
                    deadline: { lt: previousEnd },
                },
            }),
        ]);

        // Calculate previous SLA compliance
        const { compliance: prevSlaCompliance } = await computeSlaComplianceClosed(
            prisma,
            previousClosedWhere,
        );

        // Calculate previous average resolution time
        const prevClosedComplaints = await prisma.complaint.findMany({
            where: previousClosedWhere,
            select: { submittedOn: true, closedOn: true },
        });

        let prevTotalResolutionDays = 0;
        let prevValidComplaintsCount = 0;
        
        for (const complaint of prevClosedComplaints) {
            if (complaint.closedOn && complaint.submittedOn) {
                prevValidComplaintsCount++;
                const days = Math.ceil(
                    (complaint.closedOn.getTime() - complaint.submittedOn.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                prevTotalResolutionDays += days;
            }
        }

        const prevAvgResolutionTime = prevValidComplaintsCount
            ? prevTotalResolutionDays / prevValidComplaintsCount
            : 0;

        // Calculate previous performance metrics
        const prevPerformance = await calculatePerformanceMetrics(prisma, previousWhere, previousClosedWhere);

        return {
            total: prevTotal,
            resolved: prevResolved,
            pending: prevPending,
            overdue: prevOverdue,
            slaCompliance: Math.round(prevSlaCompliance * 10) / 10,
            avgResolutionTime: Math.round(prevAvgResolutionTime * 10) / 10,
            userSatisfaction: prevPerformance.userSatisfaction,
        };
    } catch (error) {
        console.error("Error calculating previous period metrics:", error);
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
};

// Calculate trend percentages for comparison
const calculateTrendPercentages = (current, previous, performance) => {
    const calculateChange = (currentVal, previousVal) => {
        if (previousVal === 0) {
            return currentVal > 0 ? "+100%" : "0%";
        }
        const change = ((currentVal - previousVal) / previousVal) * 100;
        return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
    };

    return {
        totalComplaints: calculateChange(current.total, previous.total),
        resolvedComplaints: calculateChange(current.resolved, previous.resolved),
        slaCompliance: calculateChange(current.slaCompliance, previous.slaCompliance),
        avgResolutionTime: calculateChange(current.avgResolutionTime, previous.avgResolutionTime),
        userSatisfaction: calculateChange(performance.userSatisfaction, previous.userSatisfaction),
    };
};

/**
 * @desc    Get unified analytics data for comprehensive dashboard
 * @route   GET /api/reports-revamped/unified
 * @access  Private (Admin, Ward Officer, Maintenance)
 */
export const getUnifiedAnalytics = asyncHandler(async (req, res) => {
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
        where.wardId = req.user.wardId;
    } else if (req.user.role === "MAINTENANCE_TEAM") {
        where.assignedToId = req.user.id;
    } else if (req.user.role === "CITIZEN") {
        where.submittedById = req.user.id;
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
                where.OR = [
                    { complaintTypeId: parseInt(complaintType.id) },
                    { type: complaintType.name },
                    { type: type },
                ];
            } else {
                where.type = type;
            }
        } catch (error) {
            console.warn("Complaint type resolution failed in analytics:", error.message);
            where.type = type;
        }
    }

    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) where.status = normalizedStatus;
    const normalizedPriority = normalizePriority(priority);
    if (normalizedPriority) where.priority = normalizedPriority;

    // Build separate filter for CLOSED metrics
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

        // Get system configuration for branding
        const [appName, appLogoUrl, complaintIdPrefix] = await Promise.all([
            getActiveSystemConfig("APP_NAME", "NLC-CMS"),
            getActiveSystemConfig("APP_LOGO_URL", "/logo.png"),
            getActiveSystemConfig("COMPLAINT_ID_PREFIX", "KSC"),
        ]);

        // Enhanced parallel execution for better performance
        const [
            totalComplaints,
            resolvedComplaints,
            pendingComplaints,
            overdueComplaints,
            reopenedComplaints,
            criticalComplaints,
        ] = await Promise.all([
            prisma.complaint.count({ where }),
            prisma.complaint.count({ where: { ...where, status: "RESOLVED" } }),
            prisma.complaint.count({
                where: {
                    ...where,
                    status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS"] },
                },
            }),
            prisma.complaint.count({
                where: {
                    ...where,
                    status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS"] },
                    deadline: { lt: new Date() },
                },
            }),
            prisma.complaint.count({ where: { ...where, status: "REOPENED" } }),
            prisma.complaint.count({ where: { ...where, priority: "CRITICAL" } }),
        ]);

        // Enhanced SLA compliance calculation
        const { compliance: slaCompliance } = await computeSlaComplianceClosed(
            prisma,
            closedWhere,
        );

        // Build type SLA map for calculations
        const typeSlaMap = await getTypeSlaMap(prisma);

        // Enhanced average resolution time calculation
        const closedRows = await prisma.complaint.findMany({
            where: closedWhere,
            select: { submittedOn: true, closedOn: true, type: true },
        });

        let totalResolutionDays = 0;
        let slaCompliantCount = 0;
        let validComplaintsCount = 0;
        
        for (const complaint of closedRows) {
            if (complaint.closedOn && complaint.submittedOn) {
                validComplaintsCount++;
                const days = Math.ceil(
                    (complaint.closedOn.getTime() - complaint.submittedOn.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                totalResolutionDays += days;

                // Check SLA compliance
                const slaHours = typeSlaMap.get(complaint.type) || 48;
                const targetTime = new Date(complaint.submittedOn.getTime() + slaHours * 60 * 60 * 1000);
                if (complaint.closedOn <= targetTime) {
                    slaCompliantCount++;
                }
            }
        }
        const avgResolutionTime = validComplaintsCount
            ? totalResolutionDays / validComplaintsCount
            : 0;

        // Enhanced trends calculation with better date handling
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
            const date = new Date(rangeStart.getTime());
            date.setDate(rangeStart.getDate() + i);
            const key = date.toISOString().split("T")[0];
            trendsMap.set(key, {
                complaints: 0,
                resolved: 0,
                slaCompliance: 0,
                slaResolved: 0,
                registered: 0,
                assigned: 0,
                inProgress: 0,
                reopened: 0,
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

        for (const complaint of trendsRows) {
            const key = complaint.submittedOn.toISOString().split("T")[0];
            if (trendsMap.has(key)) {
                const trend = trendsMap.get(key);
                trend.complaints += 1;

                // Track by status
                switch (complaint.status) {
                    case "REGISTERED":
                        trend.registered += 1;
                        break;
                    case "ASSIGNED":
                        trend.assigned += 1;
                        break;
                    case "IN_PROGRESS":
                        trend.inProgress += 1;
                        break;
                    case "REOPENED":
                        trend.reopened += 1;
                        break;
                }
            }

            if (complaint.status === "CLOSED" && complaint.closedOn) {
                const resolvedKey = complaint.closedOn.toISOString().split("T")[0];
                if (trendsMap.has(resolvedKey)) {
                    const trend = trendsMap.get(resolvedKey);
                    trend.resolved += 1;

                    const slaHours = typeSlaMap.get(complaint.type);
                    if (slaHours) {
                        const targetTime = new Date(complaint.submittedOn.getTime() + slaHours * 60 * 60 * 1000);
                        if (complaint.closedOn <= targetTime) trend.slaCompliance += 1;
                        trend.slaResolved += 1;
                    }
                }
            }
        }

        const trends = Array.from(trendsMap.entries()).map(([date, values]) => ({
            date,
            complaints: values.complaints,
            resolved: values.resolved,
            registered: values.registered,
            assigned: values.assigned,
            inProgress: values.inProgress,
            reopened: values.reopened,
            slaCompliance: values.slaResolved
                ? Math.round((values.slaCompliance / values.slaResolved) * 1000) / 10
                : 0,
        }));

        // Enhanced ward performance (admin only)
        let wards = [];
        if (req.user.role === "ADMINISTRATOR") {
            const [wardTotals, wardResolved, wardsMeta] = await Promise.all([
                prisma.complaint.groupBy({
                    by: ["wardId"],
                    where,
                    _count: { _all: true },
                }),
                prisma.complaint.groupBy({
                    by: ["wardId"],
                    where: closedWhere,
                    _count: { _all: true },
                }),
                prisma.ward.findMany({
                    select: { id: true, name: true },
                }),
            ]);

            const wardResolutionTimes = await prisma.complaint.findMany({
                where: closedWhere,
                select: { wardId: true, submittedOn: true, closedOn: true },
            });

            const avgTimeByWard = new Map();
            for (const complaint of wardResolutionTimes) {
                if (complaint.submittedOn && complaint.closedOn) {
                    const days = Math.ceil(
                        (complaint.closedOn.getTime() - complaint.submittedOn.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    const existing = avgTimeByWard.get(complaint.wardId) || { sum: 0, count: 0 };
                    existing.sum += days;
                    existing.count += 1;
                    avgTimeByWard.set(complaint.wardId, existing);
                }
            }

            const resolvedMap = new Map(wardResolved.map((w) => [w.wardId, w._count._all]));
            const wardNameMap = new Map(wardsMeta.map((w) => [w.id, w.name]));

            wards = wardTotals.map((ward) => {
                const resolved = resolvedMap.get(ward.wardId) || 0;
                const avgData = avgTimeByWard.get(ward.wardId);
                return {
                    id: ward.wardId,
                    name: wardNameMap.get(ward.wardId) || ward.wardId,
                    complaints: ward._count._all,
                    resolved,
                    pending: ward._count._all - resolved,
                    avgTime: avgData ? Math.round((avgData.sum / avgData.count) * 10) / 10 : 0,
                    slaScore: ward._count._all
                        ? Math.round((resolved / ward._count._all) * 1000) / 10
                        : 0,
                    efficiency: ward._count._all
                        ? Math.round((resolved / ward._count._all) * 100)
                        : 0,
                };
            });
        }

        // Enhanced categories breakdown with dynamic complaint type names
        const categoriesGroup = await prisma.complaint.groupBy({
            by: ["type"],
            where,
            _count: { _all: true },
        });

        const categoryResolutionTimes = await prisma.complaint.findMany({
            where: closedWhere,
            select: { type: true, submittedOn: true, closedOn: true },
        });

        const timeByType = new Map();
        for (const complaint of categoryResolutionTimes) {
            if (complaint.submittedOn && complaint.closedOn) {
                const days = Math.ceil(
                    (complaint.closedOn.getTime() - complaint.submittedOn.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                const existing = timeByType.get(complaint.type) || { sum: 0, count: 0 };
                existing.sum += days;
                existing.count += 1;
                timeByType.set(complaint.type, existing);
            }
        }

        // Get all complaint types for proper name resolution
        const allComplaintTypes = await getComplaintTypes();
        const typeNameMap = new Map();
        for (const complaintType of allComplaintTypes) {
            typeNameMap.set(complaintType.name, complaintType.name);
            typeNameMap.set(complaintType.id, complaintType.name);
        }

        const categories = categoriesGroup.map((group, index) => {
            const typeName = typeNameMap.get(group.type) || group.type || "Others";
            const timeData = timeByType.get(group.type);
            return {
                name: typeName,
                count: group._count._all,
                avgTime: timeData
                    ? Math.round((timeData.sum / timeData.count) * 10) / 10
                    : 0,
                color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
                percentage: totalComplaints > 0
                    ? Math.round((group._count._all / totalComplaints) * 100)
                    : 0,
            };
        });

        // Enhanced priority breakdown
        const priorityBreakdown = await prisma.complaint.groupBy({
            by: ["priority"],
            where,
            _count: { _all: true },
        });

        const priorities = priorityBreakdown.map((group) => ({
            name: group.priority || "UNASSIGNED",
            count: group._count._all,
            percentage: totalComplaints > 0
                ? Math.round((group._count._all / totalComplaints) * 100)
                : 0,
        }));

        // Enhanced status breakdown
        const statusBreakdown = await prisma.complaint.groupBy({
            by: ["status"],
            where,
            _count: { _all: true },
        });

        const statuses = statusBreakdown.map((group) => ({
            name: group.status,
            count: group._count._all,
            percentage: totalComplaints > 0
                ? Math.round((group._count._all / totalComplaints) * 100)
                : 0,
        }));

        // Team performance (for administrators and ward officers)
        let teamPerformance = [];
        if (req.user.role === "ADMINISTRATOR" || req.user.role === "WARD_OFFICER") {
            const teamQuery = req.user.role === "WARD_OFFICER"
                ? { wardId: req.user.wardId }
                : {};

            const officers = await prisma.user.findMany({
                where: {
                    role: { in: ["WARD_OFFICER", "MAINTENANCE_TEAM"] },
                    isActive: true,
                    ...teamQuery,
                },
                select: {
                    id: true,
                    fullName: true,
                    role: true,
                    wardId: true,
                    ward: { select: { name: true } },
                },
            });

            for (const officer of officers) {
                const officerComplaints = await prisma.complaint.count({
                    where: { ...where, assignedToId: officer.id },
                });

                const officerResolved = await prisma.complaint.count({
                    where: { ...where, assignedToId: officer.id, status: "RESOLVED" },
                });

                const officerAvgTime = await prisma.complaint.findMany({
                    where: {
                        assignedToId: officer.id,
                        status: "CLOSED",
                        AND: [
                            { closedOn: { not: null } },
                            { submittedOn: { not: null } }
                        ]
                    },
                    select: { submittedOn: true, closedOn: true },
                });

                let avgResolutionDays = 0;
                if (officerAvgTime.length > 0) {
                    const totalDays = officerAvgTime.reduce((sum, complaint) => {
                        const days = Math.ceil(
                            (complaint.closedOn.getTime() - complaint.submittedOn.getTime()) /
                            (1000 * 60 * 60 * 24),
                        );
                        return sum + days;
                    }, 0);
                    avgResolutionDays = totalDays / officerAvgTime.length;
                }

                teamPerformance.push({
                    id: officer.id,
                    name: officer.fullName,
                    role: officer.role,
                    ward: officer.ward?.name || "Unassigned",
                    totalComplaints: officerComplaints,
                    resolvedComplaints: officerResolved,
                    avgResolutionTime: Math.round(avgResolutionDays * 10) / 10,
                    efficiency: officerComplaints > 0
                        ? Math.round((officerResolved / officerComplaints) * 100)
                        : 0,
                });
            }
        }

        // Calculate current period metrics
        const currentPeriodMetrics = {
            total: totalComplaints,
            resolved: resolvedComplaints,
            pending: pendingComplaints,
            overdue: overdueComplaints,
            reopened: reopenedComplaints,
            critical: criticalComplaints,
            slaCompliance: Math.round(slaCompliance * 10) / 10,
            avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        };

        // Calculate performance and comparison metrics
        const performanceMetrics = await calculatePerformanceMetrics(prisma, where, closedWhere);
        const previousPeriodMetrics = await calculatePreviousPeriodMetrics(
            prisma,
            where,
            closedWhere,
            from,
            to,
            req.user,
        );

        // Build comprehensive unified analytics response
        const unifiedAnalyticsData = {
            summary: {
                totalComplaints,
                resolvedComplaints,
                pendingComplaints,
                overdueComplaints,
                reopenedComplaints,
                criticalComplaints,
                resolutionRate: totalComplaints > 0
                    ? Math.round((resolvedComplaints / totalComplaints) * 100)
                    : 0,
            },
            sla: {
                compliance: Math.round(slaCompliance * 10) / 10,
                avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
                target: 72, // Default SLA target in hours
                compliantCount: slaCompliantCount,
                totalClosed: closedRows.length,
            },
            trends,
            wards,
            categories,
            priorities,
            statuses,
            teamPerformance,
            performance: performanceMetrics,
            comparison: {
                current: currentPeriodMetrics,
                previous: previousPeriodMetrics,
                trends: calculateTrendPercentages(
                    currentPeriodMetrics,
                    previousPeriodMetrics,
                    performanceMetrics,
                ),
            },
            metadata: {
                totalRecords: totalComplaints,
                pageSize: pageSize,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalComplaints / pageSize),
                dataFetchedAt: new Date().toISOString(),
                dateRange: { from, to },
                appliedFilters: {
                    ward: ward || "all",
                    type: type || "all",
                    status: status || "all",
                    priority: priority || "all",
                },
                systemConfig: {
                    appName,
                    appLogoUrl,
                    complaintIdPrefix,
                },
                userContext: {
                    role: req.user.role,
                    wardId: req.user.wardId,
                    canViewAllWards: req.user.role === "ADMINISTRATOR",
                    canViewTeamPerformance: req.user.role === "ADMINISTRATOR" || req.user.role === "WARD_OFFICER",
                },
            },
        };

        // Set appropriate cache headers
        res.set({ "Cache-Control": "public, max-age=300" });

        res.status(200).json({
            success: true,
            message: "Unified analytics data retrieved successfully",
            data: unifiedAnalyticsData,
        });
    } catch (error) {
        console.error("Unified analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve unified analytics data",
            error: error.message,
        });
    }
});

/**
 * @desc    Get comprehensive analytics data for unified reports (REVAMPED)
 * @route   GET /api/reports/analytics-revamped
 * @access  Private (Admin, Ward Officer, Maintenance)
 */
export const getComprehensiveAnalyticsRevamped = asyncHandler(async (req, res) => {
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
        where.wardId = req.user.wardId;
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
                where.OR = [
                    { complaintTypeId: parseInt(complaintType.id) },
                    { type: complaintType.name },
                    { type: type },
                ];
            } else {
                where.type = type;
            }
        } catch (error) {
            console.warn("Complaint type resolution failed in analytics:", error.message);
            where.type = type;
        }
    }

    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) where.status = normalizedStatus;
    const normalizedPriority = normalizePriority(priority);
    if (normalizedPriority) where.priority = normalizedPriority;

    // Build separate filter for CLOSED metrics
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

        // Get system configuration for branding
        const [appName, appLogoUrl, complaintIdPrefix] = await Promise.all([
            getActiveSystemConfig("APP_NAME", "NLC-CMS"),
            getActiveSystemConfig("APP_LOGO_URL", "/logo.png"),
            getActiveSystemConfig("COMPLAINT_ID_PREFIX", "KSC"),
        ]);

        // Parallel execution for better performance
        const [
            totalComplaints,
            resolvedComplaints,
            pendingComplaints,
            overdueComplaints,
        ] = await Promise.all([
            prisma.complaint.count({ where }),
            prisma.complaint.count({ where: { ...where, status: "RESOLVED" } }),
            prisma.complaint.count({
                where: {
                    ...where,
                    status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
                },
            }),
            prisma.complaint.count({
                where: {
                    ...where,
                    status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
                    deadline: { lt: new Date() },
                },
            }),
        ]);

        // SLA compliance calculation
        const { compliance: slaCompliance } = await computeSlaComplianceClosed(
            prisma,
            closedWhere,
        );

        // Build type SLA map for calculations
        const typeSlaMap = await getTypeSlaMap(prisma);

        // Average resolution time calculation
        const closedRows = await prisma.complaint.findMany({
            where: closedWhere,
            select: { submittedOn: true, closedOn: true },
        });

        let totalResolutionDays = 0;
        let validComplaintsCount = 0;
        
        for (const complaint of closedRows) {
            if (complaint.closedOn && complaint.submittedOn) {
                validComplaintsCount++;
                const days = Math.ceil(
                    (complaint.closedOn.getTime() - complaint.submittedOn.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                totalResolutionDays += days;
            }
        }
        const avgResolutionTime = validComplaintsCount
            ? totalResolutionDays / validComplaintsCount
            : 0;

        // Enhanced trends calculation with better date handling
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
            const date = new Date(rangeStart.getTime());
            date.setDate(rangeStart.getDate() + i);
            const key = date.toISOString().split("T")[0];
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

        for (const complaint of trendsRows) {
            const key = complaint.submittedOn.toISOString().split("T")[0];
            if (trendsMap.has(key)) trendsMap.get(key).complaints += 1;

            if (complaint.status === "CLOSED" && complaint.closedOn) {
                const resolvedKey = complaint.closedOn.toISOString().split("T")[0];
                if (trendsMap.has(resolvedKey)) {
                    const trend = trendsMap.get(resolvedKey);
                    trend.resolved += 1;

                    const slaHours = typeSlaMap.get(complaint.type);
                    if (slaHours) {
                        const targetTime = new Date(complaint.submittedOn.getTime() + slaHours * 60 * 60 * 1000);
                        if (complaint.closedOn <= targetTime) trend.slaCompliance += 1;
                        trend.slaResolved += 1;
                    }
                }
            }
        }

        const trends = Array.from(trendsMap.entries()).map(([date, values]) => ({
            date,
            complaints: values.complaints,
            resolved: values.resolved,
            slaCompliance: values.slaResolved
                ? Math.round((values.slaCompliance / values.slaResolved) * 1000) / 10
                : 0,
        }));

        // Enhanced ward performance (admin only)
        let wards = [];
        if (req.user.role === "ADMINISTRATOR") {
            const [wardTotals, wardResolved, wardsMeta] = await Promise.all([
                prisma.complaint.groupBy({
                    by: ["wardId"],
                    where,
                    _count: { _all: true },
                }),
                prisma.complaint.groupBy({
                    by: ["wardId"],
                    where: closedWhere,
                    _count: { _all: true },
                }),
                prisma.ward.findMany({
                    select: { id: true, name: true },
                }),
            ]);

            const wardResolutionTimes = await prisma.complaint.findMany({
                where: closedWhere,
                select: { wardId: true, submittedOn: true, closedOn: true },
            });

            const avgTimeByWard = new Map();
            for (const complaint of wardResolutionTimes) {
                if (complaint.submittedOn && complaint.closedOn) {
                    const days = Math.ceil(
                        (complaint.closedOn.getTime() - complaint.submittedOn.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    const existing = avgTimeByWard.get(complaint.wardId) || { sum: 0, count: 0 };
                    existing.sum += days;
                    existing.count += 1;
                    avgTimeByWard.set(complaint.wardId, existing);
                }
            }

            const resolvedMap = new Map(wardResolved.map((w) => [w.wardId, w._count._all]));
            const wardNameMap = new Map(wardsMeta.map((w) => [w.id, w.name]));

            wards = wardTotals.map((ward) => {
                const resolved = resolvedMap.get(ward.wardId) || 0;
                const avgData = avgTimeByWard.get(ward.wardId);
                return {
                    id: ward.wardId,
                    name: wardNameMap.get(ward.wardId) || ward.wardId,
                    complaints: ward._count._all,
                    resolved,
                    avgTime: avgData ? Math.round((avgData.sum / avgData.count) * 10) / 10 : 0,
                    slaScore: ward._count._all
                        ? Math.round((resolved / ward._count._all) * 1000) / 10
                        : 0,
                };
            });
        }

        // Enhanced categories breakdown with dynamic complaint type names
        const categoriesGroup = await prisma.complaint.groupBy({
            by: ["type"],
            where,
            _count: { _all: true },
        });

        const categoryResolutionTimes = await prisma.complaint.findMany({
            where: closedWhere,
            select: { type: true, submittedOn: true, closedOn: true },
        });

        const timeByType = new Map();
        for (const complaint of categoryResolutionTimes) {
            if (complaint.submittedOn && complaint.closedOn) {
                const days = Math.ceil(
                    (complaint.closedOn.getTime() - complaint.submittedOn.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                const existing = timeByType.get(complaint.type) || { sum: 0, count: 0 };
                existing.sum += days;
                existing.count += 1;
                timeByType.set(complaint.type, existing);
            }
        }

        // Get all complaint types for proper name resolution
        const allComplaintTypes = await getComplaintTypes();
        const typeNameMap = new Map();
        for (const complaintType of allComplaintTypes) {
            typeNameMap.set(complaintType.name, complaintType.name);
            typeNameMap.set(complaintType.id, complaintType.name);
        }

        const categories = categoriesGroup.map((group, index) => {
            const typeName = typeNameMap.get(group.type) || group.type || "Others";
            const timeData = timeByType.get(group.type);
            return {
                name: typeName,
                count: group._count._all,
                avgTime: timeData
                    ? Math.round((timeData.sum / timeData.count) * 10) / 10
                    : 0,
                color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`, // Better color distribution
            };
        });

        // Calculate current period metrics
        const currentPeriodMetrics = {
            total: totalComplaints,
            resolved: resolvedComplaints,
            pending: pendingComplaints,
            overdue: overdueComplaints,
            slaCompliance: Math.round(slaCompliance * 10) / 10,
            avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        };

        // Calculate performance and comparison metrics
        const performanceMetrics = await calculatePerformanceMetrics(prisma, where, closedWhere);
        const previousPeriodMetrics = await calculatePreviousPeriodMetrics(
            prisma,
            where,
            closedWhere,
            from,
            to,
            req.user,
        );

        // Build comprehensive analytics response
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
                target: 72, // Default SLA target in hours
            },
            trends,
            wards,
            categories,
            performance: performanceMetrics,
            comparison: {
                current: currentPeriodMetrics,
                previous: previousPeriodMetrics,
                trends: calculateTrendPercentages(
                    currentPeriodMetrics,
                    previousPeriodMetrics,
                    performanceMetrics,
                ),
            },
            metadata: {
                totalRecords: totalComplaints,
                pageSize: pageSize,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalComplaints / pageSize),
                dataFetchedAt: new Date().toISOString(),
                systemConfig: {
                    appName,
                    appLogoUrl,
                    complaintIdPrefix,
                },
                userContext: {
                    role: req.user.role,
                    wardId: req.user.wardId,
                    canViewAllWards: req.user.role === "ADMINISTRATOR",
                },
            },
        };

        // Set appropriate cache headers
        res.set({ "Cache-Control": "public, max-age=300" });

        res.status(200).json({
            success: true,
            message: "Enhanced analytics data retrieved successfully",
            data: analyticsData,
        });
    } catch (error) {
        console.error("Enhanced analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve enhanced analytics data",
            error: error.message,
        });
    }
});

/**
 * @desc    Export reports with enhanced branding and formatting
 * @route   GET /api/reports-revamped/export
 * @access  Private (Admin, Ward Officer)
 */
export const exportReportsRevamped = asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const { format = 'json', from, to, ward, type, status, priority } = req.query;

    console.log(`[EXPORT] Starting ${format} export for user ${req.user.id} (${req.user.role})`, {
        filters: { from, to, ward, type, status, priority },
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent']
    });

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

    const where = {};
    if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
        where.wardId = req.user.wardId;
    } else if (req.user.role === "ADMINISTRATOR" && ward && ward !== "all") {
        // Handle comma-separated ward values
        const wardIds = ward.split(',').map(w => w.trim()).filter(w => w);
        if (wardIds.length === 1) {
            where.wardId = wardIds[0];
        } else if (wardIds.length > 1) {
            where.wardId = { in: wardIds };
        }
    }

    if (from || to) {
        where.submittedOn = {};
        if (from) where.submittedOn.gte = new Date(from);
        if (to) where.submittedOn.lte = new Date(to);
    }

    // Dynamic complaint type filtering for export - handle comma-separated values
    if (type && type !== "all") {
        const typeIds = type.split(',').map(t => t.trim()).filter(t => t);
        if (typeIds.length === 1) {
            try {
                const complaintType = await getComplaintTypeById(typeIds[0]);
                if (complaintType) {
                    where.OR = [
                        { complaintTypeId: parseInt(complaintType.id) },
                        { type: complaintType.name },
                        { type: typeIds[0] },
                    ];
                } else {
                    where.type = typeIds[0];
                }
            } catch (error) {
                console.warn("Complaint type resolution failed in export:", error.message);
                where.type = typeIds[0];
            }
        } else if (typeIds.length > 1) {
            // Multiple types - use IN clause
            where.type = { in: typeIds };
        }
    }

    // Handle comma-separated status values
    if (status && status !== "all") {
        const statusIds = status.split(',').map(s => s.trim()).filter(s => s);
        const normalizedStatuses = statusIds.map(s => normalizeStatus(s)).filter(s => s);
        if (normalizedStatuses.length === 1) {
            where.status = normalizedStatuses[0];
        } else if (normalizedStatuses.length > 1) {
            where.status = { in: normalizedStatuses };
        }
    }

    // Handle comma-separated priority values
    if (priority && priority !== "all") {
        const priorityIds = priority.split(',').map(p => p.trim()).filter(p => p);
        const normalizedPriorities = priorityIds.map(p => normalizePriority(p)).filter(p => p);
        if (normalizedPriorities.length === 1) {
            where.priority = normalizedPriorities[0];
        } else if (normalizedPriorities.length > 1) {
            where.priority = { in: normalizedPriorities };
        }
    }

    try {
        // Get system configuration for branding with timeout protection
        const [appName, appLogoUrl, complaintIdPrefix] = await Promise.race([
            Promise.all([
                getActiveSystemConfig("APP_NAME", "NLC-CMS"),
                getActiveSystemConfig("APP_LOGO_URL", "/logo.png"),
                getActiveSystemConfig("COMPLAINT_ID_PREFIX", "KSC"),
            ]),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('System config timeout')), 3000)
            )
        ]).catch(error => {
            console.warn('System config fetch failed, using defaults:', error.message);
            return ["Smart CMS", "/logo.png", "CMS"];
        });

        // Fetch complaints with optimized query and timeout protection
        const complaints = await Promise.race([
            prisma.complaint.findMany({
                where,
                include: {
                    ward: { select: { id: true, name: true } },
                    assignedTo: { select: { id: true, fullName: true } },
                    submittedBy: { select: { id: true, fullName: true } },
                    complaintType: { select: { id: true, name: true, slaHours: true } },
                },
                orderBy: { submittedOn: "desc" },
                take: 10000, // Limit to prevent memory issues
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database query timeout')), 15000)
            )
        ]).catch(error => {
            console.error('Failed to fetch complaints for export:', {
                error: error.message,
                userId: req.user.id,
                filters: where,
                timestamp: new Date().toISOString()
            });
            throw new Error('Failed to fetch complaint data for export');
        });

        // All export formats (PDF, Excel, CSV) are now handled by frontend
        // Backend only provides JSON data for frontend processing

        // Enhanced response with system branding
        res.json({
            success: true,
            message: "Export data prepared successfully with enhanced formatting",
            data: {
                complaints: complaints.map((complaint) => ({
                    ...complaint,
                    formattedId: `${complaintIdPrefix}-${String(complaint.id).padStart(6, "0")}`,
                    typeName: complaint.complaintType?.name || complaint.type,
                })),
                summary: {
                    total: complaints.length,
                    resolved: complaints.filter((c) => c.status === "RESOLVED").length,
                    pending: complaints.filter((c) =>
                        ["REGISTERED", "ASSIGNED", "IN_PROGRESS"].includes(c.status),
                    ).length,
                    overdue: complaints.filter((c) =>
                        c.deadline &&
                        new Date() > new Date(c.deadline) &&
                        ["REGISTERED", "ASSIGNED", "IN_PROGRESS"].includes(c.status)
                    ).length,
                },
                filters: {
                    from,
                    to,
                    ward: req.user.role === "WARD_OFFICER" ? req.user.wardId : ward,
                    type,
                    status: normalizedStatus || "all",
                    priority: normalizedPriority || "all",
                },
                systemConfig: {
                    appName,
                    appLogoUrl,
                    complaintIdPrefix,
                },
                exportedAt: new Date().toISOString(),
                exportedBy: {
                    id: req.user.id,
                    name: req.user.fullName,
                    role: req.user.role,
                },
            },
        });

        // Log successful export
        const duration = Date.now() - startTime;
        console.log(`[EXPORT] ${format} export completed successfully`, {
            userId: req.user.id,
            userRole: req.user.role,
            recordCount: complaints.length,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error("Enhanced export error:", {
            error: error.message,
            stack: error.stack,
            userId: req.user.id,
            userRole: req.user.role,
            format,
            filters: { from, to, ward, type, status, priority },
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            message: "Failed to export reports with enhanced formatting",
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        });
    }
});

/**
 * @desc    Get enhanced heatmap data with better performance
 * @route   GET /api/reports/heatmap-revamped
 * @access  Private (Admin, Ward Officer, Maintenance)
 */
export const getHeatmapDataRevamped = asyncHandler(async (req, res) => {
    const { from, to, ward, type, status, priority } = req.query;

    // Build where conditions with RBAC
    const where = {};
    if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
        where.wardId = req.user.wardId;
    } else if (req.user.role === "MAINTENANCE_TEAM") {
        where.assignedToId = req.user.id;
    } else if (req.user.role === "ADMINISTRATOR" && ward && ward !== "all") {
        where.wardId = ward;
    }

    // Date filters
    if (from || to) {
        where.submittedOn = {};
        if (from) where.submittedOn.gte = new Date(from);
        if (to) where.submittedOn.lte = new Date(to);
    }

    // Additional filters
    if (type && type !== "all") {
        try {
            const complaintType = await getComplaintTypeById(type);
            if (complaintType) {
                where.OR = [
                    { complaintTypeId: parseInt(complaintType.id) },
                    { type: complaintType.name },
                    { type: type },
                ];
            } else {
                where.type = type;
            }
        } catch (error) {
            where.type = type;
        }
    }

    if (status && status !== "all") {
        const statusMap = {
            registered: "REGISTERED",
            assigned: "ASSIGNED",
            in_progress: "IN_PROGRESS",
            resolved: "RESOLVED",
            closed: "CLOSED",
        };
        where.status = statusMap[status.toLowerCase()] || status.toUpperCase();
    }

    if (priority && priority !== "all") {
        where.priority = priority.toUpperCase();
    }

    try {
        // Get complaints with ward and type information
        const complaints = await prisma.complaint.findMany({
            where,
            include: {
                ward: { select: { id: true, name: true } },
                complaintType: { select: { id: true, name: true } },
            },
        });

        // Get all wards and complaint types for complete matrix
        const [allWards, allComplaintTypes] = await Promise.all([
            prisma.ward.findMany({
                select: { id: true, name: true },
                where: { isActive: true },
                orderBy: { name: "asc" },
            }),
            getComplaintTypes(),
        ]);

        // Build heatmap matrix
        const wardMap = new Map();
        const typeMap = new Map();

        // Initialize maps
        allWards.forEach((ward, index) => {
            wardMap.set(ward.id, { index, name: ward.name, count: 0 });
        });

        allComplaintTypes.forEach((type, index) => {
            typeMap.set(type.name, { index, name: type.name, count: 0 });
        });

        // Create matrix
        const matrix = Array(allWards.length)
            .fill(null)
            .map(() => Array(allComplaintTypes.length).fill(0));

        // Populate matrix with complaint counts
        complaints.forEach((complaint) => {
            const wardId = complaint.wardId;
            const typeName = complaint.complaintType?.name || complaint.type;

            const wardInfo = wardMap.get(wardId);
            const typeInfo = typeMap.get(typeName);

            if (wardInfo && typeInfo) {
                matrix[wardInfo.index][typeInfo.index]++;
            }
        });

        const heatmapData = {
            xLabels: allComplaintTypes.map((type) => type.name),
            yLabels: allWards.map((ward) => ward.name),
            matrix,
            xAxisLabel: "Complaint Types",
            yAxisLabel: "Wards",
            metadata: {
                totalComplaints: complaints.length,
                dateRange: { from, to },
                appliedFilters: { ward, type, status, priority },
            },
        };

        res.status(200).json({
            success: true,
            message: "Enhanced heatmap data retrieved successfully",
            data: heatmapData,
        });
    } catch (error) {
        console.error("Enhanced heatmap error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve enhanced heatmap data",
            error: error.message,
        });
    }
});

export {
    calculatePerformanceMetrics,
    calculatePreviousPeriodMetrics,
    calculateTrendPercentages,
};