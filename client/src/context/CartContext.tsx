import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { SalonDetails } from '../types';

interface CartItem {
  service: SalonDetails['services'][0];
  salonId: string;
  salonName: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (service: SalonDetails['services'][0], salonId: string, salonName: string) => void;
  removeItem: (serviceId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (service: SalonDetails['services'][0], salonId: string, salonName: string) => {
    setItems(prev => {
      // Check if service already exists
      const exists = prev.find(item => item.service.id === service.id);
      if (exists) {
        return prev; // Don't add duplicates
      }
      return [...prev, { service, salonId, salonName }];
    });
  };

  const removeItem = (serviceId: string) => {
    setItems(prev => prev.filter(item => item.service.id !== serviceId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.service.price, 0);
  };

  const getItemCount = () => {
    return items.length;
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      clearCart,
      getTotalPrice,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
