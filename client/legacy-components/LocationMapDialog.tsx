import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  CircleMarker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { MapPin, Navigation, Search } from "lucide-react";
import { useSystemConfig } from "../contexts/SystemConfigContext";

// Fix for default markers in react-leaflet
const DefaultIcon = L.icon({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  area?: string;
  landmark?: string;
}

interface LocationMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
}

// Component to handle map updates
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}// Custom
 component for map click events
function LocationMarker({
  position,
  onPositionChange,
}: {
  position: [number, number];
  onPositionChange: (position: [number, number]) => void;
}) {
  const map = useMap();
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPositionChange([lat, lng]);
    },
  });

  return (
    <Marker
      position={position}
      icon={DefaultIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const m = e.target as any;
          const { lat, lng } = m.getLatLng();
          onPositionChange([lat, lng]);
          map.setView([lat, lng], map.getZoom());
        },
      }}
    />
  );
}

const LocationMapDialog: React.FC<LocationMapDialogProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation,
}) => {
  const { getConfig } = useSystemConfig();
  const defaultLat = parseFloat(getConfig("MAP_DEFAULT_LAT", "9.9312")) || 9.9312;
  const defaultLng = parseFloat(getConfig("MAP_DEFAULT_LNG", "76.2673")) || 76.2673;
  const mapPlace = getConfig("MAP_SEARCH_PLACE", "Kochi, Kerala, India");
  const countryCodes = getConfig("MAP_COUNTRY_CODES", "in").trim();
  const bboxNorth = getConfig("MAP_BBOX_NORTH", "10.05");
  const bboxSouth = getConfig("MAP_BBOX_SOUTH", "9.85");
  const bboxEast = getConfig("MAP_BBOX_EAST", "76.39");
  const bboxWest = getConfig("MAP_BBOX_WEST", "76.20");
  const hasBbox = [bboxWest, bboxSouth, bboxEast, bboxNorth].every((v) => v && !Number.isNaN(parseFloat(v)));
  const defaultPosition: [number, number] = [defaultLat, defaultLng];
  const [position, setPosition] = useState<[number, number]>(
    initialLocation
      ? [initialLocation.latitude, initialLocation.longitude]
      : defaultPosition,
  );
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [area, setArea] = useState(initialLocation?.area || "");
  const [landmark, setLandmark] = useState(initialLocation?.landmark || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const mapRef = useRef<L.Map>(null);