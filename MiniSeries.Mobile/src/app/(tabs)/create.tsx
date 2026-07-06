import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Switch, Platform } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { apiClient } from '../../services/apiClient';

export default function CreateScreen() {
  const {
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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const colors = {
    bg: '#050811', // Deep dark cosmic blue/black matching Web background
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: 'rgba(124, 58, 237, 0.3)',
    borderFocus: '#06b6d4', // Cyan focus glow
    primaryAccent: '#6366f1', // Indigo purple matching Web button
    secondaryAccent: '#06b6d4', // Cyan
    cardBg: '#0d111d', // Very dark grey-blue matching Web card background
  };

  const handleStartGeneration = async () => {
    if (!lessonTitle.trim()) {
      triggerToast('Vui lòng nhập tiêu đề bài học!');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('AI đang phân tích nội dung bài học...');

    try {
      const res = await apiClient.post('/lessons/drafts', {
        title: lessonTitle.trim(),
        rawContent: lessonContent.trim() || `Tạo bài giảng về chủ đề: ${lessonTitle.trim()}`,
        generateVideo: selectedFormat === 'video',
        creativeMode: 0, // Guided mode
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

  const getInputStyle = (fieldName: string) => [
    styles.input,
    {
      backgroundColor: '#0a0d16',
      borderColor: focusedField === fieldName ? colors.borderFocus : 'rgba(255, 255, 255, 0.08)',
      color: colors.text,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background Decorative Cosmic Planets matching Web */}
      <View style={styles.bluePlanet} />
      <View style={styles.purplePlanet} />

      {/* Header Bar matching Web header */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }]}>
        <Text style={styles.brandTitle}>
          MINISERIES<Text style={{ color: '#d946ef' }}>LEARNING</Text>
        </Text>
        <View style={styles.headerRight}>
          {/* Mini token pills matching Web top menu */}
          <View style={[styles.tokenPill, { borderColor: 'rgba(6,182,212,0.3)' }]}>
            <Text style={[styles.tokenPillText, { color: '#0ea5e9' }]}>Truyện {mangaTokens}/3</Text>
          </View>
          <View style={[styles.tokenPill, { borderColor: 'rgba(217,70,239,0.3)' }]}>
            <Text style={[styles.tokenPillText, { color: '#d946ef' }]}>Video {videoTokens}/1</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Web Hero Section copy */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Biến bài học thành {'\n'}
            <Text style={styles.neonText}>Trải nghiệm</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Tự động tạo Manga hoặc Video từ nội dung bài học của bạn chỉ trong vài giây.
          </Text>
        </View>

        {/* Input Card Panel matching Web layout */}
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: 'rgba(255, 255, 255, 0.05)' }]}>
          <View style={styles.form}>
            
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tiêu đề bài học</Text>
              <TextInput
                placeholder="Ví dụ: Vòng đời của một con bướm"
                placeholderTextColor="#3e4a68"
                value={lessonTitle}
                onChangeText={setLessonTitle}
                onFocus={() => setFocusedField('title')}
                onBlur={() => setFocusedField(null)}
                style={getInputStyle('title')}
              />
            </View>

            {/* Content Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nội dung bài học</Text>
              <TextInput
                multiline
                numberOfLines={6}
                placeholder="Nhập nội dung chi tiết tại đây..."
                placeholderTextColor="#3e4a68"
                value={lessonContent}
                onChangeText={setLessonContent}
                onFocus={() => setFocusedField('content')}
                onBlur={() => setFocusedField(null)}
                style={[...getInputStyle('content'), styles.textArea]}
              />
            </View>

            {/* Switch Toggle matching Manga (Cơ bản) vs Video (Cao cấp) */}
            <View style={styles.optionsRow}>
              <View style={styles.toggleContainer}>
                <Text style={[styles.toggleLabel, selectedFormat === 'manga' && styles.toggleLabelActive]}>
                  Manga (Cơ bản)
                </Text>
                
                <Switch
                  value={selectedFormat === 'video'}
                  onValueChange={(val) => setSelectedFormat(val ? 'video' : 'manga')}
                  trackColor={{ false: '#3b82f6', true: '#a855f7' }}
                  thumbColor="#ffffff"
                  style={styles.switchControl}
                />
                
                <Text style={[styles.toggleLabel, selectedFormat === 'video' && styles.toggleLabelActive]}>
                  Video (Cao cấp)
                </Text>
              </View>
            </View>

            {/* Submit button matching Web layout */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleStartGeneration}
              style={[styles.submitBtn, { backgroundColor: colors.primaryAccent }]}
            >
              <Text style={styles.submitBtnText}>Bắt đầu tạo</Text>
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
    position: 'relative',
  },
  bluePlanet: {
    position: 'absolute',
    top: 130,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#0ea5e9',
    opacity: 0.15,
  },
  purplePlanet: {
    position: 'absolute',
    bottom: 80,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#a855f7',
    opacity: 0.12,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 48 : 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#050811',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0ea5e9', // Cyan color matching Web
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  tokenPill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tokenPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: 20,
    width: '100%',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 30,
  },
  neonText: {
    color: '#6366f1',
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    maxWidth: 290,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  optionsRow: {
    marginBottom: 24,
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  toggleLabelActive: {
    color: '#f8fafc',
    fontWeight: 'bold',
  },
  switchControl: {
    marginHorizontal: 4,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
