import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location } from '@/lib/locations';
import { calculatePrice, calculateDistance, generateOTP } from '@/lib/pricing';

export type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicleNumber?: string;
  pickup: Location;
  delivery: Location;
  vehicleType: string;
  distance: number;
  basePrice: number;
  totalPrice: number;
  status: BookingStatus;
  otp?: string;
  createdAt: string;
  completedAt?: string;
}

interface BookingContextValue {
  bookings: Booking[];
  activeBooking: Booking | null;
  createBooking: (customerId: string, customerName: string, customerPhone: string, pickup: Location, delivery: Location, vehicleType: string) => Promise<Booking>;
  acceptBooking: (bookingId: string, driverId: string, driverName: string, driverPhone: string, driverVehicleNumber: string) => Promise<void>;
  startTrip: (bookingId: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  completeTrip: (bookingId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  getCustomerBookings: (customerId: string) => Booking[];
  getActiveCustomerBooking: (customerId: string) => Booking | null;
  getDriverRequests: (vehicleType: string) => Booking[];
  getActiveDriverBooking: (driverId: string) => Booking | null;
  refreshBookings: () => Promise<void>;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const raw = await AsyncStorage.getItem('bookings');
      if (raw) {
        setBookings(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Load bookings error:', e);
    }
  }

  async function saveBookings(updated: Booking[]) {
    setBookings(updated);
    await AsyncStorage.setItem('bookings', JSON.stringify(updated));
  }

  const createBooking = useCallback(async (
    customerId: string,
    customerName: string,
    customerPhone: string,
    pickup: Location,
    delivery: Location,
    vehicleType: string,
  ) => {
    const distance = calculateDistance(
      { lat: pickup.lat, lng: pickup.lng },
      { lat: delivery.lat, lng: delivery.lng },
    );
    const effectiveDistance = Math.max(distance, 2.5);
    const price = calculatePrice(vehicleType, effectiveDistance);
    const otp = generateOTP();
    const booking: Booking = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      customerId,
      customerName,
      customerPhone,
      pickup,
      delivery,
      vehicleType,
      distance: effectiveDistance,
      basePrice: price.basePrice,
      totalPrice: price.totalPrice,
      status: 'pending',
      otp,
      createdAt: new Date().toISOString(),
    };
    const raw = await AsyncStorage.getItem('bookings');
    const current: Booking[] = raw ? JSON.parse(raw) : [];
    current.push(booking);
    await saveBookings(current);
    return booking;
  }, []);

  const acceptBooking = useCallback(async (
    bookingId: string,
    driverId: string,
    driverName: string,
    driverPhone: string,
    driverVehicleNumber: string,
  ) => {
    const raw = await AsyncStorage.getItem('bookings');
    const current: Booking[] = raw ? JSON.parse(raw) : [];
    const idx = current.findIndex((b) => b.id === bookingId);
    if (idx >= 0) {
      current[idx] = {
        ...current[idx],
        driverId,
        driverName,
        driverPhone,
        driverVehicleNumber,
        status: 'accepted',
      };
      await saveBookings(current);
    }
  }, []);

  const startTrip = useCallback(async (bookingId: string, otp: string) => {
    const raw = await AsyncStorage.getItem('bookings');
    const current: Booking[] = raw ? JSON.parse(raw) : [];
    const idx = current.findIndex((b) => b.id === bookingId);
    if (idx < 0) return { success: false, error: 'Booking not found' };
    if (current[idx].otp !== otp) {
      return { success: false, error: 'Invalid OTP' };
    }
    current[idx] = { ...current[idx], status: 'in_progress' };
    await saveBookings(current);
    return { success: true };
  }, []);

  const completeTrip = useCallback(async (bookingId: string) => {
    const raw = await AsyncStorage.getItem('bookings');
    const current: Booking[] = raw ? JSON.parse(raw) : [];
    const idx = current.findIndex((b) => b.id === bookingId);
    if (idx >= 0) {
      current[idx] = {
        ...current[idx],
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
      await saveBookings(current);
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId: string) => {
    const raw = await AsyncStorage.getItem('bookings');
    const current: Booking[] = raw ? JSON.parse(raw) : [];
    const idx = current.findIndex((b) => b.id === bookingId);
    if (idx >= 0) {
      current[idx] = { ...current[idx], status: 'cancelled' };
      await saveBookings(current);
    }
  }, []);

  const getCustomerBookings = useCallback(
    (customerId: string) => bookings.filter((b) => b.customerId === customerId),
    [bookings],
  );

  const getActiveCustomerBooking = useCallback(
    (customerId: string) =>
      bookings.find(
        (b) => b.customerId === customerId && ['pending', 'accepted', 'in_progress'].includes(b.status),
      ) || null,
    [bookings],
  );

  const getDriverRequests = useCallback(
    (vehicleType: string) => bookings.filter((b) => b.status === 'pending' && b.vehicleType === vehicleType),
    [bookings],
  );

  const getActiveDriverBooking = useCallback(
    (driverId: string) =>
      bookings.find(
        (b) => b.driverId === driverId && ['accepted', 'in_progress'].includes(b.status),
      ) || null,
    [bookings],
  );

  const refreshBookings = useCallback(async () => {
    await loadBookings();
  }, []);

  const value = useMemo(
    () => ({
      bookings,
      activeBooking: null,
      createBooking,
      acceptBooking,
      startTrip,
      completeTrip,
      cancelBooking,
      getCustomerBookings,
      getActiveCustomerBooking,
      getDriverRequests,
      getActiveDriverBooking,
      refreshBookings,
    }),
    [bookings, createBooking, acceptBooking, startTrip, completeTrip, cancelBooking, getCustomerBookings, getActiveCustomerBooking, getDriverRequests, getActiveDriverBooking, refreshBookings],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
}
