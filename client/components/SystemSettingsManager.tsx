import React, { useState, useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
import {
  useGetAllSystemConfigQuery,
  useUpdateSystemConfigMutation,
  useBulkUpdateSystemConfigMutation,
  SystemConfigItem,
} from "../store/api/systemConfigApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Settings,
  Map,
  Phone,
  FileText,
  Database,
  Save,
  RefreshCw,
  Globe,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Search,
  MessageSquare,
} from "lucide-react";

interface ConfigSection {
  title: string;
  icon: React.ReactNode;
  description: string;
  keys: string[];
}

const CONFIG_SECTIONS: ConfigSection[] = [
  {
    title: "Application Settings",
    icon: <Globe className="h-5 w-5" />,
    description: "Application branding and general settings",
    keys: [
      "APP_NAME",
      "APP_LOGO_URL",
      "APP_LOGO_SIZE",
      "ADMIN_EMAIL",
    ],
  },
  {
    title: "Complaint Management",
    icon: <FileText className="h-5 w-5" />,
    description: "Complaint submission and management settings",
    keys: [
      "COMPLAINT_ID_PREFIX",
      "COMPLAINT_ID_START_NUMBER",
      "COMPLAINT_ID_LENGTH",
      "COMPLAINT_PHOTO_MAX_SIZE",
      "COMPLAINT_PHOTO_MAX_COUNT",
      "CITIZEN_DAILY_COMPLAINT_LIMIT",
      "CITIZEN_DAILY_COMPLAINT_LIMIT_ENABLED",
      "GUEST_COMPLAINT_ENABLED",
      "DEFAULT_SLA_HOURS",
    ],
  },
  {
    title: "Geographic & Location Settings",
    icon: <Map className="h-5 w-5" />,
    description: "Geographic and location-based configuration",
    keys: [
      "MAP_SEARCH_PLACE",
      "MAP_COUNTRY_CODES", 
      "MAP_DEFAULT_LAT",
      "MAP_DEFAULT_LNG",
      "MAP_BBOX_NORTH",
      "MAP_BBOX_SOUTH",
      "MAP_BBOX_EAST",
      "MAP_BBOX_WEST",
      "SERVICE_AREA_BOUNDARY",
      "SERVICE_AREA_VALIDATION_ENABLED",
    ],
  },
  {
    title: "Contact Information",
    icon: <Phone className="h-5 w-5" />,
    description: "Contact details and office information",
    keys: [
      "CONTACT_HELPLINE",
      "CONTACT_EMAIL",
      "CONTACT_OFFICE_HOURS",
      "CONTACT_OFFICE_ADDRESS",
    ],
  },
  {
    title: "System Behavior",
    icon: <Settings className="h-5 w-5" />,
    description: "Core system functionality and behavior",
    keys: [
      "AUTO_ASSIGN_COMPLAINTS",
      "CITIZEN_REGISTRATION_ENABLED",
      "OTP_EXPIRY_MINUTES",
      "MAX_FILE_SIZE_MB",
    ],
  },
  {
    title: "Notification & Communication",
    icon: <MessageSquare className="h-5 w-5" />,
    description: "Notification settings and communication preferences",
    keys: [
      "NOTIFICATION_SETTINGS",
    ],
  },
  {
    title: "System Data Structures",
    icon: <Database className="h-5 w-5" />,
    description: "System data structures and configurations",
    keys: [
      "COMPLAINT_PRIORITIES",
      "COMPLAINT_STATUSES",
    ],
  },
];

const SystemSettingsManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [localSettings, setLocalSettings] = useState<Record<string, SystemConfigItem>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const {
    data: settingsResponse,
    isLoading,
    error,
    refetch,
  } = useGetAllSystemConfigQuery();


  const [bulkUpdateSystemConfig] = useBulkUpdateSystemConfigMutation();

  const settings = settingsResponse?.data || [];

  // Initialize local settings when data loads
  useEffect(() => {
    if (settings.length > 0) {
      const settingsMap: Record<string, SystemConfigItem> = {};
      settings.forEach((setting) => {
        settingsMap[setting.key] = { ...setting };
      });
      setLocalSettings(settingsMap);
      setHasChanges(false);
    }
  }, [settings]);

  // Helper functions
  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      // Application Settings
      APP_NAME: "Application Name",
      APP_LOGO_URL: "Logo URL",
      APP_LOGO_SIZE: "Logo Size",
      ADMIN_EMAIL: "Administrator Email",
      
      // Complaint Management
      COMPLAINT_ID_PREFIX: "Complaint ID Prefix",
      COMPLAINT_ID_START_NUMBER: "ID Start Number",
      COMPLAINT_ID_LENGTH: "ID Number Length",
      COMPLAINT_PHOTO_MAX_SIZE: "Max Photo Size (MB)",
      COMPLAINT_PHOTO_MAX_COUNT: "Max Photo Count",
      CITIZEN_DAILY_COMPLAINT_LIMIT: "Daily Complaint Limit",
      CITIZEN_DAILY_COMPLAINT_LIMIT_ENABLED: "Enable Daily Limit",
      GUEST_COMPLAINT_ENABLED: "Allow Guest Complaints",
      DEFAULT_SLA_HOURS: "Default SLA Hours",
      
      // Geographic Settings
      MAP_SEARCH_PLACE: "Search Place Context",
      MAP_COUNTRY_CODES: "Country Codes (ISO2)",
      MAP_DEFAULT_LAT: "Default Latitude",
      MAP_DEFAULT_LNG: "Default Longitude",
      MAP_BBOX_NORTH: "Bounding Box North",
      MAP_BBOX_SOUTH: "Bounding Box South",
      MAP_BBOX_EAST: "Bounding Box East",
      MAP_BBOX_WEST: "Bounding Box West",
      SERVICE_AREA_BOUNDARY: "Service Area Boundary (GeoJSON)",
      SERVICE_AREA_VALIDATION_ENABLED: "Enable Location Validation",
      
      // Contact Information
      CONTACT_HELPLINE: "Helpline Number",
      CONTACT_EMAIL: "Support Email",
      CONTACT_OFFICE_HOURS: "Office Hours",
      CONTACT_OFFICE_ADDRESS: "Office Address",
      
      // System Behavior
      AUTO_ASSIGN_COMPLAINTS: "Auto-assign Complaints",
      CITIZEN_REGISTRATION_ENABLED: "Allow Citizen Registration",
      OTP_EXPIRY_MINUTES: "OTP Expiry Minutes",
      MAX_FILE_SIZE_MB: "Max File Size (MB)",
      
      // Notifications
      NOTIFICATION_SETTINGS: "Notification Configuration (JSON)",
      
      // System Data
      COMPLAINT_PRIORITIES: "Complaint Priorities (JSON)",
      COMPLAINT_STATUSES: "Complaint Statuses (JSON)",
    };
    return labels[key] || key.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const updateLocalSetting = (key: string, field: keyof SystemConfigItem, value: any) => {
    setLocalSettings(prev => {
      const existingSetting = prev[key];
      if (!existingSetting) return prev;
      
      return {
        ...prev,
        [key]: {
          ...existingSetting,
          [field]: value,
        },
      };
    });
    setHasChanges(true);
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionTitle)) {
        newSet.delete(sectionTitle);
      } else {
        newSet.add(sectionTitle);
      }
      return newSet;
    });
  };

  const handleSaveChanges = async () => {
    try {
      const changedSettings = Object.values(localSettings).filter(setting => {
        const original = settings.find(s => s.key === setting.key);
        return original && (
          original.value !== setting.value ||
          original.isActive !== setting.isActive ||
          original.description !== setting.description
        );
      });

      if (changedSettings.length === 0) {
        dispatch(showSuccessToast("No Changes", "No changes to save"));
        return;
      }

      await bulkUpdateSystemConfig({
        settings: changedSettings.map(setting => ({
          key: setting.key,
          value: setting.value,
          ...(setting.description && { description: setting.description }),
          isActive: setting.isActive,
        })),
      }).unwrap();

      setHasChanges(false);
      dispatch(showSuccessToast("Settings Saved", `Updated ${changedSettings.length} settings successfully`));
      refetch();
    } catch (error: any) {
      dispatch(showErrorToast("Save Failed", error.message || "Failed to save settings"));
    }
  };

  const handleResetChanges = () => {
    const settingsMap: Record<string, SystemConfigItem> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = { ...setting };
    });
    setLocalSettings(settingsMap);
    setHasChanges(false);
  };

  const renderSettingInput = (setting: SystemConfigItem) => {
    const { key, type, value } = setting;

    if (type === "boolean") {
      return (
        <Select
          value={value}
          onValueChange={(newValue) => updateLocalSetting(key, "value", newValue)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Enabled</SelectItem>
            <SelectItem value="false">Disabled</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (type === "json") {
      return (
        <Textarea
          value={value}
          onChange={(e) => updateLocalSetting(key, "value", e.target.value)}
          placeholder="Enter valid JSON"
          className="font-mono text-sm"
          rows={4}
        />
      );
    }

    if (key === "APP_LOGO_SIZE") {
      return (
        <Select
          value={value}
          onValueChange={(newValue) => updateLocalSetting(key, "value", newValue)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={type === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => updateLocalSetting(key, "value", e.target.value)}
        placeholder={`Enter ${type} value`}
      />
    );
  };

  const filteredSections = CONFIG_SECTIONS.map(section => ({
    ...section,
    keys: section.keys.filter(key => {
      const setting = localSettings[key];
      if (!setting) return false;
      
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        key.toLowerCase().includes(searchLower) ||
        getSettingLabel(key).toLowerCase().includes(searchLower) ||
        (setting.description && setting.description.toLowerCase().includes(searchLower))
      );
    }),
  })).filter(section => section.keys.length > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Settings</h2>
          <p className="text-gray-600 mb-4">Failed to load system configuration</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Configuration</h2>
          <p className="text-gray-600">Manage all system settings with enable/disable controls</p>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleResetChanges}>
                Reset Changes
              </Button>
              <Button onClick={handleSaveChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search settings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {filteredSections.map((section) => (
          <Card key={section.title}>
            <Collapsible
              open={expandedSections.has(section.title)}
              onOpenChange={() => toggleSection(section.title)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {section.icon}
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <p className="text-sm text-gray-600">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {section.keys.length} settings
                      </span>
                      {expandedSections.has(section.title) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {section.keys.map((key) => {
                      const setting = localSettings[key];
                      if (!setting) return null;

                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <Label className="font-medium">{getSettingLabel(key)}</Label>
                                <Switch
                                  checked={setting.isActive}
                                  onCheckedChange={(checked) => 
                                    updateLocalSetting(key, "isActive", checked)
                                  }
                                />
                                <span className="text-sm text-gray-500">
                                  {setting.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                {setting.description}
                              </p>
                              <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Value</Label>
                                {renderSettingInput(setting)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            Key: {key} | Type: {setting.type}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {filteredSections.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No settings found</h3>
          <p className="text-gray-600">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsManager;