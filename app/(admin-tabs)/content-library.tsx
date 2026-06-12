import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator, useWindowDimensions, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { getAllMembers, getAllCounselors, getAllAppointments } from '@/lib/admin';
import { getArticles, addArticle, updateArticle, deleteArticle } from '@/services/bloggerApi';

export default function AdminContentLibraryScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stats, setStats] = useState({
    articles: 0,
    members: 0,
    counselors: 0,
    appointments: 0,
  });

  const ITEMS_PER_PAGE = 5;

  // Add/Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleCategory, setArticleCategory] = useState('General');
  const [articleContent, setArticleContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      const [members, counselors, appointments, bloggerArticles] = await Promise.all([
        getAllMembers().catch(() => []),
        getAllCounselors().catch(() => []),
        getAllAppointments().catch(() => []),
        getArticles().catch(() => []),
      ]);

      setStats({
        members: members.length,
        counselors: counselors.length,
        appointments: appointments.length,
        articles: bloggerArticles ? bloggerArticles.length : 0,
      });

      if (bloggerArticles && Array.isArray(bloggerArticles)) {
        const formatted = bloggerArticles.map((item: any, idx: number) => ({
          id: item.id || `ART-${idx}`,
          title: item.title?.replace(/<[^>]+>/g, "") || 'Untitled',
          content: item.content || "",
          category: item.labels && item.labels.length > 0 ? item.labels[0] : 'General',
          author: item.author?.displayName || 'Admin',
          date: item.published ? new Date(item.published).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) : 'N/A',
          status: 'Published'
        }));
        setArticles(formatted);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset page on search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Reset page on category filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const handleAddArticlePress = () => {
    setModalMode('add');
    setEditingArticleId(null);
    setArticleTitle('');
    setArticleCategory('General');
    setArticleContent('');
    setIsModalOpen(true);
  };

  const handleEditArticlePress = (article: any) => {
    setModalMode('edit');
    setEditingArticleId(article.id);
    setArticleTitle(article.title);
    setArticleCategory(article.category);
    // Strip HTML tag wrappers if any, for clean text area display
    setArticleContent(article.content?.replace(/<[^>]+>/g, "") || '');
    setIsModalOpen(true);
  };

  const handleSaveArticle = async () => {
    if (!articleTitle.trim() || !articleContent.trim() || !articleCategory.trim()) {
      Alert.alert("Required Fields", "Please fill in all fields.");
      return;
    }

    try {
      setIsSaving(true);
      if (modalMode === 'add') {
        const newArt = await addArticle({
          title: articleTitle.trim(),
          content: articleContent.trim(),
          category: articleCategory.trim(),
          author: "Admin"
        });

        const formattedNewArt = {
          id: newArt.id,
          title: newArt.title,
          content: newArt.content,
          category: newArt.labels[0],
          author: newArt.author.displayName,
          date: new Date(newArt.published).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          status: 'Published'
        };

        setArticles(prev => [formattedNewArt, ...prev]);
        setStats(prev => ({ ...prev, articles: prev.articles + 1 }));
        Alert.alert("Success", "Article published successfully!");
      } else {
        // Edit mode
        await updateArticle(editingArticleId!, {
          title: articleTitle.trim(),
          content: articleContent.trim(),
          category: articleCategory.trim()
        });

        setArticles(prev => prev.map(art => {
          if (art.id === editingArticleId) {
            return {
              ...art,
              title: articleTitle.trim(),
              content: articleContent.trim(),
              category: articleCategory.trim()
            };
          }
          return art;
        }));

        Alert.alert("Success", "Article updated successfully!");
      }
      setIsModalOpen(false);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.message || "Failed to save article.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArticle = (id: string, title: string) => {
    Alert.alert(
      "Delete Guide Article",
      `Are you sure you want to delete "${title}"? This action is permanent and cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              setLoading(true);
              await deleteArticle(id);
              setArticles(prev => prev.filter(art => art.id !== id));
              setStats(prev => ({ ...prev, articles: Math.max(0, prev.articles - 1) }));
              Alert.alert("Deleted", "Article deleted successfully.");
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete article.");
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  const handleFilterPress = () => {
    const categories = ['All', ...Array.from(new Set(articles.map(a => a.category)))];
    Alert.alert(
      "Filter by Category",
      "Select a category to filter articles:",
      categories.map(cat => ({
        text: cat === selectedCategory ? `✓ ${cat}` : cat,
        onPress: () => setSelectedCategory(cat)
      })),
      { cancelable: true }
    );
  };

  const handleMorePress = (article: any) => {
    Alert.alert(
      "Article Details",
      `Title: ${article.title}\n\nID: ${article.id}\nAuthor: ${article.author}\nDate: ${article.date}\nCategory: ${article.category}\nStatus: ${article.status}`,
      [
        { text: "Close", style: "cancel" }
      ]
    );
  };

  const renderStatusBadge = (status: string) => {
    let bgColor = '#F1F5F9';
    let textColor = '#64748B';
    
    if (status === 'Published') {
      bgColor = '#DCFCE7';
      textColor = '#16A34A';
    } else if (status === 'Archived') {
      bgColor = '#FFEDD5';
      textColor = '#EA580C';
    } else if (status === 'Draft') {
      bgColor = '#F1F5F9';
      textColor = '#64748B';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{status}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  const engagementRate = stats.members > 0 
    ? Math.min(100, Math.round((stats.appointments / stats.members) * 100)) 
    : 0;

  const statsData = [
    { id: 'articles', title: 'TOTAL ARTICLES', value: String(stats.articles), trend: '+12% this month', icon: 'book-open', trendColor: '#10B981', trendIcon: 'trending-up' },
    { id: 'readers', title: 'ACTIVE READERS', value: String(stats.members), trend: '+5% this week', icon: 'users', trendColor: '#10B981', trendIcon: 'trending-up' },
    { id: 'reviews', title: 'PENDING REVIEWS', value: String(stats.appointments), trend: '+2 since yesterday', icon: 'file-text', trendColor: '#10B981', trendIcon: 'trending-up' },
    { id: 'engagement', title: 'ENGAGEMENT RATE', value: `${engagementRate}%`, trend: '+7% overall', icon: 'trending-up', trendColor: '#10B981', trendIcon: 'trending-up' },
  ];

  const filteredArticles = articles.filter(article => {
    const query = searchQuery.toLowerCase();
    const titleMatch = article.title?.toLowerCase().includes(query);
    const authorMatch = article.author?.toLowerCase().includes(query);
    const categoryMatch = selectedCategory === 'All' || article.category === selectedCategory;
    return (titleMatch || authorMatch) && categoryMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / ITEMS_PER_PAGE));
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const renderPageButton = (pageNum: number) => {
    const isActive = currentPage === pageNum;
    return (
      <TouchableOpacity 
        key={pageNum} 
        style={[styles.pageBtn, isActive && styles.pageBtnActive]}
        onPress={() => setCurrentPage(pageNum)}
      >
        <Text style={isActive ? styles.pageBtnTextActive : styles.pageBtnText}>{pageNum}</Text>
      </TouchableOpacity>
    );
  };

  const renderPageNumbers = () => {
    const pageButtons = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageButtons.push(renderPageButton(i));
      }
    } else {
      for (let i = 1; i <= 3; i++) {
        pageButtons.push(renderPageButton(i));
      }
      pageButtons.push(
        <Text key="ellipsis" style={styles.pageEllipsis}>...</Text>
      );
      pageButtons.push(renderPageButton(totalPages));
    }
    return pageButtons;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ADMIN: CONTENT MANAGER</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddArticlePress}>
          <Feather name="plus" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statsData.map(stat => (
            <View key={stat.id} style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Feather name={stat.icon as any} size={18} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <View style={styles.statTrendRow}>
                <Feather name={stat.trendIcon as any} size={14} color={stat.trendColor} />
                <Text style={[styles.statTrend, { color: stat.trendColor }]}>{stat.trend}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Guide Articles</Text>
          <Text style={styles.sectionSubtitle}>View, edit, and organize all educational content on the platform.</Text>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search titles or authors..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              {...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {} as any)}
            />
          </View>
          <TouchableOpacity 
            style={[styles.filterBtn, selectedCategory !== 'All' && { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' }]} 
            onPress={handleFilterPress}
          >
            <Feather name="sliders" size={18} color={selectedCategory !== 'All' ? '#3B82F6' : '#64748B'} />
          </TouchableOpacity>
        </View>

        {/* Table / Card List */}
        {isDesktop ? (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 0.5 }]}>PREVIEW</Text>
              <Text style={[styles.th, { flex: 2.5 }]}>TITLE & ID</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>CATEGORY</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>AUTHOR</Text>
              <Text style={[styles.th, { flex: 1 }]}>STATUS</Text>
              <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>ACTIONS</Text>
            </View>
            
            {paginatedArticles.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: '#64748B', fontFamily: 'Inter', fontSize: 14 }}>No articles found</Text>
              </View>
            ) : (
              paginatedArticles.map((article, index) => {
                return (
                  <View key={article.id || index} style={[styles.tableRow, index === paginatedArticles.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[styles.td, { flex: 0.5 }]}>
                      <View style={styles.imgPlaceholder}>
                        <Feather name="image" size={16} color="#94A3B8" />
                      </View>
                    </View>
                    <View style={[styles.td, { flex: 2.5 }]}>
                      <Text style={styles.articleTitle} numberOfLines={1}>{article.title}</Text>
                      <Text style={styles.articleId}>{article.id}</Text>
                    </View>
                    <View style={[styles.td, { flex: 1.5 }]}>
                      <Text style={styles.cellText}>{article.category}</Text>
                    </View>
                    <View style={[styles.td, { flex: 1.5 }]}>
                      <Text style={styles.cellTextPrimary}>{article.author}</Text>
                      <Text style={styles.cellTextSecondary}>{article.date}</Text>
                    </View>
                    <View style={[styles.td, { flex: 1 }]}>
                      {renderStatusBadge(article.status)}
                    </View>
                    <View style={[styles.td, { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }]}>
                      <TouchableOpacity onPress={() => handleEditArticlePress(article)}><Feather name="edit-2" size={16} color="#64748B" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteArticle(article.id, article.title)}><Feather name="trash-2" size={16} color="#64748B" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleMorePress(article)}><Feather name="more-vertical" size={16} color="#64748B" /></TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* Mobile Card List View */
          <View style={styles.mobileCardContainer}>
            {paginatedArticles.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12 }}>
                <Text style={{ color: '#64748B', fontFamily: 'Inter', fontSize: 14 }}>No articles found</Text>
              </View>
            ) : (
              paginatedArticles.map((article, index) => (
                <View key={article.id || index} style={styles.articleCard}>
                  <View style={styles.articleCardHeader}>
                    <View style={styles.imgPlaceholderMobile}>
                      <Feather name="image" size={16} color="#94A3B8" />
                    </View>
                    <View style={styles.articleCardHeaderInfo}>
                      <Text style={styles.articleCardTitle} numberOfLines={2}>{article.title}</Text>
                      <Text style={styles.articleCardId}>{article.id}</Text>
                    </View>
                  </View>

                  <View style={styles.articleCardDetails}>
                    <View style={styles.detailRowMobile}>
                      <Text style={styles.detailLabelMobile}>Category</Text>
                      <Text style={styles.detailValueMobile}>{article.category}</Text>
                    </View>
                    <View style={styles.detailRowMobile}>
                      <Text style={styles.detailLabelMobile}>Author</Text>
                      <Text style={styles.detailValueMobilePrimary}>{article.author}</Text>
                    </View>
                    <View style={styles.detailRowMobile}>
                      <Text style={styles.detailLabelMobile}>Date</Text>
                      <Text style={styles.detailValueMobileSecondary}>{article.date}</Text>
                    </View>
                  </View>

                  <View style={styles.articleCardFooter}>
                    {renderStatusBadge(article.status)}
                    <View style={styles.articleCardActions}>
                      <TouchableOpacity style={styles.actionBtnMobile} onPress={() => handleEditArticlePress(article)}><Feather name="edit-2" size={16} color="#64748B" /></TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtnMobile} onPress={() => handleDeleteArticle(article.id, article.title)}><Feather name="trash-2" size={16} color="#64748B" /></TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtnMobile} onPress={() => handleMorePress(article)}><Feather name="more-vertical" size={16} color="#64748B" /></TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Pagination */}
        <View style={styles.pagination}>
          <Text style={styles.pageInfo}>
            Showing {filteredArticles.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredArticles.length)} of {filteredArticles.length} articles
          </Text>
          <View style={styles.pageControls}>
            <TouchableOpacity 
              style={[styles.pageBtn, currentPage === 1 && { opacity: 0.5 }]} 
              disabled={currentPage === 1}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <Feather name="chevron-left" size={16} color="#94A3B8" />
            </TouchableOpacity>
            
            {renderPageNumbers()}

            <TouchableOpacity 
              style={[styles.pageBtnRow, currentPage === totalPages && { opacity: 0.5 }]} 
              disabled={currentPage === totalPages}
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              <Text style={styles.pageBtnText}>Next</Text>
              <Feather name="chevron-right" size={16} color="#64748B" style={{marginLeft: 4}} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
             <Feather name="zap" size={18} color="#3B82F6" />
             <Text style={styles.recentTitle}>Recent Publishing Activity</Text>
          </View>
          
          <View style={styles.activityContainer}>
            {articles.length === 0 ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: '#64748B', fontFamily: 'Inter', fontSize: 13 }}>No recent activity</Text>
              </View>
            ) : (
              articles.slice(0, 3).map((act, index) => {
                const cleanTitle = act.title?.replace(/<[^>]+>/g, "") || 'Untitled';
                return (
                  <View key={act.id || index} style={[styles.activityRow, index === 2 && { borderBottomWidth: 0 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={styles.activityDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityTitle} numberOfLines={1}>Published &quot;{cleanTitle}&quot;</Text>
                        <Text style={styles.activityAuthor}>By {act.author || 'Admin'}</Text>
                      </View>
                    </View>
                    <Text style={styles.activityTime}>{act.date}</Text>
                  </View>
                );
              })
            )}
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 MindEase Mental Health Solutions. All rights reserved.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add/Edit Article Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'add' ? 'Publish Guide Article' : 'Edit Guide Article'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Title</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Understanding Anxiety & Stress"
                  value={articleTitle}
                  onChangeText={setArticleTitle}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Category</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Wellness, Anxiety, Therapy"
                  value={articleCategory}
                  onChangeText={setArticleCategory}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Content (Body Text)</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline]}
                  placeholder="Write the educational content here..."
                  multiline={true}
                  numberOfLines={12}
                  textAlignVertical="top"
                  value={articleContent}
                  onChangeText={setArticleContent}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooterActions}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSubmitBtn} 
                onPress={handleSaveArticle}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>
                    {modalMode === 'add' ? 'Publish' : 'Save Changes'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  addButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  statTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statTrend: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
  },
  toolbar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#0F172A',
  },
  filterBtn: {
    width: 42,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  th: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  td: {
    justifyContent: 'center',
  },
  imgPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 4,
  },
  articleId: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#94A3B8',
  },
  cellText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#475569',
  },
  cellTextPrimary: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 2,
  },
  cellTextSecondary: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#94A3B8',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  pageInfo: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  pageBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 8,
  },
  pageBtnActive: {
    backgroundColor: '#3B82F6',
  },
  pageBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#475569',
  },
  pageBtnTextActive: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pageEllipsis: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#94A3B8',
    paddingHorizontal: 4,
  },
  recentSection: {
    marginTop: 32,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  recentTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  activityTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  activityAuthor: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
  },
  activityTime: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#94A3B8',
  },
  footer: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 24,
    marginTop: 40,
  },
  footerText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  mobileCardContainer: {
    marginBottom: 20,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  articleCardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  imgPlaceholderMobile: {
    width: 48,
    height: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleCardHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  articleCardTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
    marginBottom: 2,
  },
  articleCardId: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#94A3B8',
  },
  articleCardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    marginBottom: 12,
  },
  detailRowMobile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  detailLabelMobile: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#94A3B8',
  },
  detailValueMobile: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#475569',
  },
  detailValueMobilePrimary: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
  },
  detailValueMobileSecondary: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#94A3B8',
  },
  articleCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleCardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtnMobile: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalForm: {
    padding: 24,
    gap: 18,
  },
  formField: {
    gap: 6,
  },
  formLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#0F172A',
  },
  formInputMultiline: {
    height: 180,
    textAlignVertical: 'top',
  },
  modalFooterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubmitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  modalSubmitBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
