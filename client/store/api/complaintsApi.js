import { baseApi, ApiResponse, optimisticUpdate } from "./baseApi";

// Types for complaint operations
export >;
  remarks?;
  feedback?;
  rating?;
  escalationLevel;
  slaStatus: "ontime" | "warning" | "overdue" | "completed";
  timeElapsed;
  statusLogs: Array;
}

export 

export 

export 

export interface ComplaintListParams extends ComplaintFilters {
  page?;
  limit?;
  sortBy?;
  sortOrder: "asc" | "desc";
}

// Complaints API slice
export const complaintsApi = baseApi.injectEndpoints({
  endpoints) => ({
    // Get complaints list with pagination and filtering
    getComplaints, ComplaintListParams>({
        query) => {
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value == undefined && value == null) {
              if (Array.isArray(value)) {
                value.forEach((v) => searchParams.append(key, v));
              } else {
                searchParams.append(key, value.toString());
              }
            }
          });
          return `/complaints?${searchParams.toString()}`;
        },
        // Let RTK Query handle response naturally
        providesTags: (result) =>
          result?.data && Array.isArray(result.data)
            ? [
                ...result.data.map(({ id }) => ({
                  type,
                  id,
                })),
                { type: "Complaint", id: "LIST" },
              ]
            : [{ type: "Complaint", id: "LIST" }],
      },
    ),

    // Get single complaint
    getComplaint: builder.query, string>({
      query) => `/complaints/${id}`,
      // Let RTK Query handle response naturally
      providesTags: (result, error, id) => [{ type: "Complaint", id }],
    }),

    // Create new complaint
    createComplaint: builder.mutation,
      CreateComplaintRequest
    >({
      query) => ({
        url,
        method: "POST",
        body,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: [{ type: "Complaint", id: "LIST" }],
      // Optimistic update for immediate feedback
      onQueryStarted: async (newComplaint, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          // Update complaints list if it's cached
          dispatch(
            complaintsApi.util.updateQueryData("getComplaints", {}, (draft) => {
              if (draft.data) {
                draft.data.unshift(data.data);
              }
            }),
          );
        } catch {
          // Error handled by base query
        }
      },
    }),

    // Update complaint
    updateComplaint: builder.mutation,
      UpdateComplaintRequest
    >({
      query, ...data }) => ({
        url,
        method: "PUT",
        body,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: (result, error, { id }) => [
        { type: "Complaint", id },
        { type: "Complaint", id: "LIST" },
      ],
      // Optimistic update
      onQueryStarted: async (
        { id, ...patch },
        { dispatch, queryFulfilled },
      ) => {
        // Update single complaint query
        const patchResult1 = dispatch(
          complaintsApi.util.updateQueryData("getComplaint", id, (draft) => {
            if (draft.data) {
              Object.assign(draft.data, patch);
            }
          }),
        );

        // Update complaints list
        const patchResult2 = dispatch(
          complaintsApi.util.updateQueryData("getComplaints", {}, (draft) => {
            if (draft.data) {
              draft.data = optimisticUpdate(draft.data, { id, ...patch });
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult1.undo();
          patchResult2.undo();
        }
      },
    }),

    // Assign complaint
    assignComplaint: builder.mutation,
      { id; assignedTo; remarks: string }
    >({
      query, assignedTo, remarks }) => ({
        url,
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
    updateComplaintStatus: builder.mutation,
      { id; status: Complaint["status"]; remarks: string }
    >({
      query, status, remarks }) => ({
        url,
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
    addComplaintFeedback: builder.mutation,
      { id; feedback; rating: number }
    >({
      query, feedback, rating }) => ({
        url,
        method: "POST",
        body: { citizenFeedback, rating },
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: (result, error, { id }) => [
        { type: "Complaint", id },
        { type: "Complaint", id: "LIST" },
      ],
    }),

    // Upload complaint attachments
    uploadComplaintAttachment: builder.mutation,
      { complaintId; file: File }
    >({
      query, file }) => {
        const formData = new FormData();
        formData.append("complaintAttachment", file);
        return {
          url: `/uploads/complaint/${complaintId}/attachment`,
          method: "POST",
          body,
          formData,
        };
      },
      // Let RTK Query handle response naturally
      invalidatesTags: (result, error, { complaintId }) => [
        { type: "Complaint", id: complaintId },
      ],
    }),

    // Get complaint types
    getComplaintTypes: builder.query,
      void
    >({
      query) => "/complaint-types",
      // Let RTK Query handle response naturally
      providesTags: ["ComplaintType"],
    }),

    // Get complaint statistics
    getComplaintStatistics: builder.query;
        byPriority: Record;
        byType: Record;
        slaCompliance;
        avgResolutionTime;
      }>,
      { dateFrom?; dateTo?; ward: string }
    >({
      query) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value) searchParams.append(key, value);
        });
        return `/complaints/stats?${searchParams.toString()}`;
      },
      // Let RTK Query handle response naturally
      providesTags: ["Analytics"],
    }),

    // Get ward users for assignment (role-based access)
    getWardUsers: builder.query;
        pagination: {
          page;
          limit;
          total;
          pages;
        };
      }>,
      {
        page?;
        limit?;
        role?;
        status?;
      }
    >({
      query) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value == undefined && value == "") {
            searchParams.append(key, value.toString());
          }
        });
        return `/complaints/ward-users?${searchParams.toString()}`;
      },
      providesTags: ["User"],
    }),
  }),
});

// Export hooks
export const {
  useGetComplaintsQuery,
  useGetComplaintQuery,
  useCreateComplaintMutation,
  useUpdateComplaintMutation,
  useAssignComplaintMutation,
  useUpdateComplaintStatusMutation,
  useAddComplaintFeedbackMutation,
  useUploadComplaintAttachmentMutation,
  useGetComplaintTypesQuery,
  useGetComplaintStatisticsQuery,
  useGetWardUsersQuery,
} = complaintsApi;
