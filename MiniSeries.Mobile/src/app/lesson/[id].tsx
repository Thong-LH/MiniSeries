import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { QuizSection } from '../../components/QuizSection';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';

export default function LessonViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { themeId, triggerToast } = useApp();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [lessonData, setLessonData] = useState<any>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [fullscreenVisible, setFullscreenVisible] = useState<boolean>(false);

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
    if (id) {
      apiClient.post('/analytics/track', { path: `/lesson/${id}`, deviceType: 'Mobile' }).catch(() => {});
    }
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
          style={[styles.backBtn, { borderColor: colors.border, marginTop: 12 }]}
        >
          <Text style={{ color: colors.text, fontWeight: '900' }}>QUAY LẠI</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // OutputMode: Manga = 0, Video = 1 in C# backend
  const isVideoMode = lessonData.outputMode === 1 || lessonData.outputMode === 'Video';
  const chapters = lessonData.chapters ? [...lessonData.chapters].sort((a: any, b: any) => a.order - b.order) : [];
  const currentChapter = chapters[currentChapterIndex];

  // Parse quiz for current chapter
  const q = currentChapter?.quiz;
  let parsedQuiz = undefined;
  if (q) {
    const rawCorrect = (q.correctOption || '').trim().toUpperCase();
    const correctIdx = rawCorrect === 'A' ? 0 : rawCorrect === 'B' ? 1 : rawCorrect === 'C' ? 2 : 3;
    parsedQuiz = {
      question: q.question,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correctAnswer: correctIdx,
      explanation: q.explanation || 'Không có giải thích chi tiết.'
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Page / Chapter Counter with navigation arrows on top */}
        <View style={[styles.topCounterRow, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={currentChapterIndex === 0}
            onPress={() => {
              setCurrentChapterIndex(prev => prev - 1);
            }}
            style={[styles.topNavArrowBtn, { borderRightWidth: 2, borderRightColor: colors.border, opacity: currentChapterIndex === 0 ? 0.3 : 1 }]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.counterText, { color: colors.text }]}>
            PHÂN CẢNH {currentChapterIndex + 1} / {chapters.length}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={currentChapterIndex === chapters.length - 1}
            onPress={() => {
              setCurrentChapterIndex(prev => prev + 1);
            }}
            style={[styles.topNavArrowBtn, { borderLeftWidth: 2, borderLeftColor: colors.border, opacity: currentChapterIndex === chapters.length - 1 ? 0.3 : 1 }]}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Clickable Media Frame to view details */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setFullscreenVisible(true)}
          style={[styles.mediaFrame, { borderColor: colors.border, backgroundColor: '#000000' }]}
        >
          {isVideoMode ? (
            Platform.OS === 'web' && currentChapter?.videoUrl ? (
              <View style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
                <video
                  key={currentChapter.id}
                  src={currentChapter.videoUrl}
                  poster={lessonData.anchorImageUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600'}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <View style={styles.playOverlay}>
                  <Ionicons name="expand" size={32} color="#FFFFFF" />
                  <Text style={styles.playOverlayText}>Bấm để xem phóng to</Text>
                </View>
              </View>
            ) : currentChapter?.videoUrl ? (
              <View style={styles.videoPlaceholderActive}>
                <Ionicons name="play-circle" size={48} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', marginTop: 10, fontWeight: '700', fontSize: 12 }}>
                  Bấm để xem video chi tiết
                </Text>
              </View>
            ) : (
              <View style={styles.videoPlaceholderActive}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', marginTop: 12, fontWeight: '700', fontSize: 11 }}>ĐANG TẢI PHÂN CẢNH...</Text>
              </View>
            )
          ) : (
            currentChapter?.mangaUrl ? (
              <View style={{ width: '100%', height: '100%' }}>
                <Image 
                  source={{ uri: currentChapter.mangaUrl }} 
                  style={styles.mangaImage} 
                />
                <View style={styles.playOverlay}>
                  <Ionicons name="expand" size={32} color="#FFFFFF" />
                  <Text style={styles.playOverlayText}>Bấm để xem phóng to</Text>
                </View>
              </View>
            ) : (
              <View style={styles.videoPlaceholderActive}>
                <Ionicons name="image-outline" size={48} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', marginTop: 10, fontWeight: '700', fontSize: 12 }}>
                  Chưa có tranh manga cho chương {currentChapterIndex + 1}
                </Text>
              </View>
            )
          )}
        </TouchableOpacity>

        {/* Chapter metadata / narration / summary */}
        {currentChapter && (
          <View style={[styles.chapterInfoCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
            <Text style={[styles.chapterKicker, { color: colors.primaryAccent }]}>
              CHƯƠNG {currentChapter.order || currentChapterIndex + 1}
            </Text>
            <Text style={[styles.chapterTitle, { color: colors.text }]}>
              {currentChapter.title || `Chương ${currentChapter.order || currentChapterIndex + 1}`}
            </Text>
            <Text style={[styles.chapterSummary, { color: colors.text }]}>
              {currentChapter.summary}
            </Text>
          </View>
        )}

        {/* Interactive Quiz corresponding to the current chapter */}
        {parsedQuiz ? (
          <View style={styles.quizWrapper}>
            <QuizSection 
              key={currentChapterIndex}
              quiz={parsedQuiz}
              onComplete={() => {
                triggerToast('Tuyệt vời! Bạn đã trả lời đúng câu hỏi của chương này.');
              }}
            />
          </View>
        ) : (
          <View style={[styles.emptyQuizBox, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '900', fontStyle: 'italic', textAlign: 'center' }}>
              CHƯƠNG NÀY CHƯA CÓ CÂU HỎI TRẮC NGHIỆM.
            </Text>
          </View>
        )}

        {/* Bottom Navigation Buttons */}
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={currentChapterIndex === 0}
            onPress={() => {
              setCurrentChapterIndex(prev => prev - 1);
            }}
            style={[
              styles.bottomNavBtn,
              {
                borderColor: colors.border,
                backgroundColor: currentChapterIndex === 0 ? 'transparent' : colors.text,
                opacity: currentChapterIndex === 0 ? 0.3 : 1,
              }
            ]}
          >
            <Text style={[styles.bottomNavBtnText, { color: currentChapterIndex === 0 ? colors.text : colors.bg }]}>
              TRƯỚC
            </Text>
          </TouchableOpacity>

          <Text style={[styles.counterText, { color: colors.text }]}>
            {currentChapterIndex + 1} / {chapters.length}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={currentChapterIndex === chapters.length - 1}
            onPress={() => {
              setCurrentChapterIndex(prev => prev + 1);
            }}
            style={[
              styles.bottomNavBtn,
              {
                borderColor: colors.border,
                backgroundColor: currentChapterIndex === chapters.length - 1 ? 'transparent' : colors.text,
                opacity: currentChapterIndex === chapters.length - 1 ? 0.3 : 1,
              }
            ]}
          >
            <Text style={[styles.bottomNavBtnText, { color: currentChapterIndex === chapters.length - 1 ? colors.text : colors.bg }]}>
              TIẾP THEO
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fullscreen Zoomable Lightbox Modal */}
      <Modal
        visible={fullscreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenVisible(false)}
      >
        <View style={styles.fullscreenOverlay}>
          {/* Close Button Floating */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFullscreenVisible(false)}
            style={styles.fullscreenCloseBtnFloating}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Zoomable Content Area */}
          <ScrollView
            contentContainerStyle={styles.zoomScrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {isVideoMode ? (
              Platform.OS === 'web' && currentChapter?.videoUrl ? (
                <video
                  src={currentChapter.videoUrl}
                  controls
                  autoPlay
                  style={{ width: '100vw', height: '100vh', objectFit: 'contain' }}
                />
              ) : currentChapter?.videoUrl ? (
                <View style={styles.videoPlaceholderActive}>
                  <Ionicons name="videocam" size={64} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', marginTop: 16, fontWeight: '700' }}>
                    Video URL: {currentChapter.videoUrl}
                  </Text>
                </View>
              ) : (
                <ActivityIndicator size="large" color="#FFFFFF" />
              )
            ) : (
              currentChapter?.mangaUrl ? (
                <Image
                  source={{ uri: currentChapter.mangaUrl }}
                  style={styles.fullscreenMangaImage}
                />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Không có ảnh</Text>
              )
            )}
          </ScrollView>
        </View>
      </Modal>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  topCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    marginBottom: 16,
    height: 44,
  },
  topNavArrowBtn: {
    paddingHorizontal: 16,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mediaFrame: {
    height: 260,
    borderWidth: 2,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mangaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0, // hidden until hovered on Web, click feedback on mobile
  },
  playOverlayText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  videoPlaceholderActive: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  chapterInfoCard: {
    borderWidth: 2,
    padding: 16,
    marginBottom: 20,
  },
  chapterKicker: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  chapterSummary: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  quizWrapper: {
    marginBottom: 24,
  },
  emptyQuizBox: {
    borderWidth: 2,
    padding: 20,
    marginBottom: 24,
    borderStyle: 'dashed',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  bottomNavBtn: {
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  bottomNavBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // Fullscreen Modal Styles
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.98)',
    position: 'relative',
  },
  fullscreenCloseBtnFloating: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  zoomScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenMangaImage: {
    width: '100%',
    height: '100%',
    minWidth: 320,
    minHeight: 500,
    resizeMode: 'contain',
  },
});
