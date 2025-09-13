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
  const [selectedSalonType, setSelectedSalonType] = useState<'men' | 'women' | 'unisex'>('unisex');

  const { data: salons = [], isLoading, error } = useQuery({
    queryKey: ['/api/salons'],
  });

  if (error) {
    console.error('Error loading salons:', error);
  }


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
    
    
    // Filter by salon type first
    const matchesType = salon.type === selectedSalonType;
    
    // Search in salon name OR services
    const matchesSearch = !searchQuery || 
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.services?.some(service => 
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesLocation = !location || salon.location.toLowerCase().includes(location.toLowerCase());
    return matchesType && matchesSearch && matchesLocation;
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

  // Get explore salons based on filter and salon type
  const exploreSalons = useMemo(() => {
    const typedSalons = salons.filter(salon => salon.type === selectedSalonType);
    
    if (exploreFilter === 'highly-rated') {
      return [...typedSalons]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);
    } else if (exploreFilter === 'nearest' && userLocation) {
      return [...typedSalons]
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
  }, [salons, exploreFilter, userLocation, selectedSalonType]);

  // Sort salons by offers for top section (filtered by type)
  const topSalonsWithOffers = [...salons]
    .filter(salon => salon.type === selectedSalonType && salon.offers && salon.offers.length > 0)
    .sort((a, b) => {
      const maxOfferA = Math.max(...(a.offers?.map(offer => offer.discount) || [0]));
      const maxOfferB = Math.max(...(b.offers?.map(offer => offer.discount) || [0]));
      return maxOfferB - maxOfferA;
    });

  const favoriteSalons = useMemo(() => {
    if (!user || !user.favoriteSalons) return [];
    return salons.filter(salon => salon.type === selectedSalonType && user.favoriteSalons.includes(salon.id));
  }, [salons, user, selectedSalonType]);

  // Type-specific service categories
  const getServiceCategories = (type: 'men' | 'women' | 'unisex') => {
    const categories = {
      men: [
        {
          id: 1,
          name: "Haircut",
          image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "haircut"
        },
        {
          id: 2,
          name: "Beard Trim",
          image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "beard"
        },
        {
          id: 3,
          name: "Shave",
          image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "shave"
        },
        {
          id: 4,
          name: "Hair Styling",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "styling"
        },
        {
          id: 5,
          name: "Head Massage",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "massage"
        },
        {
          id: 6,
          name: "Men's Facial",
          image: "https://images.unsplash.com/photo-1559599101-f09722fb4948?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "facial"
        }
      ],
      women: [
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
          name: "Pedicure",
          image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "pedicure"
        },
        {
          id: 6,
          name: "Makeup",
          image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "makeup"
        },
        {
          id: 7,
          name: "Eyebrow",
          image: "https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "eyebrow"
        },
        {
          id: 8,
          name: "Massage",
          image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "massage"
        }
      ],
      unisex: [
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
          name: "Massage",
          image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "massage"
        },
        {
          id: 5,
          name: "Hair Styling",
          image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "styling"
        },
        {
          id: 6,
          name: "Manicure",
          image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
          searchQuery: "manicure"
        }
      ]
    };
    return categories[type];
  };

  const salonServiceCategories = getServiceCategories(selectedSalonType);

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

  // Get theme colors and background based on salon type
  const getThemeConfig = (type: 'men' | 'women' | 'unisex') => {
    const themes = {
      men: {
        background: "bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50",
        heroImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        primaryColor: "blue",
        accentColor: "slate",
        cardBg: "bg-white/90 border-blue-100"
      },
      women: {
        background: "bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50",
        heroImage: "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        primaryColor: "pink",
        accentColor: "rose",
        cardBg: "bg-white/90 border-pink-100"
      },
      unisex: {
        background: "bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50",
        heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        primaryColor: "purple",
        accentColor: "indigo",
        cardBg: "bg-white/90 border-purple-100"
      }
    };
    return themes[type];
  };

  const currentTheme = getThemeConfig(selectedSalonType);

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>

      {/* Hero Section - Different for logged in/out users */}
      {user ? (
        /* Logged In User - Personalized Welcome */
        <section className="relative overflow-hidden min-h-[60vh] flex items-center">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={currentTheme.heroImage} 
              alt={`${selectedSalonType.charAt(0).toUpperCase() + selectedSalonType.slice(1)} Salon Interior`}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 ${
              selectedSalonType === 'men' 
                ? 'bg-gradient-to-r from-blue-900/80 via-slate-900/70 to-gray-900/80'
                : selectedSalonType === 'women'
                ? 'bg-gradient-to-r from-pink-900/80 via-rose-900/70 to-purple-900/80'
                : 'bg-gradient-to-r from-purple-900/80 via-indigo-900/70 to-blue-900/80'
            }`}></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-xl font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                  Welcome back, {user.name?.split(' ')[0] || 'User'}! 👋
                </h1>
                <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
                  Ready to skip the wait? Find your perfect salon below.
                </p>
              </div>
              
              {/* Search Bar for logged in users */}
              <div className="max-w-lg mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input 
                    type="text" 
                    placeholder="Search salons or services..." 
                    className="pl-12 pr-4 py-4 text-lg border-0 focus-visible:ring-2 focus-visible:ring-white/50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Not Logged In - Marketing Hero */
        <section className="relative overflow-hidden min-h-[70vh] flex items-center">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={currentTheme.heroImage} 
              alt={`${selectedSalonType.charAt(0).toUpperCase() + selectedSalonType.slice(1)} Salon Interior`}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 ${
              selectedSalonType === 'men' 
                ? 'bg-gradient-to-r from-blue-900/85 via-slate-900/75 to-gray-900/85'
                : selectedSalonType === 'women'
                ? 'bg-gradient-to-r from-pink-900/85 via-rose-900/75 to-purple-900/85'
                : 'bg-gradient-to-r from-purple-900/85 via-indigo-900/75 to-blue-900/85'
            }`}></div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className={`absolute top-20 right-10 w-32 h-32 rounded-full blur-xl ${
              selectedSalonType === 'men' ? 'bg-blue-300/10' : selectedSalonType === 'women' ? 'bg-pink-300/10' : 'bg-purple-300/10'
            }`}></div>
            <div className={`absolute bottom-20 left-10 w-24 h-24 rounded-full blur-lg ${
              selectedSalonType === 'men' ? 'bg-slate-300/10' : selectedSalonType === 'women' ? 'bg-rose-300/10' : 'bg-indigo-300/10'
            }`}></div>
            <div className={`absolute top-1/2 left-1/3 w-16 h-16 rounded-full blur-md ${
              selectedSalonType === 'men' ? 'bg-gray-300/10' : selectedSalonType === 'women' ? 'bg-purple-300/10' : 'bg-blue-300/10'
            }`}></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
            <div className="mb-8">
              <div className="inline-flex items-center bg-white/15 backdrop-blur-md rounded-full px-6 py-3 mb-8 border border-white/20">
                <Sparkles className="w-5 h-5 text-yellow-300 mr-2" />
                <span className="text-white font-medium text-sm">Skip the Wait, Join the Queue</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-4 tracking-tight">
                Smart<span className={`${
                  selectedSalonType === 'men' ? 'text-blue-300' : selectedSalonType === 'women' ? 'text-pink-300' : 'text-purple-300'
                }`}>Q</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto font-light">
                {selectedSalonType === 'men' ? 'Men\'s Salon Queue System' : 
                 selectedSalonType === 'women' ? 'Women\'s Salon Queue System' : 
                 'Unisex Salon Queue System'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
                <Link href="/auth">
                  <Button className={`bg-white hover:bg-gray-100 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 ${
                    selectedSalonType === 'men' ? 'text-blue-600' : selectedSalonType === 'women' ? 'text-pink-600' : 'text-purple-600'
                  }`}>
                    Get Started Free
                    <Zap className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <div className="flex items-center text-white/80 text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Join 10,000+ happy customers</span>
                </div>
              </div>
              
              {/* Search Bar for guests */}
              <div className="max-w-lg mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input 
                    type="text" 
                    placeholder="Search salons to get started..." 
                    className="pl-12 pr-4 py-4 text-lg border-0 focus-visible:ring-2 focus-visible:ring-white/50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

{/* Salon Type Selector */}
<section className="py-4 px-4 bg-white border-b border-gray-200">
  <div className="max-w-md mx-auto">
    <div className="flex gap-2">
      <button
        onClick={() => setSelectedSalonType('men')}
        className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg border shadow-sm transition-colors ${
          selectedSalonType === 'men'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
        }`}
      >
        Men
      </button>
      <button
        onClick={() => setSelectedSalonType('women')}
        className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg border shadow-sm transition-colors ${
          selectedSalonType === 'women'
            ? 'bg-pink-600 text-white border-pink-600'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
        }`}
      >
        Women
      </button>
      <button
        onClick={() => setSelectedSalonType('unisex')}
        className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg border shadow-sm transition-colors ${
          selectedSalonType === 'unisex'
            ? 'bg-purple-600 text-white border-purple-600'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
        }`}
      >
        Unisex
      </button>
    </div>
  </div>
</section>

      {/* Quick Stats & Action Buttons */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={`${currentTheme.cardBg} backdrop-blur rounded-2xl p-4 text-center shadow-lg border`}>
              <div className={`text-2xl font-bold ${
                selectedSalonType === 'men' ? 'text-blue-600' : selectedSalonType === 'women' ? 'text-pink-600' : 'text-purple-600'
              }`}>{filteredSalons.length}</div>
              <div className="text-sm text-gray-600">{selectedSalonType.charAt(0).toUpperCase() + selectedSalonType.slice(1)} Salons</div>
            </div>
            <div className={`${currentTheme.cardBg} backdrop-blur rounded-2xl p-4 text-center shadow-lg border`}>
              <div className={`text-2xl font-bold ${
                selectedSalonType === 'men' ? 'text-slate-600' : selectedSalonType === 'women' ? 'text-rose-600' : 'text-indigo-600'
              }`}>15min</div>
              <div className="text-sm text-gray-600">Avg Wait Time</div>
            </div>
            <div className={`${currentTheme.cardBg} backdrop-blur rounded-2xl p-4 text-center shadow-lg border`}>
              <div className={`text-2xl font-bold ${
                selectedSalonType === 'men' ? 'text-blue-600' : selectedSalonType === 'women' ? 'text-pink-600' : 'text-purple-600'
              }`}>4.8★</div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
            <div className={`${currentTheme.cardBg} backdrop-blur rounded-2xl p-4 text-center shadow-lg border`}>
              <div className={`text-2xl font-bold ${
                selectedSalonType === 'men' ? 'text-gray-600' : selectedSalonType === 'women' ? 'text-purple-600' : 'text-blue-600'
              }`}>24/7</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button
              className={`flex-1 h-14 font-semibold rounded-2xl shadow-lg transition-all duration-300 ${
                !showFavoritesSection 
                  ? `${selectedSalonType === 'men' 
                      ? 'bg-gradient-to-r from-blue-600 to-slate-600' 
                      : selectedSalonType === 'women' 
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600' 
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600'} text-white shadow-lg` 
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setShowFavoritesSection(false)}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Recommended
            </Button>
            <Button
              className={`flex-1 h-14 font-semibold rounded-2xl shadow-lg transition-all duration-300 ${
                showFavoritesSection 
                  ? `${selectedSalonType === 'men' 
                      ? 'bg-gradient-to-r from-blue-600 to-slate-600' 
                      : selectedSalonType === 'women' 
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600' 
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600'} text-white shadow-lg` 
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                if (!user) {
                  // Redirect to login if not authenticated
                  window.location.href = '/auth';
                  return;
                }
                setShowFavoritesSection(true);
              }}
              disabled={user && favoriteSalons.length === 0}
            >
              <Heart className="w-5 h-5 mr-2" />
              {user ? 'Favorites' : 'Sign in for Favorites'}
            </Button>
          </div>
        </div>
      </section>

      {/* Top Salons / Favorites Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {showFavoritesSection ? "💖 Your Favorites" : "🔥 Trending Salons"}
            </h2>
            <div className="text-sm text-gray-500">
              {showFavoritesSection ? `${favoriteSalons.length} saved` : `${topSalonsWithOffers.length} available`}
            </div>
          </div>
          
          {/* Container for horizontal scrolling */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex flex-col gap-4 min-w-max">
              {/* Display either Top Salons or Favorites */}
              {showFavoritesSection ? (
                favoriteSalons.length > 0 ? (
                  <div className="flex gap-4">
                    {favoriteSalons.map((salon) => (
                      <Link key={salon.id} href={`/salon/${salon.id}`}>
                        <Card className="min-w-[320px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 bg-white/90 backdrop-blur border-0">
                          <div className="relative">
                            <img 
                              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                              alt={salon.name}
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            {salon.offers && salon.offers.length > 0 && (
                              <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                🎉 {Math.max(...salon.offers.map(offer => offer.discount))}% OFF
                              </div>
                            )}
                            <div className="absolute bottom-3 left-3 right-3">
                              <h3 className="font-bold text-white text-lg mb-1">{salon.name}</h3>
                              <p className="text-white/90 text-sm flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {salon.location}
                              </p>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                                  <span className="text-sm font-semibold text-yellow-700">{salon.rating}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span className="text-sm">{salon.estimatedWaitTime || 15}min</span>
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                salon.queueCount > 5 
                                  ? 'bg-orange-100 text-orange-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {salon.queueCount} in queue
                              </div>
                            </div>
                            <Button 
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 rounded-xl transition-all duration-300"
                              onClick={(e) => {
                                if (!user) {
                                  e.preventDefault();
                                  window.location.href = '/auth';
                                  return;
                                }
                              }}
                            >
                              {user ? 'Join Queue' : 'Sign in to Join'}
                            </Button>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full py-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                      <Heart className="w-12 h-12 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No favorites yet</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      Start exploring salons and add your favorites by clicking the heart icon!
                    </p>
                    <Button 
                      className={`mt-4 text-white px-6 py-2 rounded-full ${
                        selectedSalonType === 'men' 
                          ? 'bg-gradient-to-r from-blue-600 to-slate-600' 
                          : selectedSalonType === 'women' 
                          ? 'bg-gradient-to-r from-pink-600 to-rose-600' 
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                      }`}
                      onClick={() => setShowFavoritesSection(false)}
                    >
                      Explore Salons
                    </Button>
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
                  <div className="flex flex-col items-center justify-center w-full py-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-4">
                      <Gift className="w-12 h-12 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No offers right now</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      Check back soon for amazing deals and offers from our partner salons!
                    </p>
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
