import React from "react";
import Navigation from "../Navigation";
import SimplifiedSidebarNav from "../ui/simplified-sidebar-nav";
import { useAppSelector } from "../../store/hooks";
import { cn } from "../../lib/utils";



export const UnifiedLayout: React.FC = ({
  children,
  className,
}) => {
  const { isSidebarCollapsed } = useAppSelector((state) => state.ui);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    
      {/* Top Navigation - Fixed */}
      

      
        {/* Sidebar Navigation - Only visible when authenticated */}
        {isAuthenticated && (
          
            
          
        )}

        {/* Main Content - Responsive margins */}
        
          {children}
        
      
    
  );
};

export default UnifiedLayout;
