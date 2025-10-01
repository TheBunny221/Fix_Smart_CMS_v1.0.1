import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { toast } from "./ui/use-toast";
import { selectTranslations } from "../store/slices/languageSlice";
import { Loader2 } from "lucide-react";
// Loading component for authentication checks
const AuthLoadingComponent = () => (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Loader2, { className: "h-6 w-6 animate-spin" }), _jsx("span", { children: "Verifying authentication..." })] }) }));
const RoleBasedRoute = ({ children, allowedRoles, fallbackPath = "/login", unauthorizedPath = "/unauthorized", requiresAuth = true, checkPermissions, onUnauthorized, loadingComponent, }) => {
    const { user, isAuthenticated, isLoading, token } = useAppSelector((state) => state.auth);
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
                    if (tokenPayload.exp && tokenPayload.exp < currentTime) {
                        // Token expired
                        dispatch(logout());
                        toast({
                            title: translations?.messages?.sessionExpired || "Session Expired",
                            description: "Please login again to continue.",
                            variant: "destructive",
                        });
                    }
                }
                catch (error) {
                    // Invalid token format
                    console.warn("Invalid token format:", error);
                    dispatch(logout());
                }
            }
        };
        // Check token on mount and every minute
        handleTokenExpiration();
        const interval = setInterval(handleTokenExpiration, 60000);
        return () => clearInterval(interval);
    }, [token, isAuthenticated, dispatch, translations]);
    // Show loading during authentication check
    if (isLoading) {
        return loadingComponent || _jsx(AuthLoadingComponent, {});
    }
    // Handle unauthenticated users
    if (requiresAuth && (!isAuthenticated || !user)) {
        const redirectPath = location.pathname !== fallbackPath ? fallbackPath : "/";
        return (_jsx(Navigate, { to: redirectPath, state: {
                from: location,
                message: translations?.messages?.unauthorizedAccess ||
                    "Please login to access this page.",
            }, replace: true }));
    }
    // Handle role-based access control
    if (user && !allowedRoles.includes(user.role)) {
        // Execute custom unauthorized callback
        if (onUnauthorized) {
            onUnauthorized();
        }
        // Show toast notification
        toast({
            title: translations?.messages?.unauthorizedAccess || "Access Denied",
            description: `You don't have permission to access this page. Required roles: ${allowedRoles.join(", ")}`,
            variant: "destructive",
        });
        return _jsx(Navigate, { to: unauthorizedPath, replace: true });
    }
    // Handle custom permission checks
    if (user && checkPermissions && !checkPermissions(user)) {
        toast({
            title: translations?.messages?.unauthorizedAccess || "Access Denied",
            description: "You don't have the required permissions for this action.",
            variant: "destructive",
        });
        return _jsx(Navigate, { to: unauthorizedPath, replace: true });
    }
    // All checks passed, render children
    return _jsx(_Fragment, { children: children });
};
export default RoleBasedRoute;
// Higher-order component for easy role-based component wrapping
export function withRoleBasedAccess(Component, allowedRoles, options) {
    return function RoleProtectedComponent(props) {
        return (_jsx(RoleBasedRoute, { allowedRoles: allowedRoles, fallbackPath: options?.fallbackPath, unauthorizedPath: options?.unauthorizedPath, checkPermissions: options?.checkPermissions, children: _jsx(Component, { ...props }) }));
    };
}
// Hook for checking user permissions
export function usePermissions() {
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const hasRole = (roles) => {
        if (!isAuthenticated || !user)
            return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
    };
    const hasAnyRole = (roles) => {
        if (!isAuthenticated || !user)
            return false;
        return roles.some((role) => user.role === role);
    };
    const hasAllRoles = (roles) => {
        if (!isAuthenticated || !user)
            return false;
        return roles.every((role) => user.role === role);
    };
    const canAccess = (requiredRoles, customCheck) => {
        if (!hasRole(requiredRoles))
            return false;
        if (customCheck && !customCheck(user))
            return false;
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
