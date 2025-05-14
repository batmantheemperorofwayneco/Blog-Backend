import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed', error);
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Save token to local storage
      localStorage.setItem('accessToken', response.data.accessToken);
      
      // Set user data
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.response?.data.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/register', userData);
      
      // Save token to local storage
      localStorage.setItem('accessToken', response.data.accessToken);
      
      // Set user data
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      setError(error.response?.data.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    
    try {
      await api.post('/auth/logout');
      
      // Clear token from local storage
      localStorage.removeItem('accessToken');
      
      // Clear user data
      setUser(null);
      setIsAuthenticated(false);
    } catch (error: any) {
      console.error('Logout error', error);
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (profileData: Partial<User>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put('/users/profile', profileData);
      
      // Update user data
      setUser(prev => prev ? { ...prev, ...response.data.user } : null);
    } catch (error: any) {
      setError(error.response?.data.message || 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};