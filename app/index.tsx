import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
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
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, loading, isAuthenticated, user } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'driver'>('customer');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(20);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(20);
  const demoOpacity = useSharedValue(0);
  const demoTranslateY = useSharedValue(20);
  const truckX = useSharedValue(-60);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    logoTranslateY.value = withDelay(100, withTiming(0, { duration: 600 }));
    formOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(300, withTiming(0, { duration: 600 }));
    demoOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    demoTranslateY.value = withDelay(500, withTiming(0, { duration: 600 }));
    truckX.value = withRepeat(
      withTiming(400, { duration: 8000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const formAnimStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const demoAnimStyle = useAnimatedStyle(() => ({
    opacity: demoOpacity.value,
    transform: [{ translateY: demoTranslateY.value }],
  }));

  const truckAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: truckX.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'customer') {
        router.replace('/customer/home');
      } else {
        router.replace('/driver/dashboard');
      }
    }
  }, [loading, isAuthenticated, user]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) return null;

  async function handleLogin() {
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Missing Password', 'Please enter your password');
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitting(true);
    const result = await login(phone.trim(), password, role);
    setSubmitting(false);
    if (!result.success) {
      Alert.alert('Login Failed', result.error || 'Please check your credentials');
    }
  }

  function handleButtonPressIn() {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  }

  function handleButtonPressOut() {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + webTopInset + 40,
            paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[styles.floatingTruck, truckAnimStyle]} pointerEvents="none">
          <MaterialCommunityIcons name="truck-fast-outline" size={32} color="rgba(27,110,243,0.06)" />
        </Animated.View>

        <Animated.View style={[styles.logoSection, logoAnimStyle]}>
          <LinearGradient
            colors={[Colors.primary, Colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          >
            <MaterialCommunityIcons name="truck-fast-outline" size={40} color="#FFF" />
          </LinearGradient>
          <Text style={styles.appName}>TransportGo</Text>
          <Text style={styles.tagline}>Fast & Reliable Logistics</Text>
        </Animated.View>

        <Animated.View style={formAnimStyle}>
          <View style={styles.roleToggle}>
            <Pressable
              style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]}
              onPress={() => { setRole('customer'); if (Platform.OS !== 'web') Haptics.selectionAsync(); }}
            >
              <Ionicons name="person" size={18} color={role === 'customer' ? '#FFF' : Colors.textSecondary} />
              <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>Customer</Text>
            </Pressable>
            <Pressable
              style={[styles.roleButton, role === 'driver' && styles.roleButtonActive]}
              onPress={() => { setRole('driver'); if (Platform.OS !== 'web') Haptics.selectionAsync(); }}
            >
              <MaterialCommunityIcons name="steering" size={18} color={role === 'driver' ? '#FFF' : Colors.textSecondary} />
              <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>Driver</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={Colors.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textTertiary} />
              </Pressable>
            </View>

            <AnimatedPressable
              onPress={handleLogin}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              disabled={submitting}
              style={[styles.loginButton, buttonAnimStyle]}
            >
              <LinearGradient
                colors={[Colors.primary, '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.loginText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </AnimatedPressable>
          </View>

          <Pressable onPress={() => router.push('/register')} style={styles.registerLink}>
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerHighlight}>Sign Up</Text>
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.demoCard, demoAnimStyle]}>
          <View style={styles.demoHeader}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.demoTitle}>Demo Credentials</Text>
          </View>
          <View style={styles.demoRow}>
            <Text style={styles.demoLabel}>Customer:</Text>
            <Text style={styles.demoValue}>9876543210 / password</Text>
          </View>
          <View style={styles.demoRow}>
            <Text style={styles.demoLabel}>Driver:</Text>
            <Text style={styles.demoValue}>9876543211 / password</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  floatingTruck: { position: 'absolute', top: 120, left: 0, zIndex: 0 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  appName: { fontSize: 32, fontFamily: 'Inter_700Bold', color: Colors.text, letterSpacing: -0.5 },
  tagline: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 4 },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  roleButtonActive: { backgroundColor: Colors.primary },
  roleText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  roleTextActive: { color: '#FFF' },
  form: { gap: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.text },
  eyeButton: { padding: 8 },
  loginButton: { marginTop: 4, borderRadius: 16, overflow: 'hidden' },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  loginText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#FFF' },
  registerLink: { alignItems: 'center', marginTop: 20 },
  registerText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  registerHighlight: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  demoCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#D0E0FC',
  },
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  demoTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  demoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  demoLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text, width: 80 },
  demoValue: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
});
