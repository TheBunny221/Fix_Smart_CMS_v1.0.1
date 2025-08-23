import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import {
  selectAuth,
  resetRegistrationState,
  getDashboardRouteForRole,
} from "../store/slices/authSlice";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useToast } from "../hooks/use-toast";
import { useApiErrorHandler } from "../hooks/useApiErrorHandler";
import { useRegisterMutation } from "../store/api/authApi";
import { useOtpFlow } from "../contexts/OtpContext";
import { useGetWardsQuery } from "../store/api/guestApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Logo } from "../components/ui/logo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Shield, User, Mail, Lock, Phone, MapPin, Home } from "lucide-react";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { openOtpFlow } = useOtpFlow();
  const { handleApiError } = useApiErrorHandler();
  const { isAuthenticated, user } = useAppSelector(selectAuth);
  const { appName, appLogoUrl, appLogoSize } = useSystemConfig();

  // API hooks
  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const {
    data,
    isLoading,
    error,
  } = useGetWardsQuery();
  const wardsData = Array.isArray(wardsResponse?.data)
    ? wardsResponse.data
    : [];

  // Clear registration state on component mount
  useEffect(() => {
    dispatch(resetRegistrationState());
  }, [dispatch]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRouteForRole(user.role);
      navigate(dashboardRoute);
    }
  }, [isAuthenticated, user, navigate]);

  const [formData, setFormData] = useState({
    fullName,
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "CITIZEN",
    wardId: "",
  });

  // Transform wards data for the form
  const wards = wardsData.map((ward) => ({
    value,
    label: ward.name,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password == formData.confirmPassword) {
      toast({
        title,
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await registerUser({
        fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        role: formData.role,
        wardId: formData.wardId,
      }).unwrap();

      if (result.data?.requiresOtpVerification) {
        // OTP verification required - open unified dialog
        openOtpFlow({
          context,
          email: formData.email,
          title: "Complete Registration",
          description:
            "Enter the verification code sent to your email to activate your account",
          onSuccess: (data) => {
            toast({
              title,
              description: `Welcome ${data.user?.fullName} Your account has been verified.`,
            });
            // Navigation will be handled by auth state change
          },
        });

        toast({
          title,
          description: "Please check your email for the verification code.",
        });
      } else {
        // Direct registration without OTP
        toast({
          title,
          description: "Account created successfully Welcome aboard",
        });
        // Navigation will be handled by auth state change
      }
    } catch (error) {
      console.error("Registration error, JSON.stringify(error, null, 2));
      console.error("Registration error object, error);

      // Handle RTK Query error structure
      console.log("RTK Query error structure, error);

      // Check if this is an RTK Query error with data
      const errorData = error?.data?.data || error?.data;
      const errorStatus = error?.status;

      // Handle specific user already exists scenarios
      if (errorStatus === 400 && errorData?.existingUser) {
        const { isActive, action } = errorData;

        if (isActive && action === "login") {
          toast({
            title,
            description:
              "This email is already registered. Please log in instead.",
            variant: "destructive",
            action: (
              
                Go to Login
              
            ),
          });
        } else if (isActive && action === "verify_email") {
          toast({
            title,
            description:
              "This email is already registered but not verified. Please check your email for verification code.",
          });

          // Open OTP flow for the existing unverified user
          openOtpFlow({
            context,
            email: formData.email,
            title: "Complete Registration",
            description:
              "Enter the verification code sent to your email to activate your account. Click 'Resend Code' if you need a new verification email.",
            onSuccess: (data) => {
              toast({
                title,
                description: `Welcome ${data.user?.fullName} Your account has been verified.`,
              });
            },
          });
        }
      } else {
        // Handle other errors - extract message from server response
        const errorMessage =
          errorData?.message ||
          error?.data?.message ||
          getApiErrorMessage(error);
        console.log("Extracted error message, errorMessage);
        toast({
          title,
          description,
          variant: "destructive",
        });
      }
    }
  };

  return ({/* Header */}
        
          
            
            
              {appName}
              Create Your Account
            
          
        

        {/* Registration Form */}
        
          
            
              Register for E-Governance Portal
            
          
          
            
              
                Full Name
                
                  
                  
                      setFormData({ ...formData, fullName)
                    }
                    placeholder="Enter your full name"
                    className="pl-10"
                    required
                  />
                
              

              
                Email Address
                
                  
                  
                      setFormData({ ...formData, email)
                    }
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                
              

              
                Phone Number
                
                  
                  
                      setFormData({ ...formData, phoneNumber)
                    }
                    placeholder="Enter your phone number"
                    className="pl-10"
                    required
                  />
                
              

              
                Ward
                
                    setFormData({ ...formData, wardId)
                  }
                >
                  
                    
                  
                  
                    {wardsLoading ? (
                      
                        Loading wards...
                      
                    ) : wardsError ? (
                      
                        Error loading wards
                      
                    ) : (
                      wards.map((ward) => (
                        
                          {ward.label}
                        
                      ))
                    )}
                  
                
              

              
                Password
                
                  
                  
                      setFormData({ ...formData, password)
                    }
                    placeholder="Create a password"
                    className="pl-10"
                    required
                  />
                
              

              
                Confirm Password
                
                  
                  
                      setFormData({
                        ...formData,
                        confirmPassword,
                      })
                    }
                    placeholder="Confirm your password"
                    className="pl-10"
                    required
                  />
                
              

              
                {isRegistering ? "Creating Account..." : "Create Account"}
              
            

            
              
                Already have an account?{" "}
                
                  Sign in here
                
              
              
                Or{" "}
                
                  Submit
                
              
              
                
                  
                  Back to Home
                
              
            
          
        
      
    
  );
};

export default Register;
