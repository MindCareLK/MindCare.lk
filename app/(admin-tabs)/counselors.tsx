import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  deleteCounselor,
  getAllCounselors,
  type CounselorRecord,
} from '@/lib/admin';

export default function AdminCounselorsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [counselors, setCounselors] = useState<CounselorRecord[]>([]);
  const [filteredCounselors, setFilteredCounselors] = useState<CounselorRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CounselorRecord | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  /* ---- data fetching ---- */

  const fetchCounselors = useCallback(async () => {
    try {
      const data = await getAllCounselors();
      setCounselors(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to load counselors.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchCounselors();
      setLoading(false);
    })();
  }, [fetchCounselors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCounselors();
    setRefreshing(false);
  }, [fetchCounselors]);

  /* ---- search filtering ---- */

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCounselors(counselors);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredCounselors(
      counselors.filter(
        (c) =>
          c.displayName?.toLowerCase().includes(q) ||
          c.fullName?.toLowerCase().includes(q) ||
          c.specialty?.toLowerCase().includes(q),
      ),
    );
  }, [searchQuery, counselors]);

  /* ---- delete ---- */

  const openDeleteModal = (counselor: CounselorRecord) => {
    setDeleteTarget(counselor);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCounselor(deleteTarget.uid);
      setIsDeleteModalVisible(false);
      setDeleteTarget(null);
      await fetchCounselors();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to delete counselor.');
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalVisible(false);
    setDeleteTarget(null);
  };

  /* ---- render helpers ---- */

  const renderStatusBadge = (isComplete: boolean) => {
    return (
      <View style={[styles.badge, isComplete ? styles.badgeComplete : styles.badgeIncomplete]}>
        <View style={[styles.badgeDot, { backgroundColor: isComplete ? '#10B981' : '#F59E0B' }]} />
        <Text style={[styles.badgeLabel, { color: isComplete ? '#16A34A' : '#D97706' }]}>
          {isComplete ? 'Active' : 'Pending'}
        </Text>
      </View>
    );
  };

  const renderCounselorCard = ({ item }: { item: CounselorRecord }) => {
    const qualCount = item.qualifications?.length ?? 0;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.displayName} numberOfLines={1}>
              {item.displayName || item.fullName || 'Unnamed'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => openDeleteModal(item)}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {item.specialty ? (
          <View style={styles.specialtyRow}>
            <Feather name="briefcase" size={13} color="#8B5CF6" />
            <Text style={styles.specialtyText}>{item.specialty}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.qualText}>
            {qualCount} qualification{qualCount !== 1 ? 's' : ''}
          </Text>
          {renderStatusBadge(item.profileCompleted)}
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Feather name="briefcase" size={48} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No Counselors Found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery.trim()
            ? 'Try adjusting your search query.'
            : 'Counselors will appear here once added.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ADMIN: COUNSELOR MANAGER</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredCounselors.length}</Text>
        </View>
      </View>

      {/* Search toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            placeholder="Search counselors by name or specialty..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : isDesktop ? (
        /* Desktop Table View */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>COUNSELOR NAME</Text>
              <Text style={[styles.th, { flex: 2.5 }]}>EMAIL ADDRESS</Text>
              <Text style={[styles.th, { flex: 2 }]}>SPECIALTY</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>QUALIFICATIONS</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>STATUS</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>ACTIONS</Text>
            </View>

            {filteredCounselors.length === 0 ? (
              <View style={styles.emptyTable}>
                <Text style={styles.emptyText}>No counselors found.</Text>
              </View>
            ) : (
              filteredCounselors.map((couns, index) => {
                const qualCount = couns.qualifications?.length ?? 0;
                return (
                  <View key={couns.uid || index} style={[styles.tableRow, index === filteredCounselors.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[styles.td, { flex: 2 }]}>
                      <Text style={styles.counsName}>{couns.fullName || couns.displayName || 'Unnamed'}</Text>
                    </View>
                    <View style={[styles.td, { flex: 2.5 }]}>
                      <Text style={styles.counsEmail}>{couns.email}</Text>
                    </View>
                    <View style={[styles.td, { flex: 2 }]}>
                      <Text style={styles.counsSpecialty}>{couns.specialty || 'General'}</Text>
                    </View>
                    <View style={[styles.td, { flex: 1.5 }]}>
                      <Text style={styles.counsQual}>{qualCount} degree{qualCount !== 1 ? 's' : ''}</Text>
                    </View>
                    <View style={[styles.td, { flex: 1.5 }]}>
                      {renderStatusBadge(couns.profileCompleted)}
                    </View>
                    <View style={[styles.td, { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }]}>
                      <TouchableOpacity style={styles.deleteRowBtn} onPress={() => openDeleteModal(couns)}>
                        <Feather name="trash-2" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* Mobile List View */
        <FlatList
          data={filteredCounselors}
          keyExtractor={(item) => item.uid}
          renderItem={renderCounselorCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={cancelDelete}
      >
        <Pressable style={styles.modalOverlay} onPress={cancelDelete}>
          <Pressable style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalIconCircle}>
              <Feather name="alert-triangle" size={28} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Delete Counselor</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete{' '}
              <Text style={styles.modalBold}>
                {deleteTarget?.displayName || deleteTarget?.fullName}
              </Text>
              ? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={cancelDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={confirmDelete}
                activeOpacity={0.7}
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
  countBadge: {
    marginLeft: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toolbar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#0F172A',
  },
  scrollContent: {
    padding: 24,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  th: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  td: {
    justifyContent: 'center',
  },
  emptyTable: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#94A3B8',
  },
  counsName: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  counsEmail: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#475569',
  },
  counsSpecialty: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#475569',
  },
  counsQual: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
  },
  deleteRowBtn: {
    padding: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  displayName: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  email: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specialtyText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  qualText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#94A3B8',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeComplete: {
    backgroundColor: '#DCFCE7',
  },
  badgeIncomplete: {
    backgroundColor: '#FEF3C7',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239,68,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalMessage: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  modalBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalDeleteBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  modalDeleteText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
