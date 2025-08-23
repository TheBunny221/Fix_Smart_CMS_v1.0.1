import { baseApi } from "./baseApi";

// Types for system configuration
export 

export 

// System Config API slice
export const systemConfigApi = baseApi.injectEndpoints({
  endpoints) => ({
    // Get public system configuration
    getPublicSystemConfig, void>({
        query) => "/system-config/public",
        providesTags: ["SystemConfig"],
      },
    ),

    // Get all system configuration (admin only)
    getAllSystemConfig: builder.query, void>({
      query) => "/system-config",
      providesTags: ["SystemConfig"],
    }),

    // Update system configuration (admin only)
    updateSystemConfig: builder.mutation,
      { key; value; description: string }
    >({
      query) => ({
        url,
        method: "PUT",
        body,
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
} = systemConfigApi;
