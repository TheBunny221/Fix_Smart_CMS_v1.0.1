import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  useCreateComplaintMutation,
  useGetComplaintTypesQuery,
} from "../store/api/complaintsApi";
import {
  Card,
  CardContent,
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
import { Checkbox } from "../components/ui/checkbox";
import { useToast } from "../components/ui/use-toast";
import { getApiErrorMessage } from "../store/api/baseApi";
import {
  MapPin,
  FileText,
  Phone,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";



const CreateComplaint: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    title,
    description: "",
    type: "",
    priority: "MEDIUM",
    area: "",
    landmark: "",
    address: "",
    contactName: user?.fullName || "",
    contactEmail: user?.email || "",
    contactPhone: user?.phoneNumber || "",
    isAnonymous,
  });

  const [errors, setErrors] = useState>({});

  // Fetch complaint types
  const { data, isLoading: typesLoading } =
    useGetComplaintTypesQuery();
  const complaintTypes = Array.isArray(typesResponse?.data) ? typesResponse.data : [];

  // Create complaint mutation
  const [createComplaint, { isLoading: isCreating }] =
    useCreateComplaintMutation();

  const handleInputChange = (field,
    value,
  ) => {
    setFormData((prev) => ({ ...prev, [field]));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]));
    }
  };

  const validateForm = () => {
    const newErrors: Partial = {};

    if (formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (formData.type) {
      newErrors.type = "Complaint type is required";
    }
    if (formData.area.trim()) {
      newErrors.area = "Area is required";
    }
    if (formData.contactPhone.trim()) {
      newErrors.contactPhone = "Contact phone is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      toast({
        title,
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createComplaint({
        title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        wardId: user?.wardId || "default-ward", // This should be determined by area/location
        area: formData.area,
        landmark: formData.landmark || undefined,
        address: formData.address || undefined,
        contactName: formData.isAnonymous ? undefined : formData.contactName,
        contactEmail: formData.isAnonymous ? undefined : formData.contactEmail,
        contactPhone: formData.contactPhone,
        isAnonymous: formData.isAnonymous,
      }).unwrap();

      toast({
        title,
        description: "Your complaint has been successfully registered.",
      });

      // Navigate to complaint details
      navigate(`/complaints/${result.data.id}`);
    } catch (error) {
      console.error("Create complaint error, error);
      toast({
        title,
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  if (isAuthenticated) {
    return (
      
        
        
          Authentication Required
        
        
          Please log in to submit a complaint.
        
         navigate("/login")}>Go to Login
      
    );
  }

  return (
    
      {/* Header */}
      
         navigate("/dashboard")}
        >
          
          Back to Dashboard
        
        
          
            Register New Complaint
          
          
            Submit a complaint to get it resolved quickly
          
        
      

      
        {/* Complaint Details */}
        
          
            
              
              Complaint Details
            
          
          
            
              
                Complaint Type *
                 handleInputChange("type", value)}
                >
                  
                    
                  
                  
                    {typesLoading ? (
                      
                        Loading...
                      
                    ) : (
                      complaintTypes.map((type) => (
                        
                          {type.name}
                        
                      ))
                    )}
                  
                
                {errors.type && (
                  {errors.type}
                )}
              

              
                Priority
                
                    handleInputChange("priority", value)
                  }
                >
                  
                    
                  
                  
                    Low
                    Medium
                    High
                    Critical
                  
                
              
            

            
              Title (Optional)
               handleInputChange("title", e.target.value)}
                placeholder="Brief title for your complaint"
              />
            

            
              Description *
              
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your complaint in detail..."
                rows={4}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                {errors.description}
              )}
            
          
        

        {/* Location Details */}
        
          
            
              
              Location Details
            
          
          
            
              
                Area/Locality *
                 handleInputChange("area", e.target.value)}
                  placeholder="e.g., Fort Kochi, Mattancherry"
                  className={errors.area ? "border-red-500" : ""}
                />
                {errors.area && (
                  {errors.area}
                )}
              

              
                Landmark
                
                    handleInputChange("landmark", e.target.value)
                  }
                  placeholder="Nearby landmark (optional)"
                />
              
            

            
              Complete Address
               handleInputChange("address", e.target.value)}
                placeholder="Complete address (optional)"
                rows={2}
              />
            
          
        

        {/* Contact Information */}
        
          
            
              
              Contact Information
            
          
          
            
              
                  handleInputChange("isAnonymous", checked)
                }
              />
              Submit anonymously
            

            
              
                Name
                
                    handleInputChange("contactName", e.target.value)
                  }
                  placeholder="Your name"
                  disabled={formData.isAnonymous}
                />
              

              
                Email
                
                    handleInputChange("contactEmail", e.target.value)
                  }
                  placeholder="your.email@example.com"
                  disabled={formData.isAnonymous}
                />
              

              
                Phone Number *
                
                    handleInputChange("contactPhone", e.target.value)
                  }
                  placeholder="Your phone number"
                  className={errors.contactPhone ? "border-red-500" : ""}
                />
                {errors.contactPhone && (
                  {errors.contactPhone}
                )}
              
            
          
        

        {/* Submit Buttons */}
        
           navigate("/dashboard")}
          >
            Cancel
          
          
            {isCreating ? (
              
                
                Submitting...
              
            ) : (
              
                
                Submit Complaint
              
            )}
          
        
      
    
  );
};

export default CreateComplaint;
