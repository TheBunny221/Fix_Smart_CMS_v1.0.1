import React, { useState, useEffect } from "react";
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
import { Eye, EyeOff, CheckCircle, AlertCircle, Lock, Mail } from "lucide-react";
import { useAppDispatch } from "../store/hooks";
import { addNotification } from "../store/slices/uiSlice";
import { setCredentials } from "../store/slices/authSlice";
import {
  useSendPasswordSetupOTPMutation,
  useVerifyPasswordSetupOTPMutation,
  useSetPasswordAfterOTPMutation,
  useGetCurrentUserQuery,
} from "../store/api/authApi";

interface SetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

type ModalStep = "initial" | "otp-sent" | "otp-verified" | "success";

interface PasswordValidation {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  match: boolean;
}

const SetPasswordModal: React.FC<SetPasswordModalProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  const dispatch = useAppDispatch();
  const [currentStep, setCurrentStep] = useState<ModalStep>("initial");
  
  // API mutations
  const [sendOTP, { isLoading: isSendingOTP }] = useSendPasswordSetupOTPMutation();
  const [verifyOTP, { isLoading: isVerifyingOTP }] = useVerifyPasswordSetupOTPMutation();
  const [setPassword, { isLoading: isSettingPassword }] = useSetPasswordAfterOTPMutation();
  const { refetch: refetchCurrentUser } = useGetCurrentUserQuery(undefined);

  // Form state
  const [otpCode, setOtpCode] = useState("");
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirm: false,
  });
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    match: false,
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep("initial");
      setOtpCode("");
      setPasswordData({ password: "", confirmPassword: "" });
      setShowPasswords({ password: false, confirm: false });
    }
  }, [isOpen]);

  // Password validation
  useEffect(() => {
    const { password, confirmPassword } = passwordData;

    setPasswordValidation({
      minLength: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      match: password.length > 0 && password === confirmPassword,
    });
  }, [passwordData]);

  const handleSendOTP = async () => {
    try {
      await sendOTP({}).unwrap();
      setCurrentStep("otp-sent");
      dispatch(
        addNotification({
          type: "success",
          title: "OTP Sent",
          message: "Password setup OTP has been sent to your email address",
        })
      );
    } catch (error: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "Error",
          message: error?.data?.message || "Failed to send OTP",
        })
      );
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      dispatch(
        addNotification({
          type: "error",
          title: "Invalid OTP",
          message: "Please enter a valid 6-digit OTP",
        })
      );
      return;
    }

    try {
      await verifyOTP({ otpCode }).unwrap();
      setCurrentStep("otp-verified");
      dispatch(
        addNotification({
          type: "success",
          title: "OTP Verified",
          message: "OTP verified successfully. Now set your password.",
        })
      );
    } catch (error: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "Verification Failed",
          message: error?.data?.message || "Invalid or expired OTP",
        })
      );
    }
  };

  const handleSetPassword = async () => {
    const { password, confirmPassword } = passwordData;

    // Validate passwords match
    if (password !== confirmPassword) {
      dispatch(
        addNotification({
          type: "error",
          title: "Password Mismatch",
          message: "Passwords do not match",
        })
      );
      return;
    }

    // Validate password strength
    const isValid = Object.values(passwordValidation).every(Boolean);
    if (!isValid) {
      dispatch(
        addNotification({
          type: "error",
          title: "Invalid Password",
          message: "Please ensure your password meets all requirements",
        })
      );
      return;
    }

    try {
      await setPassword({ password, confirmPassword }).unwrap();
      setCurrentStep("success");
      
      // Refresh user data to update hasPassword flag
      try {
        const me = await refetchCurrentUser().unwrap();
        if (me?.data?.user) {
          const token = localStorage.getItem("token") || "";
          dispatch(
            setCredentials({
              token,
              user: me.data.user,
            })
          );
        }
      } catch (e) {
        console.warn("Failed to refresh user after password setup:", e);
      }

      dispatch(
        addNotification({
          type: "success",
          title: "Password Set Successfully",
          message: "Your password has been set successfully",
        })
      );

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "Error",
          message: error?.data?.message || "Failed to set password",
        })
      );
    }
  };

  const ValidationItem: React.FC<{ isValid: boolean; text: string }> = ({
    isValid,
    text,
  }) => (
    <div
      className={`flex items-center gap-2 text-sm ${
        isValid ? "text-green-600" : "text-gray-500"
      }`}
    >
      {isValid ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {text}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case "initial":
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-gray-600">
                We'll send you an OTP to verify your identity before setting up your password.
              </p>
            </div>
            <Alert className="border-blue-200 bg-blue-50">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-blue-700">
                OTP will be sent to: <strong>{userEmail}</strong>
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleSendOTP}
              disabled={isSendingOTP}
              className="w-full"
            >
              {isSendingOTP ? "Sending OTP..." : "Send OTP"}
            </Button>
          </div>
        );

      case "otp-sent":
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-gray-600">
                We've sent a 6-digit OTP to your email. Please enter it below.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otpCode">Enter OTP</Label>
              <Input
                id="otpCode"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleSendOTP}
                disabled={isSendingOTP}
                className="flex-1"
              >
                {isSendingOTP ? "Resending..." : "Resend OTP"}
              </Button>
              <Button
                onClick={handleVerifyOTP}
                disabled={isVerifyingOTP || otpCode.length !== 6}
                className="flex-1"
              >
                {isVerifyingOTP ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          </div>
        );

      case "otp-verified":
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-gray-600">
                OTP verified! Now create a secure password for your account.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPasswords.password ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={passwordData.password}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, password: e.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, password: !prev.password }))
                    }
                  >
                    {showPasswords.password ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                    }
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  Password Requirements:
                </p>
                <div className="space-y-1">
                  <ValidationItem
                    isValid={passwordValidation.minLength}
                    text="At least 6 characters long"
                  />
                  <ValidationItem
                    isValid={passwordValidation.hasUpper}
                    text="Contains uppercase letter"
                  />
                  <ValidationItem
                    isValid={passwordValidation.hasLower}
                    text="Contains lowercase letter"
                  />
                  <ValidationItem
                    isValid={passwordValidation.hasNumber}
                    text="Contains number"
                  />
                  <ValidationItem
                    isValid={passwordValidation.match}
                    text="Passwords match"
                  />
                </div>
              </div>

              <Button
                onClick={handleSetPassword}
                disabled={
                  isSettingPassword ||
                  !Object.values(passwordValidation).every(Boolean)
                }
                className="w-full"
              >
                {isSettingPassword ? "Setting Password..." : "Set Password"}
              </Button>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-green-800">
                Password Set Successfully!
              </h3>
              <p className="text-gray-600">
                Your password has been set up successfully. You can now use either password or OTP to log in.
              </p>
            </div>
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                This dialog will close automatically in a few seconds.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Up Your Password</DialogTitle>
          <DialogDescription>
            Create a secure password for your account using OTP verification.
          </DialogDescription>
        </DialogHeader>
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export default SetPasswordModal;