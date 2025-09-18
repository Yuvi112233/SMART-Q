import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Search, ExternalLink } from "lucide-react";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

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
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [hasAutoLocated, setHasAutoLocated] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey,
    libraries,
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
    geocoderRef.current = null;
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!geocoderRef.current) return "";
    setIsLoading(true);
    try {
      const response = await geocoderRef.current.geocode({ location: { lat, lng } });
      if (response.results && response.results.length > 0) {
        const newAddress = response.results[0].formatted_address;
        setAddress(newAddress);
        onLocationSelect({ latitude: lat, longitude: lng, address: newAddress });
        return newAddress;
      }
    } catch (error) {
      console.error("Google Maps Reverse geocoding failed:", error);
    } finally {
      setIsLoading(false);
    }
    return "";
  };

  const searchLocation = async () => {
    if (!searchQuery.trim() || !geocoderRef.current) return;

    setIsLoading(true);
    try {
      const response = await geocoderRef.current.geocode({ address: searchQuery });
      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        const lat = result.geometry.location.lat();
        const lng = result.geometry.location.lng();
        const newCoords = { latitude: lat, longitude: lng };
        setCoordinates(newCoords);
        setAddress(result.formatted_address);
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: result.formatted_address
        });
        mapRef.current?.panTo({ lat, lng });
      }
    } catch (error) {
      console.error("Google Maps Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's current location with high accuracy
  const getCurrentLocation = useCallback((isAutomatic = false) => {
    setIsLoading(true);
    setAccuracy(null);

    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      setIsLoading(false);
      return;
    }

    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;
    let timeoutId: NodeJS.Timeout;

    const processPosition = async (position: GeolocationPosition) => {
      const { latitude: lat, longitude: lng, accuracy: acc } = position.coords;
      const roundedAcc = typeof acc === 'number' ? Math.round(acc) : null;

      // If this is the first position or it's more accurate than the previous one
      if (!bestPosition || (acc && bestPosition.coords.accuracy && acc < bestPosition.coords.accuracy)) {
        bestPosition = position;

        setCoordinates({ latitude: lat, longitude: lng });
        if (roundedAcc !== null) setAccuracy(roundedAcc);

        const addr = await reverseGeocode(lat, lng);
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          address: addr || `Current Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`
        });

        // Adjust zoom based on accuracy
        const zoom = acc ? Math.max(15, Math.min(20, 20 - Math.log10(acc))) : 15;
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(zoom);

        // If accuracy is good enough (less than 20m), stop watching
        if (acc && acc < 20) {
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
          }
          clearTimeout(timeoutId);

          if (isAutomatic) {
            setHasAutoLocated(true);
          }
          setIsLoading(false);
        }
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Geolocation failed:", error);
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearTimeout(timeoutId);
      setIsLoading(false);
    };

    // First, try to get a quick position
    navigator.geolocation.getCurrentPosition(
      processPosition,
      () => {
        // If quick position fails, start watching for high accuracy
        watchId = navigator.geolocation.watchPosition(
          processPosition,
          handleError,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: isAutomatic ? 300000 : 0, // Cache for auto requests, fresh for manual
          }
        );
      },
      {
        enableHighAccuracy: false, // Quick first attempt
        timeout: 5000,
        maximumAge: isAutomatic ? 300000 : 60000,
      }
    );

    // Start high-accuracy watching immediately for better results
    watchId = navigator.geolocation.watchPosition(
      processPosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: isAutomatic ? 300000 : 0,
      }
    );

    // Set a maximum time limit for location detection
    timeoutId = setTimeout(() => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      if (isAutomatic) {
        setHasAutoLocated(true);
      }
      setIsLoading(false);
    }, 20000); // 20 seconds max

  }, [onLocationSelect, reverseGeocode]);

  // Auto-detect location when component mounts or when no initial location is provided
  useEffect(() => {
    if (isLoaded && !initialLocation && !hasAutoLocated) {
      getCurrentLocation(true);
    }
  }, [isLoaded, initialLocation, hasAutoLocated, getCurrentLocation]);

  // Auto-detect location when dialog opens if no location is set
  useEffect(() => {
    if (isOpen && !address && !hasAutoLocated && isLoaded) {
      getCurrentLocation(true);
    }
  }, [isOpen, address, hasAutoLocated, isLoaded, getCurrentLocation]);

  // Open in Google Maps for verification
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
    window.open(url, '_blank');
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="space-y-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-sm h-9" disabled={isLoading}>
            <MapPin className="h-4 w-4 mr-2" />
            {isLoading ? "Detecting location..." : address ? "Change Location" : "Select Salon Location"}
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
                  onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
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

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => getCurrentLocation(false)}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {hasAutoLocated ? "Update Location" : "Get Location"}
              </Button>
              {accuracy && accuracy > 30 && (
                <Button
                  onClick={() => {
                    setHasAutoLocated(false);
                    getCurrentLocation(false);
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full text-xs"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Precise Location
                </Button>
              )}
            </div>

            {accuracy && accuracy > 50 && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                💡 For better accuracy: Move to an open area, enable location services, and ensure GPS is on.
              </div>
            )}

            <div className="h-64 w-full rounded-md overflow-hidden">
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={{ lat: coordinates.latitude, lng: coordinates.longitude }}
                zoom={15}
                onLoad={onMapLoad}
                onUnmount={onMapUnmount}
                onClick={(e) => {
                  if (e.latLng) {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    setCoordinates({ latitude: lat, longitude: lng });
                    reverseGeocode(lat, lng);

                  }
                }}
              >
                <MarkerF
                  position={{ lat: coordinates.latitude, lng: coordinates.longitude }}
                  draggable={true}
                  onDragEnd={(e) => {
                    if (e.latLng) {
                      const lat = e.latLng.lat();
                      const lng = e.latLng.lng();
                      setCoordinates({ latitude: lat, longitude: lng });
                      reverseGeocode(lat, lng);
                    }
                  }}
                />
              </GoogleMap>
            </div>

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
                {accuracy !== null && (
                  <div className="mt-1">
                    <p className="text-xs text-gray-500">
                      Accuracy: ±{accuracy} m
                      {accuracy > 50 && (
                        <span className="text-amber-600 ml-1">
                          (Move to open area for better accuracy)
                        </span>
                      )}
                      {accuracy <= 20 && (
                        <span className="text-green-600 ml-1">
                          (High accuracy)
                        </span>
                      )}
                    </p>
                  </div>
                )}
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