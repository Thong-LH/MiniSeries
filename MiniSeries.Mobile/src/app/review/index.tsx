import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../services/apiClient';

interface Scene {
  number: number;
  title: string;
  duration: string;
  visual: string;
  narrator: string;
  action: string;
}

export default function ReviewScreen() {
  const {
    themeId,
    setMangaTokens,
    setVideoTokens,
    triggerToast,
  } = useApp();
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  const [activeTab, setActiveTab] = useState<'summary' | 'scenes'>('scenes');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [creativeBrief, setCreativeBrief] = useState<string>('');
  const [overallScript, setOverallScript] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'manga' | 'video'>('video');
  const [scenes, setScenes] = useState<Scene[]>([]);

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

  const fetchDraftDetails = async () => {
    if (!lessonId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/lessons/${lessonId}`);
      if (res.data) {
        setLessonTitle(res.data.title || 'Bài giảng không có tiêu đề');
        setCreativeBrief(res.data.creativeBrief || 'Không có mục tiêu bài học nào được định nghĩa.');
        setOverallScript(res.data.overallScript || '');
        
        const isVideo = res.data.outputMode === 1 || res.data.outputMode === 'Video';
        setSelectedFormat(isVideo ? 'video' : 'manga');

        if (res.data.chapters && Array.isArray(res.data.chapters)) {
          const apiScenes = res.data.chapters.map((ch: any) => ({
            number: ch.order,
            title: `Phân cảnh ${ch.order}`,
            duration: isVideo ? '15 giây' : '1 trang',
            visual: ch.fullPrompt || 'Chưa cấu hình hình ảnh.',
            narrator: ch.summary || 'Không có thuyết minh.',
            action: 'Người học chú ý theo dõi hình ảnh và âm thanh.'
          }));
          setScenes(apiScenes);
        } else {
          setScenes([]);
        }
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
    
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/lessons/${lessonId}/approve`, {
        overallScript: overallScript || 'Approved',
      });

      const data = res.data;
      if (data) {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.brand, { color: colors.text }]}>DUYỆT KỊCH BẢN</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryAccent} />
          <Text style={{ color: colors.textMuted, marginTop: 12, fontWeight: '700' }}>ĐANG TẢI KỊCH BẢN NHÁP...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Info Card */}
          <View style={[styles.infoCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              {lessonTitle || 'Bài giảng không có tiêu đề'}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { borderColor: colors.border, backgroundColor: colors.text }]}>
                <Text style={[styles.badgeText, { color: colors.bg }]}>
                  {selectedFormat === 'manga' ? 'MANGA WEBTOON' : 'VIDEO NGẮN'}
                </Text>
              </View>
            </View>
          </View>

          {/* Tab switchers */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('summary')}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === 'summary' ? colors.text : 'transparent',
                  borderColor: colors.border,
                }
              ]}
            >
              <Text style={[styles.tabText, { color: activeTab === 'summary' ? colors.bg : colors.text }]}>
                TÓM TẮT KỊCH BẢN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('scenes')}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === 'scenes' ? colors.text : 'transparent',
                  borderColor: colors.border,
                }
              ]}
            >
              <Text style={[styles.tabText, { color: activeTab === 'scenes' ? colors.bg : colors.text }]}>
                KỊCH BẢN CHI TIẾT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Outline Summary view */}
          {activeTab === 'summary' ? (
            <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>MỤC TIÊU BÀI GIẢNG</Text>
              <Text style={[styles.cardBody, { color: colors.textMuted }]}>
                {creativeBrief || 'Không có mục tiêu nào được mô tả.'}
              </Text>
            </View>
          ) : (
            /* Scene list view */
            <View style={styles.scenesList}>
              {/* Text editor for Overall Script */}
              <View style={[styles.editorCard, { borderColor: colors.border, backgroundColor: colors.cardBg, marginBottom: 16 }]}>
                <Text style={[styles.editorLabel, { color: colors.text }]}>KỊCH BẢN CHUNG</Text>
                <TextInput
                  multiline
                  numberOfLines={4}
                  value={overallScript}
                  onChangeText={setOverallScript}
                  placeholder="Kịch bản đang được soạn thảo..."
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                />
              </View>

              {scenes.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>CHƯA PHÂN CHIA PHÂN CẢNH.</Text>
                </View>
              ) : (
                scenes.map((scene) => (
                  <View
                    key={scene.number}
                    style={[styles.sceneCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
                  >
                    <Text style={[styles.sceneNum, { color: colors.primaryAccent, borderBottomColor: colors.border }]}>
                      PHÂN CẢNH {scene.number} ({scene.duration.toUpperCase()})
                    </Text>

                    <View style={scene.number ? styles.sceneContent : styles.sceneContent}>
                      <View style={styles.sceneSection}>
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>HÌNH ẢNH</Text>
                        <Text style={[styles.sectionVal, { color: colors.text }]}>{scene.visual}</Text>
                      </View>

                      <View style={styles.sceneSection}>
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>THUYẾT MINH</Text>
                        <Text style={[styles.sectionVal, { color: colors.text }]}>{scene.narrator}</Text>
                      </View>

                      <View style={styles.sceneSection}>
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>HÀNH ĐỘNG</Text>
                        <Text style={[styles.sectionVal, { color: colors.text }]}>{scene.action}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Approve / Cancel actions */}
      {!loading && (
        <View style={[styles.actionsContainer, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleApprove}
            disabled={submitting}
            style={[styles.actionBtn, { backgroundColor: colors.primaryAccent, borderColor: colors.border }]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionBtnText}>PHÊ DUYỆT & XUẤT BẢN</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCancel}
            disabled={submitting}
            style={[styles.actionBtn, { backgroundColor: 'transparent', borderColor: colors.border }]}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  infoCard: {
    borderWidth: 2,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: 2,
    padding: 16,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  scenesList: {
    gap: 16,
  },
  sceneCard: {
    borderWidth: 2,
  },
  sceneNum: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    padding: 12,
    borderBottomWidth: 1,
  },
  sceneContent: {
    padding: 12,
    gap: 12,
  },
  sceneSection: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '900',
  },
  sectionVal: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  editorCard: {
    borderWidth: 2,
    padding: 14,
  },
  editorLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    padding: 12,
    fontSize: 12,
    fontWeight: '700',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  emptyContainer: {
    padding: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 2,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#FFFFFF',
  },
});
