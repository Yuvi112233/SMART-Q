import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Clock, 
  Star, 
  DollarSign, 
  Plus, 
  Percent, 
  BarChart3, 
  Settings,
  TrendingUp,
  UserCheck,
  UserX,
  PlayCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import { insertSalonSchema, insertServiceSchema, insertOfferSchema } from "@shared/schema";
import type { QueueWithDetails, Analytics } from "../types";

const serviceFormSchema = insertServiceSchema.omit({ salonId: true });
const offerFormSchema = insertOfferSchema.omit({ salonId: true });
const salonFormSchema = insertSalonSchema.omit({ ownerId: true });

type ServiceForm = z.infer<typeof serviceFormSchema>;
type OfferForm = z.infer<typeof offerFormSchema>;
type SalonForm = z.infer<typeof salonFormSchema>;

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSalonId, setSelectedSalonId] = useState<string>("");

  // Get user's salons
  const { data: salons = [], isLoading: salonsLoading } = useQuery({
    queryKey: ['/api/salons'],
    enabled: !!user && user.role === 'salon',
    select: (data: any[]) => data.filter((salon: any) => salon.ownerId === user?.id),
  });

  // Auto-select first salon if none selected
  if (!selectedSalonId && salons.length > 0) {
    setSelectedSalonId(salons[0].id);
  }

  // Get queue data for selected salon
  const { data: queues = [], isLoading: queuesLoading } = useQuery<QueueWithDetails[]>({
    queryKey: ['/api/salons', selectedSalonId, 'queues'],
    enabled: !!selectedSalonId,
  });

  // Get analytics for selected salon
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ['/api/analytics', selectedSalonId],
    enabled: !!selectedSalonId,
  });

  // Forms
  const salonForm = useForm<SalonForm>({
    resolver: zodResolver(salonFormSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      operatingHours: {},
      images: [],
    },
  });

  const serviceForm = useForm<ServiceForm>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      duration: 30,
      price: "0",
      description: "",
    },
  });

  const offerForm = useForm<OfferForm>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      title: "",
      description: "",
      discount: "10",
      validityPeriod: new Date(),
      isActive: true,
    },
  });

  // Mutations
  const createSalonMutation = useMutation({
    mutationFn: api.salons.create,
    onSuccess: () => {
      toast({
        title: "Salon created successfully!",
        description: "Your salon has been added to SmartQ.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      salonForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create salon",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: api.services.create,
    onSuccess: () => {
      toast({
        title: "Service added successfully!",
        description: "The new service is now available for booking.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      serviceForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to add service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: api.offers.create,
    onSuccess: () => {
      toast({
        title: "Offer created successfully!",
        description: "Your promotion is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      offerForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQueueMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      api.queue.update(id, updates),
    onSuccess: () => {
      toast({
        title: "Queue updated successfully",
        description: "Customer status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', selectedSalonId, 'queues'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update queue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSalonSubmit = (data: SalonForm) => {
    createSalonMutation.mutate({
      ...data,
      ownerId: user!.id,
    });
  };

  const onServiceSubmit = (data: ServiceForm) => {
    if (!selectedSalonId) return;
    createServiceMutation.mutate({
      ...data,
      salonId: selectedSalonId,
    });
  };

  const onOfferSubmit = (data: OfferForm) => {
    if (!selectedSalonId) return;
    console.log('Offer form data:', data);
    createOfferMutation.mutate({
      ...data,
      salonId: selectedSalonId,
      validityPeriod: data.validityPeriod instanceof Date ? data.validityPeriod.toISOString() : data.validityPeriod,
    });
  };

  const startService = (queueId: string) => {
    updateQueueMutation.mutate({
      id: queueId,
      updates: { status: 'in-progress' },
    });
  };

  const completeService = (queueId: string) => {
    updateQueueMutation.mutate({
      id: queueId,
      updates: { status: 'completed' },
    });
  };

  const markNoShow = (queueId: string) => {
    updateQueueMutation.mutate({
      id: queueId,
      updates: { status: 'no-show' },
    });
  };

  if (!user || user.role !== 'salon') {
    return (
      <div className="min-h-screen gradient-pink flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">This dashboard is only available for salon owners.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (salonsLoading) {
    return (
      <div className="min-h-screen gradient-pink py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-2xl"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-pink py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Salon Dashboard</h1>
            <p className="text-muted-foreground">Manage your salons and track performance</p>
          </div>
          
          {salons.length === 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="button-create-salon">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Salon
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Salon</DialogTitle>
                  <DialogDescription>
                    Add your salon to SmartQ and start managing queues.
                  </DialogDescription>
                </DialogHeader>
                <Form {...salonForm}>
                  <form onSubmit={salonForm.handleSubmit(onSalonSubmit)} className="space-y-4">
                    <FormField
                      control={salonForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salon Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter salon name" {...field} data-testid="input-salon-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={salonForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter salon location" {...field} data-testid="input-salon-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={salonForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your salon..." 
                              {...field} 
                              value={field.value || ""}
                              data-testid="textarea-salon-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createSalonMutation.isPending}
                      data-testid="button-submit-salon"
                    >
                      {createSalonMutation.isPending ? "Creating..." : "Create Salon"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {salons.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No salons found</h2>
              <p className="text-muted-foreground mb-6">
                Create your first salon to start managing queues and tracking analytics.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Salon Selector */}
            {salons.length > 1 && (
              <div className="mb-8">
                <div className="flex space-x-2 overflow-x-auto">
                  {salons.map((salon: any) => (
                    <Button
                      key={salon.id}
                      variant={selectedSalonId === salon.id ? "default" : "outline"}
                      onClick={() => setSelectedSalonId(salon.id)}
                      className="whitespace-nowrap"
                      data-testid={`button-salon-${salon.id}`}
                    >
                      {salon.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedSalonId && (
              <>
                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Customers Today</p>
                          <p className="text-2xl font-bold text-foreground" data-testid="text-customers-today">
                            {analyticsLoading ? "..." : analytics?.customersToday || 0}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg Wait Time</p>
                          <p className="text-2xl font-bold text-foreground" data-testid="text-avg-wait">
                            {analyticsLoading ? "..." : `${Math.round(analytics?.avgWaitTime || 0)}min`}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Rating</p>
                          <p className="text-2xl font-bold text-foreground" data-testid="text-rating">
                            {analyticsLoading ? "..." : analytics?.rating?.toFixed(1) || "0.0"}
                          </p>
                        </div>
                        <Star className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                          <p className="text-2xl font-bold text-foreground" data-testid="text-revenue">
                            {analyticsLoading ? "..." : `$${analytics?.revenue?.toFixed(2) || "0.00"}`}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="queue" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="queue" data-testid="tab-queue">Current Queue</TabsTrigger>
                    <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
                    <TabsTrigger value="offers" data-testid="tab-offers">Offers</TabsTrigger>
                    <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
                  </TabsList>

                  {/* Queue Management */}
                  <TabsContent value="queue" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Current Queue</CardTitle>
                        <CardDescription>
                          Manage customer queue and service status
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {queuesLoading ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse"></div>
                            ))}
                          </div>
                        ) : queues.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No customers in queue</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {queues
                              .filter(q => q.status === 'waiting' || q.status === 'in-progress')
                              .map((queue) => (
                              <div key={queue.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg" data-testid={`queue-item-${queue.id}`}>
                                <div className="flex items-center space-x-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                    queue.status === 'in-progress' ? 'bg-primary' : 'bg-muted border-2 border-dashed border-border text-muted-foreground'
                                  }`}>
                                    {queue.position}
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground" data-testid={`text-customer-name-${queue.id}`}>
                                      {queue.user?.name || 'Customer'}
                                    </p>
                                    <p className="text-sm text-muted-foreground" data-testid={`text-service-name-${queue.id}`}>
                                      {queue.service?.name} • {queue.service?.duration}min
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={queue.status === 'in-progress' ? 'default' : 'secondary'}
                                    data-testid={`badge-status-${queue.id}`}
                                  >
                                    {queue.status === 'waiting' ? 'Waiting' : 'In Progress'}
                                  </Badge>
                                  <div className="flex space-x-2">
                                    {queue.status === 'waiting' ? (
                                      <Button
                                        size="sm"
                                        onClick={() => startService(queue.id)}
                                        disabled={updateQueueMutation.isPending}
                                        data-testid={`button-start-${queue.id}`}
                                      >
                                        <PlayCircle className="h-4 w-4 mr-1" />
                                        Start
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => completeService(queue.id)}
                                        disabled={updateQueueMutation.isPending}
                                        data-testid={`button-complete-${queue.id}`}
                                      >
                                        <UserCheck className="h-4 w-4 mr-1" />
                                        Complete
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => markNoShow(queue.id)}
                                      disabled={updateQueueMutation.isPending}
                                      data-testid={`button-no-show-${queue.id}`}
                                    >
                                      <UserX className="h-4 w-4 mr-1" />
                                      No Show
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Services Management */}
                  <TabsContent value="services" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Services</CardTitle>
                            <CardDescription>Manage your salon services</CardDescription>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button data-testid="button-add-service">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Service
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add New Service</DialogTitle>
                                <DialogDescription>
                                  Create a new service for your salon.
                                </DialogDescription>
                              </DialogHeader>
                              <Form {...serviceForm}>
                                <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-4">
                                  <FormField
                                    control={serviceForm.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Service Name</FormLabel>
                                        <FormControl>
                                          <Input placeholder="e.g., Haircut" {...field} data-testid="input-service-name" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={serviceForm.control}
                                      name="duration"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Duration (minutes)</FormLabel>
                                          <FormControl>
                                            <Input 
                                              type="number" 
                                              {...field} 
                                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                                              data-testid="input-service-duration"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={serviceForm.control}
                                      name="price"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Price ($)</FormLabel>
                                          <FormControl>
                                            <Input placeholder="0.00" {...field} data-testid="input-service-price" />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <FormField
                                    control={serviceForm.control}
                                    name="description"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                          <Textarea 
                                            placeholder="Service description..." 
                                            {...field} 
                                            value={field.value || ""}
                                            data-testid="textarea-service-description"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <Button 
                                    type="submit" 
                                    className="w-full" 
                                    disabled={createServiceMutation.isPending}
                                    data-testid="button-submit-service"
                                  >
                                    {createServiceMutation.isPending ? "Adding..." : "Add Service"}
                                  </Button>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {salons.find((s: any) => s.id === selectedSalonId)?.services?.map((service: any) => (
                            <div key={service.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg" data-testid={`service-item-${service.id}`}>
                              <div>
                                <h4 className="font-semibold text-foreground" data-testid={`text-service-name-${service.id}`}>
                                  {service.name}
                                </h4>
                                <p className="text-sm text-muted-foreground" data-testid={`text-service-details-${service.id}`}>
                                  {service.duration} minutes • ${service.price}
                                </p>
                                {service.description && (
                                  <p className="text-sm text-muted-foreground mt-1" data-testid={`text-service-description-${service.id}`}>
                                    {service.description}
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary" data-testid={`badge-bookings-${service.id}`}>
                                {analytics?.popularServices?.find(s => s.id === service.id)?.bookings || 0} bookings
                              </Badge>
                            </div>
                          )) || (
                            <div className="text-center py-8">
                              <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground">No services added yet</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Offers Management */}
                  <TabsContent value="offers" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Offers & Promotions</CardTitle>
                            <CardDescription>Create and manage special offers</CardDescription>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button data-testid="button-add-offer">
                                <Percent className="h-4 w-4 mr-2" />
                                Create Offer
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create New Offer</DialogTitle>
                                <DialogDescription>
                                  Create a promotional offer for your customers.
                                </DialogDescription>
                              </DialogHeader>
                              <Form {...offerForm}>
                                <form onSubmit={offerForm.handleSubmit(onOfferSubmit)} className="space-y-4">
                                  <FormField
                                    control={offerForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Offer Title</FormLabel>
                                        <FormControl>
                                          <Input placeholder="e.g., Summer Special" {...field} data-testid="input-offer-title" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={offerForm.control}
                                    name="description"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                          <Textarea 
                                            placeholder="Describe your offer..." 
                                            {...field} 
                                            data-testid="textarea-offer-description"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={offerForm.control}
                                      name="discount"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Discount (%)</FormLabel>
                                          <FormControl>
                                            <Input placeholder="10" {...field} data-testid="input-offer-discount" />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={offerForm.control}
                                      name="validityPeriod"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Valid Until</FormLabel>
                                          <FormControl>
                                            <Input 
                                              type="date" 
                                              {...field}
                                              value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                              onChange={(e) => field.onChange(new Date(e.target.value))}
                                              data-testid="input-offer-validity"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <Button 
                                    type="submit" 
                                    className="w-full" 
                                    disabled={createOfferMutation.isPending}
                                    data-testid="button-submit-offer"
                                  >
                                    {createOfferMutation.isPending ? "Creating..." : "Create Offer"}
                                  </Button>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8">
                          <Percent className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No active offers</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Analytics */}
                  <TabsContent value="analytics" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5" />
                            <span>Performance Metrics</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Show-up Rate</span>
                              <span className="font-semibold text-foreground" data-testid="text-show-rate">
                                {analyticsLoading ? "..." : `${Math.round(analytics?.showRate || 0)}%`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Total Customers</span>
                              <span className="font-semibold text-foreground" data-testid="text-total-customers">
                                {analyticsLoading ? "..." : analytics?.totalCustomers || 0}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Average Rating</span>
                              <span className="font-semibold text-foreground" data-testid="text-average-rating">
                                {analyticsLoading ? "..." : analytics?.rating?.toFixed(1) || "0.0"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5" />
                            <span>Popular Services</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analyticsLoading ? (
                              [...Array(3)].map((_, i) => (
                                <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
                              ))
                            ) : analytics?.popularServices?.length ? (
                              analytics.popularServices.slice(0, 5).map((service) => (
                                <div key={service.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg" data-testid={`popular-service-${service.id}`}>
                                  <span className="font-medium text-foreground" data-testid={`text-popular-service-name-${service.id}`}>
                                    {service.name}
                                  </span>
                                  <Badge variant="secondary" data-testid={`badge-popular-service-bookings-${service.id}`}>
                                    {service.bookings} bookings
                                  </Badge>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground text-center py-4">No service data available</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
