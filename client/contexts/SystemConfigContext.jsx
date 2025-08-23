import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetPublicSystemConfigQuery } from "../store/api/systemConfigApi";
import { getApiErrorMessage } from "../store/api/baseApi";

const SystemConfigContext = createContext(undefined);

export const useSystemConfig = () => {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error(
      "useSystemConfig must be used within a SystemConfigProvider",
    );
  }
  return context;
};

export const SystemConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({});

  // Use RTK Query hook for better error handling and caching
  const {
    data: configResponse,
    isLoading,
    error,
    refetch,
  } = useGetPublicSystemConfigQuery();

  // Process the RTK Query data when it changes
  useEffect(() => {
    if (configResponse?.success && Array.isArray(configResponse.data)) {
      const configMap = {};
      configResponse.data.forEach((setting) => {
        configMap[setting.key] = setting.value;
      });
      setConfig(configMap);
      console.log("System config loaded successfully via RTK Query");
    } else if (error) {
      const errorMessage = getApiErrorMessage(error);
      console.error("Error fetching system config via RTK Query", errorMessage);
      console.error("Full error details", {
        status: error?.status,
        data: error?.data,
        message: error?.message,
        error: error?.error,
      });
      // Fallback to default values
      setConfig({
        APP_NAME: "Kochi Smart City",
        APP_LOGO_URL: "/logo.png",
        APP_LOGO_SIZE: "medium",
        COMPLAINT_ID_PREFIX: "KSC",
        COMPLAINT_ID_START_NUMBER: "1",
        COMPLAINT_ID_LENGTH: "4",
      });
    }
  }, [configResponse, error]);

  const refreshConfig = async () => {
    await refetch();
  };

  const getConfig = (key, defaultValue = "") => {
    return config[key] || defaultValue;
  };

  const appName = getConfig("APP_NAME", "Kochi Smart City");
  const appLogoUrl = getConfig("APP_LOGO_URL", "/logo.png");
  const appLogoSize = getConfig("APP_LOGO_SIZE", "medium");

  const value = {
    config,
    appName,
    appLogoUrl,
    appLogoSize,
    isLoading,
    refreshConfig,
    getConfig,
  };

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  );
};
