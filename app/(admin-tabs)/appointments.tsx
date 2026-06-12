import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  deleteAppointment,
  getAllAppointments,
  getMemberName,
  type AppointmentRecord,
} from '@/lib/admin';

/* ------------------------------------------------------------------ */
/*  Tiny helper – resolves a patientId into a display name             */
/* ------------------------------------------------------------------ */
function PatientNameLabel({ uid }: { uid: string }) {
  const [name, setName] = useState('Loading...');

  useEffect(() => {
    getMemberName(uid)
      .then(setName)
      .catch(() => setName('Unknown'));
  }, [uid]);

  return <Text style={styles.patientName}>{name}</Text>;
}

/* ------------------------------------------------------------------ */
/*  Filter types                                                       */
/* ------------------------------------------------------------------ */
type Filter = 'all' | 'upcoming' | 'completed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

/* ------------------------------------------------------------------ */
/*  Main screen                                                        */
/* ------------------------------------------------------------------ */
export default function AdminAppointmentsScreen() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppointmentRecord | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  /* ---- data fetching ---- */
  const fetchAppointments = useCallback(async () => {
    try {
      const data = await getAllAppointments();
      const sorted = [...data].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
      setAppointments(sorted);
    } catch {
      // silent – list stays empty
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAppointments().finally(() => setLoading(false));
  }, [fetchAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, [fetchAppointments]);

  /* ---- filtering ---- */
  const filtered = appointments.filter((a) => {
    if (activeFilter === 'upcoming') return a.status === 'scheduled';
    if (activeFilter === 'completed') return a.status === 'completed';
    return true;
  });

  /* ---- delete flow ---- */
  const openDeleteModal = (item: AppointmentRecord) => {
    setDeleteTarget(item);
    setIsDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalVisible(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAppointment(deleteTarget.id);
      await fetchAppointments();
    } catch {
      // silent
    } finally {
      closeDeleteModal();
    }
  };

  /* ---- render helpers ---- */
  const renderFilterPill = ({ key, label }: { key: Filter; label: string }) => {
    const active = activeFilter === key;
    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.7}
        onPress={() => setActiveFilter(key)}
        style={[styles.filterPill, active ? styles.filterPillActive : styles.filterPillInactive]}
      >
        <Text style={[styles.filterPillText, active ? styles.filterPillTextActive : styles.filterPillTextInactive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStatusBadge = (status: string) => {
    const isScheduled = status === 'scheduled';
    return (
      <View style={[styles.statusBadge, isScheduled ? styles.statusScheduled : styles.statusCompleted]}>
        <Text style={[styles.statusText, isScheduled ? styles.statusTextScheduled : styles.statusTextCompleted]}>
          {isScheduled ? 'Scheduled' : 'Completed'}
        </Text>
      </View>
    );
  };

  const renderCard = ({ item }: { item: AppointmentRecord }) => (
    <View style={styles.card}>
      {/* Top row – counselor + status */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardNames}>
          <Text style={styles.counselorName} numberOfLines={1}>
            {item.counselorId}
          </Text>
          <PatientNameLabel uid={item.patientId} />
        </View>
        {renderStatusBadge(item.status)}
      </View>

      {/* Date & time row */}
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimePill}>
          <Feather name="calendar" size={14} color="#64748B" />
          <Text style={styles.dateTimeText}>{item.date ?? '—'}</Text>
        </View>

        <View style={styles.dateTimePill}>
          <Feather name="clock" size={14} color="#64748B" />
          <Text style={styles.dateTimeText}>{item.time ?? '—'}</Text>
        </View>
      </View>

      {/* Delete button */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.deleteButton}
        onPress={() => openDeleteModal(item)}
      >
        <Feather name="trash-2" size={16} color="#EF4444" />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Feather name="calendar" size={56} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No appointments</Text>
        <Text style={styles.emptySubtitle}>
          {activeFilter === 'all'
            ? 'There are no appointments yet.'
            : `No ${activeFilter} appointments found.`}
        </Text>
      </View>
    );
  };

  /* ---- main render ---- */
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ADMIN: APPOINTMENT MANAGER</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filtered.length}</Text>
          </View>
        </View>

        {/* Filter pills */}
        <View style={styles.filtersRow}>{FILTERS.map(renderFilterPill)}</View>

        {/* List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#3B82F6"
                colors={['#3B82F6']}
                progressBackgroundColor="#FFFFFF"
              />
            }
          />
        )}
      </View>

      {/* Delete confirmation modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeDeleteModal}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />

            <View style={styles.modalIconCircle}>
              <Feather name="trash-2" size={28} color="#EF4444" />
            </View>

            <Text style={styles.modalTitle}>Delete Appointment</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this appointment? This action cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.modalCancelBtn}
                onPress={closeDeleteModal}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.modalDeleteBtn}
                onPress={confirmDelete}
              >
                <Feather name="trash-2" size={16} color="#FFFFFF" />
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ================================================================== */
/*  Styles                                                             */
/* ================================================================== */
const styles = StyleSheet.create({
  /* layout */
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
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
  countBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  countBadgeText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* filters */
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#3B82F6',
  },
  filterPillInactive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: '#64748B',
  },

  /* list */
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardNames: {
    flex: 1,
    gap: 4,
  },
  counselorName: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  patientName: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
  },

  /* date & time */
  dateTimeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },

  /* status badge */
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusScheduled: {
    backgroundColor: '#DCFCE7',
  },
  statusCompleted: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextScheduled: {
    color: '#16A34A',
  },
  statusTextCompleted: {
    color: '#64748B',
  },

  /* delete button */
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },

  /* empty state */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 6,
  },
  emptySubtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  /* modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalMessage: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  modalDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalDeleteText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
