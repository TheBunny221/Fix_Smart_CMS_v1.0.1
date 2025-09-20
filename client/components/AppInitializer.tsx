import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { setCredentials, clearCredentials } from "../store/slices/authSlice";
import { initializeLanguage } from "../store/slices/languageSlice";
import { initializeTheme, setOnlineStatus } from "../store/slices/uiSlice";
import { useGetCurrentUserQuery } from "../store/api/authApi";

interface AppInitializerProps {
  children: React.ReactNode;
}

const hasWindow = typeof window !== "undefined";

const getStoredToken = () => {
  if (!hasWindow) {
    return null;
  }
  const token = window.localStorage.getItem("token");
  if (!token || token === "null" || token === "undefined") {
    return null;
  }
  return token;
};

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { appName, isReady: isConfigReady } = useSystemConfig();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [hasBootstrapped, setHasBootstrapped] = useState(false);

  useDocumentTitle();

  const reduxAuth = useAppSelector((state) => state.auth);
  const token = useMemo(() => getStoredToken(), [reduxAuth.token]);
  const hasValidToken = Boolean(token);
  const isAlreadyAuthenticated = Boolean(
    reduxAuth.isAuthenticated && reduxAuth.user && reduxAuth.token,
  );

  const shouldFetchUser = hasValidToken && !isAlreadyAuthenticated;

  const {
    data: userResponse,
    isLoading: isLoadingUser,
    error: userError,
  } = useGetCurrentUserQuery(undefined, {
    skip: !shouldFetchUser,
  });

  useEffect(() => {
    if (!hasBootstrapped) {
      dispatch(initializeTheme());
      dispatch(initializeLanguage());
      setHasBootstrapped(true);
    }
  }, [dispatch, hasBootstrapped]);

  useEffect(() => {
    if (!hasWindow) {
      return;
    }

    const handleOnline = () => dispatch(setOnlineStatus(true));
    const handleOffline = () => dispatch(setOnlineStatus(false));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!shouldFetchUser) {
      setIsAuthReady(true);
      return;
    }

    if (isLoadingUser) {
      return;
    }

    if (userResponse?.data?.user && token) {
      dispatch(
        setCredentials({
          token,
          user: userResponse.data.user,
        }),
      );
      setIsAuthReady(true);
      return;
    }

    if (userError) {
      const status = (userError as { status?: number }).status;
      if (status && status < 500) {
        dispatch(clearCredentials());
        if (hasWindow) {
          window.localStorage.removeItem("token");
        }
      }
      setIsAuthReady(true);
    }
  }, [
    dispatch,
    isLoadingUser,
    shouldFetchUser,
    token,
    userError,
    userResponse,
  ]);

  const shouldShowLoader =
    !isAuthReady || !isConfigReady || (shouldFetchUser && isLoadingUser);

  if (shouldShowLoader) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <h2 className="mb-2 text-xl font-semibold text-gray-700">{appName}</h2>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppInitializer;
