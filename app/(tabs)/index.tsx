import { useState } from 'react';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const [selectedRole, setSelectedRole] = useState<'patient' | 'counselor'>('patient');
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [counselorName, setCounselorName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isPatientFormValid =
    fullName.trim().length > 1 && emailAddress.trim().length > 4 && password.trim().length >= 8;
  const isCounselorFormValid =
    counselorName.trim().length > 1 && licenseNumber.trim().length > 3 && password.trim().length >= 8;
  const canSubmit = selectedRole === 'patient' ? isPatientFormValid : isCounselorFormValid;

  const handleRoleSelect = (role: 'patient' | 'counselor') => {
    setSelectedRole(role);
    void Haptics.selectionAsync();
  };

  const handleSignUp = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
    void Haptics.selectionAsync();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.appMark}>
          <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join MindEase and start your journey to wellness.</Text>

        <Text style={styles.sectionLabel}>I WANT TO JOIN AS A...</Text>

        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.optionCard, selectedRole === 'patient' && styles.optionCardActive]}
            activeOpacity={0.9}
            onPress={() => handleRoleSelect('patient')}>
            <View style={styles.optionTopRow}>
              <View style={[styles.optionIconWrap, selectedRole === 'patient' && styles.optionIconWrapActive]}>
                <Feather name="heart" size={18} color={selectedRole === 'patient' ? '#FFFFFF' : '#2F88E8'} />
              </View>
            </View>
            {selectedRole === 'patient' && (
              <Ionicons style={styles.selectedBadge} name="checkmark-circle-outline" size={18} color="#2F88E8" />
            )}
            <Text style={styles.optionTitle}>Patient</Text>
            <Text style={styles.optionSubtitle}>Seeking support & wellness</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, selectedRole === 'counselor' && styles.optionCardActive]}
            activeOpacity={0.9}
            onPress={() => handleRoleSelect('counselor')}>
            <View style={styles.optionTopRow}>
              <View style={[styles.optionIconWrap, selectedRole === 'counselor' && styles.optionIconWrapActive]}>
                <MaterialCommunityIcons
                  name="stethoscope"
                  size={18}
                  color={selectedRole === 'counselor' ? '#FFFFFF' : '#2F88E8'}
                />
              </View>
            </View>
            {selectedRole === 'counselor' && (
              <Ionicons style={styles.selectedBadge} name="checkmark-circle-outline" size={18} color="#2F88E8" />
            )}
            <Text style={styles.optionTitle}>Counselor</Text>
            <Text style={styles.optionSubtitle}>Providing expert care</Text>
          </TouchableOpacity>
        </View>

        {selectedRole === 'patient' ? (
          <>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={16} color="#8A95A3" />
              <TextInput
                placeholder="John Doe"
                placeholderTextColor="#B0B7C3"
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={16} color="#8A95A3" />
              <TextInput
                placeholder="name@example.com"
                placeholderTextColor="#B0B7C3"
                style={styles.input}
                value={emailAddress}
                onChangeText={setEmailAddress}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.inputLabel}>Counselor Name</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={16} color="#8A95A3" />
              <TextInput
                placeholder="Dr. Jane Doe"
                placeholderTextColor="#B0B7C3"
                style={styles.input}
                value={counselorName}
                onChangeText={setCounselorName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.inputLabel}>License Number</Text>
            <View style={styles.inputWrap}>
              <Feather name="file-text" size={16} color="#8A95A3" />
              <TextInput
                placeholder="LIC-000123"
                placeholderTextColor="#B0B7C3"
                style={styles.input}
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </>
        )}

        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputWrap}>
          <Feather name="lock" size={16} color="#8A95A3" />
          <TextInput
            placeholder="Min. 8 characters"
            placeholderTextColor="#B0B7C3"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={togglePasswordVisibility} activeOpacity={0.8}>
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color="#8A95A3" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.signUpButton, !canSubmit && styles.signUpButtonDisabled]}
          activeOpacity={0.88}
          disabled={!canSubmit}
          onPress={handleSignUp}>
          <Text style={styles.signUpText}>Sign Up</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.signInRow}>
          <Text style={styles.signInText}>Already have an account?</Text>
          <Link href="/login" style={styles.signInLink}>
            Sign In
          </Link>
        </View>

        <Text style={styles.legalText}>
          By signing up, you agree to our Terms of Service and Privacy Policy. We ensure your data is
          encrypted and secure.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E9EDF2',
  },
  page: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  appMark: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#121A24',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '800',
    color: '#1A232D',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    color: '#6D7885',
    fontWeight: '500',
    marginBottom: 26,
  },
  sectionLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    letterSpacing: 1.2,
    color: '#7D8693',
    fontWeight: '700',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  optionCard: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#EEF1F5',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 112,
  },
  optionCardActive: {
    backgroundColor: '#F5FAFF',
    borderColor: '#2F88E8',
    shadowColor: '#2F88E8',
    shadowOpacity: 0.16,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  optionTopRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#E8EDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconWrapActive: {
    backgroundColor: '#2F88E8',
  },
  optionTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 24,
    color: '#2A323B',
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  optionSubtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 16,
    color: '#7F8997',
    fontWeight: '500',
    textAlign: 'center',
  },
  inputLabel: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 20,
    color: '#535E6D',
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 6,
  },
  inputWrap: {
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    height: 54,
    borderWidth: 1,
    borderColor: '#E7E9EF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  input: {
    fontFamily: 'Inter',
    flex: 1,
    color: '#2D3743',
    fontSize: 15,
    lineHeight: 20,
  },
  signUpButton: {
    marginTop: 12,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#2F88E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.65,
  },
  signUpText: {
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  signInText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#6C7786',
    fontWeight: '600',
  },
  signInRow: {
    marginTop: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  signInLink: {
    fontFamily: 'Inter',
    color: '#2F88E8',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
  },
  legalText: {
    fontFamily: 'Inter',
    marginTop: 18,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 15,
    color: '#9AA2AE',
    paddingHorizontal: 12,
  },
});
