import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import { useCreateComplaintMutation } from "../store/api/complaintsApi";

// Define complaint types and priorities as constants
const ComplaintTypes = {
  WATER_SUPPLY: "WATER_SUPPLY",
  ELECTRICITY: "ELECTRICITY",
  ROAD_REPAIR: "ROAD_REPAIR",
  GARBAGE_COLLECTION: "GARBAGE_COLLECTION",
  STREET_LIGHTING: "STREET_LIGHTING",
  SEWERAGE: "SEWERAGE",
  PUBLIC_HEALTH: "PUBLIC_HEALTH",
  TRAFFIC: "TRAFFIC",
  OTHERS: "OTHERS"
};

const Priorities = {
  LOW: "LOW",
  MEDIUM: "MEDIUM", 
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
};

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

const QuickComplaintForm = ({ onSuccess, onClose }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.complaints);
  const { translations } = useAppSelector((state) => state.language);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { complaintTypeOptions } = useComplaintTypes();
  
  const {
    data: wardsResponse,
    isLoading: isWardsLoading,
    error: wardsError,
  } = useGetWardsQuery();

  const [createComplaintMutation] = useCreateComplaintMutation();

  // Form state
  const [formData, setFormData] = useState({
    mobile: "",
    email: "",
    problemType: "",
    ward: "",
    subZoneId: "",
    area: "",
    location: "",
    address: "",
    description: "",
    coordinates: null,
  });

  const [attachments, setAttachments] = useState([]);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        mobile: user.mobile || "",
        email: user.email || "",
      }));
    }
  }, [isAuthenticated, user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleLocationSelect = (coordinates) => {
    setFormData(prev => ({ ...prev, coordinates }));
    setIsLocationDialogOpen(false);
  };

  const handleFileAttach = (event) => {
    const files = Array.from(event.target.files || []);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.mobile?.trim()) newErrors.mobile = "Mobile number is required";
    if (!formData.email?.trim()) newErrors.email = "Email is required";
    if (!formData.problemType) newErrors.problemType = "Problem type is required";
    if (!formData.ward) newErrors.ward = "Ward is required";
    if (!formData.description?.trim()) newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const complaintData = {
        ...formData,
        attachments: attachments.map(att => att.file),
      };

      const result = await createComplaintMutation(complaintData).unwrap();
      
      toast({
        title: "Success",
        description: "Complaint submitted successfully!",
        variant: "default",
      });

      if (onSuccess) {
        onSuccess(result.id);
      }
      
      // Reset form
      setFormData({
        mobile: "",
        email: "",
        problemType: "",
        ward: "",
        subZoneId: "",
        area: "",
        location: "",
        address: "",
        description: "",
        coordinates: null,
      });
      setAttachments([]);
      
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit complaint. Please try again.",
        variant: "destructive",
      });
    }
  };

  const wards = wardsResponse?.data || [];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quick Complaint Form</span>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
                className={errors.mobile ? "border-red-500" : ""}
              />
              {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Problem Type */}
          <div>
            <Label htmlFor="problemType">Problem Type *</Label>
            <Select value={formData.problemType} onValueChange={(value) => handleInputChange("problemType", value)}>
              <SelectTrigger className={errors.problemType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select problem type" />
              </SelectTrigger>
              <SelectContent>
                {complaintTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.problemType && <p className="text-red-500 text-sm mt-1">{errors.problemType}</p>}
          </div>

          {/* Ward */}
          <div>
            <Label htmlFor="ward">Ward *</Label>
            <Select value={formData.ward} onValueChange={(value) => handleInputChange("ward", value)}>
              <SelectTrigger className={errors.ward ? "border-red-500" : ""}>
                <SelectValue placeholder="Select ward" />
              </SelectTrigger>
              <SelectContent>
                {wards.map((ward) => (
                  <SelectItem key={ward.id} value={ward.id.toString()}>
                    {ward.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.ward && <p className="text-red-500 text-sm mt-1">{errors.ward}</p>}
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <div className="flex gap-2">
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Enter location or use map"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLocationDialogOpen(true)}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={errors.description ? "border-red-500" : ""}
              placeholder="Describe the problem in detail..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* File Attachments */}
          <div>
            <Label>Attachments</Label>
            <div className="space-y-2">
              <Input
                type="file"
                multiple
                onChange={handleFileAttach}
                accept="image/*,.pdf,.doc,.docx"
              />
              {attachments.length > 0 && (
                <div className="space-y-1">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{attachment.file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Submitting..." : "Submit Complaint"}
            </Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>

      {/* Location Dialog */}
      <SimpleLocationMapDialog
        isOpen={isLocationDialogOpen}
        onClose={() => setIsLocationDialogOpen(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={formData.coordinates}
      />
    </Card>
  );
};

export default QuickComplaintForm;
