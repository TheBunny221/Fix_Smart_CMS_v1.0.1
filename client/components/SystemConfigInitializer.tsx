import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { 
  fetchSystemConfig, 
  selectSystemConfigLoading, 
  selectSystemConfigError,
  selectLastFetched 
} from "../store/slices/systemConfigSlice";
import { useToast } from "./ui/use-toast";

interface SystemConfigInitializerProps {
  children: React.ReactNode;
}

const SystemConfigInitializer: React.FC<SystemConfigInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const loading = useAppSelector(selectSystemConfigLoading);
  const error = useAppSelector(selectSystemConfigError);
  const lastFetched = useAppSelector(selectLastFetched);

  useEffect(() => {
    // Only fetch if we haven't fetched before or if it's been more than 5 minutes
    const shouldFetch = !lastFetched || 
      (Date.now() - new Date(lastFetched).getTime()) > 5 * 60 * 1000;

    if (shouldFetch) {
      dispatch(fetchSystemConfig());
    }
  }, [dispatch, lastFetched]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Configuration Error",
        description: "Failed to load system configuration. Some features may not work properly.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Don't block rendering - let components handle their own loading states
  return <>{children}</>;
};

export default SystemConfigInitializer;