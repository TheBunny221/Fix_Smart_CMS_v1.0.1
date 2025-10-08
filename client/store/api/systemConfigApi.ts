import { baseApi } from "./baseApi";
import type { ApiResponse } from "./baseApi";

// Types for system configuration
export interface SystemConfigItem {
  key: string;
  value: string;
  description?: string;
  type: string;
  isActive: boolean;
  updatedAt: string;
}

export interface PublicSystemConfig {
  appName: string;
  appVersion: string;
  organizationName: string;
  websiteUrl: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  complaintIdPrefix: string;
  complaintIdLength: number;
  autoAssignComplaints: boolean;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
}

export interface CacheStats {
  isInitialized: boolean;
  configCount: number;
  lastUpdated: string | null;
  refreshInterval: number;
  hasAutoRefresh: boolean;
}

export interface PublicConfigResponse {
  data: PublicSystemConfig;
  cached: CacheStats;
}

export interface AdminConfigResponse {
  cached: Record<string, string>;
  database: SystemConfigItem[];
  cacheStats: CacheStats;
}

export interface BulkUpdateResult {
  updated: SystemConfigItem[];
  created: SystemConfigItem[];
  errors: Array<{ key: string; error: string }>;
}

// System Config API slice
export const systemConfigApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get public system configuration
    getPublicSystemConfig: builder.query<ApiResponse<PublicConfigResponse>, void>(
      {
        query: () => "/config/public",
        providesTags: ["SystemConfig"],
        // Cache for 5 minutes to prevent continuous fetching
        keepUnusedDataFor: 300, // 5 minutes
      },
    ),

    // Get all system configuration (admin only)
    getAllSystemConfig: builder.query<ApiResponse<AdminConfigResponse>, void>({
      query: () => "/config/admin",
      providesTags: ["SystemConfig"],
    }),

    // Get cache statistics (admin only)
    getCacheStats: builder.query<ApiResponse<CacheStats>, void>({
      query: () => "/config/stats",
      providesTags: ["SystemConfig"],
    }),

    // Get configurations by type (admin only)
    getConfigByType: builder.query<
      ApiResponse<{ type: string; configs: Record<string, string>; count: number }>, 
      string
    >({
      query: (type) => `/config/type/${type}`,
      providesTags: ["SystemConfig"],
    }),

    // Get configurations by pattern (admin only)
    getConfigByPattern: builder.query<
      ApiResponse<{ 
        pattern: string; 
        matchType: string; 
        configs: Record<string, string>; 
        count: number 
      }>, 
      { pattern: string; matchType?: string }
    >({
      query: ({ pattern, matchType = 'startsWith' }) => 
        `/config/pattern/${pattern}?matchType=${matchType}`,
      providesTags: ["SystemConfig"],
    }),

    // Create new system configuration (admin only)
    createSystemConfig: builder.mutation<
      ApiResponse<SystemConfigItem>,
      { key: string; value: string; type?: string; description?: string }
    >({
      query: (configData) => ({
        url: "/config",
        method: "POST",
        body: configData,
      }),
      invalidatesTags: ["SystemConfig"],
    }),

    // Update system configuration (admin only)
    updateSystemConfig: builder.mutation<
      ApiResponse<SystemConfigItem>,
      { key: string; value: string; type?: string; description?: string }
    >({
      query: ({ key, ...configData }) => ({
        url: `/config/${key}`,
        method: "PUT",
        body: configData,
      }),
      invalidatesTags: ["SystemConfig"],
    }),

    // Delete system configuration (admin only)
    deleteSystemConfig: builder.mutation<ApiResponse<any>, string>({
      query: (key) => ({
        url: `/config/${key}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SystemConfig"],
    }),

    // Bulk update system configurations (admin only)
    bulkUpdateSystemConfig: builder.mutation<
      ApiResponse<BulkUpdateResult>,
      { configs: Array<{ key: string; value: string; type?: string; description?: string }> }
    >({
      query: (data) => ({
        url: "/config/bulk",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SystemConfig"],
    }),

    // Refresh configuration cache (admin only)
    refreshConfigCache: builder.mutation<ApiResponse<CacheStats>, void>({
      query: () => ({
        url: "/config/refresh",
        method: "POST",
      }),
      invalidatesTags: ["SystemConfig"],
    }),
  }),
});

// Export hooks
export const {
  useGetPublicSystemConfigQuery,
  useGetAllSystemConfigQuery,
  useGetCacheStatsQuery,
  useGetConfigByTypeQuery,
  useGetConfigByPatternQuery,
  useCreateSystemConfigMutation,
  useUpdateSystemConfigMutation,
  useDeleteSystemConfigMutation,
  useBulkUpdateSystemConfigMutation,
  useRefreshConfigCacheMutation,
} = systemConfigApi;
