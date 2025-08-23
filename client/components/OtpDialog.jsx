import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Mail, Clock, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";

export ) => void;
  onResend: () => void;
  isVerifying?;
  isResending?;
  error?;
  expiresAt?;
  title?;
  description?;
}

const OtpDialog: React.FC = ({
  open,
  onOpenChange,
  context,
  email,
  complaintId,
  onVerified,
  onResend,
  isVerifying = false,
  isResending = false,
  error,
  expiresAt,
  title,
  description,
}) => {
  const [otpCode, setOtpCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [localError, setLocalError] = useState(null);
  const inputRefs = useRef([]);

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Handle timer countdown
  useEffect(() => {
    if (expiresAt) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(remaining);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setOtpCode("");
      setLocalError(null);
      // Focus first input when dialog opens
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [open]);

  // Clear local error when typing
  useEffect(() => {
    if (otpCode && localError) {
      setLocalError(null);
    }
  }, [otpCode, localError]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (/^\d*$/.test(value)) return;

    const newOtp = otpCode.split("");
    newOtp[index] = value;
    const newOtpString = newOtp.join("");

    setOtpCode(newOtpString);

    // Move to next input if value is entered
    if (value && index  {
    if (e.key === "Backspace" && otpCode[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index  {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);

    if (digits.length > 0) {
      setOtpCode(digits.padEnd(6, ""));
      // Focus the next empty input or the last one
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otpCode.length == 6) {
      setLocalError("Please enter the complete 6-digit code");
      return;
    }

    // Call parent's verify function with the OTP code
    // The parent will handle the actual verification based on context
    try {
      await onVerified({ token, user, otpCode });
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleResendOtp = () => {
    if (onResend) {
      setLocalError(null);
      onResend();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getContextConfig = () => {
    switch (context) {
      case "login" {
          title: title || "Verify Your Identity",
          description:
            description || "Enter the 6-digit code sent to your email to login",
          submitText: "Verify & Login",
          icon: "🔐",
        };
      case "register" {
          title: title || "Complete Registration",
          description:
            description ||
            "Enter the 6-digit code sent to your email to activate your account",
          submitText: "Verify & Complete Registration",
          icon: "✨",
        };
      case "guestComplaint" {
          title: title || "Verify Your Complaint",
          description:
            description ||
            "Enter the 6-digit code sent to your email to complete your complaint submission",
          submitText: "Verify & Activate Complaint",
          icon: "📝",
        };
      case "complaintAuth" {
          title: title || "Verify Your Access",
          description:
            description ||
            "Enter the 6-digit code sent to your email to access this complaint",
          submitText: "Verify & Continue",
          icon: "🔍",
        };
      default {
          title: "Verify OTP",
          description: "Enter the 6-digit code sent to your email",
          submitText: "Verify",
          icon: "✉️",
        };
    }
  };

  const config = getContextConfig();
  const displayError = error || localError;

  return (
    
      
        
          
            
          
          {config.title}
          
            {config.description}
            
            {email}
          
        

        
          {displayError && (
            
              
                {displayError}
              
            
          )}

          
            Enter 6-digit code
            
              {Array.from({ length).map((_, index) => (
                 (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otpCode[index] || ""}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={cn("w-12 h-12 text-center text-lg font-mono border-2",
                    "focus,
                    otpCode[index] && "border-primary bg-primary/5",
                  )}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            
          

          
            {isVerifying ? (
              
                
                Verifying...
              
            ) : (
              config.submitText
            )}
          

          
            {timeLeft > 0 ? (
              
                
                Expires in {formatTime(timeLeft)}
              
            ) : (
              
                {isResending ? (
                  
                    
                    Sending...
                  
                ) : (
                  "Resend OTP"
                )}
              
            )}

             onOpenChange(false)}
              className="p-0 h-auto font-normal"
            >
              
              Back
            
          

          {complaintId && (Complaint ID)}
        
      
    
  );
};

export default OtpDialog;
