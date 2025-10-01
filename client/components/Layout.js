import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { logout } from "../store/slices/authSlice";
import { setLanguage } from "../store/slices/languageSlice";
import { toggleSidebar, setSidebarOpen } from "../store/slices/uiSlice";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "./ui/dropdown-menu";
import { Bell, User as UserIcon, Settings, LogOut, Menu, X, FileText, Users, BarChart3, MapPin, Wrench, Clock, MessageSquare, } from "lucide-react";
const Layout = ({ userRole }) => {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const { translations, currentLanguage } = useAppSelector((state) => state.language);
    const { isSidebarOpen, notifications } = useAppSelector((state) => state.ui);
    // Use authenticated user's role if available, otherwise fall back to prop
    const effectiveUserRole = user?.role || userRole || "citizen";
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    // Return loading state if translations are not yet loaded
    if (!translations || !translations.nav || !translations.complaints) {
        return (_jsx("div", { className: "min-h-screen bg-background", children: _jsx("div", { className: "text-center py-8", children: _jsx("p", { children: "Loading translations..." }) }) }));
    }
    const getNavigationItems = () => {
        switch (effectiveUserRole) {
            case "citizen":
                return [
                    {
                        path: "/",
                        label: translations.complaints.registerComplaint,
                        icon: FileText,
                    },
                    {
                        path: "/my-complaints",
                        label: translations.complaints.myComplaints,
                        icon: MessageSquare,
                    },
                    {
                        path: "/reopen-complaint",
                        label: translations.complaints.reopenComplaint,
                        icon: Clock,
                    },
                    {
                        path: "/track-status",
                        label: translations.complaints.trackStatus,
                        icon: MapPin,
                    },
                    {
                        path: "/feedback",
                        label: translations.complaints.feedback,
                        icon: MessageSquare,
                    },
                ];
            case "ADMINISTRATOR":
                return [
                    {
                        path: "/admin",
                        label: translations.nav.dashboard,
                        icon: BarChart3,
                    },
                    {
                        path: "/admin/complaints",
                        label: translations.nav.complaints + " Management",
                        icon: FileText,
                    },
                    {
                        path: "/admin/users",
                        label: translations.nav.users + " Management",
                        icon: Users,
                    },
                    {
                        path: "/admin/reports",
                        label: translations.nav.reports,
                        icon: BarChart3,
                    },
                ];
            case "WARD_OFFICER":
                return [
                    {
                        path: "/ward",
                        label: "My Zone " + translations.nav.dashboard,
                        icon: BarChart3,
                    },
                    {
                        path: "/ward/review",
                        label: translations.nav.complaints + " Review",
                        icon: FileText,
                    },
                    { path: "/ward/forward", label: "Forwarding Panel", icon: MapPin },
                ];
            case "MAINTENANCE_TEAM":
                return [
                    {
                        path: "/maintenance",
                        label: "Assigned " + translations.nav.complaints,
                        icon: FileText,
                    },
                    { path: "/maintenance/update", label: "Update Status", icon: Wrench },
                    { path: "/maintenance/sla", label: "SLA Tracking", icon: Clock },
                ];
            default:
                return [];
        }
    };
    const navigationItems = getNavigationItems();
    const getRoleLabel = () => {
        switch (effectiveUserRole) {
            case "citizen":
                return "Citizen Portal";
            case "ADMINISTRATOR":
                return "Admin " + translations.nav.dashboard;
            case "WARD_OFFICER":
                return "Ward Officer Portal";
            case "MAINTENANCE_TEAM":
                return "Maintenance Team";
            default:
                return "Portal";
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx("header", { className: "bg-white border-b border-border shadow-sm", children: _jsxs("div", { className: "flex items-center justify-between h-16 px-4 lg:px-6", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => dispatch(toggleSidebar()), className: "lg:hidden", children: isSidebarOpen ? (_jsx(X, { className: "h-5 w-5" })) : (_jsx(Menu, { className: "h-5 w-5" })) }), _jsxs(Link, { to: "/", className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-8 h-8 bg-primary rounded-lg flex items-center justify-center", children: _jsx(FileText, { className: "h-5 w-5 text-primary-foreground" }) }), _jsxs("div", { className: "hidden sm:block", children: [_jsx("h1", { className: "text-xl font-semibold text-foreground", children: "CitizenConnect" }), _jsx("p", { className: "text-sm text-muted-foreground", children: getRoleLabel() })] })] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", children: currentLanguage.toUpperCase() }) }), _jsxs(DropdownMenuContent, { children: [_jsx(DropdownMenuItem, { onClick: () => dispatch(setLanguage("en")), children: "English" }), _jsx(DropdownMenuItem, { onClick: () => dispatch(setLanguage("hi")), children: "\u0939\u093F\u0928\u094D\u0926\u0940" }), _jsx(DropdownMenuItem, { onClick: () => dispatch(setLanguage("ml")), children: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02" })] })] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "relative", children: [_jsx(Bell, { className: "h-5 w-5" }), unreadNotifications > 0 && (_jsx(Badge, { className: "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive", children: unreadNotifications }))] }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-80", children: [_jsx("div", { className: "px-3 py-2 border-b", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Notifications" }), _jsxs(Badge, { variant: "secondary", className: "text-xs", children: [unreadNotifications, " unread"] })] }) }), _jsx("div", { className: "max-h-80 overflow-auto", children: unreadNotifications === 0 &&
                                                        notifications.filter((n) => !n.isRead).length === 0 &&
                                                        notifications.length === 0 ? (_jsx("div", { className: "p-4 text-sm text-muted-foreground", children: "No notifications" })) : (notifications.slice(0, 10).map((n) => (_jsxs(DropdownMenuItem, { className: "flex flex-col items-start gap-1", children: [_jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsx("span", { className: `text-sm ${n.isRead ? "text-muted-foreground" : "font-medium"}`, children: n.title }), !n.isRead && (_jsx(Badge, { className: "ml-2", variant: "outline", children: "New" }))] }), n.message && (_jsx("span", { className: "text-xs text-muted-foreground line-clamp-2", children: n.message })), _jsxs("div", { className: "flex gap-2 mt-1", children: [!n.isRead && (_jsx("button", { className: "text-xs text-primary hover:underline", onClick: (e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            dispatch(markNotificationAsRead(n.id));
                                                                        }, children: "Mark as read" })), _jsx("button", { className: "text-xs text-destructive hover:underline", onClick: (e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            dispatch(removeNotification(n.id));
                                                                        }, children: "Dismiss" })] })] }, n.id)))) }), _jsxs("div", { className: "px-3 py-2 border-t flex items-center justify-between gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => dispatch(markAllNotificationsAsRead()), children: "Mark all as read" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => dispatch(clearNotifications()), children: "Clear" })] })] })] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", children: _jsx(UserIcon, { className: "h-5 w-5" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: "/profile", className: "flex items-center", children: [_jsx(UserIcon, { className: "h-4 w-4 mr-2" }), translations.nav.profile] }) }), _jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: "/settings", className: "flex items-center", children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), translations.nav.settings] }) }), _jsxs(DropdownMenuItem, { onClick: () => dispatch(logout()), children: [_jsx(LogOut, { className: "h-4 w-4 mr-2" }), translations.nav.logout] })] })] })] })] }) }), _jsxs("div", { className: "flex", children: [_jsx("aside", { className: `fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:block`, children: _jsx("div", { className: "flex flex-col h-full pt-16 lg:pt-0", children: _jsx("nav", { className: "flex-1 px-4 py-4 space-y-1", children: navigationItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (_jsxs(Link, { to: item.path, className: `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`, onClick: () => dispatch(setSidebarOpen(false)), children: [_jsx(Icon, { className: "h-5 w-5 mr-3" }), item.label] }, item.path));
                                }) }) }) }), isSidebarOpen && (_jsx("div", { className: "fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden", onClick: () => dispatch(setSidebarOpen(false)) })), _jsx("main", { className: "flex-1 lg:pl-0", children: _jsx("div", { className: "p-4 lg:p-6", children: _jsx(Outlet, {}) }) })] })] }));
};
export default Layout;
