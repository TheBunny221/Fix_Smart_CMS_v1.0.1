import React, { useState, useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import { useCreateComplaintMutation } from "../store/api/complaintsApi";

// Define types locally instead of importing from deprecated slice
type ComplaintType =
  | "WATER_SUPPLY"
  | "ELECTRICITY"
  | "ROAD_REPAIR"
  | "GARBAGE_COLLECTION"
  | "STREET_LIGHTING"
  | "SEWERAGE"
  | "PUBLIC_HEALTH"
  | "TRAFFIC"
  | "OTHERS";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// Local type definition for file attachments

import {
  submitGuestComplaint,
  clearGuestData,
} from "../store/slices/guest";
import {
  useGetWardsQuery,
  useVerifyGuestOtpMutation,
  useGenerateCaptchaQuery,
  useLazyGenerateCaptchaQuery,
} from "../store/api/guestApi";
import { setCredentials } from "../store/slices/auth";
// import { showSuccessToast, showErrorToast } from "../store/slices/ui";
import { useToast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import SimpleLocationMapDialog from "./SimpleLocationMapDialog";
import {
  MapPin,
  Upload,
  RefreshCw,
  FileText,
  Zap,
  Wrench,
  Droplets,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { createComplaint } from "../store/slices/complaints";



 | null;
}

const QuickComplaintForm: React.FC = ({
  onSuccess,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.complaints);
  const { translations } = useAppSelector((state) => state.language);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { complaintTypeOptions } = useComplaintTypes();
  const {
    data,
    isLoading,
    error,
  } = useGetWardsQuery();
  const wards = Array.isArray(wardsResponse?.data) ? wardsResponse.data : [];

  // Form state
  const [formData, setFormData] = useState({
    mobile,
    email: "",
    problemType: "",
    ward: "",
    subZoneId: "",
    area: "",
    location: "",
    address: "",
    description: "",
    coordinates,
  });
  const [files, setFiles] = useState([]);
  const [captcha, setCaptcha] = useState("");
  const [captchaId, setCaptchaId] = useState(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [submissionMode, setSubmissionMode] = useState(isAuthenticated ? "citizen" ,
  );
  const [otpCode, setOtpCode] = useState("");
  const [complaintId, setComplaintId] = useState(null);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const { toast } = useToast();
  const [verifyGuestOtp] = useVerifyGuestOtpMutation();
  const [
    generateCaptcha,
    { data, isLoading, error: captchaError },
  ] = useLazyGenerateCaptchaQuery();

  // Pre-fill user data if authenticated and set submission mode
  useEffect(() => {
    if (isAuthenticated && user) {
      setSubmissionMode("citizen");
      setFormData((prev) => ({
        ...prev,
        mobile,
        email: user.email || "",
        ward: user.wardId || "",
        subZoneId: "",
      }));
    } else {
      setSubmissionMode("guest");
    }
  }, [isAuthenticated, user]);

  // Generate CAPTCHA on component mount
  useEffect(() => {
    handleRefreshCaptcha();
  }, []);

  // Update CAPTCHA ID when new CAPTCHA is generated
  useEffect(() => {
    if (captchaData?.success && captchaData.data) {
      setCaptchaId(captchaData.data.captchaId);
    }
  }, [captchaData]);

  // Handle CAPTCHA refresh
  const handleRefreshCaptcha = useCallback(() => {
    setCaptcha("");
    setCaptchaId(null);
    generateCaptcha();
  }, [generateCaptcha]);

  // Icon mapping for different complaint types
  const getIconForComplaintType = (type) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      WATER_SUPPLY: ,
      ELECTRICITY: ,
      ROAD_REPAIR: ,
      WASTE_MANAGEMENT: ,
      GARBAGE_COLLECTION: ,
      STREET_LIGHTING: ,
      DRAINAGE: ,
      SEWERAGE: ,
      PUBLIC_TOILET: ,
      TREE_CUTTING: ,
      PUBLIC_HEALTH: ,
      TRAFFIC: ,
      OTHERS: ,
    };
    return iconMap[type] || ;
  };

  const problemTypes = complaintTypeOptions.map((type) => ({
    key,
    label: type.label,
    icon: getIconForComplaintType(type.value),
  }));

  // Derive sub-zones for the selected ward (from public wards response which includes subZones)
  const selectedWard = wards.find((w) => w.id === formData.ward);
  const subZonesForWard = selectedWard?.subZones || [];

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]));
  }, []);

  const handleFileUpload = useCallback((event) => {
      const selectedFiles = Array.from(event.target.files || []);
      setFiles((prev) => [...prev, ...selectedFiles]);
    },
    [],
  );

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i == index));
  }, []);

  const handleLocationSelect = useCallback((location) => {
      setFormData((prev) => ({
        ...prev,
        location,
        area: location.area || prev.area,
        address: location.address || prev.address,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      }));
    },
    [],
  );

  const handleSubmit = useCallback(async (event) => {
      event.preventDefault();
     
      if (isLoading) return; // 👈 
      if (captcha || captchaId) {
        toast({
          title,
          description: translations?.forms?.enterCaptcha || "Please enter the CAPTCHA code",
          variant: "destructive",
        });
        return;
      }

      if (
        formData.mobile ||
        formData.problemType ||
        formData.ward ||
        formData.area ||
        formData.description
      ) {
        toast({
          title,
          description: translations?.forms?.requiredField || "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      try {
        if (submissionMode === "citizen" && isAuthenticated) {
          // Citizen flow: Submit directly to authenticated API
          const complaintData = {
            title: `${formData.problemType} complaint`,
            description: formData.description,
            type: formData.problemType,
            priority: "MEDIUM",
            wardId: formData.ward,
            subZoneId: formData.subZoneId || undefined,
            area: formData.area,
            landmark: formData.location,
            address: formData.address,
            coordinates: formData.coordinates,
            contactName: user?.fullName || "",
            contactEmail: formData.email,
            contactPhone: formData.mobile,
            isAnonymous,
            captchaId,
            captchaText,
          };

          const result = await dispatch(
            createComplaint(complaintData),
          ).unwrap();

          toast({
            title,
            description: `Your complaint has been registered with ID: ${result.complaintID}. You can track its progress from your dashboard.`,
          });

          // Reset form and call success callback
          resetForm();
          onSuccess?.(result.id);
        } else {
          // Guest flow: Submit complaint and send OTP
          const guestFormData = {
            fullName: "Guest User",
            email: formData.email,
            phoneNumber: formData.mobile,
            type: formData.problemType,
            priority: "MEDIUM",
            wardId: formData.ward,
            subZoneId: formData.subZoneId || undefined,
            area: formData.area,
            landmark: formData.location,
            address: formData.address,
            description: formData.description,
            coordinates: formData.coordinates,
            captchaId,
            captchaText,
          };

          // Convert files to FileAttachment format
          const fileAttachments = files.map(
            (file, index) => ({
              id)}`,
              file,
            }),
          );

          const result = await dispatch(
            submitGuestComplaint({
              complaintData,
              files,
            }),
          ).unwrap();

          if (result.complaintId && result.trackingNumber) {
            setComplaintId(result.complaintId);
            setShowOtpInput(true);
            toast({
              title,
              description: `A verification code has been sent to ${formData.email}. Please check your email and enter the code below.`,
            });
          }
        }
      } catch (error) {
        console.error("Complaint submission error, error);
        toast({
          title,
          description:
            error.message || "Failed to submit complaint. Please try again.",
          variant: "destructive",
        });
      }
    },
    [
      isLoading,
      captcha,
      captchaId,
      formData,
      submissionMode,
      isAuthenticated,
      user,
      files,
      dispatch,
      translations,
      toast,
      onSuccess,
    ],
  );

  // Handle OTP verification and final submission
  const handleVerifyOtp = useCallback(async () => {
    if (otpCode || otpCode.length == 6) {
      toast({
        title,
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    if (complaintId) {
      toast({
        title,
        description: "Complaint ID not found. Please try submitting again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use RTK Query mutation for OTP verification
      const result = await verifyGuestOtp({
        email,
        otpCode,
        complaintId,
        createAccount,
      }).unwrap();

      // Store auth token and user data if provided
      if (result.data?.token && result.data?.user) {
        dispatch(setCredentials({
            token,
            user: result.data.user,
          }),
        );
        localStorage.setItem("token", result.data.token);
      }

      toast({
        title,
        description: result.data?.isNewUser
          ? "Your complaint has been verified and your citizen account has been created successfully"
          : "Your complaint has been verified and you've been logged in successfully",
      });

      // Reset form and call success callback
      resetForm();
      setShowOtpInput(false);
      setComplaintId(null);
      setOtpCode("");
      onSuccess?.(complaintId);
    } catch (error) {
      console.error("OTP verification error, error);
      toast({
        title,
        description:
          error?.data?.message ||
          error?.message ||
          "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    }
  }, [
    otpCode,
    complaintId,
    formData.email,
    verifyGuestOtp,
    dispatch,
    toast,
    onSuccess,
  ]);

  const resetForm = useCallback(() => {
    setFormData({
      mobile,
      email: isAuthenticated && user ? user.email || "" : "",
      problemType: "",
      ward: isAuthenticated && user ? user.wardId || "" : "",
      subZoneId: "",
      area: "",
      location: "",
      address: "",
      description: "",
      coordinates,
    });
    setFiles([]);
    setCaptcha("");
    setCaptchaId(null);
    setOtpCode("");
    setComplaintId(null);
    setShowOtpInput(false);
    handleRefreshCaptcha();
  }, [isAuthenticated, user, handleRefreshCaptcha]);

  return (
    
      
        
          
            
              
                
              
              
                {translations?.complaints?.registerComplaint ||
                  "Register Complaint"}
              
              {isAuthenticated && (
                
                  {(translations)?.auth?.guestMode || "Guest Mode"}
                
              )}
            
            {onClose && (
              
                
              
            )}
          
        
        
          
            {/* Contact Information */}
            
              
                {translations?.forms?.contactInformation ||
                  "Contact Information"}
              
              
                
                  
                    {translations?.complaints?.mobile || "Mobile Number"} *
                  
                  
                      handleInputChange("mobile", e.target.value)
                    }
                    placeholder={`${translations?.common?.required || "Enter your"} ${translations?.complaints?.mobile || "mobile number"}`}
                    required
                    disabled={isAuthenticated && user?.phoneNumber}
                  />
                
                
                  
                    {translations?.auth?.email || "Email Address"}
                  
                   handleInputChange("email", e.target.value)}
                    placeholder={`${translations?.common?.optional || "Enter your"} ${translations?.auth?.email || "email address"}`}
                    disabled={isAuthenticated && user?.email}
                  />
                
              
            

            

            {/* Problem Details */}
            
              
                {translations?.forms?.problemDetails || "Problem Details"}
              
              
                
                  
                    {translations?.complaints?.complaintType ||
                      "Complaint Type"}{" "}
                    *
                  
                  
                      handleInputChange("problemType", value)
                    }
                  >
                    
                      
                    
                    
                      {problemTypes.map((type) => (
                        
                          
                            {type.icon}
                            {type.label}
                          
                        
                      ))}
                    
                  
                
                
                  
                    {translations?.complaints?.ward || "Ward"} *
                  
                   handleInputChange("ward", value)}
                  >
                    
                      
                    
                    
                      {wardsLoading ? (
                        
                          Loading wards...
                        
                      ) : wardsError ? (
                        
                          Error loading wards
                        
                      ) : (
                        wards.map((ward) => (
                          
                            {ward.name}
                          
                        ))
                      )}
                    
                  
                
              
            

            

            {/* Location Details */}
            
              
                {translations?.forms?.locationDetails || "Location Details"}
              
              
                
                  
                    {translations?.complaints?.area || "Area"} *
                  
                   handleInputChange("area", e.target.value)}
                    placeholder={
                      translations?.forms?.minCharacters ||
                      "Enter area (minimum 3 characters)"
                    }
                    required
                  />
                

                {/* Sub-Zone Selection - shows when ward selected and sub-zones available */}
                {formData.ward && subZonesForWard.length > 0 && (
                  
                    
                      {(translations)?.complaints?.subZone || "Sub-Zone"}
                    
                    
                        handleInputChange("subZoneId", value)
                      }
                    >
                      
                        
                      
                      
                        {subZonesForWard.map((sz) => (
                          
                            {sz.name}
                          
                        ))}
                      
                    
                  
                )}

                
                  
                    {translations?.complaints?.location || "Location/Landmark"}
                  
                  
                    
                        handleInputChange("location", e.target.value)
                      }
                      placeholder={`${translations?.complaints?.landmark || "Specific location or landmark"}`}
                      className="flex-1"
                    />
                     setIsMapDialogOpen(true)}
                      title="Select location on map"
                    >
                      
                    
                  
                

                
                  
                    {(translations)?.complaints?.address || "Full Address"}
                  
                  
                      handleInputChange("address", e.target.value)
                    }
                    placeholder={`${(translations)?.complaints?.address || "Complete address details"}...`}
                    rows={3}
                  />
                
              
            

            

            {/* Complaint Description */}
            
              
                {translations?.forms?.complaintDescription ||
                  "Complaint Description"}
              
              
                
                  {(translations)?.complaints?.description || (translations)?.forms?.description || "Description"} *
                
                
                    handleInputChange("description", e.target.value)
                  }
                  placeholder={`${translations?.forms?.complaintDescription || "Describe your complaint in detail"}...`}
                  rows={4}
                  required
                />
              
            

            

            {/* File Uploads */}
            
              
                {translations?.forms?.optionalUploads || "Optional Uploads"}
              
              
                
                  
                  
                    {translations?.common?.upload || "Upload"}{" "}
                    {translations?.complaints?.files ||
                      "images, videos, or PDF files"}
                  
                  
                  
                    
                      
                        {translations?.common?.upload || "Upload"}{" "}
                        {translations?.complaints?.files || "Files"}
                      
                    
                  
                
              

              {files.length > 0 && ({translations?.complaints?.files || "Uploaded Files"}, index) => (
                      
                        {file.name}
                         removeFile(index)}
                        >
                          ×
                        
                      
                    ))}
                  
                
              )}
            

            

            {/* CAPTCHA */}
            
              
                {translations?.forms?.captchaVerification ||
                  "CAPTCHA Verification"}{" "}
                *
              
              
                
                  {captchaLoading ? (
                    
                      Loading CAPTCHA...
                    
                  ) : captchaError ? (
                    
                      Error loading CAPTCHA
                    
                  ) : captchaData?.success && captchaData.data ? (
                    
                  ) : (
                    
                      Click refresh to load CAPTCHA
                    
                  )}
                
                
                  
                
              
               setCaptcha(e.target.value)}
                placeholder={
                  translations?.forms?.enterCaptcha ||
                  "Enter the code shown above"
                }
                required
              />
            

            {/* OTP Input Section for Guest Users */}
            {showOtpInput && submissionMode === "guest" && (
              
                
                
                  Email Verification
                  
                    
                      
                        Enter Verification Code
                      
                      
                          setOtpCode(
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        autoComplete="one-time-code"
                      />
                    
                    
                      Code sent to: {formData.email}
                    
                    
                      
                        Verify & Submit
                      
                       {
                          setShowOtpInput(false);
                          setOtpCode("");
                          setComplaintId(null);
                        }}
                      >
                        Back
                      
                    
                  
                
              
            )}

            {/* Action Buttons */}
            {showOtpInput && ({isLoading
                    ? translations?.common?.loading || "Submitting..."
                     === "citizen"
                      ? translations?.forms?.submitComplaint ||
                        "Submit Complaint"
                      )}
          
        
      

      {/* Location Map Dialog */}
       setIsMapDialogOpen(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={
          formData.coordinates
            ? {
                latitude: formData.coordinates.latitude,
                longitude: formData.coordinates.longitude,
                address: formData.address,
                area: formData.area,
                landmark: formData.location,
              }
            : undefined
        }
      />
    
  );
};

export default QuickComplaintForm;
