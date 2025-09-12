import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
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
import { IStorage } from "./storage";
import { UserModel, SalonModel, ServiceModel, QueueModel, OfferModel, ReviewModel } from "./db";

export class MongoStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ id }).lean();
    return user ? user as unknown as User : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email }).lean();
    return user ? user as unknown as User : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);

    const userObject = {
      id,
      name: insertUser.name,
      email: insertUser.email,
      phone: insertUser.phone, // Explicitly set the phone number
      password: hashedPassword,
      role: insertUser.role || 'customer',
      loyaltyPoints: 0,
      createdAt: new Date(),
    };

    const createdUserDoc = await UserModel.create(userObject);

    // Mongoose's .create() can return a Mongoose document, not a plain object.
    // We convert it to a plain object to match the return type.
    const user = createdUserDoc.toObject() as User;

    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    const updatedUser = await UserModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    ).lean();
    
    return updatedUser ? updatedUser as unknown as User : undefined;
  }

  async addFavoriteSalon(userId: string, salonId: string): Promise<User | undefined> {
    const updatedUser = await UserModel.findOneAndUpdate(
      { id: userId },
      { $addToSet: { favoriteSalons: salonId } },
      { new: true }
    ).lean();
    return updatedUser ? updatedUser as unknown as User : undefined;
  }

  async removeFavoriteSalon(userId: string, salonId: string): Promise<User | undefined> {
    const updatedUser = await UserModel.findOneAndUpdate(
      { id: userId },
      { $pull: { favoriteSalons: salonId } },
      { new: true }
    ).lean();
    return updatedUser ? updatedUser as unknown as User : undefined;
  }

  // Salons
  async getSalon(id: string): Promise<Salon | undefined> {
    const salon = await SalonModel.findOne({ id }).lean();
    return salon ? salon as unknown as Salon : undefined;
  }

  async getSalonsByLocation(location: string): Promise<Salon[]> {
    const salons = await SalonModel.find({ 
      location: { $regex: location, $options: 'i' } 
    }).lean();
    return salons as unknown as Salon[];
  }

  async getAllSalons(): Promise<Salon[]> {
    const salons = await SalonModel.find().lean();
    return salons as unknown as Salon[];
  }

  async getSalonsByOwner(ownerId: string): Promise<Salon[]> {
    const salons = await SalonModel.find({ ownerId }).lean();
    return salons as unknown as Salon[];
  }

  async createSalon(salon: InsertSalon): Promise<Salon> {
    const id = randomUUID();
    const newSalon: Salon = {
      ...salon,
      id,
      rating: 0,
      createdAt: new Date(),
    };
    
    await SalonModel.create(newSalon);
    return newSalon;
  }

  async updateSalon(id: string, updates: Partial<Salon>): Promise<Salon | undefined> {
    const updatedSalon = await SalonModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    ).lean();
    
    return updatedSalon ? updatedSalon as unknown as Salon : undefined;
  }

  async deleteSalon(id: string): Promise<boolean> {
    const result = await SalonModel.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Services
  async getService(id: string): Promise<Service | undefined> {
    const service = await ServiceModel.findOne({ id }).lean();
    return service ? service as unknown as Service : undefined;
  }

  async getServicesBySalon(salonId: string): Promise<Service[]> {
    const services = await ServiceModel.find({ salonId }).lean();
    return services as unknown as Service[];
  }

  async createService(service: InsertService): Promise<Service> {
    const id = randomUUID();
    const newService: Service = {
      ...service,
      id,
      createdAt: new Date(),
    };
    
    await ServiceModel.create(newService);
    return newService;
  }

  async updateService(id: string, updates: Partial<Service>): Promise<Service | undefined> {
    const updatedService = await ServiceModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    ).lean();
    
    return updatedService ? updatedService as unknown as Service : undefined;
  }

  async deleteService(id: string): Promise<boolean> {
    const result = await ServiceModel.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Queues
  async getQueue(id: string): Promise<Queue | undefined> {
    const queue = await QueueModel.findOne({ id }).lean();
    return queue ? queue as unknown as Queue : undefined;
  }

  async getQueuesBySalon(salonId: string): Promise<Queue[]> {
    const queues = await QueueModel.find({ salonId }).sort({ position: 1 }).lean();
    return queues as unknown as Queue[];
  }

  async getQueuesByUser(userId: string): Promise<Queue[]> {
    const queues = await QueueModel.find({ userId }).lean();
    return queues as unknown as Queue[];
  }

  async getUserQueuePosition(userId: string, salonId: string): Promise<Queue | undefined> {
    const queue = await QueueModel.findOne({ userId, salonId }).lean();
    return queue ? queue as unknown as Queue : undefined;
  }

  async createQueue(queue: InsertQueue): Promise<Queue> {
    const id = randomUUID();
    const position = await this.getNextQueuePosition(queue.salonId);
    
    const newQueue: Queue = {
      ...queue,
      id,
      position,
      status: "waiting",
      createdAt: new Date(),
    };
    
    await QueueModel.create(newQueue);
    return newQueue;
  }

  async updateQueue(id: string, updates: Partial<Queue>): Promise<Queue | undefined> {
    const updatedQueue = await QueueModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    ).lean();
    
    return updatedQueue ? updatedQueue as unknown as Queue : undefined;
  }

  async deleteQueue(id: string): Promise<boolean> {
    const result = await QueueModel.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getNextQueuePosition(salonId: string): Promise<number> {
    const lastQueue = await QueueModel.findOne({ salonId })
      .sort({ position: -1 })
      .limit(1)
      .lean();
    
    return lastQueue ? (lastQueue.position as number) + 1 : 1;
  }

  // Offers
  async getOffer(id: string): Promise<Offer | undefined> {
    const offer = await OfferModel.findOne({ id }).lean();
    return offer ? offer as unknown as Offer : undefined;
  }

  async getOffersBySalon(salonId: string): Promise<Offer[]> {
    console.log('MongoDB: Searching for offers with salonId:', salonId);
    const offers = await OfferModel.find({ salonId }).lean();
    console.log('MongoDB: Found offers:', offers);
    return offers as unknown as Offer[];
  }

  async getActiveOffers(): Promise<Offer[]> {
    console.log('MongoDB: Searching for active offers');
    const offers = await OfferModel.find({ 
      validityPeriod: { $gt: new Date() },
      isActive: true
    }).lean();
    return offers as unknown as Offer[];
  }

  async createOffer(offer: InsertOffer): Promise<Offer> {
    const id = randomUUID();
    const newOffer: Offer = {
      ...offer,
      id,
      createdAt: new Date(),
    };
    
    console.log('MongoDB: Creating offer:', newOffer);
    await OfferModel.create(newOffer);
    console.log('MongoDB: Offer created successfully');
    return newOffer;
  }

  async updateOffer(id: string, updates: Partial<Offer>): Promise<Offer | undefined> {
    const updatedOffer = await OfferModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    ).lean();
    
    return updatedOffer ? updatedOffer as unknown as Offer : undefined;
  }

  async deleteOffer(id: string): Promise<boolean> {
    const result = await OfferModel.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Reviews
  async getReview(id: string): Promise<Review | undefined> {
    const review = await ReviewModel.findOne({ id }).lean();
    return review ? review as unknown as Review : undefined;
  }

  async getReviewsBySalon(salonId: string): Promise<Review[]> {
    const reviews = await ReviewModel.find({ salonId }).lean();
    return reviews as unknown as Review[];
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = randomUUID();
    const newReview: Review = {
      ...review,
      id,
      createdAt: new Date(),
    };
    
    await ReviewModel.create(newReview);
    
    // Update salon rating
    const allReviews = await this.getReviewsBySalon(review.salonId);
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;
    
    await SalonModel.updateOne(
      { id: review.salonId },
      { $set: { rating: averageRating } }
    );
    
    return newReview;
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | undefined> {
    const updatedReview = await ReviewModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    ).lean();
    
    if (updatedReview && updates.rating) {
      // Update salon rating
      const salonId = updatedReview.salonId;
      const allReviews = await this.getReviewsBySalon(salonId);
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;
      
      await SalonModel.updateOne(
        { id: salonId },
        { $set: { rating: averageRating } }
      );
    }
    
    return updatedReview ? updatedReview as unknown as Review : undefined;
  }

  async deleteReview(id: string): Promise<boolean> {
    const review = await ReviewModel.findOne({ id }).lean();
    if (!review) return false;
    
    const result = await ReviewModel.deleteOne({ id });
    
    if (result.deletedCount > 0) {
      // Update salon rating
      const salonId = review.salonId;
      const allReviews = await this.getReviewsBySalon(salonId);
      
      if (allReviews.length > 0) {
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / allReviews.length;
        
        await SalonModel.updateOne(
          { id: salonId },
          { $set: { rating: averageRating } }
        );
      }
      
      return true;
    }
    
    return false;
  }
}