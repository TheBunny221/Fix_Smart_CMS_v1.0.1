import { baseApi } from "./baseApi";

export const complaintsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getComplaints: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
          }
        });
        
        return {
          url: `/complaints?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Complaint'],
    }),

    getComplaintById: builder.query({
      query: (id) => ({
        url: `/complaints/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Complaint', id }],
    }),

    createComplaint: builder.mutation({
      query: (complaintData) => ({
        url: '/complaints',
        method: 'POST',
        body: complaintData,
      }),
      invalidatesTags: ['Complaint'],
    }),

    updateComplaint: builder.mutation({
      query: ({ id, ...complaintData }) => ({
        url: `/complaints/${id}`,
        method: 'PUT',
        body: complaintData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Complaint', id },
        'Complaint',
      ],
    }),

    deleteComplaint: builder.mutation({
      query: (id) => ({
        url: `/complaints/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Complaint'],
    }),

    getComplaintStatistics: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
          }
        });
        
        return {
          url: `/complaints/statistics?${searchParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['ComplaintStats'],
    }),

    assignComplaint: builder.mutation({
      query: ({ id, assignedTo, priority }) => ({
        url: `/complaints/${id}/assign`,
        method: 'POST',
        body: { assignedTo, priority },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Complaint', id },
        'Complaint',
      ],
    }),

    updateComplaintStatus: builder.mutation({
      query: ({ id, status, remarks }) => ({
        url: `/complaints/${id}/status`,
        method: 'PUT',
        body: { status, remarks },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Complaint', id },
        'Complaint',
      ],
    }),

    addComplaintFeedback: builder.mutation({
      query: ({ complaintId, rating, comment }) => ({
        url: `/complaints/${complaintId}/feedback`,
        method: 'POST',
        body: { rating, comment },
      }),
      invalidatesTags: (result, error, { complaintId }) => [
        { type: 'Complaint', id: complaintId },
        'Complaint',
      ],
    }),

    escalateComplaint: builder.mutation({
      query: ({ id, escalationLevel, reason }) => ({
        url: `/complaints/${id}/escalate`,
        method: 'POST',
        body: { escalationLevel, reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Complaint', id },
        'Complaint',
      ],
    }),

    getComplaintHistory: builder.query({
      query: (id) => ({
        url: `/complaints/${id}/history`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'ComplaintHistory', id }],
    }),
  }),
});

export const {
  useGetComplaintsQuery,
  useGetComplaintByIdQuery,
  useCreateComplaintMutation,
  useUpdateComplaintMutation,
  useDeleteComplaintMutation,
  useGetComplaintStatisticsQuery,
  useAssignComplaintMutation,
  useUpdateComplaintStatusMutation,
  useAddComplaintFeedbackMutation,
  useEscalateComplaintMutation,
  useGetComplaintHistoryQuery,
} = complaintsApi;
