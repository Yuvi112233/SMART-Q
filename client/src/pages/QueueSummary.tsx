import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Tag, ShoppingCart, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";

export default function QueueSummary() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { items, removeItem, clearCart, getTotalPrice } = useCart();
  const { toast } = useToast();
  const [selectedOffer, setSelectedOffer] = useState<any>(null);

  // Fetch offers for the salon
  const { data: availableOffers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['salonOffers', items[0]?.salonId],
    queryFn: () => {
      if (!items[0]?.salonId) return [];
      return api.offers.getBySalon(items[0].salonId);
    },
    enabled: !!items[0]?.salonId,
  });

  const subtotal = getTotalPrice();
  const discountAmount = selectedOffer ? (subtotal * selectedOffer.discount) / 100 : 0;
  const finalTotal = subtotal - discountAmount;

  const joinQueueMutation = useMutation({
    mutationFn: async () => {
      if (!user || items.length === 0) throw new Error("Invalid request");
      
      // Send multiple services with total pricing
      const serviceIds = items.map(item => item.service.id);
      const appliedOfferIds = selectedOffer ? [selectedOffer.id] : [];
      
      return api.queue.join({
        userId: user.id,
        salonId: items[0].salonId,
        serviceIds: serviceIds,
        totalPrice: finalTotal, // Keep as decimal
        appliedOffers: appliedOfferIds,
        status: "waiting"
      });
    },
    onSuccess: () => {
      toast({
        title: "Successfully joined queue!",
        description: `You've been added to the queue with ${items.length} service${items.length > 1 ? 's' : ''}.`,
      });
      clearCart();
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

  const handleApplyOffer = (offer: any) => {
    if (selectedOffer?.id === offer.id) {
      setSelectedOffer(null);
    } else {
      setSelectedOffer(offer);
    }
  };

  const handleConfirmAndJoin = () => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    joinQueueMutation.mutate();
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some services to get started</p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Browse Salons
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(`/salon/${items[0]?.salonId}`)}
            className="mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Queue Summary</h1>
        </div>

        {/* Selected Services */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Selected Services ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.service.name}</h3>
                    <p className="text-sm text-gray-600">{item.salonName}</p>
                    <p className="text-sm text-gray-500">{item.service.duration} minutes</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">${item.service.price}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.service.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Offers */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Available Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {offersLoading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading offers...</p>
              </div>
            ) : availableOffers.length > 0 ? (
              <div className="space-y-3">
                {availableOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{offer.title}</h4>
                      <p className="text-sm text-gray-600">{offer.description}</p>
                      <Badge variant="secondary" className="mt-1">
                        {offer.discount}% OFF
                      </Badge>
                    </div>
                    <Button
                      variant={selectedOffer?.id === offer.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleApplyOffer(offer)}
                    >
                      {selectedOffer?.id === offer.id ? "Applied" : "Apply"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No offers available for this salon</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bill Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Bill Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.length} service{items.length > 1 ? 's' : ''})</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              {selectedOffer && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({selectedOffer.title} - {selectedOffer.discount}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 my-3"></div>
              
              <div className="flex justify-between text-lg font-bold text-gray-800">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirmAndJoin}
          disabled={joinQueueMutation.isPending}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {joinQueueMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Joining Queue...
            </div>
          ) : (
            `Confirm & Join Queue - $${finalTotal.toFixed(2)}`
          )}
        </Button>
      </div>
    </div>
  );
}
