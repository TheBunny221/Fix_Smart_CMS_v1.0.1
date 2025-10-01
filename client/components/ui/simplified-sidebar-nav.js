import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { toggleSidebarCollapsed } from "../../store/slices/uiSlice";
import { Button } from "./button";
import { cn } from "../../lib/utils";
import { ChevronLeft, ChevronRight, Home, FileText, BarChart3, Users, TrendingUp, Database, Wrench, } from "lucide-react";
export const SimplifiedSidebarNav = ({ className, }) => {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const { user } = useAppSelector((state) => state.auth);
    const { translations } = useAppSelector((state) => state.language);
    const { isSidebarCollapsed } = useAppSelector((state) => state.ui);
    // Use UI slice state instead of local state
    const isCollapsed = isSidebarCollapsed;
    const navigationItems = [
        {
            label: translations.nav.home,
            path: "/",
            icon: _jsx(Home, { className: "h-4 w-4" }),
            roles: [
                "CITIZEN",
                "WARD_OFFICER",
                "MAINTENANCE_TEAM",
                "ADMINISTRATOR",
                "GUEST",
            ],
        },
        {
            label: translations.nav.dashboard,
            path: "/dashboard",
            icon: _jsx(BarChart3, { className: "h-4 w-4" }),
            roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
        },
        {
            label: translations.nav.complaints,
            path: "/complaints",
            icon: _jsx(FileText, { className: "h-4 w-4" }),
            roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
        },
        // {
        //   label: translations?.dashboard?.pendingTasks || "My Tasks",
        //   path: "/tasks",
        //   icon: <Calendar className="h-4 w-4" />,
        //   roles: ["WARD_OFFICER", "MAINTENANCE_TEAM"],
        // },
        // {
        //   label: translations?.nav?.ward || "Ward Management",
        //   path: "/ward",
        //   icon: <MapPin className="h-4 w-4" />,
        //   roles: ["WARD_OFFICER"],
        // },
        {
            label: translations?.nav?.maintenance || "Maintenance",
            path: "/maintenance",
            icon: _jsx(Wrench, { className: "h-4 w-4" }),
            roles: ["MAINTENANCE_TEAM"],
        },
        // {
        //   label: translations?.messages?.complaintRegistered || "Communication",
        //   path: "/messages",
        //   icon: <MessageSquare className="h-4 w-4" />,
        //   roles: ["WARD_OFFICER", "MAINTENANCE_TEAM"],
        // },
        {
            label: translations.nav.reports,
            path: "/reports",
            icon: _jsx(TrendingUp, { className: "h-4 w-4" }),
            roles: ["WARD_OFFICER", "ADMINISTRATOR", "MAINTENANCE_TEAM"],
        },
        {
            label: translations.nav.users,
            path: "/admin/users",
            icon: _jsx(Users, { className: "h-4 w-4" }),
            roles: ["ADMINISTRATOR"],
        },
        {
            label: translations?.settings?.generalSettings || "System Config",
            path: "/admin/config",
            icon: _jsx(Database, { className: "h-4 w-4" }),
            roles: ["ADMINISTRATOR"],
        },
        // {
        //   label: translations?.nav?.languages || "Languages",
        //   path: "/admin/languages",
        //   icon: <Globe className="h-4 w-4" />,
        //   roles: ["ADMINISTRATOR"],
        // },
        // {
        //   label: translations?.nav?.settings || "Settings",
        //   path: "/settings",
        //   icon: <Settings className="h-4 w-4" />,
        //   roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
        // },
    ];
    const filteredNavItems = navigationItems.filter((item) => {
        if (!user)
            return false;
        if (item.path === "/" && user) {
            return false;
        }
        if (user.role === "MAINTENANCE_TEAM") {
            // Only show Dashboard and Complaints for maintenance
            return item.path === "/dashboard" || item.path === "/complaints";
        }
        return item.roles.includes(user.role);
    });
    const isActiveRoute = (path) => {
        if (path === "/") {
            return location.pathname === "/";
        }
        return location.pathname.startsWith(path);
    };
    return (_jsxs("div", { className: cn("bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out flex flex-col h-full", isCollapsed ? "w-16" : "w-64", className), children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-100", children: [!isCollapsed && (_jsx("h2", { className: "text-xs font-semibold text-gray-500 tracking-wider uppercase", children: "Menu" })), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => dispatch(toggleSidebarCollapsed()), className: "p-1.5 hover:bg-gray-100 rounded-md ml-auto", children: isCollapsed ? (_jsx(ChevronRight, { className: "h-4 w-4 text-gray-400" })) : (_jsx(ChevronLeft, { className: "h-4 w-4 text-gray-400" })) })] }), _jsx("nav", { className: "flex-1 p-3 space-y-1 overflow-y-auto", children: filteredNavItems.map((item) => (_jsxs(Link, { to: item.path, className: cn("flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group", isActiveRoute(item.path)
                        ? "bg-primary text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm", isCollapsed ? "justify-center" : "justify-start"), title: isCollapsed ? item.label : undefined, children: [_jsx("span", { className: "flex-shrink-0 transition-colors duration-200", children: React.cloneElement(item.icon, {
                                className: cn("h-4 w-4", isActiveRoute(item.path)
                                    ? "text-white"
                                    : "text-gray-500 group-hover:text-gray-700"),
                            }) }), !isCollapsed && (_jsx("span", { className: "ml-3 truncate font-medium", children: item.label }))] }, item.path))) })] }));
};
export default SimplifiedSidebarNav;
