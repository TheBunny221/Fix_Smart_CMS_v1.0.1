import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { logout } from "../store/slices/authSlice";
import { setLanguage } from "../store/slices/languageSlice";
import { toggleSidebar, setSidebarOpen } from "../store/slices/uiSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Users,
  BarChart3,
  MapPin,
  Wrench,
  Clock,
  MessageSquare,
} from "lucide-react";




const Layout: React.FC = ({ userRole }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations, currentLanguage } = useAppSelector(
    (state) => state.language,
  );
  const { isSidebarOpen, notifications } = useAppSelector((state) => state.ui);

  // Use authenticated user's role if available, otherwise fall back to prop
  const effectiveUserRole = user?.role || userRole || "citizen";
  const unreadNotifications = notifications.filter((n) => n.isRead).length;

  // Return loading state if translations are not yet loaded
  if (translations || translations.nav || translations.complaints) {
    return (
      
        
          Loading translations...
        
      
    );
  }

  const getNavigationItems = () => {
    switch (effectiveUserRole) {
      case "citizen":
        return [
          {
            path: "/",
            label: translations.complaints.registerComplaint,
            icon,
          },
          {
            path: "/my-complaints",
            label: translations.complaints.myComplaints,
            icon,
          },
          {
            path: "/reopen-complaint",
            label: translations.complaints.reopenComplaint,
            icon,
          },
          {
            path: "/track-status",
            label: translations.complaints.trackStatus,
            icon,
          },
          {
            path: "/feedback",
            label: translations.complaints.feedback,
            icon,
          },
        ];
      case "ADMINISTRATOR":
        return [
          {
            path: "/admin",
            label: translations.nav.dashboard,
            icon,
          },
          {
            path: "/admin/complaints",
            label: translations.nav.complaints + " Management",
            icon,
          },
          {
            path: "/admin/users",
            label: translations.nav.users + " Management",
            icon,
          },
          {
            path: "/admin/reports",
            label: translations.nav.reports,
            icon,
          },
        ];
      case "WARD_OFFICER":
        return [
          {
            path: "/ward",
            label: "My Zone " + translations.nav.dashboard,
            icon,
          },
          {
            path: "/ward/review",
            label: translations.nav.complaints + " Review",
            icon,
          },
          { path: "/ward/forward", label: "Forwarding Panel", icon: MapPin },
        ];
      case "MAINTENANCE_TEAM":
        return [
          {
            path: "/maintenance",
            label: "Assigned " + translations.nav.complaints,
            icon,
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

  return (
    
      {/* Header */}
      
        
          
             dispatch(toggleSidebar())}
              className="lg:hidden"
            >
              {isSidebarOpen ? (
                
              ) : (
                
              )}
            
            
              
                
              
              
                
                  CitizenConnect
                
                
                  {getRoleLabel()}
                
              
            
          

          
            {/* Language Toggle */}
            
              
                
                  {currentLanguage.toUpperCase()}
                
              
              
                 dispatch(setLanguage("en"))}>
                  English
                
                 dispatch(setLanguage("hi"))}>
                  हिन्दी
                
                 dispatch(setLanguage("ml"))}>
                  മലയാളം
                
              
            

            {/* Notifications */}
            
              
              {unreadNotifications > 0 && (
                
                  {unreadNotifications}
                
              )}
            

            {/* UserIcon Menu */}
            
              
                
                  
                
              
              
                
                  
                    
                    {translations.nav.profile}
                  
                
                
                  
                    
                    {translations.nav.settings}
                  
                
                 dispatch(logout())}>
                  
                  {translations.nav.logout}
                
              
            
          
        
      

      
        {/* Sidebar */}
        
          
            
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                   dispatch(setSidebarOpen(false))}
                  >
                    
                    {item.label}
                  
                );
              })}
            
          
        

        {/* Overlay for mobile */}
        {isSidebarOpen && (
           dispatch(setSidebarOpen(false))}
          />
        )}

        {/* Main Content */}
        
          
            
          
        
      
    
  );
};

export default Layout;
