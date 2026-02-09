import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserData {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  role: 'customer' | 'driver';
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  isOnline?: boolean;
  rating?: number;
  totalTrips?: number;
  totalEarnings?: number;
}

const DEMO_USERS: UserData[] = [
  {
    id: '1',
    name: 'Rahul Kumar',
    phone: '9876543210',
    email: 'customer@demo.com',
    password: 'password',
    role: 'customer',
  },
  {
    id: '2',
    name: 'Vijay Singh',
    phone: '9876543211',
    email: 'driver@demo.com',
    password: 'password',
    role: 'driver',
    vehicleType: 'auto',
    vehicleNumber: 'MP 09 AB 1234',
    licenseNumber: 'DL1234567890',
    isOnline: false,
    rating: 4.5,
    totalTrips: 0,
    totalEarnings: 0,
  },
];

interface AuthContextValue {
  user: UserData | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: Partial<UserData>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      const existingUsers = await AsyncStorage.getItem('users');
      if (!existingUsers) {
        await AsyncStorage.setItem('users', JSON.stringify(DEMO_USERS));
      }
      const currentUser = await AsyncStorage.getItem('currentUser');
      if (currentUser) {
        setUser(JSON.parse(currentUser));
      }
    } catch (e) {
      console.error('Auth init error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function login(phone: string, password: string, role: string) {
    try {
      const usersRaw = await AsyncStorage.getItem('users');
      const users: UserData[] = usersRaw ? JSON.parse(usersRaw) : [];
      const found = users.find((u) => u.phone === phone && u.password === password && u.role === role);
      if (!found) {
        return { success: false, error: 'Invalid credentials or role mismatch' };
      }
      await AsyncStorage.setItem('currentUser', JSON.stringify(found));
      setUser(found);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Login failed' };
    }
  }

  async function register(userData: Partial<UserData>) {
    try {
      const usersRaw = await AsyncStorage.getItem('users');
      const users: UserData[] = usersRaw ? JSON.parse(usersRaw) : [];
      const exists = users.find((u) => u.phone === userData.phone);
      if (exists) {
        return { success: false, error: 'Phone number already registered' };
      }
      const newUser: UserData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: userData.name || '',
        phone: userData.phone || '',
        email: userData.email || '',
        password: userData.password || '',
        role: userData.role || 'customer',
        vehicleType: userData.vehicleType,
        vehicleNumber: userData.vehicleNumber,
        licenseNumber: userData.licenseNumber,
        isOnline: false,
        rating: userData.role === 'driver' ? 4.0 : undefined,
        totalTrips: 0,
        totalEarnings: 0,
      };
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
      setUser(newUser);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Registration failed' };
    }
  }

  async function logout() {
    await AsyncStorage.removeItem('currentUser');
    setUser(null);
  }

  async function updateUser(updates: Partial<UserData>) {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem('currentUser', JSON.stringify(updated));
    const usersRaw = await AsyncStorage.getItem('users');
    const users: UserData[] = usersRaw ? JSON.parse(usersRaw) : [];
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = updated;
      await AsyncStorage.setItem('users', JSON.stringify(users));
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
