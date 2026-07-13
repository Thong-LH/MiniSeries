import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform, Modal, Animated } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { QuizSection } from '../../components/QuizSection';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';
import { useTheme } from '../../hooks/use-theme';
import { useStudyTimer } from '../../hooks/useStudyTimer';

export default function LessonViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { themeId, triggerToast, isAuthenticated, setShouldRefreshHome } = useApp();
  const router = useRouter();

  // Kích hoạt bộ đếm thời gian học cụ thể
  useStudyTimer(id);

  const [loading, setLoading] = useState<boolean>(false);
  const [lessonData, setLessonData] = useState<any>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [fullscreenVisible, setFullscreenVisible] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const imgFadeAnim = useRef(new Animated.Value(0)).current;
  const [imgLoading, setImgLoading] = useState<boolean>(true);

  const colors = useTheme();
  const isDark = colors.isDark;

  const fetchLessonDetails = async () => {
    if (!isAuthenticated) return;
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
    if (!isAuthenticated) return;
    fetchLessonDetails();
    if (id) {
      apiClient.post('/analytics/track', { path: `/lesson/${id}`, deviceType: 'Mobile' }).catch(() => {});
    }
  }, [id, isAuthenticated]);


  useEffect(() => {
    fadeAnim.setValue(0.3);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Reset image load animation state
    setImgLoading(true);
    imgFadeAnim.setValue(0);

    // Save study progress to database
    if (lessonData && lessonData.id && chapters && chapters.length > 0) {
      apiClient.post('/progress/update', {
        lessonId: lessonData.id,
        lastReadChapterOrder: currentChapterIndex + 1,
        totalChapters: chapters.length
      })
      .then(() => {
        setShouldRefreshHome(true);
      })
      .catch(err => console.log('Error updating study progress:', err));
    }
  }, [currentChapterIndex, lessonData]);

  const isVideoMode = lessonData?.outputMode === 1 || lessonData?.outputMode === 'Video';
  const chapters = lessonData?.chapters ? [...lessonData.chapters].sort((a: any, b: any) => a.order - b.order) : [];
  const currentChapter = chapters[currentChapterIndex];

  const videoPlayer = useVideoPlayer(currentChapter?.videoUrl || '', player => {
    player.loop = true;
    player.play();
  });

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
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.bg }]}>
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
            style={[styles.topNavArrowBtn, { borderRightWidth: 1, borderRightColor: colors.border, opacity: currentChapterIndex === 0 ? 0.3 : 1 }]}
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
            style={[styles.topNavArrowBtn, { borderLeftWidth: 1, borderLeftColor: colors.border, opacity: currentChapterIndex === chapters.length - 1 ? 0.3 : 1 }]}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Animated container for smooth chapter lating transitions */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Clickable Media Frame to view details */}
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => {
              if (!isVideoMode && currentChapter?.mangaUrl) {
                setFullscreenVisible(true);
              }
            }}
            style={[styles.mediaFrame, { borderColor: colors.border, backgroundColor: isDark ? '#000000' : '#e2e8f0' }]}
          >
            {isVideoMode ? (
              currentChapter?.videoUrl ? (
                <VideoView
                  style={styles.videoPlayer}
                  player={videoPlayer}
                  allowsFullscreen
                  allowsPictureInPicture
                />
              ) : (
                <View style={styles.videoPlaceholderActive}>
                  <Ionicons name="film-outline" size={48} color="#94a3b8" />
                  <Text style={{ color: '#94a3b8', marginTop: 10, fontWeight: '700', fontSize: 12 }}>
                    Chưa tạo video cho chương {currentChapterIndex + 1}
                  </Text>
                </View>
              )
            ) : (
              currentChapter?.mangaUrl ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                  {imgLoading && (
                    <ActivityIndicator 
                      size="large" 
                      color={colors.primaryAccent} 
                      style={{ position: 'absolute', zIndex: 2 }} 
                    />
                  )}
                  <Animated.Image 
                    source={{ uri: currentChapter.mangaUrl }} 
                    style={[styles.mangaImage, { opacity: imgFadeAnim }]} 
                    onLoadEnd={() => {
                      setImgLoading(false);
                      Animated.timing(imgFadeAnim, {
                        toValue: 1,
                        duration: 350,
                        useNativeDriver: true,
                      }).start();
                    }}
                  />
                  <View style={styles.playOverlay}>
                    <Ionicons name="expand" size={32} color="#FFFFFF" />
                    <Text style={styles.playOverlayText}>BẤM ĐỂ PHÓNG TO</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.videoPlaceholderActive}>
                  <Ionicons name="image-outline" size={48} color="#94a3b8" />
                  <Text style={{ color: '#94a3b8', marginTop: 10, fontWeight: '700', fontSize: 12 }}>
                    Chưa có tranh manga cho chương {currentChapterIndex + 1}
                  </Text>
                </View>
              )
            )}
          </TouchableOpacity>

          {/* Chapter metadata / narration / summary */}
          {currentChapter && (
            <View style={[styles.chapterInfoCard, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: isDark ? '#000000' : '#0f172a' }]}>
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
        </Animated.View>

        {/* Interactive Quiz corresponding to the current chapter */}
        {parsedQuiz ? (
          <View style={styles.quizWrapper}>
            <QuizSection 
              key={currentChapterIndex}
              quiz={parsedQuiz}
              onComplete={() => {
                triggerToast('Tuyệt vời! Bạn đã trả lời đúng câu hỏi của chương này.');
                setShouldRefreshHome(true);
                if (currentChapter && currentChapter.quiz) {
                  apiClient.post('/progress/quiz-attempt', {
                    chapterId: currentChapter.id,
                    selectedOption: currentChapter.quiz.correctOption || 'A',
                    isCorrect: true
                  }).catch(err => console.log('Error saving quiz progress:', err));
                }
              }}
            />
          </View>
        ) : (
          <View style={[styles.emptyQuizBox, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800', fontStyle: 'italic', textAlign: 'center' }}>
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
                backgroundColor: 'transparent',
                opacity: currentChapterIndex === 0 ? 0.3 : 1,
              }
            ]}
          >
            <Text style={[styles.bottomNavBtnText, { color: colors.text }]}>
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
                borderColor: currentChapterIndex === chapters.length - 1 ? colors.border : colors.primaryAccent,
                backgroundColor: currentChapterIndex === chapters.length - 1 ? 'transparent' : colors.primaryAccent,
                opacity: currentChapterIndex === chapters.length - 1 ? 0.3 : 1,
              }
            ]}
          >
            <Text style={[styles.bottomNavBtnText, { color: currentChapterIndex === chapters.length - 1 ? colors.text : '#ffffff' }]}>
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
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFullscreenVisible(false)}
            style={[styles.fullscreenCloseBtnFloating, { borderColor: colors.border }]}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.zoomScrollContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {currentChapter?.mangaUrl && (
              <Image source={{ uri: currentChapter.mangaUrl }} style={styles.fullscreenMangaImage} />
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
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    borderWidth: 1,
    borderRadius: 8,
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
    borderWidth: 1,
    borderRadius: 12,
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
    borderWidth: 1,
    borderRadius: 16,
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
    opacity: 0,
  },
  playOverlayText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
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
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    borderWidth: 1,
    borderRadius: 16,
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
    borderWidth: 1,
    borderRadius: 10,
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
    borderWidth: 1,
    borderRadius: 8,
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
