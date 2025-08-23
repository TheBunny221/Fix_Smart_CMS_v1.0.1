import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { MapPin, Navigation, Search, AlertCircle } from "lucide-react";





const SimpleLocationMapDialog: React.FC = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation,
}) => {
  // Default to Kochi, India coordinates
  const defaultPosition = { lat: 9.9312, lng: 76.2673 };
  const [position, setPosition] = useState(initialLocation
      ? { lat, lng: initialLocation.longitude }
      ,
  );
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [area, setArea] = useState(initialLocation?.area || "");
  const [landmark, setLandmark] = useState(initialLocation?.landmark || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapError, setMapError] = useState(null);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);

  // Initialize map when dialog opens
  useEffect(() => {
    if (isOpen || mapRef.current) return;

    const initializeMap = async () => {
      try {
        // Dynamically import leaflet only when needed
        const L = await import("leaflet");

        // Set up the default icon
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

        // Create map if it doesn't exist
        if (leafletMapRef.current && mapRef.current) {
          leafletMapRef.current = L.map(mapRef.current, {
            center, position.lng],
            zoom,
            scrollWheelZoom,
          });

          // Add tile layer
          L.tileLayer("https, {
            attribution:
              '&copy; OpenStreetMap contributors',
          }).addTo(leafletMapRef.current);

          // Add marker
          const marker = L.marker([position.lat, position.lng], {
            icon,
          }).addTo(leafletMapRef.current);

          // Handle map clicks
          leafletMapRef.current.on("click", (e) => {
            const { lat, lng } = e.latlng;
            setPosition({ lat, lng });
            marker.setLatLng([lat, lng]);
            reverseGeocode({ lat, lng });
          });
        }

        setMapError(null);
      } catch (error) {
        console.error("Error initializing map, error);
        setMapError("Failed to load map. Please refresh and try again.");
      }
    };

    const timer = setTimeout(initializeMap, 100);
    return () => clearTimeout(timer);
  }, [isOpen, position.lat, position.lng]);

  // Cleanup map when dialog closes
  useEffect(() => {
    if (isOpen && leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }
  }, [isOpen]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition(newPos);
          reverseGeocode(newPos);

          // Update map view
          if (leafletMapRef.current) {
            leafletMapRef.current.setView([newPos.lat, newPos.lng], 16);
            // Update marker if it exists
            const markers = Object.values(leafletMapRef.current._layers).filter(
              (layer) => layer instanceof L.Marker,
            );
            if (markers.length > 0) {
              (markers[0]).setLatLng([newPos.lat, newPos.lng]);
            }
          }

          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location, error);
          setIsLoadingLocation(false);
          alert(
            "Could not get your location. Please ensure location access is enabled.",
          );
        },
        { enableHighAccuracy, timeout, maximumAge: 600000 },
      );
    } else {
      setIsLoadingLocation(false);
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (coords) => {
    try {
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
        const newPos = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
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

        // Update map view
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([newPos.lat, newPos.lng], 16);
          // Update marker if it exists
          const markers = Object.values(leafletMapRef.current._layers).filter(
            (layer) => layer instanceof L.Marker,
          );
          if (markers.length > 0) {
            (markers[0]).setLatLng([newPos.lat, newPos.lng]);
          }
        }
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Error searching location, error);
      alert("Error searching for location. Please try again.");
    }
  };

  const handleConfirm = () => {
    onLocationSelect({
      latitude,
      longitude: position.lng,
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
          
            {mapError ? (
              
                
                  
                  {mapError}
                   window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Refresh Page
                  
                
              
            ) : (
              
            )}
          

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
          
            Selected coordinates: {position.lat.toFixed(6)},{" "}
            {position.lng.toFixed(6)}
          
        

        
          
            Cancel
          
          Confirm Location
        
      
    
  );
};

export default SimpleLocationMapDialog;
