import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Star, MapPin, Clock, Users, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import { insertQueueSchema, insertReviewSchema } from "@shared/schema";
import type { SalonDetails } from "../types";

const queueFormSchema = insertQueueSchema.omit({ userId: true });
const reviewFormSchema = insertReviewSchema.omit({ userId: true, salonId: true });

type QueueForm = z.infer<typeof queueFormSchema>;
type ReviewForm = z.infer<typeof reviewFormSchema>;

export default function SalonProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: salon, isLoading } = useQuery<SalonDetails>({
    queryKey: ['/api/salons', id],
    enabled: !!id,
  });

  const queueForm = useForm<QueueForm>({
    resolver: zodResolver(queueFormSchema),
    defaultValues: {
      salonId: id || "",
      serviceId: "",
      status: "waiting",
    },
  });

  const reviewForm = useForm<ReviewForm>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  const joinQueueMutation = useMutation({
    mutationFn: api.queue.join,
    onSuccess: () => {
      toast({
        title: "Joined queue successfully!",
        description: "You'll receive notifications about your position.",
      });
      setLocation('/queue');
    },
    onError: (error) => {
      toast({
        title: "Failed to join queue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addReviewMutation = useMutation({
    mutationFn: api.reviews.create,
    onSuccess: () => {
      toast({
        title: "Review added successfully!",
        description: "Thank you for your feedback.",
      });
      setShowReviewForm(false);
      reviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/salons', id] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onQueueSubmit = (data: QueueForm) => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    joinQueueMutation.mutate({
      ...data,
      userId: user.id,
    });
  };

  const onReviewSubmit = (data: ReviewForm) => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    addReviewMutation.mutate({
      ...data,
      salonId: id!,
      userId: user.id,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-pink py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded-2xl mb-8"></div>
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-6 bg-muted rounded mb-8"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded-2xl"></div>
              <div className="h-96 bg-muted rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen gradient-pink flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Salon not found</h1>
            <p className="text-muted-foreground mb-4">The salon you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation('/')} data-testid="button-back-home">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-pink py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Salon Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <img 
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300" 
            alt={salon.name}
            className="w-full h-64 object-cover"
          />
          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-salon-name">
                  {salon.name}
                </h1>
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span data-testid="text-salon-location">{salon.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span data-testid="text-salon-rating">{salon.rating}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${salon.queueCount > 5 ? 'bg-yellow-500' : 'bg-green-500 pulse-pink'}`}></div>
                  <span className="text-sm text-muted-foreground" data-testid="text-queue-status">
                    {salon.queueCount} in queue
                  </span>
                </div>
                <span className="text-lg font-semibold text-foreground" data-testid="text-wait-time">
                  ~{salon.estimatedWaitTime} min wait
                </span>
              </div>
            </div>
            {salon.description && (
              <p className="text-muted-foreground" data-testid="text-salon-description">
                {salon.description}
              </p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Services</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salon.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg" data-testid={`service-${service.id}`}>
                    <div>
                      <h4 className="font-semibold text-foreground" data-testid={`text-service-name-${service.id}`}>
                        {service.name}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid={`text-service-duration-${service.id}`}>
                        {service.duration} minutes
                      </p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1" data-testid={`text-service-description-${service.id}`}>
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-foreground" data-testid={`text-service-price-${service.id}`}>
                        ${service.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Join Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Join Queue</span>
              </CardTitle>
              <CardDescription>
                Select a service to join the queue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...queueForm}>
                <form onSubmit={queueForm.handleSubmit(onQueueSubmit)} className="space-y-4">
                  <FormField
                    control={queueForm.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-service">
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {salon.services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} - ${service.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={joinQueueMutation.isPending}
                    data-testid="button-join-queue"
                  >
                    {joinQueueMutation.isPending ? "Joining..." : "Join Queue"}
                  </Button>
                </form>
              </Form>

              {/* Current Offers */}
              {salon.offers.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
                    <Tag className="h-4 w-4" />
                    <span>Current Offers</span>
                  </h4>
                  <div className="space-y-2">
                    {salon.offers.map((offer) => (
                      <div key={offer.id} className="p-3 bg-primary/10 rounded-lg" data-testid={`offer-${offer.id}`}>
                        <h5 className="font-medium text-foreground" data-testid={`text-offer-title-${offer.id}`}>
                          {offer.title}
                        </h5>
                        <p className="text-sm text-muted-foreground" data-testid={`text-offer-description-${offer.id}`}>
                          {offer.description}
                        </p>
                        <Badge variant="secondary" className="mt-1" data-testid={`badge-offer-discount-${offer.id}`}>
                          {offer.discount}% off
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Reviews ({salon.reviews.length})</span>
              </CardTitle>
              {user && !showReviewForm && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowReviewForm(true)}
                  data-testid="button-add-review"
                >
                  Add Review
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showReviewForm && (
              <div className="mb-6 p-4 bg-secondary rounded-lg">
                <Form {...reviewForm}>
                  <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-4">
                    <FormField
                      control={reviewForm.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger data-testid="select-rating">
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <SelectItem key={rating} value={rating.toString()}>
                                  {rating} Star{rating !== 1 ? 's' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={reviewForm.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comment (optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Share your experience..." 
                              {...field} 
                              value={field.value || ""}
                              data-testid="textarea-comment"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex space-x-2">
                      <Button 
                        type="submit" 
                        disabled={addReviewMutation.isPending}
                        data-testid="button-submit-review"
                      >
                        {addReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowReviewForm(false)}
                        data-testid="button-cancel-review"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            <div className="space-y-4">
              {salon.reviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-8" data-testid="text-no-reviews">
                  No reviews yet. Be the first to review this salon!
                </p>
              ) : (
                salon.reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-secondary rounded-lg" data-testid={`review-${review.id}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground" data-testid={`text-review-date-${review.id}`}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-foreground" data-testid={`text-review-comment-${review.id}`}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
