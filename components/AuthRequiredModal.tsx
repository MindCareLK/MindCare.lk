import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';

type AuthRequiredModalProps = {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
};

export default function AuthRequiredModal({ visible, onClose, onLogin }: AuthRequiredModalProps) {
  const [renderModal, setRenderModal] = React.useState(visible);
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.9));

  React.useEffect(() => {
    if (visible) {
      setRenderModal(true);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setRenderModal(false);
      });
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!renderModal) return null;

  return (
    <Modal visible={renderModal} transparent={true} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Feather name="lock" size={28} color="#2F88E8" />
            </View>
          </View>
          
          <Text style={styles.title}>Authentication Required</Text>
          <Text style={styles.description}>
            You need to be logged in to your member account to schedule a session with our professionals.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.loginButton} activeOpacity={0.85} onPress={onLogin}>
              <Text style={styles.loginButtonText}>Log In or Sign Up</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} activeOpacity={0.85} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#2D7BF0',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
