import { createSlice } from '@reduxjs/toolkit';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const initialState = {
    complaints: {
        list: null,
        details: {},
    },
    serviceRequests: {
        list: null,
        details: {},
    },
    users: {
        list: null,
        profile: null,
    },
    locations: {
        wards: null,
        subZones: {},
    },
    config: {
        complaintTypes: null,
        systemSettings: null,
    },
    analytics: {
        complaintStats: null,
        userStats: null,
        wardStats: {},
    },
    statusTracking: {
        activeComplaints: null,
        recentUpdates: null,
    },
};
const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        // Complaints management
        setComplaintsList: (state, action) => {
            state.complaints.list = {
                data: action.payload,
                timestamp: Date.now(),
            };
        },
        setComplaintDetails: (state, action) => {
            state.complaints.details[action.payload.id] = {
                data: action.payload.data,
                timestamp: Date.now(),
            };
        },
        updateComplaintInList: (state, action) => {
            const { id, updates } = action.payload;
            // Update in list if exists
            if (state.complaints.list?.data) {
                const index = state.complaints.list.data.findIndex(complaint => complaint.id === id);
                if (index !== -1) {
                    state.complaints.list.data[index] = { ...state.complaints.list.data[index], ...updates };
                }
            }
            // Update in details if exists
            if (state.complaints.details[id]) {
                state.complaints.details[id].data = { ...state.complaints.details[id].data, ...updates };
            }
        },
        // Service requests management
        setServiceRequestsList: (state, action) => {
            state.serviceRequests.list = {
                data: action.payload,
                timestamp: Date.now(),
            };
        },
        setServiceRequestDetails: (state, action) => {
            state.serviceRequests.details[action.payload.id] = {
                data: action.payload.data,
                timestamp: Date.now(),
            };
        },
        // Users management
        setUsersList: (state, action) => {
            state.users.list = {
                data: action.payload,
                timestamp: Date.now(),
            };
        },
        setUserProfile: (state, action) => {
            state.users.profile = {
                data: action.payload,
                timestamp: Date.now(),
            };
        },
        // Locations management
        setWards: (state, action) => {
            state.locations.wards = {
                data: action.payload,
                timestamp: Date.now(),
            };
        },
        setSubZones: (state, action) => {
            state.locations.subZones[action.payload.wardId] = {
                data: action.payload.data,
                timestamp: Date.now(),
            };
        },
        // Configuration management
        setComplaintTypes: (state, action) => {
            state.config.complaintTypes = {
                data: action.payload,
                timestamp: Date.now(),
            };
        },
        setSystemSettings: (state, action) => {
            state.config.systemSettings = {
                data: action.payload,
                timestamp: Date.now(),
            };
        },
        // Analytics management
        setComplaintStats: (state, action) => {
            state.analytics.complaintStats = {
                data: action.payload,
                timestamp: Date.now(),
            };
        },
        setUserStats: (state, action) => {
            state.analytics.userStats = {
                data: action.payload,
                timestamp: Date.now(),
            };
        },
        setWardStats: (state, action) => {
            state.analytics.wardStats[action.payload.wardId] = {
                data: action.payload.data,
                timestamp: Date.now(),
            };
        },
        // Status tracking management
        setActiveComplaints: (state, action) => {
            state.statusTracking.activeComplaints = {
                data: action.payload,
                timestamp: Date.now(),
            };
        },
        setRecentUpdates: (state, action) => {
            state.statusTracking.recentUpdates = {
                data: action.payload,
                timestamp: Date.now(),
            };
        },
        // Cache management
        markDataAsStale: (state, action) => {
            const path = action.payload.split('.');
            let current = state;
            for (let i = 0; i < path.length - 1; i++) {
                const key = path[i];
                if (!key || !(key in current))
                    return;
                current = current[key];
                if (!current)
                    return;
            }
            const lastKey = path[path.length - 1];
            if (!lastKey)
                return;
            const final = current[lastKey];
            if (final && typeof final === 'object' && 'isStale' in final) {
                final.isStale = true;
            }
        },
        clearStaleData: (state) => {
            const now = Date.now();
            // Helper function to check and clear stale data
            const clearIfStale = (cached) => {
                if (!cached)
                    return null;
                if (now - cached.timestamp > CACHE_TTL || cached.isStale) {
                    return null;
                }
                return cached;
            };
            // Clear stale data across all sections
            state.complaints.list = clearIfStale(state.complaints.list);
            state.serviceRequests.list = clearIfStale(state.serviceRequests.list);
            state.users.list = clearIfStale(state.users.list);
            state.users.profile = clearIfStale(state.users.profile);
            state.locations.wards = clearIfStale(state.locations.wards);
            state.config.complaintTypes = clearIfStale(state.config.complaintTypes);
            state.config.systemSettings = clearIfStale(state.config.systemSettings);
            state.analytics.complaintStats = clearIfStale(state.analytics.complaintStats);
            state.analytics.userStats = clearIfStale(state.analytics.userStats);
            // Clear stale details
            Object.keys(state.complaints.details).forEach(id => {
                const cached = state.complaints.details[id];
                if (!cached || now - cached.timestamp > CACHE_TTL || cached.isStale) {
                    delete state.complaints.details[id];
                }
            });
            Object.keys(state.serviceRequests.details).forEach(id => {
                const cached = state.serviceRequests.details[id];
                if (!cached || now - cached.timestamp > CACHE_TTL || cached.isStale) {
                    delete state.serviceRequests.details[id];
                }
            });
        },
        clearAllData: (state) => {
            return initialState;
        },
    },
});
export const { setComplaintsList, setComplaintDetails, updateComplaintInList, setServiceRequestsList, setServiceRequestDetails, setUsersList, setUserProfile, setWards, setSubZones, setComplaintTypes, setSystemSettings, setComplaintStats, setUserStats, setWardStats, setActiveComplaints, setRecentUpdates, markDataAsStale, clearStaleData, clearAllData, } = dataSlice.actions;
// Selectors for easy data access
export const selectComplaintsList = (state) => state.data.complaints.list;
export const selectComplaintDetails = (id) => (state) => state.data.complaints.details[id];
export const selectWards = (state) => state.data.locations.wards;
export const selectSubZones = (wardId) => (state) => state.data.locations.subZones[wardId];
export const selectComplaintTypes = (state) => state.data.config.complaintTypes;
export const selectComplaintStats = (state) => state.data.analytics.complaintStats;
export const selectActiveComplaints = (state) => state.data.statusTracking.activeComplaints;
export const selectRecentUpdates = (state) => state.data.statusTracking.recentUpdates;
// Helper selectors for checking data freshness
export const selectIsDataFresh = (dataPath) => (state) => {
    const path = dataPath.split('.');
    let current = state.data;
    for (const segment of path) {
        current = current[segment];
        if (!current)
            return false;
    }
    if (!current || typeof current !== 'object' || !('timestamp' in current)) {
        return false;
    }
    const now = Date.now();
    return (now - current.timestamp < CACHE_TTL) && !current.isStale;
};
export default dataSlice.reducer;
