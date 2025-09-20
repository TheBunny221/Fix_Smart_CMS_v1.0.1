import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useGetPublicSystemConfigQuery } from "../store/api/systemConfigApi";
import { getApiErrorMessage } from "../store/api/baseApi";

interface SystemConfig {
  [key: string]: string;
}

interface SystemConfigContextType {
  config: SystemConfig;
  appName: string;
  appLogoUrl: string;
  appLogoSize: string;
  isLoading: boolean;
  isReady: boolean;
  refreshConfig: () => Promise<void>;
  getConfig: (key: string, defaultValue?: string) => string;
}

const fallbackConfig: SystemConfig = {
  APP_NAME: "Kochi Smart City",
  APP_LOGO_URL: "/logo.png",
  APP_LOGO_SIZE: "medium",
  COMPLAINT_ID_PREFIX: "KSC",
  COMPLAINT_ID_START_NUMBER: "1",
  COMPLAINT_ID_LENGTH: "4",
};

const defaultContextValue: SystemConfigContextType = {
  config: fallbackConfig,
  appName: fallbackConfig.APP_NAME,
  appLogoUrl: fallbackConfig.APP_LOGO_URL,
  appLogoSize: fallbackConfig.APP_LOGO_SIZE,
  isLoading: false,
  isReady: false,
  refreshConfig: async () => {
    /* no-op default */
  },
  getConfig: (key: string, defaultValue: string = "") =>
    fallbackConfig[key] ?? defaultValue,
};

const SystemConfigContext = createContext<SystemConfigContextType>(
  defaultContextValue,
);

export const useSystemConfig = () => useContext(SystemConfigContext);

interface SystemConfigProviderProps {
  children: React.ReactNode;
}

export const SystemConfigProvider: React.FC<SystemConfigProviderProps> = ({
  children,
}) => {
  const [config, setConfig] = useState<SystemConfig>(fallbackConfig);
  const [isReady, setIsReady] = useState(false);

  const { data, isLoading, isFetching, error, refetch } =
    useGetPublicSystemConfigQuery();

  useEffect(() => {
    if (data?.success && Array.isArray(data.data)) {
      const configMap: SystemConfig = { ...fallbackConfig };
      data.data.forEach((setting: { key: string; value: string }) => {
        configMap[setting.key] = setting.value;
      });
      setConfig(configMap);
      setIsReady(true);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      console.error(
        "Error fetching system config via RTK Query:",
        getApiErrorMessage(error),
      );
      setConfig(fallbackConfig);
      setIsReady(true);
    }
  }, [error]);

  useEffect(() => {
    if (!isLoading && !isFetching && !isReady) {
      setIsReady(true);
    }
  }, [isLoading, isFetching, isReady]);

  const refreshConfig = useCallback(async () => {
    try {
      await refetch();
    } catch (err) {
      console.error("Failed to refresh system config:", err);
    }
  }, [refetch]);

  const getConfig = useCallback(
    (key: string, defaultValue: string = "") => config[key] ?? defaultValue,
    [config],
  );

  const value = useMemo<SystemConfigContextType>(() => {
    const appName = getConfig("APP_NAME", fallbackConfig.APP_NAME);
    const appLogoUrl = getConfig("APP_LOGO_URL", fallbackConfig.APP_LOGO_URL);
    const appLogoSize = getConfig(
      "APP_LOGO_SIZE",
      fallbackConfig.APP_LOGO_SIZE,
    );

    return {
      config,
      appName,
      appLogoUrl,
      appLogoSize,
      isLoading,
      isReady,
      refreshConfig,
      getConfig,
    };
  }, [config, getConfig, isLoading, isReady, refreshConfig]);

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  );
};
