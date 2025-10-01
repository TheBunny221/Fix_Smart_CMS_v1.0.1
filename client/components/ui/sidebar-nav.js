import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import { setLanguage } from "../../store/slices/languageSlice";
import { useSystemConfig } from "../../contexts/SystemConfigContext";
import { Button } from "./button";
import { cn } from "../../lib/utils";
import { Logo } from "./logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "./dropdown-menu";
import { ChevronLeft, ChevronRight, Home, FileText, BarChart3, Users, Settings, Calendar, MapPin, MessageSquare, TrendingUp, Database, Wrench, Shield, UserCheck, LogOut, Globe, User, } from "lucide-react";
export const SidebarNav = ({ className, defaultCollapsed = false, }) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const location = useLocation();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { translations } = useAppSelector((state) => state.language);
    const { appName, appLogoUrl, appLogoSize } = useSystemConfig();
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
        {
            label: translations?.dashboard?.pendingTasks || "My Tasks",
            path: "/tasks",
            icon: _jsx(Calendar, { className: "h-4 w-4" }),
            roles: ["WARD_OFFICER", "MAINTENANCE_TEAM"],
        },
        {
            label: translations?.nav?.ward || "Ward Management",
            path: "/ward",
            icon: _jsx(MapPin, { className: "h-4 w-4" }),
            roles: ["WARD_OFFICER"],
        },
        {
            label: translations?.nav?.maintenance || "Maintenance",
            path: "/maintenance",
            icon: _jsx(Wrench, { className: "h-4 w-4" }),
            roles: ["MAINTENANCE_TEAM"],
        },
        {
            label: translations?.messages?.complaintRegistered || "Communication",
            path: "/messages",
            icon: _jsx(MessageSquare, { className: "h-4 w-4" }),
            roles: ["WARD_OFFICER", "MAINTENANCE_TEAM"],
        },
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
        {
            label: translations?.nav?.settings || "Settings",
            path: "/settings",
            icon: _jsx(Settings, { className: "h-4 w-4" }),
            roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
        },
    ];
    const filteredNavItems = navigationItems.filter((item) => {
        if (!user)
            return false;
        if (item.path === "/" && user) {
            return false;
        }
        if (user.role === "MAINTENANCE_TEAM") {
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
    const handleLogout = () => {
        dispatch(logout());
    };
    const handleLanguageChange = (language) => {
        dispatch(setLanguage(language));
    };
    return (_jsxs("div", { className: cn("bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col h-full", isCollapsed ? "w-16" : "w-64", className), children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200", children: [!isCollapsed && (_jsx(Logo, { logoUrl: appLogoUrl, appName: appName, size: appLogoSize, context: "nav", showText: true })), isCollapsed && (_jsx(Logo, { logoUrl: appLogoUrl, appName: appName, size: appLogoSize, context: "nav", showText: false })), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setIsCollapsed(!isCollapsed), className: "p-1.5 hover:bg-gray-100", children: isCollapsed ? (_jsx(ChevronRight, { className: "h-4 w-4" })) : (_jsx(ChevronLeft, { className: "h-4 w-4" })) })] }), _jsx("nav", { className: "flex-1 p-2 space-y-1 overflow-y-auto", children: filteredNavItems.map((item) => (_jsxs(Link, { to: item.path, className: cn("flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200", isActiveRoute(item.path)
                        ? "bg-primary/10 text-primary border-r-2 border-primary"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900", isCollapsed ? "justify-center" : "justify-start"), title: isCollapsed ? item.label : undefined, children: [_jsx("span", { className: "flex-shrink-0", children: item.icon }), !isCollapsed && (_jsx("span", { className: "ml-3 truncate", children: item.label }))] }, item.path))) }), user && (_jsx("div", { className: "p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", className: cn("w-full h-auto p-2 justify-start hover:bg-gray-200", isCollapsed && "justify-center p-2"), children: _jsxs("div", { className: "flex items-center w-full", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "w-8 h-8 bg-primary rounded-full flex items-center justify-center", children: user.role === "ADMINISTRATOR" ? (_jsx(Shield, { className: "h-4 w-4 text-white" })) : user.role === "WARD_OFFICER" ? (_jsx(UserCheck, { className: "h-4 w-4 text-white" })) : (_jsx("span", { className: "text-xs font-medium text-white", children: user.fullName.charAt(0) })) }) }), !isCollapsed && (_jsxs("div", { className: "ml-3 min-w-0 text-left", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: user.fullName }), _jsx("p", { className: "text-xs text-gray-500 truncate", children: user.role.replace("_", " ").toLowerCase() })] }))] }) }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-56", children: [_jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: "/profile", className: "flex items-center", children: [_jsx(User, { className: "h-4 w-4 mr-2" }), translations.nav?.profile || "Profile"] }) }), _jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: "/settings", className: "flex items-center", children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), translations.nav?.settings || "Settings"] }) }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(DropdownMenuItem, { className: "flex items-center", children: [_jsx(Globe, { className: "h-4 w-4 mr-2" }), "Language"] }) }), _jsxs(DropdownMenuContent, { side: "right", children: [_jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("en"), children: "English" }), _jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("hi"), children: "\u0939\u093F\u0902\u0926\u0940" }), _jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("ml"), children: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02" })] })] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: handleLogout, className: "text-red-600 focus:text-red-600", children: [_jsx(LogOut, { className: "h-4 w-4 mr-2" }), translations.nav?.logout || "Logout"] })] })] }) }))] }));
};
export default SidebarNav;
