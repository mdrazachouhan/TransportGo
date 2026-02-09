import React, { useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings, Booking, BookingStatus } from '@/contexts/BookingContext';
import { VEHICLE_PRICING } from '@/lib/pricing';

const STATUS_STYLES: Record<BookingStatus, { label: string; bg: string; color: string }> = {
  pending: { label: 'Pending', bg: Colors.warningLight, color: '#92400E' },
  accepted: { label: 'Accepted', bg: Colors.primaryLight, color: Colors.primaryDark },
  in_progress: { label: 'In Progress', bg: '#D1FAE5', color: '#065F46' },
  completed: { label: 'Completed', bg: Colors.successLight, color: '#065F46' },
  cancelled: { label: 'Cancelled', bg: Colors.dangerLight, color: '#991B1B' },
};

export default function BookingHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getCustomerBookings, refreshBookings } = useBookings();

  useFocusEffect(useCallback(() => { refreshBookings(); }, []));

  const bookings = user ? getCustomerBookings(user.id).slice().reverse() : [];
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  function renderBooking({ item }: { item: Booking }) {
    const status = STATUS_STYLES[item.status];
    const vehicle = VEHICLE_PRICING[item.vehicleType];
    const date = new Date(item.createdAt);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.bookingId}>#{item.id.slice(-6).toUpperCase()}</Text>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
            <Text style={styles.routeText} numberOfLines={1}>{item.pickup.name}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
            <Text style={styles.routeText} numberOfLines={1}>{item.delivery.name}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name={vehicle?.icon as any || 'truck'} size={16} color={Colors.textSecondary} />
            <Text style={styles.footerText}>{vehicle?.name || item.vehicleType}</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.footerText}>{date.toLocaleDateString()}</Text>
          </View>
          <Text style={styles.footerPrice}>{'\u20B9'}{item.totalPrice}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Booking History</Text>
        <View style={{ width: 44 }} />
      </View>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) },
          bookings.length === 0 && { flex: 1 },
        ]}
        scrollEnabled={bookings.length > 0}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={56} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyText}>Your booking history will appear here</Text>
          </View>
        }
      />
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
  list: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bookingId: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  cardBody: { marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  routeText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text, flex: 1 },
  routeLine: { width: 1.5, height: 14, backgroundColor: Colors.border, marginLeft: 3.5, marginVertical: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  footerPrice: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.primary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
});
