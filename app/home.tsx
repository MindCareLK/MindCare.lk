import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

type ReadCard = {
  id: string;
  category: string;
  title: string;
  author: string;
  minutes: string;
  image: string;
};

const reads: ReadCard[] = [
  {
    id: '1',
    category: 'Neuroscience',
    title: 'The Science of Gratitude: How to Rewire Your Brain',
    author: 'Dr. Elena Vance',
    minutes: '6 min read',
    image: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '2',
    category: 'Mindfulness',
    title: 'Finding Stillness in a Chaotic Digital World',
    author: 'Mark S. Peterson',
    minutes: '4 min read',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a814c963?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '3',
    category: 'Wellness',
    title: 'Understanding Sleep Hygiene for Better Mental Health',
    author: 'Sarah Jenkins',
    minutes: '8 min read',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function HomePage() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="flash-outline" size={15} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>MindCare.lk</Text>
            <TouchableOpacity style={styles.headerIcon} activeOpacity={0.8}>
              <Feather name="bell" size={16} color="#59606A" />
            </TouchableOpacity>
          </View>

          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.goodMorning}>Good morning</Text>
              <Text style={styles.name}>Sarah</Text>
            </View>
            <TouchableOpacity style={styles.gearButton} activeOpacity={0.85}>
              <Feather name="settings" size={16} color="#3A4451" />
            </TouchableOpacity>
          </View>

          <View style={styles.pulseCard}>
            <View style={styles.pulseLeft}>
              <View style={styles.pulseIconWrap}>
                <Feather name="heart" size={14} color="#5B6774" />
              </View>
              <View>
                <Text style={styles.pulseLabel}>TODAY&apos;S PULSE</Text>
                <Text style={styles.pulseValue}>Feeling &quot;Balanced&quot;</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.85}>
              <Text style={styles.logMood}>LOG MOOD</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Coping Strategies</Text>
            <TouchableOpacity activeOpacity={0.85}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.strategyCard}>
            <View style={styles.strategyTop}>
              <View style={styles.strategyIcon}>
                <MaterialCommunityIcons name="meditation" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.strategyTag}>
                <Text style={styles.strategyTagText}>Stress</Text>
              </View>
            </View>
            <Text style={styles.strategyTitle}>Box Breathing Technique</Text>
            <Text style={styles.strategyTime}>5 mins</Text>
          </View>

          <View style={styles.searchBar}>
            <Feather name="search" size={14} color="#9EA6B1" />
            <Text style={styles.searchText}>Search wellness topics...</Text>
          </View>

          <Text style={styles.sectionTitle}>Mindful Reads</Text>

          {reads.map((item) => (
            <View style={styles.readCard} key={item.id}>
              <Image source={{ uri: item.image }} style={styles.readImage} />
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{item.category}</Text>
              </View>
              <Text style={styles.readTitle}>{item.title}</Text>
              <View style={styles.readMeta}>
                <Text style={styles.metaText}>{item.author}</Text>
                <Text style={styles.metaText}>{item.minutes}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.moreButton} activeOpacity={0.85}>
            <Text style={styles.moreText}>Explore More Articles</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85}>
            <Feather name="home" size={16} color="#2F88E8" />
            <Text style={styles.navActive}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/ai-chat')}>
            <MaterialCommunityIcons name="robot-outline" size={16} color="#99A2AD" />
            <Text style={styles.navText}>AI Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/counselors')}>
            <Feather name="users" size={16} color="#99A2AD" />
            <Text style={styles.navText}>Counselors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/profile')}>
            <Feather name="user" size={16} color="#99A2AD" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.fab} activeOpacity={0.88}>
          <Feather name="message-circle" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF2F6',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 96,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  brandIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#1A2029',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#313946',
    letterSpacing: 0.3,
  },
  headerIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  goodMorning: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#8C95A2',
    fontWeight: '600',
  },
  name: {
    fontFamily: 'Inter',
    fontSize: 31,
    lineHeight: 35,
    fontWeight: '800',
    color: '#1D2632',
  },
  gearButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F4F7FB',
    borderWidth: 1,
    borderColor: '#D9E0E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE2EA',
    backgroundColor: '#F8FAFD',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pulseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF3F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseLabel: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    color: '#8D97A6',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pulseValue: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#404A57',
    fontWeight: '700',
  },
  logMood: {
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    color: '#2F88E8',
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 20,
    color: '#2D3743',
    fontWeight: '800',
  },
  viewAll: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 12,
    color: '#2F88E8',
    fontWeight: '700',
  },
  strategyCard: {
    width: 160,
    borderRadius: 12,
    backgroundColor: '#2F88E8',
    padding: 10,
  },
  strategyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  strategyIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.24)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  strategyTag: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  strategyTagText: {
    fontFamily: 'Inter',
    fontSize: 8,
    lineHeight: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  strategyTitle: {
    fontFamily: 'Inter',
    fontSize: 19,
    lineHeight: 23,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  strategyTime: {
    marginTop: 6,
    fontFamily: 'Inter',
    fontSize: 9,
    lineHeight: 12,
    color: '#DDEEFF',
    fontWeight: '600',
  },
  searchBar: {
    marginTop: 4,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F3F5F8',
    borderWidth: 1,
    borderColor: '#E3E8EF',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchText: {
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 14,
    color: '#9AA3AE',
  },
  readCard: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E6ED',
  },
  readImage: {
    width: '100%',
    height: 95,
  },
  categoryTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 10,
    backgroundColor: '#DDEEFF',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  categoryTagText: {
    fontFamily: 'Inter',
    fontSize: 8,
    lineHeight: 10,
    color: '#2F88E8',
    fontWeight: '700',
  },
  readTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 17,
    color: '#222C38',
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  readMeta: {
    marginTop: 7,
    marginBottom: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 12,
    color: '#8B94A1',
    fontWeight: '600',
  },
  moreButton: {
    marginTop: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8DEE6',
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  moreText: {
    fontFamily: 'Inter',
    color: '#5E6876',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 62,
    borderTopWidth: 1,
    borderTopColor: '#D8DFE7',
    backgroundColor: '#F4F7FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  navItem: {
    alignItems: 'center',
    gap: 2,
  },
  navActive: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 12,
    color: '#2F88E8',
    fontWeight: '700',
  },
  navText: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 12,
    color: '#97A0AB',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 52,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2F88E8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2F88E8',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
