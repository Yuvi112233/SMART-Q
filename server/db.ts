import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartq';

// Connect to MongoDB
export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define schemas
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['customer', 'salon_owner', 'admin'], default: 'customer' },
  loyaltyPoints: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const salonSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  contactNumber: { type: String },
  openingHours: { type: String },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const serviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  salonId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const queueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  salonId: { type: String, required: true },
  userId: { type: String, required: true },
  serviceId: { type: String, required: true },
  position: { type: Number, required: true },
  status: { type: String, enum: ['waiting', 'in_progress', 'completed', 'cancelled'], default: 'waiting' },
  estimatedTime: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const offerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  salonId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  discount: { type: Number, required: true },
  validUntil: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  salonId: { type: String, required: true },
  userId: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Create models
export const UserModel = mongoose.model('User', userSchema);
export const SalonModel = mongoose.model('Salon', salonSchema);
export const ServiceModel = mongoose.model('Service', serviceSchema);
export const QueueModel = mongoose.model('Queue', queueSchema);
export const OfferModel = mongoose.model('Offer', offerSchema);
export const ReviewModel = mongoose.model('Review', reviewSchema);