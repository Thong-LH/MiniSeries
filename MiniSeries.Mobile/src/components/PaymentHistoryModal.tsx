import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../hooks/use-theme';
import { apiClient } from '../services/apiClient';
import { Ionicons } from '@expo/vector-icons';

interface PaymentHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ visible, onClose }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const theme = useTheme();
  const isDark = theme.isDark;

  const colors = {
    bg: isDark ? 'rgba(3, 7, 18, 0.95)' : 'rgba(248, 250, 252, 0.95)',
    cardBg: theme.cardBg,
    text: theme.text,
    textMuted: theme.textMuted,
    border: theme.border,
    primaryAccent: theme.primaryAccent,
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/payment/my-history');
      if (res.data) {
        setHistory(res.data);
      }
    } catch (e) {
      console.log('Failed to fetch payment history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchHistory();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerText, { color: colors.text }]}>LỊCH SỬ THANH TOÁN</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primaryAccent} />
              <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 13, fontWeight: '700' }}>
                Đang tải lịch sử...
              </Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Bạn chưa có lịch sử giao dịch nào
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {history.map((item, index) => (
                <View
                  key={item.id || index}
                  style={[
                    styles.historyItem,
                    { borderBottomColor: index === history.length - 1 ? 'transparent' : colors.border }
                  ]}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.amountText, { color: item.isPaid ? '#22c55e' : colors.primaryAccent }]}>
                      {item.amount.toLocaleString('vi-VN')}đ
                    </Text>
                    <Text style={[styles.planNameText, { color: colors.text }]}>
                      Gói: {item.planName || 'Tokens'}
                    </Text>
                    <Text style={[styles.codeText, { color: colors.textMuted }]}>
                      Mã: {item.paymentCode}
                    </Text>
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>
                      Tạo: {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: item.isPaid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)' }
                    ]}
                  >
                    <Text style={[styles.statusText, { color: item.isPaid ? '#22c55e' : '#eab308' }]}>
                      {item.isPaid ? 'Thành công' : 'Chờ xử lý'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: '80%',
    borderWidth: 1,
    borderRadius: 20,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '900',
  },
  planNameText: {
    fontSize: 13,
    fontWeight: '800',
  },
  codeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
});
