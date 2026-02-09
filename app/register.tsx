import React, { useState } from 'react';
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
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [role, setRole] = useState<'customer' | 'driver'>('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleType, setVehicleType] = useState('auto');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    if (!name.trim()) { Alert.alert('Missing Name', 'Please enter your name'); return; }
    if (!phone.trim() || phone.trim().length < 10) { Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number'); return; }
    if (!password.trim() || password.length < 6) { Alert.alert('Weak Password', 'Password must be at least 6 characters'); return; }
    if (role === 'driver') {
      if (!vehicleNumber.trim()) { Alert.alert('Missing Vehicle Number', 'Please enter your vehicle number'); return; }
      if (!licenseNumber.trim()) { Alert.alert('Missing License', 'Please enter your license number'); return; }
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSubmitting(true);
    const result = await register({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password,
      role,
      vehicleType: role === 'driver' ? vehicleType : undefined,
      vehicleNumber: role === 'driver' ? vehicleNumber.trim() : undefined,
      licenseNumber: role === 'driver' ? licenseNumber.trim() : undefined,
    });
    setSubmitting(false);
    if (result.success) {
      if (role === 'customer') {
        router.replace('/customer/home');
      } else {
        router.replace('/driver/dashboard');
      }
    } else {
      Alert.alert('Registration Failed', result.error || 'Please try again');
    }
  }

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + webTopInset + 16, paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join TransportGo today</Text>
        </View>

        <View style={styles.roleToggle}>
          <Pressable
            style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]}
            onPress={() => { setRole('customer'); if (Platform.OS !== 'web') Haptics.selectionAsync(); }}
          >
            <Ionicons name="person" size={16} color={role === 'customer' ? '#FFF' : Colors.textSecondary} />
            <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>Customer</Text>
          </Pressable>
          <Pressable
            style={[styles.roleButton, role === 'driver' && styles.roleButtonActive]}
            onPress={() => { setRole('driver'); if (Platform.OS !== 'web') Haptics.selectionAsync(); }}
          >
            <MaterialCommunityIcons name="steering" size={16} color={role === 'driver' ? '#FFF' : Colors.textSecondary} />
            <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>Driver</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <InputField icon="person-outline" placeholder="Full Name" value={name} onChangeText={setName} />
          <InputField icon="call-outline" placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
          <InputField icon="mail-outline" placeholder="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <InputField icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

          {role === 'driver' && (
            <>
              <Text style={styles.sectionTitle}>Vehicle Details</Text>
              <View style={styles.vehicleTypes}>
                {(['auto', 'tempo', 'truck'] as const).map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.vehicleChip, vehicleType === type && styles.vehicleChipActive]}
                    onPress={() => setVehicleType(type)}
                  >
                    <Text style={[styles.vehicleChipText, vehicleType === type && styles.vehicleChipTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <InputField icon="car-outline" placeholder="Vehicle Number (e.g., MP 09 AB 1234)" value={vehicleNumber} onChangeText={setVehicleNumber} autoCapitalize="characters" />
              <InputField icon="document-text-outline" placeholder="License Number" value={licenseNumber} onChangeText={setLicenseNumber} autoCapitalize="characters" />
            </>
          )}

          <Pressable
            onPress={handleRegister}
            disabled={submitting}
            style={({ pressed }) => [styles.submitButton, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          >
            <LinearGradient colors={[Colors.primary, '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Create Account</Text>}
            </LinearGradient>
          </Pressable>
        </View>

        <Pressable onPress={() => router.back()} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginHighlight}>Sign In</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({ icon, ...props }: { icon: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputContainer}>
      <Ionicons name={icon as any} size={20} color={Colors.textTertiary} style={styles.inputIcon} />
      <TextInput style={styles.input} placeholderTextColor={Colors.textTertiary} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 24 },
  header: { marginBottom: 24 },
  backButton: { width: 44, height: 44, justifyContent: 'center', marginLeft: -8, marginBottom: 8 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 4 },
  roleToggle: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 14, padding: 4,
    marginBottom: 20, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  roleButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 10, gap: 6,
  },
  roleButtonActive: { backgroundColor: Colors.primary },
  roleText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  roleTextActive: { color: '#FFF' },
  form: { gap: 12 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.cardBorder, paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 15, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text, marginTop: 8 },
  vehicleTypes: { flexDirection: 'row', gap: 10 },
  vehicleChip: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.cardBorder,
  },
  vehicleChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  vehicleChipText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  vehicleChipTextActive: { color: Colors.primary },
  submitButton: { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
  submitText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#FFF' },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  loginHighlight: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
});
