import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { MapView, Marker } from '@/components/MapWrapper';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { MOCK_LOCATIONS, Location } from '@/lib/locations';
import { VEHICLE_PRICING, calculatePrice, calculateDistance } from '@/lib/pricing';

const INDORE_REGION = {
  latitude: 22.7196,
  longitude: 75.8577,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedVehicleCard({
  vehicleKey,
  vehicle,
  isActive,
  onPress,
}: {
  vehicleKey: string;
  vehicle: any;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    onPress();
  }

  return (
    <AnimatedPressable
      style={[styles.vehicleCard, isActive && styles.vehicleCardActive, animStyle]}
      onPress={handlePress}
    >
      <View style={[styles.vehicleIconBg, isActive && styles.vehicleIconBgActive]}>
        <MaterialCommunityIcons
          name={vehicle.icon as any}
          size={28}
          color={isActive ? Colors.primary : Colors.textSecondary}
        />
      </View>
      <Text style={[styles.vehicleName, isActive && styles.vehicleNameActive]}>{vehicle.name}</Text>
      <Text style={styles.vehicleCapacity}>{vehicle.capacity}</Text>
      <Text style={styles.vehiclePrice}>
        {'\u20B9'}{vehicle.base} + {'\u20B9'}{vehicle.perKm}/km
      </Text>
    </AnimatedPressable>
  );
}

function AnimatedPriceBreakdown({
  pricing,
  distance,
}: {
  pricing: { basePrice: number; distanceCharge?: number; totalPrice: number };
  distance: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withTiming(0, { duration: 400 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.priceCard, animStyle]}>
      <Text style={styles.priceTitle}>Price Breakdown</Text>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Base fare</Text>
        <Text style={styles.priceValue}>{'\u20B9'}{pricing.basePrice}</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Distance ({distance} km)</Text>
        <Text style={styles.priceValue}>{'\u20B9'}{pricing.distanceCharge}</Text>
      </View>
      <View style={styles.priceDivider} />
      <View style={styles.priceRow}>
        <Text style={styles.priceTotalLabel}>Total</Text>
        <Text style={styles.priceTotalValue}>{'\u20B9'}{pricing.totalPrice}</Text>
      </View>
    </Animated.View>
  );
}

export default function NewBookingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const [pickup, setPickup] = useState<Location | null>(null);
  const [delivery, setDelivery] = useState<Location | null>(null);
  const [vehicleType, setVehicleType] = useState('auto');
  const [showPickupList, setShowPickupList] = useState(false);
  const [showDeliveryList, setShowDeliveryList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const distance = useMemo(() => {
    if (!pickup || !delivery) return 0;
    const d = calculateDistance({ lat: pickup.lat, lng: pickup.lng }, { lat: delivery.lat, lng: delivery.lng });
    return Math.max(d, 2.5);
  }, [pickup, delivery]);

  const pricing = useMemo(() => calculatePrice(vehicleType, distance), [vehicleType, distance]);

  const mapRegion = useMemo(() => {
    if (pickup && delivery) {
      const midLat = (pickup.lat + delivery.lat) / 2;
      const midLng = (pickup.lng + delivery.lng) / 2;
      const latDelta = Math.abs(pickup.lat - delivery.lat) * 2 + 0.02;
      const lngDelta = Math.abs(pickup.lng - delivery.lng) * 2 + 0.02;
      return { latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta };
    }
    if (pickup) {
      return { latitude: pickup.lat, longitude: pickup.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 };
    }
    if (delivery) {
      return { latitude: delivery.lat, longitude: delivery.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 };
    }
    return INDORE_REGION;
  }, [pickup, delivery]);

  async function handleConfirm() {
    if (!pickup || !delivery) {
      Alert.alert('Select Locations', 'Please select both pickup and delivery locations');
      return;
    }
    if (pickup.id === delivery.id) {
      Alert.alert('Same Location', 'Pickup and delivery must be different');
      return;
    }
    if (!user) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      await createBooking(user.id, user.name, user.phone, pickup, delivery, vehicleType);
      router.replace('/customer/track-ride');
    } catch (e) {
      Alert.alert('Error', 'Failed to create booking');
    }
    setSubmitting(false);
  }

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>New Booking</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.mapContainer}>
        {Platform.OS !== 'web' ? (
          <MapView
            style={styles.map}
            initialRegion={INDORE_REGION}
            region={mapRegion}
          >
            {pickup && (
              <Marker
                coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
                title={pickup.name}
                description="Pickup"
                pinColor="green"
              />
            )}
            {delivery && (
              <Marker
                coordinate={{ latitude: delivery.lat, longitude: delivery.lng }}
                title={delivery.name}
                description="Delivery"
                pinColor="red"
              />
            )}
          </MapView>
        ) : (
          <LinearGradient colors={[Colors.navyDark, Colors.navyMid]} style={styles.map}>
            <MaterialCommunityIcons name="map-marker-radius-outline" size={48} color="rgba(255,255,255,0.3)" />
          </LinearGradient>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) + 90 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.locationSection}>
          <View style={styles.locationTimeline}>
            <View style={[styles.timelineDot, { backgroundColor: Colors.success }]} />
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, { backgroundColor: Colors.danger }]} />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <LocationSelector
              label="Pickup Location"
              selected={pickup}
              isOpen={showPickupList}
              onToggle={() => { setShowPickupList(!showPickupList); setShowDeliveryList(false); }}
              onSelect={(loc) => { setPickup(loc); setShowPickupList(false); }}
              exclude={delivery?.id}
            />
            <LocationSelector
              label="Delivery Location"
              selected={delivery}
              isOpen={showDeliveryList}
              onToggle={() => { setShowDeliveryList(!showDeliveryList); setShowPickupList(false); }}
              onSelect={(loc) => { setDelivery(loc); setShowDeliveryList(false); }}
              exclude={pickup?.id}
            />
          </View>
        </View>

        {pickup && delivery && (
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-outline" size={16} color={Colors.primary} />
            <Text style={styles.distanceText}>{distance} km</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Select Vehicle</Text>
        <View style={styles.vehicleCards}>
          {Object.entries(VEHICLE_PRICING).map(([key, v]) => (
            <AnimatedVehicleCard
              key={key}
              vehicleKey={key}
              vehicle={v}
              isActive={vehicleType === key}
              onPress={() => {
                setVehicleType(key);
                if (Platform.OS !== 'web') Haptics.selectionAsync();
              }}
            />
          ))}
        </View>

        {pickup && delivery && (
          <AnimatedPriceBreakdown
            key={`${pickup.id}-${delivery.id}-${vehicleType}`}
            pricing={pricing}
            distance={distance}
          />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) }]}>
        <Pressable
          onPress={handleConfirm}
          disabled={submitting || !pickup || !delivery}
          style={({ pressed }) => [
            styles.confirmButton,
            (!pickup || !delivery) && styles.confirmButtonDisabled,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient
            colors={!pickup || !delivery ? ['#9CA3AF', '#9CA3AF'] : [Colors.primary, '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmGradient}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.confirmText}>Confirm Booking</Text>
                {pickup && delivery && (
                  <Text style={styles.confirmPrice}>{'\u20B9'}{pricing.totalPrice}</Text>
                )}
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function LocationSelector({
  label,
  selected,
  isOpen,
  onToggle,
  onSelect,
  exclude,
}: {
  label: string;
  selected: Location | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (loc: Location) => void;
  exclude?: string;
}) {
  return (
    <View>
      <Pressable style={styles.locationButton} onPress={onToggle}>
        <View style={{ flex: 1 }}>
          <Text style={styles.locationLabel}>{label}</Text>
          <Text style={styles.locationValue} numberOfLines={1}>
            {selected ? selected.name : 'Select location'}
          </Text>
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textTertiary} />
      </Pressable>
      {isOpen && (
        <View style={styles.locationList}>
          {MOCK_LOCATIONS.filter((l) => l.id !== exclude).map((loc) => (
            <Pressable
              key={loc.id}
              style={[styles.locationItem, selected?.id === loc.id && styles.locationItemActive]}
              onPress={() => onSelect(loc)}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={selected?.id === loc.id ? Colors.primary : Colors.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.locationItemName, selected?.id === loc.id && { color: Colors.primary }]}>
                  {loc.name}
                </Text>
                <Text style={styles.locationItemArea}>{loc.area}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
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
  mapContainer: { height: 160, overflow: 'hidden' },
  map: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  locationSection: { flexDirection: 'row', gap: 14 },
  locationTimeline: { alignItems: 'center', paddingTop: 20, width: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4 },
  locationButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: Colors.cardBorder,
  },
  locationLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textTertiary, marginBottom: 4 },
  locationValue: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text },
  locationList: {
    backgroundColor: Colors.surface, borderRadius: 12, marginTop: 4,
    borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden',
  },
  locationItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  locationItemActive: { backgroundColor: Colors.primaryLight },
  locationItemName: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text },
  locationItemArea: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, marginTop: 1 },
  distanceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: Colors.primaryLight, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginTop: 16,
  },
  distanceText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginTop: 24, marginBottom: 12 },
  vehicleCards: { flexDirection: 'row', gap: 10 },
  vehicleCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 14,
    borderWidth: 2, borderColor: Colors.cardBorder, alignItems: 'center',
  },
  vehicleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  vehicleIconBg: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  vehicleIconBgActive: { backgroundColor: '#FFF' },
  vehicleName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  vehicleNameActive: { color: Colors.primary },
  vehicleCapacity: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, marginTop: 2, textAlign: 'center' as const },
  vehiclePrice: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginTop: 6 },
  priceCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginTop: 20,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  priceTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginBottom: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  priceValue: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text },
  priceDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: 8 },
  priceTotalLabel: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text },
  priceTotalValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.primary },
  footer: {
    position: 'absolute' as const, bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.cardBorder,
  },
  confirmButton: { borderRadius: 16, overflow: 'hidden' },
  confirmButtonDisabled: { opacity: 0.7 },
  confirmGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 10,
  },
  confirmText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#FFF' },
  confirmPrice: { fontSize: 17, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.85)' },
});
