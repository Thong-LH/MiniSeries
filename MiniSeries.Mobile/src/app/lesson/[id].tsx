import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { QuizSection } from '../../components/QuizSection';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';

interface MangaPanel {
  id: string | number;
  title: string;
  imageUrl: string;
  bubble: string;
  bubblePosition: 'left' | 'right';
  bubbleBg: string;
  bubbleTextColor: string;
}

export default function LessonViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { themeId, triggerToast } = useApp();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [lessonData, setLessonData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'quiz'>('content');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const isDark = themeId === 'bold-typography-dark';
  const colors = {
    bg: isDark ? '#121212' : '#FAF9F6',
    text: isDark ? '#FAF9F6' : '#1A1A1A',
    textMuted: isDark ? '#CFCFCF' : '#4A4A4A',
    border: isDark ? '#FFFFFF' : '#000000',
    primaryAccent: '#FF3E00',
    cardBg: isDark ? '#1a1a1a' : '#ffffff',
  };

  const fetchLessonDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/lessons/${id}`);
      if (res.data) {
        setLessonData(res.data);
      }
    } catch (err) {
      console.log('Lỗi tải chi tiết bài học:', err);
      triggerToast('Không thể tải nội dung bài học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessonDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primaryAccent} />
        <Text style={{ color: colors.textMuted, marginTop: 12, fontWeight: '700' }}>ĐANG TẢI BÀI HỌC...</Text>
      </View>
    );
  }

  if (!lessonData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text, fontWeight: 'bold' }}>Không tìm thấy bài giảng!</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)/home')}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.text, fontWeight: '900' }}>QUAY LẠI</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isVideoMode = lessonData.outputMode === 0 || lessonData.outputMode === 'Video';

  // Map backend chapters to manga panels structure
  const mangaPanels: MangaPanel[] = (lessonData.chapters || []).map((ch: any, idx: number) => ({
    id: ch.id || idx,
    title: `Khung ${ch.order || idx + 1}`,
    imageUrl: ch.mangaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
    bubble: ch.summary || 'Đang cập nhật kiến thức...',
    bubblePosition: idx % 2 === 0 ? 'right' : 'left',
    bubbleBg: '#ffffff',
    bubbleTextColor: '#000000',
  }));

  // Parse backend quiz
  const chaptersWithQuiz = lessonData.chapters ? lessonData.chapters.filter((c: any) => c.quiz) : [];
  const apiQuizDto = chaptersWithQuiz.length > 0 ? chaptersWithQuiz[0].quiz : null;

  let parsedQuiz = undefined;
  if (apiQuizDto) {
    const rawCorrect = (apiQuizDto.correctOption || '').trim().toUpperCase();
    const correctIdx = rawCorrect === 'A' ? 0 : rawCorrect === 'B' ? 1 : rawCorrect === 'C' ? 2 : 3;

    parsedQuiz = {
      question: apiQuizDto.question,
      options: [apiQuizDto.optionA, apiQuizDto.optionB, apiQuizDto.optionC, apiQuizDto.optionD],
      correctAnswer: correctIdx,
      explanation: apiQuizDto.explanation || 'Không có giải thích chi tiết.'
    };
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)/home')}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.brand, { color: colors.text }]} numberOfLines={1}>
          {lessonData.title?.toUpperCase() || 'XEM BÀI HỌC'}
        </Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('content')}
          style={[
            styles.tab,
            {
              backgroundColor: activeTab === 'content' ? colors.text : 'transparent',
              borderColor: colors.border,
            }
          ]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'content' ? colors.bg : colors.text }]}>
            NỘI DUNG BÀI HỌC
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('quiz')}
          style={[
            styles.tab,
            {
              backgroundColor: activeTab === 'quiz' ? colors.text : 'transparent',
              borderColor: colors.border,
            }
          ]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'quiz' ? colors.bg : colors.text }]}>
            TRẮC NGHIỆM
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main content viewport */}
      <View style={styles.mainViewport}>
        {activeTab === 'content' ? (
          isVideoMode ? (
            /* Video Mode Player */
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={[styles.videoPlayer, { borderColor: colors.border, backgroundColor: '#000000' }]}>
                {isPlaying ? (
                  <View style={styles.videoPlaceholderActive}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', marginTop: 12, fontWeight: '700', fontSize: 11 }}>ĐANG TẢI STREAM VIDEO...</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setIsPlaying(true)}
                    style={styles.videoPlaceholderEmpty}
                  >
                    <Image
                      source={{ uri: lessonData.anchorImageUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600' }}
                      style={styles.videoPoster}
                    />
                    <View style={[styles.playBtnCircle, { borderColor: '#FFFFFF' }]}>
                      <Ionicons name="play" size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.videoInfo, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
                <Text style={[styles.videoTitle, { color: colors.text }]}>{lessonData.title}</Text>
                <Text style={[styles.videoDesc, { color: colors.textMuted }]}>
                  {lessonData.creativeBrief || 'Bài giảng hoạt hình tương tác sinh động.'}
                </Text>
              </View>
            </ScrollView>
          ) : (
            /* Manga Mode Viewer */
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.mangaStrip}>
                {mangaPanels.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={{ color: colors.textMuted, fontWeight: '700' }}>ĐANG TẢI TRANH MANGA...</Text>
                  </View>
                ) : (
                  mangaPanels.map((panel) => (
                    <View
                      key={panel.id}
                      style={[styles.panelCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
                    >
                      <Image source={{ uri: panel.imageUrl }} style={styles.panelImage} />
                      
                      {/* Subtitle speech bubble */}
                      <View style={[
                        styles.bubbleContainer,
                        panel.bubblePosition === 'right' ? styles.bubbleRight : styles.bubbleLeft
                      ]}>
                        <View style={[
                          styles.speechBubble,
                          {
                            backgroundColor: panel.bubbleBg,
                            borderColor: colors.border,
                          }
                        ]}>
                          <Text style={[styles.bubbleText, { color: panel.bubbleTextColor }]}>
                            {panel.bubble}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          )
        ) : (
          /* Quiz Interactive Section */
          <QuizSection 
            quiz={parsedQuiz} 
            onComplete={() => {
              triggerToast('Tuyệt vời! Bạn đã vượt qua bài học thành công.');
            }}
          />
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderColor: '#000000',
  },
  tab: {
    flex: 1,
    borderWidth: 0,
    borderRightWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mainViewport: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  videoPlayer: {
    height: 200,
    borderWidth: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  videoPlaceholderEmpty: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPoster: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.8,
  },
  playBtnCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  videoPlaceholderActive: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    borderWidth: 2,
    padding: 16,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  videoDesc: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  mangaStrip: {
    gap: 20,
  },
  panelCard: {
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  panelImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  bubbleContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
  },
  bubbleLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRight: {
    justifyContent: 'flex-end',
  },
  speechBubble: {
    borderWidth: 2,
    padding: 10,
    maxWidth: '85%',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  bubbleText: {
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 16,
  },
  emptyContainer: {
    padding: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
