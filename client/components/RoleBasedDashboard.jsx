import React from "react";
import { useAppSelector } from "../store/hooks";
import AdminDashboard from "../pages/AdminDashboard";
import CitizenDashboard from "../pages/CitizenDashboard";
import WardOfficerDashboard from "../pages/WardOfficerDashboard";
import MaintenanceDashboard from "../pages/MaintenanceDashboard";
import Unauthorized from "../pages/Unauthorized";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertTriangle } from "lucide-react";

const RoleBasedDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  if (isAuthenticated || user) {
    return ;
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case "ADMINISTRATOR":
      return ;
    case "CITIZEN":
      return ;
    case "WARD_OFFICER":
      return ;
    case "MAINTENANCE_TEAM":
      return ;
    default:
      return ({translations?.messages?.unauthorizedAccess || "Unknown Role"}
              
            
            
              
                {translations?.auth?.role || "Role"});
  }
};

export default RoleBasedDashboard;
