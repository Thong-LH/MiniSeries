import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { apiClient } from '../../services/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { SpaceBackground } from '../../components/SpaceBackground';
import { useTheme } from '../../hooks/use-theme';
import { LevelAvatar } from '../../components/LevelAvatar';

export default function CreateScreen() {
  const {
    themeId,
    setThemeId,
    lessonTitle,
    setLessonTitle,
    lessonContent,
    setLessonContent,
    selectedFormat,
    setSelectedFormat,
    setIsGenerating,
    setGenerationStep,
    mangaTokens,
    videoTokens,
    triggerToast,
    refreshProfile,
    updateStatsFromData,
    globalStreak,
  } = useApp();
  const router = useRouter();
  const navigation = useNavigation();
  const [vibe, setVibe] = useState<string>('manga');

  const colors = useTheme();
  const isDark = colors.isDark;

  const toggleTheme = () => {
    setThemeId(isDark ? 'bold-typography' : 'bold-typography-dark');
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await apiClient.get('/progress/dashboard');
      if (res.data) {
        updateStatsFromData(res.data);
      }
    } catch (e) {
      console.log('Error fetching dashboard stats in create:', e);
    }
  };

  const renderStreakFlame = (streakCount: number, size: number = 14) => {
    if (streakCount === 0) {
      return <Text style={{ fontSize: size, opacity: 0.35 }}>❄️</Text>;
    }
    if (streakCount < 3) {
      return <Text style={{ fontSize: size }}>🔥</Text>;
    }
    if (streakCount < 7) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: size }}>🔥</Text>
          <Text style={{ fontSize: size - 2, color: '#eab308', marginLeft: -2 }}>⚡</Text>
        </View>
      );
    }
    if (streakCount < 30) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: size }}>🔥</Text>
          <Text style={{ fontSize: size - 4, color: '#38bdf8', marginHorizontal: -2 }}>✨</Text>
          <Text style={{ fontSize: size }}>🔥</Text>
        </View>
      );
    }
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size - 6, marginBottom: -3 }}>👑</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: size - 4, color: '#a855f7' }}>✨</Text>
          <Text style={{ fontSize: size + 2 }}>🔥</Text>
          <Text style={{ fontSize: size - 4, color: '#a855f7' }}>✨</Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshProfile();
      fetchDashboardStats();
      apiClient.post('/analytics/track', { path: '/create', deviceType: 'Mobile' }).catch(() => {});
    });
    return unsubscribe;
  }, [navigation]);

  const handleStartGeneration = async () => {
    if (!lessonTitle.trim()) {
      triggerToast('Vui lòng nhập tiêu đề bài học!');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Đang phân tích nội dung bài học...');

    try {
      const res = await apiClient.post('/lessons/drafts', {
        title: lessonTitle.trim(),
        rawContent: lessonContent.trim() || `Tạo bài giảng về chủ đề: ${lessonTitle.trim()}`,
        generateVideo: selectedFormat === 'video',
        creativeMode: 0, 
        creativeBrief: 'Vibe style: ' + vibe,
      });

      const data = res.data;
      if (data && data.id) {
        setLessonTitle('');
        setLessonContent('');
        triggerToast('Tạo kịch bản nháp thành công!');
        setIsGenerating(false);
        router.replace({
          pathname: '/review',
          params: { lessonId: data.id }
        });
      } else {
        triggerToast('Lỗi tạo kịch bản, vui lòng thử lại.');
        setIsGenerating(false);
      }
    } catch (err: any) {
      console.log('Lỗi tạo bài học:', err);
      const errMsg = err.response?.data?.message || 'Không thể tạo kịch bản, vui lòng kiểm tra kết nối.';
      triggerToast(errMsg);
      setIsGenerating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <SpaceBackground plain={true} />
       {/* Unified Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBg }]}>
        <Text style={[styles.brand, { color: colors.text }]}>MINISERIES</Text>
        
        <View style={styles.headerRightBadges}>
          {/* Token Badge */}
          <View style={[styles.headerTokenBadge, { borderColor: colors.border, backgroundColor: colors.bg }]}>
            <Ionicons name="book-outline" size={14} color={colors.text} style={{ marginRight: 4 }} />
            <Text style={[styles.headerTokenText, { color: colors.text }]}>
              {mangaTokens > 1000 ? '∞' : mangaTokens}
            </Text>
            <Text style={{ color: colors.textMuted, marginHorizontal: 6, fontSize: 13 }}>|</Text>
            <Ionicons name="film-outline" size={14} color={colors.text} style={{ marginRight: 4 }} />
            <Text style={[styles.headerTokenText, { color: colors.text }]}>
              {videoTokens}
            </Text>
          </View>

          {/* Gamified Level Avatar with Circular Progress */}
          <LevelAvatar />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: isDark ? '#000000' : '#0f172a' }]}>
          <Text style={[styles.cardHeader, { color: colors.text, borderBottomColor: colors.border }]}>
            TẠO BÀI HỌC MỚI
          </Text>

          <View style={styles.form}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>TIÊU ĐỀ BÀI HỌC</Text>
              <TextInput
                placeholder="Ví dụ: Lập trình hướng đối tượng là gì..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={lessonTitle}
                onChangeText={setLessonTitle}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />
            </View>

            {/* Context Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>TÀI LIỆU HOẶC YÊU CẦU NỘI DUNG (TÙY CHỌN)</Text>
              <TextInput
                multiline
                numberOfLines={6}
                placeholder="Dán nội dung bài học hoặc các lưu ý của bạn tại đây..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={lessonContent}
                onChangeText={setLessonContent}
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }
                ]}
              />
            </View>

            {/* Vibe Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>PHONG CÁCH TRUYỀN TẢI (VIBE STYLE)</Text>
              <View style={styles.vibeGrid}>
                {[
                  { id: 'manga', name: 'Manga', icon: '🎨', color: '#f27d26', desc: 'Nhật Bản cổ điển' },
                  { id: 'scifi', name: 'Cosmic', icon: '🌌', color: '#3b82f6', desc: 'Vũ trụ huyền ảo' },
                  { id: 'retro', name: 'Retro', icon: '🕹️', color: '#ec4899', desc: 'Neon 8-bit hoài niệm' },
                  { id: 'medieval', name: 'Alchemy', icon: '🧪', color: '#10b981', desc: 'Giả kim cổ xưa' }
                ].map((v) => {
                  const isSelected = vibe === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      activeOpacity={0.8}
                      onPress={() => setVibe(v.id)}
                      style={[
                        styles.vibeCard,
                        {
                          borderColor: isSelected ? v.color : colors.border,
                          backgroundColor: isSelected ? `${v.color}15` : colors.inputBg,
                        }
                      ]}
                    >
                      <Text style={styles.vibeIcon}>{v.icon}</Text>
                      <View style={styles.vibeInfo}>
                        <Text style={[styles.vibeName, { color: isSelected ? v.color : colors.text }]}>
                          {v.name.toUpperCase()}
                        </Text>
                        <Text style={[styles.vibeDesc, { color: colors.textMuted }]} numberOfLines={1}>
                          {v.desc}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Format Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>ĐỊNH DẠNG SẢN PHẨM</Text>
              <View style={styles.formatButtons}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedFormat('video')}
                  style={[
                    styles.formatButton,
                    {
                      backgroundColor: selectedFormat === 'video' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                      borderColor: selectedFormat === 'video' ? '#06b6d4' : colors.border,
                    }
                  ]}
                >
                  <Text style={[
                    styles.formatButtonText,
                    { color: selectedFormat === 'video' ? '#06b6d4' : colors.text }
                  ]}>
                    VIDEO NGẮN
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedFormat('manga')}
                  style={[
                    styles.formatButton,
                    {
                      backgroundColor: selectedFormat === 'manga' ? 'rgba(242, 125, 38, 0.15)' : 'transparent',
                      borderColor: selectedFormat === 'manga' ? '#f27d26' : colors.border,
                    }
                  ]}
                >
                  <Text style={[
                    styles.formatButtonText,
                    { color: selectedFormat === 'manga' ? '#f27d26' : colors.text }
                  ]}>
                    MANGA WEBTOON
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleStartGeneration}
              style={[styles.submitBtn, { backgroundColor: colors.primaryAccent }]}
            >
              <Text style={[styles.submitBtnText, { color: colors.buttonTextActive }]}>TẠO KỊCH BẢN NHÁP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Report System Issue Button (Product creation section) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/support?mode=issue')}
          style={[styles.issueBtn, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: isDark ? '#000000' : '#0f172a' }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
            <Text style={[styles.issueBtnText, { color: colors.text }]}>BÁO CÁO SỰ CỐ / LỖI HỆ THỐNG</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Fullscreen Loading overlay */}
      <LoadingOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '900',
  },
  headerTokenBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTokenText: {
    fontSize: 13,
    fontWeight: '900',
  },
  headerThemeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    padding: 16,
    borderBottomWidth: 1,
    letterSpacing: 0.5,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  vibeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  vibeCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  vibeIcon: {
    fontSize: 22,
  },
  vibeInfo: {
    flex: 1,
  },
  vibeName: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vibeDesc: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  submitBtn: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  issueBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  issueBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
