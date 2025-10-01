import { baseApi } from "./baseApi";
export const wardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getWardsWithBoundaries: builder.query({
            query: () => "/wards/boundaries",
            providesTags: ["Ward"],
        }),
        updateWardBoundaries: builder.mutation({
            query: ({ wardId, ...body }) => ({
                url: `/wards/${wardId}/boundaries`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Ward"],
        }),
        detectLocationArea: builder.mutation({
            query: (body) => ({
                url: "/wards/detect-area",
                method: "POST",
                body,
            }),
        }),
        getWardTeamMembers: builder.query({
            query: (wardId) => `/complaints/ward-users?role=MAINTENANCE_TEAM&limit=100`,
            providesTags: ["Ward"],
        }),
    }),
});
export const { useGetWardsWithBoundariesQuery, useUpdateWardBoundariesMutation, useDetectLocationAreaMutation, useGetWardTeamMembersQuery, } = wardApi;
