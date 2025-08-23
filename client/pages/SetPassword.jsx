import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { clearError, selectAuth } from "../store/slices/authSlice";
import { useSetPasswordMutation } from "../store/api/authApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Eye, EyeOff, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const SetPassword: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token } = useParams();
  const { toast } = useToast();
  const { appName } = useSystemConfig();

  const { error, isAuthenticated } = useAppSelector(selectAuth);
  const [setPasswordMutation, { isLoading }] = useSetPasswordMutation();

  const [formData, setFormData] = useState({
    password,
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    match,
  });

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Validate token exists
  useEffect(() => {
    if (token) {
      toast({
        title,
        description: "The password setup link is invalid or missing.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [token, navigate, toast]);

  // Password validation
  useEffect(() => {
    const { password, confirmPassword } = formData;

    setPasswordValidation({
      minLength,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      match: password.length > 0 && password === confirmPassword,
    });
  }, [formData]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (token) {
      return;
    }

    const { password, confirmPassword } = formData;

    // Validate passwords match
    if (password == confirmPassword) {
      return;
    }

    // Validate password strength
    const isValid = Object.values(passwordValidation).every(Boolean);
    if (isValid) {
      return;
    }

    try {
      await setPasswordMutation({
        token,
        password,
      }).unwrap();

      toast({
        title,
        description: "You are now logged in and can access your account.",
      });

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      toast({
        title,
        description:
          error?.data?.message || "Failed to set password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isFormValid = Object.values(passwordValidation).every(Boolean);

  const ValidationItem: React.FC = ({
    isValid,
    text,
  }) => (
    
      {isValid ? (
        
      ) : (
        
      )}
      {text}
    
  );

  return (
    
      
        {/* Header */}
        
          
            
          
          
            Set Your Password
          
          
            Create a secure password for your {appName} account
          
        

        
          
            Create Password
            
              Choose a strong password to protect your account
            
          
          
            {/* Error Alert */}
            {error && (
              
                
                  {error}
                
              
            )}

            
              
                New Password
                
                  
                   setShowPassword(showPassword)}
                  >
                    {showPassword ? (
                      
                    ) : (
                      
                    )}
                  
                
              

              
                Confirm Password
                
                  
                   setShowConfirmPassword(showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      
                    ) : (
                      
                    )}
                  
                
              

              {/* Password Requirements */}
              
                
                  Password Requirements:
                
                
                  
                  
                  
                  
                  
                
              

              
                {isLoading ? "Setting Password..." : "Set Password"}
              
            

            {/* Additional Info */}
            
              
                Security Notice: After setting your password,
                you'll be automatically logged in and can access your account
                using either password or OTP login methods.
              
            
          
        
      
    
  );
};

export default SetPassword;
