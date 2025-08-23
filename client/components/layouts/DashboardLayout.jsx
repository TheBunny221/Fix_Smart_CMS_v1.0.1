import React from "react";
import Navigation from "../Navigation";
import SimplifiedSidebarNav from "../ui/simplified-sidebar-nav";
import { cn } from "../../lib/utils";



export const DashboardLayout: React.FC = ({
  children,
  className,
}) => {
  return (
    
      {/* Top Navigation */}
      

      
        {/* Sidebar Navigation */}
        
          
        

        {/* Main Content */}
        
          {children}
        
      
    
  );
};

export default DashboardLayout;
