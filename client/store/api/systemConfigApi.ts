import { baseApi } from "./baseApi";
import type { ApiResponse } from "./baseApi";

// Types for system configuration
export interface SystemConfigItem {
  key: string;
  value: string;
  description?: string;
  type: "string" | "number" | "boolean" | "json";
  isActive: boolean;
  updatedAt?: string;
}

export interface SystemConfigResponse {
  settings: SystemConfigItem[];
}

export interface BulkUpdateRequest {
  settings: Array<{
    key: string;
    value?: string;
    description?: string;
    isActive?: boolean;
  }>;
}

// System Config API slice
export const systemConfigApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get public system configuration
    getPublicSystemConfig: builder.query<ApiResponse<SystemConfigItem[]>, void>(
      {
        query: () => "/system-config/public",
        providesTags: ["SystemConfig"],
        // Cache for 5 minutes to prevent continuous fetching
        keepUnusedDataFor: 300, // 5 minutes
      },
    ),

    // Get all system configuration (admin only)
    getAllSystemConfig: builder.query<ApiResponse<SystemConfigItem[]>, void>({
      query: () => "/system-config",
      providesTags: ["SystemConfig"],
    }),

    // Update system configuration (admin only)
    updateSystemConfig: builder.mutation<
      ApiResponse<SystemConfigItem>,
      { key: string; value?: string; description?: string; isActive?: boolean }
    >({
      query: ({ key, ...configData }) => ({
        url: `/system-config/${key}`,
        method: "PUT",
        body: configData,
      }),
      invalidatesTags: ["SystemConfig"],
    }),

    // Bulk update system configurations (admin only)
    bulkUpdateSystemConfig: builder.mutation<
      ApiResponse<{ updated: number; errors: string[] }>,
      BulkUpdateRequest
    >({
      query: (bulkData) => ({
        url: "/system-config/bulk",
        method: "PUT",
        body: bulkData,
      }),
      invalidatesTags: ["SystemConfig"],
    }),
  }),
});

// Export hooks
export const {
  useGetPublicSystemConfigQuery,
  useGetAllSystemConfigQuery,
  useUpdateSystemConfigMutation,
  useBulkUpdateSystemConfigMutation,
} = systemConfigApi;