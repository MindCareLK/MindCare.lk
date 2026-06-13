import { Feather, Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type CancelSession = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Pending';
  actions?: boolean;
};

type CancelSessionModalProps = {
  visible: boolean;
  session: CancelSession | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function CancelSessionModal({
  visible,
  session,
  onClose,
  onConfirm,
}: CancelSessionModalProps) {
  if (!session) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalShell}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Feather name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.iconCircle}>
              <Feather name="alert-triangle" size={28} color="#2F88E8" />
            </View>

            <Text style={styles.modalTitle}>Cancel Session?</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to cancel this appointment?
            </Text>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            {/* Session Card */}
            <View style={styles.sessionCard}>
              <Text style={styles.doctorName}>{session.doctor}</Text>
              <Text style={styles.specialtyText}>{session.specialty}</Text>
              <View style={styles.metaRow}>
                <Feather name="calendar" size={13} color="#6C7A8C" />
                <Text style={styles.metaText}>{session.date}</Text>
                <Feather name="clock" size={13} color="#6C7A8C" style={{ marginLeft: 8 }} />
                <Text style={styles.metaText}>{session.time}</Text>
              </View>
            </View>

            {/* Warning Block */}
            <View style={styles.warningBlock}>
              <Text style={styles.warningText}>
                Cancelling within 24 hours may incur a cancellation fee. This action cannot be undone.
              </Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.9}
              onPress={onConfirm}
            >
              <Text style={styles.cancelBtnText}>Yes, Cancel Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepBtn}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={styles.keepBtnText}>Keep Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalShell: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  modalHeader: {
    backgroundColor: '#2F88E8',
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  modalTitle: {
    fontFamily: 'Inter',
    fontSize: 22,
    lineHeight: 28,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    marginTop: 6,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#E0EFFF',
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  modalBody: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  sessionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 16,
    marginBottom: 14,
  },
  doctorName: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 20,
    color: '#0F172A',
    fontWeight: '800',
  },
  specialtyText: {
    marginTop: 2,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 15,
    color: '#475569',
    fontWeight: '600',
  },
  warningBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 17,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#EF4444',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cancelBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  keepBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keepBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#334155',
    fontWeight: '700',
  },
});
