// Helper to construct query parameters
const buildQueryParams = (filters, user) => {
    const params = {
        from: filters.dateRange.from,
        to: filters.dateRange.to,
    };
    if (filters.ward !== "all")
        params.ward = filters.ward;
    if (filters.complaintType !== "all")
        params.type = filters.complaintType;
    if (filters.status !== "all")
        params.status = filters.status;
    if (filters.priority !== "all")
        params.priority = filters.priority;
    const queryParams = new URLSearchParams(params);
    // Enforce ward scope for Ward Officers
    if (user?.role === "WARD_OFFICER" && user?.wardId) {
        queryParams.set("ward", user.wardId);
    }
    return queryParams;
};
/**
 * Fetches the main analytics data for the reports page.
 */
export const getAnalyticsData = async (filters, user) => {
    const queryParams = buildQueryParams(filters, user);
    let endpoint = "/api/reports/analytics";
    if (user?.role === "MAINTENANCE_TEAM") {
        endpoint = "/api/maintenance/analytics";
    }
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}${endpoint}?${queryParams}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
    }
    const data = await response.json();
    const payload = data.data ?? {};
    // Transform the API response to match the expected format
    return {
        complaints: {
            total: payload.complaints?.total ?? 0,
            resolved: payload.complaints?.resolved ?? 0,
            pending: payload.complaints?.pending ?? 0,
            overdue: payload.complaints?.overdue ?? 0,
        },
        sla: {
            compliance: payload.sla?.compliance ?? 0,
            avgResolutionTime: payload.sla?.avgResolutionTime ?? 0,
            target: payload.sla?.target ?? 3,
        },
        trends: payload.trends ?? [],
        wards: payload.wards ?? [],
        categories: payload.categories ?? [],
        performance: {
            userSatisfaction: payload.performance?.userSatisfaction ?? 0,
            escalationRate: payload.performance?.escalationRate ?? 0,
            firstCallResolution: payload.performance?.firstCallResolution ?? 0,
            repeatComplaints: payload.performance?.repeatComplaints ?? 0,
        },
    };
};
/**
 * Fetches heatmap data based on filters.
 */
export const getHeatmapData = async (filters, user) => {
    const params = {
        from: filters.dateRange.from,
        to: filters.dateRange.to,
    };
    if (filters.complaintType !== "all")
        params.type = filters.complaintType;
    if (filters.status !== "all")
        params.status = filters.status;
    if (filters.priority !== "all")
        params.priority = filters.priority;
    const queryParams = new URLSearchParams(params);
    // Enforce ward scope for Ward Officers; allow Admins to scope to a ward
    if (user?.role === "WARD_OFFICER" && user?.wardId) {
        queryParams.set("ward", user.wardId);
    }
    else if (user?.role === "ADMINISTRATOR" &&
        filters.ward &&
        filters.ward !== "all") {
        queryParams.set("ward", filters.ward);
    }
    const baseUrl = window.location.origin;
    const resp = await fetch(`${baseUrl}/api/reports/heatmap?${queryParams}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
        },
    });
    if (!resp.ok) {
        throw new Error(`Failed to fetch heatmap: ${resp.statusText}`);
    }
    const json = await resp.json();
    if (!json.data) {
        throw new Error("Received empty heatmap response");
    }
    return json.data;
};
