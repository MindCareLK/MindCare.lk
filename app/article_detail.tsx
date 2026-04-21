import React from 'react';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function ArticleDetailPage() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color="#333" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Image */}
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80' }} 
              style={styles.heroImage} 
            />
            <View style={styles.badgeRow}>
               <View style={styles.popularBadge}><Text style={styles.popularText}>POPULAR SERIES</Text></View>
               <View style={styles.readTimeBadge}>
                 <Feather name="clock" size={10} color="#333" />
                 <Text style={styles.readTimeText}>5-8 MIN READ</Text>
               </View>
            </View>
          </View>

          {/* Article Info */}
          <Text style={styles.title}>Understanding Mindfulness: A Beginner’s Path to Inner Peace</Text>
          <Text style={styles.subtitle}>Discover practical techniques to rewire your brain for resilience.</Text>

          {/* Author Section */}
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
               <Text style={styles.avatarText}>SC</Text>
            </View>
            <View style={styles.authorMeta}>
               <Text style={styles.authorName}>Dr. Sarah Chen</Text>
               <Text style={styles.authorRole}>Clinical Psychologist</Text>
            </View>
            <TouchableOpacity style={styles.followBtn}>
              <Text style={styles.followText}>Follow</Text>
            </TouchableOpacity>
          </View>

          {/* Article Body */}
          <Text style={styles.paragraph}>
            <Text style={styles.dropCap}>M</Text>indfulness is not about clearing your mind or reaching a state of eternal bliss. Rather, it is the simple, yet profoundly dramatic practice of bringing your attention back to the present moment, over and over again.
          </Text>

          {/* Exercise Box */}
          <View style={styles.exerciseBox}>
             <View style={styles.exerciseHeader}>
                <View style={styles.exerciseIcon}>
                   <MaterialCommunityIcons name="lightning-bolt" size={14} color="#FFF" />
                </View>
                <Text style={styles.exerciseTitle}>Quick Exercise: The 3-3-3 Rule</Text>
             </View>
             <Text style={styles.exerciseBody}>
                When you feel overwhelmed, stop and name 3 things you can see, 3 sounds you can hear, and move 3 parts of your body (like fingers, toes, and shoulders).
             </Text>
          </View>

          <Text style={styles.sectionHeading}>Starting Your Practice</Text>
          <Text style={styles.paragraph}>
            To begin, find a comfortable seated position. You don't need to sit cross-legged in a dedicated room. You can practice in your car, on the bus, or even in bed. The key is consistency over duration.
          </Text>

          <View style={styles.feedbackSection}>
             <Text style={styles.feedbackPrompt}>Was this guide helpful?</Text>
             <View style={styles.feedbackRow}>
                <TouchableOpacity style={styles.feedbackBtn}>
                  <Feather name="thumbs-up" size={16} color="#333" />
                  <Text style={styles.feedbackText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.feedbackBtn}>
                  <Feather name="thumbs-down" size={16} color="#333" />
                  <Text style={styles.feedbackText}>No</Text>
                </TouchableOpacity>
             </View>
          </View>

          {/* Recommendation List */}
          <Text style={styles.recommendationHeader}>You might also like</Text>
          <RecommendationItem 
            category="WELLNESS" 
            title="Breathwork for High-Stress Situations" 
            img="https://images.unsplash.com/photo-1515378791036-0648a814c963?auto=format&fit=crop&w=300&q=80" 
          />
          <RecommendationItem 
            category="MENTAL HEALTH" 
            title="Building Emotional Resilience" 
            img="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80" 
          />

          <TouchableOpacity style={styles.finishBtn} onPress={() => router.back()}>
            <Text style={styles.finishText}>I've finished reading</Text>
          </TouchableOpacity>
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

// Sub-component
const RecommendationItem = ({ category, title, img }: any) => (
  <TouchableOpacity style={styles.recCard}>
    <Image source={{ uri: img }} style={styles.recImg} />
    <View style={styles.recInfo}>
      <Text style={styles.recCategory}>{category}</Text>
      <Text style={styles.recTitle}>{title}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  headerRow: { paddingHorizontal: 16, paddingVertical: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { fontSize: 14, color: '#333', fontWeight: '600' },
  content: { padding: 20, paddingBottom: 60 },
  
  imageContainer: { borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  heroImage: { width: '100%', height: 200 },
  badgeRow: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', gap: 10 },
  popularBadge: { backgroundColor: '#2F88E8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  popularText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  readTimeBadge: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  readTimeText: { fontSize: 10, fontWeight: '700', color: '#333' },

  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', lineHeight: 30 },
  subtitle: { fontSize: 15, color: '#666', marginTop: 10, lineHeight: 22 },

  authorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 25, marginBottom: 30 },
  authorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2F88E8', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  authorMeta: { flex: 1, marginLeft: 12 },
  authorName: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  authorRole: { fontSize: 11, color: '#999' },
  followBtn: { backgroundColor: '#2F88E8', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8 },
  followText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  paragraph: { fontSize: 16, lineHeight: 26, color: '#444', marginBottom: 20 },
  dropCap: { fontSize: 32, fontWeight: '800', color: '#2F88E8' },

  exerciseBox: { backgroundColor: '#F2F8FF', borderRadius: 16, padding: 18, marginBottom: 30, borderLeftWidth: 4, borderLeftColor: '#2F88E8' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  exerciseIcon: { backgroundColor: '#2F88E8', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  exerciseTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  exerciseBody: { fontSize: 14, color: '#555', lineHeight: 20 },

  sectionHeading: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 15 },

  feedbackSection: { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 20, marginBottom: 30 },
  feedbackPrompt: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  feedbackRow: { flexDirection: 'row', gap: 10 },
  feedbackBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#DDD', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  feedbackText: { fontSize: 14, fontWeight: '600', color: '#333' },

  recommendationHeader: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 15 },
  recCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#EEE', padding: 10, marginBottom: 12, gap: 12 },
  recImg: { width: 70, height: 70, borderRadius: 10 },
  recInfo: { flex: 1, justifyContent: 'center' },
  recCategory: { fontSize: 10, fontWeight: '800', color: '#2F88E8', marginBottom: 4 },
  recTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },

  finishBtn: { backgroundColor: '#2F88E8', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 20,marginBottom: 40 },
  finishText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

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