import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useBookings } from '@/contexts/BookingContext';
import { VEHICLE_PRICING } from '@/lib/pricing';

export default function ActiveRideScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const { getActiveDriverBooking, startTrip, completeTrip, refreshBookings } = useBookings();
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  useFocusEffect(
    useCallback(() => {
      refreshBookings();
      const interval = setInterval(refreshBookings, 3000);
      return () => clearInterval(interval);
    }, []),
  );

  const booking = user ? getActiveDriverBooking(user.id) : null;
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  if (!booking) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerBarTitle}>Active Ride</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="truck-outline" size={56} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Active Ride</Text>
          <Text style={styles.emptyText}>Accept a ride request to get started</Text>
        </View>
      </View>
    );
  }

  const vehicle = VEHICLE_PRICING[booking.vehicleType];
  const isAccepted = booking.status === 'accepted';
  const isInProgress = booking.status === 'in_progress';

  async function handleStartTrip() {
    if (otpInput.length !== 4) {
      setOtpError('Enter 4-digit OTP');
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await startTrip(booking!.id, otpInput);
    if (!result.success) {
      setOtpError(result.error || 'Invalid OTP');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      setOtpError('');
      setOtpInput('');
      await refreshBookings();
    }
  }

  async function handleCompleteTrip() {
    Alert.alert(
      'Complete Trip',
      'Are you sure you want to mark this trip as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await completeTrip(booking!.id);
            if (user) {
              await updateUser({
                totalTrips: (user.totalTrips || 0) + 1,
                totalEarnings: (user.totalEarnings || 0) + booking!.totalPrice,
              });
            }
            router.replace('/driver/dashboard');
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isInProgress ? [Colors.accent, Colors.accentDark] : [Colors.primary, '#4F46E5']}
        style={[styles.statusHeader, { paddingTop: insets.top + webTopInset + 12 }]}
      >
        <View style={styles.statusHeaderRow}>
          <Pressable onPress={() => router.back()} style={styles.statusBackBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
          <Text style={styles.statusHeaderTitle}>
            {isAccepted ? 'Navigate to Pickup' : 'Trip in Progress'}
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.customerCard}>
          <View style={styles.customerAvatar}>
            <Ionicons name="person" size={24} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{booking.customerName}</Text>
            <Text style={styles.customerPhone}>{booking.customerPhone}</Text>
          </View>
          <View style={styles.callBtn}>
            <Ionicons name="call" size={20} color={Colors.success} />
          </View>
        </View>

        <View style={styles.targetCard}>
          <View style={styles.targetHeader}>
            <Ionicons name="flag" size={18} color={isAccepted ? Colors.success : Colors.danger} />
            <Text style={styles.targetLabel}>
              {isAccepted ? 'Pickup Location' : 'Delivery Location'}
            </Text>
          </View>
          <Text style={styles.targetName}>
            {isAccepted ? booking.pickup.name : booking.delivery.name}
          </Text>
          <Text style={styles.targetArea}>
            {isAccepted ? booking.pickup.area : booking.delivery.area}
          </Text>
        </View>

        <View style={styles.tripDetailsCard}>
          <Text style={styles.tripDetailsTitle}>Trip Details</Text>
          <View style={styles.tripDetailRow}>
            <View style={styles.tripDetailItem}>
              <MaterialCommunityIcons name={vehicle?.icon as any || 'truck'} size={20} color={Colors.textSecondary} />
              <Text style={styles.tripDetailText}>{vehicle?.name || booking.vehicleType}</Text>
            </View>
            <View style={styles.tripDetailItem}>
              <Ionicons name="navigate-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.tripDetailText}>{booking.distance} km</Text>
            </View>
            <View style={styles.tripDetailItem}>
              <Text style={styles.tripPrice}>{'\u20B9'}{booking.totalPrice}</Text>
            </View>
          </View>
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeText}>{booking.pickup.name}</Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Delivery</Text>
              <Text style={styles.routeText}>{booking.delivery.name}</Text>
            </View>
          </View>
        </View>

        {isAccepted && (
          <View style={styles.otpSection}>
            <Text style={styles.otpTitle}>Enter Customer OTP</Text>
            <Text style={styles.otpSubtitle}>Ask the customer for their 4-digit OTP to start the trip</Text>
            <TextInput
              style={[styles.otpInput, otpError ? styles.otpInputError : null]}
              placeholder="Enter 4-digit OTP"
              placeholderTextColor={Colors.textTertiary}
              value={otpInput}
              onChangeText={(t) => { setOtpInput(t.replace(/[^0-9]/g, '')); setOtpError(''); }}
              keyboardType="number-pad"
              maxLength={4}
              textAlign="center"
            />
            {!!otpError && <Text style={styles.otpErrorText}>{otpError}</Text>}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) }]}>
        {isAccepted && (
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={handleStartTrip}
          >
            <LinearGradient colors={[Colors.success, Colors.accentDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionGradient}>
              <Ionicons name="play" size={22} color="#FFF" />
              <Text style={styles.actionText}>Start Trip</Text>
            </LinearGradient>
          </Pressable>
        )}
        {isInProgress && (
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            onPress={handleCompleteTrip}
          >
            <LinearGradient colors={[Colors.primary, '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionGradient}>
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
              <Text style={styles.actionText}>Complete Trip</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerBarTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  statusHeader: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  statusHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBackBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  statusHeaderTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  customerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  customerAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  customerName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  customerPhone: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.successLight, justifyContent: 'center', alignItems: 'center' },
  targetCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  targetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  targetLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  targetName: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  targetArea: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  tripDetailsCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  tripDetailsTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginBottom: 12 },
  tripDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tripDetailText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  tripPrice: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.primary },
  routeCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textTertiary },
  routeText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text, marginTop: 2 },
  routeLine: { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 5, marginVertical: 4 },
  otpSection: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 20, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  otpTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  otpSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  otpInput: {
    width: 180, fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text,
    backgroundColor: Colors.background, borderRadius: 14, paddingVertical: 14, marginTop: 16,
    borderWidth: 2, borderColor: Colors.cardBorder, letterSpacing: 12,
  },
  otpInputError: { borderColor: Colors.danger },
  otpErrorText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.danger, marginTop: 8 },
  footer: {
    position: 'absolute' as const, bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.cardBorder,
  },
  actionButton: { borderRadius: 16, overflow: 'hidden' },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  actionText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#FFF' },
});
