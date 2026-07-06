import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Animated } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Lesson } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';

export default function HomeScreen() {
  const {
    themeId,
    setThemeId,
    lessons,
    setLessons,
    mangaTokens,
    videoTokens,
    setViewingLesson,
    setViewerPage,
    refreshProfile,
  } = useApp();
  const router = useRouter();
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('Tất cả');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Slideshow state
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 4;

  const isDark = themeId === 'bold-typography-dark';
  const colors = {
    bg: isDark ? '#121212' : '#FAF9F6',
    text: isDark ? '#FAF9F6' : '#1A1A1A',
    textMuted: isDark ? '#CFCFCF' : '#4A4A4A',
    border: isDark ? '#FFFFFF' : '#000000',
    primaryAccent: '#FF3E00',
    cardBg: isDark ? '#1a1a1a' : '#ffffff',
    inputBg: isDark ? '#1e1e1e' : '#ffffff',
  };

  const toggleTheme = () => {
    setThemeId(isDark ? 'bold-typography' : 'bold-typography-dark');
  };

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/lessons/my');
      if (res.data && Array.isArray(res.data)) {
        const apiLessons: Lesson[] = res.data.map((dto: any) => {
          const isVideo = dto.outputMode === 1 || dto.outputMode === 'Video';
          const isApproved = dto.scriptStatus === 3 || dto.scriptStatus === 'Approved';
          return {
            id: dto.id,
            title: dto.title,
            type: isVideo ? 'video' : 'manga',
            duration: '', // Bỏ thời gian hiển thị random theo yêu cầu người dùng
            status: isApproved ? 'Hoàn thành' : 'Đang tạo',
            progress: isApproved ? 100 : 45,
            coverUrl: dto.thumbnailUrl || (isVideo
              ? 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600'
              : 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600'),
            description: dto.creativeBrief || 'Bài giảng tạo tự động.'
          };
        });
        setLessons(apiLessons);
      }
    } catch (err) {
      console.log('Lỗi tải danh sách bài học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLessons();
      refreshProfile();
    });
    return unsubscribe;
  }, [navigation]);

  // Real lessons for slideshow (limit to 5)
  const slideLessons = lessons.slice(0, 5);

  // Auto-slide effect
  useEffect(() => {
    if (slideLessons.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slideLessons.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slideLessons.length]);

  // Fade transition effect when slide changes
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
    ]).start();
  }, [currentSlideIndex]);

  // Filter lessons
  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lesson.description && lesson.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeFilter === 'Tất cả') return matchesSearch;
    if (activeFilter === 'Manga') return matchesSearch && lesson.type === 'manga';
    if (activeFilter === 'Video') return matchesSearch && lesson.type === 'video';
    if (activeFilter === 'Đang xử lý') return matchesSearch && lesson.status === 'Đang tạo';
    return matchesSearch;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredLessons.length / pageSize) || 1;
  const paginatedLessons = filteredLessons.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.status === 'Đang tạo') {
      router.push(`/review?lessonId=${lesson.id}`);
    } else {
      setViewingLesson(lesson);
      setViewerPage(1);
      router.push(`/lesson/${lesson.id}`);
    }
  };

  const handleNextSlide = () => {
    if (slideLessons.length === 0) return;
    setCurrentSlideIndex((prev) => (prev + 1) % slideLessons.length);
  };

  const handlePrevSlide = () => {
    if (slideLessons.length === 0) return;
    setCurrentSlideIndex((prev) => (prev - 1 + slideLessons.length) % slideLessons.length);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Unified Header Bar with Professional Token Icons */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.brand, { color: colors.text }]}>MINISERIES</Text>
        
        {/* Token Badge on Header using professional Ionicons */}
        <View style={[styles.headerTokenBadge, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
          <Ionicons name="book-outline" size={13} color={colors.text} style={{ marginRight: 2 }} />
          <Text style={[styles.headerTokenText, { color: colors.text }]}>
            {mangaTokens > 1000 ? '∞' : mangaTokens}
          </Text>
          <Text style={{ color: colors.textMuted, marginHorizontal: 6, fontSize: 10 }}>|</Text>
          <Ionicons name="film-outline" size={13} color={colors.text} style={{ marginRight: 2 }} />
          <Text style={[styles.headerTokenText, { color: colors.text }]}>
            {videoTokens}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={fetchLessons}
            style={[styles.headerButton, { borderColor: colors.border, marginRight: 8 }]}
          >
            <Ionicons name="refresh" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleTheme}
            style={[styles.headerButton, { borderColor: colors.border }]}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Carousel Slide Show */}
        {slideLessons.length > 0 && (
          <View style={[styles.slideshowCard, { borderColor: colors.border }]}>
            <View style={styles.slideContainer}>
              <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
                <Image source={{ uri: slideLessons[currentSlideIndex].coverUrl }} style={styles.slideImage} />
                
                {/* Text name overlay at bottom of image */}
                <View style={[styles.slideTextContainer, { backgroundColor: 'rgba(0,0,0,0.75)', borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={styles.slideTitle} numberOfLines={1}>
                    {slideLessons[currentSlideIndex].title.toUpperCase()}
                  </Text>
                </View>
              </Animated.View>
              
              {/* Left & Right absolute flanking arrows */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePrevSlide}
                style={[styles.arrowBtn, styles.leftArrow, { backgroundColor: colors.bg, borderColor: colors.border }]}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleNextSlide}
                style={[styles.arrowBtn, styles.rightArrow, { backgroundColor: colors.bg, borderColor: colors.border }]}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Pagination Indicators (5 dots below) */}
            <View style={styles.dotsContainer}>
              {slideLessons.map((_, idx) => {
                const isActive = idx === currentSlideIndex;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isActive ? colors.primaryAccent : colors.textMuted,
                        borderColor: colors.border,
                        borderWidth: isActive ? 1.5 : 1,
                      }
                    ]}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <TextInput
            placeholder="Tìm kiếm bài giảng..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
          />
        </View>

        {/* Filters Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {['Tất cả', 'Manga', 'Video', 'Đang xử lý'].map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: isSelected ? colors.text : 'transparent',
                    borderColor: colors.border,
                  }
                ]}
              >
                <Text style={[
                  styles.filterTabText,
                  { color: isSelected ? colors.bg : colors.text }
                ]}>
                  {filter.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Grid List with Paginated Lessons */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryAccent} style={{ marginVertical: 30 }} />
        ) : paginatedLessons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>KHÔNG TÌM THẤY BÀI GIẢNG NÀO.</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {paginatedLessons.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => handleLessonClick(item)}
                style={[styles.lessonCard, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: colors.border }]}
              >
                <View style={{ borderBottomWidth: 2, borderBottomColor: colors.border }}>
                  <Image source={{ uri: item.coverUrl }} style={styles.cardImage} />
                </View>
                
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.typeBadge, { borderColor: colors.border, backgroundColor: colors.text }]}>
                      <Text style={[styles.typeBadgeText, { color: colors.bg }]}>
                        {item.type === 'manga' ? 'MANGA' : 'VIDEO'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <View style={styles.cardFooter}>
                    <View style={[
                      styles.statusBadge,
                      {
                        borderColor: colors.border,
                        backgroundColor: item.status === 'Hoàn thành' ? 'rgba(16, 185, 129, 0.15)' :
                          item.status === 'Đang tạo' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'
                      }
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        {
                          color: item.status === 'Hoàn thành' ? '#10B981' :
                            item.status === 'Đang tạo' ? '#EF4444' : '#3B82F6'
                        }
                      ]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                    
                    {item.progress !== undefined && (
                      <View style={styles.progressRow}>
                        <View style={[styles.cardProgressBg, { borderColor: colors.border }]}>
                          <View style={[styles.cardProgressFill, { width: `${item.progress}%`, backgroundColor: colors.primaryAccent }]} />
                        </View>
                        <Text style={[styles.progressPercent, { color: colors.text }]}>{item.progress}%</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {/* Neo-Brutalist Pagination Controls (Always show if there are lessons) */}
            {filteredLessons.length > 0 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  style={[
                    styles.pageBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: currentPage === 1 ? 'transparent' : colors.text,
                      opacity: currentPage === 1 ? 0.3 : 1
                    }
                  ]}
                >
                  <Text style={[styles.pageBtnText, { color: currentPage === 1 ? colors.text : colors.bg }]}>TRƯỚC</Text>
                </TouchableOpacity>

                <Text style={[styles.pageIndicator, { color: colors.text }]}>
                  TRANG {currentPage} / {totalPages}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  style={[
                    styles.pageBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: currentPage === totalPages ? 'transparent' : colors.text,
                      opacity: currentPage === totalPages ? 0.3 : 1
                    }
                  ]}
                >
                  <Text style={[styles.pageBtnText, { color: currentPage === totalPages ? colors.text : colors.bg }]}>SAU</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerTokenBadge: {
    borderWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTokenText: {
    fontSize: 11,
    fontWeight: '900',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  slideshowCard: {
    marginBottom: 20,
  },
  slideContainer: {
    height: 180,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  arrowBtn: {
    position: 'absolute',
    top: '40%',
    width: 32,
    height: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  leftArrow: {
    left: 12,
  },
  rightArrow: {
    right: 12,
  },
  slideTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 2,
    padding: 14,
    fontSize: 14,
    fontWeight: '700',
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterTab: {
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  filterTabText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gridContainer: {
    gap: 16,
  },
  lessonCard: {
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardProgressBg: {
    width: 60,
    height: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  cardProgressFill: {
    height: '100%',
  },
  progressPercent: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  pageBtn: {
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  pageBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pageIndicator: {
    fontSize: 11,
    fontWeight: '900',
  },
});
