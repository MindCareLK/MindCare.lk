import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ArticleDetailScreen() {
  // This extracts the article ID passed from the home screen URL
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Go Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Article Details</Text>
      <Text style={styles.subtitle}>You are viewing the article with ID: {id}</Text>
      
      {/* You can eventually add your fetch logic here to load the full article using this ID */}
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#FFFFFF' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginTop: 20,
    color: '#171717'
  },
  subtitle: { 
    fontSize: 16, 
    color: '#646B75', 
    marginTop: 10 
  },
  backButton: { 
    paddingVertical: 10 
  },
  backText: { 
    fontSize: 16, 
    color: '#0E97F0',
    fontWeight: '600'
  }
});