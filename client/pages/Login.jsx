import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  loginWithPassword,
  sendPasswordSetupEmail,
  clearError,
  selectAuth,
  selectRequiresPasswordSetup,
  getDashboardRouteForRole,
} from "../store/slices/authSlice";
import { useRequestOTPLoginMutation } from "../store/api/authApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Logo } from "../components/ui/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Eye, EyeOff, Mail, Lock, Home } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useOtpFlow } from "../contexts/OtpContext";
import AdminSeeder from "../components/AdminSeeder";

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openOtpFlow } = useOtpFlow();
  const { appName, appLogoUrl, appLogoSize } = useSystemConfig();

  // Set document title
  useDocumentTitle("Login");

  const { isLoading, error, isAuthenticated, user } =
    useAppSelector(selectAuth);
  const requiresPasswordSetup = useAppSelector(selectRequiresPasswordSetup);

  // API hooks
  const [requestOTPLogin, { isLoading: isRequestingOtp }] =
    useRequestOTPLoginMutation();

  // Form states
  const [loginMethod, setLoginMethod] = useState(
    "password",
  );
  const [formData, setFormData] = useState({
    email,
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRouteForRole(user.role);
      navigate(dashboardRoute);
    }
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name],
    }));

    // Clear error when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();

    if (formData.email || formData.password) {
      return;
    }

    try {
      await dispatch(loginWithPassword({
          email,
          password: formData.password,
        }),
      ).unwrap();

      toast({
        title,
        description: "Welcome back",
      });
    } catch (error) {
      // Error is handled by the reducer
    }
  };

  const handleOTPRequest = async (e) => {
    e.preventDefault();

    if (formData.email) {
      return;
    }

    try {
      // Request OTP first
      console.log("Requesting OTP for email, formData.email);
      const response = await requestOTPLogin({
        email,
      }).unwrap();
      console.log("OTP response, response);

      // Open the unified OTP dialog
      openOtpFlow({
        context,
        email: formData.email,
        onSuccess: (data) => {
          toast({
            title,
            description: "Welcome back",
          });
          // Navigation will be handled by the auth state change
        },
      });

      toast({
        title,
        description: `A verification code has been sent to ${formData.email}`,
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handlePasswordSetupRequest = async () => {
    try {
      await dispatch(sendPasswordSetupEmail({
          email,
        }),
      ).unwrap();

      toast({
        title,
        description: `Password setup instructions have been sent to ${formData.email}. Please check your email and follow the instructions.`,
      });
    } catch (error) {
      // Error is handled by the reducer
    }
  };

  // Demo credentials for testing
  const demoCredentials = [
    {
      email: "admin@cochinsmartcity.gov.in",
      password: "admin123",
      role: "Administrator",
    },
    {
      email: "ward.officer@cochinsmartcity.gov.in",
      password: "ward123",
      role: "Ward Officer",
    },
    {
      email: "maintenance@cochinsmartcity.gov.in",
      password: "maintenance123",
      role: "Maintenance Team",
    },
    {
      email: "citizen@example.com",
      password: "citizen123",
      role: "Citizen",
    },
  ];

  return (
    
      
        {/* Header */}
        
          
            
          
          {appName}
          E-Governance Portal
        

        
          
            Welcome Back
            
              Choose your preferred login method
            
          
          
            {/* Error Alert */}
            {error && (
              
                
                  {error}
                
              
            )}

            {/* Password Setup Required */}
            {requiresPasswordSetup && (Your password is not set. You can)}
                        className="text-amber-700 border-amber-300"
                      >
                        Login with OTP
                      
                      
                        Set Password
                      
                    
                  
                
              
            )}

            
                setLoginMethod(value as "password" | "otp")
              }
            >
              
                
                  
                  Password
                
                
                  
                  OTP
                
              

              {/* Password Login Tab */}
              
                
                  
                    Email Address
                    
                  

                  
                    Password
                    
                      
                       setShowPassword(showPassword)}
                      >
                        {showPassword ? (
                          
                        ) : (
                          
                        )}
                      
                    
                  

                  
                    {isLoading ? "Signing In..." : "Sign In"}
                  
                
              

              {/* OTP Login Tab */}
              
                
                  
                    Email Address
                    
                  

                  
                    {isRequestingOtp ? "Sending OTP..." : "Send OTP"}
                  

                  
                    We'll send a 6-digit code to your email address
                  
                
              
            

            {/* Links */}
            
              
                Don't have an account?{" "}
                
                  Register here
                
              
              
                Guest user?{" "}
                
                  Submit complaint
                
              
              
                
                  
                  Back to Home
                
              
            
          
        

        {/* Admin Seeder */}
        {process.env.NODE_ENV === "development" && }

        {/* Demo Credentials */}
        {process.env.NODE_ENV === "development" && (
          
            
              Demo Credentials
              For testing purposes only
            
            
              
                {demoCredentials.map((cred, index) => (
                  
                    
                      {cred.email}
                      
                        {cred.password}
                      
                    
                    {cred.role}
                  
                ))}
              
            
          
        )}
      
    
  );
};

export default Login;
