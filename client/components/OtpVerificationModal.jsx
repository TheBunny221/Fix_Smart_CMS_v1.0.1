import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Shield,
  Clock,
  Mail,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";



const OtpVerificationModal: React.FC = ({
  isOpen,
  onClose,
  onVerified,
  complaintId,
  maskedEmail,
  isVerifying,
  error,
  onResendOtp,
  isResending = false,
}) => {
  const [otpCode, setOtpCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev  clearInterval(timer);
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtpCode("");
      setTimeLeft(600);
      setCanResend(false);
    }
  }, [isOpen]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (value) => {
    // Only allow digits and limit to 6 characters
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(sanitized);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      onVerified({ complaintId, otpCode });
    }
  };

  const handleResend = () => {
    if (onResendOtp && canResend) {
      setTimeLeft(600);
      setCanResend(false);
      onResendOtp();
    }
  };

  return (Verify Your Identity
          
          
            We've sent a verification code to your email address to ensure the
            security of your complaint details.
          
        

        
          {/* Email Info */}
          
            
            
              
                Code sent to)}
                placeholder="000000"
                className="text-center text-lg font-mono tracking-widest"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
              />
              
                Enter the 6-digit code from your email
              
            

            {/* Timer */}
            
              
                
                
                  Code expires in: {formatTime(timeLeft)}
                
              
              {timeLeft === 0 && (
                Code expired
              )}
            

            {/* Error Message */}
            {error && (
              
                
                {error}
              
            )}

            {/* Success Message */}
            {otpCode.length === 6 && error && (
              
                
                
                  Code entered successfully. Click verify to continue.
                
              
            )}

            {/* Action Buttons */}
            
              
                {isVerifying ? (
                  
                    
                    Verifying...
                  
                ) : (
                  "Verify Code"
                )}
              
              
                {isResending ? (
                  
                ) : (
                  "Resend"
                )}
              
            
          

          {/* Help Text */}
          
            
              Didn't receive the code?{" "}
              {canResend ? (
                
                  Click to resend
                
              ) : (
                `Wait ${formatTime(timeLeft)} to resend`
              )}
            
          

          {/* Security Note */}
          
            
              
              
                
                  Security Note
                
                
                  Never share this code with anyone. Our team will never ask for
                  your verification code.
                
              
            
          
        
      
    
  );
};

export default OtpVerificationModal;
