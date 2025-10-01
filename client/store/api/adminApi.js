import { baseApi } from "./baseApi";
// Admin API slice
export const adminApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get all users with pagination and filters
        getAllUsers: builder.query({
            query: ({ page = 1, limit = 10, role, ward, status = "all" }) => {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    status,
                });
                if (role)
                    params.append("role", role);
                if (ward)
                    params.append("ward", ward);
                return `/admin/users?${params.toString()}`;
            },
            // Removed transformResponse to prevent response body conflicts
            providesTags: ["User"],
        }),
        // Create new user
        createUser: builder.mutation({
            query: (userData) => ({
                url: "/admin/users",
                method: "POST",
                body: userData,
            }),
            // Removed transformResponse to prevent response body conflicts
            invalidatesTags: ["User"],
        }),
        // Update user
        updateUser: builder.mutation({
            query: ({ id, data }) => ({
                url: `/admin/users/${id}`,
                method: "PUT",
                body: data,
            }),
            // Removed transformResponse to prevent response body conflicts
            invalidatesTags: ["User"],
        }),
        // Delete user
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `/admin/users/${id}`,
                method: "DELETE",
            }),
            // Removed transformResponse to prevent response body conflicts
            invalidatesTags: ["User"],
        }),
        // Activate user
        activateUser: builder.mutation({
            query: (id) => ({
                url: `/admin/users/${id}/activate`,
                method: "PUT",
            }),
            // Removed transformResponse to prevent response body conflicts
            invalidatesTags: ["User"],
        }),
        // Deactivate user
        deactivateUser: builder.mutation({
            query: (id) => ({
                url: `/admin/users/${id}/deactivate`,
                method: "PUT",
            }),
            // Removed transformResponse to prevent response body conflicts
            invalidatesTags: ["User"],
        }),
        // Bulk user actions
        bulkUserActions: builder.mutation({
            query: (data) => ({
                url: "/admin/users/bulk",
                method: "POST",
                body: data,
            }),
            // Removed transformResponse to prevent response body conflicts
            invalidatesTags: ["User"],
        }),
        // Get user statistics
        getUserStats: builder.query({
            query: () => "/admin/stats/users",
            // Removed transformResponse to prevent response body conflicts
            providesTags: ["Analytics"],
        }),
        // Get system statistics
        getSystemStats: builder.query({
            query: () => "/admin/stats/system",
            // Removed transformResponse to prevent response body conflicts
            providesTags: ["Analytics"],
        }),
        // Get analytics data
        getAnalytics: builder.query({
            query: ({ startDate, endDate, ward }) => {
                const params = new URLSearchParams();
                if (startDate)
                    params.append("startDate", startDate);
                if (endDate)
                    params.append("endDate", endDate);
                if (ward)
                    params.append("ward", ward);
                return `/admin/analytics?${params.toString()}`;
            },
            // Removed transformResponse to prevent response body conflicts
            providesTags: ["Analytics"],
        }),
        // Manage user roles
        manageRoles: builder.mutation({
            query: (data) => ({
                url: "/admin/roles",
                method: "PUT",
                body: data,
            }),
            // Removed transformResponse to prevent response body conflicts
            invalidatesTags: ["User"],
        }),
        // Get dashboard analytics
        getDashboardAnalytics: builder.query({
            query: () => "/admin/dashboard/analytics",
            // Removed transformResponse to prevent response body conflicts
            providesTags: ["Analytics"],
        }),
        // Get recent activity
        getRecentActivity: builder.query({
            query: ({ limit = 5 }) => `/admin/dashboard/activity?limit=${limit}`,
            // Removed transformResponse to prevent response body conflicts
            providesTags: ["Analytics"],
        }),
        // Get dashboard statistics
        getDashboardStats: builder.query({
            query: () => "/admin/dashboard/stats",
            // Removed transformResponse to prevent response body conflicts
            providesTags: ["Analytics"],
        }),
        // Get user activity
        getUserActivity: builder.query({
            query: ({ period = "24h" }) => `/admin/user-activity?period=${period}`,
            providesTags: ["Analytics"],
        }),
        // Get system health
        getSystemHealth: builder.query({
            query: () => "/admin/system-health",
            providesTags: ["Analytics"],
        }),
        // Get wards with sub-zones for filtering
        getWardsForFiltering: builder.query({
            query: () => "/users/wards?include=subzones",
            providesTags: ["Ward"],
        }),
    }),
});
// Export hooks
export const { useGetAllUsersQuery, useLazyGetAllUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation, useActivateUserMutation, useDeactivateUserMutation, useBulkUserActionsMutation, useGetUserStatsQuery, useGetSystemStatsQuery, useGetAnalyticsQuery, useManageRolesMutation, useGetDashboardAnalyticsQuery, useGetRecentActivityQuery, useGetDashboardStatsQuery, useGetUserActivityQuery, useGetSystemHealthQuery, useGetWardsForFilteringQuery, } = adminApi;
// Re-export for convenience
export const useAdminApi = {
    useGetAllUsersQuery,
    useLazyGetAllUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useActivateUserMutation,
    useDeactivateUserMutation,
    useBulkUserActionsMutation,
    useGetUserStatsQuery,
    useGetSystemStatsQuery,
    useGetAnalyticsQuery,
    useManageRolesMutation,
    useGetDashboardAnalyticsQuery,
    useGetRecentActivityQuery,
    useGetDashboardStatsQuery,
    useGetUserActivityQuery,
    useGetSystemHealthQuery,
};
