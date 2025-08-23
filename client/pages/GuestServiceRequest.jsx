import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { useToast } from "../hooks/use-toast";
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
import {
  FileText,
  Calendar,
  MapPin,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  PlusCircle,
} from "lucide-react";



const SERVICE_TYPES = [
  {
    value: "BIRTH_CERTIFICATE",
    label: "Birth Certificate",
    description: "New birth certificate issuance",
    processingTime: "5-7 days",
  },
  {
    value: "DEATH_CERTIFICATE",
    label: "Death Certificate",
    description: "Death certificate issuance",
    processingTime: "3-5 days",
  },
  {
    value: "MARRIAGE_CERTIFICATE",
    label: "Marriage Certificate",
    description: "Marriage certificate issuance",
    processingTime: "7-10 days",
  },
  {
    value: "PROPERTY_TAX",
    label: "Property Tax",
    description: "Property tax payment and certificates",
    processingTime: "2-3 days",
  },
  {
    value: "TRADE_LICENSE",
    label: "Trade License",
    description: "Business trade license application",
    processingTime: "10-15 days",
  },
  {
    value: "BUILDING_PERMIT",
    label: "Building Permit",
    description: "Construction and renovation permits",
    processingTime: "15-20 days",
  },
  {
    value: "WATER_CONNECTION",
    label: "Water Connection",
    description: "New water connection application",
    processingTime: "7-10 days",
  },
  {
    value: "OTHERS",
    label: "Others",
    description: "Other municipal services",
    processingTime: "Varies",
  },
];

const PRIORITIES = [
  { value: "NORMAL", label: "Normal", color: "bg-blue-500" },
  { value: "URGENT", label: "Urgent", color: "bg-orange-500" },
  { value: "EMERGENCY", label: "Emergency", color: "bg-red-500" },
];

const WARDS = [
  { id: "ward-1", name: "Fort Kochi" },
  { id: "ward-2", name: "Mattancherry" },
  { id: "ward-3", name: "Ernakulam South" },
  { id: "ward-4", name: "Ernakulam North" },
  { id: "ward-5", name: "Kadavanthra" },
  { id: "ward-6", name: "Thevara" },
];

const GuestServiceRequest: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName,
    email: "",
    phoneNumber: "",
    serviceType: "",
    priority: "NORMAL",
    description: "",
    preferredDate: "",
    preferredTime: "",
    wardId: "",
    area: "",
    address: "",
    landmark: "",
  });

  const [validationErrors, setValidationErrors] = useState
  >({});

  const steps = [
    { id, title: "Service Details", icon: FileText },
    { id, title: "Personal Info", icon: User },
    { id, title: "Location", icon: MapPin },
    { id, title: "Schedule", icon: Calendar },
    { id, title: "Review", icon: CheckCircle },
  ];

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const handleInputChange = (e,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]));
    }
  };

  const validateStep = (step) => {
    const errors: Record = {};

    switch (step) {
      case 1:
        if (formData.serviceType)
          errors.serviceType = "Service type is required";
        if (formData.description.trim())
          errors.description = "Description is required";
        else if (formData.description.trim().length  {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (validateStep(4)) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title,
        description:
          "Your service request has been submitted successfully. You will receive a confirmation email shortly.",
      });

      navigate("/guest/track");
    } catch (error) {
      toast({
        title,
        description:
          "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedService = SERVICE_TYPES.find(
    (s) => s.value === formData.serviceType,
  );

  return (
    
      
        {/* Header */}
        
          Service Request
          Request municipal services online
        

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
            
            
              {currentStep === 1 &&
                "Select the service you need and provide details"}
              {currentStep === 2 && "Enter your personal information"}
              {currentStep === 3 && "Specify your location"}
              {currentStep === 4 && "Choose your preferred appointment time"}
              {currentStep === 5 && "Review and submit your service request"}
            
          
          
            {/* Step 1: Service Details */}
            {currentStep === 1 && (
              
                
                  Service Type *
                  
                      handleSelectChange("serviceType", value)
                    }
                  >
                    
                      
                    
                    
                      {SERVICE_TYPES.map((service) => (
                        
                          
                            {service.label}
                            
                              {service.description}
                            
                          
                        
                      ))}
                    
                  
                  {validationErrors.serviceType && (
                    
                      {validationErrors.serviceType}
                    
                  )}
                

                {selectedService && ({selectedService.label}
                    
                    
                      {selectedService.description}
                    
                    
                      
                      
                        Processing Time)}

                
                  Priority
                  
                      handleSelectChange("priority", value)
                    }
                  >
                    
                      
                    
                    
                      {PRIORITIES.map((priority) => (
                        
                          
                            
                            {priority.label}
                          
                        
                      ))}
                    
                  
                

                
                  Description *
                  
                  {validationErrors.description && (
                    
                      {validationErrors.description}
                    
                  )}
                
              
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              
                
                  
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
                
              
            )}

            {/* Step 3: Location */}
            {currentStep === 3 && (
              
                
                  
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
                  

                  
                    Area/Locality *
                    
                    {validationErrors.area && (
                      
                        {validationErrors.area}
                      
                    )}
                  
                

                
                  Full Address *
                  
                  {validationErrors.address && (
                    
                      {validationErrors.address}
                    
                  )}
                

                
                  Landmark (Optional)
                  
                
              
            )}

            {/* Step 4: Schedule */}
            {currentStep === 4 && (
              
                
                  
                    Preferred Date *
                    
                    {validationErrors.preferredDate && (
                      
                        {validationErrors.preferredDate}
                      
                    )}
                  

                  
                    Preferred Time *
                    
                        handleSelectChange("preferredTime", value)
                      }
                    >
                      
                        
                      
                      
                        09:00 AM
                        10:00 AM
                        11:00 AM
                        12:00 PM
                        02:00 PM
                        03:00 PM
                        04:00 PM
                      
                    
                    {validationErrors.preferredTime && (
                      
                        {validationErrors.preferredTime}
                      
                    )}
                  
                

                
                  
                    Important Notes
                  
                  
                    • Appointments are subject to availability
                    
                      • You will receive a confirmation email with final
                      appointment details
                    
                    • Please bring all required documents
                    • Arrive 15 minutes before your scheduled time
                  
                
              
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (Review Your Service Request
                

                
                  {/* Service Details */}
                  
                    
                      
                        Service Details
                      
                    
                    
                      
                        Service)?.color}`}
                        >
                          {
                            PRIORITIES.find(
                              (p) => p.value === formData.priority,
                            )?.label
                          }
                        
                      
                      
                        Description: {formData.description}
                      
                    
                  

                  {/* Personal Information */}
                  
                    
                      
                        Personal Information
                      
                    
                    
                      
                        Name: {formData.fullName}
                      
                      
                        Email: {formData.email}
                      
                      
                        Phone: {formData.phoneNumber}
                      
                    
                  

                  {/* Location */}
                  
                    
                      Location
                    
                    
                      
                        Ward:{" "}
                        {WARDS.find((w) => w.id === formData.wardId)?.name}
                      
                      
                        Area: {formData.area}
                      
                      
                        Address: {formData.address}
                      
                      {formData.landmark && (Landmark)}
                    
                  

                  {/* Schedule */}
                  
                    
                      Appointment
                    
                    
                      
                        Date:{" "}
                        {new Date(formData.preferredDate).toLocaleDateString()}
                      
                      
                        Time: {formData.preferredTime}
                      
                    
                  
                
              
            )}

            {/* Navigation Buttons */}
            
              
                
                Previous
              

              {currentStep 
                  Next
                  
                
              ) : (
                
                  {isSubmitting ? (
                    
                      
                      Submitting...
                    
                  ) : (
                    
                      Submit Request
                      
                    
                  )}
                
              )}
            
          
        
      
    
  );
};

export default GuestServiceRequest;
