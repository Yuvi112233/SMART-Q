import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Users, Clock, Smartphone, Gift, Bell, BarChart3, Handshake, Award, Heart, Scissors, Palette, Sparkles, Zap, Crown, Flame } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { SalonWithDetails } from "../types";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const { user } = useAuth();
  const allSalonsRef = useRef<HTMLElement>(null);
  const favoritesRef = useRef<HTMLElement>(null);
  const [showFavoritesSection, setShowFavoritesSection] = useState(false);
  const [exploreFilter, setExploreFilter] = useState<'highly-rated' | 'nearest'>('highly-rated');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const { data: salons = [], isLoading, error } = useQuery<SalonWithDetails[]>({
    queryKey: ['/api/salons'],
  });

  useEffect(() => {
    if ((searchQuery || location) && allSalonsRef.current) {
      allSalonsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchQuery, location]);

  // Handle loading and error states
  if (error) {
    console.error('Error loading salons:', error);
  }

  const filteredSalons = salons.filter(salon => {
    // Ensure salon has required properties
    if (!salon.name || !salon.location) {
      console.warn('Salon missing required properties:', salon);
      return false;
    }
    
    // Search in salon name OR services
    const matchesSearch = !searchQuery || 
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.services?.some(service => 
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesLocation = !location || salon.location.toLowerCase().includes(location.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get user's geolocation
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to manual location input or default location
          setUserLocation({ lat: 30.7333, lng: 76.7794 }); // Default to Chandigarh
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setUserLocation({ lat: 30.7333, lng: 76.7794 }); // Default to Chandigarh
    }
  };

  // Get explore salons based on filter
  const exploreSalons = useMemo(() => {
    if (exploreFilter === 'highly-rated') {
      return [...salons]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);
    } else if (exploreFilter === 'nearest' && userLocation) {
      return [...salons]
        .map(salon => ({
          ...salon,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            // Assuming salon has lat/lng or we parse from location string
            parseFloat(salon.lat || '30.7333'),
            parseFloat(salon.lng || '76.7794')
          )
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 5);
    }
    return [];
  }, [salons, exploreFilter, userLocation]);

  // Sort salons by offers for top section
  const topSalonsWithOffers = [...salons]
    .filter(salon => salon.offers && salon.offers.length > 0)
    .sort((a, b) => {
      const maxOfferA = Math.max(...(a.offers?.map(offer => offer.discount) || [0]));
      const maxOfferB = Math.max(...(b.offers?.map(offer => offer.discount) || [0]));
      return maxOfferB - maxOfferA;
    });

  const favoriteSalons = useMemo(() => {
    if (!user || !user.favoriteSalons) return [];
    return salons.filter(salon => user.favoriteSalons.includes(salon.id));
  }, [salons, user]);

  // Salon service categories data - inspired by food delivery apps
  const salonServiceCategories = [
    {
      id: 1,
      name: "Haircut",
      image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      searchQuery: "haircut"
    },
    {
      id: 2,
      name: "Hair Color",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      searchQuery: "hair color"
    },
    {
      id: 3,
      name: "Facial",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      searchQuery: "facial"
    },
    {
      id: 4,
      name: "Manicure",
      image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      searchQuery: "manicure"
    },
    {
      id: 5,
      name: "Massage",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      searchQuery: "massage"
    },
    {
      id: 6,
      name: "Eyebrow",
      image: "https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      searchQuery: "eyebrow"
    },
    {
      id: 7,
      name: "Pedicure",
      image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      searchQuery: "pedicure"
    },
    {
      id: 8,
      name: "Makeup",
      image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      searchQuery: "makeup"
    }
  ];

  // Service inspiration cards
  const serviceInspirations = [
    {
      id: 1,
      title: "Fresh Haircut",
      description: "Transform your look with a trendy new style",
      icon: Scissors,
      gradient: "from-blue-500 to-purple-600",
    },
    {
      id: 2,
      title: "Hair Coloring",
      description: "Express yourself with vibrant colors",
      icon: Palette,
      gradient: "from-pink-500 to-rose-600",
    },
    {
      id: 3,
      title: "Styling & Blowout",
      description: "Perfect finish for any occasion",
      icon: Sparkles,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      id: 4,
      title: "Hair Treatment",
      description: "Nourish and repair your hair",
      icon: Crown,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      id: 5,
      title: "Beard Grooming",
      description: "Sharp and well-maintained look",
      icon: Zap,
      gradient: "from-slate-500 to-gray-600",
    },
    {
      id: 6,
      title: "Special Occasion",
      description: "Wedding, party, or event styling",
      icon: Flame,
      gradient: "from-violet-500 to-purple-600",
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar at Top */}
      <section className="bg-white shadow-sm py-4 px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-100 rounded-2xl p-2">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input 
                  type="text" 
                  placeholder="Search salons or services..." 
                  className="pl-12 border-0 focus-visible:ring-0 bg-white rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input 
                  type="text" 
                  placeholder="Location" 
                  className="pl-12 border-0 focus-visible:ring-0 bg-white rounded-xl"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  data-testid="input-location"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 py-16">
        {/* Background Text */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <h1 className="text-[20rem] font-black text-white select-none">SMARTQ</h1>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
              Smart<span className="text-yellow-300">Q</span>
              <br />
              <span className="text-3xl md:text-4xl font-light">for Salons</span>
            </h1>
            <p className="text-xl text-white/90 mb-12 leading-relaxed max-w-2xl mx-auto">
              Skip the wait, book your spot. Experience the future of salon visits with virtual queues.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Action Buttons */}
      <section className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-4 justify-center">
            <Button
              className="flex-1 max-w-40 h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg"
              onClick={() => setShowFavoritesSection(false)}
            >
              <Heart className="w-5 h-5 mr-2" />
              Recommended
            </Button>
            <Button
              variant="outline"
              className="flex-1 max-w-40 h-12 border-2 border-pink-200 text-pink-600 font-semibold rounded-xl hover:bg-pink-50"
              onClick={() => setShowFavoritesSection(true)}
              disabled={!user || favoriteSalons.length === 0}
            >
              <Star className="w-5 h-5 mr-2" />
              Favorites
            </Button>
          </div>
        </div>
      </section>

      {/* Top Salons / Favorites Section */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 px-2">
            {showFavoritesSection ? "Your Favorites" : "Top Salons with Offers"}
          </h2>
          
          {/* Container for horizontal scrolling */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex flex-col gap-4 min-w-max">
              {/* Display either Top Salons or Favorites */}
              {showFavoritesSection ? (
                favoriteSalons.length > 0 ? (
                  <div className="flex gap-4">
                    {favoriteSalons.map((salon) => (
                      <Link key={salon.id} href={`/salon/${salon.id}`}>
                        <Card className="min-w-[280px] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="relative">
                            <img 
                              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                              alt={salon.name}
                              className="w-full h-32 object-cover"
                            />
                            {salon.offers && salon.offers.length > 0 && (
                              <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                                {Math.max(...salon.offers.map(offer => offer.discount))}% OFF
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1">{salon.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{salon.location}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                <span className="text-sm font-medium">{salon.rating}</span>
                              </div>
                              <span className="text-xs text-gray-500">{salon.queueCount} in queue</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full py-8">
                    <p className="text-gray-500">No favorite salons added yet.</p>
                  </div>
                )
              ) : (
                topSalonsWithOffers.length > 0 ? (
                  <>
                    {/* First Row */}
                    <div className="flex gap-4">
                      {topSalonsWithOffers.slice(0, 4).map((salon) => (
                        <Link key={salon.id} href={`/salon/${salon.id}`}>
                          <Card className="min-w-[280px] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="relative">
                              <img 
                                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                                alt={salon.name}
                                className="w-full h-32 object-cover"
                              />
                              {salon.offers && salon.offers.length > 0 && (
                                <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                                  {Math.max(...salon.offers.map(offer => offer.discount))}% OFF
                                </Badge>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-1">{salon.name}</h3>
                              <p className="text-sm text-gray-600 mb-2">{salon.location}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                  <span className="text-sm font-medium">{salon.rating}</span>
                                </div>
                                <span className="text-xs text-gray-500">{salon.queueCount} in queue</span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>

                    {/* Second Row */}
                    {topSalonsWithOffers.length > 4 && (
                      <div className="flex gap-4">
                        {topSalonsWithOffers.slice(4, 8).map((salon) => (
                          <Link key={salon.id} href={`/salon/${salon.id}`}>
                            <Card className="min-w-[280px] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                              <div className="relative">
                                <img 
                                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                                  alt={salon.name}
                                  className="w-full h-32 object-cover"
                                />
                                {salon.offers && salon.offers.length > 0 && (
                                  <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                                    {Math.max(...salon.offers.map(offer => offer.discount))}% OFF
                                  </Badge>
                                )}
                              </div>
                              <CardContent className="p-4">
                                <h3 className="font-semibold text-gray-900 mb-1">{salon.name}</h3>
                                <p className="text-sm text-gray-600 mb-2">{salon.location}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                    <span className="text-sm font-medium">{salon.rating}</span>
                                  </div>
                                  <span className="text-xs text-gray-500">{salon.queueCount} in queue</span>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full py-8">
                    <p className="text-gray-500">No salons with active offers available</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Explore</h2>
          <div className="flex gap-3 justify-center mb-6">
            <Button 
              onClick={() => setExploreFilter('highly-rated')}
              className={`px-6 h-10 font-medium rounded-full shadow-md ${
                exploreFilter === 'highly-rated' 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white' 
                  : 'bg-white border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50'
              }`}
            >
              <Star className="w-4 h-4 mr-2" />
              Highly Rated
            </Button>
            <Button 
              onClick={() => {
                setExploreFilter('nearest');
                if (!userLocation) {
                  getUserLocation();
                }
              }}
              className={`px-6 h-10 font-medium rounded-full shadow-md ${
                exploreFilter === 'nearest' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white' 
                  : 'bg-white border-2 border-blue-300 text-blue-700 hover:bg-blue-50'
              }`}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Nearest
            </Button>
          </div>

          {/* Explore Salons Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {exploreSalons.map((salon) => (
              <Link key={salon.id} href={`/salon/${salon.id}`}>
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="relative">
                    <img 
                      src="https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                      alt={salon.name}
                      className="w-full h-32 object-cover"
                    />
                    {salon.offers && salon.offers.length > 0 && (
                      <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                        {Math.max(...salon.offers.map(offer => offer.discount))}% OFF
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{salon.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{salon.location}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-medium">{salon.rating}</span>
                      </div>
                      <span className="text-xs text-gray-500">{salon.queueCount} in queue</span>
                    </div>
                    {exploreFilter === 'nearest' && (salon as any).distance && (
                      <p className="text-xs text-blue-600 mt-1">
                        {((salon as any).distance).toFixed(1)} km away
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What's on Your Mind Section - Circular Categories like Food Delivery */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">What's on your mind?</h2>
          
          {/* Circular Service Categories Grid */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-6 max-w-4xl mx-auto">
            {salonServiceCategories.map((category) => (
              <div 
                key={category.id} 
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => setSearchQuery(category.searchQuery)}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 mt-2 text-center group-hover:text-purple-600 transition-colors">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Salons Section */}
      <section id="all-salons" ref={allSalonsRef} className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Salons</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSalons.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <MapPin className="text-gray-400 h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {searchQuery || location ? 'No salons found' : 'No salons available yet'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchQuery || location 
                  ? 'Try adjusting your search criteria or check back later.' 
                  : 'New salons are joining SmartQ every day. Check back soon or sign up as a salon owner!'}
              </p>
              {!searchQuery && !location && (
                <Link href="/auth">
                  <Button size="lg" className="font-semibold">
                    Become a Salon Owner
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSalons.map((salon) => (
                <Link key={salon.id} href={`/salon/${salon.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-white">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img 
                          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
                          alt={salon.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{salon.name}</h3>
                              <p className="text-sm text-gray-600">{salon.location}</p>
                            </div>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium text-gray-900">{salon.rating}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${salon.queueCount > 5 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                              <span className="text-sm text-gray-600">{salon.queueCount} people in queue</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">~{salon.estimatedWaitTime || 15} min wait</span>
                          </div>
                          
                          {salon.offers && salon.offers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {salon.offers.slice(0, 2).map((offer) => (
                                <Badge key={offer.id} className="bg-red-100 text-red-800 text-xs">
                                  <Gift className="w-3 h-3 mr-1" />
                                  {offer.discount}% OFF - {offer.title}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-2">
                            {salon.services.slice(0, 3).map((service) => (
                              <Badge key={service.id} variant="secondary" className="text-xs">
                                {service.name}
                              </Badge>
                            ))}
                            {salon.services.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{salon.services.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      
    </div>
  );
}
