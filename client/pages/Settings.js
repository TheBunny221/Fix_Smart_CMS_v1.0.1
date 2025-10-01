import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { updateUserPreferences } from "../store/slices/authSlice";
import { setLanguage } from "../store/slices/languageSlice";
import { setTheme, addNotification } from "../store/slices/uiSlice";
import { Globe, Bell, Shield, Palette, Volume2, Database, Trash2, Download, Upload, Moon, Sun, Smartphone, Mail, MessageSquare, } from "lucide-react";
const Settings = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { currentLanguage, translations } = useAppSelector((state) => state.language);
    const { theme } = useAppSelector((state) => state.ui);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const handleLanguageChange = (language) => {
        dispatch(setLanguage(language));
        if (user) {
            dispatch(updateUserPreferences({ language }));
        }
        dispatch(addNotification({
            type: "success",
            title: translations.common.success,
            message: "Language updated successfully",
        }));
    };
    const handleThemeChange = (newTheme) => {
        dispatch(setTheme(newTheme));
        dispatch(addNotification({
            type: "info",
            title: "Theme Updated",
            message: `Switched to ${newTheme} mode`,
        }));
    };
    const handleNotificationChange = (key, value) => {
        if (user) {
            dispatch(updateUserPreferences({ [key]: value }));
        }
    };
    const exportData = () => {
        // Mock data export
        const data = {
            profile: user,
            complaints: [], // Would be fetched from API
            preferences: user?.preferences,
            exportDate: new Date().toISOString(),
        };
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `citizen-connect-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        dispatch(addNotification({
            type: "success",
            title: translations.common.success,
            message: "Data exported successfully",
        }));
    };
    const deleteAccount = () => {
        // Mock account deletion
        dispatch(addNotification({
            type: "info",
            title: "Account Deletion",
            message: "Account deletion request submitted. You will receive a confirmation email.",
        }));
        setShowDeleteDialog(false);
    };
    // Show loading state if translations are not loaded yet
    if (!translations ||
        !translations.settings ||
        !translations.nav ||
        !translations.common) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" }), _jsx("p", { className: "mt-2", children: "Loading..." })] }) }));
    }
    return (_jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: translations?.nav?.settings || "Settings" }), _jsx("p", { className: "text-muted-foreground", children: "Manage your application preferences and account settings" })] }) }), _jsxs(Tabs, { defaultValue: "general", className: "space-y-4", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsx(TabsTrigger, { value: "general", children: translations?.settings?.generalSettings || "General Settings" }), _jsx(TabsTrigger, { value: "notifications", children: translations?.settings?.notificationSettings ||
                                    "Notification Settings" }), _jsx(TabsTrigger, { value: "privacy", children: translations?.settings?.privacySettings || "Privacy Settings" }), _jsx(TabsTrigger, { value: "advanced", children: "Advanced" })] }), _jsxs(TabsContent, { value: "general", className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Globe, { className: "h-5 w-5" }), _jsx("span", { children: translations.settings.languageSettings })] }) }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-base font-medium", children: translations.settings.language }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Choose your preferred language for the interface" })] }), _jsxs(Select, { value: currentLanguage, onValueChange: handleLanguageChange, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "en", children: "English" }), _jsx(SelectItem, { value: "hi", children: "\u0939\u093F\u0928\u094D\u0926\u0940 (Hindi)" }), _jsx(SelectItem, { value: "ml", children: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02 (Malayalam)" })] })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Palette, { className: "h-5 w-5" }), _jsx("span", { children: "Appearance" })] }) }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-base font-medium", children: translations.settings.darkMode }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Switch between light and dark themes" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Sun, { className: "h-4 w-4" }), _jsx(Switch, { checked: theme === "dark", onCheckedChange: (checked) => handleThemeChange(checked ? "dark" : "light") }), _jsx(Moon, { className: "h-4 w-4" })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Volume2, { className: "h-5 w-5" }), _jsx("span", { children: "Audio" })] }) }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-base font-medium", children: translations.settings.soundEffects }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Enable sound effects for notifications and actions" })] }), _jsx(Switch, { defaultChecked: false })] }) })] })] }), _jsx(TabsContent, { value: "notifications", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Bell, { className: "h-5 w-5" }), _jsx("span", { children: translations.settings.notificationSettings })] }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs(Label, { className: "text-base font-medium flex items-center", children: [_jsx(Mail, { className: "h-4 w-4 mr-2" }), translations.settings.emailAlerts] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Receive email notifications for important updates" })] }), _jsx(Switch, { checked: user?.preferences.emailAlerts || false, onCheckedChange: (checked) => handleNotificationChange("emailAlerts", checked) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs(Label, { className: "text-base font-medium flex items-center", children: [_jsx(Smartphone, { className: "h-4 w-4 mr-2" }), translations.settings.smsAlerts] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Get SMS notifications for critical updates" })] }), _jsx(Switch, { defaultChecked: false })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs(Label, { className: "text-base font-medium flex items-center", children: [_jsx(MessageSquare, { className: "h-4 w-4 mr-2" }), "In-App Notifications"] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Show notifications within the application" })] }), _jsx(Switch, { checked: user?.preferences.notifications || false, onCheckedChange: (checked) => handleNotificationChange("notifications", checked) })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h4", { className: "font-medium", children: "Notification Types" }), _jsx("div", { className: "space-y-3", children: [
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
                                                    ].map((item, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-sm font-medium", children: item.label }), _jsx("p", { className: "text-xs text-muted-foreground", children: item.description })] }), _jsx(Switch, { defaultChecked: index < 2 })] }, index))) })] })] })] }) }), _jsxs(TabsContent, { value: "privacy", className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Shield, { className: "h-5 w-5" }), _jsx("span", { children: translations.settings.privacySettings })] }) }), _jsx(CardContent, { className: "space-y-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-base font-medium", children: "Profile Visibility" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Control who can see your profile information" })] }), _jsxs(Select, { defaultValue: "public", children: [_jsx(SelectTrigger, { className: "w-32", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "public", children: "Public" }), _jsx(SelectItem, { value: "limited", children: "Limited" }), _jsx(SelectItem, { value: "private", children: "Private" })] })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-base font-medium", children: "Activity Tracking" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Allow the system to track your activity for analytics" })] }), _jsx(Switch, { defaultChecked: true })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-base font-medium", children: "Location Services" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Enable location services for better complaint tracking" })] }), _jsx(Switch, { defaultChecked: false })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Database, { className: "h-5 w-5" }), _jsx("span", { children: translations.settings.dataRetention })] }) }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-base font-medium", children: "Data Retention Period" }), _jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "How long should we keep your data after account closure" }), _jsxs(Select, { defaultValue: "1year", children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "30days", children: "30 Days" }), _jsx(SelectItem, { value: "6months", children: "6 Months" }), _jsx(SelectItem, { value: "1year", children: "1 Year" }), _jsx(SelectItem, { value: "permanent", children: "Keep Permanently" })] })] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { variant: "outline", onClick: exportData, className: "flex-1", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), translations.common.export, " My Data"] }), _jsxs(Button, { variant: "outline", className: "flex-1", children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), "Import Data"] })] })] }) })] })] }), _jsxs(TabsContent, { value: "advanced", className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Advanced Settings" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-base font-medium", children: "Developer Mode" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Enable advanced features and debugging options" })] }), _jsx(Switch, { defaultChecked: false })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-base font-medium", children: "Beta Features" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Get early access to experimental features" })] }), _jsx(Switch, { defaultChecked: false })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h4", { className: "font-medium", children: "System Information" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-muted-foreground", children: "Version" }), _jsx("p", { children: "v1.0.0" })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-muted-foreground", children: "Build" }), _jsx("p", { children: "2024.01.15" })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-muted-foreground", children: "API Version" }), _jsx("p", { children: "v1.2.3" })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-muted-foreground", children: "Environment" }), _jsx(Badge, { variant: "secondary", children: "Development" })] })] })] })] })] }), _jsxs(Card, { className: "border-destructive", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-destructive flex items-center space-x-2", children: [_jsx(Trash2, { className: "h-5 w-5" }), _jsx("span", { children: "Danger Zone" })] }) }), _jsx(CardContent, { className: "space-y-4", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-base font-medium text-destructive", children: translations.settings.accountDeletion }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Permanently delete your account and all associated data. This action cannot be undone." })] }), _jsxs(Dialog, { open: showDeleteDialog, onOpenChange: setShowDeleteDialog, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { variant: "destructive", children: "Delete Account" }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Are you absolutely sure?" }), _jsxs(DialogDescription, { children: ["This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:", _jsxs("ul", { className: "mt-2 ml-4 list-disc", children: [_jsx("li", { children: "Profile information" }), _jsx("li", { children: "Complaint history" }), _jsx("li", { children: "Preferences and settings" }), _jsx("li", { children: "All associated files and documents" })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowDeleteDialog(false), children: "Cancel" }), _jsx(Button, { variant: "destructive", onClick: deleteAccount, children: "Delete Account" })] })] })] })] }) })] })] })] })] }));
};
export default Settings;
