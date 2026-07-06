import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';

export default function LessonViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { triggerToast } = useApp();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [lessonData, setLessonData] = useState<any>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [quizSelections, setQuizSelections] = useState<Record<number, string>>({});
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const colors = {
    bg: '#050811', // Deep dark cosmic blue/black matching Web background
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: 'rgba(124, 58, 237, 0.3)',
    borderFocus: '#06b6d4',
    primaryAccent: '#6366f1', // Indigo purple matching Web button
    secondaryAccent: '#0ea5e9', // Cyan
    cardBg: '#0d111d', // Very dark grey-blue matching Web card background
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
        <ActivityIndicator size="large" color={colors.secondaryAccent} />
        <Text style={{ color: colors.textMuted, marginTop: 12 }}>Đang tải bài học...</Text>
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

  const chapters = lessonData.chapters ? [...lessonData.chapters].sort((a: any, b: any) => a.order - b.order) : [];
  const currentChapter = chapters[currentChapterIndex];
  const isVideoMode = lessonData.outputMode === 0 || lessonData.outputMode === 'Video';

  const handleQuizSelect = (optionKey: string) => {
    setQuizSelections((prev) => ({
      ...prev,
      [currentChapterIndex]: optionKey,
    }));
  };

  const renderQuiz = (chapter: any) => {
    const quiz = chapter.quiz;
    if (!quiz) {
      return (
        <View style={styles.quizPanelEmpty}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Chapter này chưa có quiz.</Text>
        </View>
      );
    }

    const options = [
      { key: 'A', text: quiz.optionA },
      { key: 'B', text: quiz.optionB },
      { key: 'C', text: quiz.optionC },
      { key: 'D', text: quiz.optionD },
    ];

    const selected = quizSelections[currentChapterIndex];
    const correct = (quiz.correctOption || '').trim().toUpperCase().charAt(0);
    const hasAnswer = !!selected;

    return (
      <View style={[styles.quizPanel, { borderColor: 'rgba(255,255,255,0.08)' }]}>
        <Text style={[styles.quizTitle, { color: colors.secondaryAccent }]}>Quiz tương tác</Text>
        <Text style={[styles.quizQuestion, { color: colors.text }]}>{quiz.question}</Text>
        
        <View style={styles.quizOptions}>
          {options.map((opt) => {
            const isSelected = selected === opt.key;
            const isCorrect = hasAnswer && correct === opt.key;
            const isWrong = hasAnswer && isSelected && selected !== correct;

            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.8}
                disabled={hasAnswer}
                onPress={() => handleQuizSelect(opt.key)}
                style={[
                  styles.quizOption,
                  isSelected && styles.quizOptionSelected,
                  isCorrect && styles.quizOptionCorrect,
                  isWrong && styles.quizOptionWrong,
                ]}
              >
                <View style={[
                  styles.optionKeyCircle,
                  isSelected && styles.keyCircleSelected,
                  isCorrect && styles.keyCircleCorrect,
                  isWrong && styles.keyCircleWrong,
                ]}>
                  <Text style={styles.optionKeyText}>{opt.key}</Text>
                </View>
                <Text style={[styles.optionText, { color: colors.text }]}>{opt.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {hasAnswer && (
          <View style={[styles.feedbackContainer, selected === correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Text style={styles.feedbackTitle}>
              {selected === correct ? '✓ Đúng rồi!' : `✗ Chưa đúng. Đáp án đúng là ${correct}.`}
            </Text>
            {quiz.explanation && (
              <Text style={styles.feedbackDesc}>{quiz.explanation}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header Bar matching Web header */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)/home')}
          style={styles.backButtonCircle}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.brand, { color: '#0ea5e9', fontWeight: '900' }]}>
          MINISERIES<Text style={{ color: '#d946ef' }}>LEARNING</Text>
        </Text>
        <View style={styles.chapterIndicator}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800' }}>
            {currentChapterIndex + 1} / {chapters.length}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentChapter ? (
          <View style={[styles.readerCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(255,255,255,0.05)' }]}>
            
            {/* Media Section */}
            <View style={styles.mediaPanel}>
              {isVideoMode && (currentChapter.videoUrl || lessonData.anchorImageUrl) ? (
                <View style={styles.videoPlayer}>
                  <Image
                    source={{ uri: currentChapter.videoUrl || lessonData.anchorImageUrl }}
                    style={styles.mediaAsset}
                  />
                  <View style={styles.gradientOverlay} />
                  
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setIsPlaying(!isPlaying)}
                    style={styles.playButton}
                  >
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#FFFFFF" />
                  </TouchableOpacity>

                  {isPlaying && (
                    <View style={styles.captionOverlay}>
                      <Text style={styles.captionText}>
                        "{currentChapter.summary || 'Trình phát bài học video chuyển động.'}"
                      </Text>
                    </View>
                  )}
                </View>
              ) : !isVideoMode && (currentChapter.mangaUrl || lessonData.anchorImageUrl) ? (
                <View style={styles.mangaPanel}>
                  <Image
                    source={{ uri: currentChapter.mangaUrl || lessonData.anchorImageUrl }}
                    style={styles.mediaAsset}
                  />
                </View>
              ) : (
                <View style={styles.mediaEmpty}>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    Chưa có {isVideoMode ? 'video' : 'manga image'} cho chapter này.
                  </Text>
                </View>
              )}
            </View>

            {/* Details Section */}
            <View style={styles.detailPanel}>
              <Text style={styles.chapterKicker}>Chapter {currentChapter.order || currentChapterIndex + 1}</Text>
              <Text style={[styles.chapterTitle, { color: colors.text }]}>
                {currentChapter.title || `Chương ${currentChapter.order || currentChapterIndex + 1}`}
              </Text>
              <Text style={[styles.chapterSummary, { color: colors.textMuted }]}>
                {currentChapter.summary}
              </Text>
            </View>

            {/* Quiz Section */}
            {renderQuiz(currentChapter)}

            {/* Bottom Navigation matching Web */}
            <View style={styles.navigationRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={currentChapterIndex === 0}
                onPress={() => setCurrentChapterIndex((prev) => prev - 1)}
                style={[styles.navButton, currentChapterIndex === 0 && styles.navButtonDisabled]}
              >
                <Text style={styles.navButtonText}>← Chương trước</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/create')}
                style={[styles.navButton, styles.createPill]}
              >
                <Text style={styles.navButtonText}>✦ Tạo mới</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={currentChapterIndex === chapters.length - 1}
                onPress={() => setCurrentChapterIndex((prev) => prev + 1)}
                style={[styles.navButton, currentChapterIndex === chapters.length - 1 && styles.navButtonDisabled]}
              >
                <Text style={styles.navButtonText}>Chương tiếp →</Text>
              </TouchableOpacity>
            </View>

          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.textMuted }}>Bài giảng này chưa có chương nào.</Text>
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
    borderBottomWidth: 1,
  },
  backButtonCircle: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  brand: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  chapterIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  readerCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mediaPanel: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
  },
  mediaAsset: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mangaPanel: {
    width: '100%',
    height: '100%',
  },
  mediaEmpty: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 10,
    borderRadius: 8,
  },
  captionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  detailPanel: {
    padding: 16,
  },
  chapterKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7c3aed',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  chapterSummary: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  quizPanel: {
    borderTopWidth: 1,
    marginHorizontal: 16,
    paddingVertical: 16,
  },
  quizPanelEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  quizTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  quizQuestion: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 16,
  },
  quizOptions: {
    gap: 12,
  },
  quizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  quizOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  quizOptionCorrect: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  quizOptionWrong: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  optionKeyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  keyCircleSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  keyCircleCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  keyCircleWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
  },
  optionKeyText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  feedbackContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  feedbackCorrect: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  feedbackWrong: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  feedbackDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  navigationRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    gap: 8,
  },
  navButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPill: {
    backgroundColor: '#6366f1',
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  backBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
});
