import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { LoadingOverlay } from '../../components/LoadingOverlay';

export default function CreateScreen() {
  const {
    themeId,
    lessonTitle,
    setLessonTitle,
    lessonContent,
    setLessonContent,
    selectedFormat,
    setSelectedFormat,
    setIsGenerating,
    setGenerationStep,
    triggerToast,
  } = useApp();
  const router = useRouter();

  const [guidedMode, setGuidedMode] = useState<boolean>(true);

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

  const handleStartGeneration = () => {
    if (!lessonTitle.trim()) {
      triggerToast('Vui lòng nhập tiêu đề bài học!');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('AI đang phân tích nội dung bài học...');

    setTimeout(() => {
      setGenerationStep('AI đang phân bổ cốt truyện và phân bổ nhịp điệu (pacing)...');
      setTimeout(() => {
        setGenerationStep('AI đang soạn thảo kịch bản chi tiết và phân cảnh hình ảnh...');
        setTimeout(() => {
          setIsGenerating(false);
          router.push('/review');
          triggerToast('Đã khởi tạo kịch bản nháp thành công!');
        }, 1000);
      }, 1000);
    }, 800);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.brand, { color: colors.text }]}>✨ AI STUDIO</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: colors.border }]}>
          <Text style={[styles.cardHeader, { color: colors.text, borderBottomColor: colors.border }]}>
            🤖 KHỞI TẠO BÀI HỌC BẰNG AI
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
                placeholder="Dán nội dung bài học hoặc các lưu ý của bạn tại đây để AI bám sát kịch bản..."
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
              <Text style={[styles.label, { color: colors.textMuted }]}>ĐỊNH DẠNG SẢN PHẨM AI</Text>
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
                    🎬 VIDEO NGẮN
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
                    📖 MANGA WEBTOON
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Guided Mode Switch */}
            <View style={[styles.switchGroup, { borderColor: colors.border }]}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.switchTitle, { color: colors.text }]}>GUIDED MODE (KHUYÊN DÙNG)</Text>
                <Text style={[styles.switchDesc, { color: colors.textMuted }]}>
                  AI sẽ tự động tạo bài trắc nghiệm kiểm tra kiến thức cuối bài học.
                </Text>
              </View>
              <Switch
                value={guidedMode}
                onValueChange={setGuidedMode}
                trackColor={{ false: '#767577', true: colors.primaryAccent }}
                thumbColor={guidedMode ? '#FFFFFF' : '#f4f3f4'}
              />
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
      </ScrollView>

      {/* Fullscreen Loading overlay for AI process */}
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
  },
  brand: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
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
  switchGroup: {
    borderWidth: 2,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  switchDesc: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 14,
  },
  submitBtn: {
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
