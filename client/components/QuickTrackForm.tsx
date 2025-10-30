import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCredentials } from "../store/slices/authSlice";
import {
  useRequestComplaintOtpMutation,
  useVerifyComplaintOtpMutation,
} from "../store/api/guestApi";
import { useConfigManager } from "../hooks/useConfigManager";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, Lock, RefreshCw, Search } from "lucide-react";
import OtpVerificationModal from "./OtpVerificationModal";
import { generateComplaintIdPlaceholder, getComplaintIdConfig } from "../utils/complaintIdUtils";

interface Props {
  onClose?: () => void;
}

const QuickTrackForm: React.FC<Props> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { translations } = useAppSelector((state) => state.language);
  const { getConfig } = useConfigManager();
  const [complaintId, setComplaintId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [error, setError] = useState<string>("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Generate dynamic complaint ID placeholder
  const complaintIdPlaceholder = useMemo(() => {
    const complaintConfig = getComplaintIdConfig(config);
    const example = generateComplaintIdPlaceholder(complaintConfig);
    return translations?.index?.complaintIdPlaceholder?.replace('{{example}}', example) || 
           `Enter your complaint ID (e.g., ${example})`;
  }, [config, translations]);

  const [requestOtp, { isLoading: isRequestingOtp }] =
    useRequestComplaintOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp, error: verifyError }] =
    useVerifyComplaintOtpMutation();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await requestOtp({
        complaintId: complaintId.trim(),
      }).unwrap();
      if (res?.success) {
        setMaskedEmail(res.data.email);
        setShowOtpModal(true);
      }
    } catch (err: any) {
      setError(
        err?.data?.message ||
          translations?.index?.complaintNotFound ||
          "Complaint not found. Please check your complaint ID.",
      );
    }
  };

  const handleVerified = async ({
    complaintId,
    otpCode,
  }: {
    complaintId: string;
    otpCode: string;
  }) => {
    try {
      const res = await verifyOtp({ complaintId, otpCode }).unwrap();
      if (res?.success && res.data?.token && res.data?.user) {
        dispatch(
          setCredentials({ token: res.data.token, user: res.data.user }),
        );
        localStorage.setItem("token", res.data.token);
        const redirect =
          res.data.redirectTo ||
          `/complaints/${res.data.complaint?.id || complaintId}`;
        setShowOtpModal(false);
        onClose?.();
        navigate(redirect);
      }
    } catch (e) {
      // Otp modal shows error
    }
  };

  const handleResend = async () => {
    try {
      await requestOtp({ complaintId: complaintId.trim() }).unwrap();
    } catch {
      // ignore
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-blue-600" />
          {translations?.index?.trackYourComplaint || "Track Your Complaint"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <Label htmlFor="complaintId">
              {translations?.complaints?.complaintId || "Complaint ID"}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="complaintId"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value)}
                placeholder={complaintIdPlaceholder}
                className="pl-10"
                required
              />
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={isRequestingOtp}>
              {isRequestingOtp ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {translations?.index?.sending || "Sending..."}
                </>
              ) : (
                translations?.index?.verifyAndTrack || "Verify & Track"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {translations?.common?.cancel || "Cancel"}
            </Button>
          </div>
        </form>
      </CardContent>

      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleVerified}
        complaintId={complaintId}
        maskedEmail={maskedEmail}
        isVerifying={isVerifyingOtp}
        error={(verifyError as any)?.data?.message || null}
        onResendOtp={handleResend}
        isResending={isRequestingOtp}
      />
    </Card>
  );
};

export default QuickTrackForm;
