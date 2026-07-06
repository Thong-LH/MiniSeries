import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Lesson } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';

export default function HomeScreen() {
  const {
    lessons,
    setLessons,
    mangaTokens,
    videoTokens,
    setViewingLesson,
    setViewerPage,
    refreshProfile,
  } = useApp();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('Tất cả');
  const [loading, setLoading] = useState<boolean>(false);

  const colors = {
    bg: '#050811', // Deep dark cosmic blue/black matching Web
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: 'rgba(124, 58, 237, 0.3)',
    borderFocus: '#06b6d4',
    primaryAccent: '#6366f1',
    secondaryAccent: '#0ea5e9', // Cyan color matching Web
    cardBg: '#0d111d', // Very dark grey-blue matching Web
    inputBg: 'rgba(8, 12, 24, 0.75)',
  };

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/lessons/my');
      if (res.data && Array.isArray(res.data)) {
        const apiLessons: Lesson[] = res.data.map((dto: any) => {
          const isVideo = dto.outputMode === 0 || dto.outputMode === 'Video';
          const isApproved = dto.scriptStatus === 2 || dto.scriptStatus === 'Approved';
          return {
            id: dto.id,
            title: dto.title,
            type: isVideo ? 'video' : 'manga',
            duration: isVideo ? '2m 15s' : '5 panels',
            status: isApproved ? 'Hoàn thành' : 'Đang tạo',
            progress: isApproved ? 100 : 45,
            coverUrl: dto.anchorImageUrl || (isVideo
              ? 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600'
              : 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600'),
            description: dto.creativeBrief || 'Bài giảng tạo tự động bằng AI.'
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

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLessons();
      refreshProfile();
    });
    return unsubscribe;
  }, [navigation]);

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

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.status === 'Đang tạo') {
      router.push(`/review?lessonId=${lesson.id}`);
    } else {
      setViewingLesson(lesson);
      setViewerPage(1);
      router.push(`/lesson/${lesson.id}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background Glows */}
      <View style={styles.glowTop} />

      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.brand, { color: '#0ea5e9', fontWeight: '900' }]}>
          MINISERIES<Text style={{ color: '#d946ef' }}>LEARNING</Text>
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={fetchLessons}
          style={[styles.refreshToggle, { borderColor: colors.border }]}
        >
          <Ionicons name="refresh" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Token Card */}
        <View style={[styles.tokenCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
          <Text style={[styles.tokenHeader, { color: colors.text, borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
            🎟️ HẠN NGẠCH TOKENS CỦA BẠN
          </Text>
          <View style={styles.tokenRows}>
            <View style={styles.tokenRow}>
              <View style={styles.tokenLabelContainer}>
                <Text style={[styles.tokenLabel, { color: colors.textMuted }]}>MANGA TOKENS</Text>
                <Text style={[styles.tokenCount, { color: colors.secondaryAccent }]}>
                  {mangaTokens > 1000 ? '∞' : mangaTokens}
                </Text>
              </View>
              <View style={[styles.progressContainer, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                <View style={[styles.progressFill, { width: mangaTokens > 1000 ? '100%' : `${Math.min(mangaTokens * 3, 100)}%`, backgroundColor: colors.secondaryAccent }]} />
              </View>
            </View>

            <View style={styles.tokenRow}>
              <View style={styles.tokenLabelContainer}>
                <Text style={[styles.tokenLabel, { color: colors.textMuted }]}>VIDEO TOKENS</Text>
                <Text style={[styles.tokenCount, { color: colors.primaryAccent }]}>{videoTokens}</Text>
              </View>
              <View style={[styles.progressContainer, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                <View style={[styles.progressFill, { width: `${Math.min(videoTokens * 10, 100)}%`, backgroundColor: colors.primaryAccent }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <TextInput
            placeholder="Tìm kiếm bài giảng..."
            placeholderTextColor="#555"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { backgroundColor: colors.inputBg, borderColor: 'rgba(255,255,255,0.1)', color: colors.text }]}
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
                    backgroundColor: isSelected ? colors.primaryAccent : 'rgba(255,255,255,0.05)',
                    borderColor: isSelected ? colors.primaryAccent : colors.border,
                  }
                ]}
              >
                <Text style={[
                  styles.filterTabText,
                  { color: colors.text }
                ]}>
                  {filter.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Grid List */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.secondaryAccent} style={{ marginVertical: 32 }} />
        ) : filteredLessons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>Không tìm thấy bài giảng nào.</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredLessons.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => handleLessonClick(item)}
                style={[styles.lessonCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
              >
                <View style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                  <Image source={{ uri: item.coverUrl }} style={styles.cardImage} />
                </View>
                
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: item.type === 'manga' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(124, 58, 237, 0.15)', borderColor: item.type === 'manga' ? colors.secondaryAccent : colors.primaryAccent }]}>
                      <Text style={[styles.typeBadgeText, { color: item.type === 'manga' ? colors.secondaryAccent : colors.primaryAccent }]}>
                        {item.type === 'manga' ? '📖 MANGA' : '🎬 VIDEO'}
                      </Text>
                    </View>
                    <Text style={[styles.cardDuration, { color: colors.textMuted }]}>{item.duration}</Text>
                  </View>

                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <View style={styles.cardFooter}>
                    <View style={[
                      styles.statusBadge,
                      {
                        borderColor: item.status === 'Hoàn thành' ? '#10B981' :
                          item.status === 'Đang tạo' ? '#EF4444' : '#3B82F6',
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
                        <View style={[styles.cardProgressBg, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                          <View style={[styles.cardProgressFill, { width: `${item.progress}%`, backgroundColor: colors.secondaryAccent }]} />
                        </View>
                        <Text style={[styles.progressPercent, { color: colors.text }]}>{item.progress}%</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 48 : 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    flex: 1,
  },
  refreshToggle: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tokenCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  tokenHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 14,
  },
  tokenRows: {
    gap: 12,
  },
  tokenRow: {
    flexDirection: 'column',
    gap: 6,
  },
  tokenLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  tokenCount: {
    fontSize: 16,
    fontWeight: '900',
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterTab: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '800',
  },
  gridContainer: {
    gap: 20,
  },
  lessonCard: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
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
    marginBottom: 8,
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cardDuration: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
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
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
