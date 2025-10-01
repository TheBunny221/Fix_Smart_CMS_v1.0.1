import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { logout } from "../store/slices/authSlice";
import { setLanguage } from "../store/slices/languageSlice";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Logo } from "./ui/logo";
import { Home, FileText, BarChart3, Users, LogOut, Menu, X, Globe, User, Wrench, Shield, MapPin, TrendingUp, Database, } from "lucide-react";
const Navigation = () => {
    const location = useLocation();
    const dispatch = useAppDispatch();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const { translations, currentLanguage } = useAppSelector((state) => state.language);
    const { notifications } = useAppSelector((state) => state.ui);
    const { appName, appLogoUrl, appLogoSize } = useSystemConfig();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    // Close mobile menu on escape key
    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isMobileMenuOpen]);
    // Close mobile menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (isMobileMenuOpen) {
                const target = e.target;
                const nav = target.closest("nav");
                if (!nav) {
                    setIsMobileMenuOpen(false);
                }
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isMobileMenuOpen]);
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
        // For MAINTENANCE_TEAM users, show only Dashboard and Complaints
        if (user.role === "MAINTENANCE_TEAM") {
            return item.path === "/dashboard" || item.path === "/complaints";
        }
        return item.roles.includes(user.role);
    });
    const handleLogout = () => {
        dispatch(logout());
    };
    const handleLanguageChange = (language) => {
        dispatch(setLanguage(language));
    };
    const getUnreadNotificationCount = () => {
        return notifications.filter((n) => !n.isRead).length;
    };
    const getRoleColor = (role) => {
        switch (role) {
            case "ADMINISTRATOR":
                return "bg-red-100 text-red-800";
            case "WARD_OFFICER":
                return "bg-blue-100 text-blue-800";
            case "MAINTENANCE_TEAM":
                return "bg-green-100 text-green-800";
            case "CITIZEN":
                return "bg-gray-100 text-gray-800";
            case "GUEST":
                return "bg-purple-100 text-purple-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    if (!isAuthenticated) {
        return (_jsx("nav", { className: "bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "flex justify-between h-16", children: [_jsx("div", { className: "flex items-center", children: _jsx(Logo, { logoUrl: appLogoUrl, appName: appName, size: appLogoSize, context: "nav", to: "/", responsive: true, fallbackIcon: Shield }) }), _jsx("div", { className: "md:hidden", children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen), className: "p-2 relative", "aria-label": isMobileMenuOpen ? "Close menu" : "Open menu", children: _jsx("div", { className: "flex items-center justify-center w-5 h-5", children: isMobileMenuOpen ? (_jsx(X, { className: "h-5 w-5 transition-all duration-200" })) : (_jsx(Menu, { className: "h-5 w-5 transition-all duration-200" })) }) }) }), _jsxs("div", { className: "hidden md:flex items-center space-x-2 lg:space-x-4", children: [_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Globe, { className: "h-4 w-4 mr-1 lg:mr-2" }), _jsx("span", { className: "hidden lg:inline", children: currentLanguage.toUpperCase() }), _jsx("span", { className: "lg:hidden", children: currentLanguage })] }) }), _jsxs(DropdownMenuContent, { children: [_jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("en"), children: "English" }), _jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("hi"), children: "\u0939\u093F\u0902\u0926\u0940" }), _jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("ml"), children: "\u0D2E\u05DC\u0D2F\u0D3E\u0D33\u0D02" })] })] }), _jsx(Link, { to: "/login", children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx("span", { className: "hidden lg:inline", children: translations.nav.login }), _jsx("span", { className: "lg:hidden", children: "Login" })] }) }), _jsx(Link, { to: "/register", children: _jsxs(Button, { size: "sm", children: [_jsx("span", { className: "hidden lg:inline", children: translations?.auth?.signUp ||
                                                        translations.nav.register ||
                                                        "Sign Up" }), _jsx("span", { className: "lg:hidden", children: "Sign Up" })] }) })] })] }), _jsx("div", { className: `md:hidden overflow-hidden transition-all duration-300 ease-in-out backdrop-blur-sm ${isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`, children: _jsxs("div", { className: "px-4 pt-3 pb-4 space-y-3 border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur-md", children: [_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", className: "w-full justify-center mb-3", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Globe, { className: "h-4 w-4 mr-2" }), _jsx("span", { children: currentLanguage.toUpperCase() })] }) }) }), _jsxs(DropdownMenuContent, { children: [_jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("en"), children: "English" }), _jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("hi"), children: "\u0939\u093F\u0902\u0926\u0940" }), _jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("ml"), children: "\u0D2E\u0D32\u092F\u0D3E\u0933\u0D02" })] })] }), _jsx(Link, { to: "/complaint", className: "block", onClick: () => setIsMobileMenuOpen(false), children: _jsx(Button, { variant: "outline", className: "w-full", children: translations?.complaints?.registerComplaint ||
                                            "Register Complaint" }) }), _jsx(Link, { to: "/login", className: "block", onClick: () => setIsMobileMenuOpen(false), children: _jsx(Button, { variant: "outline", className: "w-full", children: translations.nav.login }) }), _jsx(Link, { to: "/register", className: "block", onClick: () => setIsMobileMenuOpen(false), children: _jsx(Button, { className: "w-full", children: translations?.auth?.signUp ||
                                            translations.nav.register ||
                                            "Sign Up" }) })] }) })] }) }));
    }
    return (_jsxs("nav", { className: "bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50", children: [_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between h-16", children: [_jsx("div", { className: "flex items-center", children: _jsx(Logo, { logoUrl: appLogoUrl, appName: appName, size: appLogoSize, context: "nav", to: "/", responsive: true, fallbackIcon: Shield }) }), _jsx("div", { className: "md:hidden flex items-center justify-center ", children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen), className: "p-2 relative", "aria-label": isMobileMenuOpen ? "Close menu" : "Open menu", children: _jsx("div", { className: "flex items-center justify-center w-5 h-5", children: isMobileMenuOpen ? (_jsx(X, { className: "h-5 w-5 transition-all duration-200" })) : (_jsx(Menu, { className: "h-5 w-5 transition-all duration-200" })) }) }) }), _jsxs("div", { className: "hidden md:flex items-center space-x-2 lg:space-x-4", children: [_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", children: [_jsx(Globe, { className: "h-4 w-4 mr-1 lg:mr-2" }), _jsx("span", { className: "hidden lg:inline", children: currentLanguage.toUpperCase() }), _jsx("span", { className: "lg:hidden", children: currentLanguage })] }) }), _jsxs(DropdownMenuContent, { children: [_jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("en"), children: "English" }), _jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("hi"), children: "\u0939\u093F\u0902\u0926\u0940" }), _jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("ml"), children: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02" })] })] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", className: "flex items-center space-x-2", size: "sm", children: [_jsxs(Avatar, { className: "h-8 w-8", children: [_jsx(AvatarImage, { src: user?.avatar }), _jsx(AvatarFallback, { children: user?.fullName?.charAt(0)?.toUpperCase() || "U" })] }), _jsxs("div", { className: "hidden lg:block text-left", children: [_jsx("p", { className: "text-sm font-medium", children: user?.fullName }), _jsx(Badge, { className: `text-xs ${getRoleColor(user?.role || "")}`, children: user?.role?.replace("_", " ") })] })] }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { asChild: true, children: _jsxs(Link, { to: "/profile", className: "flex items-center", children: [_jsx(User, { className: "h-4 w-4 mr-2" }), translations?.nav?.profile || "Profile"] }) }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: handleLogout, className: "text-red-600", children: [_jsx(LogOut, { className: "h-4 w-4 mr-2" }), translations.nav.logout] })] })] })] })] }) }), _jsx("div", { className: `md:hidden overflow-hidden transition-all duration-300 ease-in-out backdrop-blur-sm ${isMobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`, children: _jsxs("div", { className: "px-4 pt-3 pb-4 space-y-2 border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur-md", children: [_jsx("div", { className: "space-y-1 mb-4", children: filteredNavItems.map((item) => (_jsx(Link, { to: item.path, className: `block px-3 py-2 rounded-md text-base font-medium transition-colors ${location.pathname === item.path
                                    ? "bg-primary text-primary-foreground"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`, onClick: () => setIsMobileMenuOpen(false), children: _jsxs("div", { className: "flex items-center space-x-3", children: [item.icon, _jsx("span", { children: item.label }), item.badge && item.badge > 0 && (_jsx(Badge, { variant: "destructive", className: "h-5 w-5 p-0 flex items-center justify-center text-xs ml-auto", children: item.badge }))] }) }, item.path))) }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { className: "block w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Globe, { className: "h-4 w-4" }), _jsxs("span", { children: ["Language: ", currentLanguage.toUpperCase()] })] }) }) }), _jsxs(DropdownMenuContent, { children: [_jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("en"), children: "English" }), _jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("hi"), children: "\u0939\u093F\u0902\u0926\u0940" }), _jsx(DropdownMenuItem, { onClick: () => handleLanguageChange("ml"), children: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02" })] })] }), _jsxs("div", { className: "border-t border-gray-200 pt-3", children: [_jsx(Link, { to: "/profile", className: "block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100", onClick: () => setIsMobileMenuOpen(false), children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(User, { className: "h-4 w-4" }), _jsx("span", { children: translations?.nav?.profile || "Profile" })] }) }), _jsx("button", { onClick: () => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }, className: "block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(LogOut, { className: "h-4 w-4" }), _jsx("span", { children: translations.nav.logout })] }) })] })] }) })] }));
};
export default Navigation;
