import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout } from "../store/slices/auth";
import { toast } from "./ui/use-toast";
import { selectTranslations } from "../store/slices/language";
import { Loader2 } from "lucide-react";

  | "CITIZEN"
  | "WARD_OFFICER"
  | "MAINTENANCE_TEAM"
  | "ADMINISTRATOR"
  | "GUEST";



// Loading component for authentication checks
const AuthLoadingComponent: React.FC = () => (
  
    
      
      Verifying authentication...
    
  
);

const RoleBasedRoute: React.FC = ({
  children,
  allowedRoles,
  fallbackPath = "/login",
  unauthorizedPath = "/unauthorized",
  requiresAuth = true,
  checkPermissions,
  onUnauthorized,
  loadingComponent,
}) => {
  const { user, isAuthenticated, isLoading, token } = useAppSelector(
    (state) => state.auth,
  );
  const translations = useAppSelector(selectTranslations);
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Handle token expiration and logout
  useEffect(() => {
    const handleTokenExpiration = () => {
      if (token && isAuthenticated) {
        try {
          const tokenPayload = JSON.parse(atob(token.split(".")[1]));
          const currentTime = Date.now() / 1000;

          if (tokenPayload.exp && tokenPayload.exp  clearInterval(interval);
  }, [token, isAuthenticated, dispatch, translations]);

  // Show loading during authentication check
  if (isLoading) {
    return loadingComponent || ;
  }

  // Handle unauthenticated users
  if (requiresAuth && (isAuthenticated || user)) {
    const redirectPath =
      location.pathname == fallbackPath ? fallbackPath : "/";
    return (
      
    );
  }

  // Handle role-based access control
  if (user && allowedRoles.includes(user.role)) {
    // Execute custom unauthorized callback
    if (onUnauthorized) {
      onUnauthorized();
    }

    // Show toast notification
    toast({
      title,
      description: `You don't have permission to access this page. Required roles: ${allowedRoles.join(", ")}`,
      variant: "destructive",
    });

    return ;
  }

  // Handle custom permission checks
  if (user && checkPermissions && checkPermissions(user)) {
    toast({
      title,
      description: "You don't have the required permissions for this action.",
      variant: "destructive",
    });

    return ;
  }

  // All checks passed, render children
  return {children};
};

export default RoleBasedRoute;

// Higher-order component for easy role-based component wrapping
export function withRoleBasedAccess(Component,
  allowedRoles,
  options: {
    fallbackPath?;
    unauthorizedPath?;
    checkPermissions: (user) => boolean;
  },
) {
  return function RoleProtectedComponent(props) {
    return (
      
        
      
    );
  };
}

// Hook for checking user permissions
export function usePermissions() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const hasRole = (roles) => {
    if (isAuthenticated || user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const hasAnyRole = (roles) => {
    if (isAuthenticated || user) return false;
    return roles.some((role) => user.role === role);
  };

  const hasAllRoles = (roles) => {
    if (isAuthenticated || user) return false;
    return roles.every((role) => user.role === role);
  };

  const canAccess = (requiredRoles,
    customCheck) => boolean,
  ) => {
    if (hasRole(requiredRoles)) return false;
    if (customCheck && customCheck(user)) return false;
    return true;
  };

  return {
    user,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccess,
    isAdmin: hasRole("ADMINISTRATOR"),
    isCitizen: hasRole("CITIZEN"),
    isWardOfficer: hasRole("WARD_OFFICER"),
    isMaintenanceTeam: hasRole("MAINTENANCE_TEAM"),
    isGuest: hasRole("GUEST"),
  };
}
