import React, { createContext, useContext, useState, useCallback } from "react";
import { useAppDispatch } from "../store/hooks";
import { setCredentials } from "../store/slices/auth";
import {
  useVerifyOTPLoginMutation,
  useVerifyRegistrationOTPMutation,
  useRequestOTPLoginMutation,
  useResendRegistrationOTPMutation,
} from "../store/api/authApi";
import {
  useVerifyGuestOtpMutation,
  useResendGuestOtpMutation,
} from "../store/api/guestApi";
import OtpDialog from "../components/OtpDialog";
import { useToast } from "../hooks/use-toast";

export ) => void;
  onCancel: () => void;
}



const OtpContext = createContext(null);

export const useOtpFlow = () => {
  const context = useContext(OtpContext);
  if (context) {
    throw new Error("useOtpFlow must be used within an OtpProvider");
  }
  return context;
};

export const OtpProvider: React.FC = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [config, setConfig] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // API hooks with error boundaries
  const [verifyLoginOtp] = useVerifyOTPLoginMutation();
  const [verifyRegisterOtp] = useVerifyRegistrationOTPMutation();
  const [resendLoginOtp] = useRequestOTPLoginMutation();
  const [resendRegisterOtp] = useResendRegistrationOTPMutation();
  const [verifyGuestOtp] = useVerifyGuestOtpMutation();
  const [resendGuestOtp] = useResendGuestOtpMutation();

  const openOtpFlow = useCallback(
    (flowConfig) => {
      try {
        setConfig(flowConfig);
        setIsOpen(true);
      } catch (error) {
        console.error("Failed to open OTP flow, error);
        toast({
          title,
          description: "Failed to open verification dialog",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const closeOtpFlow = useCallback(() => {
    try {
      setIsOpen(false);
      if (config?.onCancel) {
        config.onCancel();
      }
      setConfig(null);
    } catch (error) {
      console.error("Failed to close OTP flow, error);
      // Still try to close the dialog
      setIsOpen(false);
      setConfig(null);
    }
  }, [config]);

  const handleVerified = useCallback(async (data) => {
      if (config || data.otpCode) return;

      try {
        let result;

        switch (config.context) {
          case "login" = await verifyLoginOtp({
              email,
              otpCode: data.otpCode,
            }).unwrap();
            break;

          case "register" = await verifyRegisterOtp({
              email,
              otpCode: data.otpCode,
            }).unwrap();
            break;

          case "guestComplaint":
            if (config.complaintId) {
              toast({
                title,
                description: "Complaint ID is required for guest verification",
                variant: "destructive",
              });
              return;
            }
            result = await verifyGuestOtp({
              email,
              otpCode: data.otpCode,
              complaintId: config.complaintId,
              createAccount,
            }).unwrap();
            break;

          case "complaintAuth":
            // Handle complaint auth verification
            // This might use a different API endpoint
            result = await verifyLoginOtp({
              email,
              otpCode: data.otpCode,
            }).unwrap();
            break;

          default:
            toast({
              title,
              description: "Invalid OTP context",
              variant: "destructive",
            });
            return;
        }

        // Store credentials if we have a token
        if (result.data?.token && result.data?.user) {
          dispatch(setCredentials({
              token,
              user: result.data.user,
            }),
          );

          localStorage.setItem("token", result.data.token);
        }

        // Call success callback
        if (config.onSuccess) {
          config.onSuccess(result.data);
        }

        // Show success message
        const contextMessages = {
          login: "Successfully logged in",
          register: "Account created successfully",
          guestComplaint: "Complaint verified and account created",
          complaintAuth: "Access verified",
        };

        toast({
          title,
          description: contextMessages[config.context],
        });

        // Close dialog
        setIsOpen(false);
        setConfig(null);
      } catch (error) {
        // Error will be handled by the mutation and shown in the dialog
        console.error("OTP verification failed, error);
      }
    },
    [
      config,
      dispatch,
      verifyLoginOtp,
      verifyRegisterOtp,
      verifyGuestOtp,
      toast,
    ],
  );

  const handleResend = useCallback(async () => {
    if (config) return;

    try {
      switch (config.context) {
        case "login":
        case "complaintAuth":
          await resendLoginOtp({ email).unwrap();
          break;

        case "register":
          await resendRegisterOtp({ email).unwrap();
          break;

        case "guestComplaint":
          if (config.complaintId) {
            await resendGuestOtp({
              email,
              complaintId: config.complaintId,
            }).unwrap();
          }
          break;
      }

      toast({
        title,
        description: "A new verification code has been sent to your email.",
      });
    } catch (error) {
      toast({
        title,
        description: error.message || "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    }
  }, [config, resendLoginOtp, resendRegisterOtp, resendGuestOtp, toast]);

  const contextValue = {
    openOtpFlow,
    closeOtpFlow,
    isOpen,
  };

  return (
    
      {children}
      {config && (
        
      )}
    
  );
};

export default OtpProvider;
