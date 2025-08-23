import { baseApi } from "./baseApi";

export 

export 

export interface UpdateComplaintTypeRequest extends CreateComplaintTypeRequest {
  isActive?;
}

export const complaintTypesApi = baseApi.injectEndpoints({
  endpoints) => ({
    // Get all complaint types (public)
    getComplaintTypes: builder.query({
      query) => "/complaint-types",
      providesTags: ["ComplaintType"],
    }),

    // Get complaint type by ID
    getComplaintTypeById: builder.query({
      query) => `/complaint-types/${id}`,
      providesTags: (_result, _error, id) => [{ type: "ComplaintType", id }],
    }),

    // Create complaint type (admin only)
    createComplaintType: builder.mutation({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ComplaintType"],
    }),

    // Update complaint type (admin only)
    updateComplaintType: builder.mutation({
      query, data }) => ({
        url,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ComplaintType"],
    }),

    // Delete complaint type (admin only)
    deleteComplaintType: builder.mutation({
      query) => ({
        url,
        method: "DELETE",
      }),
      invalidatesTags: ["ComplaintType"],
    }),

    // Get complaint type statistics
    getComplaintTypeStats: builder.query },
      void
    >({
      query) => "/complaint-types/stats",
      providesTags: ["ComplaintType"],
    }),
  }),
});

export const {
  useGetComplaintTypesQuery,
  useGetComplaintTypeByIdQuery,
  useCreateComplaintTypeMutation,
  useUpdateComplaintTypeMutation,
  useDeleteComplaintTypeMutation,
  useGetComplaintTypeStatsQuery,
} = complaintTypesApi;
