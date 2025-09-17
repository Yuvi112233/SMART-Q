import type { Express } from "express";
import { z } from 'zod';
import multer from 'multer';

import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { MongoStorage } from "./mongoStorage";
import {
  insertUserSchema,
  insertSalonSchema,
  insertServiceSchema,
  insertQueueSchema,
  insertOfferSchema,
  insertReviewSchema,
  insertSalonPhotoSchema,
  loginSchema,
  type Salon,
} from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "./cloudinary";
import otpService from "./otpService";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "smartq-secret-key";
const storage = new MongoStorage();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

// Updated Middleware for JWT authentication
const authenticateToken = (req: Express.Request, res: Express.Response, next: Function) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role?: 'customer' | 'salon_owner';
    };

    // Set default role if missing
    if (!decoded.role) {
      decoded.role = 'customer';
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token', error: err });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'authenticate' && data.userId) {
          clients.set(data.userId, ws);
          console.log(`User ${data.userId} connected to WebSocket`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      for (const [userId, client] of Array.from(clients.entries())) {
        if (client === ws) {
          clients.delete(userId);
          console.log(`User ${userId} disconnected from WebSocket`);
          break;
        }
      }
    });
  });

  const broadcastQueueUpdate = (salonId: string, queueData: any) => {
    const message = JSON.stringify({ type: 'queue_update', salonId, data: queueData });
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(message);
    });
  };

  // ====================
  // AUTH ROUTES
  // ====================
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Create user with verification fields
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        emailVerified: false,
        phoneVerified: false,
        isVerified: false,
      });

      // Return user data without token (no auto-login)
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        message: 'Account created successfully. Please verify your email and phone number.'
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      let user;
      
      if (email) {
        user = await storage.getUserByEmail(email);
      }

      if (!user) return res.status(401).json({ message: 'Invalid credentials' });

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) return res.status(401).json({ message: 'Invalid credentials' });

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(403).json({ 
          message: 'Account not verified. Please complete email and phone verification.',
          requiresVerification: true,
          userId: user.id
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ user: { ...user, password: undefined }, token });
    } catch (error) {
      res.status(400).json({ message: 'Invalid login data', error });
    }
  });

  app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // ====================
  // FAVORITES ROUTES
  // ====================
  app.post('/api/users/favorites', authenticateToken, async (req, res) => {
    try {
      const { salonId } = req.body;
      if (!salonId) {
        return res.status(400).json({ message: 'salonId is required' });
      }
      const updatedUser = await storage.addFavoriteSalon(req.user!.userId, salonId);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.delete('/api/users/favorites/:salonId', authenticateToken, async (req, res) => {
    try {
      const { salonId } = req.params;
      const updatedUser = await storage.removeFavoriteSalon(req.user!.userId, salonId);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // ====================
  // SALON ROUTES
  // ====================
  app.get('/api/salons', async (req, res) => {
    try {
      const { location } = req.query;
      const salons = location
        ? await storage.getSalonsByLocation(location as string)
        : await storage.getAllSalons();

      const salonsWithDetails = await Promise.all(
        salons.map(async (salon) => {
          console.log('Processing salon with ID:', salon.id);
          const services = await storage.getServicesBySalon(salon.id);
          const queues = await storage.getQueuesBySalon(salon.id);
          const waitingQueues = queues.filter(q => q.status === 'waiting');
          const offers = await storage.getOffersBySalon(salon.id);
          const photos = await storage.getSalonPhotosBySalon(salon.id);
          console.log(`Found ${photos.length} photos for salon ${salon.id}`);

          return {
            ...salon,
            services,
            queueCount: waitingQueues.length,
            estimatedWaitTime: waitingQueues.length * 15,
            offers: offers.filter(o => o.isActive),
            photos,
          };
        })
      );

      // Sort salons: those with active offers first
      salonsWithDetails.sort((a, b) => {
        const aHasOffers = a.offers.length > 0;
        const bHasOffers = b.offers.length > 0;
        return (bHasOffers ? 1 : 0) - (aHasOffers ? 1 : 0);
      });

      res.json(salonsWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/salons/:id', async (req, res) => {
    try {
      const salon = await storage.getSalon(req.params.id);
      if (!salon) return res.status(404).json({ message: 'Salon not found' });

      const services = await storage.getServicesBySalon(salon.id);
      const offers = await storage.getOffersBySalon(salon.id);
      const reviews = await storage.getReviewsBySalon(salon.id);
      const queues = await storage.getQueuesBySalon(salon.id);
      const waitingQueues = queues.filter(q => q.status === 'waiting');

      res.json({
        ...salon,
        services,
        offers: offers.filter(o => o.isActive),
        reviews,
        queueCount: waitingQueues.length,
        estimatedWaitTime: waitingQueues.length * 15,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/salons', authenticateToken, async (req, res) => {
    try {
      console.log('Salon creation request received');
      console.log('User role:', req.user!.role);
      console.log('Request body:', req.body);
      
      if (req.user!.role !== 'salon_owner') {
        console.log('Authorization failed - not salon owner');
        return res.status(403).json({ message: 'Only salon owners can create salons' });
      }

      const salonData = insertSalonSchema.parse({ ...req.body, ownerId: req.user!.userId });
      console.log('Parsed salon data:', salonData);
      
      const salon = await storage.createSalon(salonData);
      console.log('Salon created successfully:', salon);
      
      res.status(201).json(salon);
    } catch (error) {
      console.error('Salon creation error:', error);
      res.status(400).json({ message: 'Invalid salon data', error: error.message });
    }
  });


  app.delete('/api/salons/:id', authenticateToken, async (req, res) => {
    try {
      console.log('Salon deletion request for ID:', req.params.id);
      const salon = await storage.getSalon(req.params.id);
      if (!salon) {
        console.log('Salon not found');
        return res.status(404).json({ message: 'Salon not found' });
      }

      if (salon.ownerId !== req.user!.userId) {
        console.log('Authorization failed - not salon owner');
        return res.status(403).json({ message: 'Not authorized to delete this salon' });
      }

      // Delete associated photos first
      const photos = await storage.getSalonPhotosBySalon(req.params.id);
      for (const photo of photos) {
        try {
          await deleteImageFromCloudinary(photo.publicId);
          await storage.deleteSalonPhoto(photo.id);
        } catch (error) {
          console.error('Error deleting photo:', error);
        }
      }

      // Delete the salon
      const deleted = await storage.deleteSalon(req.params.id);
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete salon' });
      }

      console.log('Salon deleted successfully');
      res.json({ message: 'Salon deleted successfully' });
    } catch (error) {
      console.error('Salon deletion error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  app.put('/api/salons/:id', authenticateToken, async (req, res) => {
    try {
      const salon = await storage.getSalon(req.params.id);
      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      if (salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to update this salon' });
      }

      const updates = insertSalonSchema.partial().parse(req.body);
      // Ensure proper typing for the updates
      const typedUpdates: Partial<Salon> = {
        ...updates,
        description: updates.description || null,
        operatingHours: updates.operatingHours as Salon['operatingHours'] || null,
        images: updates.images as string[] || null,
      };
      const updatedSalon = await storage.updateSalon(req.params.id, typedUpdates);
      res.json(updatedSalon);
    } catch (error) {
      res.status(400).json({ message: 'Invalid update data', error });
    }
  });

  // Service routes
  app.get('/api/salons/:salonId/services', async (req, res) => {
    try {
      const services = await storage.getServicesBySalon(req.params.salonId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/services', authenticateToken, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      
      // Verify salon ownership
      const salon = await storage.getSalon(serviceData.salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to add services to this salon' });
      }

      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ message: 'Invalid service data', error });
    }
  });

  // Queue routes
  app.get('/api/queues/my', authenticateToken, async (req, res) => {
    try {
      const queues = await storage.getQueuesByUser(req.user!.userId);
      
      const queuesWithDetails = await Promise.all(
        queues.map(async (queue) => {
          const salon = await storage.getSalon(queue.salonId);
          const service = await storage.getService(queue.serviceId);
          const salonQueues = await storage.getQueuesBySalon(queue.salonId);
          // Waiting list should be sorted by position ascending, which getQueuesBySalon does.
          const waitingQueues = salonQueues.filter(q => q.status === 'waiting');
          
          let userPosition = queue.position;
          if (queue.status === 'waiting') {
            const userInWaitingList = waitingQueues.findIndex(q => q.id === queue.id);
            if (userInWaitingList !== -1) {
              userPosition = userInWaitingList + 1;
            }
          } else if (queue.status === 'in-progress') {
            userPosition = 0; // Indicates "in progress"
          }
          
          return {
            ...queue,
            position: userPosition,
            salon,
            service,
            totalInQueue: waitingQueues.length,
          };
        })
      );

      res.json(queuesWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/salons/:salonId/queues', authenticateToken, async (req, res) => {
    try {
      const salon = await storage.getSalon(req.params.salonId);
      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      if (salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to view salon queues' });
      }

      const queues = await storage.getQueuesBySalon(req.params.salonId);
      
      // Get user and service details
      const queuesWithDetails = await Promise.all(
        queues.map(async (queue) => {
          const user = await storage.getUser(queue.userId);
          const service = await storage.getService(queue.serviceId);
          return {
            ...queue,
            user: user ? { ...user, password: undefined } : null,
            service,
          };
        })
      );

      res.json(queuesWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/salons/:salonId/offers', authenticateToken, async (req, res) => {
    try {
      const salon = await storage.getSalon(req.params.salonId);
      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      // Verify salon ownership
      if (salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to view offers for this salon' });
      }

      const offers = await storage.getOffersBySalon(req.params.salonId);
      console.log(`Fetching offers for salon ${req.params.salonId}:`, offers);
      console.log(`Number of offers found: ${offers.length}`);
      console.log(`Offers data:`, JSON.stringify(offers, null, 2));
      res.json(offers);
    } catch (error) {
      console.error('Error fetching offers:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/queues', authenticateToken, async (req, res) => {
    try {
      const queueData = insertQueueSchema.parse({
        ...req.body,
        userId: req.user!.userId,
      });

      // Check if user is already in active queue for this salon
      const existingQueue = await storage.getUserQueuePosition(req.user!.userId, queueData.salonId);
      if (existingQueue && (existingQueue.status === 'waiting' || existingQueue.status === 'in-progress')) {
        return res.status(400).json({ message: 'Already in queue for this salon' });
      }

      const queue = await storage.createQueue(queueData);
      
      // Broadcast queue update
      const salonQueues = await storage.getQueuesBySalon(queueData.salonId);
      broadcastQueueUpdate(queueData.salonId, { queues: salonQueues });

      res.status(201).json(queue);
    } catch (error) {
      res.status(400).json({ message: 'Invalid queue data', error });
    }
  });

  app.put('/api/queues/:id', authenticateToken, async (req, res) => {
    try {
      const queue = await storage.getQueue(req.params.id);
      if (!queue) {
        return res.status(404).json({ message: 'Queue entry not found' });
      }

      // Check authorization
      const salon = await storage.getSalon(queue.salonId);
      if (queue.userId !== req.user!.userId && salon?.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to update this queue entry' });
      }

      const updates = insertQueueSchema.partial().parse(req.body);
      const updatedQueue = await storage.updateQueue(req.params.id, updates);
      
      // Broadcast queue update
      const salonQueues = await storage.getQueuesBySalon(queue.salonId);
      broadcastQueueUpdate(queue.salonId, { queues: salonQueues });

      res.json(updatedQueue);
    } catch (error) {
      res.status(400).json({ message: 'Invalid update data', error });
    }
  });

  app.delete('/api/queues/:id', authenticateToken, async (req, res) => {
    try {
      const queue = await storage.getQueue(req.params.id);
      if (!queue) {
        return res.status(404).json({ message: 'Queue entry not found' });
      }

      if (queue.userId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to leave this queue' });
      }

      await storage.deleteQueue(req.params.id);
      
      // Broadcast queue update
      const salonQueues = await storage.getQueuesBySalon(queue.salonId);
      broadcastQueueUpdate(queue.salonId, { queues: salonQueues });

      res.json({ message: 'Left queue successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Offer routes
  app.get('/api/offers', async (req, res) => {
    try {
      const offers = await storage.getActiveOffers();
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/offers', authenticateToken, async (req, res) => {
    try {
      console.log('Raw request body:', req.body);
      console.log('validityPeriod type:', typeof req.body.validityPeriod);
      console.log('validityPeriod value:', req.body.validityPeriod);
      
      const offerData = insertOfferSchema.parse(req.body);
      console.log('Parsed offer data:', offerData);
      
      // Verify salon ownership
      const salon = await storage.getSalon(offerData.salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to create offers for this salon' });
      }

      const offer = await storage.createOffer(offerData);
      res.status(201).json(offer);
    } catch (error) {
      console.error('Offer creation error:', error);
      res.status(400).json({ message: 'Invalid offer data', error });
    }
  });

  app.put('/api/offers/:id', authenticateToken, async (req, res) => {
    try {
      const offer = await storage.getOffer(req.params.id);
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }

      // Verify salon ownership
      const salon = await storage.getSalon(offer.salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to update offers for this salon' });
      }

      const updates = insertOfferSchema.partial().parse(req.body);
      const updatedOffer = await storage.updateOffer(req.params.id, updates);
      res.json(updatedOffer);
    } catch (error) {
      res.status(400).json({ message: 'Invalid offer data', error });
    }
  });

  app.delete('/api/offers/:id', authenticateToken, async (req, res) => {
    try {
      const offer = await storage.getOffer(req.params.id);
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }

      // Verify salon ownership
      const salon = await storage.getSalon(offer.salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to delete offers for this salon' });
      }

      await storage.deleteOffer(req.params.id);
      res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Review routes
  app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user!.userId,
      });

      const review = await storage.createReview(reviewData);
      
      // Update salon rating
      const allReviews = await storage.getReviewsBySalon(reviewData.salonId);
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await storage.updateSalon(reviewData.salonId, { rating: avgRating.toFixed(1) });

      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ message: 'Invalid review data', error });
    }
  });

  // Analytics routes
  app.get('/api/analytics/:salonId', authenticateToken, async (req, res) => {
    try {
      const salon = await storage.getSalon(req.params.salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to view analytics for this salon' });
      }

      const queues = await storage.getQueuesBySalon(req.params.salonId);
      const services = await storage.getServicesBySalon(req.params.salonId);
      const reviews = await storage.getReviewsBySalon(req.params.salonId);

      // Calculate analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayQueues = queues.filter(q => q.timestamp >= today);
      const completedQueues = queues.filter(q => q.status === 'completed');
      const totalRevenue = completedQueues.reduce((sum, queue) => {
        const service = services.find(s => s.id === queue.serviceId);
        return sum + (service ? parseFloat(service.price) : 0);
      }, 0);

      const analytics = {
        customersToday: todayQueues.length,
        totalCustomers: queues.length,
        avgWaitTime: queues.length > 0 ? queues.reduce((sum, q) => sum + (q.estimatedWaitTime || 15), 0) / queues.length : 0,
        rating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
        showRate: queues.length > 0 ? (completedQueues.length / queues.length) * 100 : 100,
        revenue: totalRevenue,
        popularServices: services.map(service => ({
          ...service,
          bookings: queues.filter(q => q.serviceId === service.id).length,
        })).sort((a, b) => b.bookings - a.bookings),
      };

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // ====================
  // SALON PHOTO ROUTES
  // ====================
  
  // Test endpoint to verify routing
  app.get('/api/test-photos', (req, res) => {
    console.log('=== TEST PHOTOS ENDPOINT HIT ===');
    res.json({ message: 'Photo routes are working', timestamp: new Date().toISOString() });
  });

  // Test endpoint to verify photo saving with your salon ID
  app.post('/api/test-photo-save', async (req, res) => {
    try {
      console.log('=== TEST PHOTO SAVE ENDPOINT HIT ===');
      
      const testPhotoData = {
        salonId: 'a5562294-9026-46c6-9086-ef1518ad5b39', // Your salon ID
        url: 'https://test-cloudinary-url.com/test-image.jpg',
        publicId: 'test-public-id',
      };
      
      console.log('Test photo data:', testPhotoData);
      
      // Test schema validation first
      try {
        const validatedData = insertSalonPhotoSchema.parse(testPhotoData);
        console.log('Schema validation successful:', validatedData);
      } catch (schemaError) {
        console.error('Schema validation failed:', schemaError);
        return res.status(400).json({ error: 'Schema validation failed', details: schemaError.message });
      }
      
      const photo = await storage.createSalonPhoto(testPhotoData);
      console.log('Test photo saved successfully:', photo);
      
      // Verify it was saved by fetching it back
      const savedPhotos = await storage.getSalonPhotosBySalon('a5562294-9026-46c6-9086-ef1518ad5b39');
      console.log('Photos found for salon after test save:', savedPhotos.length);
      
      res.status(201).json({ success: true, photo, totalPhotos: savedPhotos.length });
    } catch (error) {
      console.error('Test photo save error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get salon photos
  app.get('/api/salons/:salonId/photos', async (req, res) => {
    try {
      console.log('=== GET PHOTOS ENDPOINT HIT ===', req.params.salonId);
      const photos = await storage.getSalonPhotosBySalon(req.params.salonId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Upload salon photo
  app.post('/api/salons/:salonId/photos', authenticateToken, upload.single('image'), async (req, res) => {
    try {
      console.log('=== PHOTO UPLOAD ENDPOINT HIT ===');
      console.log('Photo upload request received for salon:', req.params.salonId);
      console.log('File received:', !!req.file);
      console.log('User ID:', req.user?.userId);
      
      if (!req.file) {
        console.log('No file provided in request');
        return res.status(400).json({ message: 'No image file provided' });
      }

      // Verify salon ownership
      const salon = await storage.getSalon(req.params.salonId);
      console.log('Salon found:', !!salon);
      console.log('Salon owner ID:', salon?.ownerId);
      
      if (!salon || salon.ownerId !== req.user!.userId) {
        console.log('Authorization failed - salon owner mismatch');
        return res.status(403).json({ message: 'Not authorized to upload photos for this salon' });
      }

      console.log('Uploading to Cloudinary...');
      // Upload to Cloudinary
      const { url, publicId } = await uploadImageToCloudinary(req.file.buffer, 'salon_photos');
      console.log('Cloudinary upload successful:', { url, publicId });

      // Save to database
      console.log('Preparing photo data for database save...');
      
      // Create photo data without schema validation first to test
      const photoData = {
        salonId: req.params.salonId,
        url,
        publicId,
      };
      console.log('Photo data to save:', photoData);
      
      // Validate with schema
      try {
        const validatedData = insertSalonPhotoSchema.parse(photoData);
        console.log('Schema validation successful:', validatedData);
      } catch (schemaError) {
        console.error('Schema validation failed:', schemaError);
        throw new Error(`Schema validation failed: ${schemaError.message}`);
      }

      console.log('Calling storage.createSalonPhoto...');
      const photo = await storage.createSalonPhoto(photoData);
      console.log('Photo saved to database successfully:', photo);
      
      // Verify the photo was saved by fetching it back
      console.log('Verifying photo was saved...');
      const savedPhotos = await storage.getSalonPhotosBySalon(req.params.salonId);
      console.log('Photos found for salon after save:', savedPhotos.length);
      
      res.status(201).json(photo);
    } catch (error) {
      console.error('Photo upload error:', error);
      res.status(400).json({ message: 'Failed to upload photo', error: error.message });
    }
  });

  // Delete salon photo
  app.delete('/api/salons/:salonId/photos/:photoId', authenticateToken, async (req, res) => {
    try {
      const { salonId, photoId } = req.params;

      // Verify salon ownership
      const salon = await storage.getSalon(salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to delete photos for this salon' });
      }

      // Check if this is the last photo (must keep at least one)
      const photoCount = await storage.getSalonPhotoCount(salonId);
      if (photoCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last photo. At least one photo is required.' });
      }

      // Get photo details for Cloudinary deletion
      const photo = await storage.getSalonPhoto(photoId);
      if (!photo) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      // Delete from Cloudinary
      await deleteImageFromCloudinary(photo.publicId);

      // Delete from database
      const deleted = await storage.deleteSalonPhoto(photoId);
      if (!deleted) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
      console.error('Photo deletion error:', error);
      res.status(500).json({ message: 'Failed to delete photo', error });
    }
  });

  // OTP Verification Routes
  
  // Send email OTP
  app.post('/api/auth/send-email-otp', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const success = await otpService.sendEmailOTP(userId, user.email, user.name);
      
      if (success) {
        res.json({ message: 'Email OTP sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send email OTP' });
      }
    } catch (error) {
      console.error('Send email OTP error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Send phone OTP
  app.post('/api/auth/send-phone-otp', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.phone) {
        return res.status(404).json({ message: 'User not found or no phone number' });
      }

      const success = await otpService.sendPhoneOTP(userId, user.phone, user.name);
      
      if (success) {
        res.json({ message: 'SMS OTP sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send SMS OTP' });
      }
    } catch (error) {
      console.error('Send phone OTP error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Verify email OTP
  app.post('/api/auth/verify-email-otp', async (req, res) => {
    try {
      const { userId, otp } = req.body;
      
      if (!userId || !otp) {
        return res.status(400).json({ message: 'User ID and OTP are required' });
      }

      const success = await otpService.verifyEmailOTP(userId, otp);
      
      if (success) {
        res.json({ message: 'Email verified successfully' });
      } else {
        res.status(400).json({ message: 'Invalid or expired OTP' });
      }
    } catch (error) {
      console.error('Verify email OTP error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Verify phone OTP
  app.post('/api/auth/verify-phone-otp', async (req, res) => {
    try {
      const { userId, otp } = req.body;
      
      if (!userId || !otp) {
        return res.status(400).json({ message: 'User ID and OTP are required' });
      }

      const success = await otpService.verifyPhoneOTP(userId, otp);
      
      if (success) {
        res.json({ message: 'Phone verified successfully' });
      } else {
        res.status(400).json({ message: 'Invalid or expired OTP' });
      }
    } catch (error) {
      console.error('Verify phone OTP error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Resend email OTP
  app.post('/api/auth/resend-email-otp', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const success = await otpService.resendEmailOTP(userId);
      
      if (success) {
        res.json({ message: 'Email OTP resent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to resend email OTP' });
      }
    } catch (error) {
      console.error('Resend email OTP error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Resend phone OTP
  app.post('/api/auth/resend-phone-otp', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const success = await otpService.resendPhoneOTP(userId);
      
      if (success) {
        res.json({ message: 'SMS OTP resent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to resend SMS OTP' });
      }
    } catch (error) {
      console.error('Resend phone OTP error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // WhatsApp webhook verification
  app.get('/api/webhook/whatsapp', async (req, res) => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const whatsappService = await import('./whatsappService');
      const result = await whatsappService.default.verifyWebhook(mode as string, token as string, challenge as string);
      
      if (result) {
        res.status(200).send(result);
      } else {
        res.status(403).json({ message: 'Webhook verification failed' });
      }
    } catch (error) {
      console.error('WhatsApp webhook verification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // WhatsApp webhook handler
  app.post('/api/webhook/whatsapp', async (req, res) => {
    try {
      const whatsappService = await import('./whatsappService');
      await whatsappService.default.handleWebhook(req.body);
      res.status(200).json({ message: 'Webhook processed' });
    } catch (error) {
      console.error('WhatsApp webhook handler error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return httpServer;
}
