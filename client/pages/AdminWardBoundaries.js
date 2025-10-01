import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useGetWardsWithBoundariesQuery, useUpdateWardBoundariesMutation, } from "../store/api/wardApi";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import WardBoundaryManager from "../components/WardBoundaryManager";
import { useToast } from "../hooks/use-toast";
import { Map, MapPin, Info, AlertCircle, RefreshCw } from "lucide-react";
const AdminWardBoundaries = () => {
    const [selectedWard, setSelectedWard] = useState(null);
    const [isBoundaryManagerOpen, setIsBoundaryManagerOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // API hooks
    const { data: wardsResponse, isLoading: isLoadingWards, error: wardsError, refetch, } = useGetWardsWithBoundariesQuery();
    const [updateBoundaries] = useUpdateWardBoundariesMutation();
    const wards = wardsResponse?.data || [];
    const handleOpenBoundaryManager = (ward) => {
        setSelectedWard(ward);
        setIsBoundaryManagerOpen(true);
        setError(null);
    };
    const toastHook = useToast();
    const handleSaveBoundaries = async (wardData, subZoneData) => {
        try {
            setIsLoading(true);
            setError(null);
            await updateBoundaries({
                wardId: wardData.id,
                boundaries: wardData.boundaries,
                centerLat: wardData.centerLat,
                centerLng: wardData.centerLng,
                boundingBox: wardData.boundingBox,
                subZones: subZoneData?.map((sz) => ({
                    id: sz.id,
                    boundaries: sz.boundaries,
                    centerLat: sz.centerLat,
                    centerLng: sz.centerLng,
                    boundingBox: sz.boundingBox,
                })),
            }).unwrap();
            await refetch();
            setIsBoundaryManagerOpen(false);
            setSelectedWard(null);
            toastHook.toast({
                title: "Saved",
                description: "Ward boundaries saved successfully",
            });
        }
        catch (err) {
            const msg = err.data?.message || err.message || "Failed to save boundaries";
            setError(msg);
            toastHook.toast({ title: "Error", description: msg });
        }
        finally {
            setIsLoading(false);
        }
    };
    const getWardBoundaryStatus = (ward) => {
        const hasBoundary = ward.boundaries && ward.boundaries !== "null";
        const subZonesWithBoundaries = ward.subZones?.filter((sz) => sz.boundaries && sz.boundaries !== "null")
            .length || 0;
        const totalSubZones = ward.subZones?.length || 0;
        return {
            hasBoundary,
            subZonesWithBoundaries,
            totalSubZones,
        };
    };
    if (wardsError) {
        return (_jsx("div", { className: "max-w-4xl mx-auto p-6", children: _jsxs(Alert, { className: "border-red-200 bg-red-50", children: [_jsx(AlertCircle, { className: "h-4 w-4 text-red-600" }), _jsx(AlertDescription, { className: "text-red-800", children: "Failed to load wards. Please refresh the page and try again." })] }) }));
    }
    return (_jsxs("div", { className: "max-w-6xl mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold flex items-center gap-3", children: [_jsx(Map, { className: "h-8 w-8 text-primary" }), "Ward Geographic Boundaries"] }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Configure geographic boundaries for wards and sub-zones to enable automatic location detection" })] }), _jsxs(Button, { onClick: () => refetch(), variant: "outline", disabled: isLoadingWards, children: [_jsx(RefreshCw, { className: `h-4 w-4 mr-2 ${isLoadingWards ? "animate-spin" : ""}` }), "Refresh"] })] }), _jsxs(Alert, { children: [_jsx(Info, { className: "h-4 w-4" }), _jsx(AlertDescription, { children: "Setting geographic boundaries allows the system to automatically detect which ward and sub-zone a complaint location belongs to. This improves the user experience and helps with automatic assignment of complaints to the appropriate officers." })] }), error && (_jsxs(Alert, { className: "border-red-200 bg-red-50", children: [_jsx(AlertCircle, { className: "h-4 w-4 text-red-600" }), _jsx(AlertDescription, { className: "text-red-800", children: error })] })), isLoadingWards ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(RefreshCw, { className: "h-5 w-5 animate-spin text-primary" }), _jsx("span", { children: "Loading wards..." })] }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: wards.map((ward) => {
                    const status = getWardBoundaryStatus(ward);
                    return (_jsxs(Card, { className: "hover:shadow-md transition-shadow", children: [_jsxs(CardHeader, { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-lg", children: ward.name }), _jsx(Badge, { variant: status.hasBoundary ? "default" : "secondary", children: status.hasBoundary ? "Configured" : "Not Set" })] }), ward.description && (_jsx("p", { className: "text-sm text-muted-foreground", children: ward.description }))] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { children: "Ward Boundary:" }), _jsx(Badge, { variant: status.hasBoundary ? "default" : "outline", className: "text-xs", children: status.hasBoundary ? "Set" : "Not Set" })] }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { children: "Sub-Zone Boundaries:" }), _jsxs(Badge, { variant: status.subZonesWithBoundaries > 0
                                                            ? "default"
                                                            : "outline", className: "text-xs", children: [status.subZonesWithBoundaries, "/", status.totalSubZones] })] })] }), ward.centerLat && ward.centerLng && (_jsxs("div", { className: "text-xs text-muted-foreground bg-muted/50 p-2 rounded", children: [_jsx(MapPin, { className: "h-3 w-3 inline mr-1" }), "Center: ", ward.centerLat.toFixed(4), ",", " ", ward.centerLng.toFixed(4)] })), ward.subZones && ward.subZones.length > 0 && (_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium", children: "Sub-Zones:" }), _jsx("div", { className: "space-y-1", children: ward.subZones.map((subZone) => (_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "truncate", children: subZone.name }), _jsx(Badge, { variant: subZone.boundaries ? "default" : "outline", className: "text-xs", children: subZone.boundaries ? "Set" : "Not Set" })] }, subZone.id))) })] })), _jsxs(Button, { onClick: () => handleOpenBoundaryManager(ward), className: "w-full", disabled: isLoading, children: [_jsx(Map, { className: "h-4 w-4 mr-2" }), status.hasBoundary ? "Edit Boundaries" : "Set Boundaries"] })] })] }, ward.id));
                }) })), selectedWard && (_jsx(WardBoundaryManager, { isOpen: isBoundaryManagerOpen, onClose: () => {
                    setIsBoundaryManagerOpen(false);
                    setSelectedWard(null);
                    setError(null);
                }, ward: selectedWard, subZones: selectedWard.subZones || [], onSave: handleSaveBoundaries }))] }));
};
export default AdminWardBoundaries;
