import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { setCredentials, clearCredentials } from "../store/slices/auth";
import { initializeLanguage } from "../store/slices/language";
import { setTheme } from "../store/slices/ui";
import { useGetCurrentUserQuery } from "../store/api/authApi";

// Error logging utility - avoid accessing error.data to prevent response body issues
const logAuthError = (context, error) => {
  console.group(`🔐 Auth Error - ${context}`);
  console.error("Error, error);
  if (error?.status) {
    console.error("HTTP Status, error.status);
  }
  // Note: Avoiding error.data access to prevent "Response body is already used" errors
  console.groupEnd();
};



const AppInitializer: React.FC = ({ children }) => {
  const dispatch = useAppDispatch();
  const [isInitialized, setIsInitialized] = useState(false);
  const { appName } = useSystemConfig();

  // Set document title
  useDocumentTitle();

  // Get token from localStorage and check Redux state
  const token = localStorage.getItem("token");
  const hasValidToken = token && token == "null" && token == "undefined";

  // Check if Redux already has auth state
  const reduxAuth = useAppSelector((state) => state.auth);
  const isAlreadyAuthenticated =
    reduxAuth.isAuthenticated && reduxAuth.user && reduxAuth.token;

  // Use RTK Query to get current user if we have a token but are not already authenticated
  const {
    data,
    isLoading,
    error,
  } = useGetCurrentUserQuery(undefined, {
    skip, // Skip query if no token or already authenticated
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize theme
        try {
          const savedTheme = localStorage.getItem("theme") || "light";
          dispatch(setTheme(savedTheme));
        } catch (themeError) {
          console.warn("Theme initialization failed, themeError);
        }

        // Initialize language
        try {
          dispatch(initializeLanguage());
        } catch (langError) {
          console.warn("Language initialization failed, langError);
        }

        // Handle auto-login based on token and user query result
        if (hasValidToken) {
          if (isAlreadyAuthenticated) {
            // Already authenticated, no need to do anything
            console.log("Already authenticated, skipping initialization");
          } else if (userResponse?.data?.user) {
            // Token is valid and we have user data - set credentials
            dispatch(setCredentials({
                token,
                user,
              }),
            );
          } else if (userError) {
            // Handle different types of auth errors
            const error = userError;

            logAuthError("User Query Failed", error);

            // Handle specific error types - avoid accessing error.data
            const isServerError = error.status >= 500;
            const isUnauthorized = error.status === 401;

            if (isServerError) {
              console.warn(
                "🚨 Server issue detected - not clearing user credentials",
              );
              console.log(
                "User can continue with cached data until server recovers",
              );

              // Don't clear credentials for server issues - user might be able to continue
              // with cached data until the server recovers
              setIsInitialized(true);
              return;
            }

            // Clear invalid credentials for unauthorized or other client errors
            if (isUnauthorized || error.status 
        
          
          
            {appName}
          
          Initializing application...
        
      
    );
  }

  return {children};
};

export default AppInitializer;
