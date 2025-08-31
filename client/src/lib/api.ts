import { apiRequest } from "./queryClient";
import type { InsertUser, InsertSalon, InsertService, InsertQueue, InsertOffer, InsertReview, Login } from "@shared/schema";
import type { AuthResponse, Analytics } from "../types";

export const api = {
  auth: {
    login: async (credentials: Login): Promise<AuthResponse> => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    
    register: async (userData: InsertUser): Promise<AuthResponse> => {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      return response.json();
    },
    
    getProfile: async () => {
      const response = await apiRequest('GET', '/api/auth/profile');
      return response.json();
    },
  },

  salons: {
    getAll: async (location?: string) => {
      const url = location ? `/api/salons?location=${encodeURIComponent(location)}` : '/api/salons';
      const response = await apiRequest('GET', url);
      return response.json();
    },
    
    getById: async (id: string) => {
      const response = await apiRequest('GET', `/api/salons/${id}`);
      return response.json();
    },
    
    create: async (salonData: InsertSalon) => {
      const response = await apiRequest('POST', '/api/salons', salonData);
      return response.json();
    },
    
    update: async (id: string, updates: Partial<InsertSalon>) => {
      const response = await apiRequest('PUT', `/api/salons/${id}`, updates);
      return response.json();
    },
    
    getQueues: async (salonId: string) => {
      const response = await apiRequest('GET', `/api/salons/${salonId}/queues`);
      return response.json();
    },
    
    getAnalytics: async (salonId: string): Promise<Analytics> => {
      const response = await apiRequest('GET', `/api/analytics/${salonId}`);
      return response.json();
    },
  },

  services: {
    getBySalon: async (salonId: string) => {
      const response = await apiRequest('GET', `/api/salons/${salonId}/services`);
      return response.json();
    },
    
    create: async (serviceData: InsertService) => {
      const response = await apiRequest('POST', '/api/services', serviceData);
      return response.json();
    },
  },

  queue: {
    getMy: async () => {
      const response = await apiRequest('GET', '/api/queues/my');
      return response.json();
    },
    
    join: async (queueData: InsertQueue) => {
      const response = await apiRequest('POST', '/api/queues', queueData);
      return response.json();
    },
    
    update: async (id: string, updates: Partial<InsertQueue>) => {
      const response = await apiRequest('PUT', `/api/queues/${id}`, updates);
      return response.json();
    },
    
    leave: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/queues/${id}`);
      return response.json();
    },
  },

  offers: {
    getActive: async () => {
      const response = await apiRequest('GET', '/api/offers');
      return response.json();
    },
    
    create: async (offerData: InsertOffer) => {
      const response = await apiRequest('POST', '/api/offers', offerData);
      return response.json();
    },
  },

  reviews: {
    create: async (reviewData: InsertReview) => {
      const response = await apiRequest('POST', '/api/reviews', reviewData);
      return response.json();
    },
  },
};
