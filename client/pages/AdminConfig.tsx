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

import SystemSettingsManager from "../components/SystemSettingsManager";
import WardManagement from "../components/WardManagement";
import ComplaintTypeManagement from "../components/ComplaintTypeManagement";

const AdminConfig: React.FC = () => {
  // Get URL parameters for tab navigation
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "system-settings";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-gray-600 mt-2">
          Manage system settings, wards, complaint types, and other configurations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system-settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>System Settings</span>
          </TabsTrigger>
          <TabsTrigger value="wards" className="flex items-center space-x-2">
            <Map className="h-4 w-4" />
            <span>Wards & Boundaries</span>
          </TabsTrigger>
          <TabsTrigger value="complaint-types" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Complaint Types</span>
          </TabsTrigger>
          {/* <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>User Management</span>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
            <p className="text-gray-600">User management interface will be implemented here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminConfig;