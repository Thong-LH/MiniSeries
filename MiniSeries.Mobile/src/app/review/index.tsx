import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../services/apiClient';

export default function ReviewScreen() {
  const { themeId, setMangaTokens, setVideoTokens, triggerToast } = useApp();
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [draftScript, setDraftScript] = useState<string>('');
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [format, setFormat] = useState<'manga' | 'video'>('manga');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const colors = {
    bg: '#050811', // Deep dark cosmic blue/black matching Web background
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: 'rgba(124, 58, 237, 0.3)',
    borderFocus: '#06b6d4', // Cyan focus glow
    primaryAccent: '#6366f1', // Indigo purple matching Web button
    secondaryAccent: '#0ea5e9', // Cyan
    cardBg: '#0d111d', // Very dark grey-blue matching Web card background
  };

  const fetchDraftDetails = async () => {
    if (!lessonId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/lessons/${lessonId}`);
      if (res.data) {
        setLessonTitle(res.data.title || 'Bài giảng không có tiêu đề');
        setDraftScript(res.data.overallScript || 'Không có kịch bản.');
        const isVideo = res.data.outputMode === 0 || res.data.outputMode === 'Video';
        setFormat(isVideo ? 'video' : 'manga');
      }
    } catch (err) {
      console.log('Lỗi tải kịch bản nháp:', err);
      triggerToast('Không thể tải kịch bản nháp từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraftDetails();
  }, [lessonId]);

  const handleCancel = () => {
    triggerToast('Đã đóng trình duyệt kịch bản.');
    router.replace('/(tabs)/home');
  };

  const handleApprove = async () => {
    if (!lessonId) return;
    if (!draftScript.trim()) {
      triggerToast('Kịch bản không được để trống.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post(`/lessons/${lessonId}/approve`, {
        overallScript: draftScript,
      });

      const data = res.data;
      if (data) {
        // Sync token counts returned in response
        if (data.quota) {
          if (data.quota.remainingMangaCount !== undefined) setMangaTokens(data.quota.remainingMangaCount);
          if (data.quota.remainingVideoCount !== undefined) setVideoTokens(data.quota.remainingVideoCount);
        }
        triggerToast('Phê duyệt thành công! Tiến trình sinh media bắt đầu.');
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      console.log('Lỗi phê duyệt kịch bản:', err);
      const errMsg = err.response?.data?.message || 'Phê duyệt thất bại. Vui lòng kiểm tra lại.';
      triggerToast(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getInputStyle = (fieldName: string) => [
    styles.textArea,
    {
      backgroundColor: '#0a0d16',
      borderColor: focusedField === fieldName ? colors.borderFocus : 'rgba(255, 255, 255, 0.08)',
      color: colors.text,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background Glows */}
      <View style={styles.glowTop} />

      {/* Header Bar matching Web header */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.brand, { color: '#0ea5e9', fontWeight: '900' }]}>
          MINISERIES<Text style={{ color: '#d946ef' }}>LEARNING</Text>
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>📋 DUYỆT KỊCH BẢN</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondaryAccent} />
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>Đang tải kịch bản nháp...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Info Card */}
          <View style={[styles.infoCard, { borderColor: 'rgba(255,255,255,0.05)', backgroundColor: colors.cardBg }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              {lessonTitle || 'Định tuyến gói tin nâng cao'}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: format === 'manga' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(124, 58, 237, 0.15)', borderColor: format === 'manga' ? colors.secondaryAccent : colors.border }]}>
                <Text style={[styles.badgeText, { color: format === 'manga' ? colors.secondaryAccent : '#c084fc' }]}>
                  {format === 'manga' ? '📖 MANGA WEBTOON' : '🎬 VIDEO NGẮN'}
                </Text>
              </View>
            </View>
          </View>

          {/* Script Editor Area matching Web script-editor */}
          <View style={[styles.editorCard, { backgroundColor: colors.cardBg, borderColor: 'rgba(255,255,255,0.05)' }]}>
            <Text style={styles.editorLabel}>Kịch bản bài học (Draft Script)</Text>
            <TextInput
              multiline
              value={draftScript}
              onChangeText={setDraftScript}
              editable={!submitting}
              onFocus={() => setFocusedField('script')}
              onBlur={() => setFocusedField(null)}
              style={getInputStyle('script')}
              placeholder="Đang tải kịch bản..."
              placeholderTextColor="#3e4a68"
            />
          </View>
        </ScrollView>
      )}

      {/* Approve / Cancel actions */}
      {!loading && (
        <View style={[styles.actionsContainer, { borderTopColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: colors.bg }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleApprove}
            disabled={submitting}
            style={[styles.actionBtn, { backgroundColor: colors.primaryAccent }]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionBtnText}>PHÊ DUYỆT & TẠO MEDIA</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCancel}
            disabled={submitting}
            style={[styles.actionBtn, { backgroundColor: 'transparent', borderColor: 'rgba(255, 255, 255, 0.15)' }]}
          >
            <Text style={[styles.actionBtnText, { color: colors.text }]}>QUAY LẠI</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  brand: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 160, // Space for bottom actions
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  editorCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  editorLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontWeight: '500',
    height: 300,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 16,
    gap: 12,
  },
  actionBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
