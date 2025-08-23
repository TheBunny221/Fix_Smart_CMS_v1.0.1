import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  verifyRegistrationOTP,
  resendRegistrationOTP,
  selectAuth,
  selectRegistrationData,
  getDashboardRouteForRole,
} from "../store/slices/authSlice";
import { showToast } from "../store/slices/uiSlice";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Mail, Clock, CheckCircle2, ArrowLeft } from "lucide-react";



const OTPVerification: React.FC = ({ onBack }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } =
    useAppSelector(selectAuth);
  const registrationData = useAppSelector(selectRegistrationData);

  const [otpCode, setOtpCode] = useState("");
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev  clearInterval(interval);
    }
  }, [timer]);

  // Redirect on successful authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRouteForRole(user.role);

      dispatch(showToast({
          type,
          title: "Registration Successful",
          message: `Welcome ${user.fullName} Your account has been verified.`,
        }),
      );

      navigate(dashboardRoute);
    }
  }, [isAuthenticated, user, navigate, dispatch]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (registrationData?.email || otpCode.length == 6) {
      return;
    }

    try {
      await dispatch(verifyRegistrationOTP({
          email,
          otpCode,
        }),
      ).unwrap();
    } catch (error) {
      dispatch(showToast({
          type,
          title: "Verification Failed",
          message: error.message || "Invalid OTP. Please try again.",
        }),
      );
    }
  };

  const handleResendOTP = async () => {
    if (registrationData?.email) return;

    try {
      await dispatch(resendRegistrationOTP({
          email,
        }),
      ).unwrap();

      dispatch(showToast({
          type,
          title: "Email Sent Successfully",
          message: `A new verification code has been sent to ${registrationData.email}. Please check your email.`,
        }),
      );

      setTimer(300);
      setCanResend(false);
    } catch (error) {
      dispatch(showToast({
          type,
          title: "Failed to Resend",
          message: error.message || "Failed to resend OTP. Please try again.",
        }),
      );
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (registrationData) {
    return (
      
        
          No registration data found. Please register again.
        
      
    );
  }

  return (
    
      
        
          
            
          
          Verify Your Email
          
            We've sent a 6-digit verification code to
            
            {registrationData.email}
          
        
        
          
            
              Enter Verification Code
              
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                className="text-center tracking-widest text-lg"
                required
              />
            

            {error && (
              {error}
            )}

            
              {isLoading ? (
                
                  
                  Verifying...
                
              ) : (
                
                  
                  Verify Email
                
              )}
            
          

          
            {timer > 0 ? (
              
                
                Resend code in {formatTime(timer)}
              
            ) : (
              
                Resend Verification Code
              
            )}

            {onBack && (
              
                
                Back to Registration
              
            )}
          
        
      
    
  );
};

export default OTPVerification;
