import { baseApi, ApiResponse } from "./baseApi";

// Types for ward operations
export 

export >;
  };
  summary: {
    totalComplaints;
    resolvedComplaints;
    pendingComplaints;
    resolutionRate;
  };
  complaintsByStatus: Record;
  complaintsByArea: Array;
}

// Ward API slice
export const wardApi = baseApi.injectEndpoints({
  endpoints) => ({
    // Get ward team members
    getWardTeamMembers,
      string
    >({
      query) => `/wards/${wardId}/team`,
      providesTags: (result, error, wardId) => [
        { type: "Ward", id: `${wardId}-team` },
      ],
    }),

    // Get ward statistics
    getWardStats: builder.query, string>({
      query) => `/wards/${wardId}/stats`,
      providesTags: (result, error, wardId) => [
        { type: "Ward", id: `${wardId}-stats` },
        { type: "Analytics", id: wardId },
      ],
    }),
  }),
});

// Export hooks
export const { useGetWardTeamMembersQuery, useGetWardStatsQuery } = wardApi;
