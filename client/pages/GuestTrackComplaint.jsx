import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { trackGuestComplaint } from "../store/slices/guestSlice";
import {
  useRequestComplaintOtpMutation,
  useVerifyComplaintOtpMutation,
} from "../store/api/guestApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Search,
  FileText,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  Lock,
} from "lucide-react";
import QuickComplaintModal from "../components/QuickComplaintModal";
import OtpVerificationModal from "../components/OtpVerificationModal";
import ComplaintDetailsModal from "../components/ComplaintDetailsModal";

const GuestTrackComplaint: React.FC = () => {
  const dispatch = useAppDispatch();
  const [complaintId, setComplaintId] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showComplaintDetails, setShowComplaintDetails] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [verifiedComplaint, setVerifiedComplaint] = useState(null);
  const [verifiedUser, setVerifiedUser] = useState(null);

  // API Hooks
  const [requestOtp, { isLoading: isRequestingOtp }] =
    useRequestComplaintOtpMutation();
  const [verifyOtp, { isLoading, error: verifyError }] =
    useVerifyComplaintOtpMutation();

  const handleTrack = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Request OTP for the complaint
      const result = await requestOtp({
        complaintId),
      }).unwrap();

      if (result.success) {
        setMaskedEmail(result.data.email);
        setShowOtpModal(true);
      }
    } catch (err) {
      setError(
        err?.data?.message ||
          "Complaint not found. Please check your complaint ID.",
      );
      setTrackingResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerified = async (data) => {
    try {
      const result = await verifyOtp(data).unwrap();

      if (result.success) {
        setVerifiedComplaint(result.data.complaint);
        setVerifiedUser(result.data.user);
        setShowOtpModal(false);
        setShowComplaintDetails(true);
      }
    } catch (err) {
      // Error will be handled by the OTP modal
      console.error("OTP verification failed, err);
    }
  };

  const handleResendOtp = async () => {
    try {
      await requestOtp({
        complaintId),
      }).unwrap();
    } catch (err) {
      console.error("Failed to resend OTP, err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "REGISTERED":
        return "bg-yellow-100 text-yellow-800";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "REGISTERED":
        return ;
      case "ASSIGNED":
        return ;
      case "IN_PROGRESS":
        return ;
      case "RESOLVED":
      case "CLOSED":
        return ;
      default:
        return ;
    }
  };

  return (
    
      
        {/* Header */}
        
          
            
            
              
                Track Your Complaint
              
              
                Secure complaint tracking with email verification
              
            
          
        

        {/* Search Form */}
        
          
            
              
              Secure Complaint Tracking
            
          
          
            {/* Security Info */}
            
              
              
                For your security, we'll send a verification code to your
                registered email before showing complaint details.
              
            

            
              
                
                  Complaint ID
                  
                    
                     setComplaintId(e.target.value)}
                      placeholder="Enter your complaint ID (e.g., CMP123456)"
                      className="pl-10"
                      required
                    />
                  
                
                
                  
                    {isLoading || isRequestingOtp
                      ? "Verifying..."
                      : "Verify & Track"}
                  
                
              
              {error && (
                
                  
                  {error}
                
              )}
            
          
        

        {/* Tracking Results */}
        {trackingResult && (
          
            {/* Complaint Overview */}
            
              
                
                  Complaint Details
                  
                    {trackingResult.status.replace("_", " ")}
                  
                
              
              
                
                  
                    
                      
                        Complaint ID
                      
                      #{trackingResult.id}
                    
                    
                      Type
                      
                        {trackingResult.type?.replace("_", " ")}
                      
                    
                    
                      Description
                      
                        {trackingResult.description}
                      
                    
                  
                  
                    
                      
                        
                        Location
                      
                      {trackingResult.area}
                    
                    
                      
                        
                        Submitted On
                      
                      
                        {new Date(
                          trackingResult.submittedOn,
                        ).toLocaleDateString()}
                      
                    
                    
                      Priority
                      
                        {trackingResult.priority}
                      
                    
                  
                
              
            

            {/* Status Timeline */}
            
              
                Status Timeline
              
              
                
                  {/* Registered */}
                  
                    
                      
                    
                    
                      
                        
                          Complaint Registered
                        
                        
                          {new Date(
                            trackingResult.submittedOn,
                          ).toLocaleDateString()}
                        
                      
                      
                        Your complaint has been successfully registered in our
                        system.
                      
                    
                  

                  {/* Assigned */}
                  
                    
                      
                    
                    
                      
                        
                          Complaint Assigned
                        
                        {trackingResult.assignedOn && (
                          
                            {new Date(
                              trackingResult.assignedOn,
                            ).toLocaleDateString()}
                          
                        )}
                      
                      
                        Assigned to the appropriate team for resolution.
                      
                    
                  

                  {/* In Progress */}
                  
                    
                      
                    
                    
                      
                        
                          Work in Progress
                        
                      
                      
                        Our team is actively working on resolving your
                        complaint.
                      
                    
                  

                  {/* Resolved */}
                  
                    
                      
                    
                    
                      
                        
                          Complaint Resolved
                        
                        {trackingResult.resolvedOn && (
                          
                            {new Date(
                              trackingResult.resolvedOn,
                            ).toLocaleDateString()}
                          
                        )}
                      
                      
                        Your complaint has been successfully resolved.
                      
                    
                  
                
              
            

            {/* Expected Resolution Time */}
            
              
                Expected Resolution
              
              
                
                  
                    Expected Resolution Time
                    
                      Based on complaint type and priority
                    
                  
                  
                    2-5 days
                    Business days
                  
                
              
            
          
        )}

        {/* Help Section */}
        
          
            Need Help?
          
          
            
              
                Submit New Complaint
                
                  Have another issue? Submit a new complaint.
                
                 setIsQuickFormOpen(true)}
                >
                  New Complaint
                
              
              
                Contact Support
                
                  Need assistance? Contact our support team.
                
                Contact Support
              
            
          
        
      

      {/* Quick Complaint Modal */}
       setIsQuickFormOpen(false)}
        onSuccess={(complaintId) => {
          // Could automatically set the tracking ID to show the new complaint
          setComplaintId(complaintId);
        }}
      />

      {/* OTP Verification Modal */}
       setShowOtpModal(false)}
        onVerified={handleOtpVerified}
        complaintId={complaintId}
        maskedEmail={maskedEmail}
        isVerifying={isVerifyingOtp}
        error={verifyError?.data?.message || null}
        onResendOtp={handleResendOtp}
        isResending={isRequestingOtp}
      />

      {/* Complaint Details Modal */}
       setShowComplaintDetails(false)}
        complaint={verifiedComplaint}
        user={verifiedUser}
      />
    
  );
};

export default GuestTrackComplaint;
