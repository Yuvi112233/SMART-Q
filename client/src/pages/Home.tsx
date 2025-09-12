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
    
    const matchesSearch = !searchQuery || salon.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !location || salon.location.toLowerCase().includes(location.toLowerCase());
    return matchesSearch && matchesLocation;
  });

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
          <div className="flex gap-3 justify-center">
            <Button className="px-6 h-10 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-full shadow-md">
              <Gift className="w-4 h-4 mr-2" />
              Offers
            </Button>
            <Button variant="outline" className="px-6 h-10 border-2 border-yellow-300 text-yellow-700 font-medium rounded-full hover:bg-yellow-50">
              <Star className="w-4 h-4 mr-2" />
              Highly Rated
            </Button>
            <Button variant="outline" className="px-6 h-10 border-2 border-blue-300 text-blue-700 font-medium rounded-full hover:bg-blue-50">
              <MapPin className="w-4 h-4 mr-2" />
              Nearest
            </Button>
          </div>
        </div>
      </section>

      {/* What's on Your Mind Section - 2 Vertical Rows Scrollable Together */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What's on your mind?</h2>
          
          {/* Container for both rows - scrolls together */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex flex-col gap-4 min-w-max">
              {/* First Row */}
              <div className="flex gap-4">
                {serviceInspirations.slice(0, 3).map((service) => {
                  const IconComponent = service.icon;
                  return (
                    <Card key={service.id} className="min-w-[200px] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                      <div className={`relative h-24 bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Second Row */}
              <div className="flex gap-4">
                {serviceInspirations.slice(3, 6).map((service) => {
                  const IconComponent = service.icon;
                  return (
                    <Card key={service.id} className="min-w-[200px] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                      <div className={`relative h-24 bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
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
