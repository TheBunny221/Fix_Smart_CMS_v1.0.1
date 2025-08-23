import { baseApi } from "./baseApi";

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => ({
        url: '/admin/dashboard/stats',
        method: 'GET',
      }),
      providesTags: ['AdminStats'],
    }),

    getDashboardAnalytics: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
          }
        });
        
        return {
          url: `/admin/dashboard/analytics?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['AdminAnalytics'],
    }),

    getRecentActivity: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
          }
        });
        
        return {
          url: `/admin/activity?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['AdminActivity'],
    }),

    getUserActivity: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
          }
        });
        
        return {
          url: `/admin/users/activity?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['UserActivity'],
    }),

    getSystemHealth: builder.query({
      query: () => ({
        url: '/admin/system/health',
        method: 'GET',
      }),
      providesTags: ['SystemHealth'],
    }),

    getUsers: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
          }
        });
        
        return {
          url: `/admin/users?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['User'],
    }),

    createUser: builder.mutation({
      query: (userData) => ({
        url: '/admin/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    updateUser: builder.mutation({
      query: ({ id, ...userData }) => ({
        url: `/admin/users/${id}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        'User',
      ],
    }),

    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    getSystemConfig: builder.query({
      query: () => ({
        url: '/admin/config',
        method: 'GET',
      }),
      providesTags: ['SystemConfig'],
    }),

    updateSystemConfig: builder.mutation({
      query: (configData) => ({
        url: '/admin/config',
        method: 'PUT',
        body: configData,
      }),
      invalidatesTags: ['SystemConfig'],
    }),

    getReports: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
          }
        });
        
        return {
          url: `/admin/reports?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['AdminReports'],
    }),

    generateReport: builder.mutation({
      query: (reportConfig) => ({
        url: '/admin/reports/generate',
        method: 'POST',
        body: reportConfig,
      }),
      invalidatesTags: ['AdminReports'],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetDashboardAnalyticsQuery,
  useGetRecentActivityQuery,
  useGetUserActivityQuery,
  useGetSystemHealthQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetSystemConfigQuery,
  useUpdateSystemConfigMutation,
  useGetReportsQuery,
  useGenerateReportMutation,
} = adminApi;
