import { baseApi } from "./baseApi";
export const complaintTypesApi = baseApi.injectEndpoints({
    overrideExisting: true,
    endpoints: (builder) => ({
        // Get all complaint types (public)
        getComplaintTypes: builder.query({
            query: () => "/complaint-types",
            providesTags: ["ComplaintType"],
        }),
        // Get complaint type by ID
        getComplaintTypeById: builder.query({
            query: (id) => `/complaint-types/${id}`,
            providesTags: (_result, _error, id) => [{ type: "ComplaintType", id }],
        }),
        // Create complaint type (admin only)
        createComplaintType: builder.mutation({
            query: (body) => ({
                url: "/complaint-types",
                method: "POST",
                body,
            }),
            invalidatesTags: ["ComplaintType"],
        }),
        // Update complaint type (admin only)
        updateComplaintType: builder.mutation({
            query: ({ id, data }) => ({
                url: `/complaint-types/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["ComplaintType"],
        }),
        // Delete complaint type (admin only)
        deleteComplaintType: builder.mutation({
            query: (id) => ({
                url: `/complaint-types/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["ComplaintType"],
        }),
        // Get complaint type statistics
        getComplaintTypeStats: builder.query({
            query: () => "/complaint-types/stats",
            providesTags: ["ComplaintType"],
        }),
    }),
});
export const { useGetComplaintTypesQuery, useGetComplaintTypeByIdQuery, useCreateComplaintTypeMutation, useUpdateComplaintTypeMutation, useDeleteComplaintTypeMutation, useGetComplaintTypeStatsQuery, } = complaintTypesApi;
