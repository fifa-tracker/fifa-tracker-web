'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login, register, User, getCurrentUser } from './api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  signIn: (identifier: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string, username?: string) => Promise<boolean>;
  signOut: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('fifa-tracker-user');
      const savedToken = localStorage.getItem('fifa-tracker-token');
      
      if (savedUser && savedToken) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setAccessToken(savedToken);
          
          // Fetch fresh user data from backend
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            localStorage.setItem('fifa-tracker-user', JSON.stringify(currentUser));
          }
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          localStorage.removeItem('fifa-tracker-user');
          localStorage.removeItem('fifa-tracker-token');
          localStorage.removeItem('fifa-tracker-refresh-token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (identifier: string, password: string): Promise<boolean> => {
    try {
      const user = await login(identifier, password);
      if (!user) {
        return false;
      }
      
      // Get the access token from the response or localStorage
      const token = user.access_token || localStorage.getItem('fifa-tracker-token');
      
      // Store refresh token if provided
      const userWithRefreshToken = user as User & { refresh_token?: string };
      if (userWithRefreshToken.refresh_token) {
        localStorage.setItem('fifa-tracker-refresh-token', userWithRefreshToken.refresh_token);
      }
      
      // Fetch complete user profile from backend
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('fifa-tracker-user', JSON.stringify(currentUser));
      } else {
        // Fallback to login response data if getCurrentUser fails
        const userData: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
        };
        setUser(userData);
        localStorage.setItem('fifa-tracker-user', JSON.stringify(userData));
      }
      
      setAccessToken(token);
      if (token) {
        localStorage.setItem('fifa-tracker-token', token);
      }
      return true;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    }
  };

  const signUp = async (name: string, email: string, password: string, username?: string): Promise<boolean> => {
    try {
      // Call the real registration API
      const user = await register(name, email, password, username);
      if (!user) {
        return false;
      }
      
      // Get the access token from the response or localStorage
      const token = user.access_token || localStorage.getItem('fifa-tracker-token');
      
      // Store refresh token if provided
      const userWithRefreshToken = user as User & { refresh_token?: string };
      if (userWithRefreshToken.refresh_token) {
        localStorage.setItem('fifa-tracker-refresh-token', userWithRefreshToken.refresh_token);
      }
      
      // Fetch complete user profile from backend
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('fifa-tracker-user', JSON.stringify(currentUser));
      } else {
        // Fallback to registration response data if getCurrentUser fails
        const userData: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
        };
        setUser(userData);
        localStorage.setItem('fifa-tracker-user', JSON.stringify(userData));
      }
      
      setAccessToken(token);
      if (token) {
        localStorage.setItem('fifa-tracker-token', token);
      }
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    }
  };

  const signOut = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('fifa-tracker-user');
    localStorage.removeItem('fifa-tracker-token');
    localStorage.removeItem('fifa-tracker-refresh-token');
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('fifa-tracker-user', JSON.stringify(userData));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    accessToken,
    signIn,
    signUp,
    signOut,
    updateUser,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 