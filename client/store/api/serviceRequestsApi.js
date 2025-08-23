import { baseApi } from "./baseApi";

// Types
export ;
  submittedBy: {
    id;
    fullName;
    email;
    phoneNumber?;
  };
  assignedTo: {
    id;
    fullName;
    role;
  };
  statusLogs?;
  createdAt;
  updatedAt;
}

export ;
}

export 

export 

export 

export 

export ;
}

export 

export 

export 

export 

// API Slice
export const serviceRequestsApi = baseApi.injectEndpoints({
  endpoints) => ({
    // Get all service requests with filters
    getServiceRequests) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value == undefined && value == "") {
            params.append(key, value.toString());
          }
        });
        return `service-requests?${params.toString()}`;
      },
      providesTags: ["ServiceRequest"],
    }),

    // Get service request by ID
    getServiceRequest: builder.query({
      query) => `service-requests/${id}`,
      providesTags: (result, error, id) => [{ type: "ServiceRequest", id }],
    }),

    // Create new service request
    createServiceRequest: builder.mutation({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ServiceRequest"],
    }),

    // Update service request
    updateServiceRequest: builder.mutation({
      query, data }) => ({
        url,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ServiceRequest", id },
        "ServiceRequest",
      ],
    }),

    // Delete service request
    deleteServiceRequest: builder.mutation({
      query) => ({
        url,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "ServiceRequest", id },
        "ServiceRequest",
      ],
    }),

    // Get service types
    getServiceTypes: builder.query({
      query) => "service-requests/types",
      providesTags: ["ServiceType"],
    }),

    // Get service request statistics
    getServiceRequestStats: builder.query({
      query) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value) searchParams.append(key, value);
        });
        return `service-requests/stats?${searchParams.toString()}`;
      },
      providesTags: ["ServiceRequest"],
    }),

    // Assign service request to user
    assignServiceRequest: builder.mutation({
      query, assignedToId, comment }) => ({
        url,
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
      query, status, comment }) => ({
        url,
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
      query, rating, feedback }) => ({
        url,
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
      query) => `service-requests/${id}/status-logs`,
      providesTags: (result, error, id) => [{ type: "ServiceRequest", id }],
    }),

    // Guest service request submission
    submitGuestServiceRequest: builder.mutation({
      query) => ({
        url,
        method: "POST",
        body,
      }),
    }),

    // Track guest service request
    trackGuestServiceRequest: builder.query({
      query, email, phoneNumber }) => {
        const params = new URLSearchParams();
        if (email) params.append("email", email);
        if (phoneNumber) params.append("phoneNumber", phoneNumber);
        return `guest/track-service/${requestId}?${params.toString()}`;
      },
    }),
  }),
});

export const {
  useGetServiceRequestsQuery,
  useGetServiceRequestQuery,
  useCreateServiceRequestMutation,
  useUpdateServiceRequestMutation,
  useDeleteServiceRequestMutation,
  useGetServiceTypesQuery,
  useGetServiceRequestStatsQuery,
  useAssignServiceRequestMutation,
  useUpdateServiceRequestStatusMutation,
  useSubmitServiceRequestFeedbackMutation,
  useGetServiceRequestStatusLogsQuery,
  useSubmitGuestServiceRequestMutation,
  useTrackGuestServiceRequestQuery,
  useLazyTrackGuestServiceRequestQuery,
} = serviceRequestsApi;
