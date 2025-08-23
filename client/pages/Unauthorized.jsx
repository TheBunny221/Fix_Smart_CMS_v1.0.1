import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Shield, AlertTriangle, Home, LogIn } from "lucide-react";

const Unauthorized: React.FC = () => {
  const { appName } = useSystemConfig();

  return (
    
      
        
          
            
          
          Access Denied
        
        
          
            You don't have permission to access this page. Please contact your
            administrator if you believe this is an error.
          

          
            
              
                
                Go Home
              
            
            
              
                
                Login
              
            
          

          
            
              
              {appName} E-Governance
            
          
        
      
    
  );
};

export default Unauthorized;
