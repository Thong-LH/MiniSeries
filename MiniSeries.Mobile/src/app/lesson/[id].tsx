import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { QuizSection } from '../../components/QuizSection';
import { Ionicons } from '@expo/vector-icons';

export default function LessonViewerScreen() {
  const { id } = useLocalSearchParams();
  const { themeId, viewingLesson, setLessons, triggerToast } = useApp();
  const router = useRouter();

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'content' | 'quiz'>('content');

  const isDark = themeId === 'bold-typography-dark';
  const colors = {
    bg: isDark ? '#121212' : '#FAF9F6',
    text: isDark ? '#FAF9F6' : '#1A1A1A',
    textMuted: isDark ? '#CFCFCF' : '#4A4A4A',
    border: isDark ? '#FFFFFF' : '#000000',
    primaryAccent: '#FF3E00',
    cardBg: isDark ? '#1a1a1a' : '#ffffff',
  };

  useEffect(() => {
    // Automatically update progress to 100% when entering and completing
    if (viewingLesson) {
      setLessons((prev) =>
        prev.map((item) =>
          item.id === viewingLesson.id ? { ...item, progress: 100, status: 'Hoàn thành' } : item
        )
      );
    }
  }, [viewingLesson]);

  if (!viewingLesson) {
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

  const mangaPanels = [
    {
      id: 1,
      title: 'Khung 1: Khởi đầu',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
      bubble: 'Hãy bắt đầu phân tách dữ liệu thành từng mảnh nhỏ gọi là Gói Tin nào!',
      bubblePosition: 'right',
      bubbleBg: isDark ? '#ffffff' : '#ffffff',
      bubbleTextColor: '#000000',
    },
    {
      id: 2,
      title: 'Khung 2: Gắn tiêu đề',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
      bubble: 'Mỗi gói tin cần gán Địa chỉ IP đích vào Header để Router nhận biết!',
      bubblePosition: 'left',
      bubbleBg: '#fef3c7', // amber-100
      bubbleTextColor: '#000000',
    },
    {
      id: 3,
      title: 'Khung 3: Đường đi tối ưu',
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
      bubble: 'Router sẽ kiểm tra bảng định tuyến để tìm hop đi tiếp ngắn nhất!',
      bubblePosition: 'right',
      bubbleBg: isDark ? '#ffffff' : '#ffffff',
      bubbleTextColor: '#000000',
    },
    {
      id: 4,
      title: 'Khung 4: Lắp ráp hoàn tất',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80',
      bubble: 'Các gói tin đã tới đích an toàn và tự ráp lại nguyên vẹn ban đầu!',
      bubblePosition: 'left',
      bubbleBg: '#d1fae5', // emerald-100
      bubbleTextColor: '#000000',
    },
  ];

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
          {viewingLesson.title.toUpperCase()}
        </Text>
      </View>

      {/* Segment Tab Selector */}
      <View style={styles.tabSelector}>
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
            {viewingLesson.type === 'manga' ? '📖 ĐỌC TRUYỆN TRANH' : '🎬 XEM VIDEO'}
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
            📝 BÀI TẬP TRẮC NGHIỆM
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content View */}
      {activeTab === 'content' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {viewingLesson.type === 'manga' ? (
            /* Manga Mode Strip */
            <View style={styles.mangaStrip}>
              {mangaPanels.map((panel) => (
                <View
                  key={panel.id}
                  style={[styles.panelCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
                >
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: panel.imageUrl }} style={styles.panelImage} />
                    <View style={styles.gradientOverlay} />
                    
                    <View style={[styles.frameBadge, { borderColor: colors.border, backgroundColor: colors.primaryAccent }]}>
                      <Text style={styles.frameBadgeText}>{panel.title}</Text>
                    </View>

                    <View style={[
                      styles.speechBubble,
                      {
                        borderColor: colors.border,
                        backgroundColor: panel.bubbleBg,
                      },
                      panel.bubblePosition === 'right' ? { right: 12 } : { left: 12 }
                    ]}>
                      <Text style={[styles.bubbleText, { color: panel.bubbleTextColor }]}>
                        "{panel.bubble}"
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              
              <Text style={[styles.caption, { color: colors.textMuted }]}>
                *Manga Mode: Diễn đạt bài giảng trực quan bằng hoạt họa truyện tranh Neo-Brutalist.
              </Text>
            </View>
          ) : (
            /* Video Mode Player */
            <View style={styles.videoSection}>
              <View style={[styles.videoPlayer, { borderColor: colors.border, backgroundColor: '#000000' }]}>
                <Image
                  source={{ uri: viewingLesson.coverUrl }}
                  style={[styles.videoPoster, { opacity: isPlaying ? 0.3 : 0.6 }]}
                />
                
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setIsPlaying(!isPlaying)}
                  style={[styles.playBtn, { borderColor: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.5)' }]}
                >
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFFFFF" />
                </TouchableOpacity>

                {isPlaying && (
                  <View style={styles.captionsContainer}>
                    <Text style={styles.videoCaptionText}>
                      "Chúng ta hãy đi vào bên trong router để xem các bảng định tuyến hoạt động nhé!"
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.caption, { color: colors.textMuted }]}>
                *Video Mode: Video mô phỏng chuyển động trực quan về luồng hoạt động của bài giảng.
              </Text>
            </View>
          )}

          {/* Lesson description */}
          <View style={[styles.descriptionCard, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: colors.border }]}>
            <Text style={[styles.descTitle, { color: colors.text }]}>MÔ TẢ NỘI DUNG</Text>
            <Text style={[styles.descBody, { color: colors.textMuted }]}>
              {viewingLesson.description}
            </Text>
          </View>
        </ScrollView>
      ) : (
        /* Quiz Mode */
        <QuizSection />
      )}
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
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    flex: 1,
  },
  tabSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  mangaStrip: {
    gap: 16,
    marginBottom: 20,
  },
  panelCard: {
    borderWidth: 2,
    height: 180,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  panelImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  frameBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 6,
    zIndex: 10,
  },
  frameBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  speechBubble: {
    position: 'absolute',
    bottom: 12,
    borderWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    maxWidth: '70%',
    zIndex: 10,
  },
  bubbleText: {
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 14,
  },
  caption: {
    fontSize: 10,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  videoSection: {
    marginBottom: 20,
  },
  videoPlayer: {
    borderWidth: 2,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  videoPoster: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  playBtn: {
    borderWidth: 2,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  captionsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  videoCaptionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  descriptionCard: {
    borderWidth: 2,
    padding: 16,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  descTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  descBody: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
