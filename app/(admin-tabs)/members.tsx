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

import { deleteMember, getAllMembers, type MemberRecord } from '@/lib/admin';

export default function AdminMembersScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MemberRecord | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await getAllMembers();
      setMembers(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load members. Please try again.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchMembers();
      setLoading(false);
    })();
  }, [fetchMembers]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredMembers(
      members.filter(
        (m) =>
          m.name?.toLowerCase().includes(query) ||
          m.email?.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, members]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  }, [fetchMembers]);

  const handleDeletePress = (member: MemberRecord) => {
    setDeleteTarget(member);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMember(deleteTarget.uid);
      setIsDeleteModalVisible(false);
      setDeleteTarget(null);
      await fetchMembers();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete member. Please try again.');
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalVisible(false);
    setDeleteTarget(null);
  };

  const isProfileComplete = (member: MemberRecord): boolean => {
    return !!(member.name && member.email && member.gender && member.dob);
  };

  const renderStatusBadge = (complete: boolean) => {
    return (
      <View style={[styles.badge, complete ? styles.badgeComplete : styles.badgeIncomplete]}>
        <Feather
          name={complete ? 'check-circle' : 'alert-circle'}
          size={13}
          color={complete ? '#10B981' : '#F59E0B'}
        />
        <Text style={[styles.badgeText, complete ? styles.badgeTextComplete : styles.badgeTextIncomplete]}>
          {complete ? 'Complete' : 'Incomplete'}
        </Text>
      </View>
    );
  };

  const renderMemberCard = ({ item }: { item: MemberRecord }) => {
    const complete = isProfileComplete(item);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.memberName} numberOfLines={1}>
              {item.name || 'Unnamed Member'}
            </Text>
            <Text style={styles.memberEmail} numberOfLines={1}>
              {item.email || 'No email'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePress(item)}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsRow}>
          {item.gender ? (
            <View style={styles.detailChip}>
              <Feather name="user" size={13} color="#94A3B8" />
              <Text style={styles.detailText}>{item.gender}</Text>
            </View>
          ) : null}
          {item.dob ? (
            <View style={styles.detailChip}>
              <Feather name="calendar" size={13} color="#94A3B8" />
              <Text style={styles.detailText}>{item.dob}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.badgeRow}>
          {renderStatusBadge(complete)}
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Feather name="users" size={48} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No Patients Found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery.trim()
            ? 'Try adjusting your search query.'
            : 'Patients will appear here once registered.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ADMIN: PATIENT REGISTRY</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredMembers.length}</Text>
        </View>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            placeholder="Search patients by name or email..."
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
              <Text style={[styles.th, { flex: 2 }]}>PATIENT NAME</Text>
              <Text style={[styles.th, { flex: 2.5 }]}>EMAIL ADDRESS</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>GENDER</Text>
              <Text style={[styles.th, { flex: 2 }]}>DATE OF BIRTH</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>STATUS</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>ACTIONS</Text>
            </View>

            {filteredMembers.length === 0 ? (
              <View style={styles.emptyTable}>
                <Text style={styles.emptyText}>No patients found.</Text>
              </View>
            ) : (
              filteredMembers.map((member, index) => {
                const complete = isProfileComplete(member);
                return (
                  <View key={member.uid || index} style={[styles.tableRow, index === filteredMembers.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[styles.td, { flex: 2 }]}>
                      <Text style={styles.patientNameText}>{member.name || 'Unnamed'}</Text>
                    </View>
                    <View style={[styles.td, { flex: 2.5 }]}>
                      <Text style={styles.patientEmailText}>{member.email || 'N/A'}</Text>
                    </View>
                    <View style={[styles.td, { flex: 1.5 }]}>
                      <Text style={styles.patientGenderText}>{member.gender || 'N/A'}</Text>
                    </View>
                    <View style={[styles.td, { flex: 2 }]}>
                      <Text style={styles.patientDobText}>{member.dob || 'N/A'}</Text>
                    </View>
                    <View style={[styles.td, { flex: 1.5 }]}>
                      {renderStatusBadge(complete)}
                    </View>
                    <View style={[styles.td, { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }]}>
                      <TouchableOpacity style={styles.deleteRowBtn} onPress={() => handleDeletePress(member)}>
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
          data={filteredMembers}
          keyExtractor={(item) => item.uid}
          renderItem={renderMemberCard}
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
        onRequestClose={handleCancelDelete}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCancelDelete}>
          <Pressable style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalIconContainer}>
              <Feather name="alert-triangle" size={28} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Delete Patient</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete{' '}
              <Text style={styles.modalMemberName}>
                {deleteTarget?.name || 'this member'}
              </Text>
              ? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={handleConfirmDelete}
                activeOpacity={0.7}
              >
                <Feather name="trash-2" size={16} color="#FFFFFF" />
                <Text style={styles.confirmDeleteText}>Delete</Text>
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
  patientNameText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  patientEmailText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#475569',
  },
  patientGenderText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#475569',
  },
  patientDobText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#475569',
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
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  memberName: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  memberEmail: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#94A3B8',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  badgeText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextComplete: {
    color: '#10B981',
  },
  badgeTextIncomplete: {
    color: '#F59E0B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 20,
  },
  emptySubtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
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
  modalMemberName: {
    color: '#0F172A',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  confirmDeleteButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmDeleteText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
