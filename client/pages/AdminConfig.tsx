import React from "react";
import { useSearchParams } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Settings,
  Map,
  FileText,
  Users,
} from "lucide-react";
import { useAppTranslation } from "../utils/i18n";

import SystemSettingsManager from "../components/SystemSettingsManager";
import WardManagement from "../components/WardManagement";
import ComplaintTypeManagement from "../components/ComplaintTypeManagement";

const AdminConfig: React.FC = () => {
  const { t } = useAppTranslation();
  // Get URL parameters for tab navigation
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "system-settings";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t("admin.config.title")}</h1>
        <p className="text-gray-600 mt-2">
          {t("admin.config.subtitle")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system-settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>{t("admin.config.systemSettings")}</span>
          </TabsTrigger>
          <TabsTrigger value="wards" className="flex items-center space-x-2">
            <Map className="h-4 w-4" />
            <span>{t("admin.config.wardsBoundaries")}</span>
          </TabsTrigger>
          <TabsTrigger value="complaint-types" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>{t("admin.config.complaintTypes")}</span>
          </TabsTrigger>
          {/* <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>{t("admin.config.userManagement")}</span>
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="system-settings" className="space-y-6">
          <SystemSettingsManager />
        </TabsContent>

        <TabsContent value="wards" className="space-y-6">
          <WardManagement />
        </TabsContent>

        <TabsContent value="complaint-types" className="space-y-6">
          <ComplaintTypeManagement />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t("admin.config.userManagement")}</h3>
            <p className="text-gray-600">{t("admin.config.userManagementDescription")}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminConfig;