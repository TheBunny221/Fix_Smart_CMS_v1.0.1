import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { updateUserPreferences } from "../store/slices/authSlice";
import { setLanguage } from "../store/slices/languageSlice";
import { setTheme, addNotification } from "../store/slices/uiSlice";
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Palette,
  Volume2,
  Database,
  Trash2,
  Download,
  Upload,
  Moon,
  Sun,
  Smartphone,
  Mail,
  MessageSquare,
} from "lucide-react";

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentLanguage, translations } = useAppSelector(
    (state) => state.language,
  );
  const { theme } = useAppSelector((state) => state.ui);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleLanguageChange = (language) => {
    dispatch(setLanguage(language));
    if (user) {
      dispatch(updateUserPreferences({ language }));
    }
    dispatch(addNotification({
        type,
        title: translations.common.success,
        message: "Language updated successfully",
      }),
    );
  };

  const handleThemeChange = (newTheme) => {
    dispatch(setTheme(newTheme));
    dispatch(addNotification({
        type,
        title: "Theme Updated",
        message: `Switched to ${newTheme} mode`,
      }),
    );
  };

  const handleNotificationChange = (key, value) => {
    if (user) {
      dispatch(updateUserPreferences({ [key]));
    }
  };

  const exportData = () => {
    // Mock data export
    const data = {
      profile,
      complaints: [], // Would be fetched from API
      preferences: user?.preferences,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type);
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `citizen-connect-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    dispatch(addNotification({
        type,
        title: translations.common.success,
        message: "Data exported successfully",
      }),
    );
  };

  const deleteAccount = () => {
    // Mock account deletion
    dispatch(addNotification({
        type,
        title: "Account Deletion",
        message:
          "Account deletion request submitted. You will receive a confirmation email.",
      }),
    );
    setShowDeleteDialog(false);
  };

  // Show loading state if translations are not loaded yet
  if (
    translations ||
    translations.settings ||
    translations.nav ||
    translations.common
  ) {
    return (
      
        
          
          Loading...
        
      
    );
  }

  return (
    
      {/* Header */}
      
        
          
            {translations?.nav?.settings || "Settings"}
          
          
            Manage your application preferences and account settings
          
        
      

      
        
          
            {translations?.settings?.generalSettings || "General Settings"}
          
          
            {translations?.settings?.notificationSettings ||
              "Notification Settings"}
          
          
            {translations?.settings?.privacySettings || "Privacy Settings"}
          
          Advanced
        

        
          {/* Language Settings */}
          
            
              
                
                {translations.settings.languageSettings}
              
            
            
              
                
                  
                    {translations.settings.language}
                  
                  
                    Choose your preferred language for the interface
                  
                
                
                  
                    
                  
                  
                    English
                    हिन्दी (Hindi)
                    മലയാളം (Malayalam)
                  
                
              
            
          

          {/* Theme Settings */}
          
            
              
                
                Appearance
              
            
            
              
                
                  
                    {translations.settings.darkMode}
                  
                  
                    Switch between light and dark themes
                  
                
                
                  
                  
                      handleThemeChange(checked ? "dark" )
                    }
                  />
                  
                
              
            
          

          {/* Sound Settings */}
          
            
              
                
                Audio
              
            
            
              
                
                  
                    {translations.settings.soundEffects}
                  
                  
                    Enable sound effects for notifications and actions
                  
                
                
              
            
          
        

        
          
            
              
                
                {translations.settings.notificationSettings}
              
            
            
              {/* Email Notifications */}
              
                
                  
                    
                      
                      {translations.settings.emailAlerts}
                    
                    
                      Receive email notifications for important updates
                    
                  
                  
                      handleNotificationChange("emailAlerts", checked)
                    }
                  />
                

                
                  
                    
                      
                      {translations.settings.smsAlerts}
                    
                    
                      Get SMS notifications for critical updates
                    
                  
                  
                

                
                  
                    
                      
                      In-App Notifications
                    
                    
                      Show notifications within the application
                    
                  
                  
                      handleNotificationChange("notifications", checked)
                    }
                  />
                
              

              {/* Notification Types */}
              
                Notification Types
                
                  {[
                    {
                      label: "Complaint Status Updates",
                      description: "When your complaint status changes",
                    },
                    {
                      label: "Assignment Notifications",
                      description: "When complaints are assigned to you",
                    },
                    {
                      label: "SLA Deadline Alerts",
                      description: "Reminders about approaching deadlines",
                    },
                    {
                      label: "System Maintenance",
                      description: "Important system updates and maintenance",
                    },
                  ].map((item, index) => (
                    
                      
                        
                          {item.label}
                        
                        
                          {item.description}
                        
                      
                      
                    
                  ))}
                
              
            
          
        

        
          
            
              
                
                {translations.settings.privacySettings}
              
            
            
              
                
                  
                    
                      Profile Visibility
                    
                    
                      Control who can see your profile information
                    
                  
                  
                    
                      
                    
                    
                      Public
                      Limited
                      Private
                    
                  
                

                
                  
                    
                      Activity Tracking
                    
                    
                      Allow the system to track your activity for analytics
                    
                  
                  
                

                
                  
                    
                      Location Services
                    
                    
                      Enable location services for better complaint tracking
                    
                  
                  
                
              
            
          

          {/* Data Management */}
          
            
              
                
                {translations.settings.dataRetention}
              
            
            
              
                
                  
                    Data Retention Period
                  
                  
                    How long should we keep your data after account closure
                  
                  
                    
                      
                    
                    
                      30 Days
                      6 Months
                      1 Year
                      
                        Keep Permanently
                      
                    
                  
                

                
                  
                    
                    {translations.common.export} My Data
                  
                  
                    
                    Import Data
                  
                
              
            
          
        

        
          
            
              Advanced Settings
            
            
              {/* Developer Options */}
              
                
                  
                    
                      Developer Mode
                    
                    
                      Enable advanced features and debugging options
                    
                  
                  
                

                
                  
                    
                      Beta Features
                    
                    
                      Get early access to experimental features
                    
                  
                  
                
              

              {/* System Information */}
              
                System Information
                
                  
                    Version
                    v1.0.0
                  
                  
                    Build
                    2024.01.15
                  
                  
                    API Version
                    v1.2.3
                  
                  
                    Environment
                    Development
                  
                
              
            
          

          {/* Danger Zone */}
          
            
              
                
                Danger Zone
              
            
            
              
                
                  
                    {translations.settings.accountDeletion}
                  
                  
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  
                

                
                  
                    Delete Account
                  
                  
                    
                      Are you absolutely sure?
                      
                        This action cannot be undone. This will permanently
                        delete your account and remove all your data from our
                        servers, including:
                        
                          Profile information
                          Complaint history
                          Preferences and settings
                          All associated files and documents
                        
                      
                    
                    
                       setShowDeleteDialog(false)}
                      >
                        Cancel
                      
                      
                        Delete Account
                      
                    
                  
                
              
            
          
        
      
    
  );
};

export default Settings;
