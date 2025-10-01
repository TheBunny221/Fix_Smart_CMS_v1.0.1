import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { store } from "./store";
import ErrorBoundary from "./components/ErrorBoundary";
import { ContextErrorBoundary } from "./components/ContextErrorBoundary";
import AppInitializer from "./components/AppInitializer";
import GlobalMessageHandler from "./components/GlobalMessageHandler";
import AuthErrorHandler from "./components/AuthErrorHandler";
import UnifiedLayout from "./components/layouts/UnifiedLayout";
import OtpProvider from "./contexts/OtpContext";
import OtpErrorBoundary from "./components/OtpErrorBoundary";
import { SystemConfigProvider } from "./contexts/SystemConfigContext";
import RoleBasedRoute from "./components/RoleBasedRoute";
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import { Loader2 } from "lucide-react";
// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const SetPassword = lazy(() => import("./pages/SetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
// Role-specific dashboards
// const CitizenDashboard = lazy(() => import("./pages/CitizenDashboard"));
// const WardOfficerDashboard = lazy(() => import("./pages/WardOfficerDashboard"));
// const MaintenanceDashboard = lazy(() => import("./pages/MaintenanceDashboard"));
// const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
// Complaint management
const ComplaintsList = lazy(() => import("./pages/ComplaintsList"));
const ComplaintDetails = lazy(() => import("./pages/ComplaintDetails"));
// const CreateComplaint = lazy(() => import("./pages/CreateComplaint"));
// const CitizenComplaintForm = lazy(() => import("./pages/CitizenComplaintForm"));
// const GuestComplaintForm = lazy(() => import("./pages/GuestComplaintForm"));
// const UnifiedComplaintForm = lazy(() => import("./pages/UnifiedComplaintForm"));
// const QuickComplaintPage = lazy(() => import("./pages/QuickComplaintPage"));
const GuestTrackComplaint = lazy(() => import("./pages/GuestTrackComplaint"));
// const GuestServiceRequest = lazy(() => import("./pages/GuestServiceRequest"));
const GuestDashboard = lazy(() => import("./pages/GuestDashboard"));
// Ward Officer pages
const WardTasks = lazy(() => import("./pages/WardTasks"));
const WardManagement = lazy(() => import("./pages/WardManagement"));
// Maintenance Team pages
const MaintenanceTasks = lazy(() => import("./pages/MaintenanceTasks"));
const TaskDetails = lazy(() => import("./pages/TaskDetails"));
// Admin pages
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const UnifiedReports = lazy(() => import("./pages/UnifiedReports"));
const AdminConfig = lazy(() => import("./pages/AdminConfig"));
const AdminLanguages = lazy(() => import("./pages/AdminLanguages"));
// Communication
const Messages = lazy(() => import("./pages/Messages"));
// Settings
// const Settings = lazy(() => import("./pages/Settings"));
// Loading component
const LoadingFallback = () => (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Loader2, { className: "h-6 w-6 animate-spin" }), _jsx("span", { children: "Loading..." })] }) }));
const App = () => {
    return (_jsx(Provider, { store: store, children: _jsx(ErrorBoundary, { children: _jsx(ContextErrorBoundary, { contextName: "SystemConfig", children: _jsx(SystemConfigProvider, { children: _jsx(ContextErrorBoundary, { contextName: "AppInitializer", children: _jsx(AppInitializer, { children: _jsx(ContextErrorBoundary, { contextName: "OtpProvider", children: _jsx(OtpErrorBoundary, { children: _jsx(OtpProvider, { children: _jsx(TooltipProvider, { children: _jsxs(Router, { children: [_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/set-password/:token", element: _jsx(SetPassword, {}) }), _jsx(Route, { path: "/set-password", element: _jsx(SetPassword, {}) }), _jsx(Route, { path: "/guest/track", element: _jsx(GuestTrackComplaint, {}) }), _jsx(Route, { path: "/guest/dashboard", element: _jsx(GuestDashboard, {}) }), _jsx(Route, { path: "/unauthorized", element: _jsx(Unauthorized, {}) }), _jsx(Route, { path: "/", element: _jsx(UnifiedLayout, { children: _jsx(Index, {}) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: [
                                                                                    "CITIZEN",
                                                                                    "WARD_OFFICER",
                                                                                    "MAINTENANCE_TEAM",
                                                                                    "ADMINISTRATOR",
                                                                                ], children: _jsx(RoleBasedDashboard, {}) }) }) }), _jsx(Route, { path: "/complaints", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: [
                                                                                    "CITIZEN",
                                                                                    "WARD_OFFICER",
                                                                                    "MAINTENANCE_TEAM",
                                                                                    "ADMINISTRATOR",
                                                                                ], children: _jsx(ComplaintsList, {}) }) }) }), _jsx(Route, { path: "/complaints/:id", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: [
                                                                                    "CITIZEN",
                                                                                    "WARD_OFFICER",
                                                                                    "MAINTENANCE_TEAM",
                                                                                    "ADMINISTRATOR",
                                                                                ], children: _jsx(ComplaintDetails, {}) }) }) }), _jsx(Route, { path: "/complaint/:id", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: [
                                                                                    "CITIZEN",
                                                                                    "WARD_OFFICER",
                                                                                    "MAINTENANCE_TEAM",
                                                                                    "ADMINISTRATOR",
                                                                                ], children: _jsx(ComplaintDetails, {}) }) }) }), _jsx(Route, { path: "/tasks", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: ["WARD_OFFICER"], children: _jsx(WardTasks, {}) }) }) }), _jsx(Route, { path: "/ward", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: ["WARD_OFFICER"], children: _jsx(WardManagement, {}) }) }) }), _jsx(Route, { path: "/maintenance", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: ["MAINTENANCE_TEAM"], children: _jsx(MaintenanceTasks, {}) }) }) }), _jsx(Route, { path: "/tasks/:id", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: ["MAINTENANCE_TEAM"], children: _jsx(TaskDetails, {}) }) }) }), _jsx(Route, { path: "/reports", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: [
                                                                                    "WARD_OFFICER",
                                                                                    "ADMINISTRATOR",
                                                                                    "MAINTENANCE_TEAM",
                                                                                ], children: _jsx(UnifiedReports, {}) }) }) }), _jsx(Route, { path: "/admin/users", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: ["ADMINISTRATOR"], children: _jsx(AdminUsers, {}) }) }) }), _jsx(Route, { path: "/admin/config", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: ["ADMINISTRATOR"], children: _jsx(AdminConfig, {}) }) }) }), _jsx(Route, { path: "/admin/languages", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: ["ADMINISTRATOR"], children: _jsx(AdminLanguages, {}) }) }) }), _jsx(Route, { path: "/admin/analytics", element: _jsx(Navigate, { to: "/reports", replace: true }) }), _jsx(Route, { path: "/admin/reports-analytics", element: _jsx(Navigate, { to: "/reports", replace: true }) }), _jsx(Route, { path: "/profile", element: _jsx(UnifiedLayout, { children: _jsx(RoleBasedRoute, { allowedRoles: [
                                                                                    "CITIZEN",
                                                                                    "WARD_OFFICER",
                                                                                    "MAINTENANCE_TEAM",
                                                                                    "ADMINISTRATOR",
                                                                                ], children: _jsx(Profile, {}) }) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) }), _jsx(Toaster, {}), _jsx(GlobalMessageHandler, {}), _jsx(AuthErrorHandler, {})] }) }) }) }) }) }) }) }) }) }) }));
};
export default App;
