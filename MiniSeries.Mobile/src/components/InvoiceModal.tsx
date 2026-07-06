import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { apiClient } from '../services/apiClient';

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  planName: string;
  amount?: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ visible, onClose, planName, amount }) => {
  const { refreshProfile, triggerToast } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(900); // 15 minutes
  const [paymentCode, setPaymentCode] = useState<string>('');

  const colors = {
    bg: '#050811', // Deep dark cosmic blue/black matching Web background
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: 'rgba(124, 58, 237, 0.3)',
    borderFocus: '#06b6d4',
    primaryAccent: '#6366f1', // Indigo purple matching Web button
    secondaryAccent: '#0ea5e9', // Cyan
    cardBg: '#0d111d', // Very dark grey-blue matching Web card background
  };

  const price = planName === 'Basic' ? 150000 : 300000;
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(price);

  useEffect(() => {
    let timer: any;
    if (visible) {
      setSecondsLeft(900);
      setPaymentCode('');
      setLoading(true);
      
      const createInvoice = async () => {
        try {
          const res = await apiClient.post('/payment/create-invoice', {
            amount: price,
            planName
          });
          if (res.data && res.data.paymentCode) {
            setPaymentCode(res.data.paymentCode);
          }
        } catch (err) {
          console.log('Lỗi tạo hóa đơn thanh toán:', err);
          triggerToast('Không thể kết nối máy chủ để tạo hóa đơn.');
        } finally {
          setLoading(false);
        }
      };

      createInvoice();

      timer = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, planName]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleConfirmPayment = async () => {
    if (!paymentCode) return;
    setConfirming(true);

    try {
      // Gọi API giả lập webhook ngân hàng cập nhật số dư giống như Web
      const res = await apiClient.post('/payment/bank-webhook', {
        content: paymentCode,
        transferAmount: price,
        amount: price
      });

      if (res.data && res.data.success) {
        // Cập nhật thông tin profile của user từ database thật
        await refreshProfile();
        triggerToast(`Nâng cấp gói ${planName} thành công!`);
        onClose();
      } else {
        triggerToast(res.data.message || 'Xác nhận thanh toán thất bại.');
      }
    } catch (err: any) {
      console.log('Lỗi xác nhận thanh toán:', err);
      const errMsg = err.response?.data?.message || 'Không thể liên kết cổng thanh toán. Vui lòng thử lại.';
      triggerToast(errMsg);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: 'rgba(5, 8, 17, 0.95)' }]}>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondaryAccent} />
            <Text style={{ color: colors.textMuted, marginTop: 12 }}>Đang khởi tạo hóa đơn giao dịch...</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            
            {/* Header matching Web */}
            <Text style={[styles.header, { color: colors.text, borderBottomColor: 'rgba(255, 255, 255, 0.05)' }]}>
              🏦 MB BANK CHUYỂN KHOẢN HÓA ĐƠN
            </Text>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              {/* Timer Box */}
              <View style={[styles.timerBox, { borderColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }]}>
                <Text style={[styles.timerLabel, { color: colors.textMuted }]}>
                  HÓA ĐƠN HẾT HẠN SAU
                </Text>
                <Text style={[styles.timerText, { color: '#ef4444' }]}>
                  ⏳ {formatTime(secondsLeft)}
                </Text>
              </View>

              {/* QR Code Section (Positioned Top for Visibility) */}
              <View style={styles.qrContainer}>
                <View style={[styles.qrBorder, { borderColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: '#FFFFFF' }]}>
                  <Image
                    source={{ uri: `https://api.vietqr.io/image/970422-0909090909-5D1pG8K.jpg?amount=${price}&addInfo=${paymentCode}&accountName=MINISERIES%20LEARNING%20CO` }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.qrCaption, { color: colors.textMuted }]}>
                  Quét mã QR bằng ứng dụng ngân hàng của bạn để thanh toán tự động
                </Text>
              </View>

              {/* Billing Details */}
              <View style={styles.detailsContainer}>
                <View style={[styles.detailRow, { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }]}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>NGÂN HÀNG</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>MB Bank (Ngân hàng Quân Đội)</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }]}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>SỐ TÀI KHOẢN</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>0909090909</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }]}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>CHỦ TÀI KHOẢN</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>MINISERIES LEARNING CO.</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }]}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>SỐ TIỀN</Text>
                  <Text style={[styles.detailValue, { color: colors.secondaryAccent }]}>{formattedPrice}</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }]}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>NỘI DUNG CHUYỂN KHOẢN</Text>
                  <Text style={[styles.detailValue, { color: '#a78bfa', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: 'bold' }]}>
                    {paymentCode}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.actionsContainer, { borderTopColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleConfirmPayment}
                disabled={confirming}
                style={[styles.actionBtn, { backgroundColor: colors.primaryAccent }]}
              >
                {confirming ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.actionBtnText}>✦ Giả lập quét mã thành công (Auto-Pay)</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                disabled={confirming}
                style={[styles.actionBtn, { backgroundColor: 'transparent', borderColor: 'rgba(255, 255, 255, 0.15)' }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.text }]}>HỦY GIAO DỊCH</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    fontSize: 14,
    fontWeight: '800',
    padding: 16,
    borderBottomWidth: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
  },
  timerBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '800',
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    borderBottomWidth: 1,
    paddingVertical: 8,
    flexDirection: 'column',
    gap: 2,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  qrBorder: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrCaption: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 12,
  },
  actionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
});
