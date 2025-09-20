import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAppDispatch } from "../store/hooks";
import { setCredentials } from "../store/slices/authSlice";
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

export interface OtpFlowConfig {
  context: "login" | "register" | "guestComplaint" | "complaintAuth";
  email: string;
  complaintId?: string;
  title?: string;
  description?: string;
  onSuccess?: (data: { token: string; user: any }) => void;
  onCancel?: () => void;
}

interface OtpContextValue {
  openOtpFlow: (config: OtpFlowConfig) => void;
  closeOtpFlow: () => void;
  isOpen: boolean;
  isReady: boolean;
}

const defaultContextValue: OtpContextValue = {
  openOtpFlow: () => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("OTP flow opened before provider was mounted.");
    }
  },
  closeOtpFlow: () => {},
  isOpen: false,
  isReady: false,
};

const OtpContext = createContext<OtpContextValue>(defaultContextValue);

export const useOtpFlow = () => useContext(OtpContext);

export const OtpProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [config, setConfig] = useState<OtpFlowConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    setIsReady(true);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // API hooks with error boundaries
  const [verifyLoginOtp] = useVerifyOTPLoginMutation();
  const [verifyRegisterOtp] = useVerifyRegistrationOTPMutation();
  const [resendLoginOtp] = useRequestOTPLoginMutation();
  const [resendRegisterOtp] = useResendRegistrationOTPMutation();
  const [verifyGuestOtp] = useVerifyGuestOtpMutation();
  const [resendGuestOtp] = useResendGuestOtpMutation();

  const openOtpFlow = useCallback(
    (flowConfig: OtpFlowConfig) => {
      setConfig(flowConfig);
      setIsOpen(true);
    },
    [],
  );

  const closeOtpFlow = useCallback(() => {
    try {
      setIsOpen(false);
      config?.onCancel?.();
      setConfig(null);
    } catch (error) {
      console.error("Failed to close OTP flow:", error);
      setIsOpen(false);
      setConfig(null);
    }
  }, [config]);

  const handleVerified = useCallback(
    async (data: { token: string; user: any; otpCode?: string }) => {
      if (!config || !data.otpCode) return;

      try {
        let result: any;

        switch (config.context) {
          case "login":
            result = await verifyLoginOtp({
              email: config.email,
              otpCode: data.otpCode,
            }).unwrap();
            break;

          case "register":
            result = await verifyRegisterOtp({
              email: config.email,
              otpCode: data.otpCode,
            }).unwrap();
            break;

          case "guestComplaint":
            if (!config.complaintId) {
              toast({
                title: "Error",
                description: "Complaint ID is required for guest verification",
                variant: "destructive",
              });
              return;
            }
            result = await verifyGuestOtp({
              email: config.email,
              otpCode: data.otpCode,
              complaintId: config.complaintId,
              createAccount: true,
            }).unwrap();
            break;

          case "complaintAuth":
            // Handle complaint auth verification
            // This might use a different API endpoint
            result = await verifyLoginOtp({
              email: config.email,
              otpCode: data.otpCode,
            }).unwrap();
            break;

          default:
            toast({
              title: "Error",
              description: "Invalid OTP context",
              variant: "destructive",
            });
            return;
        }

        if (result.data?.token && result.data?.user) {
          dispatch(
            setCredentials({
              token: result.data.token,
              user: result.data.user,
            }),
          );

          if (typeof window !== "undefined") {
            localStorage.setItem("token", result.data.token);
          }
        }

        // Call success callback
        if (config.onSuccess) {
          config.onSuccess(result.data);
        }

        // Show success message
        const contextMessages = {
          login: "Successfully logged in!",
          register: "Account created successfully!",
          guestComplaint: "Complaint verified and account created!",
          complaintAuth: "Access verified!",
        };

        toast({
          title: "Success",
          description: contextMessages[config.context],
        });

        // Close dialog
        if (isMountedRef.current) {
          setIsOpen(false);
          setConfig(null);
        }
      } catch (error: any) {
        // Error will be handled by the mutation and shown in the dialog
        console.error("OTP verification failed:", error);
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
    if (!config) return;

    try {
      switch (config.context) {
        case "login":
        case "complaintAuth":
          await resendLoginOtp({ email: config.email }).unwrap();
          break;

        case "register":
          await resendRegisterOtp({ email: config.email }).unwrap();
          break;

        case "guestComplaint":
          if (config.complaintId) {
            await resendGuestOtp({
              email: config.email,
              complaintId: config.complaintId,
            }).unwrap();
          }
          break;
      }

      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Resend",
        description: error.message || "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    }
  }, [config, resendLoginOtp, resendRegisterOtp, resendGuestOtp, toast]);

  const contextValue = useMemo<OtpContextValue>(
    () => ({
      openOtpFlow,
      closeOtpFlow,
      isOpen,
      isReady,
    }),
    [closeOtpFlow, isOpen, isReady, openOtpFlow],
  );

  return (
    <OtpContext.Provider value={contextValue}>
      {children}
      {config && (
        <OtpDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          context={config.context}
          email={config.email}
          complaintId={config.complaintId}
          title={config.title}
          description={config.description}
          onVerified={handleVerified}
          onResend={handleResend}
          // These will be managed by the mutations
          isVerifying={false}
          isResending={false}
          error={null}
        />
      )}
    </OtpContext.Provider>
  );
};

export default OtpProvider;
