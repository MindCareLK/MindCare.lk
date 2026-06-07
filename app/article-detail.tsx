import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getArticleById } from '../services/bloggerApi'; 

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the specific article when the screen loads
    const fetchSingleArticle = async () => {
      try {
        if (id) {
          const data = await getArticleById(id as string);
          setArticle(data);
        }
      } catch (error) {
        console.log("Failed to load article:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSingleArticle();
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0E97F0" />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      ) : article ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Blogger returns HTML, so we strip it out for a clean text display */}
          <Text style={styles.title}>{article.title?.replace(/<[^>]+>/g, "")}</Text>
          <Text style={styles.date}>Published: {new Date(article.published).toLocaleDateString()}</Text>
          
          <Text style={styles.bodyText}>
            {article.content?.replace(/<[^>]+>/g, "")}
          </Text>
        </ScrollView>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Oops! We couldn't find that article.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: { 
    paddingVertical: 10 
  },
  backText: { 
    fontSize: 16, 
    color: '#0E97F0',
    fontWeight: '600'
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#171717',
    marginBottom: 8,
    lineHeight: 32,
  },
  date: {
    fontSize: 12,
    color: '#8A95A3',
    marginBottom: 20,
    fontWeight: '500',
  },
  bodyText: { 
    fontSize: 16, 
    color: '#3B4450', 
    lineHeight: 26,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#646B75',
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    color: '#C64545',
  }
});