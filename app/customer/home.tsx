import React, { useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { MapView, Marker } from '@/components/MapWrapper';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { MOCK_LOCATIONS } from '@/lib/locations';

const INDORE_REGION = {
  latitude: 22.7196,
  longitude: 75.8577,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

function PulsingDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.activeDot, animStyle]} />;
}

function AnimatedCard({ children, delay, style }: { children: React.ReactNode; delay: number; style?: any }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 500 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

export default function CustomerHomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { getActiveCustomerBooking, refreshBookings } = useBookings();

  useFocusEffect(
    useCallback(() => {
      refreshBookings();
    }, []),
  );

  const activeBooking = user ? getActiveCustomerBooking(user.id) : null;
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.navyDark, Colors.navyMid, Colors.primary]}
        style={[styles.heroSection, { paddingTop: insets.top + webTopInset + 16 }]}
      >
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>

        <View style={styles.heroMap}>
          {Platform.OS !== 'web' ? (
            <MapView
              style={styles.mapView}
              initialRegion={INDORE_REGION}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              {MOCK_LOCATIONS.map((loc) => (
                <Marker
                  key={loc.id}
                  coordinate={{ latitude: loc.lat, longitude: loc.lng }}
                  title={loc.name}
                  description={loc.area}
                />
              ))}
            </MapView>
          ) : (
            <LinearGradient colors={[Colors.navyDark, Colors.navyMid]} style={styles.mapView}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.heroMapText}>Indore, India</Text>
            </LinearGradient>
          )}
        </View>
      </LinearGradient>

      <View style={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) }]}>
        {activeBooking && (
          <AnimatedCard delay={0}>
            <Pressable
              style={styles.activeBanner}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/customer/track-ride');
              }}
            >
              <LinearGradient
                colors={[Colors.accent, Colors.accentDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activeBannerGradient}
              >
                <View style={styles.activeBannerContent}>
                  <View style={styles.activeBannerLeft}>
                    <PulsingDot />
                    <View>
                      <Text style={styles.activeBannerTitle}>Active Booking</Text>
                      <Text style={styles.activeBannerStatus}>
                        {activeBooking.status === 'pending' ? 'Looking for driver...' :
                          activeBooking.status === 'accepted' ? 'Driver on the way' : 'Trip in progress'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFF" />
                </View>
              </LinearGradient>
            </Pressable>
          </AnimatedCard>
        )}

        <AnimatedCard delay={100}>
          <Pressable
            style={({ pressed }) => [styles.bookButton, pressed && { transform: [{ scale: 0.98 }] }]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/customer/new-booking');
            }}
          >
            <LinearGradient
              colors={[Colors.primary, '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookButtonGradient}
            >
              <MaterialCommunityIcons name="truck-fast-outline" size={28} color="#FFF" />
              <View>
                <Text style={styles.bookButtonTitle}>Book a Ride</Text>
                <Text style={styles.bookButtonSub}>Send packages anywhere in the city</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={32} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </Pressable>
        </AnimatedCard>

        <AnimatedCard delay={250} style={styles.quickActions}>
          <Pressable
            style={[styles.actionCard, { flex: 1 }]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/customer/history');
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.warningLight }]}>
              <Ionicons name="time-outline" size={22} color={Colors.warning} />
            </View>
            <Text style={styles.actionTitle}>History</Text>
            <Text style={styles.actionSub}>Past bookings</Text>
          </Pressable>

          <Pressable
            style={[styles.actionCard, { flex: 1 }]}
            onPress={() => {
              if (activeBooking) {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/customer/track-ride');
              }
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.successLight }]}>
              <Ionicons name="navigate-outline" size={22} color={Colors.success} />
            </View>
            <Text style={styles.actionTitle}>Track</Text>
            <Text style={styles.actionSub}>{activeBooking ? 'Live tracking' : 'No active ride'}</Text>
          </Pressable>
        </AnimatedCard>

        <AnimatedCard delay={400}>
          <View style={styles.infoCard}>
            <Feather name="shield" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Safe & Secure</Text>
              <Text style={styles.infoText}>All trips are verified with OTP for safe delivery</Text>
            </View>
          </View>
        </AnimatedCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heroSection: { paddingHorizontal: 24, paddingBottom: 0, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 15, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#FFF', marginTop: 2 },
  logoutButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  heroMap: { marginTop: 16, borderRadius: 16, overflow: 'hidden', height: 150, marginBottom: 24 },
  mapView: { flex: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  heroMapText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.5)', marginTop: 8 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  activeBanner: { borderRadius: 16, overflow: 'hidden' },
  activeBannerGradient: { padding: 16 },
  activeBannerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFF' },
  activeBannerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFF' },
  activeBannerStatus: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  bookButton: { borderRadius: 20, overflow: 'hidden' },
  bookButtonGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20, gap: 14 },
  bookButtonTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#FFF', flex: 1 },
  bookButtonSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)', flex: 1, marginTop: 2 },
  quickActions: { flexDirection: 'row', gap: 14 },
  actionCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  actionSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.primaryLight, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#D0E0FC',
  },
  infoTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  infoText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
});
