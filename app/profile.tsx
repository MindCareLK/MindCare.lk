import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type InfoField = {
  id: keyof ProfileForm;
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  fullWidth?: boolean;
};

type ProfileForm = {
  name: string;
  email: string;
  gender: string;
  dob: string;
};

type SessionCard = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed';
  actions?: boolean;
};

const personalInfo: InfoField[] = [
  {
    id: 'name',
    label: 'Full Name',
    icon: 'user',
    fullWidth: true,
  },
  {
    id: 'email',
    label: 'Email',
    icon: 'mail',
    fullWidth: true,
  },
  {
    id: 'gender',
    label: 'Gender',
    value: 'Male',
  },
  {
    id: 'dob',
    label: 'Date of Birth',
    value: 'January 15, 1990',
  },
];

const initialProfile: ProfileForm = {
  name: 'John Doe',
  email: 'john.doe@email.com',
  gender: 'Male',
  dob: 'January 15, 1990',
};

const bookedSessions: SessionCard[] = [
  {
    id: 'sarah',
    doctor: 'Dr. Sarah Johnson',
    specialty: 'Cognitive Behavioral Therapy',
    date: 'March 15, 2026',
    time: '2:00 PM - 3:00 PM',
    status: 'Upcoming',
    actions: true,
  },
  {
    id: 'michael',
    doctor: 'Dr. Michael Chen',
    specialty: 'General Consultation',
    date: 'March 12, 2026',
    time: '10:00 AM - 11:00 AM',
    status: 'Completed',
  },
  {
    id: 'emily',
    doctor: 'Dr. Emily Williams',
    specialty: 'Anxiety Management',
    date: 'March 22, 2026',
    time: '4:00 PM - 5:00 PM',
    status: 'Upcoming',
    actions: true,
  },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [draftProfile, setDraftProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditPress = () => {
    if (isEditing) {
      setProfile(draftProfile);
      setIsEditing(false);
      return;
    }

    setDraftProfile(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraftProfile(profile);
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <TouchableOpacity style={styles.backRow} activeOpacity={0.85} onPress={() => router.back()}>
              <Feather name="chevron-left" size={18} color="#EEF5FF" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.heroTitle}>My Profile</Text>
            <Text style={styles.heroSubtitle}>View and manage your personal information and appointments</Text>
          </View>

          <View style={styles.sheet}>
            <View style={styles.avatarCard}>
              <Ionicons name="person-outline" size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.infoGrid}>
              {personalInfo.map((item) => (
                <View key={item.id} style={[styles.infoCard, item.fullWidth && styles.infoCardFull]}>
                  {item.icon ? (
                    <View style={styles.infoIconWrap}>
                      <Feather name={item.icon} size={22} color="#2F88E8" />
                    </View>
                  ) : null}

                  <View style={styles.infoTextBlock}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    {isEditing ? (
                      <TextInput
                        value={draftProfile[item.id]}
                        onChangeText={(value) => setDraftProfile((current) => ({ ...current, [item.id]: value }))}
                        style={styles.infoInput}
                        placeholder={item.label}
                        placeholderTextColor="#9BA7B6"
                      />
                    ) : (
                      <Text style={styles.infoValue}>{profile[item.id]}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sessionsHeader}>
              <Text style={styles.sectionTitle}>Booked Sessions</Text>
              <View style={styles.countPill}>
                <Text style={styles.countText}>2 Upcoming</Text>
              </View>
            </View>

            <View style={styles.sessionList}>
              {bookedSessions.map((session) => {
                const isUpcoming = session.status === 'Upcoming';

                return (
                  <View key={session.id} style={styles.sessionCard}>
                    <View style={styles.sessionTopRow}>
                      <View style={styles.sessionHeading}>
                        <Text style={styles.sessionDoctor}>{session.doctor}</Text>
                        <Text style={styles.sessionSpecialty}>{session.specialty}</Text>
                      </View>
                      <View style={[styles.statusPill, isUpcoming ? styles.statusUpcoming : styles.statusCompleted]}>
                        <Text style={[styles.statusText, isUpcoming ? styles.statusTextUpcoming : styles.statusTextCompleted]}>
                          {session.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sessionMetaRow}>
                      <View style={styles.metaItem}>
                        <Feather name="calendar" size={18} color="#5E6B7C" />
                        <Text style={styles.metaText}>{session.date}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Feather name="clock" size={18} color="#5E6B7C" />
                        <Text style={styles.metaText}>{session.time}</Text>
                      </View>
                    </View>

                    {session.actions ? (
                      <View style={styles.sessionActionRow}>
                        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.88}>
                          <Text style={styles.primaryButtonText}>Join Session</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.88}>
                          <Text style={styles.secondaryButtonText}>Reschedule</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {isEditing ? (
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelButton} activeOpacity={0.9} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButtonCompact} activeOpacity={0.9} onPress={handleEditPress}>
                  <Text style={styles.editButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.editButton} activeOpacity={0.9} onPress={handleEditPress}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.privacyText}>
              Your personal information is kept private and encrypted.{'\n'}
              We never share your data without consent.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/home')}>
            <Feather name="home" size={18} color="#99A2AD" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/ai-chat')}>
            <MaterialCommunityIcons name="robot-outline" size={18} color="#99A2AD" />
            <Text style={styles.navText}>AI Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/counselors')}>
            <Feather name="users" size={18} color="#99A2AD" />
            <Text style={styles.navText}>Counselors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
            <Feather name="user" size={18} color="#2F88E8" />
            <Text style={styles.navActive}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2F88E8',
  },
  container: {
    flex: 1,
    backgroundColor: '#2F88E8',
  },
  content: {
    paddingBottom: 96,
  },
  hero: {
    paddingHorizontal: 34,
    paddingTop: 18,
    paddingBottom: 34,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 19,
    color: '#EEF5FF',
    fontWeight: '500',
  },
  heroTitle: {
    marginTop: 30,
    fontFamily: 'Inter',
    fontSize: 42,
    lineHeight: 48,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: 18,
    maxWidth: 330,
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    color: '#DCEBFF',
    fontWeight: '400',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 86,
    borderTopRightRadius: 86,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  avatarCard: {
    alignSelf: 'center',
    width: 114,
    height: 114,
    borderRadius: 24,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -104,
    marginBottom: 42,
    shadowColor: '#2F88E8',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 24,
    lineHeight: 30,
    color: '#0A0E16',
    fontWeight: '800',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 22,
  },
  infoCard: {
    width: '47%',
    minHeight: 102,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  infoCardFull: {
    width: '100%',
  },
  infoIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#EAF2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBlock: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    color: '#778195',
    fontWeight: '500',
  },
  infoValue: {
    marginTop: 2,
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 22,
    color: '#121722',
    fontWeight: '700',
  },
  infoInput: {
    marginTop: 1,
    paddingVertical: 0,
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 22,
    color: '#121722',
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: '#C7D6E7',
  },
  sessionsHeader: {
    marginTop: 132,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  countPill: {
    borderRadius: 999,
    backgroundColor: '#2F88E8',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  countText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sessionList: {
    marginTop: 24,
    gap: 16,
  },
  sessionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 20,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  sessionHeading: {
    flex: 1,
  },
  sessionDoctor: {
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 24,
    color: '#0E121B',
    fontWeight: '800',
  },
  sessionSpecialty: {
    marginTop: 6,
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    color: '#5E6878',
    fontWeight: '500',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  statusUpcoming: {
    backgroundColor: '#DDFBE8',
  },
  statusCompleted: {
    backgroundColor: '#F1F3F6',
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  statusTextUpcoming: {
    color: '#109447',
  },
  statusTextCompleted: {
    color: '#475467',
  },
  sessionMetaRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  metaText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#5E6878',
    fontWeight: '500',
  },
  sessionActionRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1.2,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 0.8,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CDD5DF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 20,
    color: '#475467',
    fontWeight: '500',
  },
  editButton: {
    marginTop: 26,
    height: 82,
    borderRadius: 16,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2F88E8',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  editActions: {
    marginTop: 26,
    flexDirection: 'row',
    gap: 12,
  },
  editButtonCompact: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2F88E8',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  cancelButton: {
    width: 132,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CDD5DF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontSize: 18,
    lineHeight: 24,
    color: '#475467',
    fontWeight: '600',
  },
  editButtonText: {
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 26,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  privacyText: {
    marginTop: 24,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 20,
    color: '#9A9A9A',
    fontWeight: '400',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 66,
    borderTopWidth: 1,
    borderTopColor: '#E2E7EE',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navActive: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#2F88E8',
    fontWeight: '700',
  },
  navText: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#97A0AB',
    fontWeight: '600',
  },
});
