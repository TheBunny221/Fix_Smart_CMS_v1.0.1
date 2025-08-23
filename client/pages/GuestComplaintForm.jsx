import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import {
  selectAuth,
  getDashboardRouteForRole,
} from "../store/slices/authSlice";
import {
  selectGuestState,
  selectCurrentStep,
  selectSteps,
  selectFormData,
  selectValidationErrors,
  selectCanProceed,
  selectIsSubmitting,
  selectSubmissionStep,
  selectGuestError,
  selectComplaintId,
  selectTrackingNumber,
  selectNewUserRegistered,
  selectImagePreview,
  setCurrentStep,
  nextStep,
  prevStep,
  updateFormData,
  addAttachment,
  removeAttachment,
  validateCurrentStep,
  setImagePreview,
  clearGuestData,
  clearError,
  AttachmentFile,
  FileAttachment,
  GuestComplaintData,
} from "../store/slices/guestSlice";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useOtpFlow } from "../contexts/OtpContext";
import {
  useGetWardsQuery,
  useSubmitGuestComplaintMutation,
} from "../store/api/guestApi";
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

const GuestComplaintForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { openOtpFlow } = useOtpFlow();
  const { isAuthenticated, user } = useAppSelector(selectAuth);
  const { appName } = useSystemConfig();

  // Fetch wards from API
  const {
    data,
    isLoading,
    error,
  } = useGetWardsQuery();
  const wards = Array.isArray(wardsResponse?.data) ? wardsResponse.data : [];

  // RTK Query mutation for form submission
  const [submitComplaintMutation] = useSubmitGuestComplaintMutation();

  // Guest form state
  const currentStep = useAppSelector(selectCurrentStep);
  const steps = useAppSelector(selectSteps);
  const formData = useAppSelector(selectFormData);
  const validationErrors = useAppSelector(selectValidationErrors);
  const canProceed = useAppSelector(selectCanProceed);
  const isSubmitting = useAppSelector(selectIsSubmitting);
  const submissionStep = useAppSelector(selectSubmissionStep);
  const error = useAppSelector(selectGuestError);
  const complaintId = useAppSelector(selectComplaintId);
  const trackingNumber = useAppSelector(selectTrackingNumber);
  const newUserRegistered = useAppSelector(selectNewUserRegistered);
  const imagePreview = useAppSelector(selectImagePreview);

  // Local state
  const [currentLocation, setCurrentLocation] = useState(null);
  const [fileMap, setFileMap] = useState>(new Map());

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRouteForRole(user.role);
      navigate(dashboardRoute);
    }
  }, [isAuthenticated, user, navigate]);

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
          dispatch(updateFormData({
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
      dispatch(updateFormData({ [name]));
    },
    [dispatch],
  );

  // Handle select changes
  const handleSelectChange = useCallback(
    (name, value) => {
      dispatch(updateFormData({ [name]));
    },
    [dispatch],
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    (files) => {
      if (files) return;

      Array.from(files).forEach((file) => {
        // Validate file
        if (file.size > 10 * 1024 * 1024) {
          // 10MB
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
      // Clean up file map
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

    // Final validation
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
      // Prepare files array for submission
      const files =
        formData.attachments
          ?.map((attachment) => {
            const file = fileMap.get(attachment.id);
            return file ? { id: attachment.id, file } ;
          })
          .filter((f): f is FileAttachment => f == null) || [];

      // Create FormData for file uploads
      const submissionData = new FormData();

      // Add text data
      submissionData.append("fullName", formData.fullName);
      submissionData.append("email", formData.email);
      submissionData.append("phoneNumber", formData.phoneNumber);
      submissionData.append("type", formData.type);
      submissionData.append("description", formData.description);
      submissionData.append("priority", formData.priority || "MEDIUM");
      submissionData.append("wardId", formData.wardId);
      if (formData.subZoneId)
        submissionData.append("subZoneId", formData.subZoneId);
      submissionData.append("area", formData.area);
      if (formData.landmark)
        submissionData.append("landmark", formData.landmark);
      if (formData.address) submissionData.append("address", formData.address);

      // Add coordinates
      if (formData.coordinates) {
        submissionData.append(
          "coordinates",
          JSON.stringify(formData.coordinates),
        );
      }

      // Add attachments
      if (files && files.length > 0) {
        files.forEach((fileAttachment) => {
          submissionData.append("attachments", fileAttachment.file);
        });
      }

      const response = await submitComplaintMutation(submissionData).unwrap();
      const result = response.data;

      if (result.complaintId && result.trackingNumber) {
        // Open unified OTP dialog
        openOtpFlow({
          context,
          email: formData.email,
          complaintId: result.complaintId,
          trackingNumber: result.trackingNumber,
          title: "Verify Your Complaint",
          description:
            "Enter the verification code sent to your email to complete your complaint submission",
          onSuccess: () => {
            toast({
              title,
              description: "Your complaint has been verified successfully.",
            });
            navigate("/dashboard");
          },
        });

        toast({
          title,
          description: `Tracking number: ${result.trackingNumber}. Please check your email for the verification code.`,
        });
      }
    } catch (error) {
      console.error("Guest complaint submission error, error);
      toast({
        title,
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  }, [dispatch, formData, validationErrors, openOtpFlow, toast, navigate]);

  // Calculate progress
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  // Get available sub-zones based on selected ward
  const selectedWard = wards.find((ward) => ward.id === formData.wardId);
  const availableSubZones = selectedWard?.subZones || [];

  // Success page
  if (submissionStep === "success") {
    return (Welcome to {appName}
                  
                  
                    Your complaint has been verified and you've been registered citizen.
                  
                

                
                  
                    Tracking Number)}
                    className="w-full"
                  >
                    Go to Dashboard
                  

                   dispatch(clearGuestData())}
                    className="w-full"
                  >
                    Submit Another Complaint
                  
                
              
            
          
        
      
    );
  }

  // Multi-step complaint form
  return (
    
      
        {/* Header */}
        
          
            Submit a Complaint
          
          
            Report civic issues and get them resolved quickly
          
        

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
              
            
          
        

        {/* Error Display */}
        {error && (
          
            
            {error}
          
        )}

        {/* Form Content */}
        
          
            
              {currentStep === 1 && }
              {currentStep === 2 && }
              {currentStep === 3 && }
              {currentStep === 4 && }
              {currentStep === 5 && }
              {steps[currentStep - 1]?.title}
            
            
              {currentStep === 1 &&
                "Provide your details and describe the issue"}
              {currentStep === 2 && "Specify the location of the problem"}
              {currentStep === 3 &&
                "Add images to help us understand the issue (optional)"}
              {currentStep === 4 && "Review all information before submitting"}
              {currentStep === 5 && "Submit your complaint for verification"}
            
          
          
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
                    

                    
                      
                        Sub-Zone *
                      
                      
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
                        
                      
                      {validationErrors.subZoneId && (
                        
                          {validationErrors.subZoneId}
                        
                      )}
                    
                  

                  
                    
                      Area/Locality *
                    
                    
                    {validationErrors.area && (
                      
                        {validationErrors.area}
                      
                    )}
                  

                  
                    
                      Landmark (Optional)
                      
                    

                    
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
                      
                    
                    
                      
                        Name) => type.value === formData.type,
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
                
              
            )}

            {/* Navigation Buttons */}
            
              
                
                Previous
              

              {currentStep 
                  Next
                  
                
              ) : (
                
                  {isSubmitting ? (
                    
                      
                      Submitting...
                    
                  ) : (
                    
                      Submit Complaint
                      
                    
                  )}
                
              )}
            
          
        

        {/* Image Preview Dialog */}
        {imagePreview.show && (dispatch(setImagePreview({ show, url))
            }
          >
            
              
                Image Preview
              
              
                
              
            
          
        )}
      
    
  );
};

export default GuestComplaintForm;
