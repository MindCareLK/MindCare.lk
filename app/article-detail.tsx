import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState, useLayoutEffect } from 'react';

type HelpfulRating = 'yes' | 'no' | null;

const articleContent: Record<string, any> = {
  '1': {
    id: '1',
    category: 'POPULAR SERIES',
    title: "Understanding Mindfulness: A Beginner's Path to Inner Peace",
    description: 'Discover practical techniques to rewire your brain for resilience.',
    author: 'Dr. Sarah Chen',
    role: 'Clinical Psychologist',
    minutes: '5-8 MIN READ',
    image: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80',
    tagColor: '#2F88E8',
    initials: 'SC',
    content: `Mindfulness is not about clearing your mind or reaching a state of eternal bliss. Rather, it is the simple, yet profoundly effective practice of bringing your attention back to the present moment, over and over again.

In our fast-paced world, our brains are constantly scanning for threats or preparing for the future. This survival mechanism puts us in a state of chronic stress. By practicing mindfulness, we can begin to rewire those patterns—the parts of the nervous system that tells us we're "safe enough" to relax.

## Quick Exercise: The 3-3 Rule

When you feel overwhelmed, stop and name 3 things you can see, 3 sounds you can hear, and 3 parts of your body (like fingers, toes, and shoulders).

## Starting Your Practice

To begin, find a comfortable seated position. You don't need to sit cross-legged in a dedicated room. You can practice in your car, on the bus, on the floor at home, or even in bed. The key is consistency with duration.

Remember, your mind will drift—and it will—gently acknowledge the thought and return your focus back to your breathing. Don't judge yourself for your mind having wandered to the moment of refocus.`,
    relatedArticles: [
      {
        id: '2',
        category: 'Mindfulness',
        title: 'Finding Stillness in a Chaotic Digital World',
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: '3',
        category: 'Wellness',
        title: 'Understanding Sleep Hygiene for Better Mental Health',
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
  '2': {
    id: '2',
    category: 'Mindfulness',
    title: 'Finding Stillness in a Chaotic Digital World',
    description: 'Learn techniques to find peace amidst digital chaos.',
    author: 'Uthoja Kumara',
    role: 'Mindfulness Coach',
    minutes: '6 MIN READ',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    tagColor: '#7AD6D9',
    initials: 'UK',
    content: `In today's hyperconnected world, finding moments of stillness has become both more challenging and more essential than ever. We're constantly bombarded with notifications, messages, and information. This digital noise can lead to anxiety, stress, and a sense of being overwhelmed.

Mindfulness offers a powerful antidote to this chaos. By cultivating awareness and presence, we can create pockets of peace in our busy lives.

## The Challenge of Digital Overwhelm

Our brains are not designed to handle the constant stream of stimulation we receive daily. Social media algorithms are engineered to keep us engaged, notifications interrupt our focus, and the fear of missing out (FOMO) keeps us glued to our screens.

This constant connectivity has real consequences including reduced attention span, increased anxiety, sleep disruption, and weakened relationships.

## Building Your Stillness Practice

1. Digital Boundaries: Set specific times for checking emails and social media.
2. Mindful Breathing: Spend just 5 minutes practicing deep breathing.
3. Nature Time: Spend time in nature without your phone.
4. Meditation: Even 10 minutes daily can reduce stress significantly.`,
    relatedArticles: [
      {
        id: '1',
        category: 'Popular Series',
        title: "Understanding Mindfulness: A Beginner's Path to Inner Peace",
        image: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: '3',
        category: 'Wellness',
        title: 'Understanding Sleep Hygiene for Better Mental Health',
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
  '3': {
    id: '3',
    category: 'Wellness',
    title: 'Understanding Sleep Hygiene for Better Mental Health',
    description: 'Sleep quality directly impacts your mental wellbeing.',
    author: 'Saman Bandara',
    role: 'Sleep Specialist',
    minutes: '7 MIN READ',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    tagColor: '#A7D87D',
    initials: 'SB',
    content: `Quality sleep is not a luxury—it's a fundamental pillar of mental health. Yet, in our fast-paced society, sleep is often the first thing we sacrifice. Understanding and implementing good sleep hygiene can dramatically improve your mental well-being.

## The Sleep-Mental Health Connection

During sleep, your brain processes emotions, consolidates memories, and restores neurochemicals like serotonin and dopamine. Chronic sleep deprivation is linked to increased anxiety, depression, impaired emotional regulation, and reduced stress resilience.

## Sleep Hygiene Principles

Good sleep hygiene refers to the habits and practices that promote consistent, quality sleep:

1. Maintain a Consistent Schedule: Go to bed and wake up at the same time daily.
2. Create a Sleep-Conducive Environment: Keep your bedroom cool, dark, and quiet.
3. Limit Blue Light: Reduce screen time 1-2 hours before bed.
4. Avoid Caffeine and Heavy Meals: Avoid these 3-6 hours before sleep.
5. Exercise Regularly: Physical activity promotes better sleep quality.`,
    relatedArticles: [
      {
        id: '1',
        category: 'Popular Series',
        title: "Understanding Mindfulness: A Beginner's Path to Inner Peace",
        image: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: '2',
        category: 'Mindfulness',
        title: 'Finding Stillness in a Chaotic Digital World',
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
};

export default function ArticleDetailPage() {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string }>();
  const articleId = params.id || '1';
  const article = articleContent[articleId];
  const [helpfulRating, setHelpfulRating] = useState<HelpfulRating>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  if (!article) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
        <View style={styles.container}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={styles.errorText}>Article not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#333" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Featured Image */}
          <Image source={{ uri: article.image }} style={styles.featuredImage} />

          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={[styles.categoryBadge, { backgroundColor: article.tagColor }]}>
              <Text style={styles.badgeText}>{article.category}</Text>
            </View>
            <View style={styles.timeBadge}>
              <Feather name="clock" size={10} color="#666" />
              <Text style={styles.timeText}>{article.minutes}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{article.description}</Text>

          {/* Author Section */}
          <View style={styles.authorSection}>
            <View style={styles.authorLeft}>
              <View style={styles.authorAvatar}>
                <Text style={styles.avatarText}>{article.initials}</Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{article.author}</Text>
                <Text style={styles.authorRole}>{article.role}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.followBtn}>
              <Text style={styles.followText}>Follow</Text>
            </TouchableOpacity>
          </View>

          {/* Article Content */}
          <View style={styles.contentSection}>
            {article.content.split('\n\n').map((paragraph: string, index: number) => {
              // Check if paragraph is a section header (starts with ##)
              if (paragraph.startsWith('##')) {
                const title = paragraph.replace('##', '').trim();
                return (
                  <View key={index}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                  </View>
                );
              }

              // Check if paragraph is a highlighted exercise section
              if (
                paragraph.includes('Quick Exercise') ||
                paragraph.includes('Quick Exercise:')
              ) {
                const lines = paragraph.split('\n').filter((l: string) => l.trim());
                return (
                  <View key={index} style={styles.exerciseBox}>
                    <View style={styles.exerciseIcon}>
                      <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#2F88E8" />
                    </View>
                    <View style={styles.exerciseContent}>
                      {lines.map((line: string, i: number) => (
                        <Text key={i} style={styles.exerciseText}>
                          {line.trim()}
                        </Text>
                      ))}
                    </View>
                  </View>
                );
              }

              // Regular paragraph
              return (
                <Text key={index} style={styles.bodyText}>
                  {paragraph}
                </Text>
              );
            })}
          </View>

          {/* Helpful Rating Section */}
          <View style={styles.helpfulSection}>
            <Text style={styles.helpfulTitle}>Was this guide helpful?</Text>
            <View style={styles.helpfulButtons}>
              <TouchableOpacity
                style={[
                  styles.ratingBtn,
                  helpfulRating === 'yes' && styles.ratingBtnActive,
                ]}
                onPress={() => setHelpfulRating('yes')}>
                <Feather name="thumbs-up" size={16} color={helpfulRating === 'yes' ? '#2F88E8' : '#999'} />
                <Text style={[styles.ratingText, helpfulRating === 'yes' && styles.ratingTextActive]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ratingBtn,
                  helpfulRating === 'no' && styles.ratingBtnActive,
                ]}
                onPress={() => setHelpfulRating('no')}>
                <Feather name="thumbs-down" size={16} color={helpfulRating === 'no' ? '#2F88E8' : '#999'} />
                <Text style={[styles.ratingText, helpfulRating === 'no' && styles.ratingTextActive]}>No</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* You Might Also Like */}
          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>You might also like</Text>
              {article.relatedArticles.map((related: any) => (
                <TouchableOpacity
                  key={related.id}
                  style={styles.relatedCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/article-detail?id=${related.id}` as any)}>
                  <Image source={{ uri: related.image }} style={styles.relatedImage} />
                  <View style={styles.relatedInfo}>
                    <Text style={styles.relatedCategory}>{related.category}</Text>
                    <Text style={styles.relatedCardTitle}>{related.title}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Finished Button */}
          <TouchableOpacity style={styles.finishedBtn} onPress={() => router.back()}>
            <Text style={styles.finishedBtnText}>I've finished reading</Text>
          </TouchableOpacity>

          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  content: {
    paddingBottom: 30,
  },
  featuredImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F0F0F0',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  title: {
    marginHorizontal: 14,
    marginTop: 12,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    color: '#1E1E1E',
  },
  description: {
    marginHorizontal: 14,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    fontWeight: '500',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 14,
    marginTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2F88E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1E1E',
  },
  authorRole: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2F88E8',
    borderRadius: 8,
  },
  followText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contentSection: {
    marginHorizontal: 14,
    marginTop: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
    marginTop: 12,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
    fontFamily: 'Inter',
  },
  exerciseBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2F88E8',
    padding: 12,
    gap: 10,
    marginVertical: 8,
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#1E1E1E',
    fontWeight: '500',
  },
  helpfulSection: {
    marginHorizontal: 14,
    marginTop: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  helpfulTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1E1E',
    marginBottom: 12,
  },
  helpfulButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  ratingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ratingBtnActive: {
    borderColor: '#2F88E8',
    backgroundColor: '#F0F8FF',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  ratingTextActive: {
    color: '#2F88E8',
  },
  relatedSection: {
    marginHorizontal: 14,
    marginTop: 24,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 12,
  },
  relatedCard: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    paddingBottom: 10,
  },
  relatedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  relatedInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  relatedCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2F88E8',
    marginBottom: 4,
  },
  relatedCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1E1E',
    lineHeight: 18,
  },
  finishedBtn: {
    marginHorizontal: 14,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: '#2F88E8',
    borderRadius: 10,
    alignItems: 'center',
  },
  finishedBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spacer: {
    height: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
