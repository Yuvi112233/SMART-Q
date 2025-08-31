import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["customer", "salon"] }).notNull().default("customer"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const salons = pgTable("salons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
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

export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  duration: integer("duration").notNull(), // in minutes
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const queues = pgTable("queues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["waiting", "in-progress", "completed", "no-show"] }).notNull().default("waiting"),
  position: integer("position").notNull(),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  estimatedWaitTime: integer("estimated_wait_time"), // in minutes
});

export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  discount: decimal("discount", { precision: 5, scale: 2 }).notNull(), // percentage
  validityPeriod: timestamp("validity_period").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  loyaltyPoints: true,
  createdAt: true,
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

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Types
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
export type Offer = typeof offers.$inferSelect;
export type Review = typeof reviews.$inferSelect;
