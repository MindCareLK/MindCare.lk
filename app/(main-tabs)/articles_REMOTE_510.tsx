import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

const articleList = [
  {
    id: '1',
    category: 'POPULAR SERIES',
    title: "Understanding Mindfulness: A Beginner's Path to Inner Peace",
    description: 'Discover practical techniques to rewire your brain for resilience.',
    author: 'Dr. Sarah Chen',
    role: 'Clinical Psychologist',
    minutes: '5-8 MIN READ',
    image: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80',
    tagColor: '#2F88E8',
  },
  {
    id: '2',
    category: 'MINDFULNESS',
    title: 'Finding Stillness in a Chaotic Digital World',
    description: 'Learn techniques to find peace amidst digital chaos.',
    author: 'Uthoja Kumara',
    role: 'Mindfulness Coach',
    minutes: '6 MIN READ',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    tagColor: '#7AD6D9',
  },
   {
    id: '3',
    category: 'WELLNESS',
    title: 'Understanding Sleep Hygiene for Better Mental Health',
    description: 'Sleep quality directly impacts your mental wellbeing.',
    author: 'Saman Bandara',
    role: 'Sleep Specialist',
    minutes: '7 MIN READ',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    tagColor: '#A7D87D',
  },
   {
    id: '4',
    category: 'NEUROSCIENCE',
    title: 'The Power of Gratitude: How to Rewire Your Brain',
    description: 'Discover how gratitude can transform your neural pathways.',
    author: 'Dr. Michael Lee',
    role: 'Neuroscience Researcher',
    minutes: '5 MIN READ',
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=80',
    tagColor: '#F1A345',
  },
];

export default function DiscoverArticlesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = articleList.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Discover Articles</Text>
          <Text style={styles.pageSubtitle}>Choose an article to read and explore</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles..."
            placeholderTextColor="#CCC"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {filteredArticles.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.articleCard}
              activeOpacity={0.8}
              onPress={() => router.push(`/article-detail?id=${item.id}` as any)}
            >
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
                    onPress={() => router.push(`/article-detail?id=${item.id}` as any)}
                  >
                    <Text style={styles.readText}>Read →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  pageSubtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 15, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333', fontFamily: 'Inter' },
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
});
