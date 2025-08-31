import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { api } from "../lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('smartq_token');
    const storedUser = localStorage.getItem('smartq_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('smartq_token');
        localStorage.removeItem('smartq_user');
      }
    }
    setIsInitialized(true);
  }, []);

  // Verify token with server when user is set
  const { isLoading: isVerifying, error } = useQuery({
    queryKey: ['/api/auth/profile'],
    queryFn: api.auth.getProfile,
    enabled: !!token && !!user && isInitialized,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Handle auth errors
  useEffect(() => {
    if (error) {
      // Token is invalid, clear auth state
      logout();
    }
  }, [error]);

  const login = (userData: User, authToken: string) => {
    console.log('Login called with:', { userData, authToken });
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('smartq_token', authToken);
    localStorage.setItem('smartq_user', JSON.stringify(userData));
    console.log('Token stored in localStorage:', localStorage.getItem('smartq_token'));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smartq_token');
    localStorage.removeItem('smartq_user');
  };

  // Note: Authorization headers are now handled in the apiRequest function
  // which reads the token from localStorage

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading: !isInitialized || isVerifying,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
