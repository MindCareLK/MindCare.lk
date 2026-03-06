import { useState } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const ADMIN_EMAIL = 'admin@mindease.com';
const ADMIN_PASSWORD = 'Admin@123';

export default function LoginScreen() {
  const [imageFailed, setImageFailed] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const canSignIn = emailAddress.trim().length > 4 && password.trim().length >= 8;

  const handleBack = () => {
    void Haptics.selectionAsync();
    router.back();
  };

  const handleSignIn = () => {
    const isAdmin =
      emailAddress.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;
    if (!isAdmin) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Credentials', 'Use the admin email and password to log in.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/home');
  };

  const handleSocialPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCreateFree = () => {
    void Haptics.selectionAsync();
    router.replace('/');
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
    void Haptics.selectionAsync();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
            <Feather name="chevron-left" size={22} color="#2A323B" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>WELCOME BACK</Text>
          <View style={styles.topSpacer} />
        </View>

        <Image
          source={
            imageFailed
              ? require('@/assets/images/partial-react-logo.png')
              : {
                  uri: 'https://images.unsplash.com/photo-1508261303786-4f00f76d8f65?auto=format&fit=crop&w=1200&q=80',
                }
          }
          style={styles.heroImage}
          onError={() => setImageFailed(true)}
        />

        <Text style={styles.title}>Sign In to MindEase</Text>
        <Text style={styles.subtitle}>Continue your journey to a calmer mind and better wellness.</Text>

        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <View style={styles.inputWrap}>
          <Feather name="mail" size={16} color="#8A95A3" />
          <TextInput
            placeholder="name@example.com"
            placeholderTextColor="#8A95A3"
            style={styles.input}
            value={emailAddress}
            onChangeText={setEmailAddress}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
        </View>

        <View style={styles.passwordRow}>
          <Text style={styles.label}>PASSWORD</Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputWrap}>
          <Feather name="lock" size={16} color="#8A95A3" />
          <TextInput
            placeholder="********"
            placeholderTextColor="#4A5563"
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
          style={[styles.signInButton, !canSignIn && styles.signInButtonDisabled]}
          activeOpacity={0.9}
          onPress={handleSignIn}
          disabled={!canSignIn}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.dividerWrap}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.85} onPress={handleSocialPress}>
            <Feather name="chrome" size={16} color="#EA5A67" />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.85} onPress={handleSocialPress}>
            <Ionicons name="logo-apple" size={16} color="#2A323B" />
            <Text style={styles.socialText}>Apple</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Don&apos;t have an account?</Text>
          <TouchableOpacity onPress={handleCreateFree} activeOpacity={0.8}>
            <Text style={styles.createText}>Create one for free</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F3F5',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  topBar: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#2E3741',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  topSpacer: {
    width: 28,
  },
  heroImage: {
    width: '100%',
    height: 170,
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Inter',
    textAlign: 'center',
    fontSize: 42,
    lineHeight: 48,
    color: '#1D242E',
    fontWeight: '800',
  },
  subtitle: {
    fontFamily: 'Inter',
    marginTop: 6,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#7B8592',
    fontWeight: '600',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    color: '#5E6976',
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputWrap: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE1E8',
    backgroundColor: '#F6F7F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  input: {
    fontFamily: 'Inter',
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: '#2B3440',
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    fontFamily: 'Inter',
    color: '#2F88E8',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
  },
  signInButton: {
    marginTop: 4,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonDisabled: {
    opacity: 0.65,
  },
  signInText: {
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },
  dividerWrap: {
    marginTop: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D6DCE4',
  },
  dividerText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#8893A0',
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4DAE3',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F5F6F8',
  },
  socialText: {
    fontFamily: 'Inter',
    color: '#444D5A',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  bottomRow: {
    marginTop: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  bottomText: {
    fontFamily: 'Inter',
    color: '#677383',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  createText: {
    fontFamily: 'Inter',
    color: '#2F88E8',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
});
