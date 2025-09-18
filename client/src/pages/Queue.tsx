import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, AlertCircle, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { api } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import type { QueueWithDetails } from "../types";

export default function Queue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { connected } = useWebSocket();
  const [, setLocation] = useLocation();
  const [loadingDirections, setLoadingDirections] = useState<string | null>(null);

  const { data: queues = [], isLoading } = useQuery<QueueWithDetails[]>({
    queryKey: ['/api/queues/my'],
    enabled: !!user,
  });

  const leaveQueueMutation = useMutation({
    mutationFn: api.queue.leave,
    onSuccess: () => {
      toast({
        title: "Left queue successfully",
        description: "You've been removed from the queue.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/queues/my'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to leave queue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get user's current location with high accuracy and open directions
  const openDirections = (salon: any, queueId: string) => {
    setLoadingDirections(queueId);

    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      setLoadingDirections(null);
      return;
    }

    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;
    let timeoutId: NodeJS.Timeout;

    const openMapsWithLocation = (userLat: number, userLng: number) => {
      console.log('Opening directions with user location:', {
        userLocation: { lat: userLat, lng: userLng },
        salonLocation: { lat: salon.latitude, lng: salon.longitude },
        salon: salon.name
      });

      if (salon.latitude && salon.longitude) {
        // Use exact coordinates for both origin and destination
        const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${salon.latitude},${salon.longitude}/?travelmode=driving`;
        console.log('Using precise coordinates URL:', url);
        window.open(url, '_blank');
      } else {
        // Fallback to address search with user location as origin
        const query = encodeURIComponent(salon.fullAddress || salon.location);
        const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${query}/?travelmode=driving`;
        console.log('Using address with user location URL:', url);
        window.open(url, '_blank');
      }
      setLoadingDirections(null);
    };

    const processPosition = (position: GeolocationPosition) => {
      const { latitude: lat, longitude: lng, accuracy: acc } = position.coords;

      // If this is the first position or it's more accurate than the previous one
      if (!bestPosition || (acc && bestPosition.coords.accuracy && acc < bestPosition.coords.accuracy)) {
        bestPosition = position;

        // If accuracy is good enough (less than 50m), use this position
        if (acc && acc < 50) {
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
          }
          clearTimeout(timeoutId);
          openMapsWithLocation(lat, lng);
          return;
        }
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Geolocation failed:", error);
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearTimeout(timeoutId);

      // Show error message based on error type
      let errorMessage = "Failed to get your location.";
      if (error.code === 1) {
        errorMessage = "Location access denied. Please enable location services and try again.";
      } else if (error.code === 2) {
        errorMessage = "Location unavailable. Please check your GPS settings.";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out. Please try again.";
      }

      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
      setLoadingDirections(null);
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
            maximumAge: 0, // Always get fresh location for directions
          }
        );
      },
      {
        enableHighAccuracy: false, // Quick first attempt
        timeout: 5000,
        maximumAge: 60000, // 1 minute cache for quick attempt
      }
    );

    // Start high-accuracy watching immediately for better results
    watchId = navigator.geolocation.watchPosition(
      processPosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // Always get fresh location for directions
      }
    );

    // Set a maximum time limit for location detection
    timeoutId = setTimeout(() => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      // Use the best position we have, even if not ideal
      if (bestPosition) {
        const { latitude: lat, longitude: lng } = bestPosition.coords;
        openMapsWithLocation(lat, lng);
      } else {
        toast({
          title: "Location Timeout",
          description: "Couldn't get precise location. Opening directions without your current location.",
        });
        // Fallback to original behavior
        if (salon.latitude && salon.longitude) {
          const url = `https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}&travelmode=driving`;
          window.open(url, '_blank');
        } else {
          const query = encodeURIComponent(salon.fullAddress || salon.location);
          const url = `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;
          window.open(url, '_blank');
        }
        setLoadingDirections(null);
      }
    }, 10000); // 10 seconds max for directions
  };

  if (!user) {
    return (
      <div className="min-h-screen gradient-pink flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Please sign in</h1>
            <p className="text-muted-foreground mb-4">You need to sign in to view your queue status.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-pink py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-8"></div>
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeQueues = queues.filter(q => q.status === 'waiting' || q.status === 'in-progress');
  const completedQueues = queues.filter(q => q.status === 'completed' || q.status === 'no-show');

  return (
    <div className="min-h-screen gradient-pink py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Queue Status</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {activeQueues.length === 0 && completedQueues.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No queue history</h2>
              <p className="text-muted-foreground mb-6">
                You haven't joined any queues yet. Find a salon and join your first queue!
              </p>
              <Button
                data-testid="button-find-salons"
                onClick={() => setLocation('/')}
              >
                Find Salons
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active Queues */}
            {activeQueues.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Active Queues</h2>
                <div className="space-y-4">
                  {activeQueues.map((queue) => (
                    <Card key={queue.id} className="overflow-hidden" data-testid={`queue-${queue.id}`}>
                      <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Queue Status */}
                          <div className="text-center">
                            <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`text-salon-name-${queue.id}`}>
                              {queue.salon?.name}
                            </h3>
                            <p className="text-muted-foreground mb-4 flex items-center justify-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span data-testid={`text-salon-location-${queue.id}`}>{queue.salon?.location}</span>
                            </p>

                            {/* Position Display */}
                            {queue.status === 'waiting' ? (
                              <div className="relative mb-6">
                                <svg className="w-32 h-32 mx-auto transform -rotate-90">
                                  <circle
                                    cx="64" cy="64" r="56"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    className="text-muted/20"
                                  />
                                  <circle
                                    cx="64" cy="64" r="56"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray="352"
                                    strokeDashoffset={352 - (352 * (queue.position > 0 && queue.totalInQueue ? Math.max(0, 1 - queue.position / queue.totalInQueue) : 0))}
                                    className="text-primary"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-foreground" data-testid={`text-queue-position-${queue.id}`}>
                                      {queue.position}
                                    </div>
                                    <div className="text-sm text-muted-foreground">in queue</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="relative mb-6 flex items-center justify-center w-32 h-32 mx-auto">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-primary">
                                    Now Serving
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Wait Time */}
                            <div className="text-center mb-6">
                              <p className="text-3xl font-bold text-primary" data-testid={`text-estimated-wait-${queue.id}`}>
                                {queue.estimatedWaitTime || queue.position * 15} min
                              </p>
                              <p className="text-muted-foreground">estimated wait</p>
                            </div>
                          </div>

                          {/* Queue Details */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-foreground mb-2">Service Details</h4>
                              <div className="space-y-2">
                                {queue.services && Array.isArray(queue.services) && queue.services.length > 0 ? (
                                  <div>
                                    <p className="text-foreground" data-testid={`text-services-count-${queue.id}`}>
                                      <strong>Services:</strong> {queue.services.length} selected
                                    </p>
                                    <div className="mt-1 mb-1" data-testid={`text-services-list-${queue.id}`}>
                                      {queue.services.map((service) => (
                                        <p key={service.id} className="text-sm text-muted-foreground">
                                          - {service.name} (${service.price})
                                        </p>
                                      ))}
                                    </div>
                                    <p className="text-muted-foreground" data-testid={`text-total-price-${queue.id}`}>
                                      <strong>Total Price:</strong> ${queue.totalPrice}
                                    </p>
                                    {queue.appliedOffers && queue.appliedOffers.length > 0 && (
                                      <p className="text-green-600 text-sm">
                                        <strong>Offers Applied:</strong> {queue.appliedOffers.length} discount(s)
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-foreground" data-testid={`text-service-name-${queue.id}`}>
                                      <strong>Service:</strong> {queue.service?.name}
                                    </p>
                                    <p className="text-muted-foreground" data-testid={`text-service-duration-${queue.id}`}>
                                      <strong>Duration:</strong> {queue.service?.duration} minutes
                                    </p>
                                    <p className="text-muted-foreground" data-testid={`text-service-price-${queue.id}`}>
                                      <strong>Price:</strong> ${queue.service?.price}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-foreground mb-2">Status</h4>
                              <Badge
                                variant={queue.status === 'in-progress' ? 'default' : 'secondary'}
                                className="mb-2"
                                data-testid={`badge-status-${queue.id}`}
                              >
                                {queue.status === 'waiting' ? 'Waiting' : 'In Progress'}
                              </Badge>
                              <p className="text-sm text-muted-foreground" data-testid={`text-joined-time-${queue.id}`}>
                                Joined at {new Date(queue.timestamp).toLocaleTimeString()}
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-4">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => openDirections(queue.salon, queue.id)}
                                disabled={loadingDirections === queue.id}
                                data-testid={`button-directions-${queue.id}`}
                              >
                                <Navigation className="h-4 w-4 mr-2" />
                                {loadingDirections === queue.id ? 'Getting Location...' : 'Get Directions'}
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                disabled={leaveQueueMutation.isPending}
                                onClick={() => leaveQueueMutation.mutate(queue.id)}
                                data-testid={`button-leave-queue-${queue.id}`}
                              >
                                {leaveQueueMutation.isPending ? 'Leaving...' : 'Leave Queue'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Queue History */}
            {completedQueues.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Queue History</h2>
                <div className="space-y-4">
                  {completedQueues.map((queue) => (
                    <Card key={queue.id} className="opacity-75" data-testid={`history-queue-${queue.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground" data-testid={`text-history-salon-${queue.id}`}>
                              {queue.salon?.name}
                            </h4>
                            <p className="text-sm text-muted-foreground" data-testid={`text-history-service-${queue.id}`}>
                              {queue.services && queue.services.length > 0 ?
                                (queue.services.length > 1 ?
                                  `${queue.services.length} services` :
                                  queue.services[0].name) :
                                queue.service?.name} • {new Date(queue.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={queue.status === 'completed' ? 'default' : 'destructive'}
                              data-testid={`badge-history-status-${queue.id}`}
                            >
                              {queue.status === 'completed' ? 'Completed' : 'No Show'}
                            </Badge>
                            {queue.status === 'completed' && (
                              <div className="flex items-center space-x-1 mt-1">
                                <Star className="h-4 w-4 text-yellow-400" />
                                <span className="text-sm text-muted-foreground">
                                  +{Math.floor(parseFloat(queue.service?.price || '0') / 10)} points
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
