import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import { setLanguage } from "../../store/slices/languageSlice";
import { useSystemConfig } from "../../contexts/SystemConfigContext";
import { Button } from "./button";
import { cn } from "../../lib/utils";
import { Logo } from "./logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  BarChart3,
  Users,
  Settings,
  Calendar,
  MapPin,
  MessageSquare,
  TrendingUp,
  Database,
  Wrench,
  Shield,
  UserCheck,
  LogOut,
  Globe,
  User,
} from "lucide-react";





export const SidebarNav: React.FC = ({
  className,
  defaultCollapsed = false,
}) => {
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
    {
      label: translations?.nav?.settings || "Settings",
      path: "/settings",
      icon: ,
      roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
    },
  ];

  const filteredNavItems = navigationItems.filter((item) => {
    if (user) return false;

    // Hide Home tab for logged-in users (should only show for guests/non-authenticated)
    if (item.path === "/" && user) {
      return false;
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

  return (
    
      {/* Header with logo and toggle button */}
      
        {isCollapsed && (
          
        )}
        {isCollapsed && (
          
        )}
         setIsCollapsed(isCollapsed)}
          className="p-1.5 hover:bg-gray-100"
        >
          {isCollapsed ? (
            
          ) : (
            
          )}
        
      

      {/* Navigation Items */}
      
        {filteredNavItems.map((item) => (
          
            {item.icon}
            {isCollapsed && (
              {item.label}
            )}
          
        ))}
      

      {/* User section at bottom with dropdown */}
      {user && (
        
          
            
              
                
                  
                    
                      {user.role === "ADMINISTRATOR" ? (
                        
                      ) : user.role === "WARD_OFFICER" ? (
                        
                      ) : (
                        
                          {user.fullName.charAt(0)}
                        
                      )}
                    
                  
                  {isCollapsed && (
                    
                      
                        {user.fullName}
                      
                      
                        {user.role.replace("_", " ").toLowerCase()}
                      
                    
                  )}
                
              
            
            
              
                
                  
                  {translations.nav?.profile || "Profile"}
                
              
              
                
                  
                  {translations.nav?.settings || "Settings"}
                
              
              
              
                
                  
                    
                    {translations.nav?.language || "Language"}
                  
                
                
                   handleLanguageChange("en")}>
                    English
                  
                   handleLanguageChange("hi")}>
                    हिंदी
                  
                   handleLanguageChange("ml")}>
                    മലയാളം
                  
                
              
              
              
                
                {translations.nav?.logout || "Logout"}
              
            
          
        
      )}
    
  );
};

export default SidebarNav;
