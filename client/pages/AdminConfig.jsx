import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
import { getApiErrorMessage } from "../store/api/baseApi";
import {
  useGetComplaintTypesQuery,
  useCreateComplaintTypeMutation,
  useUpdateComplaintTypeMutation,
  useDeleteComplaintTypeMutation,
} from "../store/api/complaintTypesApi";
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
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import {
  Settings,
  MapPin,
  FileText,
  Users,
  Clock,
  Mail,
  Phone,
  Database,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Globe,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

;
}







const AdminConfig: React.FC = () => {
  const dispatch = useAppDispatch();
  const { translations } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);

  // Get URL parameters for tab navigation
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "wards";

  // API queries
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetComplaintTypesQuery();
  const [createComplaintType] = useCreateComplaintTypeMutation();
  const [updateComplaintType] = useUpdateComplaintTypeMutation();
  const [deleteComplaintType] = useDeleteComplaintTypeMutation();

  // State management
  const [wards, setWards] = useState([]);
  const [systemSettings, setSystemSettings] = useState([]);
  const [editingWard, setEditingWard] = useState(null);
  const [editingSubZone, setEditingSubZone] = useState(null);
  const [editingComplaintType, setEditingComplaintType] =
    useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isWardDialogOpen, setIsWardDialogOpen] = useState(false);
  const [isSubZoneDialogOpen, setIsSubZoneDialogOpen] = useState(false);
  const [isComplaintTypeDialogOpen, setIsComplaintTypeDialogOpen] =
    useState(false);
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState(
    null,
  );
  const [expandedWards, setExpandedWards] = useState>(new Set());
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploadMode, setLogoUploadMode] = useState("url");
  const [logoPreview, setLogoPreview] = useState(null);

  // Reset logo upload state
  const resetLogoUploadState = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUploadMode("url");
  };

  // API calls
  const apiCall = async (url, options = {}) => {
    const token = localStorage.getItem("token");

    console.log(`[AdminConfig] Making API call to);

    const response = await fetch(`/api${url}`, {
      ...options,
      headers,
        ...(token && { Authorization),
        ...options.headers,
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    console.log(`[AdminConfig] Response for ${url}, {
      status: response.status,
      statusText: response.statusText,
      contentType,
      isJson,
    });

    if (response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      if (isJson) {
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
          console.log(`[AdminConfig] Error response for ${url}, error);
        } catch {
          // Failed to parse JSON error response
          console.log(
            `[AdminConfig] Failed to parse JSON error response for ${url}`,
          );
        }
      } else {
        // Non-JSON response (likely HTML error page)
        const text = await response.text();
        console.log(`[AdminConfig] Non-JSON error response for ${url},
          text.substring(0, 200),
        );
        if (text.includes(" {
    // Check if user is authenticated and has admin role
    if (user) {
      dispatch(
        showErrorToast(
          "Authentication Required",
          "Please log in to access this page.",
        ),
      );
      setDataLoading(false);
      return;
    }

    if (user.role == "ADMINISTRATOR") {
      dispatch(
        showErrorToast(
          "Access Denied",
          "Administrator privileges required to access this page.",
        ),
      );
      setDataLoading(false);
      return;
    }

    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setDataLoading(true);

    try {
      // Load wards (admin endpoint with flags to include isActive and subZones)
      let wardsResponse;
      try {
        wardsResponse = await apiCall("/users/wards?all=true&include=subzones");
        const wardsData = wardsResponse?.data?.wards || [];
        setWards(wardsData);
      } catch (error) {
        console.error("Failed to load wards, error);
        setWards([]);
      }

      // Complaint types are loaded via RTK Query hooks

      // Load system settings (admin-only endpoint)
      let settingsResponse;
      try {
        settingsResponse = await apiCall("/system-config");
        setSystemSettings(settingsResponse.data || []);
      } catch (error) {
        console.error("Failed to load system settings, error);
        if (
          error.message.includes("Not authorized") ||
          error.message.includes("Authentication")
        ) {
          // This is expected for non-admin users, don't show error
          setSystemSettings([]);
        } else {
          // Unexpected error, show it
          dispatch(showErrorToast(
              "Settings Load Failed",
              `Failed to load system settings,
            ),
          );
          setSystemSettings([]);
        }
      }
    } catch (error) {
      console.error("Unexpected error during data loading, error);
      dispatch(
        showErrorToast(
          "Load Failed",
          "An unexpected error occurred while loading data.",
        ),
      );
    } finally {
      setDataLoading(false);
    }
  };

  // Ward Management Functions
  const handleSaveWard = async (ward) => {
    setIsLoading(true);
    try {
      const wardData = {
        name: ward.name,
        description: ward.description,
        isActive: ward.isActive,
      };

      let response;
      if (ward.id && ward.id == "") {
        // Update existing ward
        response = await apiCall(`/users/wards/${ward.id}`, {
          method,
          body: JSON.stringify(wardData),
        });
        setWards((prev) =>
          prev.map((w) =>
            w.id === ward.id ? { ...ward, ...response.data } ,
          ),
        );
      } else {
        // Create new ward
        response = await apiCall("/users/wards", {
          method,
          body: JSON.stringify(wardData),
        });
        setWards((prev) => [...prev, response.data]);
      }

      setEditingWard(null);
      setIsWardDialogOpen(false);
      dispatch(
        showSuccessToast(
          "Ward Saved",
          `Ward "${ward.name}" has been saved successfully.`,
        ),
      );
    } catch (error) {
      dispatch(
        showErrorToast(
          "Save Failed",
          error.message || "Failed to save ward. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWard = async (wardId) => {
    if (confirm("Are you sure you want to delete this ward?")) return;

    setIsLoading(true);
    try {
      await apiCall(`/users/wards/${wardId}`, { method);
      setWards((prev) => prev.filter((w) => w.id == wardId));

      dispatch(
        showSuccessToast("Ward Deleted", "Ward has been deleted successfully."),
      );
    } catch (error) {
      dispatch(
        showErrorToast(
          "Delete Failed",
          error.message || "Failed to delete ward. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Sub-Zone Management Functions
  const handleSaveSubZone = async (subZone) => {
    setIsLoading(true);
    try {
      const subZoneData = {
        name: subZone.name,
        description: subZone.description,
        isActive: subZone.isActive,
      };

      let response;
      if (subZone.id && subZone.id == "") {
        // Update existing sub-zone
        response = await apiCall(`/users/wards/${subZone.wardId}/subzones/${subZone.id}`,
          {
            method,
            body: JSON.stringify(subZoneData),
          },
        );
      } else {
        // Create new sub-zone
        response = await apiCall(`/users/wards/${subZone.wardId}/subzones`, {
          method,
          body: JSON.stringify(subZoneData),
        });
      }

      // Update wards state to include the new/updated sub-zone
      setWards((prev) =>
        prev.map((ward) => {
          if (ward.id === subZone.wardId) {
            const updatedSubZones = subZone.id
              ? ward.subZones.map((sz) =>
                  sz.id === subZone.id ? response.data ,
                )
              : [...ward.subZones, response.data];
            return { ...ward, subZones: updatedSubZones };
          }
          return ward;
        }),
      );

      setEditingSubZone(null);
      setIsSubZoneDialogOpen(false);
      dispatch(
        showSuccessToast(
          "Sub-Zone Saved",
          `Sub-zone "${subZone.name}" has been saved successfully.`,
        ),
      );
    } catch (error) {
      dispatch(
        showErrorToast(
          "Save Failed",
          error.message || "Failed to save sub-zone. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubZone = async (wardId, subZoneId) => {
    if (confirm("Are you sure you want to delete this sub-zone?")) return;

    setIsLoading(true);
    try {
      await apiCall(`/users/wards/${wardId}/subzones/${subZoneId}`, {
        method,
      });

      // Update wards state to remove the deleted sub-zone
      setWards((prev) =>
        prev.map((ward) => {
          if (ward.id === wardId) {
            return {
              ...ward,
              subZones: ward.subZones.filter((sz) => sz.id == subZoneId),
            };
          }
          return ward;
        }),
      );

      dispatch(
        showSuccessToast(
          "Sub-Zone Deleted",
          "Sub-zone has been deleted successfully.",
        ),
      );
    } catch (error) {
      dispatch(
        showErrorToast(
          "Delete Failed",
          error.message || "Failed to delete sub-zone. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Complaint Type Management Functions
  const handleSaveComplaintType = async (type) => {
    setIsLoading(true);
    try {
      const typeData = {
        name: type.name,
        description: type.description,
        priority: type.priority,
        slaHours: type.slaHours,
        isActive: type.isActive,
      };

      console.log("Saving complaint type with data, typeData);
      console.log("Original type object, type);

      let result;
      if (type.id && type.id == "") {
        // Update existing type
        console.log("Updating existing complaint type with ID, type.id);
        result = await updateComplaintType({
          id,
          data,
        }).unwrap();
        console.log("Update result, result);
      } else {
        // Create new type
        console.log("Creating new complaint type");
        result = await createComplaintType(typeData).unwrap();
        console.log("Create result, result);
      }

      setEditingComplaintType(null);
      setIsComplaintTypeDialogOpen(false);

      // Force a refetch to ensure UI is updated
      await refetchComplaintTypes();

      dispatch(showSuccessToast(
          "Complaint Type Saved",
          `Complaint type "${type.name}" has been saved successfully. Active status,
        ),
      );
    } catch (error) {
      console.error("Error saving complaint type, error);
      console.error("Error details, {
        status: error?.status,
        data: error?.data,
        message: error?.message,
        fullError,
      });

      const errorMessage = getApiErrorMessage(error);
      console.log("Extracted error message, errorMessage);

      dispatch(showErrorToast("Error saving complaint type", errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  // Quick toggle for active status
  const handleToggleComplaintTypeStatus = async (type) => {
    try {
      const updatedData = {
        name: type.name,
        description: type.description,
        priority: type.priority,
        slaHours: type.slaHours,
        isActive: type.isActive, // Toggle the status
      };

      console.log(`Toggling complaint type ${type.name} to ${type.isActive ? "Active" ,
      );

      await updateComplaintType({
        id,
        data,
      }).unwrap();

      // Force a refetch to ensure UI is updated
      await refetchComplaintTypes();

      dispatch(showSuccessToast(
          "Status Updated",
          `${type.name} is now ${type.isActive ? "Active" ,
        ),
      );
    } catch (error) {
      console.error("Error toggling complaint type status, error);

      const errorMessage = getApiErrorMessage(error);

      dispatch(showErrorToast("Update Failed", errorMessage));
    }
  };

  const handleDeleteComplaintType = async (typeId) => {
    if (confirm("Are you sure you want to delete this complaint type?"))
      return;

    setIsLoading(true);
    try {
      await deleteComplaintType(typeId).unwrap();

      dispatch(
        showSuccessToast(
          "Complaint Type Deleted",
          "Complaint type has been deleted successfully.",
        ),
      );
    } catch (error) {
      dispatch(
        showErrorToast(
          "Delete Failed",
          error.message || "Failed to delete complaint type. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // System Settings Functions
  const handleUpdateSystemSetting = async (key, value) => {
    setIsLoading(true);
    try {
      const response = await apiCall(`/system-config/${key}`, {
        method,
        body: JSON.stringify({ value }),
      });

      setSystemSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value } )),
      );

      dispatch(
        showSuccessToast(
          "Setting Updated",
          `System setting "${key}" has been updated.`,
        ),
      );
    } catch (error) {
      dispatch(
        showErrorToast(
          "Update Failed",
          error.message || "Failed to update system setting. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Logo File Upload
  const handleLogoFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/uploads/logo", {
        method,
        headers: {
          ...(token && { Authorization),
        },
        body,
      });

      if (response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await response.json();

      // Update the APP_LOGO_URL setting with the new file URL
      const logoSetting = systemSettings.find((s) => s.key === "APP_LOGO_URL");
      if (logoSetting) {
        const updatedSetting = { ...logoSetting, value: data.data.url };
        await handleSaveSystemSetting(updatedSetting);
      }

      return data.data.url;
    } catch (error) {
      throw error;
    }
  };

  const handleSaveSystemSetting = async (setting) => {
    setIsLoading(true);
    try {
      const settingData = {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        type: setting.type,
      };

      let response;
      const existingSetting = systemSettings.find((s) => s.key === setting.key);

      if (existingSetting) {
        // Update existing setting
        response = await apiCall(`/system-config/${setting.key}`, {
          method,
          body: JSON.stringify({
            value,
            description: setting.description,
          }),
        });
        setSystemSettings((prev) =>
          prev.map((s) =>
            s.key === setting.key ? { ...setting, ...response.data } ,
          ),
        );
      } else {
        // Create new setting
        response = await apiCall("/system-config", {
          method,
          body: JSON.stringify(settingData),
        });
        setSystemSettings((prev) => [...prev, response.data]);
      }

      setEditingSetting(null);
      setIsSettingDialogOpen(false);
      dispatch(
        showSuccessToast(
          "Setting Saved",
          `System setting "${setting.key}" has been saved successfully.`,
        ),
      );
    } catch (error) {
      dispatch(
        showErrorToast(
          "Save Failed",
          error.message || "Failed to save system setting. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSystemSetting = async (key) => {
    if (confirm("Are you sure you want to delete this system setting?"))
      return;

    setIsLoading(true);
    try {
      await apiCall(`/system-config/${key}`, { method);
      setSystemSettings((prev) => prev.filter((s) => s.key == key));

      dispatch(
        showSuccessToast(
          "Setting Deleted",
          "System setting has been deleted successfully.",
        ),
      );
    } catch (error) {
      dispatch(
        showErrorToast(
          "Delete Failed",
          error.message || "Failed to delete system setting. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleWardExpansion = (wardId) => {
    setExpandedWards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(wardId)) {
        newSet.delete(wardId);
      } else {
        newSet.add(wardId);
      }
      return newSet;
    });
  };

  if (user) {
    return (
      
        
          
          
            Authentication Required
          
          
            Please log in to access the system configuration.
          
        
      
    );
  }

  if (user.role == "ADMINISTRATOR") {
    return (
      
        
          
          Access Denied
          
            Administrator privileges required to access this page.
          
        
      
    );
  }

  if (dataLoading) {
    return (
      
        
        Loading configuration data...
      
    );
  }

  return ({/* Header */}
      
        System Configuration
        
          Manage wards, complaint types, system settings, and administrative
          controls
        
      

      {/* Configuration Tabs */}
      
        
          Wards & Zones
          Complaint Types
          System Settings
          {/* Advanced */}
        

        {/* Ward Management */}
        
          
            
              
                
                  
                  Ward Management
                
                 {
                    setEditingWard({
                      id,
                      name: "",
                      description: "",
                      isActive,
                      subZones: [],
                    });
                    setIsWardDialogOpen(true);
                  }}
                >
                  
                  Add Ward
                
              
            
            
              
                {wards.map((ward) => (
                  
                    
                      
                        
                           toggleWardExpansion(ward.id)}
                          >
                            {expandedWards.has(ward.id) ? (
                              
                            ) : (
                              
                            )}
                          
                          
                            {ward.name}
                            
                              {ward.description}
                            
                          
                        
                        
                          
                            {ward.subZones?.length || 0} zones
                          
                          
                            {ward.isActive ? "Active" : "Inactive"}
                          
                           {
                              setEditingWard(ward);
                              setIsWardDialogOpen(true);
                            }}
                          >
                            
                          
                           handleDeleteWard(ward.id)}
                            disabled={isLoading}
                          >
                            
                          
                        
                      

                      {/* Sub-zones */}
                      {expandedWards.has(ward.id) && (Sub-Zones
                             {
                                setEditingSubZone({
                                  id,
                                  name: "",
                                  wardId: ward.id,
                                  description: "",
                                  isActive,
                                });
                                setIsSubZoneDialogOpen(true);
                              }}
                            >
                              
                              Add Sub-Zone
                            
                          
                          
                            {ward.subZones?.map((subZone) => ({subZone.name}
                                  
                                  
                                    {subZone.description}
                                  
                                
                                
                                  
                                    {subZone.isActive ? "Active" );
                                      setIsSubZoneDialogOpen(true);
                                    }}
                                  >
                                    
                                  
                                  
                                      handleDeleteSubZone(ward.id, subZone.id)
                                    }
                                    disabled={isLoading}
                                  >
                                    
                                  
                                
                              
                            )) || (
                              
                                No sub-zones defined
                              
                            )}
                          
                        
                      )}
                    
                  
                ))}
              
            
          
        

        {/* Complaint Types Management */}
        
          
            
              
                
                  
                  Complaint Type Management
                
                
                   refetchComplaintTypes()}
                    size="sm"
                  >
                    
                    Refresh
                  
                   {
                      setEditingComplaintType({
                        id,
                        name: "",
                        description: "",
                        priority: "MEDIUM",
                        slaHours,
                        isActive,
                      });
                      setIsComplaintTypeDialogOpen(true);
                    }}
                  >
                    
                    Add Type
                  
                
              
            
            
              
                
                  
                    Type Name
                    Description
                    Priority
                    SLA (Hours)
                    Status
                    Actions
                  
                
                
                  {complaintTypesLoading ? (
                    
                      
                        
                        Loading complaint types...
                      
                    
                  ) : complaintTypesError ? (
                    
                      
                        Failed to load complaint types. Please try again.
                      
                    
                  ) : complaintTypesResponse?.data?.length ? (
                    complaintTypesResponse.data.map((type) => ({type.name}
                        
                        {type.description}
                        
                          
                            {type.priority}
                          
                        
                        {type.slaHours}h
                        
                          
                            
                              {type.isActive ? "Active" )
                              }
                              disabled={isLoading}
                              className="h-6 w-6 p-0"
                              title={`Make ${type.isActive ? "Inactive" : "Active"}`}
                            >
                              
                            
                          
                        
                        
                          
                             {
                                setEditingComplaintType(type);
                                setIsComplaintTypeDialogOpen(true);
                              }}
                            >
                              
                            
                             handleDeleteComplaintType(type.id)}
                              disabled={isLoading}
                            >
                              
                            
                          
                        
                      
                    ))
                  ) : (
                    
                      
                        No complaint types found. Create one to get started.
                      
                    
                  )}
                
              
            
          
        

        {/* System Settings */}
        
          
            
              
                
                  
                  System Settings
                
                 {
                    setEditingSetting({
                      key,
                      value: "",
                      description: "",
                      type: "string",
                    });
                    setIsSettingDialogOpen(true);
                  }}
                >
                  
                  Add Setting
                
              
            
            
              
                {/* Application Settings */}
                
                  
                    
                    Application Settings
                  
                  
                    {systemSettings
                      .filter((s) =>
                        ["APP_NAME", "APP_LOGO_URL", "APP_LOGO_SIZE"].includes(
                          s.key,
                        ),
                      )
                      .map((setting) => (
                        
                          
                            
                              {setting.key}
                              
                                {setting.description}
                              
                            
                            
                              {setting.type}
                               {
                                  setEditingSetting(setting);
                                  setIsSettingDialogOpen(true);
                                }}
                              >
                                
                              
                            
                          
                          
                            
                                setSystemSettings((prev) =>
                                  prev.map((s) =>
                                    s.key === setting.key
                                      ? { ...s, value: e.target.value }
                                      ,
                                  ),
                                )
                              }
                              onBlur={(e) =>
                                handleUpdateSystemSetting(
                                  setting.key,
                                  e.target.value,
                                )
                              }
                              placeholder={`Enter ${setting.type} value`}
                              className="max-w-md"
                            />
                          
                        
                      ))}
                  
                

                {/* Complaint ID Configuration */}
                
                  
                    
                    Complaint ID Configuration
                  
                  
                    {systemSettings
                      .filter((s) => s.key.startsWith("COMPLAINT_ID"))
                      .map((setting) => (
                        
                          
                            
                              {setting.key}
                              
                                {setting.description}
                              
                            
                            
                              {setting.type}
                               {
                                  setEditingSetting(setting);
                                  setIsSettingDialogOpen(true);
                                }}
                              >
                                
                              
                            
                          
                          
                            
                                setSystemSettings((prev) =>
                                  prev.map((s) =>
                                    s.key === setting.key
                                      ? { ...s, value: e.target.value }
                                      ,
                                  ),
                                )
                              }
                              onBlur={(e) =>
                                handleUpdateSystemSetting(
                                  setting.key,
                                  e.target.value,
                                )
                              }
                              placeholder={`Enter ${setting.type} value`}
                              className="max-w-md"
                            />
                          
                        
                      ))}
                    
                      
                        
                        
                          
                            Complaint ID Preview
                          
                          
                            With current settings, new complaint IDs will look
                            like:
                            
                              {systemSettings.find(
                                (s) => s.key === "COMPLAINT_ID_PREFIX",
                              )?.value || "KSC"}
                              {(
                                parseInt(
                                  systemSettings.find(
                                    (s) =>
                                      s.key === "COMPLAINT_ID_START_NUMBER",
                                  )?.value,
                                ) || 1
                              )
                                .toString()
                                .padStart(
                                  parseInt(
                                    systemSettings.find(
                                      (s) => s.key === "COMPLAINT_ID_LENGTH",
                                    )?.value,
                                  ) || 4,
                                  "0",
                                )}
                            
                          
                        
                      
                    
                  
                

                {/* Complaint Management Settings */}
                
                  
                    
                    Complaint Management
                  
                  
                    {systemSettings
                      .filter((s) => s.key === "AUTO_ASSIGN_COMPLAINTS")
                      .map((setting) => (
                        
                          
                            
                              
                                Auto-Assign Complaints
                              
                              
                                When enabled, complaints will be automatically
                                assigned to Ward Officers based on the ward
                                location
                              
                            
                            
                              {setting.type}
                               {
                                  setEditingSetting(setting);
                                  setIsSettingDialogOpen(true);
                                }}
                              >
                                
                              
                            
                          
                          
                             {
                                setSystemSettings((prev) =>
                                  prev.map((s) =>
                                    s.key === setting.key
                                      ? { ...s, value: value }
                                      ,
                                  ),
                                );
                                handleUpdateSystemSetting(setting.key, value);
                              }}
                            >
                              
                                
                              
                              
                                Enabled
                                Disabled
                              
                            
                          
                        
                      ))}

                    {/* Auto-assign info card */}
                    
                      
                        
                        
                          
                            How Auto-Assignment Works
                          
                          
                            
                              • When a complaint is submitted by a citizen, it
                              gets automatically assigned to a Ward Officer in
                              that ward
                            
                            
                              • When an admin creates a complaint, it also gets
                              auto-assigned to the respective Ward Officer
                            
                            
                              • If disabled, complaints remain in "Registered"
                              status until manually assigned
                            
                            
                              • Ward Officers can then assign complaints to
                              Maintenance Team members
                            
                          
                        
                      
                    
                  
                

                {/* Contact Information Settings */}
                
                  
                    
                    Contact Information
                  
                  
                    {systemSettings
                      .filter((s) => s.key.startsWith("CONTACT_"))
                      .map((setting) => (
                        
                          
                            
                              {setting.key}
                              
                                {setting.description}
                              
                            
                            
                              {setting.type}
                               {
                                  setEditingSetting(setting);
                                  setIsSettingDialogOpen(true);
                                }}
                              >
                                
                              
                            
                          
                          
                            
                                setSystemSettings((prev) =>
                                  prev.map((s) =>
                                    s.key === setting.key
                                      ? { ...s, value: e.target.value }
                                      ,
                                  ),
                                )
                              }
                              onBlur={(e) =>
                                handleUpdateSystemSetting(
                                  setting.key,
                                  e.target.value,
                                )
                              }
                              placeholder={`Enter ${setting.type} value`}
                              className="max-w-md"
                            />
                          
                        
                      ))}
                  
                

                {/* Other Settings */}
                
                  
                    
                    Other Settings
                  
                  
                    {systemSettings
                      .filter(
                        (s) =>
                          [
                            "APP_NAME",
                            "APP_LOGO_URL",
                            "APP_LOGO_SIZE",
                          ].includes(s.key) &&
                          s.key.startsWith("COMPLAINT_ID") &&
                          s.key.startsWith("CONTACT_"),
                      )
                      .map((setting) => (
                        
                          
                            
                              {setting.key}
                              
                                {setting.description}
                              
                            
                            
                              {setting.type}
                               {
                                  setEditingSetting(setting);
                                  setIsSettingDialogOpen(true);
                                }}
                              >
                                
                              
                              
                                  handleDeleteSystemSetting(setting.key)
                                }
                                disabled={isLoading}
                              >
                                
                              
                            
                          
                          
                            {setting.type === "boolean" ? (
                              
                                  handleUpdateSystemSetting(setting.key, value)
                                }
                              >
                                
                                  
                                
                                
                                  True
                                  False
                                
                              
                            ) : setting.type === "json" ? (
                              
                                  setSystemSettings((prev) =>
                                    prev.map((s) =>
                                      s.key === setting.key
                                        ? { ...s, value: e.target.value }
                                        ,
                                    ),
                                  )
                                }
                                onBlur={(e) =>
                                  handleUpdateSystemSetting(
                                    setting.key,
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter JSON value"
                                rows={3}
                              />
                            ) : (
                              
                                  setSystemSettings((prev) =>
                                    prev.map((s) =>
                                      s.key === setting.key
                                        ? { ...s, value: e.target.value }
                                        ,
                                    ),
                                  )
                                }
                                onBlur={(e) =>
                                  handleUpdateSystemSetting(
                                    setting.key,
                                    e.target.value,
                                  )
                                }
                                placeholder={`Enter ${setting.type} value`}
                                className="max-w-md"
                              />
                            )}
                          
                        
                      ))}
                  
                
              
            
          
        

        {/* Advanced Settings */}
        
          
            
              
                
                  
                  Database Management
                
              
              
                
                  
                  Backup Database
                
                
                  
                  Restore Database
                
                
                  
                  Optimize Tables
                
              
            

            
              
                
                  
                  Security Settings
                
              
              
                
                  
                  Password Policies
                
                
                  
                  Session Management
                
                
                  
                  Security Logs
                
              
            

            
              
                
                  
                  Email Configuration
                
              
              
                
                  
                  SMTP Settings
                
                
                  
                  Email Templates
                
                
                  
                  Test Email
                
              
            

            
              
                
                  
                  System Information
                
              
              
                
                  
                    Version: 1.0.0
                  
                  
                    Environment: Production
                  
                  
                    Uptime: 7 days
                  
                
                
                  
                  Refresh Data
                
              
            
          
        
      

      {/* Ward Dialog */}
      
        
          
            
              {editingWard?.id ? "Edit Ward" : "Add New Ward"}
            
          
          {editingWard && (Ward Name
                
                    setEditingWard({
                      ...editingWard,
                      name,
                    })
                  }
                  placeholder="Enter ward name"
                />
              
              
                Description
                
                    setEditingWard({
                      ...editingWard,
                      description,
                    })
                  }
                  placeholder="Enter ward description"
                />
              
              
                
                    setEditingWard({
                      ...editingWard,
                      isActive,
                    })
                  }
                />
                Active
              
              
                 {
                    setEditingWard(null);
                    setIsWardDialogOpen(false);
                  }}
                >
                  Cancel
                
                 handleSaveWard(editingWard)}
                  disabled={isLoading || editingWard.name}
                >
                  {isLoading ? (
                    
                  ) : (
                    
                  )}
                  Save
                
              
            
          )}
        
      

      {/* Sub-Zone Dialog */}
      
        
          
            
              {editingSubZone?.id ? "Edit Sub-Zone" : "Add New Sub-Zone"}
            
          
          {editingSubZone && (Sub-Zone Name
                
                    setEditingSubZone({
                      ...editingSubZone,
                      name,
                    })
                  }
                  placeholder="Enter sub-zone name"
                />
              
              
                Description
                
                    setEditingSubZone({
                      ...editingSubZone,
                      description,
                    })
                  }
                  placeholder="Enter sub-zone description"
                />
              
              
                
                    setEditingSubZone({
                      ...editingSubZone,
                      isActive,
                    })
                  }
                />
                Active
              
              
                 {
                    setEditingSubZone(null);
                    setIsSubZoneDialogOpen(false);
                  }}
                >
                  Cancel
                
                 handleSaveSubZone(editingSubZone)}
                  disabled={isLoading || editingSubZone.name}
                >
                  {isLoading ? (
                    
                  ) : (
                    
                  )}
                  Save
                
              
            
          )}
        
      

      {/* Complaint Type Dialog */}
      
        
          
            
              {editingComplaintType?.id
                ? "Edit Complaint Type"
                : "Add New Complaint Type"}
            
          
          {editingComplaintType && (Type Name
                
                    setEditingComplaintType({
                      ...editingComplaintType,
                      name,
                    })
                  }
                  placeholder="Enter complaint type name"
                />
              
              
                Description
                
                    setEditingComplaintType({
                      ...editingComplaintType,
                      description,
                    })
                  }
                  placeholder="Enter type description"
                />
              
              
                Priority
                
                    setEditingComplaintType({
                      ...editingComplaintType,
                      priority,
                    })
                  }
                >
                  
                    
                  
                  
                    Low
                    Medium
                    High
                    Critical
                  
                
              
              
                SLA Hours
                 {
                    const value = e.target.value;
                    const numValue = value === "" ? 48 : parseInt(value, 10);
                    setEditingComplaintType({
                      ...editingComplaintType,
                      slaHours) ? 48 ,
                    });
                  }}
                  placeholder="Enter SLA hours"
                  min="1"
                />
              
              
                
                    setEditingComplaintType({
                      ...editingComplaintType,
                      isActive,
                    })
                  }
                />
                Active
              
              
                 {
                    setEditingComplaintType(null);
                    setIsComplaintTypeDialogOpen(false);
                  }}
                >
                  Cancel
                
                 handleSaveComplaintType(editingComplaintType)}
                  disabled={isLoading || editingComplaintType.name}
                >
                  {isLoading ? (
                    
                  ) : (
                    
                  )}
                  Save
                
              
            
          )}
        
      

      {/* System Setting Dialog */}
      
        
          
            
              {editingSetting?.key &&
              systemSettings.find((s) => s.key === editingSetting.key)
                ? "Edit System Setting"
                : "Add New System Setting"}
            
          
          {editingSetting && (Setting Key
                
                    setEditingSetting({
                      ...editingSetting,
                      key)
                        .replace(/[^A-Z0-9_]/g, "_"),
                    })
                  }
                  placeholder="SETTING_KEY"
                  disabled={
                    systemSettings.find((s) => s.key === editingSetting.key)
                  }
                />
              
              
                Value
                {editingSetting.key === "APP_LOGO_URL" ? (
                  
                    {/* Mode Selection */}
                    
                      
                        
                            setLogoUploadMode(e.target.value as "url" | "file")
                          }
                          className="form-radio"
                        />
                        URL
                      
                      
                        
                            setLogoUploadMode(e.target.value as "url" | "file")
                          }
                          className="form-radio"
                        />
                        Upload File
                      
                    

                    {logoUploadMode === "url" ? (setEditingSetting({
                            ...editingSetting,
                            value,
                          })
                        }
                        placeholder="Enter logo URL (e.g., https)"
                      />
                    ) : (
                      
                         {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLogoFile(file);
                              // Create preview
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setLogoPreview(e.target?.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {logoPreview && (
                          
                            
                          
                        )}
                      
                    )}

                    {/* Current logo preview */}
                    {editingSetting.value &&
                      editingSetting.value == "/logo.png" && (Current Logo).style.display =
                                "none";
                            }}
                          />
                        
                      )}
                  
                ) : editingSetting.key === "APP_LOGO_SIZE" ? (
                  
                      setEditingSetting({
                        ...editingSetting,
                        value,
                      })
                    }
                  >
                    
                      
                    
                    
                      Small
                      Medium
                      Large
                    
                  
                ) : (setEditingSetting({
                        ...editingSetting,
                        value,
                      })
                    }
                    placeholder="Setting value"
                  />
                )}
              
              
                Description
                
                    setEditingSetting({
                      ...editingSetting,
                      description,
                    })
                  }
                  placeholder="Setting description"
                />
              
              
                Type
                
                    setEditingSetting({
                      ...editingSetting,
                      type,
                    })
                  }
                >
                  
                    
                  
                  
                    String
                    Number
                    Boolean
                    JSON
                  
                
              
              
                 {
                    setEditingSetting(null);
                    setIsSettingDialogOpen(false);
                    resetLogoUploadState();
                  }}
                >
                  Cancel
                
                 {
                    if (
                      editingSetting.key === "APP_LOGO_URL" &&
                      logoUploadMode === "file" &&
                      logoFile
                    ) {
                      try {
                        setIsLoading(true);
                        await handleLogoFileUpload(logoFile);
                        // Reset file upload state
                        setLogoFile(null);
                        setLogoPreview(null);
                        setLogoUploadMode("url");
                        setEditingSetting(null);
                        setIsSettingDialogOpen(false);
                        dispatch(
                          showSuccessToast(
                            "Logo Uploaded",
                            "App logo has been uploaded and updated successfully.",
                          ),
                        );
                        // Refresh system settings
                        await fetchSystemSettings();
                      } catch (error) {
                        dispatch(
                          showErrorToast(
                            "Upload Failed",
                            error.message ||
                              "Failed to upload logo. Please try again.",
                          ),
                        );
                      } finally {
                        setIsLoading(false);
                      }
                    } else {
                      await handleSaveSystemSetting(editingSetting);
                    }
                  }}
                  disabled={
                    isLoading ||
                    editingSetting.key ||
                    (logoUploadMode === "file" &&
                    editingSetting.key === "APP_LOGO_URL"
                      ? logoFile
                      )
                  }
                >
                  {isLoading ? (
                    
                  ) : (
                    
                  )}
                  Save
                
              
            
          )}
        
      
    
  );
};

export default AdminConfig;
