import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAllMembers, getAllCounselors, getAllAppointments } from '@/lib/admin';

export default function AdminDashboardScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    patients: 0,
    counselors: 0,
    appointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [recentCounselors, setRecentCounselors] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [members, counselors, appointments] = await Promise.all([
        getAllMembers().catch(() => []),
        getAllCounselors().catch(() => []),
        getAllAppointments().catch(() => []),
      ]);

      setStats({
        patients: members.length,
        counselors: counselors.length,
        appointments: appointments.length,
      });

      // Get recent 5 appointments
      const sortedAppointments = [...appointments]
        .sort((a: any, b: any) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime())
        .slice(0, 5);
      
      // Resolve patient & counselor names for preview
      const resolvedAppointments = sortedAppointments.map((app: any) => {
        const patient = members.find((m: any) => m.uid === app.patientId);
        const counselor = counselors.find((c: any) => c.uid === app.counselorUid || c.displayName === app.counselorId);
        return {
          ...app,
          patientName: patient?.name || patient?.displayName || 'Unknown Patient',
          counselorName: counselor?.fullName || counselor?.displayName || app.counselorId || 'Unknown Counselor',
        };
      });

      setRecentAppointments(resolvedAppointments);

      // Get recent 3 counselors
      setRecentCounselors(counselors.slice(0, 3));
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    loadData();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  const metrics = [
    { id: 'patients', title: 'TOTAL PATIENTS', value: String(stats.patients), icon: 'users', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' },
    { id: 'counselors', title: 'TOTAL COUNSELORS', value: String(stats.counselors), icon: 'briefcase', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    { id: 'appointments', title: 'TOTAL APPOINTMENTS', value: String(stats.appointments), icon: 'calendar', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ADMIN: OVERVIEW DASHBOARD</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Feather name="refresh-cw" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metrics Grid */}
        <View style={styles.statsGrid}>
          {metrics.map(metric => (
            <View key={metric.id} style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statTitle}>{metric.title}</Text>
                <View style={[styles.iconCircle, { backgroundColor: metric.bgColor }]}>
                  <Feather name={metric.icon as any} size={18} color={metric.color} />
                </View>
              </View>
              <Text style={styles.statValue}>{metric.value}</Text>
              <Text style={styles.statSubText}>Active database records</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionCard, { minWidth: isDesktop ? 180 : 140 }]} onPress={() => router.push('/(admin-tabs)/content-library')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Feather name="book-open" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.actionText}>Manage Content</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { minWidth: isDesktop ? 180 : 140 }]} onPress={() => router.push('/(admin-tabs)/counselors')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Feather name="briefcase" size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.actionText}>Counselors</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { minWidth: isDesktop ? 180 : 140 }]} onPress={() => router.push('/(admin-tabs)/members')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Feather name="users" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.actionText}>Patient Registry</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { minWidth: isDesktop ? 180 : 140 }]} onPress={() => router.push('/(admin-tabs)/settings')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(100, 116, 139, 0.1)' }]}>
              <Feather name="settings" size={20} color="#64748B" />
            </View>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Double Column Layout (Recent Appointments & New Counselors) */}
        <View style={[styles.columnsContainer, { flexDirection: isDesktop ? 'row' : 'column' }]}>
          {/* Recent Appointments */}
          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>Recent Appointments</Text>
              <Feather name="clock" size={16} color="#64748B" />
            </View>
            
            <View style={styles.tableCard}>
              {recentAppointments.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No appointments scheduled.</Text>
                </View>
              ) : (
                recentAppointments.map((app, index) => (
                  <View key={app.id || index} style={[styles.row, index === recentAppointments.length - 1 && { borderBottomWidth: 0 }]}>
                    <View>
                      <Text style={styles.rowTitle}>{app.patientName}</Text>
                      <Text style={styles.rowSubtitle}>With {app.counselorName}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.rowDate}>{app.date}</Text>
                      <Text style={styles.rowTime}>{app.time}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Recent Counselors */}
          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnTitle}>New Counselors</Text>
              <Feather name="shield" size={16} color="#64748B" />
            </View>

            <View style={styles.tableCard}>
              {recentCounselors.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No counselors registered yet.</Text>
                </View>
              ) : (
                recentCounselors.map((couns, index) => (
                  <View key={couns.uid || index} style={[styles.row, index === recentCounselors.length - 1 && { borderBottomWidth: 0 }]}>
                    <View>
                      <Text style={styles.rowTitle}>{couns.fullName || couns.displayName}</Text>
                      <Text style={styles.rowSubtitle}>{couns.email}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <View style={[styles.statusTag, couns.profileCompleted ? styles.tagComplete : styles.tagPending]}>
                        <Text style={[styles.tagText, couns.profileCompleted ? styles.tagTextComplete : styles.tagTextPending]}>
                          {couns.profileCompleted ? 'Active' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
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
    justifyContent: 'space-between',
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
  refreshBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
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
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  statSubText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  columnsContainer: {
    gap: 24,
    marginBottom: 32,
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  columnTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#94A3B8',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowDate: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 2,
  },
  rowTime: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagComplete: {
    backgroundColor: '#DCFCE7',
  },
  tagPending: {
    backgroundColor: '#FEF3C7',
  },
  tagText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
  },
  tagTextComplete: {
    color: '#16A34A',
  },
  tagTextPending: {
    color: '#D97706',
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
