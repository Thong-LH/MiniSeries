import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { apiClient } from '../../services/apiClient';
import { Ionicons } from '@expo/vector-icons';

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
  } = useApp();
  const router = useRouter();
  const navigation = useNavigation();

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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshProfile();
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
        creativeBrief: '',
      });

      const data = res.data;
      if (data && data.id) {
        setLessonTitle('');
        setLessonContent('');
        triggerToast('Đã khởi tạo kịch bản nháp thành công!');
        setIsGenerating(false);
        router.push('/(tabs)/home');
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
      {/* Unified Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.brand, { color: colors.text }]}>MINISERIES</Text>
        
        {/* Token Badge */}
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
            onPress={toggleTheme}
            style={[styles.headerButton, { borderColor: colors.border }]}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: colors.border }]}>
          <Text style={[styles.cardHeader, { color: colors.text, borderBottomColor: colors.border }]}>
            TẠO BÀI HỌC MỚI
          </Text>

          <View style={styles.form}>
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>TIÊU ĐỀ BÀI HỌC</Text>
              <TextInput
                placeholder="Ví dụ: Lập trình hướng đối tượng là gì..."
                placeholderTextColor={isDark ? '#666' : '#999'}
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
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={lessonContent}
                onChangeText={setLessonContent}
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }
                ]}
              />
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
                      backgroundColor: selectedFormat === 'video' ? colors.text : 'transparent',
                      borderColor: colors.border,
                    }
                  ]}
                >
                  <Text style={[
                    styles.formatButtonText,
                    { color: selectedFormat === 'video' ? colors.bg : colors.text }
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
                      backgroundColor: selectedFormat === 'manga' ? colors.text : 'transparent',
                      borderColor: colors.border,
                    }
                  ]}
                >
                  <Text style={[
                    styles.formatButtonText,
                    { color: selectedFormat === 'manga' ? colors.bg : colors.text }
                  ]}>
                    MANGA WEBTOON
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleStartGeneration}
              style={[styles.submitBtn, { backgroundColor: colors.primaryAccent, borderColor: colors.border }]}
            >
              <Text style={styles.submitBtnText}>TẠO KỊCH BẢN NHÁP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Report System Issue Button (Product creation section) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/support?mode=issue')}
          style={[styles.issueBtn, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.primaryAccent} />
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
  card: {
    borderWidth: 2,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '900',
    padding: 14,
    borderBottomWidth: 2,
    letterSpacing: 1,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    borderWidth: 2,
    padding: 14,
    fontSize: 14,
    fontWeight: '700',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    borderWidth: 2,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatButtonText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  submitBtn: {
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  issueBtn: {
    borderWidth: 2,
    padding: 16,
    marginTop: 20,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  issueBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
