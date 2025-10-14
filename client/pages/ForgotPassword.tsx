import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import OtpVerificationModal from "../components/OtpVerificationModal";
import { useToast } from "../hooks/use-toast";
import {
  Mail,
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import axios from "axios";

interface ForgotPasswordStep {
  step: "email" | "otp" | "password";
  email: string;
  isLoading: boolean;
  error: string | null;
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [state, setState] = useState<ForgotPasswordStep>({
    step: "email",
    email: "",
    isLoading: false,
    error: null,
  });

  const [otpModal, setOtpModal] = useState({
    isOpen: false,
    isVerifying: false,
    isResending: false,
    error: null as string | null,
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
  });

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!hasLowerCase) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!hasNumbers) {
      errors.push("Password must contain at least one number");
    }
    if (!hasSpecialChar) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.email.trim()) {
      setState(prev => ({ ...prev, error: "Email is required" }));
      return;
    }

    if (!isValidEmail(state.email)) {
      setState(prev => ({ ...prev, error: "Please enter a valid email address" }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await axios.post("/api/users/request-reset-otp", {
        email: state.email,
      });

      if (response.data.status === "success") {
        setState(prev => ({ ...prev, step: "otp", isLoading: false }));
        setOtpModal(prev => ({ ...prev, isOpen: true }));
        
        toast({
          title: "OTP Sent",
          description: "Please check your email for the verification code.",
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to send OTP. Please try again.";
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (data: { otpCode: string }) => {
    setOtpModal(prev => ({ ...prev, isVerifying: true, error: null }));

    try {
      const response = await axios.post("/api/users/verify-reset-otp", {
        email: state.email,
        otp: data.otpCode,
      });

      if (response.data.status === "success") {
        setOtpModal(prev => ({ ...prev, isOpen: false, isVerifying: false }));
        setState(prev => ({ ...prev, step: "password" }));
        
        toast({
          title: "OTP Verified",
          description: "Please set your new password.",
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Invalid or expired OTP";
      setOtpModal(prev => ({ ...prev, error: errorMessage, isVerifying: false }));
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setOtpModal(prev => ({ ...prev, isResending: true, error: null }));

    try {
      await axios.post("/api/users/request-reset-otp", {
        email: state.email,
      });

      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to resend OTP";
      setOtpModal(prev => ({ ...prev, error: errorMessage }));
      
      toast({
        title: "Resend Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setOtpModal(prev => ({ ...prev, isResending: false }));
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "Weak Password",
        description: passwordValidation.errors[0],
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await axios.post("/api/users/reset-password", {
        email: state.email,
        newPassword: passwordForm.newPassword,
      });

      if (response.data.status === "success") {
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset successfully. You can now log in with your new password.",
        });

        // Redirect to login after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to reset password. Please try again.";
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getMaskedEmail = (email: string) => {
    const [username, domain] = email.split("@");
    if (!username || !domain || username.length <= 2) return email;
    const maskedUsername = username[0] + "*".repeat(username.length - 2) + username[username.length - 1];
    return `${maskedUsername}@${domain}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Step 1: Email Input */}
          {state.step === "email" && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={state.email}
                    onChange={(e) => setState(prev => ({ ...prev, email: e.target.value, error: null }))}
                    className="pl-10"
                    disabled={state.isLoading}
                    required
                  />
                </div>
              </div>

              {state.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={state.isLoading}
              >
                {state.isLoading ? "Sending..." : "Send Reset Code"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Remember your password?{" "}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification (handled by modal) */}
          {state.step === "otp" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Check Your Email</h3>
                <p className="text-sm text-gray-600 mt-1">
                  We've sent a verification code to<br />
                  <span className="font-medium">{getMaskedEmail(state.email)}</span>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setOtpModal(prev => ({ ...prev, isOpen: true }))}
                className="w-full"
              >
                Enter Verification Code
              </Button>
            </div>
          )}

          {/* Step 3: New Password */}
          {state.step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Set New Password</h3>
                <p className="text-sm text-gray-600">
                  Create a strong password for your account
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={passwordForm.showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="pl-10 pr-10"
                    disabled={state.isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setPasswordForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  >
                    {passwordForm.showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={passwordForm.showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10 pr-10"
                    disabled={state.isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setPasswordForm(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                  >
                    {passwordForm.showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character</li>
                </ul>
              </div>

              {state.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={state.isLoading}
              >
                {state.isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={otpModal.isOpen}
        onClose={() => setOtpModal(prev => ({ ...prev, isOpen: false }))}
        onVerified={handleVerifyOTP}
        complaintId="" // Not used for password reset
        maskedEmail={getMaskedEmail(state.email)}
        isVerifying={otpModal.isVerifying}
        error={otpModal.error}
        onResendOtp={handleResendOTP}
        isResending={otpModal.isResending}
      />
    </div>
  );
};

export default ForgotPassword;