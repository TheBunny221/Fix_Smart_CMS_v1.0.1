import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { MapPin, Navigation, Save, Info, RotateCcw, Square, AlertCircle, } from "lucide-react";
import { useToast } from "../hooks/use-toast";
const WardBoundaryManager = ({ isOpen, onClose, ward, subZones = [], onSave, }) => {
    // Default to Kochi, India coordinates
    const defaultCenter = { lat: 9.9312, lng: 76.2673 };
    const mapRef = useRef(null);
    const leafletMapRef = useRef(null);
    const drawingRef = useRef(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [wardBoundary, setWardBoundary] = useState([]);
    const [subZoneBoundaries, setSubZoneBoundaries] = useState({});
    const [editingMode, setEditingMode] = useState(null);
    const [selectedSubZone, setSelectedSubZone] = useState(null);
    const [centerCoordinates, setCenterCoordinates] = useState(ward.centerLat && ward.centerLng
        ? { lat: ward.centerLat, lng: ward.centerLng }
        : defaultCenter);
    const [livePreview, setLivePreview] = useState([]);
    const [livePreviewSub, setLivePreviewSub] = useState([]);
    // Initialize map when dialog opens
    useEffect(() => {
        if (!isOpen || !mapRef.current)
            return;
        const initializeMap = async () => {
            try {
                // Dynamically import leaflet and plugins
                const leafletModule = await import("leaflet");
                const L = leafletModule.default ?? leafletModule;
                // Expose L to window since many leaflet plugins expect a global L
                if (typeof window !== "undefined") {
                    window.L = L;
                }
                // Import leaflet-draw and its CSS; attach to the global L
                try {
                    await import("leaflet-draw");
                    try {
                        await import("leaflet-draw/dist/leaflet.draw.css");
                    }
                    catch (cssErr) {
                        console.warn("Could not load leaflet-draw CSS:", cssErr);
                    }
                }
                catch (drawError) {
                    console.warn("Leaflet-draw failed to load, drawing features may be limited:", drawError);
                }
                // Set up the default icon
                const DefaultIcon = L.icon({
                    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41],
                });
                // Create map if it doesn't exist
                if (!leafletMapRef.current && mapRef.current) {
                    leafletMapRef.current = new L.Map(mapRef.current, {
                        center: [centerCoordinates.lat, centerCoordinates.lng],
                        zoom: 13,
                        scrollWheelZoom: true,
                        preferCanvas: true,
                    });
                    // Add tile layer
                    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    }).addTo(leafletMapRef.current);
                    // Create feature groups for drawn layers
                    const drawnItems = new L.FeatureGroup();
                    leafletMapRef.current.addLayer(drawnItems);
                    // Add drawing controls only if plugin is available
                    const hasDrawControl = !!L.Control && !!L.Control.Draw;
                    let drawControl = null;
                    if (hasDrawControl) {
                        drawControl = new L.Control.Draw({
                            position: "topright",
                            draw: {
                                polygon: {
                                    allowIntersection: false,
                                    drawError: {
                                        color: "#e1e100",
                                        message: "<strong>Error:</strong> Shape edges cannot cross!",
                                    },
                                    shapeOptions: {
                                        color: "#2563eb",
                                        weight: 3,
                                        opacity: 0.8,
                                        fillOpacity: 0.2,
                                    },
                                },
                                rectangle: {
                                    shapeOptions: {
                                        color: "#dc2626",
                                        weight: 3,
                                        opacity: 0.8,
                                        fillOpacity: 0.2,
                                    },
                                },
                                circle: false,
                                marker: false,
                                polyline: false,
                                circlemarker: false,
                            },
                            edit: {
                                featureGroup: drawnItems,
                                remove: true,
                            },
                        });
                        leafletMapRef.current.addControl(drawControl);
                    }
                    else {
                        console.warn("Leaflet-draw control not available; drawing disabled.");
                    }
                    drawingRef.current = { drawnItems, drawControl };
                    // Handle drawing events only if draw plugin is available
                    if (hasDrawControl) {
                        // Use plugin's constant if available, otherwise fallback to the string event
                        const drawCreatedEvent = L.Draw?.Event?.CREATED ?? "draw:created";
                        const drawEditedEvent = L.Draw?.Event?.EDITED ?? "draw:edited";
                        const drawDeletedEvent = L.Draw?.Event?.DELETED ?? "draw:deleted";
                        const drawVertexEvent = L.Draw?.Event?.DRAWVERTEX ?? "draw:drawvertex";
                        leafletMapRef.current.on(drawCreatedEvent, (e) => {
                            const { layer, layerType } = e;
                            // Ensure the new layer is added to the drawn items group
                            drawnItems.addLayer(layer);
                            if (editingMode === "ward") {
                                // Replace existing ward boundary
                                setWardBoundary([]);
                                // remove previous layers leaving only the new one
                                drawnItems.clearLayers();
                                drawnItems.addLayer(layer);
                                if (layerType === "polygon" || layerType === "rectangle") {
                                    const coords = layer
                                        .getLatLngs()[0]
                                        .map((latlng) => [latlng.lat, latlng.lng]);
                                    setWardBoundary(coords);
                                    // Calculate center
                                    const center = calculatePolygonCenter(coords);
                                    setCenterCoordinates(center);
                                }
                            }
                            else if (editingMode === "subzone" && selectedSubZone) {
                                // Replace boundary for this subzone
                                const newBoundaries = { ...subZoneBoundaries };
                                newBoundaries[selectedSubZone] = [];
                                setSubZoneBoundaries(newBoundaries);
                                drawnItems.addLayer(layer);
                                if (layerType === "polygon" || layerType === "rectangle") {
                                    const coords = layer
                                        .getLatLngs()[0]
                                        .map((latlng) => [latlng.lat, latlng.lng]);
                                    setSubZoneBoundaries((prev) => ({
                                        ...prev,
                                        [selectedSubZone]: coords,
                                    }));
                                }
                            }
                        });
                        // Handle edits
                        leafletMapRef.current.on(drawEditedEvent, (e) => {
                            const layers = e.layers;
                            layers.eachLayer((layer) => {
                                const coords = layer
                                    .getLatLngs()[0]
                                    .map((latlng) => [latlng.lat, latlng.lng]);
                                if (editingMode === "ward") {
                                    setWardBoundary(coords);
                                    setCenterCoordinates(calculatePolygonCenter(coords));
                                }
                                else if (editingMode === "subzone" && selectedSubZone) {
                                    setSubZoneBoundaries((prev) => ({
                                        ...prev,
                                        [selectedSubZone]: coords,
                                    }));
                                }
                            });
                        });
                        // Handle deletions
                        leafletMapRef.current.on(drawDeletedEvent, (e) => {
                            const layers = e.layers;
                            layers.eachLayer((layer) => {
                                // if deleted, clear current editing target
                                if (editingMode === "ward") {
                                    setWardBoundary([]);
                                }
                                else if (editingMode === "subzone" && selectedSubZone) {
                                    setSubZoneBoundaries((prev) => {
                                        const copy = { ...prev };
                                        delete copy[selectedSubZone];
                                        return copy;
                                    });
                                }
                            });
                        });
                        // Live preview while drawing
                        leafletMapRef.current.on(drawVertexEvent, (e) => {
                            try {
                                const latlngs = e?.layers?.getLayers?.()[0]?.getLatLngs?.()[0] ??
                                    e?.layer?.getLatLngs?.()[0] ??
                                    [];
                                const coords = latlngs.map((latlng) => [
                                    latlng.lat,
                                    latlng.lng,
                                ]);
                                // Show live preview in ward or subzone state without committing
                                if (editingMode === "ward") {
                                    setLivePreview(coords);
                                }
                                else if (editingMode === "subzone" && selectedSubZone) {
                                    setLivePreviewSub(coords);
                                }
                            }
                            catch (err) {
                                // ignore
                            }
                        });
                        // Also update states when map is clicked for enabling drawing via custom toolbar
                        leafletMapRef.current.on("click", () => {
                            // clear any preview when clicking
                            setLivePreview([]);
                            setLivePreviewSub([]);
                        });
                    }
                    // Load existing boundaries
                    loadExistingBoundaries(L, drawnItems);
                    // Add a simple custom toolbar overlay in case CSS-based icons are missing
                    const mapContainer = leafletMapRef.current.getContainer();
                    if (mapContainer &&
                        !mapContainer.querySelector(".custom-draw-toolbar")) {
                        const toolbar = document.createElement("div");
                        toolbar.className =
                            "custom-draw-toolbar absolute top-4 right-4 z-50 flex flex-col gap-2";
                        const makeButton = (iconHtml, title, onClick) => {
                            const btn = document.createElement("button");
                            btn.innerHTML = iconHtml;
                            btn.title = title;
                            btn.className = "p-2 rounded bg-white shadow hover:bg-gray-100";
                            btn.onclick = onClick;
                            return btn;
                        };
                        // Polygon button
                        const polyBtn = makeButton('<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l7 4v8l-7 4-7-4V6z"/></svg>', "Draw Polygon", () => {
                            if (!L.Draw)
                                return;
                            const drawer = new L.Draw.Polygon(leafletMapRef.current, {});
                            drawer.enable();
                        });
                        // Rectangle button
                        const rectBtn = makeButton('<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>', "Draw Rectangle", () => {
                            if (!L.Draw)
                                return;
                            const drawer = new L.Draw.Rectangle(leafletMapRef.current, {});
                            drawer.enable();
                        });
                        // Delete/clear button
                        const delBtn = makeButton('<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18"/><path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>', "Clear All", () => {
                            clearBoundaries();
                        });
                        toolbar.appendChild(polyBtn);
                        toolbar.appendChild(rectBtn);
                        toolbar.appendChild(delBtn);
                        // Use absolute positioning wrapper
                        const wrapper = document.createElement("div");
                        wrapper.style.position = "absolute";
                        wrapper.style.top = "8px";
                        wrapper.style.right = "8px";
                        wrapper.style.zIndex = "1000";
                        wrapper.appendChild(toolbar);
                        mapContainer.style.position = "relative";
                        mapContainer.appendChild(wrapper);
                    }
                }
                setMapError(null);
            }
            catch (error) {
                console.error("Error initializing map:", error);
                setMapError("Failed to load map. Please refresh and try again.");
            }
        };
        const timer = setTimeout(initializeMap, 100);
        return () => clearTimeout(timer);
    }, [
        isOpen,
        centerCoordinates.lat,
        centerCoordinates.lng,
        editingMode,
        selectedSubZone,
    ]);
    // Load existing boundaries from ward and subzones data
    const loadExistingBoundaries = async (L, drawnItems) => {
        try {
            // Load ward boundary
            if (ward.boundaries) {
                const coords = JSON.parse(ward.boundaries);
                setWardBoundary(coords);
                if (coords.length > 0) {
                    const polygon = L.polygon(coords, {
                        color: "#2563eb",
                        weight: 3,
                        opacity: 0.8,
                        fillOpacity: 0.2,
                    });
                    drawnItems.addLayer(polygon);
                }
            }
            // Load subzone boundaries
            const loadedSubZoneBoundaries = {};
            for (const subZone of subZones) {
                if (subZone.boundaries) {
                    const coords = JSON.parse(subZone.boundaries);
                    loadedSubZoneBoundaries[subZone.id] = coords;
                    if (coords.length > 0) {
                        const polygon = L.polygon(coords, {
                            color: "#dc2626",
                            weight: 2,
                            opacity: 0.8,
                            fillOpacity: 0.1,
                        });
                        drawnItems.addLayer(polygon);
                    }
                }
            }
            setSubZoneBoundaries(loadedSubZoneBoundaries);
        }
        catch (error) {
            console.error("Error loading existing boundaries:", error);
        }
    };
    // Calculate polygon center point
    const calculatePolygonCenter = (coords) => {
        const latSum = coords.reduce((sum, coord) => sum + coord[0], 0);
        const lngSum = coords.reduce((sum, coord) => sum + coord[1], 0);
        return {
            lat: latSum / coords.length,
            lng: lngSum / coords.length,
        };
    };
    // Calculate bounding box for polygon
    const calculateBoundingBox = (coords) => {
        const lats = coords.map((coord) => coord[0]);
        const lngs = coords.map((coord) => coord[1]);
        return {
            north: Math.max(...lats),
            south: Math.min(...lats),
            east: Math.max(...lngs),
            west: Math.min(...lngs),
        };
    };
    // Get current location
    const getCurrentLocation = useCallback(() => {
        setIsLoadingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const newPos = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                setCenterCoordinates(newPos);
                // Update map view
                if (leafletMapRef.current) {
                    leafletMapRef.current.setView([newPos.lat, newPos.lng], 14);
                }
                setIsLoadingLocation(false);
            }, (error) => {
                console.error("Error getting location:", error);
                setIsLoadingLocation(false);
                alert("Could not get your location. Please ensure location access is enabled.");
            }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 });
        }
        else {
            setIsLoadingLocation(false);
            alert("Geolocation is not supported by this browser.");
        }
    }, []);
    // Clear all boundaries
    const clearBoundaries = () => {
        if (drawingRef.current?.drawnItems) {
            drawingRef.current.drawnItems.clearLayers();
        }
        setWardBoundary([]);
        setSubZoneBoundaries({});
        setEditingMode(null);
        setSelectedSubZone(null);
    };
    // Save boundaries
    const toastHook = useToast();
    const handleSave = () => {
        // Validation: ensure at least one boundary exists
        const hasWard = wardBoundary && wardBoundary.length > 0;
        const hasSub = Object.keys(subZoneBoundaries).some((k) => subZoneBoundaries[k] && subZoneBoundaries[k].length > 0);
        if (!hasWard && !hasSub) {
            toastHook.toast({
                title: "No boundaries",
                description: "Draw a ward or sub-zone boundary before saving.",
            });
            return;
        }
        const updatedWard = {
            ...ward,
            boundaries: hasWard ? JSON.stringify(wardBoundary) : undefined,
            centerLat: centerCoordinates.lat,
            centerLng: centerCoordinates.lng,
            boundingBox: hasWard
                ? JSON.stringify(calculateBoundingBox(wardBoundary))
                : undefined,
        };
        const updatedSubZones = subZones.map((subZone) => {
            const boundaries = subZoneBoundaries[subZone.id];
            return {
                ...subZone,
                boundaries: boundaries && boundaries.length > 0
                    ? JSON.stringify(boundaries)
                    : undefined,
                centerLat: boundaries && boundaries.length > 0
                    ? calculatePolygonCenter(boundaries).lat
                    : undefined,
                centerLng: boundaries && boundaries.length > 0
                    ? calculatePolygonCenter(boundaries).lng
                    : undefined,
                boundingBox: boundaries && boundaries.length > 0
                    ? JSON.stringify(calculateBoundingBox(boundaries))
                    : undefined,
            };
        });
        onSave(updatedWard, updatedSubZones);
    };
    // Cleanup map when dialog closes
    useEffect(() => {
        if (!isOpen && leafletMapRef.current) {
            const container = leafletMapRef.current.getContainer?.();
            if (container) {
                const toolbar = container.querySelector(".custom-draw-toolbar");
                if (toolbar && toolbar.parentElement)
                    toolbar.parentElement.removeChild(toolbar);
            }
            leafletMapRef.current.remove();
            leafletMapRef.current = null;
            drawingRef.current = null;
        }
    }, [isOpen]);
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-6xl w-[95vw] max-h-[95vh] flex flex-col p-0", children: [_jsx(DialogHeader, { className: "px-6 py-4 border-b shrink-0", children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(MapPin, { className: "h-5 w-5" }), "Set Geographic Boundaries - ", ward.name] }) }), _jsxs("div", { className: "flex-1 overflow-hidden flex", children: [_jsx("div", { className: "w-80 p-4 border-r bg-gray-50 overflow-y-auto", children: _jsxs("div", { className: "space-y-4", children: [_jsxs(Alert, { children: [_jsx(Info, { className: "h-4 w-4" }), _jsx(AlertDescription, { className: "text-sm", children: "Use the drawing tools on the map to define geographic boundaries for wards and sub-zones." })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { className: "font-medium", children: "Ward Boundary" }), _jsx(Badge, { variant: wardBoundary.length > 0 ? "default" : "secondary", children: wardBoundary.length > 0 ? "Set" : "Not Set" })] }), _jsxs(Button, { onClick: () => {
                                                    setEditingMode("ward");
                                                    setSelectedSubZone(null);
                                                }, variant: editingMode === "ward" ? "default" : "outline", className: "w-full", children: [_jsx(Square, { className: "h-4 w-4 mr-2" }), editingMode === "ward"
                                                        ? "Drawing Ward..."
                                                        : "Set Ward Boundary"] }), wardBoundary.length > 0 && (_jsxs("div", { className: "text-xs text-gray-600 bg-white p-2 rounded", children: [_jsxs("div", { children: ["Points: ", wardBoundary.length] }), _jsxs("div", { children: ["Center: ", centerCoordinates.lat.toFixed(4), ",", " ", centerCoordinates.lng.toFixed(4)] })] })), editingMode === "ward" &&
                                                livePreview &&
                                                livePreview.length > 0 && (_jsxs("div", { className: "text-xs text-gray-600 bg-white p-2 rounded", children: [_jsxs("div", { children: ["Preview Points: ", livePreview.length] }), _jsxs("div", { className: "truncate", children: [livePreview
                                                                .slice(0, 3)
                                                                .map((c) => `${c[0].toFixed(4)}, ${c[1].toFixed(4)}`)
                                                                .join("; "), livePreview.length > 3 ? " ..." : ""] })] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsx(Label, { className: "font-medium", children: "Sub-Zone Boundaries" }), subZones.map((subZone) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm font-medium", children: subZone.name }), _jsx(Badge, { variant: subZoneBoundaries[subZone.id]
                                                                    ? "default"
                                                                    : "secondary", className: "text-xs", children: subZoneBoundaries[subZone.id] ? "Set" : "Not Set" })] }), _jsxs(Button, { onClick: () => {
                                                            setEditingMode("subzone");
                                                            setSelectedSubZone(subZone.id);
                                                        }, variant: editingMode === "subzone" &&
                                                            selectedSubZone === subZone.id
                                                            ? "default"
                                                            : "outline", size: "sm", className: "w-full", children: [_jsx(Square, { className: "h-3 w-3 mr-2" }), editingMode === "subzone" &&
                                                                selectedSubZone === subZone.id
                                                                ? "Drawing..."
                                                                : "Set Boundary"] }), subZoneBoundaries[subZone.id] && (_jsxs("div", { className: "text-xs text-gray-600 bg-white p-2 rounded", children: ["Points: ", subZoneBoundaries[subZone.id].length] })), editingMode === "subzone" &&
                                                        selectedSubZone === subZone.id &&
                                                        livePreviewSub &&
                                                        livePreviewSub.length > 0 && (_jsxs("div", { className: "text-xs text-gray-600 bg-white p-2 rounded", children: [_jsxs("div", { children: ["Preview Points: ", livePreviewSub.length] }), _jsxs("div", { className: "truncate", children: [livePreviewSub
                                                                        .slice(0, 3)
                                                                        .map((c) => `${c[0].toFixed(4)}, ${c[1].toFixed(4)}`)
                                                                        .join("; "), livePreviewSub.length > 3 ? " ..." : ""] })] }))] }, subZone.id)))] }), _jsxs("div", { className: "space-y-2 pt-4 border-t", children: [_jsxs(Button, { onClick: getCurrentLocation, variant: "outline", disabled: isLoadingLocation, className: "w-full", children: [_jsx(Navigation, { className: "h-4 w-4 mr-2" }), isLoadingLocation ? "Getting..." : "Center on Location"] }), _jsxs(Button, { onClick: clearBoundaries, variant: "outline", className: "w-full", children: [_jsx(RotateCcw, { className: "h-4 w-4 mr-2" }), "Clear All"] })] }), editingMode && (_jsxs(Alert, { children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsxs(AlertDescription, { className: "text-sm", children: [_jsx("strong", { children: "Drawing Mode:" }), " ", editingMode === "ward"
                                                        ? "Ward Boundary"
                                                        : `Sub-Zone: ${subZones.find((z) => z.id === selectedSubZone)?.name}`, _jsx("br", {}), "Click on the map to start drawing a polygon."] })] }))] }) }), _jsx("div", { className: "flex-1 relative", children: mapError ? (_jsx("div", { className: "h-full flex items-center justify-center bg-gray-100", children: _jsxs("div", { className: "text-center p-4", children: [_jsx(AlertCircle, { className: "h-8 w-8 text-red-500 mx-auto mb-2" }), _jsx("p", { className: "text-red-600 text-sm", children: mapError }), _jsx(Button, { onClick: () => window.location.reload(), variant: "outline", size: "sm", className: "mt-2", children: "Refresh Page" })] }) })) : (_jsx("div", { ref: mapRef, className: "h-full w-full", style: { minHeight: "500px" } })) })] }), _jsx(DialogFooter, { className: "px-6 py-4 border-t shrink-0 bg-background", children: _jsxs("div", { className: "flex gap-2 w-full sm:w-auto sm:ml-auto", children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancel" }), _jsxs(Button, { onClick: handleSave, children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Save Boundaries"] })] }) })] }) }));
};
export default WardBoundaryManager;
