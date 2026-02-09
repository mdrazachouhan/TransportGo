import React, { useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { MapView, Marker } from '@/components/MapWrapper';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings, BookingStatus } from '@/contexts/BookingContext';
import { VEHICLE_PRICING } from '@/lib/pricing';

const INDORE_REGION = {
  latitude: 22.7196,
  longitude: 75.8577,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Looking for Driver', color: Colors.warning, bg: Colors.warningLight, icon: 'time-outline' },
  accepted: { label: 'Driver Assigned', color: Colors.primary, bg: Colors.primaryLight, icon: 'checkmark-circle-outline' },
  in_progress: { label: 'Trip in Progress', color: Colors.accent, bg: '#D1FAE5', icon: 'navigate-outline' },
  completed: { label: 'Completed', color: Colors.success, bg: Colors.successLight, icon: 'checkmark-done-outline' },
  cancelled: { label: 'Cancelled', color: Colors.danger, bg: Colors.dangerLight, icon: 'close-circle-outline' },
};

function AnimatedOtpDigit({ digit, index }: { digit: string; index: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 150, withSpring(1, { damping: 12, stiffness: 200 }));
    opacity.value = withDelay(index * 150, withTiming(1, { duration: 300 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.otpDigitBox, animStyle]}>
      <Text style={styles.otpDigitText}>{digit}</Text>
    </Animated.View>
  );
}

function PulsingStatusBadge({ status }: { status: { label: string; color: string; bg: string; icon: string }; isPending: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.statusBadge, { backgroundColor: status.bg }, animStyle]}>
      <Ionicons name={status.icon as any} size={16} color={status.color} />
      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
    </Animated.View>
  );
}

function StaticStatusBadge({ status }: { status: { label: string; color: string; bg: string; icon: string } }) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
      <Ionicons name={status.icon as any} size={16} color={status.color} />
      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
    </View>
  );
}

function FadeInCard({ children, delay, style }: { children: React.ReactNode; delay: number; style?: any }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

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

export default function TrackRideScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getActiveCustomerBooking, refreshBookings, cancelBooking } = useBookings();

  useFocusEffect(
    useCallback(() => {
      refreshBookings();
      const interval = setInterval(refreshBookings, 3000);
      return () => clearInterval(interval);
    }, []),
  );

  const booking = user ? getActiveCustomerBooking(user.id) : null;
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  if (!booking) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Track Ride</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Active Ride</Text>
          <Text style={styles.emptyText}>Book a new ride to get started</Text>
        </View>
      </View>
    );
  }

  const status = STATUS_CONFIG[booking.status];
  const vehicle = VEHICLE_PRICING[booking.vehicleType];

  const mapRegion = {
    latitude: (booking.pickup.lat + booking.delivery.lat) / 2,
    longitude: (booking.pickup.lng + booking.delivery.lng) / 2,
    latitudeDelta: Math.abs(booking.pickup.lat - booking.delivery.lat) * 2 + 0.02,
    longitudeDelta: Math.abs(booking.pickup.lng - booking.delivery.lng) * 2 + 0.02,
  };

  return (
    <View style={styles.container}>
      <View style={[styles.mapArea, { paddingTop: insets.top + webTopInset + 8 }]}>
        {Platform.OS !== 'web' ? (
          <MapView
            style={StyleSheet.absoluteFillObject}
            initialRegion={mapRegion}
          >
            <Marker
              coordinate={{ latitude: booking.pickup.lat, longitude: booking.pickup.lng }}
              title={booking.pickup.name}
              description="Pickup"
              pinColor="green"
            />
            <Marker
              coordinate={{ latitude: booking.delivery.lat, longitude: booking.delivery.lng }}
              title={booking.delivery.name}
              description="Delivery"
              pinColor="red"
            />
          </MapView>
        ) : (
          <LinearGradient
            colors={[Colors.navyDark, Colors.navyMid]}
            style={StyleSheet.absoluteFillObject}
          >
            <View style={styles.mapContent}>
              <MaterialCommunityIcons name="map-marker-path" size={56} color="rgba(255,255,255,0.2)" />
            </View>
          </LinearGradient>
        )}
        <View style={styles.mapHeader}>
          <Pressable onPress={() => router.back()} style={styles.mapBackButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
          {booking.status === 'pending' ? (
            <PulsingStatusBadge status={status} isPending={true} />
          ) : (
            <StaticStatusBadge status={status} />
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.details, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) }]}
      >
        {booking.status === 'in_progress' && booking.otp && (
          <FadeInCard delay={0}>
            <View style={styles.otpCard}>
              <Text style={styles.otpLabel}>Share OTP with Driver</Text>
              <View style={styles.otpDigits}>
                {booking.otp.split('').map((d, i) => (
                  <AnimatedOtpDigit key={i} digit={d} index={i} />
                ))}
              </View>
            </View>
          </FadeInCard>
        )}

        {booking.driverName && (
          <FadeInCard delay={100}>
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{booking.driverName}</Text>
                <Text style={styles.driverInfo}>{booking.driverVehicleNumber}</Text>
              </View>
              <View style={styles.callButton}>
                <Ionicons name="call" size={20} color={Colors.success} />
              </View>
            </View>
          </FadeInCard>
        )}

        <FadeInCard delay={200}>
          <View style={styles.tripCard}>
            <View style={styles.tripRow}>
              <View style={[styles.tripDot, { backgroundColor: Colors.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tripLabel}>Pickup</Text>
                <Text style={styles.tripLocation}>{booking.pickup.name}</Text>
              </View>
            </View>
            <View style={styles.tripLine} />
            <View style={styles.tripRow}>
              <View style={[styles.tripDot, { backgroundColor: Colors.danger }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tripLabel}>Delivery</Text>
                <Text style={styles.tripLocation}>{booking.delivery.name}</Text>
              </View>
            </View>
          </View>
        </FadeInCard>

        <FadeInCard delay={300}>
          <View style={styles.fareCard}>
            <View style={styles.fareRow}>
              <View style={styles.fareItem}>
                <MaterialCommunityIcons name={vehicle?.icon as any || 'truck'} size={22} color={Colors.textSecondary} />
                <Text style={styles.fareItemText}>{vehicle?.name || booking.vehicleType}</Text>
              </View>
              <View style={styles.fareItem}>
                <Ionicons name="navigate-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.fareItemText}>{booking.distance} km</Text>
              </View>
              <View style={styles.fareItem}>
                <Text style={styles.farePrice}>{'\u20B9'}{booking.totalPrice}</Text>
              </View>
            </View>
          </View>
        </FadeInCard>

        {booking.status === 'pending' && (
          <FadeInCard delay={400}>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.9 }]}
              onPress={() => {
                cancelBooking(booking.id);
                router.back();
              }}
            >
              <Text style={styles.cancelText}>Cancel Booking</Text>
            </Pressable>
          </FadeInCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  mapArea: { height: 260, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  mapHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, zIndex: 10,
  },
  mapBackButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  statusText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  mapContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  details: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  otpCard: {
    backgroundColor: Colors.warningLight, borderRadius: 16, padding: 20, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FDE68A',
  },
  otpLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginBottom: 12 },
  otpDigits: { flexDirection: 'row', gap: 10 },
  otpDigitBox: {
    width: 52, height: 60, borderRadius: 14, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.warning,
  },
  otpDigitText: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  driverAvatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  driverName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  driverInfo: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  callButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.successLight,
    justifyContent: 'center', alignItems: 'center',
  },
  tripCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tripDot: { width: 12, height: 12, borderRadius: 6 },
  tripLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textTertiary },
  tripLocation: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text, marginTop: 2 },
  tripLine: { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 5, marginVertical: 4 },
  fareCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fareItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fareItemText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  farePrice: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.primary },
  cancelButton: {
    backgroundColor: Colors.dangerLight, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#FECACA',
  },
  cancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.danger },
});
