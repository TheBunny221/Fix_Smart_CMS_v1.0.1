import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useGetComplaintTypesQuery, useCreateComplaintTypeMutation, useUpdateComplaintTypeMutation, useDeleteComplaintTypeMutation, } from "../store/api/complaintTypesApi";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../components/ui/table";
import { Settings, MapPin, FileText, Users, Clock, Mail, Phone, Database, Plus, Edit, Trash2, Save, RefreshCw, Globe, Shield, AlertTriangle, ChevronDown, ChevronRight, CheckCircle, } from "lucide-react";
import WardBoundaryManager from "../components/WardBoundaryManager";
const AdminConfig = () => {
    const dispatch = useAppDispatch();
    const { translations } = useAppSelector((state) => state.language);
    const { user } = useAppSelector((state) => state.auth);
    // Get URL parameters for tab navigation
    const [searchParams] = useSearchParams();
    const defaultTab = searchParams.get("tab") || "wards";
    // API queries
    const { data: complaintTypesResponse, isLoading: complaintTypesLoading, error: complaintTypesError, refetch: refetchComplaintTypes, } = useGetComplaintTypesQuery();
    const [createComplaintType] = useCreateComplaintTypeMutation();
    const [updateComplaintType] = useUpdateComplaintTypeMutation();
    const [deleteComplaintType] = useDeleteComplaintTypeMutation();
    // State management
    const [wards, setWards] = useState([]);
    const [systemSettings, setSystemSettings] = useState([]);
    const [editingWard, setEditingWard] = useState(null);
    const [editingSubZone, setEditingSubZone] = useState(null);
    const [editingComplaintType, setEditingComplaintType] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [isWardDialogOpen, setIsWardDialogOpen] = useState(false);
    const [isSubZoneDialogOpen, setIsSubZoneDialogOpen] = useState(false);
    const [isComplaintTypeDialogOpen, setIsComplaintTypeDialogOpen] = useState(false);
    const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
    const [editingSetting, setEditingSetting] = useState(null);
    const [showAdvancedMap, setShowAdvancedMap] = useState(false);
    const [expandedWards, setExpandedWards] = useState(new Set());
    const [logoFile, setLogoFile] = useState(null);
    const [logoUploadMode, setLogoUploadMode] = useState("url");
    const [logoPreview, setLogoPreview] = useState(null);
    const [selectedWardForBoundary, setSelectedWardForBoundary] = useState(null);
    const [isBoundaryManagerOpen, setIsBoundaryManagerOpen] = useState(false);
    // Reset logo upload state
    const resetLogoUploadState = () => {
        setLogoFile(null);
        setLogoPreview(null);
        setLogoUploadMode("url");
    };
    // API calls with retry logic for rate limiting
    const apiCall = async (url, options = {}, retryCount = 0) => {
        const token = localStorage.getItem("token");
        const maxRetries = 3;
        const baseDelay = 1000; // 1 second
        console.log(`[AdminConfig] Making API call to: ${url} (attempt ${retryCount + 1})`);
        const response = await fetch(`/api${url}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
        });
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");
        console.log(`[AdminConfig] Response for ${url}:`, {
            status: response.status,
            statusText: response.statusText,
            contentType,
            isJson,
        });
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            // Handle rate limiting with retry
            if (response.status === 429 && retryCount < maxRetries) {
                const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
                console.log(`[AdminConfig] Rate limited, retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return apiCall(url, options, retryCount + 1);
            }
            if (isJson) {
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                    console.log(`[AdminConfig] Error response for ${url}:`, error);
                }
                catch {
                    // Failed to parse JSON error response
                    console.log(`[AdminConfig] Failed to parse JSON error response for ${url}`);
                }
            }
            else {
                // Non-JSON response (likely HTML error page)
                const text = await response.text();
                console.log(`[AdminConfig] Non-JSON error response for ${url}:`, text.substring(0, 200));
                if (text.includes("<!doctype") || text.includes("<html")) {
                    errorMessage =
                        "Server returned an error page. Please check your authentication and try again.";
                }
                else {
                    errorMessage = text.substring(0, 100) || errorMessage;
                }
            }
            throw new Error(errorMessage);
        }
        if (!isJson) {
            const text = await response.text();
            console.log(`[AdminConfig] Non-JSON success response for ${url}:`, text.substring(0, 200));
            throw new Error("Server returned non-JSON response. Expected JSON data.");
        }
        const data = await response.json();
        console.log(`[AdminConfig] Success response for ${url}:`, {
            success: data?.success,
            dataLength: Array.isArray(data?.data)
                ? data.data.length
                : typeof data?.data,
        });
        return data;
    };
    // Load data on component mount
    useEffect(() => {
        // Check if user is authenticated and has admin role
        if (!user) {
            dispatch(showErrorToast("Authentication Required", "Please log in to access this page."));
            setDataLoading(false);
            return;
        }
        if (user.role !== "ADMINISTRATOR") {
            dispatch(showErrorToast("Access Denied", "Administrator privileges required to access this page."));
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
            }
            catch (error) {
                console.error("Failed to load wards:", error);
                if (error.message.includes("HTTP 429")) {
                    dispatch(showErrorToast("Rate Limit", "Too many requests. Please wait a moment and try again."));
                }
                setWards([]);
            }
            // Add a small delay between API calls to prevent rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100));
            // Complaint types are loaded via RTK Query hooks
            // Load system settings (admin-only endpoint)
            let settingsResponse;
            try {
                settingsResponse = await apiCall("/system-config");
                setSystemSettings(settingsResponse.data || []);
            }
            catch (error) {
                console.error("Failed to load system settings:", error);
                if (error.message.includes("HTTP 429")) {
                    dispatch(showErrorToast("Rate Limit", "Too many requests. Please wait a moment and try again."));
                }
                else if (error.message.includes("Not authorized") ||
                    error.message.includes("Authentication")) {
                    // This is expected for non-admin users, don't show error
                    setSystemSettings([]);
                }
                else {
                    // Unexpected error, show it
                    dispatch(showErrorToast("Settings Load Failed", `Failed to load system settings: ${error.message}`));
                    setSystemSettings([]);
                }
            }
        }
        catch (error) {
            console.error("Unexpected error during data loading:", error);
            dispatch(showErrorToast("Load Failed", "An unexpected error occurred while loading data."));
        }
        finally {
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
            if (ward.id && ward.id !== "") {
                // Update existing ward
                response = await apiCall(`/users/wards/${ward.id}`, {
                    method: "PUT",
                    body: JSON.stringify(wardData),
                });
                setWards((prev) => prev.map((w) => w.id === ward.id ? { ...ward, ...response.data } : w));
            }
            else {
                // Create new ward
                response = await apiCall("/users/wards", {
                    method: "POST",
                    body: JSON.stringify(wardData),
                });
                setWards((prev) => [...prev, response.data]);
            }
            setEditingWard(null);
            setIsWardDialogOpen(false);
            dispatch(showSuccessToast("Ward Saved", `Ward "${ward.name}" has been saved successfully.`));
        }
        catch (error) {
            dispatch(showErrorToast("Save Failed", error.message || "Failed to save ward. Please try again."));
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleDeleteWard = async (wardId) => {
        if (!confirm("Are you sure you want to delete this ward?"))
            return;
        setIsLoading(true);
        try {
            await apiCall(`/users/wards/${wardId}`, { method: "DELETE" });
            setWards((prev) => prev.filter((w) => w.id !== wardId));
            dispatch(showSuccessToast("Ward Deleted", "Ward has been deleted successfully."));
        }
        catch (error) {
            dispatch(showErrorToast("Delete Failed", error.message || "Failed to delete ward. Please try again."));
        }
        finally {
            setIsLoading(false);
        }
    };
    // Ward Boundary Management Function
    const handleSaveBoundaries = async (wardData) => {
        setIsLoading(true);
        try {
            // Update ward boundaries
            const response = await apiCall(`/wards/${wardData.wardId}/boundaries`, {
                method: "PUT",
                body: JSON.stringify(wardData),
            });
            // Update the ward in local state if needed
            setWards((prev) => prev.map((ward) => ward.id === wardData.wardId ? { ...ward, ...response.data } : ward));
            setIsBoundaryManagerOpen(false);
            setSelectedWardForBoundary(null);
            dispatch(showSuccessToast("Boundaries Saved", "Ward boundaries have been updated successfully."));
        }
        catch (error) {
            dispatch(showErrorToast("Save Failed", error.message || "Failed to save ward boundaries. Please try again."));
        }
        finally {
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
            if (subZone.id && subZone.id !== "") {
                // Update existing sub-zone
                response = await apiCall(`/users/wards/${subZone.wardId}/subzones/${subZone.id}`, {
                    method: "PUT",
                    body: JSON.stringify(subZoneData),
                });
            }
            else {
                // Create new sub-zone
                response = await apiCall(`/users/wards/${subZone.wardId}/subzones`, {
                    method: "POST",
                    body: JSON.stringify(subZoneData),
                });
            }
            // Update wards state to include the new/updated sub-zone
            setWards((prev) => prev.map((ward) => {
                if (ward.id === subZone.wardId) {
                    const updatedSubZones = subZone.id
                        ? ward.subZones.map((sz) => sz.id === subZone.id ? response.data : sz)
                        : [...ward.subZones, response.data];
                    return { ...ward, subZones: updatedSubZones };
                }
                return ward;
            }));
            setEditingSubZone(null);
            setIsSubZoneDialogOpen(false);
            dispatch(showSuccessToast("Sub-Zone Saved", `Sub-zone "${subZone.name}" has been saved successfully.`));
        }
        catch (error) {
            dispatch(showErrorToast("Save Failed", error.message || "Failed to save sub-zone. Please try again."));
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleDeleteSubZone = async (wardId, subZoneId) => {
        if (!confirm("Are you sure you want to delete this sub-zone?"))
            return;
        setIsLoading(true);
        try {
            await apiCall(`/users/wards/${wardId}/subzones/${subZoneId}`, {
                method: "DELETE",
            });
            // Update wards state to remove the deleted sub-zone
            setWards((prev) => prev.map((ward) => {
                if (ward.id === wardId) {
                    return {
                        ...ward,
                        subZones: ward.subZones.filter((sz) => sz.id !== subZoneId),
                    };
                }
                return ward;
            }));
            dispatch(showSuccessToast("Sub-Zone Deleted", "Sub-zone has been deleted successfully."));
        }
        catch (error) {
            dispatch(showErrorToast("Delete Failed", error.message || "Failed to delete sub-zone. Please try again."));
        }
        finally {
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
            console.log("Saving complaint type with data:", typeData);
            console.log("Original type object:", type);
            let result;
            if (type.id && type.id !== "") {
                // Update existing type
                console.log("Updating existing complaint type with ID:", type.id);
                result = await updateComplaintType({
                    id: type.id,
                    data: typeData,
                }).unwrap();
                console.log("Update result:", result);
            }
            else {
                // Create new type
                console.log("Creating new complaint type");
                result = await createComplaintType(typeData).unwrap();
                console.log("Create result:", result);
            }
            setEditingComplaintType(null);
            setIsComplaintTypeDialogOpen(false);
            // Force a refetch to ensure UI is updated
            await refetchComplaintTypes();
            dispatch(showSuccessToast("Complaint Type Saved", `Complaint type "${type.name}" has been saved successfully. Active status: ${type.isActive ? "Active" : "Inactive"}`));
        }
        catch (error) {
            console.error("Error saving complaint type:", error);
            console.error("Error details:", {
                status: error?.status,
                data: error?.data,
                message: error?.message,
                fullError: error,
            });
            const errorMessage = getApiErrorMessage(error);
            console.log("Extracted error message:", errorMessage);
            dispatch(showErrorToast("Error saving complaint type", errorMessage));
        }
        finally {
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
                isActive: !type.isActive, // Toggle the status
            };
            console.log(`Toggling complaint type ${type.name} to ${!type.isActive ? "Active" : "Inactive"}`);
            await updateComplaintType({
                id: type.id,
                data: updatedData,
            }).unwrap();
            // Force a refetch to ensure UI is updated
            await refetchComplaintTypes();
            dispatch(showSuccessToast("Status Updated", `${type.name} is now ${!type.isActive ? "Active" : "Inactive"}`));
        }
        catch (error) {
            console.error("Error toggling complaint type status:", error);
            const errorMessage = getApiErrorMessage(error);
            dispatch(showErrorToast("Update Failed", errorMessage));
        }
    };
    const handleDeleteComplaintType = async (typeId) => {
        if (!confirm("Are you sure you want to delete this complaint type?"))
            return;
        setIsLoading(true);
        try {
            await deleteComplaintType(typeId).unwrap();
            dispatch(showSuccessToast("Complaint Type Deleted", "Complaint type has been deleted successfully."));
        }
        catch (error) {
            dispatch(showErrorToast("Delete Failed", error.message || "Failed to delete complaint type. Please try again."));
        }
        finally {
            setIsLoading(false);
        }
    };
    // System Settings Functions
    const handleUpdateSystemSetting = async (key, value) => {
        setIsLoading(true);
        try {
            const response = await apiCall(`/system-config/${key}`, {
                method: "PUT",
                body: JSON.stringify({ value }),
            });
            setSystemSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
            dispatch(showSuccessToast("Setting Updated", `System setting "${key}" has been updated.`));
        }
        catch (error) {
            dispatch(showErrorToast("Update Failed", error.message || "Failed to update system setting. Please try again."));
        }
        finally {
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
                method: "POST",
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: formData,
            });
            if (!response.ok) {
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
        }
        catch (error) {
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
                    method: "PUT",
                    body: JSON.stringify({
                        value: setting.value,
                        description: setting.description,
                    }),
                });
                setSystemSettings((prev) => prev.map((s) => s.key === setting.key ? { ...setting, ...response.data } : s));
            }
            else {
                // Create new setting
                response = await apiCall("/system-config", {
                    method: "POST",
                    body: JSON.stringify(settingData),
                });
                setSystemSettings((prev) => [...prev, response.data]);
            }
            setEditingSetting(null);
            setIsSettingDialogOpen(false);
            dispatch(showSuccessToast("Setting Saved", `System setting "${setting.key}" has been saved successfully.`));
        }
        catch (error) {
            dispatch(showErrorToast("Save Failed", error.message || "Failed to save system setting. Please try again."));
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleDeleteSystemSetting = async (key) => {
        if (!confirm("Are you sure you want to delete this system setting?"))
            return;
        setIsLoading(true);
        try {
            await apiCall(`/system-config/${key}`, { method: "DELETE" });
            setSystemSettings((prev) => prev.filter((s) => s.key !== key));
            dispatch(showSuccessToast("Setting Deleted", "System setting has been deleted successfully."));
        }
        catch (error) {
            dispatch(showErrorToast("Delete Failed", error.message || "Failed to delete system setting. Please try again."));
        }
        finally {
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
            }
            else {
                newSet.add(wardId);
            }
            return newSet;
        });
    };
    const handleOpenBoundaryManager = (ward) => {
        setSelectedWardForBoundary(ward);
        setIsBoundaryManagerOpen(true);
    };
    if (!user) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx(AlertTriangle, { className: "h-12 w-12 text-yellow-500 mx-auto mb-4" }), _jsx("h2", { className: "text-xl font-semibold mb-2", children: "Authentication Required" }), _jsx("p", { className: "text-gray-600", children: "Please log in to access the system configuration." })] }) }));
    }
    if (user.role !== "ADMINISTRATOR") {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx(Shield, { className: "h-12 w-12 text-red-500 mx-auto mb-4" }), _jsx("h2", { className: "text-xl font-semibold mb-2", children: "Access Denied" }), _jsx("p", { className: "text-gray-600", children: "Administrator privileges required to access this page." })] }) }));
    }
    if (dataLoading) {
        return (_jsxs("div", { className: "flex items-center justify-center h-64", children: [_jsx(RefreshCw, { className: "h-8 w-8 animate-spin" }), _jsx("span", { className: "ml-2", children: "Loading configuration data..." })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white", children: [_jsx("h1", { className: "text-3xl font-bold mb-2", children: "System Configuration" }), _jsx("p", { className: "text-gray-300", children: "Manage wards, complaint types, system settings, and administrative controls" })] }), _jsxs(Tabs, { defaultValue: defaultTab, className: "space-y-4", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "wards", children: "Wards & Zones" }), _jsx(TabsTrigger, { value: "types", children: "Complaint Types" }), _jsx(TabsTrigger, { value: "settings", children: "System Settings" })] }), _jsx(TabsContent, { value: "wards", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs(CardTitle, { className: "flex items-center", children: [_jsx(MapPin, { className: "h-5 w-5 mr-2" }), "Ward Management"] }), _jsxs(Button, { onClick: () => {
                                                    setEditingWard({
                                                        id: "",
                                                        name: "",
                                                        description: "",
                                                        isActive: true,
                                                        subZones: [],
                                                    });
                                                    setIsWardDialogOpen(true);
                                                }, children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Ward"] })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: wards.map((ward) => (_jsx("div", { className: "border rounded-lg", children: _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => toggleWardExpansion(ward.id), children: expandedWards.has(ward.id) ? (_jsx(ChevronDown, { className: "h-4 w-4" })) : (_jsx(ChevronRight, { className: "h-4 w-4" })) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: ward.name }), _jsx("p", { className: "text-sm text-gray-600", children: ward.description })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Badge, { variant: "secondary", children: [ward.subZones?.length || 0, " zones"] }), _jsx(Badge, { className: ward.isActive
                                                                            ? "bg-green-100 text-green-800"
                                                                            : "bg-gray-100 text-gray-800", children: ward.isActive ? "Active" : "Inactive" }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => {
                                                                            setEditingWard(ward);
                                                                            setIsWardDialogOpen(true);
                                                                        }, children: _jsx(Edit, { className: "h-3 w-3" }) }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => handleDeleteWard(ward.id), disabled: isLoading, children: _jsx(Trash2, { className: "h-3 w-3" }) })] })] }), expandedWards.has(ward.id) && (_jsxs("div", { className: "mt-4 pl-8 border-l-2 border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("h4", { className: "font-medium text-sm", children: "Sub-Zones" }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => {
                                                                            setEditingSubZone({
                                                                                id: "",
                                                                                name: "",
                                                                                wardId: ward.id,
                                                                                description: "",
                                                                                isActive: true,
                                                                            });
                                                                            setIsSubZoneDialogOpen(true);
                                                                        }, children: [_jsx(Plus, { className: "h-3 w-3 mr-1" }), "Add Sub-Zone"] })] }), _jsx("div", { className: "space-y-2", children: ward.subZones?.map((subZone) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-gray-50 rounded", children: [_jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium", children: subZone.name }), _jsx("p", { className: "text-xs text-gray-600", children: subZone.description })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Badge, { variant: subZone.isActive ? "default" : "secondary", className: "text-xs", children: subZone.isActive ? "Active" : "Inactive" }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
                                                                                        setEditingSubZone(subZone);
                                                                                        setIsSubZoneDialogOpen(true);
                                                                                    }, children: _jsx(Edit, { className: "h-3 w-3" }) }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleDeleteSubZone(ward.id, subZone.id), disabled: isLoading, children: _jsx(Trash2, { className: "h-3 w-3" }) })] })] }, subZone.id))) || (_jsx("p", { className: "text-sm text-gray-500", children: "No sub-zones defined" })) })] }))] }) }, ward.id))) }) })] }) }), _jsx(TabsContent, { value: "types", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs(CardTitle, { className: "flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2" }), "Complaint Type Management"] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: () => refetchComplaintTypes(), size: "sm", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Refresh"] }), _jsxs(Button, { onClick: () => {
                                                            setEditingComplaintType({
                                                                id: "",
                                                                name: "",
                                                                description: "",
                                                                priority: "MEDIUM",
                                                                slaHours: 48,
                                                                isActive: true,
                                                            });
                                                            setIsComplaintTypeDialogOpen(true);
                                                        }, children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Type"] })] })] }) }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Type Name" }), _jsx(TableHead, { children: "Description" }), _jsx(TableHead, { children: "Priority" }), _jsx(TableHead, { children: "SLA (Hours)" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: complaintTypesLoading ? (_jsx(TableRow, { children: _jsxs(TableCell, { colSpan: 6, className: "text-center py-4", children: [_jsx(RefreshCw, { className: "h-4 w-4 animate-spin mx-auto mb-2" }), "Loading complaint types..."] }) })) : complaintTypesError ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 6, className: "text-center py-4 text-red-600", children: "Failed to load complaint types. Please try again." }) })) : complaintTypesResponse?.data?.length ? (complaintTypesResponse.data.map((type) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: type.name }), _jsx(TableCell, { children: type.description }), _jsx(TableCell, { children: _jsx(Badge, { className: getPriorityColor(type.priority), children: type.priority }) }), _jsxs(TableCell, { children: [type.slaHours, "h"] }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { className: type.isActive
                                                                            ? "bg-green-100 text-green-800"
                                                                            : "bg-gray-100 text-gray-800", children: type.isActive ? "Active" : "Inactive" }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleToggleComplaintTypeStatus(type), disabled: isLoading, className: "h-6 w-6 p-0", title: `Make ${type.isActive ? "Inactive" : "Active"}`, children: _jsx(RefreshCw, { className: "h-3 w-3" }) })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => {
                                                                            setEditingComplaintType(type);
                                                                            setIsComplaintTypeDialogOpen(true);
                                                                        }, children: _jsx(Edit, { className: "h-3 w-3" }) }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => handleDeleteComplaintType(type.id), disabled: isLoading, children: _jsx(Trash2, { className: "h-3 w-3" }) })] }) })] }, type.id)))) : (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 6, className: "text-center py-4 text-gray-500", children: "No complaint types found. Create one to get started." }) })) })] }) })] }) }), _jsx(TabsContent, { value: "settings", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Settings, { className: "h-5 w-5 mr-2" }), "System Settings"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-8", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-medium mb-4 flex items-center", children: [_jsx(Globe, { className: "h-5 w-5 mr-2" }), "Application Settings"] }), _jsxs("div", { className: "space-y-4", children: [(() => {
                                                                const s = systemSettings.find((x) => x.key === "APP_NAME");
                                                                if (!s)
                                                                    return null;
                                                                return (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsxs("div", { className: "mb-2", children: [_jsx("h4", { className: "font-medium", children: "Application Name" }), _jsx("p", { className: "text-sm text-gray-600", children: "Shown in headers, emails and PDFs." })] }), _jsx(Input, { type: "text", value: s.value, onChange: (e) => setSystemSettings((prev) => prev.map((it) => it.key === s.key
                                                                                ? { ...it, value: e.target.value }
                                                                                : it)), onBlur: (e) => handleUpdateSystemSetting(s.key, e.target.value), placeholder: "Enter application name", className: "max-w-md" })] }, s.key));
                                                            })(), (() => {
                                                                const s = systemSettings.find((x) => x.key === "APP_LOGO_URL");
                                                                if (!s)
                                                                    return null;
                                                                return (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: "Application Logo URL" }), _jsx("p", { className: "text-sm text-gray-600", children: "Public URL for the logo shown in the header and PDFs." })] }), s.value && (_jsx("img", { src: s.value, alt: "Logo", className: "h-10 w-10 object-contain border rounded ml-4", onError: (e) => (e.target.style.display = "none") }))] }), _jsx(Input, { type: "text", value: s.value, onChange: (e) => setSystemSettings((prev) => prev.map((it) => it.key === s.key
                                                                                ? { ...it, value: e.target.value }
                                                                                : it)), onBlur: (e) => handleUpdateSystemSetting(s.key, e.target.value), placeholder: "https://.../logo.png", className: "max-w-md" })] }, s.key));
                                                            })(), (() => {
                                                                const s = systemSettings.find((x) => x.key === "APP_LOGO_SIZE");
                                                                if (!s)
                                                                    return null;
                                                                return (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsxs("div", { className: "mb-2", children: [_jsx("h4", { className: "font-medium", children: "Logo Size" }), _jsx("p", { className: "text-sm text-gray-600", children: "Controls the displayed logo size (small/medium/large)." })] }), _jsxs(Select, { value: s.value, onValueChange: (value) => {
                                                                                setSystemSettings((prev) => prev.map((it) => it.key === s.key ? { ...it, value } : it));
                                                                                handleUpdateSystemSetting(s.key, value);
                                                                            }, children: [_jsx(SelectTrigger, { className: "w-40", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "small", children: "Small" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "large", children: "Large" })] })] })] }, s.key));
                                                            })()] })] }), _jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-medium mb-4 flex items-center", children: [_jsx(Shield, { className: "h-5 w-5 mr-2" }), "General Settings"] }), _jsx("div", { className: "space-y-4", children: (() => {
                                                            const keys = [
                                                                "DATE_TIME_FORMAT",
                                                                "TIME_ZONE",
                                                                "DEFAULT_SLA_HOURS",
                                                                "OTP_EXPIRY_MINUTES",
                                                                "MAX_FILE_SIZE_MB",
                                                                "NOTIFICATION_SETTINGS",
                                                                "ADMIN_EMAIL",
                                                            ];
                                                            return keys
                                                                .map((k) => systemSettings.find((s) => s.key === k))
                                                                .filter(Boolean)
                                                                .map((setting) => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsx("div", { className: "flex justify-between items-start mb-2", children: _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-medium", children: {
                                                                                        DATE_TIME_FORMAT: "Date & Time Format",
                                                                                        TIME_ZONE: "Time Zone",
                                                                                        DEFAULT_SLA_HOURS: "Default SLA (hours)",
                                                                                        OTP_EXPIRY_MINUTES: "OTP Expiry (minutes)",
                                                                                        MAX_FILE_SIZE_MB: "Max File Size (MB)",
                                                                                        NOTIFICATION_SETTINGS: "Notification Settings",
                                                                                        ADMIN_EMAIL: "Administrator Email",
                                                                                    }[setting.key] || setting.key }), _jsx("p", { className: "text-sm text-gray-600", children: setting.description })] }) }), _jsx("div", { className: "mt-3", children: setting.key === "NOTIFICATION_SETTINGS" ? (_jsx(Textarea, { value: setting.value, onChange: (e) => setSystemSettings((prev) => prev.map((s) => s.key === setting.key
                                                                                ? { ...s, value: e.target.value }
                                                                                : s)), onBlur: (e) => handleUpdateSystemSetting(setting.key, e.target.value), className: "max-w-md" })) : setting.type === "number" ? (_jsx(Input, { type: "number", value: setting.value, onChange: (e) => setSystemSettings((prev) => prev.map((s) => s.key === setting.key
                                                                                ? { ...s, value: e.target.value }
                                                                                : s)), onBlur: (e) => handleUpdateSystemSetting(setting.key, e.target.value), className: "max-w-md" })) : (_jsx(Input, { type: "text", value: setting.value, onChange: (e) => setSystemSettings((prev) => prev.map((s) => s.key === setting.key
                                                                                ? { ...s, value: e.target.value }
                                                                                : s)), onBlur: (e) => handleUpdateSystemSetting(setting.key, e.target.value), className: "max-w-md" })) })] }, setting.key)));
                                                        })() })] }), _jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-medium mb-4 flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2" }), "Complaint ID Configuration"] }), _jsxs("div", { className: "space-y-4", children: [systemSettings
                                                                .filter((s) => s.key.startsWith("COMPLAINT_ID"))
                                                                .map((setting) => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsx("div", { className: "flex justify-between items-start mb-2", children: _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-medium", children: setting.key }), _jsx("p", { className: "text-sm text-gray-600", children: setting.description })] }) }), _jsx("div", { className: "mt-3", children: _jsx(Input, { type: setting.type === "number" ? "number" : "text", value: setting.value, onChange: (e) => setSystemSettings((prev) => prev.map((s) => s.key === setting.key
                                                                                ? { ...s, value: e.target.value }
                                                                                : s)), onBlur: (e) => handleUpdateSystemSetting(setting.key, e.target.value), placeholder: `Enter ${setting.type} value`, className: "max-w-md" }) })] }, setting.key))), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-blue-500 mr-2 mt-0.5" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-blue-900", children: "Complaint ID Preview" }), _jsxs("p", { className: "text-sm text-blue-700 mt-1", children: ["With current settings, new complaint IDs will look like:", _jsxs("span", { className: "font-mono bg-white px-2 py-1 rounded border ml-2", children: [systemSettings.find((s) => s.key === "COMPLAINT_ID_PREFIX")?.value || "KSC", (parseInt(systemSettings.find((s) => s.key === "COMPLAINT_ID_START_NUMBER")?.value) || 1)
                                                                                                    .toString()
                                                                                                    .padStart(parseInt(systemSettings.find((s) => s.key === "COMPLAINT_ID_LENGTH")?.value) || 4, "0")] })] })] })] }) })] })] }), _jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-medium mb-4 flex items-center", children: [_jsx(Settings, { className: "h-5 w-5 mr-2" }), "Complaint Management"] }), _jsxs("div", { className: "space-y-4", children: [systemSettings
                                                                .filter((s) => s.key === "AUTO_ASSIGN_COMPLAINTS")
                                                                .map((setting) => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsx("div", { className: "flex justify-between items-start mb-2", children: _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-medium", children: "Auto-Assign Complaints" }), _jsx("p", { className: "text-sm text-gray-600", children: "When enabled, complaints will be automatically assigned to Ward Officers based on the ward location" })] }) }), _jsx("div", { className: "mt-3", children: _jsxs(Select, { value: setting.value, onValueChange: (value) => {
                                                                                setSystemSettings((prev) => prev.map((s) => s.key === setting.key
                                                                                    ? { ...s, value: value }
                                                                                    : s));
                                                                                handleUpdateSystemSetting(setting.key, value);
                                                                            }, children: [_jsx(SelectTrigger, { className: "w-32", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "true", children: "Enabled" }), _jsx(SelectItem, { value: "false", children: "Disabled" })] })] }) })] }, setting.key))), _jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mr-2 mt-0.5" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-green-900", children: "How Auto-Assignment Works" }), _jsxs("div", { className: "text-sm text-green-700 mt-1 space-y-1", children: [_jsx("p", { children: "\u2022 When a complaint is submitted by a citizen, it gets automatically assigned to a Ward Officer in that ward" }), _jsx("p", { children: "\u2022 When an admin creates a complaint, it also gets auto-assigned to the respective Ward Officer" }), _jsx("p", { children: "\u2022 If disabled, complaints remain in \"Registered\" status until manually assigned" }), _jsx("p", { children: "\u2022 Ward Officers can then assign complaints to Maintenance Team members" })] })] })] }) })] })] }), _jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-medium mb-4 flex items-center", children: [_jsx(MapPin, { className: "h-5 w-5 mr-2" }), "Map & Location Settings"] }), _jsxs("div", { className: "space-y-4", children: [systemSettings.filter((s) => s.key.startsWith("MAP_"))
                                                                .length === 0 && (_jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800", children: "No map settings configured yet." })), systemSettings
                                                                .filter((s) => [
                                                                "MAP_SEARCH_PLACE",
                                                                "MAP_DEFAULT_LAT",
                                                                "MAP_DEFAULT_LNG",
                                                            ].includes(s.key))
                                                                .map((setting) => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsxs("div", { className: "mb-2", children: [_jsx("h4", { className: "font-medium", children: {
                                                                                    MAP_SEARCH_PLACE: "Search Place Context",
                                                                                    MAP_DEFAULT_LAT: "Default Latitude",
                                                                                    MAP_DEFAULT_LNG: "Default Longitude",
                                                                                    MAP_COUNTRY_CODES: "Country Codes (ISO2, comma-separated)",
                                                                                    MAP_BBOX_NORTH: "Bounding Box North",
                                                                                    MAP_BBOX_SOUTH: "Bounding Box South",
                                                                                    MAP_BBOX_EAST: "Bounding Box East",
                                                                                    MAP_BBOX_WEST: "Bounding Box West",
                                                                                }[setting.key] || setting.key }), _jsx("p", { className: "text-sm text-gray-600", children: setting.description })] }), _jsx(Input, { type: setting.type === "number" ? "number" : "text", value: setting.value, onChange: (e) => setSystemSettings((prev) => prev.map((s) => s.key === setting.key
                                                                            ? { ...s, value: e.target.value }
                                                                            : s)), onBlur: (e) => handleUpdateSystemSetting(setting.key, e.target.value), placeholder: `Enter ${setting.type} value`, className: "max-w-md" })] }, setting.key))), _jsxs("div", { children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setShowAdvancedMap((v) => !v), children: showAdvancedMap
                                                                            ? "Hide Advanced Map Settings"
                                                                            : "Show Advanced Map Settings" }), showAdvancedMap && (_jsx("div", { className: "mt-3 space-y-4", children: systemSettings
                                                                            .filter((s) => s.key.startsWith("MAP_") &&
                                                                            ![
                                                                                "MAP_SEARCH_PLACE",
                                                                                "MAP_DEFAULT_LAT",
                                                                                "MAP_DEFAULT_LNG",
                                                                            ].includes(s.key))
                                                                            .map((setting) => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsxs("div", { className: "mb-2", children: [_jsx("h4", { className: "font-medium", children: {
                                                                                                MAP_SEARCH_PLACE: "Search Place Context",
                                                                                                MAP_DEFAULT_LAT: "Default Latitude",
                                                                                                MAP_DEFAULT_LNG: "Default Longitude",
                                                                                                MAP_COUNTRY_CODES: "Country Codes (ISO2, comma-separated)",
                                                                                                MAP_BBOX_NORTH: "Bounding Box North",
                                                                                                MAP_BBOX_SOUTH: "Bounding Box South",
                                                                                                MAP_BBOX_EAST: "Bounding Box East",
                                                                                                MAP_BBOX_WEST: "Bounding Box West",
                                                                                            }[setting.key] || setting.key }), _jsx("p", { className: "text-sm text-gray-600", children: setting.description })] }), _jsx(Input, { type: setting.type === "number"
                                                                                        ? "number"
                                                                                        : "text", value: setting.value, onChange: (e) => setSystemSettings((prev) => prev.map((s) => s.key === setting.key
                                                                                        ? { ...s, value: e.target.value }
                                                                                        : s)), onBlur: (e) => handleUpdateSystemSetting(setting.key, e.target.value), placeholder: `Enter ${setting.type} value`, className: "max-w-md" })] }, setting.key))) }))] })] })] }), _jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-medium mb-4 flex items-center", children: [_jsx(Phone, { className: "h-5 w-5 mr-2" }), "Contact Information"] }), _jsx("div", { className: "space-y-4", children: systemSettings
                                                            .filter((s) => s.key.startsWith("CONTACT_"))
                                                            .map((setting) => (_jsxs("div", { className: "border rounded-lg p-4", children: [_jsx("div", { className: "flex justify-between items-start mb-2", children: _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-medium", children: {
                                                                                    CONTACT_HELPLINE: "Helpline Number",
                                                                                    CONTACT_EMAIL: "Support Email",
                                                                                    CONTACT_OFFICE_HOURS: "Office Hours",
                                                                                    CONTACT_OFFICE_ADDRESS: "Office Address",
                                                                                }[setting.key] || setting.key }), _jsx("p", { className: "text-sm text-gray-600", children: setting.description })] }) }), _jsx("div", { className: "mt-3", children: _jsx(Input, { type: "text", value: setting.value, onChange: (e) => setSystemSettings((prev) => prev.map((s) => s.key === setting.key
                                                                            ? { ...s, value: e.target.value }
                                                                            : s)), onBlur: (e) => handleUpdateSystemSetting(setting.key, e.target.value), placeholder: `Enter ${setting.type} value`, className: "max-w-md" }) })] }, setting.key))) })] })] }) })] }) }), _jsx(TabsContent, { value: "advanced", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Database, { className: "h-5 w-5 mr-2" }), "Database Management"] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Backup Database"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Database, { className: "h-4 w-4 mr-2" }), "Restore Database"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), "Optimize Tables"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Shield, { className: "h-5 w-5 mr-2" }), "Security Settings"] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Users, { className: "h-4 w-4 mr-2" }), "Password Policies"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Clock, { className: "h-4 w-4 mr-2" }), "Session Management"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(AlertTriangle, { className: "h-4 w-4 mr-2" }), "Security Logs"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Mail, { className: "h-5 w-5 mr-2" }), "Email Configuration"] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), "SMTP Settings"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "Email Templates"] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(Mail, { className: "h-4 w-4 mr-2" }), "Test Email"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Globe, { className: "h-5 w-5 mr-2" }), "System Information"] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "text-sm space-y-1", children: [_jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Version:" }), " 1.0.0"] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Environment:" }), " Production"] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Uptime:" }), " 7 days"] })] }), _jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Refresh Data"] })] })] })] }) })] }), _jsx(Dialog, { open: isWardDialogOpen, onOpenChange: setIsWardDialogOpen, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: editingWard?.id ? "Edit Ward" : "Add New Ward" }) }), editingWard && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "wardName", children: "Ward Name" }), _jsx(Input, { id: "wardName", value: editingWard.name || "", onChange: (e) => setEditingWard({
                                                ...editingWard,
                                                name: e.target.value,
                                            }), placeholder: "Enter ward name" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "wardDescription", children: "Description" }), _jsx(Textarea, { id: "wardDescription", value: editingWard.description || "", onChange: (e) => setEditingWard({
                                                ...editingWard,
                                                description: e.target.value,
                                            }), placeholder: "Enter ward description" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "wardActive", checked: editingWard.isActive, onCheckedChange: (checked) => setEditingWard({
                                                ...editingWard,
                                                isActive: !!checked,
                                            }) }), _jsx(Label, { htmlFor: "wardActive", children: "Active" })] }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                setEditingWard(null);
                                                setIsWardDialogOpen(false);
                                            }, children: "Cancel" }), _jsxs(Button, { onClick: () => handleSaveWard(editingWard), disabled: isLoading || !editingWard.name, children: [isLoading ? (_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" })) : (_jsx(Save, { className: "h-4 w-4 mr-2" })), "Save"] })] })] }))] }) }), selectedWardForBoundary && (_jsx(WardBoundaryManager, { isOpen: isBoundaryManagerOpen, onClose: () => {
                    setIsBoundaryManagerOpen(false);
                    setSelectedWardForBoundary(null);
                }, ward: selectedWardForBoundary, subZones: selectedWardForBoundary.subZones || [], onSave: handleSaveBoundaries })), _jsx(Dialog, { open: isSubZoneDialogOpen, onOpenChange: setIsSubZoneDialogOpen, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: editingSubZone?.id ? "Edit Sub-Zone" : "Add New Sub-Zone" }) }), editingSubZone && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "subZoneName", children: "Sub-Zone Name" }), _jsx(Input, { id: "subZoneName", value: editingSubZone.name || "", onChange: (e) => setEditingSubZone({
                                                ...editingSubZone,
                                                name: e.target.value,
                                            }), placeholder: "Enter sub-zone name" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "subZoneDescription", children: "Description" }), _jsx(Textarea, { id: "subZoneDescription", value: editingSubZone.description || "", onChange: (e) => setEditingSubZone({
                                                ...editingSubZone,
                                                description: e.target.value,
                                            }), placeholder: "Enter sub-zone description" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "subZoneActive", checked: editingSubZone.isActive, onCheckedChange: (checked) => setEditingSubZone({
                                                ...editingSubZone,
                                                isActive: !!checked,
                                            }) }), _jsx(Label, { htmlFor: "subZoneActive", children: "Active" })] }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                setEditingSubZone(null);
                                                setIsSubZoneDialogOpen(false);
                                            }, children: "Cancel" }), _jsxs(Button, { onClick: () => handleSaveSubZone(editingSubZone), disabled: isLoading || !editingSubZone.name, children: [isLoading ? (_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" })) : (_jsx(Save, { className: "h-4 w-4 mr-2" })), "Save"] })] })] }))] }) }), _jsx(Dialog, { open: isComplaintTypeDialogOpen, onOpenChange: setIsComplaintTypeDialogOpen, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: editingComplaintType?.id
                                    ? "Edit Complaint Type"
                                    : "Add New Complaint Type" }) }), editingComplaintType && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "typeName", children: "Type Name" }), _jsx(Input, { id: "typeName", value: editingComplaintType.name || "", onChange: (e) => setEditingComplaintType({
                                                ...editingComplaintType,
                                                name: e.target.value,
                                            }), placeholder: "Enter complaint type name" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "typeDescription", children: "Description" }), _jsx(Textarea, { id: "typeDescription", value: editingComplaintType.description || "", onChange: (e) => setEditingComplaintType({
                                                ...editingComplaintType,
                                                description: e.target.value,
                                            }), placeholder: "Enter type description" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "priority", children: "Priority" }), _jsxs(Select, { value: editingComplaintType.priority || "MEDIUM", onValueChange: (value) => setEditingComplaintType({
                                                ...editingComplaintType,
                                                priority: value,
                                            }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "LOW", children: "Low" }), _jsx(SelectItem, { value: "MEDIUM", children: "Medium" }), _jsx(SelectItem, { value: "HIGH", children: "High" }), _jsx(SelectItem, { value: "CRITICAL", children: "Critical" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "slaHours", children: "SLA Hours" }), _jsx(Input, { id: "slaHours", type: "number", value: editingComplaintType.slaHours?.toString() || "", onChange: (e) => {
                                                const value = e.target.value;
                                                const numValue = value === "" ? 48 : parseInt(value, 10);
                                                setEditingComplaintType({
                                                    ...editingComplaintType,
                                                    slaHours: isNaN(numValue) ? 48 : numValue,
                                                });
                                            }, placeholder: "Enter SLA hours", min: "1" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "typeActive", checked: editingComplaintType.isActive, onCheckedChange: (checked) => setEditingComplaintType({
                                                ...editingComplaintType,
                                                isActive: !!checked,
                                            }) }), _jsx(Label, { htmlFor: "typeActive", children: "Active" })] }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                setEditingComplaintType(null);
                                                setIsComplaintTypeDialogOpen(false);
                                            }, children: "Cancel" }), _jsxs(Button, { onClick: () => handleSaveComplaintType(editingComplaintType), disabled: isLoading || !editingComplaintType.name, children: [isLoading ? (_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" })) : (_jsx(Save, { className: "h-4 w-4 mr-2" })), "Save"] })] })] }))] }) }), _jsx(Dialog, { open: isSettingDialogOpen, onOpenChange: setIsSettingDialogOpen, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: editingSetting?.key &&
                                    systemSettings.find((s) => s.key === editingSetting.key)
                                    ? "Edit System Setting"
                                    : "Add New System Setting" }) }), editingSetting && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "settingKey", children: "Setting Key" }), _jsx(Input, { id: "settingKey", value: editingSetting.key || "", onChange: (e) => setEditingSetting({
                                                ...editingSetting,
                                                key: e.target.value
                                                    .toUpperCase()
                                                    .replace(/[^A-Z0-9_]/g, "_"),
                                            }), placeholder: "SETTING_KEY", disabled: !!systemSettings.find((s) => s.key === editingSetting.key) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "settingValue", children: "Value" }), editingSetting.key === "APP_LOGO_URL" ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-4", children: [_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", value: "url", checked: logoUploadMode === "url", onChange: (e) => setLogoUploadMode(e.target.value), className: "form-radio" }), _jsx("span", { children: "URL" })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", value: "file", checked: logoUploadMode === "file", onChange: (e) => setLogoUploadMode(e.target.value), className: "form-radio" }), _jsx("span", { children: "Upload File" })] })] }), logoUploadMode === "url" ? (_jsx(Input, { id: "settingValue", value: editingSetting.value, onChange: (e) => setEditingSetting({
                                                        ...editingSetting,
                                                        value: e.target.value,
                                                    }), placeholder: "Enter logo URL (e.g., https://example.com/logo.png)" })) : (_jsxs("div", { className: "space-y-2", children: [_jsx(Input, { type: "file", accept: "image/*", onChange: (e) => {
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
                                                            }, className: "file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" }), logoPreview && (_jsx("div", { className: "mt-2", children: _jsx("img", { src: logoPreview, alt: "Logo preview", className: "h-16 w-16 object-contain border rounded" }) }))] })), editingSetting.value &&
                                                    editingSetting.value !== "/logo.png" && (_jsxs("div", { className: "mt-2", children: [_jsx(Label, { children: "Current Logo:" }), _jsx("img", { src: editingSetting.value, alt: "Current logo", className: "h-16 w-16 object-contain border rounded mt-1", onError: (e) => {
                                                                e.target.style.display =
                                                                    "none";
                                                            } })] }))] })) : editingSetting.key === "APP_LOGO_SIZE" ? (_jsxs(Select, { value: editingSetting.value, onValueChange: (value) => setEditingSetting({
                                                ...editingSetting,
                                                value: value,
                                            }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select logo size" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "small", children: "Small" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "large", children: "Large" })] })] })) : (_jsx(Input, { id: "settingValue", value: editingSetting.value, onChange: (e) => setEditingSetting({
                                                ...editingSetting,
                                                value: e.target.value,
                                            }), placeholder: "Setting value" }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "settingDescription", children: "Description" }), _jsx(Textarea, { id: "settingDescription", value: editingSetting.description || "", onChange: (e) => setEditingSetting({
                                                ...editingSetting,
                                                description: e.target.value,
                                            }), placeholder: "Setting description" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "settingType", children: "Type" }), _jsxs(Select, { value: editingSetting.type || "string", onValueChange: (value) => setEditingSetting({
                                                ...editingSetting,
                                                type: value,
                                            }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "string", children: "String" }), _jsx(SelectItem, { value: "number", children: "Number" }), _jsx(SelectItem, { value: "boolean", children: "Boolean" }), _jsx(SelectItem, { value: "json", children: "JSON" })] })] })] }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                setEditingSetting(null);
                                                setIsSettingDialogOpen(false);
                                                resetLogoUploadState();
                                            }, children: "Cancel" }), _jsxs(Button, { onClick: async () => {
                                                if (editingSetting.key === "APP_LOGO_URL" &&
                                                    logoUploadMode === "file" &&
                                                    logoFile) {
                                                    try {
                                                        setIsLoading(true);
                                                        await handleLogoFileUpload(logoFile);
                                                        // Reset file upload state
                                                        setLogoFile(null);
                                                        setLogoPreview(null);
                                                        setLogoUploadMode("url");
                                                        setEditingSetting(null);
                                                        setIsSettingDialogOpen(false);
                                                        dispatch(showSuccessToast("Logo Uploaded", "App logo has been uploaded and updated successfully."));
                                                        // Refresh system settings
                                                        await loadAllData();
                                                    }
                                                    catch (error) {
                                                        dispatch(showErrorToast("Upload Failed", error.message ||
                                                            "Failed to upload logo. Please try again."));
                                                    }
                                                    finally {
                                                        setIsLoading(false);
                                                    }
                                                }
                                                else {
                                                    await handleSaveSystemSetting(editingSetting);
                                                }
                                            }, disabled: isLoading ||
                                                !editingSetting.key ||
                                                (logoUploadMode === "file" &&
                                                    editingSetting.key === "APP_LOGO_URL"
                                                    ? !logoFile
                                                    : !editingSetting.value), children: [isLoading ? (_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" })) : (_jsx(Save, { className: "h-4 w-4 mr-2" })), "Save"] })] })] }))] }) })] }));
};
export default AdminConfig;
