import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Search, ExternalLink } from "lucide-react";

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
}

export default function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [coordinates, setCoordinates] = useState({
    latitude: initialLocation?.latitude || 28.6139, // Default to Delhi
    longitude: initialLocation?.longitude || 77.2090
  });
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Reverse geocoding using free Nominatim API
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
        return data.display_name;
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
    return "";
  };

  // Forward geocoding using free Nominatim API
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const newCoords = { latitude: lat, longitude: lng };
        setCoordinates(newCoords);
        setAddress(result.display_name);
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: result.display_name
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newCoords = { latitude: lat, longitude: lng };
        setCoordinates(newCoords);
        const addr = await reverseGeocode(lat, lng);
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: addr || `Current Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`
        });
        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation failed:", error);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Open in Google Maps for verification
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-sm h-9">
            <MapPin className="h-4 w-4 mr-2" />
            {address ? "Change Location" : "Select Salon Location"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Select Location
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search and Current Location */}
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                />
                <Button 
                  onClick={searchLocation} 
                  disabled={isLoading}
                  size="sm"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button 
              onClick={getCurrentLocation} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Use Current Location
            </Button>

            {/* Selected Location Display */}
            {address && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Selected:</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openInGoogleMaps}
                    className="h-8 px-2"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
                <p className="text-sm font-medium">{address}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                </p>
              </div>
            )}

            <Button 
              onClick={() => setIsOpen(false)} 
              className="w-full"
              disabled={!address}
            >
              Confirm Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compact Selected Location Display */}
      {address && (
        <div className="p-2 bg-gray-50 rounded border">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                📍 {address.split(',')[0]}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {address.split(',').slice(1, 3).join(',').trim()}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={openInGoogleMaps}
              className="h-6 w-6 p-0 ml-1 flex-shrink-0"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
