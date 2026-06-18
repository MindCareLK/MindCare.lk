import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getArticleById } from "../services/bloggerApi";
import RenderHtml from "react-native-render-html";

const { width } = Dimensions.get("window");

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E97F0" />
        <Text style={styles.loadingText}>Loading article...</Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Oops! We couldn't find that article.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>
            {article.title?.replace(/<[^>]+>/g, "")}
          </Text>

          {/* Meta */}
          <Text style={styles.meta}>
            {article.author?.displayName || "Admin"} •{" "}
            {article.published
              ? new Date(article.published).toLocaleDateString()
              : ""}
          </Text>

          {/* HTML Content */}
          <RenderHtml
            contentWidth={width}
            source={{ html: article.content || "" }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  backButton: {
    paddingVertical: 10,
  },

  backText: {
    fontSize: 16,
    color: "#0E97F0",
    fontWeight: "600",
  },

  cover: {
    width: "100%",
    height: 220,
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 8,
    lineHeight: 32,
  },

  meta: {
    fontSize: 12,
    color: "#8A95A3",
    marginBottom: 20,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#646B75",
    fontSize: 14,
  },

  errorText: {
    fontSize: 16,
    color: "#C64545",
  },
});