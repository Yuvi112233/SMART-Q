import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, AlertCircle } from "lucide-react";
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
                            
                            {/* Position Circle */}
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
                                  strokeDashoffset={352 - (352 * (queue.position > 0 ? Math.max(0, 1 - queue.position / 10) : 0))}
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
                                data-testid={`button-directions-${queue.id}`}
                              >
                                Get Directions
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
                              {queue.service?.name} • {new Date(queue.timestamp).toLocaleDateString()}
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
