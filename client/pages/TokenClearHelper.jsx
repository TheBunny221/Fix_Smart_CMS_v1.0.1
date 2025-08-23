import React, { useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

const TokenClearHelper: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const handleClearToken = () => {
    // Clear everything related to authentication
    localStorage.removeItem("token");
    localStorage.removeItem("auth_error");

    // Dispatch logout action
    dispatch(logout());

    // Show success message
    toast({
      title,
      description: "Your session has been cleared. Please log in again.",
    });

    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  };

  // Auto-clear if there's an auth error
  useEffect(() => {
    const authError = localStorage.getItem("auth_error");
    if (authError) {
      try {
        const error = JSON.parse(authError);
        if (error.code === "USER_NOT_FOUND" || error.code === "TOKEN_INVALID") {
          // Auto-clear the token
          handleClearToken();
        }
      } catch (e) {
        console.warn("Failed to parse auth error, e);
      }
    }
  }, []);

  return (
    
      
        
          
            
          
          Session Issue Detected
          
            Your session appears to be invalid. This usually happens after
            database updates or when tokens expire.
          
        
        
          
            Click the button below to clear your session and start fresh.
          

          
            
            Clear Session & Login Again
          

          
            You will be redirected to the login page after clearing your
            session.
          
        
      
    
  );
};

export default TokenClearHelper;
