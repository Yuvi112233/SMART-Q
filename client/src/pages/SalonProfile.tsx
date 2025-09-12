import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Star, MapPin, Clock, Users, Tag, Heart, Plus, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import { insertReviewSchema } from "@shared/schema";
import type { SalonDetails } from "../types";

const reviewFormSchema = insertReviewSchema.omit({ userId: true, salonId: true });

type ReviewForm = z.infer<typeof reviewFormSchema>;

export default function SalonProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, updateUser } = useAuth();
  const { addItem, items, getItemCount } = useCart();

  const isFavorited = useMemo(() => {
    if (!user || !user.favoriteSalons) return false;
    return user.favoriteSalons.includes(id || "");
  }, [user, id]);

  const addFavoriteMutation = useMutation({
    mutationFn: () => api.users.addFavorite(id!),
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        updateUser(updatedUser);
        toast({
          title: "Added to favorites!",
        });
      }
    },
    onError: () => {
      toast({
        title: "Failed to add favorite",
        variant: "destructive",
      });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: () => api.users.removeFavorite(id!),
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        updateUser(updatedUser);
        toast({
          title: "Removed from favorites",
        });
      }
    },
    onError: () => {
      toast({
        title: "Failed to remove favorite",
        variant: "destructive",
      });
    },
  });

  const handleFavoriteClick = () => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    if (isFavorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  const handleAddToCart = (service: SalonDetails['services'][0]) => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    if (!salon) return;
    
    addItem(service, salon.id, salon.name);
    toast({
      title: "Service added to cart!",
      description: `${service.name} has been added to your selection.`,
    });
  };

  const isServiceInCart = (serviceId: string) => {
    return items.some(item => item.service.id === serviceId);
  };
  const { toast } = useToast();
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: salon, isLoading } = useQuery<SalonDetails>({
    queryKey: ['/api/salons', id],
    enabled: !!id,
  });


  const reviewForm = useForm<ReviewForm>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 5,
      comment: "",
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
        {/* Salon Header - Centered Layout */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-salon-name">
              {salon.name}
            </h1>
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavoriteClick}
                disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                data-testid="button-favorite"
              >
                <Heart className={`h-6 w-6 ${isFavorited ? 'text-red-500 fill-current' : 'text-muted-foreground'}`} />
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-muted-foreground mb-4">
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span data-testid="text-salon-location">{salon.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span data-testid="text-salon-rating">{salon.rating}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${salon.queueCount > 5 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span data-testid="text-queue-status">
                {salon.queueCount} in queue
              </span>
            </div>
            <span data-testid="text-wait-time">
              ~{salon.estimatedWaitTime} min wait
            </span>
          </div>
        </div>

        {/* Services Section - Clean Layout as per Sketch */}
        <div className="mb-8">
          {/* Services Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center space-x-2">
              <Clock className="h-6 w-6" />
              <span>Services</span>
            </h2>
            {getItemCount() > 0 && (
              <Button
                onClick={() => setLocation('/queue-summary')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart ({getItemCount()})
              </Button>
            )}
          </div>

          {/* Services List */}
          <div className="space-y-4">
            {salon.services.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100" data-testid={`service-${service.id}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg" data-testid={`text-service-name-${service.id}`}>
                      {service.name}
                    </h3>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-600 ml-1">4.5</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-sm" data-testid={`text-service-duration-${service.id}`}>
                        {service.duration} min
                      </span>
                    </div>
                    <div className="text-xl font-bold text-purple-600" data-testid={`text-service-price-${service.id}`}>
                      ${service.price}
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleAddToCart(service)}
                  disabled={isServiceInCart(service.id)}
                  className={`${
                    isServiceInCart(service.id)
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                  } px-6 py-2 rounded-lg font-medium`}
                  data-testid={`button-add-service-${service.id}`}
                >
                  {isServiceInCart(service.id) ? 'Added' : 'Add'}
                </Button>
              </div>
            ))}
          </div>
          
          {/* Cart Summary - Only show if services are selected */}
          {getItemCount() > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  {getItemCount()} service{getItemCount() > 1 ? 's' : ''} selected
                </p>
                <Button
                  onClick={() => setLocation('/queue-summary')}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Review & Join Queue
                </Button>
              </div>
            </div>
          )}
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
