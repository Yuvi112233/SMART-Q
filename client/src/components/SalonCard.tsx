import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, ImageIcon, Navigation } from "lucide-react";
import type { SalonWithDetails } from "../types";

interface SalonCardProps {
  salon: SalonWithDetails;
  showWaitTime?: boolean;
  showDistance?: boolean;
  distance?: number;
}

export default function SalonCard({ salon, showWaitTime = true, showDistance = false, distance }: SalonCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate images every 5 seconds if salon has multiple photos
  useEffect(() => {
    if (!salon.photos || salon.photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % salon.photos!.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [salon.photos]);

  const getCurrentImageUrl = () => {
    if (salon.photos && salon.photos.length > 0) {
      return salon.photos[currentImageIndex].url;
    }
    return "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
  };

  const hasMultipleImages = salon.photos && salon.photos.length > 1;

  const openInGoogleMaps = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('SalonCard - Opening maps for salon:', {
      id: salon.id,
      name: salon.name,
      latitude: salon.latitude,
      longitude: salon.longitude,
      fullAddress: salon.fullAddress,
      location: salon.location
    });
    
    if (salon.latitude && salon.longitude) {
      // Use exact coordinates for precise location
      const url = `https://www.google.com/maps?q=${salon.latitude},${salon.longitude}`;
      console.log('SalonCard - Using coordinates URL:', url);
      window.open(url, '_blank');
    } else {
      // Fallback to address search
      const query = encodeURIComponent(salon.fullAddress || salon.location);
      const url = `https://www.google.com/maps/search/${query}`;
      console.log('SalonCard - Using address URL:', url);
      window.open(url, '_blank');
    }
  };

  return (
    <Link href={`/salon/${salon.id}`}>
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="relative">
          <img 
            src={getCurrentImageUrl()}
            alt={salon.name}
            className="w-full h-32 object-cover transition-opacity duration-500"
          />
          
          {/* Location icon for Google Maps */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-2 right-2 h-8 w-8 p-0 bg-white/90 hover:bg-white"
            onClick={openInGoogleMaps}
            title="Open in Google Maps"
          >
            <Navigation className="h-4 w-4" />
          </Button>

          {/* Offers badge */}
          {salon.offers && salon.offers.length > 0 && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white">
              {Math.max(...salon.offers.map(offer => offer.discount))}% OFF
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1">{salon.name}</h3>
          <p className="text-sm text-gray-600 mb-2 flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {salon.location}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm font-medium">{salon.rating}</span>
              <span className="ml-1 text-xs text-gray-500">({salon.reviewCount})</span>
            </div>
            
            {showDistance && distance !== undefined && (
              <span className="text-xs text-gray-500">{distance.toFixed(1)} km</span>
            )}
            
            {showWaitTime && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-3 h-3 mr-1" />
                {salon.waitTime} min
              </div>
            )}
          </div>

          {/* Special offers section */}
          {salon.offers && salon.offers.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center text-xs text-primary">
                <span className="font-medium">Special Offers:</span>
              </div>
              <div className="mt-1">
                {salon.offers.slice(0, 2).map((offer, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    • {offer.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
