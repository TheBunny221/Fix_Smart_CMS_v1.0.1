import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { logout } from "../store/slices/auth";
import { setLanguage } from "../store/slices/language";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Logo } from "./ui/logo";
import {
  Home,
  FileText,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Globe,
  User,
  Wrench,
  Shield,
  MapPin,
  MessageSquare,
  Calendar,
  TrendingUp,
  Database,
  UserCheck,
  AlertTriangle,
  PieChart,
} from "lucide-react";

type UserRole =
  | "CITIZEN"
  | "WARD_OFFICER"
  | "MAINTENANCE_TEAM"
  | "ADMINISTRATOR"
  | "GUEST";



const Navigation: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations, currentLanguage } = useAppSelector(
    (state) => state.language,
  );
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
        if (nav) {
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
      icon: ,
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
      icon: ,
      roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
    },
    {
      label: translations.nav.complaints,
      path: "/complaints",
      icon: ,
      roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
    },
    {
      label: translations?.dashboard?.pendingTasks || "My Tasks",
      path: "/tasks",
      icon: ,
      roles: ["WARD_OFFICER", "MAINTENANCE_TEAM"],
    },
    {
      label: translations?.nav?.ward || "Ward Management",
      path: "/ward",
      icon: ,
      roles: ["WARD_OFFICER"],
    },
    {
      label: translations?.nav?.maintenance || "Maintenance",
      path: "/maintenance",
      icon: ,
      roles: ["MAINTENANCE_TEAM"],
    },
    {
      label: translations?.messages?.complaintRegistered || "Communication",
      path: "/messages",
      icon: ,
      roles: ["WARD_OFFICER", "MAINTENANCE_TEAM"],
    },
    {
      label: translations.nav.reports,
      path: "/reports",
      icon: ,
      roles: ["WARD_OFFICER", "ADMINISTRATOR", "MAINTENANCE_TEAM"],
    },
    {
      label: translations.nav.users,
      path: "/admin/users",
      icon: ,
      roles: ["ADMINISTRATOR"],
    },
    {
      label: translations?.settings?.generalSettings || "System Config",
      path: "/admin/config",
      icon: ,
      roles: ["ADMINISTRATOR"],
    },
    // {
    //   label: translations?.nav?.languages || "Languages",
    //   path: "/admin/languages",
    //   icon: ,
    //   roles: ["ADMINISTRATOR"],
    // },
    // {
    //   label: translations?.nav?.settings || "Settings",
    //   path: "/settings",
    //   icon: ,
    //   roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
    // },
  ];

  const filteredNavItems = navigationItems.filter((item) => {
    if (user) return false;

    // Hide Home tab for logged-in users (should only show for guests/non-authenticated)
    if (item.path === "/" && user) {
      return false;
    }

    // For MAINTENANCE_TEAM users, show only Maintenance and Complaints
    if (user.role === "MAINTENANCE_TEAM") {
      return item.path === "/maintenance" || item.path === "/complaints";
    }

    // For other roles, use the original filtering logic
    return item.roles.includes(user.role);
  });

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleLanguageChange = (language) => {
    dispatch(setLanguage(language));
  };

  const getUnreadNotificationCount = () => {
    return notifications.filter((n) => n.isRead).length;
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

  if (isAuthenticated) {
    return (
      
        
          
            
              
            

            {/* Mobile menu button for unauthenticated users */}
            
               setIsMobileMenuOpen(isMobileMenuOpen)}
                className="p-2 relative"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                
                  {isMobileMenuOpen ? (
                    
                  ) : (
                    
                  )}
                
              
            

            {/* Desktop Navigation for unauthenticated users */}
            
              
                
                  
                    
                    
                      {currentLanguage.toUpperCase()}
                    
                    {currentLanguage}
                  
                
                
                   handleLanguageChange("en")}>
                    English
                  
                   handleLanguageChange("hi")}>
                    हिंदी
                  
                   handleLanguageChange("ml")}>
                    മלയാളം
                  
                
              
              
                
                  
                    {translations?.complaints?.registerComplaint ||
                      "Register Complaint"}
                  
                  Complaint
                
              
              
                
                  
                    {translations.nav.login}
                  
                  Login
                
              
              
                
                  
                    {translations?.auth?.signUp ||
                      translations.nav.register ||
                      "Sign Up"}
                  
                  Sign Up
                
              
            
          

          {/* Mobile Navigation Menu for unauthenticated users */}
          
            
              
                
                  
                    
                      
                      {currentLanguage.toUpperCase()}
                    
                  
                
                
                   handleLanguageChange("en")}>
                    English
                  
                   handleLanguageChange("hi")}>
                    हिंदी
                  
                   handleLanguageChange("ml")}>
                    മലयാळം
                  
                
              
               setIsMobileMenuOpen(false)}
              >
                
                  {translations?.complaints?.registerComplaint ||
                    "Register Complaint"}
                
              
               setIsMobileMenuOpen(false)}
              >
                
                  {translations.nav.login}
                
              
               setIsMobileMenuOpen(false)}
              >
                
                  {translations?.auth?.signUp ||
                    translations.nav.register ||
                    "Sign Up"}
                
              
            
          
        
      
    );
  }

  return (
    
      
        
          
            
          

          {/* Mobile menu button */}
          
             setIsMobileMenuOpen(isMobileMenuOpen)}
              className="p-2 relative"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              
                {isMobileMenuOpen ? (
                  
                ) : (
                  
                )}
              
            
          

          {/* User Menu */}
          
            {/* Notifications */}
            
              {/* 
                
                  
                  {getUnreadNotificationCount() > 0 && (
                    
                      {getUnreadNotificationCount()}
                    
                  )}
                
               */}
              
                
                  
                    {translations?.auth?.notifications || "Notifications"}
                  
                  {notifications.length === 0 ? (
                    
                      {translations?.common?.noData || "No notifications"}
                    
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      
                        
                          {notification.title}
                        
                        
                          {notification.message}
                        
                      
                    ))
                  )}
                
              
            

            {/* Language Selector */}
            
              
                
                  
                  
                    {currentLanguage.toUpperCase()}
                  
                  {currentLanguage}
                
              
              
                 handleLanguageChange("en")}>
                  English
                
                 handleLanguageChange("hi")}>
                  हिंदी
                
                 handleLanguageChange("ml")}>
                  മലയാളം
                
              
            

            {/* User Menu */}
            
              
                
                  
                    
                    
                      {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    
                  
                  
                    {user?.fullName}
                    
                      {user?.role?.replace("_", " ")}
                    
                  
                
              
              
                
                  
                    
                    {translations?.nav?.profile || "Profile"}
                  
                
                {/* 
                  
                    
                    {translations.nav.settings}
                  
                 */}
                
                
                  
                  {translations.nav.logout}
                
              
            
          
        
      

      {/* Mobile Navigation Menu */}
      
        
          {/* Mobile Navigation Items */}
          
            {filteredNavItems.map((item) => (
               setIsMobileMenuOpen(false)}
              >
                
                  {item.icon}
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    
                      {item.badge}
                    
                  )}
                
              
            ))}
          

          {/* Mobile Language Selector */}
          
            
              
                
                  
                  Language: {currentLanguage.toUpperCase()}
                
              
            
            
               handleLanguageChange("en")}>
                English
              
               handleLanguageChange("hi")}>
                हिंदी
              
               handleLanguageChange("ml")}>
                മലയാളം
              
            
          

          {/* Mobile user menu items */}
          
             setIsMobileMenuOpen(false)}
            >
              
                
                {translations?.nav?.profile || "Profile"}
              
            
             setIsMobileMenuOpen(false)}
            >
              
                
                {translations.nav.settings}
              
            
             {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
            >
              
                
                {translations.nav.logout}
              
            
          
        
      
    
  );
};

export default Navigation;
