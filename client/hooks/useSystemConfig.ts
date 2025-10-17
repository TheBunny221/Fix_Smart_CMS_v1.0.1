import { useAppSelector, useAppDispatch } from "../store/hooks";
import { 
  selectComplaintTypes,
  selectComplaintPriorities,
  selectComplaintStatuses,
  selectReportFilters,
  selectConfigByKey,
  selectAppName,
  selectAppLogoUrl,
  selectThemeColor,
  selectContactInfo,
  selectMaxFileSize,
  selectCitizenDailyComplaintLimit,
  selectSystemMaintenance,
  selectCitizenRegistrationEnabled,
  selectSystemConfigLoading,
  selectSystemConfigError,
  refreshSystemConfig
} from "../store/slices/systemConfigSlice";
import { useCallback } from "react";

export const useSystemConfig = () => {
  const dispatch = useAppDispatch();
  
  // Basic state
  const loading = useAppSelector(selectSystemConfigLoading);
  const error = useAppSelector(selectSystemConfigError);
  
  // Config data selectors
  const complaintTypes = useAppSelector(selectComplaintTypes);
  const complaintPriorities = useAppSelector(selectComplaintPriorities);
  const complaintStatuses = useAppSelector(selectComplaintStatuses);
  const reportFilters = useAppSelector(selectReportFilters);
  const appName = useAppSelector(selectAppName);
  const appLogoUrl = useAppSelector(selectAppLogoUrl);
  const themeColor = useAppSelector(selectThemeColor);
  const contactInfo = useAppSelector(selectContactInfo);
  const maxFileSize = useAppSelector(selectMaxFileSize);
  const citizenDailyComplaintLimit = useAppSelector(selectCitizenDailyComplaintLimit);
  const systemMaintenance = useAppSelector(selectSystemMaintenance);
  const citizenRegistrationEnabled = useAppSelector(selectCitizenRegistrationEnabled);

  // Helper function to get config by key
  const getConfigValue = useCallback((key: string, defaultValue?: any) => {
    return useAppSelector(selectConfigByKey(key)) ?? defaultValue;
  }, []);

  // Refresh function
  const refresh = useCallback(() => {
    dispatch(refreshSystemConfig());
  }, [dispatch]);

  return {
    // State
    loading,
    error,
    
    // Config values
    complaintTypes,
    complaintPriorities,
    complaintStatuses,
    reportFilters,
    appName,
    appLogoUrl,
    themeColor,
    contactInfo,
    maxFileSize,
    citizenDailyComplaintLimit,
    systemMaintenance,
    citizenRegistrationEnabled,
    
    // Utilities
    getConfigValue,
    refresh,
  };
};

// Specific hooks for common use cases
export const useComplaintTypes = () => {
  const complaintTypes = useAppSelector(selectComplaintTypes);
  const loading = useAppSelector(selectSystemConfigLoading);
  const error = useAppSelector(selectSystemConfigError);

  return {
    complaintTypes,
    complaintTypeOptions: complaintTypes.map(type => ({
      id: type.id,
      value: type.id,
      label: type.name,
      description: type.description,
      priority: type.priority,
      slaHours: type.slaHours,
    })),
    isLoading: loading,
    error,
  };
};

export const useComplaintPriorities = () => {
  const priorities = useAppSelector(selectComplaintPriorities);
  const loading = useAppSelector(selectSystemConfigLoading);

  return {
    priorities,
    priorityOptions: priorities.map((priority: string) => ({
      value: priority,
      label: priority.charAt(0) + priority.slice(1).toLowerCase(),
    })),
    isLoading: loading,
  };
};

export const useComplaintStatuses = () => {
  const statuses = useAppSelector(selectComplaintStatuses);
  const loading = useAppSelector(selectSystemConfigLoading);

  return {
    statuses,
    statusOptions: statuses.map((status: string) => ({
      value: status,
      label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    })),
    isLoading: loading,
  };
};

export const useAppBranding = () => {
  const appName = useAppSelector(selectAppName);
  const appLogoUrl = useAppSelector(selectAppLogoUrl);
  const themeColor = useAppSelector(selectThemeColor);
  const loading = useAppSelector(selectSystemConfigLoading);

  return {
    appName,
    appLogoUrl,
    themeColor,
    isLoading: loading,
  };
};