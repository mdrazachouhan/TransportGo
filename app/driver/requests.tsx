import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings, Booking } from '@/contexts/BookingContext';
import { VEHICLE_PRICING, calculatePrice } from '@/lib/pricing';

export default function RideRequestsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getDriverRequests, acceptBooking, refreshBookings } = useBookings();
  const [timer, setTimer] = useState(60);
  const [currentRequest, setCurrentRequest] = useState<Booking | null>(null);
  const timerWidth = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      refreshBookings();
    }, []),
  );

  const requests = user ? getDriverRequests(user.vehicleType || 'auto') : [];

  useEffect(() => {
    if (requests.length > 0 && !currentRequest) {
      setCurrentRequest(requests[0]);
      setTimer(60);
      timerWidth.value = 1;
      timerWidth.value = withTiming(0, { duration: 60000, easing: Easing.linear });
    }
  }, [requests.length]);

  useEffect(() => {
    if (!currentRequest) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentRequest?.id]);

  const timerBarStyle = useAnimatedStyle(() => ({
    width: `${timerWidth.value * 100}%` as any,
  }));

  async function handleAccept() {
    if (!currentRequest || !user) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await acceptBooking(
      currentRequest.id,
      user.id,
      user.name,
      user.phone,
      user.vehicleNumber || 'N/A',
    );
    router.replace('/driver/active-ride');
  }

  function handleReject() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCurrentRequest(null);
    if (requests.length <= 1) {
      router.back();
    } else {
      const next = requests.find(r => r.id !== currentRequest?.id);
      if (next) {
        setCurrentRequest(next);
        setTimer(60);
        timerWidth.value = 1;
        timerWidth.value = withTiming(0, { duration: 60000, easing: Easing.linear });
      } else {
        router.back();
      }
    }
  }

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  if (!currentRequest) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={56} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Requests</Text>
          <Text style={styles.emptyText}>Check back shortly</Text>
          <Pressable onPress={() => router.back()} style={styles.goBackButton}>
            <Text style={styles.goBackText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const vehicle = VEHICLE_PRICING[currentRequest.vehicleType];
  const pricing = calculatePrice(currentRequest.vehicleType, currentRequest.distance);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.warning, '#EA580C']}
        style={[styles.headerGradient, { paddingTop: insets.top + webTopInset + 12 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>New Ride Request</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.timerSection}>
          <Text style={styles.timerValue}>{timer}</Text>
          <Text style={styles.timerLabel}>seconds remaining</Text>
          <View style={styles.timerBarBg}>
            <Animated.View style={[styles.timerBarFill, timerBarStyle]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) + 100 }]}
      >
        <View style={styles.customerCard}>
          <View style={styles.customerAvatar}>
            <Ionicons name="person" size={24} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.customerName}>{currentRequest.customerName}</Text>
            <Text style={styles.customerPhone}>{currentRequest.customerPhone}</Text>
          </View>
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeName}>{currentRequest.pickup.name}</Text>
              <Text style={styles.routeArea}>{currentRequest.pickup.area}</Text>
            </View>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Delivery</Text>
              <Text style={styles.routeName}>{currentRequest.delivery.name}</Text>
              <Text style={styles.routeArea}>{currentRequest.delivery.area}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="navigate-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{currentRequest.distance} km</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name={vehicle?.icon as any || 'truck'} size={18} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{vehicle?.name || currentRequest.vehicleType}</Text>
          </View>
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Your Earnings</Text>
          <Text style={styles.earningsAmount}>{'\u20B9'}{pricing.totalPrice}</Text>
          <View style={styles.earningsBreakdown}>
            <Text style={styles.earningsDetail}>
              Base: {'\u20B9'}{pricing.basePrice} + Distance: {'\u20B9'}{pricing.distanceCharge}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) }]}>
        <View style={styles.footerButtons}>
          <Pressable
            style={({ pressed }) => [styles.rejectButton, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={handleReject}
          >
            <Ionicons name="close" size={24} color={Colors.danger} />
            <Text style={styles.rejectText}>Reject</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.acceptButton, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={handleAccept}
          >
            <LinearGradient colors={[Colors.success, Colors.accentDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.acceptGradient}>
              <Ionicons name="checkmark" size={24} color="#FFF" />
              <Text style={styles.acceptText}>Accept</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  goBackButton: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 12 },
  goBackText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBackBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
  timerSection: { alignItems: 'center', marginTop: 16 },
  timerValue: { fontSize: 48, fontFamily: 'Inter_700Bold', color: '#FFF' },
  timerLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  timerBarBg: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginTop: 14, overflow: 'hidden' },
  timerBarFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 3 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  customerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  customerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  customerPhone: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  routeCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.cardBorder },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  routeLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textTertiary },
  routeName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginTop: 2 },
  routeArea: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 1 },
  routeDivider: { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 5, marginVertical: 6 },
  detailsRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  detailItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  detailText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  earningsCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 20, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.success,
  },
  earningsLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  earningsAmount: { fontSize: 36, fontFamily: 'Inter_700Bold', color: Colors.success, marginTop: 4 },
  earningsBreakdown: { marginTop: 8 },
  earningsDetail: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center' },
  footer: {
    position: 'absolute' as const, bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.cardBorder,
  },
  footerButtons: { flexDirection: 'row', gap: 12 },
  rejectButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.dangerLight, borderRadius: 16, paddingVertical: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  rejectText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.danger },
  acceptButton: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  acceptGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  acceptText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFF' },
});
