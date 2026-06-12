import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { router } from 'expo-router';

export default function AdminSettingsScreen() {
  const [selfRegEnabled, setSelfRegEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [adminEmail, setAdminEmail] = useState(auth?.currentUser?.email || 'admin@mindcare.lk');
  const [password, setPassword] = useState('');

  const handleSignOut = async () => {
    try {
      if (auth) await signOut(auth);
      router.replace('/admin-login' as any);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to sign out');
    }
  };

  const handleSaveAccount = () => {
    Alert.alert('Account Settings', 'Account credentials updated successfully (mock).');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ADMIN: SYSTEM CONFIGURATIONS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Settings Grid */}
        <View style={styles.gridContainer}>
          
          {/* Account Profile Card */}
          <View style={styles.settingCard}>
            <View style={styles.cardHeader}>
              <Feather name="user" size={18} color="#3B82F6" />
              <Text style={styles.cardTitle}>Admin Credentials</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput 
                style={styles.input} 
                value={adminEmail} 
                onChangeText={setAdminEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>New Password</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Leave blank to keep current"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAccount}>
              <Text style={styles.saveBtnText}>Update Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Platform Settings */}
          <View style={styles.settingCard}>
            <View style={styles.cardHeader}>
              <Feather name="sliders" size={18} color="#10B981" />
              <Text style={styles.cardTitle}>Platform Configurations</Text>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Patient Self-Registration</Text>
                <Text style={styles.switchSubLabel}>Allow new patients to register themselves on the mobile application.</Text>
              </View>
              <Switch 
                value={selfRegEnabled} 
                onValueChange={setSelfRegEnabled}
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={selfRegEnabled ? '#3B82F6' : '#94A3B8'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Maintenance Mode</Text>
                <Text style={styles.switchSubLabel}>Lock the consumer applications and show a temporary maintenance notice.</Text>
              </View>
              <Switch 
                value={maintenanceMode} 
                onValueChange={setMaintenanceMode}
                trackColor={{ false: '#CBD5E1', true: '#FECACA' }}
                thumbColor={maintenanceMode ? '#EF4444' : '#94A3B8'}
              />
            </View>
          </View>

          {/* System Status Indicators */}
          <View style={styles.settingCard}>
            <View style={styles.cardHeader}>
              <Feather name="activity" size={18} color="#F59E0B" />
              <Text style={styles.cardTitle}>System Health Status</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Firebase Authentication</Text>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: auth ? '#10B981' : '#EF4444' }]} />
                <Text style={styles.statusText}>{auth ? 'Online' : 'Offline'}</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Firestore Database Service</Text>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: db ? '#10B981' : '#EF4444' }]} />
                <Text style={styles.statusText}>{db ? 'Connected' : 'Disconnected'}</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Blogger Sync Channel</Text>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: process.env.EXPO_PUBLIC_BLOGGER_API_KEY ? '#10B981' : '#EF4444' }]} />
                <Text style={styles.statusText}>{process.env.EXPO_PUBLIC_BLOGGER_API_KEY ? 'Active' : 'Missing API Key'}</Text>
              </View>
            </View>
          </View>

          {/* Session controls */}
          <View style={[styles.settingCard, { borderColor: '#FECACA' }]}>
            <View style={styles.cardHeader}>
              <Feather name="log-out" size={18} color="#EF4444" />
              <Text style={styles.cardTitle}>Administrative Session</Text>
            </View>
            <Text style={styles.sessionDescription}>
              Sign out from the admin console session. To log back in, you will need the designated admin account.
            </Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
              <Text style={styles.logoutBtnText}>Log Out Console</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 MindEase Mental Health Solutions. All rights reserved.</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 24,
  },
  gridContainer: {
    gap: 24,
    marginBottom: 32,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  switchSubLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  statusLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  sessionDescription: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 24,
  },
  footerText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
