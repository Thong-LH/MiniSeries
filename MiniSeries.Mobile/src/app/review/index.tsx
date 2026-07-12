import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { apiClient, BASE_URL } from '../../services/apiClient';
import { useTheme } from '../../hooks/use-theme';
import * as signalR from '@microsoft/signalr';

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
    isAuthenticated,
    setShouldRefreshHome,
  } = useApp();
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  const [activeTab, setActiveTab] = useState<'summary' | 'scenes'>('scenes');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [step, setStep] = useState<'review' | 'generating'>('review');
  const [progress, setProgress] = useState<number>(45);

  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [creativeBrief, setCreativeBrief] = useState<string>('');
  const [overallScript, setOverallScript] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'manga' | 'video'>('video');
  const [scenes, setScenes] = useState<Scene[]>([]);

  const colors = useTheme();
  const isDark = colors.isDark;

  const fetchDraftDetails = async () => {
    if (!isAuthenticated) return;
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

        const isApproved = res.data.scriptStatus === 3 || res.data.scriptStatus === 'Approved';
        const jobs = res.data.generationJobs || [];
        const mediaJobs = jobs.filter((j: any) => j.type === 2 || j.type === 'MediaGeneration');
        const activeJob = [...mediaJobs]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const isMediaReady = activeJob && (activeJob.status === 'Completed' || activeJob.status === 2);

        if (isApproved && !isMediaReady) {
          setStep('generating');
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
    if (!isAuthenticated) return;
    fetchDraftDetails();
    if (lessonId) {
      apiClient.post('/analytics/track', { path: `/review/${lessonId}`, deviceType: 'Mobile' }).catch(() => { });
    }
  }, [lessonId, isAuthenticated]);

  useEffect(() => {
    if (step !== 'generating' || !lessonId) return;

    let isMounted = true;
    const hubUrl = BASE_URL.replace('/api', '/hubs/lessons');

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        if (!isMounted) {
          await connection.stop();
          return;
        }

        // Join group for this lesson
        await connection.invoke("JoinLessonGroup", lessonId);

        // Fetch status immediately in case it completed before connecting
        const res = await apiClient.get(`/lessons/${lessonId}`);
        if (!isMounted) return;

        const lesson = res.data;
        const jobs = lesson.generationJobs || [];
        const mediaJobs = jobs.filter((j: any) => j.type === 2 || j.type === 'MediaGeneration');
        const activeJob = [...mediaJobs]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (activeJob) {
          const status = activeJob.status;
          if (status === 'Completed' || status === 2) {
            setProgress(100);
            setTimeout(() => {
              if (isMounted) {
                triggerToast('Đã tạo xong bài giảng! 🎉');
                router.replace({
                  pathname: '/lesson/[id]',
                  params: { id: lessonId, type: lesson.outputMode === 1 || lesson.outputMode === 'Video' ? 'video' : 'manga' }
                });
              }
            }, 1500);
            return;
          } else if (status === 'Failed' || status === 3) {
            triggerToast(activeJob.errorMessage || 'Lỗi tạo hình ảnh/video từ máy chủ.');
            setStep('review');
            return;
          }
        }
      } catch (err) {
        console.log('Error starting SignalR connection on mobile:', err);
      }
    };

    // Simulate progressive loading bar slowly in the background
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 92) return prev + 1;
        return prev;
      });
    }, 2000);

    connection.on("StatusChanged", (data: { lessonId: string; status: string; errorMessage?: string }) => {
      if (!isMounted) return;
      if (data.lessonId !== lessonId) return;

      if (data.status === 'Completed') {
        setProgress(100);
        setTimeout(async () => {
          if (isMounted) {
            try {
              const res = await apiClient.get(`/lessons/${lessonId}`);
              const lesson = res.data;
              triggerToast('Đã tạo xong bài giảng! 🎉');
              router.replace({
                pathname: '/lesson/[id]',
                params: { id: lessonId, type: lesson.outputMode === 1 || lesson.outputMode === 'Video' ? 'video' : 'manga' }
              });
            } catch (err) {
              console.log('Error reading final lesson:', err);
            }
          }
        }, 1500);
      } else if (data.status === 'Failed') {
        triggerToast(data.errorMessage || 'Lỗi tạo hình ảnh/video từ máy chủ.');
        setStep('review');
      }
    });

    connection.onreconnected((connectionId) => {
      if (isMounted) {
        connection.invoke("JoinLessonGroup", lessonId)
          .catch(err => console.log('Error rejoining group after reconnect on mobile:', err));
      }
    });

    startConnection();

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("LeaveLessonGroup", lessonId)
          .catch(err => console.log('Error leaving group:', err))
          .finally(() => {
            connection.stop().catch(err => console.log('Error stopping connection:', err));
          });
      } else {
        connection.stop().catch(err => console.log('Error stopping connection:', err));
      }
    };
  }, [step, lessonId]);

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
        triggerToast('Phê duyệt thành công! Đang tiến hành vẽ tranh/tạo video...');
        setShouldRefreshHome(true);
        setStep('generating');
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
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.bg }]}>
        <Text style={[styles.brand, { color: colors.text }]}>
          {step === 'generating' ? 'ĐANG TẠO BÀI HỌC' : 'DUYỆT KỊCH BẢN'}
        </Text>
      </View>

      {step === 'generating' ? (
        <View style={styles.generatingContainer}>
          <ActivityIndicator size="large" color={colors.primaryAccent} style={{ marginBottom: 24 }} />
          <Text style={[styles.generatingTitle, { color: colors.text }]}>Đang tạo series của bạn</Text>
          <Text style={[styles.generatingSubtitle, { color: colors.textMuted }]}>
            Hệ thống đang chuẩn bị nội dung bài học và hình ảnh minh họa. Vui lòng giữ ứng dụng mở...
          </Text>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.primaryAccent }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.primaryAccent }]}>{progress}%</Text>

          {/* Steps List */}
          <View style={styles.stepsContainer}>
            {[
              { label: '1. Phân tích kịch bản', active: progress >= 45 },
              { label: '2. Thiết kế tạo hình nhân vật', active: progress >= 65 },
              { label: '3. Vẽ tranh minh họa / Tạo video', active: progress >= 80 },
              { label: '4. Tối ưu hóa và hoàn tất bài học', active: progress >= 95 },
            ].map((s, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={[
                  styles.stepDot,
                  { backgroundColor: s.active ? colors.primaryAccent : colors.border }
                ]}>
                  {s.active && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                </View>
                <Text style={[
                  styles.stepLabel,
                  { color: s.active ? colors.text : colors.textMuted, fontWeight: s.active ? '700' : '400' }
                ]}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : loading ? (
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
              <View style={[styles.badge, { borderColor: 'transparent', backgroundColor: colors.text }]}>
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
                  backgroundColor: activeTab === 'summary' ? colors.primaryAccent : colors.cardBg,
                  borderColor: activeTab === 'summary' ? colors.primaryAccent : colors.border,
                }
              ]}
            >
              <Text style={[styles.tabText, { color: activeTab === 'summary' ? '#ffffff' : colors.text }]}>
                TÓM TẮT KỊCH BẢN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('scenes')}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === 'scenes' ? colors.primaryAccent : colors.cardBg,
                  borderColor: activeTab === 'scenes' ? colors.primaryAccent : colors.border,
                }
              ]}
            >
              <Text style={[styles.tabText, { color: activeTab === 'scenes' ? '#ffffff' : colors.text }]}>
                KỊCH BẢN CHI TIẾT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Outline Summary view */}
          {activeTab === 'summary' ? (
            <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: isDark ? '#000000' : '#0f172a' }]}>
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
                  placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                  style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                />
              </View>

              {scenes.length === 0 ? (
                <View style={[styles.emptyContainer, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
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

                    <View style={styles.sceneContent}>
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
            style={[styles.actionBtn, { backgroundColor: colors.primaryAccent }]}
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
    borderBottomWidth: 1,
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
    borderWidth: 1,
    borderRadius: 16,
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
    borderRadius: 6,
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
    borderWidth: 1,
    borderRadius: 20,
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
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
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
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  editorLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
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
    borderWidth: 1,
    borderRadius: 16,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
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
  generatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  generatingSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 40,
  },
  stepsContainer: {
    width: '100%',
    gap: 16,
    paddingHorizontal: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 13,
  },
});
