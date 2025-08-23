import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import { selectAuth } from "../store/slices/authSlice";
import { useToast } from "../hooks/use-toast";
import {
  useUploadComplaintAttachmentMutation,
  useCreateComplaintMutation,
} from "../store/api/complaintsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  FileText,
  MapPin,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Camera,
  Upload,
  X,
  Eye,
  Info,
  UserCheck,
  Image,
} from "lucide-react";

;

  // Step 3: Attachments
  attachments?;
}

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

const WARDS = [
  {
    id: "ward-1",
    name: "Fort Kochi",
    subZones: ["Marine Drive", "Parade Ground", "Princess Street"],
  },
  {
    id: "ward-2",
    name: "Mattancherry",
    subZones: ["Jew Town", "Dutch Palace", "Spice Market"],
  },
  {
    id: "ward-3",
    name: "Ernakulam South",
    subZones: ["MG Road", "Broadway", "Shanmugham Road"],
  },
  {
    id: "ward-4",
    name: "Ernakulam North",
    subZones: ["Kadavanthra", "Panampilly Nagar", "Kaloor"],
  },
  {
    id: "ward-5",
    name: "Kadavanthra",
    subZones: ["NH Bypass", "Rajaji Road", "Pipeline Road"],
  },
  {
    id: "ward-6",
    name: "Thevara",
    subZones: ["Thevara Ferry", "Pipeline", "NGO Quarters"],
  },
];

const CitizenComplaintForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAppSelector(selectAuth);
  const { complaintTypeOptions, isLoading: complaintTypesLoading } =
    useComplaintTypes();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Initialize form data with citizen profile information
  const [formData, setFormData] = useState({
    fullName,
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    type: "",
    description: "",
    priority: "MEDIUM",
    slaHours,
    wardId: user?.wardId || "",
    area: "",
    landmark: "",
    address: "",
    coordinates,
    attachments: [],
  });

  const [validationErrors, setValidationErrors] = useState
  >({});
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [fileUploadErrors, setFileUploadErrors] = useState([]);

  // API mutation hooks
  const [createComplaint] = useCreateComplaintMutation();
  const [uploadAttachment] = useUploadComplaintAttachmentMutation();

  const steps = [
    { id, title: "Details", icon, isCompleted: false },
    { id, title: "Location", icon, isCompleted: false },
    { id, title: "Attachments", icon, isCompleted: false },
    { id, title: "Review", icon, isCompleted: false },
  ];

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  // Redirect if not authenticated
  useEffect(() => {
    if (isAuthenticated || user) {
      navigate("/login");
      return;
    }

    // Auto-fill form with user data
    setFormData((prev) => ({
      ...prev,
      fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      wardId: user.wardId || "",
    }));
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
          setFormData((prev) => ({
            ...prev,
            coordinates,
              longitude: coords.lng,
            },
          }));
        },
        (error) => {
          console.log("Location access denied or unavailable");
        },
      );
    }
  }, []);

  const handleInputChange = (e,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };

      // Auto-assign priority and SLA hours when complaint type changes
      if (name === "type") {
        const selectedType = complaintTypeOptions.find(
          (type) => type.value === value,
        );
        if (selectedType) {
          updatedData.priority = selectedType.priority || "MEDIUM";
          updatedData.slaHours = selectedType.slaHours || 48;
        }
      }

      return updatedData;
    });
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]));
    }
  };

  const validateStep = (step) => {
    const errors: Record = {};

    switch (step) {
      case 1:
        if (formData.type) errors.type = "Complaint type is required";
        if (formData.description.trim())
          errors.description = "Description is required";
        else if (formData.description.trim().length  {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (validateStep(2)) return;

    setIsSubmitting(true);
    try {
      // Create complaint
      const complaintData = {
        title: `${formData.type} complaint`,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        slaHours: formData.slaHours,
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

      const complaintResponse = await createComplaint(complaintData).unwrap();
      const complaint = complaintResponse.data.complaint;
      const complaintId = complaint.id;
      const displayId =
        complaint.complaintId || complaintId.slice(-6).toUpperCase();

      // Upload attachments if any
      if (formData.attachments && formData.attachments.length > 0) {
        setUploadingFiles(true);
        for (const file of formData.attachments) {
          try {
            await uploadAttachment({ complaintId, file }).unwrap();
          } catch (uploadError) {
            console.error("Failed to upload file, file.name, uploadError);
            // Don't fail the entire submission for file upload errors
          }
        }
        setUploadingFiles(false);
      }

      toast({
        title,
        description: `Your complaint has been registered with ID: ${displayId}. You will receive updates via email and in-app notifications.`,
      });

      navigate("/complaints");
    } catch (error) {
      console.error("Submission error, error);
      toast({
        title,
        description:
          error?.data?.message ||
          "There was an error submitting your complaint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
    }
  };

  // File upload handlers
  const handleFileUpload = async (event,
  ) => {
    const files = event.target.files;
    if (files || files.length === 0) return;

    // Validate file count
    const currentFileCount = formData.attachments?.length || 0;
    if (currentFileCount + files.length > 5) {
      toast({
        title,
        description: "You can upload a maximum of 5 files",
        variant: "destructive",
      });
      return;
    }

    const validFiles = [];
    const errors = [];

    for (let i = 0; i  10 * 1024 * 1024) {
        errors.push(`${file.name})`);
        continue;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (allowedTypes.includes(file.type)) {
        errors.push(`${file.name})`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setFileUploadErrors(errors);
      toast({
        title,
        description: `${errors.length} file(s) were rejected`,
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        attachments), ...validFiles],
      }));
      setFileUploadErrors([]);
    }

    // Clear the input
    event.target.value = "";
  };

  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments, i) => i == index) || [],
    }));
  };

  const selectedComplaintType = complaintTypeOptions.find(
    (c) => c.value === formData.type,
  );
  const selectedWard = WARDS.find((w) => w.id === formData.wardId);
  const availableSubZones = selectedWard?.subZones || [];

  if (isAuthenticated || user) {
    return null; // Will redirect in useEffect
  }

  return ({/* Header */}
        
          
            Submit a Complaint
          
          
            As a registered citizen, your information is pre-filled for faster
            submission
          
        

        {/* Citizen Info Alert */}
        
          
          
            Logged in as)
            
            Your personal information is automatically filled and cannot be
            changed here. To update your profile, visit the{" "}
             navigate("/profile")}
              className="underline hover:no-underline"
            >
              Profile Settings
            
            .
          
        

        {/* Progress Indicator */}
        
          
            
              
                Progress
                
                  Step {currentStep} of {steps.length}
                
              
              

              {/* Step indicators */}
              
                {steps.map((step) => {
                  const StepIcon = step.icon;
                  return (
                    
                      
                        {step.id 
                        ) : (
                          
                        )}
                      
                      {step.title}
                    
                  );
                })}
              
            
          
        

        {/* Form Content */}
        
          
            
              {React.createElement(steps[currentStep - 1].icon, {
                className,
              })}
              {steps[currentStep - 1].title}
            
            
              {currentStep === 1 && "Describe your complaint and set priority"}
              {currentStep === 2 && "Specify the exact location of the issue"}
              {currentStep === 3 && "Add supporting images (optional)"}
              {currentStep === 4 && "Review and submit your complaint"}
            
          
          
            {/* Step 1: Details */}
            {currentStep === 1 && (
              
                {/* Pre-filled Personal Information (Read-only) */}
                
                  
                    Personal Information (Auto-filled)
                  
                  
                    
                      Full Name
                      
                    
                    
                      Email Address
                      
                    
                    
                      Phone Number
                      
                    
                    
                      Citizen ID
                      
                    
                  
                

                {/* Complaint Information */}
                
                  Complaint Details

                  
                    Complaint Type *
                    
                        handleSelectChange("type", value)
                      }
                    >
                      
                        
                      
                      
                        {complaintTypesLoading ? (
                          
                            Loading complaint types...
                          
                        ) : complaintTypeOptions.length > 0 ? (
                          complaintTypeOptions.map((type) => (
                            
                              
                                
                                  
                                    {type.label}
                                  
                                  {type.priority && (
                                    
                                      {type.priority}
                                    
                                  )}
                                
                                {type.description && (
                                  
                                    {type.description}
                                  
                                )}
                              
                            
                          ))
                        ) : (
                          
                            No complaint types available
                          
                        )}
                      
                    
                    {validationErrors.type && (
                      
                        {validationErrors.type}
                      
                    )}
                  

                  {selectedComplaintType && ({selectedComplaintType.label}
                      
                      
                        {selectedComplaintType.description}
                      
                      
                        
                          
                          
                            Priority)}

                  {/* Priority is now auto-assigned and hidden from user */}
                  {selectedComplaintType && (Auto-assigned Details
                          
                          
                            Based on your complaint type, the following have
                            been automatically set,
                              )?.color || "bg-gray-500"
                            }`}
                          />
                          
                            Priority:{" "}
                            {PRIORITIES.find(
                              (p) => p.value === formData.priority,
                            )?.label || formData.priority}
                          
                        
                        
                          
                          
                            SLA: {formData.slaHours} hours
                          
                        
                      
                    
                  )}

                  
                    Description *
                    
                    {validationErrors.description && (
                      
                        {validationErrors.description}
                      
                    )}
                    
                      Be specific about the problem, when it started, and how it
                      affects you.
                    
                  
                
              
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              
                
                  
                    Location Information
                  

                  
                    
                      Ward *
                      
                          handleSelectChange("wardId", value)
                        }
                      >
                        
                          
                        
                        
                          {WARDS.map((ward) => (
                            
                              {ward.name}
                            
                          ))}
                        
                      
                      {validationErrors.wardId && (
                        
                          {validationErrors.wardId}
                        
                      )}
                    

                    
                      Sub-Zone (Optional)
                      
                          handleSelectChange("subZoneId", value)
                        }
                        disabled={formData.wardId}
                      >
                        
                          
                        
                        
                          {availableSubZones.map((subZone, index) => (
                            
                              {subZone}
                            
                          ))}
                        
                      
                    
                  

                  
                    Area/Locality *
                    
                    {validationErrors.area && (
                      
                        {validationErrors.area}
                      
                    )}
                  

                  
                    
                      Landmark (Optional)
                      
                    

                    
                      Full Address (Optional)
                      
                    
                  

                  {currentLocation && (Current location detected and will be included with
                          your complaint
                        
                      
                      
                        Coordinates)},{" "}
                        {currentLocation.lng.toFixed(6)}
                      
                    
                  )}
                
              
            )}

            {/* Step 3: Attachments */}
            {currentStep === 3 && (
              
                
                  
                    Upload Images (Optional)
                  
                  
                    Adding photos helps our team understand and resolve the
                    issue faster. You can upload up to 5 images.
                  

                  
                    
                    
                      
                        
                        
                          Click to upload{" "}
                          or drag and drop
                        
                        
                          PNG, JPG or JPEG (MAX. 10MB each)
                        
                      
                    

                    {/* Display uploaded files */}
                    {formData.attachments &&
                      formData.attachments.length > 0 && (
                        
                          
                            Uploaded Files ({formData.attachments.length}/5)
                          
                          
                            {formData.attachments.map((file, index) => (
                              
                                
                                  
                                  
                                    
                                      {file.name}
                                    
                                    
                                      {(file.size / 1024).toFixed(1)} KB
                                    
                                  
                                
                                 removeFile(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  
                                
                              
                            ))}
                          
                        
                      )}

                    {/* File upload errors */}
                    {fileUploadErrors.length > 0 && (Upload Errors, index) => (
                          
                            {error}
                          
                        ))}
                      
                    )}

                    
                      
                        Tips for better photos:
                      
                      
                        
                          • Take clear, well-lit photos of the problem area
                        
                        • Include wider shots to show context
                        • Capture any visible damage or hazards
                        
                          • Avoid including personal or sensitive information
                        
                      
                    
                  
                
              
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (Review Your Complaint

                
                  {/* Citizen Info */}
                  
                    
                      
                        Citizen Information
                      
                    
                    
                      
                        Name).toUpperCase()}
                      
                    
                  

                  {/* Complaint Details */}
                  
                    
                      
                        Complaint Details
                      
                    
                    
                      
                        Type: {selectedComplaintType?.label}
                      
                      
                        Priority:
                         p.value === formData.priority)?.color}`}
                        >
                          {
                            PRIORITIES.find(
                              (p) => p.value === formData.priority,
                            )?.label
                          }
                        
                      
                      
                        SLA Hours: {formData.slaHours} hours
                      
                      
                        Description: {formData.description}
                      
                    
                  

                  {/* Location */}
                  
                    
                      Location
                    
                    
                      
                        Ward:{" "}
                        {WARDS.find((w) => w.id === formData.wardId)?.name}
                      
                      {formData.subZoneId && (Sub-Zone)}
                      
                        Area: {formData.area}
                      
                      {formData.landmark && (Landmark)}
                      {formData.address && (Address)}
                      {currentLocation && (GPS Coordinates)}
                    
                  

                  {/* Attachments */}
                  
                    
                      Attachments
                    
                    
                      {formData.attachments &&
                      formData.attachments.length > 0 ? (
                        
                          
                            {formData.attachments.length} file(s) will be
                            uploaded with your complaint:
                          
                          {formData.attachments.map((file, index) => (
                            
                              
                              {file.name}
                              
                                ({(file.size / 1024).toFixed(1)} KB)
                              
                            
                          ))}
                        
                      ) : (
                        No attachments
                      )}
                    
                  

                  
                    
                    
                      Ready to submit Your complaint will be
                      automatically assigned a tracking number and forwarded to
                      the appropriate department. You'll receive email
                      notifications about status updates.
                    
                  
                
              
            )}

            {/* Navigation Buttons */}
            
              
                
                Previous
              

              {currentStep 
                  Next
                  
                
              ) : ({isSubmitting || uploadingFiles ? (
                    
                      
                      {uploadingFiles ? "Uploading files..." ) : (
                    
                      Submit Complaint
                      
                    
                  )}
                
              )}
            
          
        
      
    
  );
};

export default CitizenComplaintForm;
