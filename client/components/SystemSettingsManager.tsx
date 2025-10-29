import React, { useState, useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
import { useAppTranslation } from "../utils/i18n";
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

const SystemSettingsManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useAppTranslation();

  const CONFIG_SECTIONS: ConfigSection[] = [
    {
      title: t("admin.systemSettings.sections.applicationSettings"),
      icon: <Globe className="h-5 w-5" />,
      description: t("admin.systemSettings.sections.applicationSettingsDesc"),
      keys: [
        "APP_NAME",
        "APP_LOGO_URL",
        "APP_LOGO_SIZE",
        "ADMIN_EMAIL",
      ],
    },
    {
      title: t("admin.systemSettings.sections.complaintManagement"),
      icon: <FileText className="h-5 w-5" />,
      description: t("admin.systemSettings.sections.complaintManagementDesc"),
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
      title: t("admin.systemSettings.sections.geographicSettings"),
      icon: <Map className="h-5 w-5" />,
      description: t("admin.systemSettings.sections.geographicSettingsDesc"),
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
      title: t("admin.systemSettings.sections.contactInformation"),
      icon: <Phone className="h-5 w-5" />,
      description: t("admin.systemSettings.sections.contactInformationDesc"),
      keys: [
        "CONTACT_HELPLINE",
        "CONTACT_EMAIL",
        "CONTACT_OFFICE_HOURS",
        "CONTACT_OFFICE_ADDRESS",
      ],
    },
    {
      title: t("admin.systemSettings.sections.systemBehavior"),
      icon: <Settings className="h-5 w-5" />,
      description: t("admin.systemSettings.sections.systemBehaviorDesc"),
      keys: [
        "AUTO_ASSIGN_COMPLAINTS",
        "CITIZEN_REGISTRATION_ENABLED",
        "OTP_EXPIRY_MINUTES",
        "MAX_FILE_SIZE_MB",
      ],
    },
    {
      title: t("admin.systemSettings.sections.notificationCommunication"),
      icon: <MessageSquare className="h-5 w-5" />,
      description: t("admin.systemSettings.sections.notificationCommunicationDesc"),
      keys: [
        "NOTIFICATION_SETTINGS",
      ],
    },
    {
      title: t("admin.systemSettings.sections.systemDataStructures"),
      icon: <Database className="h-5 w-5" />,
      description: t("admin.systemSettings.sections.systemDataStructuresDesc"),
      keys: [
        "COMPLAINT_PRIORITIES",
        "COMPLAINT_STATUSES",
      ],
    },
  ];
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
      APP_NAME: t("admin.systemSettings.labels.appName"),
      APP_LOGO_URL: t("admin.systemSettings.labels.logoUrl"),
      APP_LOGO_SIZE: t("admin.systemSettings.labels.logoSize"),
      ADMIN_EMAIL: t("admin.systemSettings.labels.adminEmail"),
      
      // Complaint Management
      COMPLAINT_ID_PREFIX: t("admin.systemSettings.labels.complaintIdPrefix"),
      COMPLAINT_ID_START_NUMBER: t("admin.systemSettings.labels.idStartNumber"),
      COMPLAINT_ID_LENGTH: t("admin.systemSettings.labels.idNumberLength"),
      COMPLAINT_PHOTO_MAX_SIZE: t("admin.systemSettings.labels.maxPhotoSize"),
      COMPLAINT_PHOTO_MAX_COUNT: t("admin.systemSettings.labels.maxPhotoCount"),
      CITIZEN_DAILY_COMPLAINT_LIMIT: t("admin.systemSettings.labels.dailyComplaintLimit"),
      CITIZEN_DAILY_COMPLAINT_LIMIT_ENABLED: t("admin.systemSettings.labels.enableDailyLimit"),
      GUEST_COMPLAINT_ENABLED: t("admin.systemSettings.labels.allowGuestComplaints"),
      DEFAULT_SLA_HOURS: t("admin.systemSettings.labels.defaultSlaHours"),
      
      // Geographic Settings
      MAP_SEARCH_PLACE: t("admin.systemSettings.labels.searchPlaceContext"),
      MAP_COUNTRY_CODES: t("admin.systemSettings.labels.countryCodes"),
      MAP_DEFAULT_LAT: t("admin.systemSettings.labels.defaultLatitude"),
      MAP_DEFAULT_LNG: t("admin.systemSettings.labels.defaultLongitude"),
      MAP_BBOX_NORTH: t("admin.systemSettings.labels.boundingBoxNorth"),
      MAP_BBOX_SOUTH: t("admin.systemSettings.labels.boundingBoxSouth"),
      MAP_BBOX_EAST: t("admin.systemSettings.labels.boundingBoxEast"),
      MAP_BBOX_WEST: t("admin.systemSettings.labels.boundingBoxWest"),
      SERVICE_AREA_BOUNDARY: t("admin.systemSettings.labels.serviceAreaBoundary"),
      SERVICE_AREA_VALIDATION_ENABLED: t("admin.systemSettings.labels.enableLocationValidation"),
      
      // Contact Information
      CONTACT_HELPLINE: t("admin.systemSettings.labels.helplineNumber"),
      CONTACT_EMAIL: t("admin.systemSettings.labels.supportEmail"),
      CONTACT_OFFICE_HOURS: t("admin.systemSettings.labels.officeHours"),
      CONTACT_OFFICE_ADDRESS: t("admin.systemSettings.labels.officeAddress"),
      
      // System Behavior
      AUTO_ASSIGN_COMPLAINTS: t("admin.systemSettings.labels.autoAssignComplaints"),
      CITIZEN_REGISTRATION_ENABLED: t("admin.systemSettings.labels.allowCitizenRegistration"),
      OTP_EXPIRY_MINUTES: t("admin.systemSettings.labels.otpExpiryMinutes"),
      MAX_FILE_SIZE_MB: t("admin.systemSettings.labels.maxFileSize"),
      
      // Notifications
      NOTIFICATION_SETTINGS: t("admin.systemSettings.labels.notificationConfig"),
      
      // System Data
      COMPLAINT_PRIORITIES: t("admin.systemSettings.labels.complaintPriorities"),
      COMPLAINT_STATUSES: t("admin.systemSettings.labels.complaintStatuses"),
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
        dispatch(showSuccessToast(t("admin.systemSettings.noChanges"), t("admin.systemSettings.noChangesToSave")));
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
      dispatch(showSuccessToast(t("admin.systemSettings.settingsSaved"), t("admin.systemSettings.updatedSettings", { count: changedSettings.length })));
      refetch();
    } catch (error: any) {
      dispatch(showErrorToast(t("admin.systemSettings.saveFailed"), error.message || t("admin.systemSettings.failedToSaveSettings")));
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
            <SelectItem value="true">{t("admin.systemSettings.enabled")}</SelectItem>
            <SelectItem value="false">{t("admin.systemSettings.disabled")}</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (type === "json") {
      return (
        <Textarea
          value={value}
          onChange={(e) => updateLocalSetting(key, "value", e.target.value)}
          placeholder={t("admin.systemSettings.enterValidJson")}
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
            <SelectItem value="small">{t("admin.systemSettings.small")}</SelectItem>
            <SelectItem value="medium">{t("admin.systemSettings.medium")}</SelectItem>
            <SelectItem value="large">{t("admin.systemSettings.large")}</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={type === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => updateLocalSetting(key, "value", e.target.value)}
        placeholder={t("admin.systemSettings.enterValue", { type })}
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
        <span className="ml-2">{t("admin.systemSettings.loadingSettings")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("admin.systemSettings.errorLoadingSettings")}</h2>
          <p className="text-gray-600 mb-4">{t("admin.systemSettings.failedToLoadConfig")}</p>
          <Button onClick={() => refetch()}>{t("admin.systemSettings.tryAgain")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t("admin.systemSettings.title")}</h2>
          <p className="text-gray-600">{t("admin.systemSettings.subtitle")}</p>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleResetChanges}>
                {t("admin.systemSettings.resetChanges")}
              </Button>
              <Button onClick={handleSaveChanges}>
                <Save className="h-4 w-4 mr-2" />
                {t("admin.systemSettings.saveChanges")}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("admin.systemSettings.refresh")}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={t("admin.systemSettings.searchPlaceholder")}
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
                        {section.keys.length} {t("admin.systemSettings.settings")}
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
                                  {setting.isActive ? t("admin.systemSettings.active") : t("admin.systemSettings.inactive")}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                {setting.description}
                              </p>
                              <div className="space-y-2">
                                <Label className="text-xs text-gray-500">{t("admin.systemSettings.value")}</Label>
                                {renderSettingInput(setting)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-2">
                            {t("admin.systemSettings.key")}: {key} | {t("admin.systemSettings.type")}: {setting.type}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t("admin.systemSettings.noSettingsFound")}</h3>
          <p className="text-gray-600">{t("admin.systemSettings.adjustSearchTerms")}</p>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsManager;