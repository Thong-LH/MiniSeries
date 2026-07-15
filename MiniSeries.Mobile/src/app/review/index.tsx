import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { apiClient, BASE_URL } from '../../services/apiClient';
import { useTheme } from '../../hooks/use-theme';
import * as signalR from '@microsoft/signalr';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [step, setStep] = useState<'review' | 'generating'>('review');
  const [progress, setProgress] = useState<number>(45);

  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [overallScript, setOverallScript] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'manga' | 'video'>('video');

  const colors = useTheme();

  const fetchDraftDetails = async () => {
    if (!isAuthenticated) return;
    if (!lessonId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/lessons/${lessonId}`);
      if (res.data) {
        setLessonTitle(res.data.title || '');
        setOverallScript(res.data.overallScript || '');

        const isVideo = res.data.outputMode === 1 || res.data.outputMode === 'Video';
        setSelectedFormat(isVideo ? 'video' : 'manga');

        const isApproved = res.data.scriptStatus === 3 || res.data.scriptStatus === 'Approved';
        const jobs = res.data.generationJobs || [];
        const mediaJobs = jobs.filter((j: any) => j.type === 2 || j.type === 'MediaGeneration');
        const activeJob = [...mediaJobs]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        const isMediaReady = activeJob && (activeJob.status === 'Completed' || activeJob.status === 2);

        if (isApproved) {
          if (isMediaReady) {
            router.replace({
              pathname: '/lesson/[id]',
              params: { id: lessonId, type: isVideo ? 'video' : 'manga' }
            });
          } else {
            setStep('generating');
          }
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

        await connection.invoke("JoinLessonGroup", lessonId);

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

    connection.onreconnected(() => {
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

  // ── Generating / loading state ───────────────────────────────
  if (step === 'generating') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom', 'left', 'right']}>
        {/* Back arrow — top-left only */}
        <TouchableOpacity
          style={styles.backArrow}
          onPress={() => router.replace('/(tabs)/home')}
          accessibilityLabel="Trở về trang chủ"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.generatingContainer}>
          <ActivityIndicator size="large" color={colors.primaryAccent} style={{ marginBottom: 24 }} />
          <Text style={[styles.generatingTitle, { color: colors.text }]}>Đang tạo series của bạn</Text>
          <Text style={[styles.generatingSubtitle, { color: colors.textMuted }]}>
            Hệ thống đang chuẩn bị nội dung bài học và hình ảnh minh họa. Vui lòng giữ ứng dụng mở...
          </Text>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${progress}%` as any, backgroundColor: colors.primaryAccent }]} />
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
      </SafeAreaView>
    );
  }

  // ── Review state ─────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom', 'left', 'right']}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.brand, { color: colors.text }]}>DUYỆT KỊCH BẢN</Text>
        {!!lessonTitle && (
          <Text style={[styles.subTitle, { color: colors.textMuted }]} numberOfLines={1}>
            {lessonTitle}
          </Text>
        )}
      </View>

      {/* Main content — grows to fill all available space */}
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryAccent} />
            <Text style={{ color: colors.textMuted, marginTop: 12, fontWeight: '700' }}>ĐANG TẢI KỊCH BẢN...</Text>
          </View>
        ) : (
          <>
            {/* Script box — takes all available space */}
            <View style={[styles.editorContainer, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
              <Text style={[styles.editorLabel, { color: colors.textMuted }]}>KỊCH BẢN CHUNG</Text>
              <TextInput
                multiline
                value={overallScript}
                onChangeText={setOverallScript}
                placeholder="Nhập hoặc chỉnh sửa kịch bản chung tại đây..."
                placeholderTextColor={colors.textMuted}
                style={[styles.mainTextArea, { color: colors.text }]}
                textAlignVertical="top"
                scrollEnabled
              />
            </View>

            {/* Action buttons — NOT absolute, sit naturally below editor */}
            <View style={[styles.actionsContainer, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleApprove}
                disabled={submitting}
                style={[styles.approveBtn, { backgroundColor: colors.primaryAccent }]}
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
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.text }]}>QUAY LẠI</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  // ── Generating state ─────────────────────────────────────────
  backArrow: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  generatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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

  // ── Review state ─────────────────────────────────────────────
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  brand: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subTitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorContainer: {
    flex: 1,
    margin: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  editorLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  mainTextArea: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  approveBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#FFFFFF',
  },
});