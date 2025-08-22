/**
 * Data State Management - Modular Redux Slice
 * 
 * This slice handles application data including:
 * - Ward and zone information
 * - Complaint types and categories
 * - User lists and role management
 * - System configuration data
 * - Lookup tables and reference data
 * - Caching and data refresh logic
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Initial data state structure
const initialState = {
  // Location data
  wards: [],
  subZones: [],
  selectedWard: null,
  
  // Complaint type data
  complaintTypes: [],
  complaintCategories: [],
  
  // User management data
  users: [],
  roles: [
    { id: "CITIZEN", name: "Citizen", description: "Regular citizen user" },
    { id: "WARD_OFFICER", name: "Ward Officer", description: "Ward-level administrator" },
    { id: "MAINTENANCE_TEAM", name: "Maintenance Team", description: "Field maintenance personnel" },
    { id: "ADMINISTRATOR", name: "Administrator", description: "System administrator" },
  ],
  
  // System configuration
  systemConfig: {
    appName: "Cochin Smart City",
    supportEmail: "support@cochinsmart.gov.in",
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"],
    otpExpiryMinutes: 10,
    complaintCategories: [],
    priorityLevels: [
      { id: "LOW", name: "Low", color: "green", sla: 7 },
      { id: "MEDIUM", name: "Medium", color: "yellow", sla: 3 },
      { id: "HIGH", name: "High", color: "orange", sla: 1 },
      { id: "CRITICAL", name: "Critical", color: "red", sla: 0.5 },
    ],
  },
  
  // Cache management
  cache: {
    lastUpdated: {},
    expiryTimes: {},
  },
  
  // Loading states for different data types
  loading: {
    wards: false,
    subZones: false,
    complaintTypes: false,
    users: false,
    systemConfig: false,
  },
  
  // Error states
  errors: {
    wards: null,
    subZones: null,
    complaintTypes: null,
    users: null,
    systemConfig: null,
  },
  
  // Statistics and metrics
  stats: {
    totalComplaints: 0,
    totalUsers: 0,
    totalWards: 0,
    activeComplaints: 0,
    resolvedComplaints: 0,
  },
};

// Helper function for API calls
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Async thunks for data operations

/**
 * Fetch all wards with their basic information
 */
export const fetchWards = createAsyncThunk(
  "data/fetchWards",
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/wards");
      return data.data || [];
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to fetch wards",
      });
    }
  }
);

/**
 * Fetch sub-zones for a specific ward
 */
export const fetchSubZones = createAsyncThunk(
  "data/fetchSubZones",
  async (wardId, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/api/wards/${wardId}/subzones`);
      return data.data || [];
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to fetch sub-zones",
      });
    }
  }
);

/**
 * Fetch complaint types and categories
 */
export const fetchComplaintTypes = createAsyncThunk(
  "data/fetchComplaintTypes",
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/complaint-types");
      return data.data || [];
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to fetch complaint types",
      });
    }
  }
);

/**
 * Fetch all users with role filtering
 */
export const fetchUsers = createAsyncThunk(
  "data/fetchUsers",
  async ({ role, wardId } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (role) queryParams.append("role", role);
      if (wardId) queryParams.append("wardId", wardId);
      
      const url = `/api/users${queryParams.toString() ? `?${queryParams}` : ""}`;
      const data = await apiCall(url);
      return data.data || [];
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to fetch users",
      });
    }
  }
);

/**
 * Fetch system configuration settings
 */
export const fetchSystemConfig = createAsyncThunk(
  "data/fetchSystemConfig",
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/config");
      return data.data || {};
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to fetch system configuration",
      });
    }
  }
);

/**
 * Update system configuration
 */
export const updateSystemConfig = createAsyncThunk(
  "data/updateSystemConfig",
  async (configUpdates, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/config", {
        method: "PUT",
        body: JSON.stringify(configUpdates),
      });
      return data.data || {};
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to update system configuration",
      });
    }
  }
);

/**
 * Fetch application statistics
 */
export const fetchAppStats = createAsyncThunk(
  "data/fetchAppStats",
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/stats");
      return data.data || {};
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to fetch application statistics",
      });
    }
  }
);

// Data Redux slice definition
const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    // Ward and location management
    setSelectedWard: (state, action) => {
      state.selectedWard = action.payload;
      // Clear sub-zones when ward changes
      state.subZones = [];
    },

    clearSelectedWard: (state) => {
      state.selectedWard = null;
      state.subZones = [];
    },

    // Cache management
    setCacheTimestamp: (state, action) => {
      const { key, timestamp } = action.payload;
      state.cache.lastUpdated[key] = timestamp;
    },

    setCacheExpiry: (state, action) => {
      const { key, expiryTime } = action.payload;
      state.cache.expiryTimes[key] = expiryTime;
    },

    clearCache: (state, action) => {
      const key = action.payload;
      if (key) {
        delete state.cache.lastUpdated[key];
        delete state.cache.expiryTimes[key];
      } else {
        state.cache = initialState.cache;
      }
    },

    // Error management
    setDataError: (state, action) => {
      const { type, error } = action.payload;
      if (state.errors.hasOwnProperty(type)) {
        state.errors[type] = error;
      }
    },

    clearDataError: (state, action) => {
      const type = action.payload;
      if (state.errors.hasOwnProperty(type)) {
        state.errors[type] = null;
      }
    },

    clearAllDataErrors: (state) => {
      Object.keys(state.errors).forEach(key => {
        state.errors[key] = null;
      });
    },

    // System config updates
    updateSystemConfigLocal: (state, action) => {
      state.systemConfig = { ...state.systemConfig, ...action.payload };
    },

    // Manual data updates
    addWard: (state, action) => {
      state.wards.push(action.payload);
    },

    updateWard: (state, action) => {
      const index = state.wards.findIndex(ward => ward.id === action.payload.id);
      if (index !== -1) {
        state.wards[index] = { ...state.wards[index], ...action.payload };
      }
    },

    removeWard: (state, action) => {
      state.wards = state.wards.filter(ward => ward.id !== action.payload);
    },

    addComplaintType: (state, action) => {
      state.complaintTypes.push(action.payload);
    },

    updateComplaintType: (state, action) => {
      const index = state.complaintTypes.findIndex(type => type.id === action.payload.id);
      if (index !== -1) {
        state.complaintTypes[index] = { ...state.complaintTypes[index], ...action.payload };
      }
    },

    removeComplaintType: (state, action) => {
      state.complaintTypes = state.complaintTypes.filter(type => type.id !== action.payload);
    },

    addUser: (state, action) => {
      state.users.push(action.payload);
    },

    updateUser: (state, action) => {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...action.payload };
      }
    },

    removeUser: (state, action) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    },

    // Statistics updates
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },

    // Reset data state
    resetDataState: () => initialState,
  },

  // Handle async action results
  extraReducers: (builder) => {
    builder
      // Fetch wards
      .addCase(fetchWards.pending, (state) => {
        state.loading.wards = true;
        state.errors.wards = null;
      })
      .addCase(fetchWards.fulfilled, (state, action) => {
        state.loading.wards = false;
        state.wards = action.payload;
        state.cache.lastUpdated.wards = Date.now();
        state.errors.wards = null;
      })
      .addCase(fetchWards.rejected, (state, action) => {
        state.loading.wards = false;
        state.errors.wards = action.payload?.message || "Failed to fetch wards";
      })

      // Fetch sub-zones
      .addCase(fetchSubZones.pending, (state) => {
        state.loading.subZones = true;
        state.errors.subZones = null;
      })
      .addCase(fetchSubZones.fulfilled, (state, action) => {
        state.loading.subZones = false;
        state.subZones = action.payload;
        state.errors.subZones = null;
      })
      .addCase(fetchSubZones.rejected, (state, action) => {
        state.loading.subZones = false;
        state.errors.subZones = action.payload?.message || "Failed to fetch sub-zones";
      })

      // Fetch complaint types
      .addCase(fetchComplaintTypes.pending, (state) => {
        state.loading.complaintTypes = true;
        state.errors.complaintTypes = null;
      })
      .addCase(fetchComplaintTypes.fulfilled, (state, action) => {
        state.loading.complaintTypes = false;
        state.complaintTypes = action.payload;
        state.cache.lastUpdated.complaintTypes = Date.now();
        state.errors.complaintTypes = null;
      })
      .addCase(fetchComplaintTypes.rejected, (state, action) => {
        state.loading.complaintTypes = false;
        state.errors.complaintTypes = action.payload?.message || "Failed to fetch complaint types";
      })

      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading.users = true;
        state.errors.users = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading.users = false;
        state.users = action.payload;
        state.cache.lastUpdated.users = Date.now();
        state.errors.users = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading.users = false;
        state.errors.users = action.payload?.message || "Failed to fetch users";
      })

      // Fetch system config
      .addCase(fetchSystemConfig.pending, (state) => {
        state.loading.systemConfig = true;
        state.errors.systemConfig = null;
      })
      .addCase(fetchSystemConfig.fulfilled, (state, action) => {
        state.loading.systemConfig = false;
        state.systemConfig = { ...state.systemConfig, ...action.payload };
        state.cache.lastUpdated.systemConfig = Date.now();
        state.errors.systemConfig = null;
      })
      .addCase(fetchSystemConfig.rejected, (state, action) => {
        state.loading.systemConfig = false;
        state.errors.systemConfig = action.payload?.message || "Failed to fetch system config";
      })

      // Update system config
      .addCase(updateSystemConfig.fulfilled, (state, action) => {
        state.systemConfig = { ...state.systemConfig, ...action.payload };
      })

      // Fetch app stats
      .addCase(fetchAppStats.fulfilled, (state, action) => {
        state.stats = { ...state.stats, ...action.payload };
      });
  },
});

// Export action creators
export const {
  setSelectedWard,
  clearSelectedWard,
  setCacheTimestamp,
  setCacheExpiry,
  clearCache,
  setDataError,
  clearDataError,
  clearAllDataErrors,
  updateSystemConfigLocal,
  addWard,
  updateWard,
  removeWard,
  addComplaintType,
  updateComplaintType,
  removeComplaintType,
  addUser,
  updateUser,
  removeUser,
  updateStats,
  resetDataState,
} = dataSlice.actions;

// Export reducer as default
export default dataSlice.reducer;

// Selector functions for easy state access
export const selectWards = (state) => state.data.wards;
export const selectSubZones = (state) => state.data.subZones;
export const selectSelectedWard = (state) => state.data.selectedWard;
export const selectComplaintTypes = (state) => state.data.complaintTypes;
export const selectUsers = (state) => state.data.users;
export const selectRoles = (state) => state.data.roles;
export const selectSystemConfig = (state) => state.data.systemConfig;
export const selectDataLoading = (state) => state.data.loading;
export const selectDataErrors = (state) => state.data.errors;
export const selectAppStats = (state) => state.data.stats;
export const selectCacheInfo = (state) => state.data.cache;

// Helper functions
export const getCacheAge = (state, key) => {
  const lastUpdated = state.data.cache.lastUpdated[key];
  return lastUpdated ? Date.now() - lastUpdated : null;
};

export const isCacheExpired = (state, key, maxAge = 5 * 60 * 1000) => {
  const age = getCacheAge(state, key);
  return age === null || age > maxAge;
};
