import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';

// DTO Interface for Support Request
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
  const { themeId, userEmail, triggerToast } = useApp();
  const router = useRouter();

  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Real tickets state from DB
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

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

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/support/my');
      if (res.data && Array.isArray(res.data)) {
        setTickets(res.data);
      }
    } catch (err) {
      console.log('Lỗi tải danh sách phản hồi từ Backend:', err);
      triggerToast('Không thể tải lịch sử phản hồi từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) {
      triggerToast('Vui lòng nhập nội dung báo lỗi / thắc mắc!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/support/create', {
        customerEmail: userEmail,
        content: content.trim()
      });

      if (res.data) {
        triggerToast('Gửi yêu cầu hỗ trợ thành công!');
        setContent('');
        fetchTickets();
      }
    } catch (err: any) {
      console.log('Lỗi gửi API support:', err);
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

  const getInputStyle = (fieldName: string) => [
    styles.input,
    {
      backgroundColor: '#0a0d16',
      borderColor: focusedField === fieldName ? colors.borderFocus : 'rgba(255, 255, 255, 0.08)',
      color: colors.text,
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      {/* Header Bar matching Web header */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={styles.backButtonCircle}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.brand, { color: '#0ea5e9', fontWeight: '900' }]}>
          MINISERIES<Text style={{ color: '#d946ef' }}>LEARNING</Text>
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>🛠️ CSKH</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* New Ticket Form */}
        <View style={[styles.card, { borderColor: 'rgba(255,255,255,0.05)', backgroundColor: colors.cardBg }]}>
          <Text style={[styles.cardHeader, { color: colors.text, borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
            📝 GỬI YÊU CẦU MỚI
          </Text>

          <View style={styles.formBody}>
            <Text style={styles.label}>NỘI DUNG CHI TIẾT CẦN HỖ TRỢ</Text>
            <TextInput
              multiline
              numberOfLines={5}
              placeholder="Vui lòng mô tả chi tiết lỗi bạn gặp phải hoặc câu hỏi cần giải đáp tại đây..."
              placeholderTextColor="#3e4a68"
              value={content}
              onChangeText={setContent}
              onFocus={() => setFocusedField('content')}
              onBlur={() => setFocusedField(null)}
              style={[...getInputStyle('content'), styles.textArea]}
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
                <Text style={styles.submitBtnText}>GỬI YÊU CẦU CSKH</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📬 LỊCH SỬ HỖ TRỢ ĐÃ GỬI ({tickets.length})
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.secondaryAccent} style={{ marginVertical: 20 }} />
          ) : tickets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Bạn chưa gửi yêu cầu hỗ trợ nào.</Text>
            </View>
          ) : (
            <View style={styles.ticketsList}>
              {tickets.map((ticket) => {
                const isResolved = ticket.status === 'Đã trả lời';
                return (
                  <View
                    key={ticket.id}
                    style={[styles.ticketCard, { borderColor: 'rgba(255,255,255,0.05)', backgroundColor: colors.cardBg }]}
                  >
                    <View style={styles.ticketHeader}>
                      <Text style={[styles.ticketId, { color: colors.secondaryAccent }]}>Phiếu #{ticket.id.substring(0, 8).toUpperCase()}</Text>
                      <View style={[
                        styles.statusBadge,
                        {
                          borderColor: isResolved ? '#10B981' : '#EAB308',
                          backgroundColor: isResolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)'
                        }
                      ]}>
                        <Text style={[styles.statusBadgeText, { color: isResolved ? '#10B981' : '#EAB308' }]}>
                          {ticket.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.ticketTime, { color: colors.textMuted }]}>{formatDate(ticket.createdAt)}</Text>
                    
                    <View style={styles.divider} />
                    
                    <Text style={[styles.ticketLabel, { color: '#818cf8' }]}>Yêu cầu của bạn:</Text>
                    <Text style={[styles.ticketContentText, { color: colors.text }]}>{ticket.content}</Text>

                    {ticket.reply ? (
                      <View style={[styles.replyBox, { backgroundColor: '#0a0d16', borderColor: 'rgba(255,255,255,0.05)' }]}>
                        <Text style={[styles.ticketLabel, { color: '#34d399' }]}>Phản hồi từ Ban quản trị:</Text>
                        <Text style={[styles.replyContentText, { color: colors.text }]}>{ticket.reply}</Text>
                      </View>
                    ) : (
                      <View style={[styles.replyBox, { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.03)' }]}>
                        <Text style={{ color: colors.textMuted, fontStyle: 'italic', fontSize: 11 }}>
                          Đang chờ Staff tiếp nhận và trả lời...
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
    paddingTop: Platform.OS === 'ios' ? 48 : 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButtonCircle: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  brand: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    fontSize: 12,
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
    color: '#06b6d4',
    letterSpacing: 1,
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
    marginBottom: 16,
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
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
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
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  ticketsList: {
    gap: 16,
  },
  ticketCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketId: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  ticketTime: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  ticketLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  ticketContentText: {
    fontSize: 13,
    fontWeight: '500',
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
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
});
