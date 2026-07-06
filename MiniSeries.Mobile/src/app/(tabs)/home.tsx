import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Lesson } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const {
    themeId,
    setThemeId,
    lessons,
    mangaTokens,
    videoTokens,
    setViewingLesson,
    setViewerPage,
  } = useApp();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('Tất cả');

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
      router.push('/review');
    } else {
      setViewingLesson(lesson);
      setViewerPage(1);
      router.push(`/lesson/${lesson.id}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.brand, { color: colors.primaryAccent }]}>⚡ MINISERIES</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleTheme}
          style={[styles.themeToggle, { borderColor: colors.border }]}
        >
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Token Card */}
        <View style={[styles.tokenCard, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: colors.border }]}>
          <Text style={[styles.tokenHeader, { color: colors.text, borderBottomColor: colors.border }]}>
            🎟️ HẠN NGẠCH TOKENS CỦA BẠN
          </Text>
          <View style={styles.tokenRows}>
            <View style={styles.tokenRow}>
              <View style={styles.tokenLabelContainer}>
                <Text style={[styles.tokenLabel, { color: colors.text }]}>MANGA TOKENS</Text>
                <Text style={[styles.tokenCount, { color: colors.primaryAccent }]}>
                  {mangaTokens > 1000 ? '∞' : mangaTokens}
                </Text>
              </View>
              <View style={[styles.progressContainer, { borderColor: colors.border }]}>
                <View style={[styles.progressFill, { width: mangaTokens > 1000 ? '100%' : `${Math.min(mangaTokens * 3, 100)}%`, backgroundColor: colors.primaryAccent }]} />
              </View>
            </View>

            <View style={styles.tokenRow}>
              <View style={styles.tokenLabelContainer}>
                <Text style={[styles.tokenLabel, { color: colors.text }]}>VIDEO TOKENS</Text>
                <Text style={[styles.tokenCount, { color: colors.primaryAccent }]}>{videoTokens}</Text>
              </View>
              <View style={[styles.progressContainer, { borderColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${Math.min(videoTokens * 10, 100)}%`, backgroundColor: colors.primaryAccent }]} />
              </View>
            </View>
          </View>
        </View>

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

        {/* Grid List */}
        <View style={styles.gridContainer}>
          {filteredLessons.map((item) => (
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
        </View>
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
    flex: 1,
  },
  themeToggle: {
    borderWidth: 2,
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tokenCard: {
    borderWidth: 2,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  tokenHeader: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    borderBottomWidth: 2,
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
    fontSize: 10,
    fontWeight: '900',
  },
  tokenCount: {
    fontSize: 15,
    fontWeight: '900',
  },
  progressContainer: {
    height: 10,
    borderWidth: 2,
    justifyContent: 'center',
  },
  progressFill: {
    height: '100%',
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
    gap: 8,
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
  cardDuration: {
    fontSize: 11,
    fontWeight: '700',
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
});
