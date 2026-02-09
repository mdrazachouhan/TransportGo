import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';

export default function DriverDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const { getDriverRequests, getActiveDriverBooking, refreshBookings, bookings } = useBookings();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const pulseScale = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      refreshBookings();
      const interval = setInterval(refreshBookings, 3000);
      return () => clearInterval(interval);
    }, []),
  );

  const pendingRequests = user ? getDriverRequests(user.vehicleType || 'auto') : [];
  const activeRide = user ? getActiveDriverBooking(user.id) : null;
  const completedTrips = user ? bookings.filter(b => b.driverId === user.id && b.status === 'completed') : [];
  const todayEarnings = completedTrips
    .filter(b => {
      if (!b.completedAt) return false;
      const d = new Date(b.completedAt);
      const t = new Date();
      return d.toDateString() === t.toDateString();
    })
    .reduce((sum, b) => sum + b.totalPrice, 0);

  React.useEffect(() => {
    if (pendingRequests.length > 0 && isOnline) {
      pulseScale.value = withRepeat(withSequence(withTiming(1.05, { duration: 600 }), withTiming(1, { duration: 600 })), -1, true);
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [pendingRequests.length, isOnline]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  async function toggleOnline() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    if (user) {
      await updateUser({ isOnline: newStatus });
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.navyDark, Colors.navyMid]}
        style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.driverName}>{user?.name || 'Driver'}</Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>

        <Pressable
          onPress={toggleOnline}
          style={({ pressed }) => [styles.onlineToggle, pressed && { opacity: 0.9 }]}
        >
          <LinearGradient
            colors={isOnline ? [Colors.success, Colors.accentDark] : ['#6B7280', '#4B5563']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.onlineGradient}
          >
            <View style={styles.onlineIndicator}>
              {isOnline && <View style={styles.onlineDot} />}
              {!isOnline && <View style={styles.offlineDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.onlineTitle}>{isOnline ? 'Online' : 'Offline'}</Text>
              <Text style={styles.onlineSubtitle}>
                {isOnline ? 'Receiving ride requests' : 'Tap to go online'}
              </Text>
            </View>
            <Ionicons name="power" size={24} color="#FFF" />
          </LinearGradient>
        </Pressable>
      </LinearGradient>

      <View style={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) }]}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{'\u20B9'}{todayEarnings}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedTrips.length}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={16} color={Colors.warning} />
              <Text style={styles.statValue}>{user?.rating?.toFixed(1) || '4.5'}</Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.mapPlaceholder}>
          <MaterialCommunityIcons name="map-marker-radius-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.mapText}>Indore, India</Text>
        </View>

        {isOnline && pendingRequests.length > 0 && (
          <Animated.View style={pulseStyle}>
            <Pressable
              style={({ pressed }) => [styles.requestButton, pressed && { opacity: 0.9 }]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                router.push('/driver/requests');
              }}
            >
              <LinearGradient
                colors={[Colors.warning, '#EA580C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.requestGradient}
              >
                <Ionicons name="notifications" size={24} color="#FFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestTitle}>
                    {pendingRequests.length} New Request{pendingRequests.length > 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.requestSub}>Tap to view details</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {activeRide && (
          <Pressable
            style={({ pressed }) => [styles.activeRideButton, pressed && { opacity: 0.9 }]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/driver/active-ride');
            }}
          >
            <LinearGradient
              colors={[Colors.primary, '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activeRideGradient}
            >
              <MaterialCommunityIcons name="truck-fast-outline" size={24} color="#FFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeRideTitle}>Active Ride</Text>
                <Text style={styles.activeRideSub}>
                  {activeRide.status === 'accepted' ? 'Navigate to pickup' : 'Trip in progress'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </Pressable>
        )}

        {isOnline && pendingRequests.length === 0 && !activeRide && (
          <View style={styles.waitingCard}>
            <Ionicons name="hourglass-outline" size={32} color={Colors.textTertiary} />
            <Text style={styles.waitingText}>Waiting for requests...</Text>
            <Text style={styles.waitingSub}>New ride requests will appear here</Text>
          </View>
        )}

        {!isOnline && !activeRide && (
          <View style={styles.waitingCard}>
            <Ionicons name="moon-outline" size={32} color={Colors.textTertiary} />
            <Text style={styles.waitingText}>You're Offline</Text>
            <Text style={styles.waitingSub}>Go online to start receiving requests</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
  driverName: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#FFF', marginTop: 2 },
  logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  onlineToggle: { borderRadius: 16, overflow: 'hidden' },
  onlineGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, gap: 14 },
  onlineIndicator: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFF' },
  offlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.4)' },
  onlineTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#FFF' },
  onlineSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder,
  },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  mapPlaceholder: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 30, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1, borderColor: Colors.cardBorder,
  },
  mapText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textTertiary, marginTop: 8 },
  requestButton: { borderRadius: 16, overflow: 'hidden' },
  requestGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, gap: 14 },
  requestTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFF' },
  requestSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  activeRideButton: { borderRadius: 16, overflow: 'hidden' },
  activeRideGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, gap: 14 },
  activeRideTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFF' },
  activeRideSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  waitingCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder, gap: 8,
  },
  waitingText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  waitingSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
});
