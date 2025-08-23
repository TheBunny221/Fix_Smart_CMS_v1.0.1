import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import {
  selectAuth,
  getDashboardRouteForRole,
  setCredentials,
} from "../store/slices/authSlice";
import { useCreateComplaintMutation } from "../store/api/complaintsApi";
import {
  selectGuestState,
  submitGuestComplaint,
  clearGuestData,
  updateFormData,
  validateCurrentStep,
  setCurrentStep,
  nextStep,
  prevStep,
  addAttachment,
  removeAttachment,
  setImagePreview,
  selectFormData,
  selectCurrentStep,
  selectSteps,
  selectValidationErrors,
  selectCanProceed,
  selectIsSubmitting,
  selectComplaintId,
  selectTrackingNumber,
  selectImagePreview,
  FileAttachment,
  GuestComplaintData,
} from "../store/slices/guestSlice";
import {
  useGetWardsQuery,
  useVerifyGuestOtpMutation,
} from "../store/api/guestApi";
import { useOtpFlow } from "../contexts/OtpContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import SimpleLocationMapDialog from "../components/SimpleLocationMapDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  FileText,
  Mail,
  CheckCircle,
  Clock,
  User,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Loader2,
  UserPlus,
  Shield,
  Camera,
  Upload,
  X,
  Eye,
  AlertCircle,
  MapIcon,
  FileImage,
  Check,
  UserCheck,
  Info,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

const COMPLAINT_TYPES = [
  {
    value: "WATER_SUPPLY",
    label: "Water Supply",
    description: "Issues with water supply, quality, or pressure",
  },
  {
    value: "ELECTRICITY",
    label: "Electricity",
    description: "Power outages, faulty connections, or street lighting",
  },
  {
    value: "ROAD_REPAIR",
    label: "Road Repair",
    description: "Potholes, broken roads, or pedestrian issues",
  },
  {
    value: "GARBAGE_COLLECTION",
    label: "Garbage Collection",
    description: "Waste management and cleanliness issues",
  },
  {
    value: "STREET_LIGHTING",
    label: "Street Lighting",
    description: "Non-functioning or damaged street lights",
  },
  {
    value: "SEWERAGE",
    label: "Sewerage",
    description: "Drainage problems, blockages, or overflow",
  },
  {
    value: "PUBLIC_HEALTH",
    label: "Public Health",
    description: "Health and sanitation concerns",
  },
  {
    value: "TRAFFIC",
    label: "Traffic",
    description: "Traffic management and road safety issues",
  },
  {
    value: "OTHERS",
    label: "Others",
    description: "Any other civic issues not listed above",
  },
];

const PRIORITIES = [
  {
    value: "LOW",
    label: "Low",
    color: "bg-gray-500",
    description: "Non-urgent issues",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    color: "bg-blue-500",
    description: "Standard issues requiring attention",
  },
  {
    value: "HIGH",
    label: "High",
    color: "bg-orange-500",
    description: "Important issues affecting daily life",
  },
  {
    value: "CRITICAL",
    label: "Critical",
    color: "bg-red-500",
    description: "Emergency situations requiring immediate attention",
  },
];

const UnifiedComplaintForm: React.FC = () => {
  const navigate = useNavigate();

  // RTK Query mutations
  const [createComplaintMutation] = useCreateComplaintMutation();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { openOtpFlow } = useOtpFlow();
  const [verifyGuestOtp] = useVerifyGuestOtpMutation();
  const { isAuthenticated, user } = useAppSelector(selectAuth);

  // Fetch wards from API
  const {
    data,
    isLoading,
    error,
  } = useGetWardsQuery();
  const wards = Array.isArray(wardsResponse?.data) ? wardsResponse.data : [];

  // Use guest form state canonical source for form management
  const currentStep = useAppSelector(selectCurrentStep);
  const steps = useAppSelector(selectSteps);
  const formData = useAppSelector(selectFormData);
  const validationErrors = useAppSelector(selectValidationErrors);
  const canProceed = useAppSelector(selectCanProceed);
  const isSubmitting = useAppSelector(selectIsSubmitting);
  const complaintId = useAppSelector(selectComplaintId);
  const trackingNumber = useAppSelector(selectTrackingNumber);
  const imagePreview = useAppSelector(selectImagePreview);

  // Local state for file handling and location
  const [currentLocation, setCurrentLocation] = useState(null);
  const [fileMap, setFileMap] = useState>(new Map());
  const [submissionMode, setSubmissionMode] = useState(isAuthenticated ? "citizen" ,
  );
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState("");

  // Prefill form data for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      setSubmissionMode("citizen");

      // Pre-fill user data for citizen mode
      dispatch(updateGuestFormData({
          fullName,
          email: user.email,
          phoneNumber: user.phoneNumber || "",
          wardId: user.wardId || "",
        }),
      );
    } else {
      setSubmissionMode("guest");
    }
  }, [isAuthenticated, user, dispatch]);

  // Get current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(coords);
          dispatch(updateGuestFormData({
              coordinates,
                longitude: coords.lng,
              },
            }),
          );
        },
        (error) => {
          console.log("Location access denied or unavailable");
        },
      );
    }
  }, [dispatch]);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
      const { name, value } = e.target;
      dispatch(updateGuestFormData({ [name]));
    },
    [dispatch],
  );

  // Handle select changes
  const handleSelectChange = useCallback(
    (name, value) => {
      dispatch(updateGuestFormData({ [name]));
    },
    [dispatch],
  );

  // Handle location selection from map
  const handleLocationSelect = useCallback((location) => {
      dispatch(updateGuestFormData({
          landmark,
          area: location.area || formData.area,
          address: location.address || formData.address,
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }),
      );
    },
    [dispatch, formData.area, formData.address],
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    (files) => {
      if (files) return;

      Array.from(files).forEach((file) => {
        // Validate file
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title,
            description: "Please select files smaller than 10MB",
            variant: "destructive",
          });
          return;
        }

        if (["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
          toast({
            title,
            description: "Only JPG and PNG images are allowed",
            variant: "destructive",
          });
          return;
        }

        // Create attachment object with serializable data
        const attachmentId =
          Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const attachment = {
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: URL.createObjectURL(file),
          uploading,
          uploaded,
        };

        // Store the actual file separately
        setFileMap((prev) => new Map(prev).set(attachmentId, file));
        dispatch(addAttachment(attachment));
      });
    },
    [dispatch, toast],
  );

  // Handle attachment removal
  const handleRemoveAttachment = useCallback(
    (id) => {
      setFileMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      dispatch(removeAttachment(id));
    },
    [dispatch],
  );

  // Handle image preview
  const handlePreviewImage = useCallback(
    (url) => {
      dispatch(setImagePreview({ show, url }));
    },
    [dispatch],
  );

  // Handle OTP input change
  const handleOtpChange = useCallback((e) => {
      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
      setOtpCode(value);

      // Clear OTP validation error when user starts typing
      if (validationErrors.otpCode) {
        dispatch(updateGuestFormData({})); // Trigger validation update
      }
    },
    [dispatch, validationErrors.otpCode],
  );

  // Handle OTP resend
  const handleResendOtp = useCallback(async () => {
    if (complaintId || formData.email) return;

    try {
      // Call resend OTP API - this should be implemented in the guest slice
      await dispatch(resendOTP({ email, complaintId }),
      ).unwrap();

      toast({
        title,
        description: "A new verification code has been sent to your email.",
      });
    } catch (error) {
      toast({
        title,
        description:
          error.message ||
          "Failed to resend verification code. Please try again.",
        variant: "destructive",
      });
    }
  }, [dispatch, complaintId, formData.email, toast]);

  // Handle form navigation
  const handleNext = useCallback(() => {
    dispatch(validateCurrentStep());
    if (canProceed) {
      dispatch(nextStep());
    } else {
      toast({
        title,
        description: "Fill in all required information before proceeding",
        variant: "destructive",
      });
    }
  }, [dispatch, canProceed, toast]);

  const handlePrev = useCallback(() => {
    dispatch(prevStep());
  }, [dispatch]);

  const handleStepClick = useCallback(
    (stepNumber) => {
      if (stepNumber  {
    dispatch(validateCurrentStep());

    // Final validation of all previous steps
    const hasErrors = Object.keys(validationErrors).length > 0;
    if (hasErrors) {
      toast({
        title,
        description: "Complete all required fields correctly before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      if (submissionMode === "citizen" && isAuthenticated) {
        // Citizen flow: Submit directly to authenticated API
        const complaintData = {
          title: `${COMPLAINT_TYPES.find((t) => t.value === formData.type)?.label} - ${formData.area}`,
          description: formData.description,
          type: formData.type,
          priority: formData.priority,
          wardId: formData.wardId,
          subZoneId: formData.subZoneId,
          area: formData.area,
          landmark: formData.landmark,
          address: formData.address,
          coordinates: formData.coordinates,
          contactName: formData.fullName,
          contactEmail: formData.email,
          contactPhone: formData.phoneNumber,
          isAnonymous,
        };

        const result = await createComplaintMutation(complaintData).unwrap();

        toast({
          title,
          description: `Your complaint has been registered with ID: ${result.id}. You can track its progress from your dashboard.`,
        });

        // Clear form and navigate to dashboard
        dispatch(clearGuestData());
        navigate(getDashboardRouteForRole(user?.role || "CITIZEN"));
      } else {
        // Guest flow: Submit complaint and send OTP
        const files =
          formData.attachments
            ?.map((attachment) => {
              const file = fileMap.get(attachment.id);
              return file ? { id: attachment.id, file } ;
            })
            .filter((f): f is FileAttachment => f == null) || [];

        const result = await dispatch(
          submitGuestComplaint({ complaintData, files }),
        ).unwrap();

        if (result.complaintId && result.trackingNumber) {
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
  }, [
    dispatch,
    formData,
    validationErrors,
    submissionMode,
    isAuthenticated,
    user,
    fileMap,
    toast,
    navigate,
  ]);

  // Handle OTP verification and final submission
  const handleVerifyAndSubmit = useCallback(async () => {
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

      // Store auth token and user data
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

      // Clear form data and navigate to dashboard
      dispatch(clearGuestData());
      navigate("/dashboard");
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
    navigate,
  ]);

  // Legacy handleSubmit for backward compatibility (now delegates to appropriate handler)
  const handleSubmit = useCallback(() => {
    if (currentStep === 5) {
      if (submissionMode === "citizen") {
        return handleSendOtp();
      } else if (complaintId) {
        return handleSendOtp();
      } else {
        return handleVerifyAndSubmit();
      }
    }
    return handleSendOtp();
  }, [
    currentStep,
    submissionMode,
    complaintId,
    handleSendOtp,
    handleVerifyAndSubmit,
  ]);

  // Calculate progress
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  // Get available sub-zones based on selected ward
  const selectedWard = wards.find((ward) => ward.id === formData.wardId);
  const availableSubZones = selectedWard?.subZones || [];

  return ({/* Header */}
        
          
            Submit a Complaint
          
          
            {submissionMode === "citizen"
              ? "Report civic issues using your citizen account"
              )
              
              Your personal information is automatically filled. This complaint
              will be linked to your citizen account.
            
          
        ) : (Guest Submission, you'll
              receive an email with a verification code. Verifying will
              automatically create your citizen account for future use.
            
          
        )}

        {/* Progress Indicator */}
        
          
            
              
                Progress
                
                  Step {currentStep} of {steps.length}
                
              
              

              {/* Step indicators */}
              
                {steps.map((step, index) => (
                   handleStepClick(step.id)}
                    disabled={step.id > currentStep}
                    className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${
                      step.id === currentStep
                        ? "bg-blue-100 text-blue-800"
                        : step.isCompleted
                          ? "bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
                          : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    
                      {step.isCompleted ? (
                        
                      ) : (
                        step.id
                      )}
                    
                    {step.title}
                  
                ))}
              
            
          
        

        {/* Form Content */}
        
          
            
              {currentStep === 1 && }
              {currentStep === 2 && }
              {currentStep === 3 && }
              {currentStep === 4 && }
              {currentStep === 5 &&
                (submissionMode === "citizen" ? (
                  
                ) : (
                  
                ))}
              {steps[currentStep - 1]?.title}
            
            
              {currentStep === 1 &&
                "Provide your details and describe the issue"}
              {currentStep === 2 && "Specify the location of the problem"}
              {currentStep === 3 &&
                "Add images to help us understand the issue (optional)"}
              {currentStep === 4 && "Review all information before submitting"}
              {currentStep === 5 &&
                (submissionMode === "citizen"
                  ? "Submit your complaint to the authorities"
                  )}
            
          
          
            {/* Step 1: Details */}
            {currentStep === 1 && (
              
                {/* Personal Information */}
                
                  
                    Personal Information
                  

                  
                    
                      
                        Full Name *
                      
                      
                      {validationErrors.fullName && (
                        
                          {validationErrors.fullName}
                        
                      )}
                    

                    
                      
                        Email Address *
                      
                      
                      {validationErrors.email && (
                        
                          {validationErrors.email}
                        
                      )}
                    
                  

                  
                    
                      Phone Number *
                    
                    
                    {validationErrors.phoneNumber && (
                      
                        {validationErrors.phoneNumber}
                      
                    )}
                  

                  {submissionMode === "citizen" && (
                    
                      
                      These details are from your citizen account. To update
                      them, visit your profile settings.
                    
                  )}
                

                {/* Complaint Information */}
                
                  
                    Complaint Information
                  

                  
                    
                      
                        Complaint Type *
                      
                      
                          handleSelectChange("type", value)
                        }
                        aria-describedby={
                          validationErrors.type ? "type-error" : undefined
                        }
                      >
                        
                          
                        
                        
                          {COMPLAINT_TYPES.map((type) => (
                            
                              
                                
                                  {type.label}
                                
                                
                                  {type.description}
                                
                              
                            
                          ))}
                        
                      
                      {validationErrors.type && (
                        
                          {validationErrors.type}
                        
                      )}
                    

                    
                      Priority
                      
                          handleSelectChange("priority", value)
                        }
                      >
                        
                          
                        
                        
                          {PRIORITIES.map((priority) => (
                            
                              
                                
                                
                                  
                                    {priority.label}
                                  
                                  
                                    {priority.description}
                                  
                                
                              
                            
                          ))}
                        
                      
                    
                  

                  
                    
                      Description *
                    
                    
                    {validationErrors.description && (
                      
                        {validationErrors.description}
                      
                    )}
                  
                
              
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              
                
                  
                    Location Information
                  

                  
                    
                      
                        Ward *
                      
                      
                          handleSelectChange("wardId", value)
                        }
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
                        
                      
                      {validationErrors.wardId && (
                        
                          {validationErrors.wardId}
                        
                      )}
                    

                    
                      Sub-Zone (Optional)
                      
                          handleSelectChange("subZoneId", value)
                        }
                        disabled={formData.wardId}
                      >
                        
                          
                        
                        
                          {availableSubZones.length === 0 ? (
                            
                              No sub-zones available
                            
                          ) : (
                            availableSubZones.map((subZone) => (
                              
                                {subZone.name}
                              
                            ))
                          )}
                        
                      
                    
                  

                  
                    
                      Area/Locality *
                    
                    
                    {validationErrors.area && (
                      
                        {validationErrors.area}
                      
                    )}
                  

                  
                    
                      Landmark (Optional)
                      
                        
                         setIsMapDialogOpen(true)}
                          title="Select location on map"
                        >
                          
                        
                      
                    

                    
                      Full Address (Optional)
                      
                    
                  

                  {currentLocation && (Location detected)},{" "}
                          {currentLocation.lng.toFixed(6)}
                        
                      
                    
                  )}
                
              
            )}

            {/* Step 3: Attachments */}
            {currentStep === 3 && (
              
                
                  
                    Upload Images (Optional)
                  
                  
                    Upload images to help illustrate the issue. Maximum 5 files,
                    10MB each.
                  

                  
                     handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    
                      
                        
                        
                          Click to upload{" "}
                          or drag and drop
                        
                        
                          PNG, JPG or JPEG (MAX. 10MB each)
                        
                      
                    

                    {/* File previews */}
                    {formData.attachments &&
                      formData.attachments.length > 0 && (
                        
                          {formData.attachments.map((attachment) => (
                            
                              
                              
                                
                                  
                                      handlePreviewImage(attachment.preview)
                                    }
                                  >
                                    
                                  
                                  
                                      handleRemoveAttachment(attachment.id)
                                    }
                                  >
                                    
                                  
                                
                              
                            
                          ))}
                        
                      )}
                  
                
              
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (Review Your Complaint

                
                  {/* Personal Info Review */}
                  
                    
                      
                        Personal Information
                      
                    
                    
                      
                        Name).toUpperCase()}
                        
                      )}
                    
                  

                  {/* Complaint Info Review */}
                  
                    
                      
                        Complaint Details
                      
                    
                    
                      
                        Type:{" "}
                        {
                          COMPLAINT_TYPES.find(
                            (type) => type.value === formData.type,
                          )?.label
                        }
                      
                      
                        Priority:{" "}
                         p.value === formData.priority,
                            )?.color
                          }
                        >
                          {
                            PRIORITIES.find(
                              (p) => p.value === formData.priority,
                            )?.label
                          }
                        
                      
                      
                        Description: {formData.description}
                      
                    
                  

                  {/* Location Review */}
                  
                    
                      Location
                    
                    
                      
                        Ward:{" "}
                        {selectedWard?.name || formData.wardId}
                      
                      
                        Sub-Zone:{" "}
                        {availableSubZones.find(
                          (sz) => sz.id === formData.subZoneId,
                        )?.name ||
                          formData.subZoneId ||
                          "Not specified"}
                      
                      
                        Area: {formData.area}
                      
                      {formData.landmark && (Landmark)}
                      {formData.address && (Address)}
                    
                  

                  {/* Attachments Review */}
                  {formData.attachments && formData.attachments.length > 0 && (
                    
                      
                        Attachments
                      
                      
                        
                          {formData.attachments.map((attachment) => (
                            
                                handlePreviewImage(attachment.preview)
                              }
                            />
                          ))}
                        
                      
                    
                  )}

                  {/* Submission Type Info */}
                  
                    
                    
                      {submissionMode === "citizen" ? (Citizen Submission) : (Guest Submission,
                          you'll receive a verification email. Verifying will
                          create your citizen account and activate your
                          complaint tracking.
                        
                      )}
                    
                  
                
              
            )}

            {/* Step 5: Submit with OTP */}
            {currentStep === 5 && (Verify and Submit

                {submissionMode === "citizen" ? (
                  // Citizen users, your complaint will be submitted immediately
                        without requiring additional verification.
                      
                    

                    
                      
                      
                        Ready to Submit
                      
                      
                        Your complaint is ready to be submitted to the relevant
                        authorities.
                      
                    
                  
                ) : (// Guest users) : (// Step 5b)}
                        
                      
                    )}
                  
                )}
              
            )}

            {/* Navigation Buttons */}
            
              
                
                Previous
              

              {currentStep 
                  Next
                  
                
              ) : (// Step 5 submission buttons
                
                  {submissionMode === "citizen" ? (
                    // Citizen) : (
                        
                          Submit Complaint
                          
                        
                      )}
                    
                  ) : complaintId ? (// Guest) : (
                        
                          Send Verification Code
                          
                        
                      )}
                    
                  ) : (// Guest) : (
                        
                          Verify & Submit
                          
                        
                      )}
                    
                  )}
                
              )}
            
          
        

        {/* Image Preview Dialog */}
        {imagePreview.show && (dispatch(setImagePreview({ show, url))
            }
          >
            
              
                Image Preview
              
              
                
              
            
          
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
                  landmark: formData.landmark,
                }
              : undefined
          }
        />
      
    
  );
};

export default UnifiedComplaintForm;
