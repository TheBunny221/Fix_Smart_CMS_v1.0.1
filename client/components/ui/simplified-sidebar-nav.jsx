import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { toggleSidebarCollapsed } from "../../store/slices/ui";
import { Button } from "./button";
import { cn } from "../../lib/utils";
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
  Globe,
  PieChart,
} from "lucide-react";





export const SimplifiedSidebarNav: React.FC = ({
  className,
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const translations = useAppSelector((state) => state.language.translations);
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);

  // Use UI slice state instead of local state
  const isCollapsed = sidebarCollapsed;

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

    return item.roles.includes(user.role);
  });

  const isActiveRoute = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    
      {/* Header with toggle button only */}
      
        {isCollapsed && (
          
            Menu
          
        )}
         dispatch(toggleSidebarCollapsed())}
          className="p-1.5 hover:bg-gray-100 rounded-md ml-auto"
        >
          {isCollapsed ? (
            
          ) : (
            
          )}
        
      

      {/* Navigation Items */}
      
        {filteredNavItems.map((item) => ({React.cloneElement(item.icon.ReactElement, {
                className,
                  isActiveRoute(item.path)
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700",
                ),
              })}
            
            {isCollapsed && (
              {item.label}
            )}
          
        ))}
      
    
  );
};

export default SimplifiedSidebarNav;
