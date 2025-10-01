import { baseApi, optimisticUpdate } from "./baseApi";
// Complaints API slice
export const complaintsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get complaints list with pagination and filtering
        getComplaints: builder.query({
            query: (params) => {
                const searchParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        if (Array.isArray(value)) {
                            value.forEach((v) => searchParams.append(key, v));
                        }
                        else {
                            searchParams.append(key, value.toString());
                        }
                    }
                });
                return `/complaints?${searchParams.toString()}`;
            },
            // Let RTK Query handle response naturally
            providesTags: (result) => result?.data && Array.isArray(result.data)
                ? [
                    ...result.data.map(({ id }) => ({
                        type: "Complaint",
                        id,
                    })),
                    { type: "Complaint", id: "LIST" },
                ]
                : [{ type: "Complaint", id: "LIST" }],
        }),
        // Get single complaint
        getComplaint: builder.query({
            query: (id) => `/complaints/${id}`,
            // Let RTK Query handle response naturally
            providesTags: (result, error, id) => [{ type: "Complaint", id }],
        }),
        // Create new complaint
        createComplaint: builder.mutation({
            query: (data) => ({
                url: "/complaints",
                method: "POST",
                body: data,
            }),
            // Let RTK Query handle response naturally
            invalidatesTags: [{ type: "Complaint", id: "LIST" }],
            // Optimistic update for immediate feedback
            onQueryStarted: async (newComplaint, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    // Update complaints list if it's cached
                    dispatch(complaintsApi.util.updateQueryData("getComplaints", {}, (draft) => {
                        if (draft.data) {
                            draft.data.unshift(data.data);
                        }
                    }));
                }
                catch {
                    // Error handled by base query
                }
            },
        }),
        // Update complaint
        updateComplaint: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/complaints/${id}`,
                method: "PUT",
                body: data,
            }),
            // Let RTK Query handle response naturally
            invalidatesTags: (result, error, { id }) => [
                { type: "Complaint", id },
                { type: "Complaint", id: "LIST" },
            ],
            // Optimistic update
            onQueryStarted: async ({ id, ...patch }, { dispatch, queryFulfilled }) => {
                // Update single complaint query
                const patchResult1 = dispatch(complaintsApi.util.updateQueryData("getComplaint", id, (draft) => {
                    if (draft.data) {
                        Object.assign(draft.data, patch);
                    }
                }));
                // Update complaints list
                const patchResult2 = dispatch(complaintsApi.util.updateQueryData("getComplaints", {}, (draft) => {
                    if (draft.data) {
                        draft.data = optimisticUpdate(draft.data, { id, ...patch });
                    }
                }));
                try {
                    await queryFulfilled;
                }
                catch {
                    patchResult1.undo();
                    patchResult2.undo();
                }
            },
        }),
        // Assign complaint
        assignComplaint: builder.mutation({
            query: ({ id, assignedTo, remarks }) => ({
                url: `/complaints/${id}/assign`,
                method: "PUT",
                body: { assignedTo, remarks },
            }),
            // Let RTK Query handle response naturally
            invalidatesTags: (result, error, { id }) => [
                { type: "Complaint", id },
                { type: "Complaint", id: "LIST" },
            ],
        }),
        // Update complaint status
        updateComplaintStatus: builder.mutation({
            query: ({ id, status, remarks }) => ({
                url: `/complaints/${id}/status`,
                method: "PUT",
                body: { status, remarks },
            }),
            // Let RTK Query handle response naturally
            invalidatesTags: (result, error, { id }) => [
                { type: "Complaint", id },
                { type: "Complaint", id: "LIST" },
            ],
        }),
        // Add complaint feedback
        addComplaintFeedback: builder.mutation({
            query: ({ id, feedback, rating }) => ({
                url: `/complaints/${id}/feedback`,
                method: "POST",
                body: { citizenFeedback: feedback, rating },
            }),
            // Let RTK Query handle response naturally
            invalidatesTags: (result, error, { id }) => [
                { type: "Complaint", id },
                { type: "Complaint", id: "LIST" },
            ],
        }),
        // Upload complaint attachments
        uploadComplaintAttachment: builder.mutation({
            query: ({ complaintId, file }) => {
                const formData = new FormData();
                formData.append("complaintAttachment", file);
                return {
                    url: `/uploads/complaint/${complaintId}/attachment`,
                    method: "POST",
                    body: formData,
                    formData: true,
                };
            },
            // Let RTK Query handle response naturally
            invalidatesTags: (result, error, { complaintId }) => [
                { type: "Complaint", id: complaintId },
            ],
        }),
        // Get complaint statistics
        getComplaintStatistics: builder.query({
            query: (params) => {
                const searchParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value)
                        searchParams.append(key, value);
                });
                return `/complaints/stats?${searchParams.toString()}`;
            },
            // Let RTK Query handle response naturally
            providesTags: ["Analytics"],
        }),
        // Get ward-specific dashboard statistics (Ward Officer only)
        getWardDashboardStatistics: builder.query({
            query: () => "/complaints/ward-dashboard-stats",
            providesTags: ["Analytics"],
        }),
        // Get ward users for assignment (role-based access)
        getWardUsers: builder.query({
            query: (params = {}) => {
                const searchParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== "") {
                        searchParams.append(key, value.toString());
                    }
                });
                return `/complaints/ward-users?${searchParams.toString()}`;
            },
            providesTags: ["User"],
        }),
        // Get complaint materials
        getComplaintMaterials: builder.query({
            query: (complaintId) => `/complaints/${complaintId}/materials`,
            providesTags: (result, error, complaintId) => [
                { type: "Material", id: "LIST" },
                { type: "Material", id: complaintId },
            ],
        }),
        // Add material to complaint
        addComplaintMaterial: builder.mutation({
            query: ({ complaintId, ...body }) => ({
                url: `/complaints/${complaintId}/materials`,
                method: "POST",
                body,
            }),
            invalidatesTags: (result, error, { complaintId }) => [
                { type: "Material", id: "LIST" },
                { type: "Material", id: complaintId },
            ],
        }),
        // Get complaint photos
        getComplaintPhotos: builder.query({
            query: (complaintId) => `/complaints/${complaintId}/photos`,
            providesTags: (result, error, complaintId) => [
                { type: "Photo", id: "LIST" },
                { type: "Photo", id: complaintId },
            ],
        }),
        // Upload complaint photos
        uploadComplaintPhotos: builder.mutation({
            query: ({ complaintId, photos, description }) => {
                const formData = new FormData();
                photos.forEach((photo) => {
                    formData.append("photos", photo);
                });
                if (description) {
                    formData.append("description", description);
                }
                return {
                    url: `/complaints/${complaintId}/photos`,
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: (result, error, { complaintId }) => [
                { type: "Photo", id: "LIST" },
                { type: "Photo", id: complaintId },
            ],
        }),
    }),
});
// Export hooks
export const { useGetComplaintsQuery, useGetComplaintQuery, useLazyGetComplaintQuery, useCreateComplaintMutation, useUpdateComplaintMutation, useAssignComplaintMutation, useUpdateComplaintStatusMutation, useAddComplaintFeedbackMutation, useUploadComplaintAttachmentMutation, useGetComplaintStatisticsQuery, useGetWardDashboardStatisticsQuery, useGetWardUsersQuery, useGetComplaintMaterialsQuery, useAddComplaintMaterialMutation, useGetComplaintPhotosQuery, useUploadComplaintPhotosMutation, } = complaintsApi;
