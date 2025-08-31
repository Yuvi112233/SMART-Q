import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Users, Clock, Smartphone, Gift, Bell, BarChart3, Handshake, Award } from "lucide-react";
import { api } from "../lib/api";
import type { SalonWithDetails } from "../types";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  const { data: salons = [], isLoading, error } = useQuery<SalonWithDetails[]>({
    queryKey: ['/api/salons'],
  });

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

  // Debug search functionality
  console.log('Search state:', { searchQuery, location });
  console.log('All salons:', salons);
  console.log('Filtered salons:', filteredSalons);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-pink py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Skip the wait,<br />
                <span className="text-primary">book your spot</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Join virtual queues at your favorite salons. Get real-time updates, earn loyalty points, and never wait in line again.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="px-8 py-4 font-semibold shadow-lg hover:shadow-xl"
                  onClick={() => {
                    document.getElementById('featured-salons')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  data-testid="button-find-salons"
                >
                  Find Salons Near You
                </Button>
                <Link href="/auth">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="px-8 py-4 font-semibold w-full"
                    data-testid="button-salon-owners"
                  >
                    For Salon Owners
                  </Button>
                </Link>
              </div>
              
              {/* Search Bar */}
              <div className="mt-12 bg-white rounded-2xl shadow-xl p-2">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      type="text" 
                      placeholder="Search salons or services..." 
                      className="pl-12 border-0 focus-visible:ring-0 bg-transparent"
                      value={searchQuery}
                      onChange={(e) => {
                        console.log('Search input changed:', e.target.value);
                        setSearchQuery(e.target.value);
                      }}
                      data-testid="input-search"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      type="text" 
                      placeholder="Location" 
                      className="pl-12 border-0 focus-visible:ring-0 bg-transparent"
                      value={location}
                      onChange={(e) => {
                        console.log('Location input changed:', e.target.value);
                        setLocation(e.target.value);
                      }}
                      data-testid="input-location"
                    />
                  </div>
                  <Button 
                    className="px-8 py-3 font-semibold"
                    onClick={() => {
                      console.log('Search button clicked:', { searchQuery, location });
                      // Search functionality is already handled by state updates
                      // This button can scroll to results or show a toast
                      if (searchQuery || location) {
                        document.getElementById('featured-salons')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    data-testid="button-search"
                  >
                    Search
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Modern salon interior" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 animate-fade-in">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground" data-testid="text-active-queues">
                      {salons.reduce((total, salon) => total + salon.queueCount, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Active queues</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Salons Section */}
      <section id="featured-salons" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {searchQuery || location ? 'Search Results' : 'Popular Salons Near You'}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover top-rated salons with the shortest wait times and best reviews
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="w-full h-48 bg-muted rounded-lg mb-4"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredSalons.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                <MapPin className="text-primary h-12 w-12" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                {searchQuery || location ? 'No salons found' : 'No salons available yet'}
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSalons.slice(0, 6).map((salon) => (
                <Card key={salon.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300" data-testid={`card-salon-${salon.id}`}>
                  <img 
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250" 
                    alt={salon.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-foreground" data-testid={`text-salon-name-${salon.id}`}>
                        {salon.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-foreground" data-testid={`text-salon-rating-${salon.id}`}>
                          {salon.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4" data-testid={`text-salon-location-${salon.id}`}>
                      {salon.location}
                    </p>
                    
                    {/* Queue Status */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${salon.queueCount > 5 ? 'bg-yellow-500' : 'bg-green-500 pulse-pink'}`}></div>
                        <span className="text-sm text-muted-foreground" data-testid={`text-queue-count-${salon.id}`}>
                          {salon.queueCount} people in queue
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground" data-testid={`text-wait-time-${salon.id}`}>
                        ~{salon.estimatedWaitTime || 15} min wait
                      </span>
                    </div>
                    
                    {/* Services Preview */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {salon.services.slice(0, 3).map((service) => (
                        <Badge key={service.id} variant="secondary" className="text-xs" data-testid={`badge-service-${service.id}`}>
                          {service.name}
                        </Badge>
                      ))}
                    </div>
                    
                    <Link href={`/salon/${salon.id}`} data-testid={`link-salon-${salon.id}`}>
                      <Button className="w-full font-semibold" data-testid={`button-join-queue-${salon.id}`}>
                        View Salon
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 gradient-pink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose SmartQ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of salon visits with our innovative queue management system
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Smartphone className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Mobile-First Experience</h3>
              <p className="text-muted-foreground leading-relaxed">
                Join queues, track progress, and get notifications right from your phone. No more physical waiting.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Gift className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Loyalty Rewards</h3>
              <p className="text-muted-foreground leading-relaxed">
                Earn points with every visit and unlock exclusive discounts and perks at your favorite salons.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Clock className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Real-Time Updates</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get accurate wait times and instant notifications when it's almost your turn.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Star className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Review System</h3>
              <p className="text-muted-foreground leading-relaxed">
                Share your experience and discover the best salons through authentic customer reviews.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <BarChart3 className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Business Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Salon owners get detailed insights on customer behavior, peak hours, and revenue trends.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Handshake className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Smart Matching</h3>
              <p className="text-muted-foreground leading-relaxed">
                Find salons based on your preferences, location, and service needs with our intelligent algorithm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Skip the Wait?
          </h2>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            Join thousands of satisfied customers who have revolutionized their salon experience with SmartQ.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth" data-testid="link-get-started">
              <Button size="lg" className="px-8 py-4 font-semibold shadow-lg hover:shadow-xl" data-testid="button-get-started">
                Get Started Now
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 font-semibold border-white/20 text-white hover:bg-white/10"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
