import { baseApi } from "./baseApi";
// API Slice
export const serviceRequestsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get all service requests with filters
        getServiceRequests: builder.query({
            query: (filters = {}) => {
                const params = new URLSearchParams();
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== "") {
                        params.append(key, value.toString());
                    }
                });
                return `service-requests?${params.toString()}`;
            },
            providesTags: ["ServiceRequest"],
        }),
        // Get service request by ID
        getServiceRequest: builder.query({
            query: (id) => `service-requests/${id}`,
            providesTags: (result, error, id) => [{ type: "ServiceRequest", id }],
        }),
        // Create new service request
        createServiceRequest: builder.mutation({
            query: (data) => ({
                url: "service-requests",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["ServiceRequest"],
        }),
        // Update service request
        updateServiceRequest: builder.mutation({
            query: ({ id, data }) => ({
                url: `service-requests/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "ServiceRequest", id },
                "ServiceRequest",
            ],
        }),
        // Delete service request
        deleteServiceRequest: builder.mutation({
            query: (id) => ({
                url: `service-requests/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                { type: "ServiceRequest", id },
                "ServiceRequest",
            ],
        }),
        // Get service types
        getServiceTypes: builder.query({
            query: () => "service-requests/types",
            providesTags: ["ServiceType"],
        }),
        // Get service request statistics
        getServiceRequestStats: builder.query({
            query: (params = {}) => {
                const searchParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value)
                        searchParams.append(key, value);
                });
                return `service-requests/stats?${searchParams.toString()}`;
            },
            providesTags: ["ServiceRequest"],
        }),
        // Assign service request to user
        assignServiceRequest: builder.mutation({
            query: ({ id, assignedToId, comment }) => ({
                url: `service-requests/${id}/assign`,
                method: "POST",
                body: { assignedToId, comment },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "ServiceRequest", id },
                "ServiceRequest",
            ],
        }),
        // Update service request status
        updateServiceRequestStatus: builder.mutation({
            query: ({ id, status, comment }) => ({
                url: `service-requests/${id}/status`,
                method: "POST",
                body: { status, comment },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "ServiceRequest", id },
                "ServiceRequest",
            ],
        }),
        // Submit feedback for completed service request
        submitServiceRequestFeedback: builder.mutation({
            query: ({ id, rating, feedback }) => ({
                url: `service-requests/${id}/feedback`,
                method: "POST",
                body: { rating, feedback },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "ServiceRequest", id },
                "ServiceRequest",
            ],
        }),
        // Get service request status logs
        getServiceRequestStatusLogs: builder.query({
            query: (id) => `service-requests/${id}/status-logs`,
            providesTags: (result, error, id) => [{ type: "ServiceRequest", id }],
        }),
        // Guest service request submission
        submitGuestServiceRequest: builder.mutation({
            query: (data) => ({
                url: "guest/service-request",
                method: "POST",
                body: data,
            }),
        }),
        // Track guest service request
        trackGuestServiceRequest: builder.query({
            query: ({ requestId, email, phoneNumber }) => {
                const params = new URLSearchParams();
                if (email)
                    params.append("email", email);
                if (phoneNumber)
                    params.append("phoneNumber", phoneNumber);
                return `guest/track-service/${requestId}?${params.toString()}`;
            },
        }),
    }),
});
export const { useGetServiceRequestsQuery, useGetServiceRequestQuery, useCreateServiceRequestMutation, useUpdateServiceRequestMutation, useDeleteServiceRequestMutation, useGetServiceTypesQuery, useGetServiceRequestStatsQuery, useAssignServiceRequestMutation, useUpdateServiceRequestStatusMutation, useSubmitServiceRequestFeedbackMutation, useGetServiceRequestStatusLogsQuery, useSubmitGuestServiceRequestMutation, useTrackGuestServiceRequestQuery, useLazyTrackGuestServiceRequestQuery, } = serviceRequestsApi;
