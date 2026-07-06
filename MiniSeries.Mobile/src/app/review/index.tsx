import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { mockScenes } from '../../data';
import { Lesson } from '../../types';

export default function ReviewScreen() {
  const {
    themeId,
    lessonTitle,
    setLessonTitle,
    lessonContent,
    setLessonContent,
    selectedFormat,
    mangaTokens,
    setMangaTokens,
    videoTokens,
    setVideoTokens,
    setLessons,
    setViewingLesson,
    triggerToast,
  } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'summary' | 'scenes'>('scenes');

  const isDark = themeId === 'bold-typography-dark';
  const colors = {
    bg: isDark ? '#121212' : '#FAF9F6',
    text: isDark ? '#FAF9F6' : '#1A1A1A',
    textMuted: isDark ? '#CFCFCF' : '#4A4A4A',
    border: isDark ? '#FFFFFF' : '#000000',
    primaryAccent: '#FF3E00',
    cardBg: isDark ? '#1a1a1a' : '#ffffff',
  };

  const handleCancel = () => {
    setLessonTitle('');
    setLessonContent('');
    triggerToast('Đã hủy kịch bản nháp.');
    router.replace('/(tabs)/home');
  };

  const handleApprove = () => {
    // Check tokens
    if (selectedFormat === 'manga' && mangaTokens < 1) {
      triggerToast('Bạn không đủ Manga Token! Vui lòng nâng cấp gói.');
      return;
    }
    if (selectedFormat === 'video' && videoTokens < 1) {
      triggerToast('Bạn không đủ Video Token! Vui lòng nâng cấp gói.');
      return;
    }

    // Deduct token
    if (selectedFormat === 'manga') {
      setMangaTokens((prev) => (prev > 1000 ? prev : prev - 1));
    } else {
      setVideoTokens((prev) => prev - 1);
    }

    // Create new lesson
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: lessonTitle || 'Định tuyến gói tin nâng cao',
      type: selectedFormat,
      duration: selectedFormat === 'manga' ? '15 trang' : '1m 30s',
      status: 'Đang học',
      progress: 0,
      coverUrl: selectedFormat === 'manga'
        ? 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      description: lessonContent || 'Một bài học trực quan sinh động được tạo bởi trợ lý AI MiniSeries.'
    };

    setLessons((prev) => [newLesson, ...prev]);
    setViewingLesson(newLesson);

    // Clean up forms
    setLessonTitle('');
    setLessonContent('');

    triggerToast('Phê duyệt thành công! Bài học mới đã sẵn sàng.');
    router.replace('/(tabs)/home');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.brand, { color: colors.text }]}>📋 DUYỆT KỊCH BẢN</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={[styles.infoCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            {lessonTitle || 'Định tuyến gói tin nâng cao'}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { borderColor: colors.border, backgroundColor: colors.text }]}>
              <Text style={[styles.badgeText, { color: colors.bg }]}>
                {selectedFormat === 'manga' ? '📖 MANGA WEBTOON' : '🎬 VIDEO NGẮN'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab switchers */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('summary')}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === 'summary' ? colors.text : 'transparent',
                borderColor: colors.border,
              }
            ]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'summary' ? colors.bg : colors.text }]}>
              TÓM TẮT KỊCH BẢN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('scenes')}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === 'scenes' ? colors.text : 'transparent',
                borderColor: colors.border,
              }
            ]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'scenes' ? colors.bg : colors.text }]}>
              KỊCH BẢN CHI TIẾT
            </Text>
          </TouchableOpacity>
        </View>

        {/* Outline Summary view */}
        {activeTab === 'summary' ? (
          <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>🎯 MỤC TIÊU BÀI GIẢNG</Text>
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>
              Giúp người học tiếp thu một cách trực quan các khái niệm kỹ thuật khô khan thông qua cốt truyện hoạt hình/truyện tranh lôi cuốn, tăng khả năng ghi nhớ lên 200%.
            </Text>

            <View style={[styles.divider, { borderTopColor: colors.border }]} />

            <Text style={[styles.cardTitle, { color: colors.text }]}>👥 ĐỐI TƯỢNG HƯỚNG TỚI</Text>
            <Text style={[styles.cardBody, { color: colors.textMuted }]}>
              Học sinh, sinh viên ngành Công nghệ thông tin hoặc kỹ sư mạng đang chuẩn bị cho kỳ thi chứng chỉ chuyên ngành.
            </Text>
          </View>
        ) : (
          /* Scene list view */
          <View style={styles.scenesList}>
            {mockScenes.map((scene) => (
              <View
                key={scene.number}
                style={[styles.sceneCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
              >
                <Text style={[styles.sceneNum, { color: colors.primaryAccent, borderBottomColor: colors.border }]}>
                  SCENE {scene.number}: {scene.title.toUpperCase()} ({scene.duration})
                </Text>

                <View style={styles.sceneContent}>
                  <View style={styles.sceneSection}>
                    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>🎨 HÌNH ẢNH (VISUAL)</Text>
                    <Text style={[styles.sectionVal, { color: colors.text }]}>{scene.visual}</Text>
                  </View>

                  <View style={styles.sceneSection}>
                    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>🎙️ THUYẾT MINH (NARRATOR)</Text>
                    <Text style={[styles.sectionVal, { color: colors.text }]}>{scene.narrator}</Text>
                  </View>

                  <View style={styles.sceneSection}>
                    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>⚡ HÀNH ĐỘNG (ACTION)</Text>
                    <Text style={[styles.sectionVal, { color: colors.text }]}>{scene.action}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Approve / Cancel actions */}
      <View style={[styles.actionsContainer, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleApprove}
          style={[styles.actionBtn, { backgroundColor: colors.primaryAccent, borderColor: colors.border }]}
        >
          <Text style={styles.actionBtnText}>PHÊ DUYỆT & XUẤT BẢN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCancel}
          style={[styles.actionBtn, { backgroundColor: 'transparent', borderColor: colors.border }]}
        >
          <Text style={[styles.actionBtnText, { color: colors.text }]}>HỦY KỊCH BẢN</Text>
        </TouchableOpacity>
      </View>
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
  },
  brand: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140, // Space for bottom buttons
  },
  infoCard: {
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: 2,
    padding: 16,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  divider: {
    borderTopWidth: 2,
    marginVertical: 14,
  },
  scenesList: {
    gap: 16,
  },
  sceneCard: {
    borderWidth: 2,
  },
  sceneNum: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    padding: 10,
    borderBottomWidth: 2,
  },
  sceneContent: {
    padding: 12,
    gap: 12,
  },
  sceneSection: {
    flexDirection: 'column',
    gap: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionVal: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    padding: 16,
    gap: 12,
  },
  actionBtn: {
    borderWidth: 2,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
});
