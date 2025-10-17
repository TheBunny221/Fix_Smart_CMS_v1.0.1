import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Types
export interface SystemConfigItem {
  key: string;
  value: string;
  description?: string;
  type: "string" | "number" | "boolean" | "json";
}

export interface ComplaintType {
  id: string;
  name: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  slaHours: number;
  isActive: boolean;
  updatedAt: string;
}

export interface SystemConfigState {
  data: Record<string, any>;
  complaintTypes: ComplaintType[];
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

// Initial state
const initialState: SystemConfigState = {
  data: {},
  complaintTypes: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Helper function to parse config value based on type
const parseConfigValue = (item: SystemConfigItem): any => {
  const { value, type } = item;
  
  switch (type) {
    case "boolean":
      return value === "true";
    case "number":
      return parseFloat(value);
    case "json":
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
};

// Helper function to make API calls
const apiCall = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// Async thunks
export const fetchSystemConfig = createAsyncThunk(
  "systemConfig/fetchSystemConfig",
  async (_, { rejectWithValue }) => {
    try {
      // Fetch system config (which now includes complaint types)
      const configResponse = await apiCall("/api/system-config/public");

      if (!configResponse.success) {
        throw new Error(configResponse.message || "Failed to fetch system config");
      }

      // Handle both old and new response formats
      const config = configResponse.data.config || configResponse.data;
      const complaintTypes = configResponse.data.complaintTypes || [];

      return {
        config: Array.isArray(config) ? config : [],
        complaintTypes: complaintTypes,
      };
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : "Failed to fetch system configuration",
      });
    }
  }
);

export const refreshSystemConfig = createAsyncThunk(
  "systemConfig/refreshSystemConfig",
  async (_, { rejectWithValue }) => {
    try {
      // Same as fetchSystemConfig but for refresh action
      const configResponse = await apiCall("/api/system-config/public");

      if (!configResponse.success) {
        throw new Error(configResponse.message || "Failed to refresh system config");
      }

      // Handle both old and new response formats
      const config = configResponse.data.config || configResponse.data;
      const complaintTypes = configResponse.data.complaintTypes || [];

      return {
        config: Array.isArray(config) ? config : [],
        complaintTypes: complaintTypes,
      };
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : "Failed to refresh system configuration",
      });
    }
  }
);

// System config slice
const systemConfigSlice = createSlice({
  name: "systemConfig",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    resetSystemConfig: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch system config
      .addCase(fetchSystemConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSystemConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.lastFetched = new Date().toISOString();
        
        // Transform config array to key-value object
        const configData: Record<string, any> = {};
        action.payload.config.forEach((item: SystemConfigItem) => {
          configData[item.key] = parseConfigValue(item);
        });
        
        state.data = configData;
        state.complaintTypes = action.payload.complaintTypes;
      })
      .addCase(fetchSystemConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.message || "Failed to fetch system configuration";
      })

      // Refresh system config
      .addCase(refreshSystemConfig.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshSystemConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.lastFetched = new Date().toISOString();
        
        // Transform config array to key-value object
        const configData: Record<string, any> = {};
        action.payload.config.forEach((item: SystemConfigItem) => {
          configData[item.key] = parseConfigValue(item);
        });
        
        state.data = configData;
        state.complaintTypes = action.payload.complaintTypes;
      })
      .addCase(refreshSystemConfig.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.message || "Failed to refresh system configuration";
      });
  },
});

export const { clearError, setError, resetSystemConfig } = systemConfigSlice.actions;

export default systemConfigSlice.reducer;

// Selectors
export const selectSystemConfig = (state: { systemConfig: SystemConfigState }) => state.systemConfig;
export const selectSystemConfigData = (state: { systemConfig: SystemConfigState }) => state.systemConfig.data;
export const selectSystemConfigLoading = (state: { systemConfig: SystemConfigState }) => state.systemConfig.loading;
export const selectSystemConfigError = (state: { systemConfig: SystemConfigState }) => state.systemConfig.error;
export const selectLastFetched = (state: { systemConfig: SystemConfigState }) => state.systemConfig.lastFetched;

// Specific config selectors
export const selectComplaintTypes = (state: { systemConfig: SystemConfigState }) => 
  state.systemConfig.complaintTypes.filter(type => type.isActive);

export const selectComplaintPriorities = (state: { systemConfig: SystemConfigState }) => 
  state.systemConfig.data.COMPLAINT_PRIORITIES || ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const selectComplaintStatuses = (state: { systemConfig: SystemConfigState }) => 
  state.systemConfig.data.COMPLAINT_STATUSES || ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"];

export const selectReportFilters = (state: { systemConfig: SystemConfigState }) => {
  // Generate report filters based on available data
  const filters = ["Ward", "Status", "Date Range"];
  
  if (state.systemConfig.complaintTypes.length > 0) {
    filters.unshift("Category");
  }
  
  if (state.systemConfig.data.COMPLAINT_PRIORITIES) {
    filters.push("Priority");
  }
  
  return filters;
};

export const selectConfigByKey = (key: string) => (state: { systemConfig: SystemConfigState }) => 
  state.systemConfig.data[key];

export const selectAppName = (state: { systemConfig: SystemConfigState }) => 
  state.systemConfig.data.APP_NAME || "NLC-CMS";

export const selectAppLogoUrl = (state: { systemConfig: SystemConfigState }) => 
  state.systemConfig.data.APP_LOGO_URL || "/logo.png";

export const selectThemeColor = (state: { systemConfig: SystemConfigState }) => 
  state.systemConfig.data.THEME_COLOR || "#1D4ED8";

export const selectContactInfo = (state: { systemConfig: SystemConfigState }) => ({
  helpline: state.systemConfig.data.CONTACT_HELPLINE || "1800-XXX-XXXX",
  email: state.systemConfig.data.CONTACT_EMAIL || "support@cochinsmartcity.in",
  officeHours: state.systemConfig.data.CONTACT_OFFICE_HOURS || "Monday - Friday: 9 AM - 6 PM",
  officeAddress: state.systemConfig.data.CONTACT_OFFICE_ADDRESS || "Cochin Corporation Office",
});

export const selectMaxFileSize = (state: { systemConfig: SystemConfigState }) => 
  state.systemConfig.data.MAX_FILE_SIZE_MB || 10;

export const selectCitizenDailyComplaintLimit = (state: { systemConfig: SystemConfigState }) => 
  state.systemConfig.data.CITIZEN_DAILY_COMPLAINT_LIMIT || 5;

export const selectSystemMaintenance = (state: { systemConfig: SystemConfigState }) => 
  state.systemConfig.data.SYSTEM_MAINTENANCE || false;

export const selectCitizenRegistrationEnabled = (state: { systemConfig: SystemConfigState }) => 
  state.systemConfig.data.CITIZEN_REGISTRATION_ENABLED !== false; // Default to true