import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ---------------- USERS ----------------
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  favoriteSalons: jsonb("favorite_salons").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// ---------------- SALONS ----------------
export const salons = pgTable("salons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  type: text("type", { enum: ["men", "women", "unisex"] }).notNull().default("unisex"),
  operatingHours: jsonb("operating_hours").$type<{
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  }>(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  images: jsonb("images").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// ---------------- SERVICES ----------------
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  duration: integer("duration").notNull(), // in minutes
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// ---------------- QUEUES ----------------
export const queues = pgTable("queues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceIds: jsonb("service_ids").$type<string[]>().notNull(), // Multiple services
  totalPrice: integer("total_price").notNull(), // Total price for all services
  appliedOffers: jsonb("applied_offers").$type<string[]>().default([]), // Applied offer IDs
  status: text("status", { enum: ["waiting", "in-progress", "completed", "no-show"] }).notNull().default("waiting"),
  position: integer("position").notNull(),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  estimatedWaitTime: integer("estimated_wait_time"), // in minutes
});

// ---------------- OFFERS ----------------
// Commented out Drizzle schema since app uses MongoDB
// export const offers = pgTable("offers", {
//   id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//   salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
//   title: text("title").notNull(),
//   description: text("description").notNull(),
//   discount: integer("discount").notNull(), // ✅ fixed: integer not decimal
//   validityPeriod: timestamp("validity_period").notNull(),
//   isActive: boolean("is_active").notNull().default(true),
//   createdAt: timestamp("created_at").notNull().default(sql`now()`),
// });

// ---------------- REVIEWS ----------------
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// ---------------- INSERT SCHEMAS ----------------
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  loyaltyPoints: true,
  createdAt: true,
}).extend({
  phone: z.union([z.string().min(10).max(15), z.literal('')]).optional().nullable(),
  role: z.enum(["customer", "salon_owner"]).default("customer"),
});

export const insertSalonSchema = createInsertSchema(salons).omit({
  id: true,
  rating: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertQueueSchema = createInsertSchema(queues).omit({
  id: true,
  position: true,
  timestamp: true,
});

// Pure Zod schema for offers (MongoDB compatible)
export const insertOfferSchema = z.object({
  salonId: z.string().min(1, "Salon ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  discount: z.number().min(1, "Discount must be at least 1"),
  validityPeriod: z.union([
    z.string().datetime().transform((str) => new Date(str)), // Handle ISO datetime strings
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform((str) => new Date(str)), // Handle YYYY-MM-DD format
    z.date()
  ]),
  isActive: z.boolean().default(true),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// ---------------- LOGIN ----------------
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ---------------- TYPES ----------------
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSalon = z.infer<typeof insertSalonSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertQueue = z.infer<typeof insertQueueSchema>;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Login = z.infer<typeof loginSchema>;

export type User = typeof users.$inferSelect;
export type Salon = typeof salons.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Queue = typeof queues.$inferSelect;
// MongoDB-compatible Offer type
export type Offer = {
  id: string;
  salonId: string;
  title: string;
  description: string;
  discount: number;
  validityPeriod: Date;
  isActive: boolean;
  createdAt: Date;
};
export type Review = typeof reviews.$inferSelect;

// ---------------- SALON PHOTOS ----------------
export const salonPhotos = pgTable("salon_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  url: varchar("url").notNull(),
  publicId: varchar("public_id").notNull(), // Cloudinary public_id for deletion
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertSalonPhotoSchema = createInsertSchema(salonPhotos).omit({
  id: true,
  createdAt: true,
});

export type InsertSalonPhoto = z.infer<typeof insertSalonPhotoSchema>;
export type SalonPhoto = typeof salonPhotos.$inferSelect;
