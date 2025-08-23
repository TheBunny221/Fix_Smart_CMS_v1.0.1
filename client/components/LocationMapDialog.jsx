import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
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

// Fix for default markers in react-leaflet
const DefaultIcon = L.icon({
  iconRetinaUrl,
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





// Component to handle map updates
function MapUpdater({ center }, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

// Custom component for map click events
function LocationMarker({
  position,
  onPositionChange,
}, number];
  onPositionChange: (position, number]) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPositionChange([lat, lng]);
    },
  });

  return ;
}

const LocationMapDialog: React.FC = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation,
}) => {
  // Default to Kochi, India coordinates
  const defaultPosition: [number, number] = [9.9312, 76.2673];
  const [position, setPosition] = useState(
    initialLocation
      ? [initialLocation.latitude, initialLocation.longitude]
      ,
  );
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [area, setArea] = useState(initialLocation?.area || "");
  const [landmark, setLandmark] = useState(initialLocation?.landmark || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef(null);

  // Get current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setPosition(newPos);
          reverseGeocode(newPos);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location, error);
          setIsLoadingLocation(false);
        },
        { enableHighAccuracy, timeout, maximumAge: 600000 },
      );
    } else {
      setIsLoadingLocation(false);
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (coords, number]) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(`https,
      );
      const data = await response.json();

      if (data && data.display_name) {
        setAddress(data.display_name);

        // Extract area information
        const addressComponents = data.address;
        if (addressComponents) {
          const detectedArea =
            addressComponents.neighbourhood ||
            addressComponents.suburb ||
            addressComponents.city_district ||
            addressComponents.state_district ||
            addressComponents.city ||
            "";
          setArea(detectedArea);
        }
      }
    } catch (error) {
      console.error("Error in reverse geocoding, error);
    }
  };

  // Search for a location
  const searchLocation = async () => {
    if (searchQuery.trim()) return;

    try {
      const response = await fetch(`https, Kochi, Kerala, India")}&format=json&limit=1&addressdetails=1`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newPos: [number, number] = [
          parseFloat(result.lat),
          parseFloat(result.lon),
        ];
        setPosition(newPos);
        setAddress(result.display_name);

        // Extract area information
        const addressComponents = result.address;
        if (addressComponents) {
          const detectedArea =
            addressComponents.neighbourhood ||
            addressComponents.suburb ||
            addressComponents.city_district ||
            addressComponents.state_district ||
            addressComponents.city ||
            "";
          setArea(detectedArea);
        }

        // Fly to the new position
        if (mapRef.current) {
          mapRef.current.flyTo(newPos, 16);
        }
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Error searching location, error);
      alert("Error searching for location. Please try again.");
    }
  };

  const handlePositionChange = (newPosition, number]) => {
    setPosition(newPosition);
    reverseGeocode(newPosition);
  };

  const handleConfirm = () => {
    onLocationSelect({
      latitude,
      longitude: position[1],
      address: address.trim(),
      area: area.trim(),
      landmark: landmark.trim(),
    });
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchLocation();
    }
  };

  return (
    
      
        
          
            
            Select Location on Map
          
        

        
          {/* Search and Current Location */}
          
            
               setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              
                
              
            
            
              
              {isLoadingLocation ? "Getting..." : "Current Location"}
            
          

          {/* Map */}
          
             {
                mapRef.current = mapInstance;
              }}
            >
              OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              
            
          

          {/* Location Details */}
          
            
              Detected Area
               setArea(e.target.value)}
                placeholder="Area/Locality"
              />
            
            
              Landmark (Optional)
               setLandmark(e.target.value)}
                placeholder="Nearby landmark"
              />
            
            
              Detected Address
               setAddress(e.target.value)}
                placeholder="Full address"
                className="w-full"
              />
            
          

          {/* Coordinates Display */}
          
            Selected coordinates: {position[0].toFixed(6)},{" "}
            {position[1].toFixed(6)}
          
        

        
          
            Cancel
          
          Confirm Location
        
      
    
  );
};

export default LocationMapDialog;
