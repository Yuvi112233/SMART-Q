import {
  type User,
  type InsertUser,
  type Salon,
  type InsertSalon,
  type Service,
  type InsertService,
  type Queue,
  type InsertQueue,
  type Offer,
  type InsertOffer,
  type Review,
  type InsertReview,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Salons
  getSalon(id: string): Promise<Salon | undefined>;
  getSalonsByLocation(location: string): Promise<Salon[]>;
  getAllSalons(): Promise<Salon[]>;
  getSalonsByOwner(ownerId: string): Promise<Salon[]>;
  createSalon(salon: InsertSalon): Promise<Salon>;
  updateSalon(id: string, updates: Partial<Salon>): Promise<Salon | undefined>;
  deleteSalon(id: string): Promise<boolean>;

  // Services
  getService(id: string): Promise<Service | undefined>;
  getServicesBySalon(salonId: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<Service>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;

  // Queues
  getQueue(id: string): Promise<Queue | undefined>;
  getQueuesBySalon(salonId: string): Promise<Queue[]>;
  getQueuesByUser(userId: string): Promise<Queue[]>;
  getUserQueuePosition(userId: string, salonId: string): Promise<Queue | undefined>;
  createQueue(queue: InsertQueue): Promise<Queue>;
  updateQueue(id: string, updates: Partial<Queue>): Promise<Queue | undefined>;
  deleteQueue(id: string): Promise<boolean>;
  getNextQueuePosition(salonId: string): Promise<number>;

  // Offers
  getOffer(id: string): Promise<Offer | undefined>;
  getOffersBySalon(salonId: string): Promise<Offer[]>;
  getActiveOffers(): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | undefined>;
  deleteOffer(id: string): Promise<boolean>;

  // Reviews
  getReview(id: string): Promise<Review | undefined>;
  getReviewsBySalon(salonId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private salons: Map<string, Salon>;
  private services: Map<string, Service>;
  private queues: Map<string, Queue>;
  private offers: Map<string, Offer>;
  private reviews: Map<string, Review>;

  constructor() {
    this.users = new Map();
    this.salons = new Map();
    this.services = new Map();
    this.queues = new Map();
    this.offers = new Map();
    this.reviews = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "customer",
      loyaltyPoints: 0,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Salons
  async getSalon(id: string): Promise<Salon | undefined> {
    return this.salons.get(id);
  }

  async getSalonsByLocation(location: string): Promise<Salon[]> {
    return Array.from(this.salons.values()).filter(salon =>
      salon.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  async getAllSalons(): Promise<Salon[]> {
    return Array.from(this.salons.values());
  }

  async getSalonsByOwner(ownerId: string): Promise<Salon[]> {
    return Array.from(this.salons.values()).filter(salon => salon.ownerId === ownerId);
  }

  async createSalon(insertSalon: InsertSalon): Promise<Salon> {
    const id = randomUUID();
    const salon: Salon = {
      ...insertSalon,
      id,
      rating: "0.0",
      images: (insertSalon.images as string[]) || [],
      description: insertSalon.description || null,
      operatingHours: insertSalon.operatingHours as Salon['operatingHours'] || null,
      createdAt: new Date(),
    };
    this.salons.set(id, salon);
    return salon;
  }

  async updateSalon(id: string, updates: Partial<Salon>): Promise<Salon | undefined> {
    const salon = this.salons.get(id);
    if (!salon) return undefined;
    const updatedSalon = { ...salon, ...updates };
    this.salons.set(id, updatedSalon);
    return updatedSalon;
  }

  async deleteSalon(id: string): Promise<boolean> {
    return this.salons.delete(id);
  }

  // Services
  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async getServicesBySalon(salonId: string): Promise<Service[]> {
    return Array.from(this.services.values()).filter(service => service.salonId === salonId);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = {
      ...insertService,
      id,
      description: insertService.description || null,
      createdAt: new Date(),
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: string, updates: Partial<Service>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    const updatedService = { ...service, ...updates };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: string): Promise<boolean> {
    return this.services.delete(id);
  }

  // Queues
  async getQueue(id: string): Promise<Queue | undefined> {
    return this.queues.get(id);
  }

  async getQueuesBySalon(salonId: string): Promise<Queue[]> {
    return Array.from(this.queues.values())
      .filter(queue => queue.salonId === salonId)
      .sort((a, b) => a.position - b.position);
  }

  async getQueuesByUser(userId: string): Promise<Queue[]> {
    return Array.from(this.queues.values()).filter(queue => queue.userId === userId);
  }

  async getUserQueuePosition(userId: string, salonId: string): Promise<Queue | undefined> {
    return Array.from(this.queues.values()).find(
      queue => queue.userId === userId && queue.salonId === salonId && queue.status === 'waiting'
    );
  }

  async getNextQueuePosition(salonId: string): Promise<number> {
    const queues = await this.getQueuesBySalon(salonId);
    const waitingQueues = queues.filter(q => q.status === 'waiting');
    return waitingQueues.length + 1;
  }

  async createQueue(insertQueue: InsertQueue): Promise<Queue> {
    const id = randomUUID();
    const position = await this.getNextQueuePosition(insertQueue.salonId);
    const queue: Queue = {
      ...insertQueue,
      id,
      status: insertQueue.status || "waiting",
      position,
      timestamp: new Date(),
      estimatedWaitTime: insertQueue.estimatedWaitTime || null,
    };
    this.queues.set(id, queue);
    return queue;
  }

  async updateQueue(id: string, updates: Partial<Queue>): Promise<Queue | undefined> {
    const queue = this.queues.get(id);
    if (!queue) return undefined;
    const updatedQueue = { ...queue, ...updates };
    this.queues.set(id, updatedQueue);
    return updatedQueue;
  }

  async deleteQueue(id: string): Promise<boolean> {
    return this.queues.delete(id);
  }

  // Offers
  async getOffer(id: string): Promise<Offer | undefined> {
    return this.offers.get(id);
  }

  async getOffersBySalon(salonId: string): Promise<Offer[]> {
    return Array.from(this.offers.values()).filter(offer => offer.salonId === salonId);
  }

  async getActiveOffers(): Promise<Offer[]> {
    const now = new Date();
    return Array.from(this.offers.values()).filter(
      offer => offer.isActive && offer.validityPeriod > now
    );
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const id = randomUUID();
    const offer: Offer = {
      ...insertOffer,
      id,
      isActive: insertOffer.isActive !== undefined ? insertOffer.isActive : true,
      createdAt: new Date(),
    };
    this.offers.set(id, offer);
    return offer;
  }

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | undefined> {
    const offer = this.offers.get(id);
    if (!offer) return undefined;
    const updatedOffer = { ...offer, ...updates };
    this.offers.set(id, updatedOffer);
    return updatedOffer;
  }

  async deleteOffer(id: string): Promise<boolean> {
    return this.offers.delete(id);
  }

  // Reviews
  async getReview(id: string): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsBySalon(salonId: string): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.salonId === salonId);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    const review: Review = {
      ...insertReview,
      id,
      comment: insertReview.comment || null,
      createdAt: new Date(),
    };
    this.reviews.set(id, review);
    return review;
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;
    const updatedReview = { ...review, ...updates };
    this.reviews.set(id, updatedReview);
    return updatedReview;
  }

  async deleteReview(id: string): Promise<boolean> {
    return this.reviews.delete(id);
  }
}

export const storage = new MemStorage();
