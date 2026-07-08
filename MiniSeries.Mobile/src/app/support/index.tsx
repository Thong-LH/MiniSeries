import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';
import { useTheme } from '../../hooks/use-theme';

interface SupportTicket {
  id: string;
  customerEmail: string;
  content: string;
  reply: string;
  status: string;
  assignedStaffEmail?: string;
  createdAt: string;
}

export default function SupportScreen() {
  const { themeId, userEmail, triggerToast, isAuthenticated } = useApp();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: string }>();

  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const colors = useTheme();
  const isDark = colors.isDark;

  const isIssueMode = mode === 'issue';

  const fetchTickets = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/support/my');
      if (res.data && Array.isArray(res.data)) {
        setTickets(res.data);
      }
    } catch (err) {
      console.log('Lỗi tải danh sách phản hồi:', err);
      triggerToast('Không thể tải lịch sử phản hồi từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTickets();
    apiClient.post('/analytics/track', { path: '/support', deviceType: 'Mobile' }).catch(() => {});
  }, [isAuthenticated]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      triggerToast(isIssueMode ? 'Vui lòng nhập nội dung báo lỗi!' : 'Vui lòng nhập nội dung thắc mắc!');
      return;
    }

    setSubmitting(true);
    try {
      const prefix = isIssueMode ? '[BÁO LỖI] ' : '[CSKH] ';
      const res = await apiClient.post('/support/create', {
        customerEmail: userEmail,
        content: prefix + content.trim()
      });

      if (res.data) {
        triggerToast(isIssueMode ? 'Gửi báo lỗi thành công!' : 'Gửi yêu cầu hỗ trợ thành công!');
        setContent('');
        fetchTickets();
      }
    } catch (err: any) {
      console.log('Lỗi gửi phản hồi:', err);
      const errMsg = err.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng kiểm tra lại.';
      triggerToast(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return isoString;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.bg }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.brand, { color: colors.text }]}>
          {isIssueMode ? 'BÁO CÁO SỰ CỐ' : 'CSKH & TƯ VẤN'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Form Card */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: isDark ? '#000000' : '#0f172a' }]}>
          <Text style={[styles.cardHeader, { color: colors.text, borderBottomColor: colors.border }]}>
            {isIssueMode ? 'GỬI BÁO LỖI HỆ THỐNG / KỊCH BẢN' : 'GỬI YÊU CẦU MỚI'}
          </Text>

          <View style={styles.formBody}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {isIssueMode ? 'MÔ TẢ CHI TIẾT SỰ CỐ GẶP PHẢI' : 'NỘI DUNG CHI TIẾT CẦN HỖ TRỢ'}
            </Text>
            <TextInput
              multiline
              numberOfLines={5}
              placeholder={isIssueMode ? "Nhập chi tiết sự cố hoặc phản hồi của bạn..." : "Nhập câu hỏi hoặc nội dung cần tư vấn..."}
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              value={content}
              onChangeText={setContent}
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            />

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.submitBtn, { backgroundColor: colors.primaryAccent }]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isIssueMode ? 'GỬI BÁO LỖI' : 'GỬI HỖ TRỢ'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            LỊCH SỬ YÊU CẦU ĐÃ GỬI ({tickets.length})
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primaryAccent} style={{ marginVertical: 20 }} />
          ) : tickets.length === 0 ? (
            <View style={[styles.emptyContainer, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>CHƯA CÓ YÊU CẦU NÀO.</Text>
            </View>
          ) : (
            <View style={styles.ticketsList}>
              {tickets.map((ticket) => {
                const isResolved = ticket.status === 'Đã trả lời';
                return (
                  <View
                    key={ticket.id}
                    style={[styles.ticketCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
                  >
                    <View style={styles.ticketHeader}>
                      <Text style={[styles.ticketId, { color: colors.text }]}>MÃ PHIẾU #{ticket.id.substring(0, 8).toUpperCase()}</Text>
                      <View style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isResolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          borderColor: 'transparent'
                        }
                      ]}>
                        <Text style={[styles.statusBadgeText, { color: isResolved ? '#10b981' : '#f59e0b' }]}>
                          {ticket.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.ticketTime, { color: colors.textMuted }]}>{formatDate(ticket.createdAt)}</Text>
                    
                    <View style={[styles.divider, { borderTopColor: colors.border }]} />
                    
                    <Text style={[styles.ticketLabel, { color: colors.primaryAccent }]}>Nội dung:</Text>
                    <Text style={[styles.ticketContentText, { color: colors.text }]}>{ticket.content}</Text>

                    {ticket.reply ? (
                      <View style={[styles.replyBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                        <Text style={[styles.ticketLabel, { color: '#10b981' }]}>Trả lời:</Text>
                        <Text style={[styles.replyContentText, { color: colors.text }]}>{ticket.reply}</Text>
                      </View>
                    ) : (
                      <View style={[styles.replyBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                        <Text style={{ color: colors.textMuted, fontStyle: 'italic', fontSize: 11, fontWeight: '700' }}>
                          Đang chờ tiếp nhận và trả lời...
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '800',
    padding: 14,
    borderBottomWidth: 1,
    letterSpacing: 0.5,
  },
  formBody: {
    padding: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  historySection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  ticketsList: {
    gap: 16,
  },
  ticketCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '900',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  ticketTime: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 12,
  },
  divider: {
    borderTopWidth: 1,
    marginBottom: 12,
  },
  ticketLabel: {
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 4,
  },
  ticketContentText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 12,
  },
  replyBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  replyContentText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    borderWidth: 1,
    borderRadius: 16,
    borderStyle: 'dashed',
  },
});
