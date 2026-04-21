import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const articleList = [
  {
    id: '1',
    category: 'POPULAR SERIES',
    title: 'Understanding Mindfulness: A Beginner’s Path to Inner Peace',
    description: 'Discover practical techniques to rewire your brain for resilience.',
    author: 'Dr. Sarah Chen',
    role: 'Clinical Psychologist',
    minutes: '5-8 MIN READ',
    image: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80',
    tagColor: '#2F88E8',
  },
  {
    id: '1',
    category: 'POPULAR SERIES',
    title: 'Understanding Mindfulness: A Beginner’s Path to Inner Peace',
    description: 'Discover practical techniques to rewire your brain for resilience.',
    author: 'Dr. Sarah Chen',
    role: 'Clinical Psychologist',
    minutes: '5-8 MIN READ',
    image: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80',
    tagColor: '#2F88E8',
  },
   {
    id: '1',
    category: 'POPULAR SERIES',
    title: 'Understanding Mindfulness: A Beginner’s Path to Inner Peace',
    description: 'Discover practical techniques to rewire your brain for resilience.',
    author: 'Dr. Sarah Chen',
    role: 'Clinical Psychologist',
    minutes: '5-8 MIN READ',
    image: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80',
    tagColor: '#2F88E8',
  },
   {
    id: '1',
    category: 'POPULAR SERIES',
    title: 'Understanding Mindfulness: A Beginner’s Path to Inner Peace',
    description: 'Discover practical techniques to rewire your brain for resilience.',
    author: 'Dr. Sarah Chen',
    role: 'Clinical Psychologist',
    minutes: '5-8 MIN READ',
    image: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80',
    tagColor: '#2F88E8',
  },
];

export default function DiscoverArticlesPage() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#333" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Discover Articles</Text>
          <Text style={styles.pageSubtitle}>Choose an article to read and explore</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {articleList.map((item) => (
            <View key={item.id} style={styles.articleCard}>
              <View style={styles.imageWrap}>
                <Image source={{ uri: item.image }} style={styles.articleImage} />
                <View style={styles.badgeRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: item.tagColor }]}>
                    <Text style={styles.badgeText}>{item.category}</Text>
                  </View>
                  <View style={styles.timeBadge}>
                    <Feather name="clock" size={10} color="#666" />
                    <Text style={styles.timeText}>{item.minutes}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.body}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
                
                <View style={styles.footer}>
                  <View style={styles.authorRow}>
                    <View style={styles.authorInitial}>
                      <Text style={styles.initialText}>SC</Text>
                    </View>
                    <View>
                      <Text style={styles.authorName}>{item.author}</Text>
                      <Text style={styles.authorRole}>{item.role}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.readBtn} 
                    onPress={() => router.push('/article_detail')}
                >
                    <Text style={styles.readText}>Read →</Text>
                    </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomBar}>
                  <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/home')}>
                    <Feather name="home" size={16} color="#8E969F" />
                    <Text style={styles.navText}>Home</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/ai-chat')}>
                    <Feather name="message-square" size={16} color="#8E969F" />
                    <Text style={styles.navText}>Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('/counselors')}>
                    <Feather name="users" size={16} color="#30353B" />
                    <Text style={styles.navActive}>Counselors</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navItem} activeOpacity={0.85} onPress={() => router.replace('./profile')}>
                    <Feather name="user" size={16} color="#8E969F" />
                    <Text style={styles.navText}>Profile</Text>
                  </TouchableOpacity>
                </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backText: { marginLeft: 5, fontSize: 14, color: '#333', fontWeight: '600' },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  pageSubtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  content: { paddingHorizontal: 20, paddingBottom: 100 },
  articleCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    marginBottom: 25, 
    borderWidth: 2, 
    borderColor: '#EEE',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 1, height: 2 },
    shadowRadius: 10,
    elevation: 4 
  },
  imageWrap: { height: 180, width: '100%' },
  articleImage: { width: '100%', height: '100%' },
  badgeRow: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  timeBadge: { backgroundColor: 'rgba(255,255,255,0.9)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 5 },
  timeText: { fontSize: 10, fontWeight: '700', color: '#666' },
  body: { padding: 15 },
  title: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', lineHeight: 22 },
  description: { fontSize: 13, color: '#666', marginTop: 8, lineHeight: 18 },
  footer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorInitial: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2F88E8', justifyContent: 'center', alignItems: 'center' },
  initialText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  authorName: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
  authorRole: { fontSize: 10, color: '#999' },
  readBtn: { paddingVertical: 5 },
  readText: { color: '#2F88E8', fontSize: 12, fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 65,
    borderTopWidth: 1,
    borderTopColor: '#D8DFE7',
    backgroundColor: '#F4F7FB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: { alignItems: 'center', gap: 3 },
  navActive: { fontSize: 10, color: '#2F88E8', fontWeight: '700' },
  navText: { fontSize: 10, color: '#97A0AB', fontWeight: '600' },
});