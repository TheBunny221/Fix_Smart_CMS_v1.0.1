import { baseApi, ApiResponse } from "./baseApi";

// Admin API types
export ;
  department?;
  isActive;
  createdAt;
  updatedAt;
  _count: {
    submittedComplaints;
    assignedComplaints;
  };
}

export 

export 

export ;
}

export >;
}

export 

export >;
  complaintsByPriority: Array;
  complaintsByType: Array;
  monthlyTrends: Array;
}

export 

export 

export >;
  complaintsByType: Array;
  wardPerformance: Array;
  metrics: {
    avgResolutionTime;
    slaCompliance;
    citizenSatisfaction;
    resolutionRate;
  };
}

export ;
  ward?;
}

export 

export ;
  activities: Array;
}

export ;
  timestamp;
  services: {
    database: {
      status;
      responseTime;
    };
    emailService: {
      status;
      lastCheck;
    };
    fileStorage: {
      status;
      usedPercent;
    };
    api: {
      status;
      averageResponseTime;
    };
  };
  system: {
    memory: {
      used;
      total;
      percentage;
    };
    errors: {
      last24h;
      status;
    };
  };
  statistics: {
    totalUsers;
    activeUsers;
    totalComplaints;
    openComplaints;
    systemLoad;
  };
}

// Admin API slice
export const adminApi = baseApi.injectEndpoints({
  endpoints) => ({
    // Get all users with pagination and filters
    getAllUsers,
      {
        page?;
        limit?;
        role?;
        ward?;
        status?;
      }
    >({
      query, limit = 10, role, ward, status = "all" }) => {
        const params = new URLSearchParams({
          page),
          limit: limit.toString(),
          status,
        });

        if (role) params.append("role", role);
        if (ward) params.append("ward", ward);

        return `/admin/users?${params.toString()}`;
      },
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["User"],
    }),

    // Create new user
    createUser: builder.mutation, CreateUserRequest>({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Update user
    updateUser: builder.mutation,
      { id; data: UpdateUserRequest }
    >({
      query, data }) => ({
        url,
        method: "PUT",
        body,
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Delete user
    deleteUser: builder.mutation, string>({
      query) => ({
        url,
        method: "DELETE",
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Activate user
    activateUser: builder.mutation, string>({
      query) => ({
        url,
        method: "PUT",
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Deactivate user
    deactivateUser: builder.mutation, string>({
      query) => ({
        url,
        method: "PUT",
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Bulk user actions
    bulkUserActions: builder.mutation,
      BulkActionRequest
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Get user statistics
    getUserStats: builder.query, void>({
      query) => "/admin/stats/users",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Analytics"],
    }),

    // Get system statistics
    getSystemStats: builder.query, void>({
      query) => "/admin/stats/system",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Analytics"],
    }),

    // Get analytics data
    getAnalytics: builder.query,
      {
        startDate?;
        endDate?;
        ward?;
      }
    >({
      query, endDate, ward }) => {
        const params = new URLSearchParams();

        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (ward) params.append("ward", ward);

        return `/admin/analytics?${params.toString()}`;
      },
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Analytics"],
    }),

    // Manage user roles
    manageRoles: builder.mutation, ManageRolesRequest>({
      query) => ({
        url,
        method: "PUT",
        body,
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Get dashboard analytics
    getDashboardAnalytics: builder.query,
      void
    >({
      query) => "/admin/dashboard/analytics",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Analytics"],
    }),

    // Get recent activity
    getRecentActivity: builder.query,
      { limit: number }
    >({
      query) => `/admin/dashboard/activity?limit=${limit}`,
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Analytics"],
    }),

    // Get dashboard statistics
    getDashboardStats: builder.query, void>({
        query) => "/admin/dashboard/stats",
        // Removed transformResponse to prevent response body conflicts
        providesTags: ["Analytics"],
      },
    ),

    // Get user activity
    getUserActivity: builder.query,
      { period: string }
    >({
      query) => `/admin/user-activity?period=${period}`,
      providesTags: ["Analytics"],
    }),

    // Get system health
    getSystemHealth: builder.query, void>({
      query) => "/admin/system-health",
      providesTags: ["Analytics"],
    }),
  }),
});

// Export hooks
export const {
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
} = adminApi;

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
