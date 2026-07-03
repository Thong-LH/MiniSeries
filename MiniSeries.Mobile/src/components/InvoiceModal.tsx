import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image } from 'react-native';
import { useApp } from '../context/AppContext';

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  planName: string;
  amount: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ visible, onClose, planName, amount }) => {
  const { themeId, triggerToast, setActivePlan, setMangaTokens, setVideoTokens } = useApp();
  const [secondsLeft, setSecondsLeft] = useState<number>(900); // 15 minutes

  const isDark = themeId === 'bold-typography-dark';
  const colors = {
    bg: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(250, 249, 246, 0.95)',
    text: isDark ? '#FAF9F6' : '#1A1A1A',
    textMuted: isDark ? '#CFCFCF' : '#4A4A4A',
    border: isDark ? '#FFFFFF' : '#000000',
    primaryAccent: '#FF3E00',
    cardBg: isDark ? '#1a1a1a' : '#FAF9F6',
    qrBg: '#FFFFFF',
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (visible) {
      setSecondsLeft(900);
      timer = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    setActivePlan(planName);
    if (planName === 'Basic') {
      setMangaTokens((prev) => prev + 30);
    } else if (planName === 'Premium') {
      setMangaTokens(99999); // Unlimited represented by large amount
      setVideoTokens((prev) => prev + 30);
    }
    triggerToast(`Nâng cấp thành công gói ${planName}!`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.header, { color: colors.text, borderBottomColor: colors.border }]}>
            🏦 MB BANK CHUYỂN KHOẢN HÓA ĐƠN
          </Text>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Timer Box */}
            <View style={[styles.timerBox, { borderColor: colors.border }]}>
              <Text style={[styles.timerLabel, { color: colors.textMuted }]}>
                HÓA ĐƠN HẾT HẠN SAU
              </Text>
              <Text style={[styles.timerText, { color: colors.primaryAccent }]}>
                ⏳ {formatTime(secondsLeft)}
              </Text>
            </View>

            {/* Billing Details */}
            <View style={styles.detailsContainer}>
              <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>NGÂN HÀNG</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>MB BANK</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>SỐ TÀI KHOẢN</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>0355428935</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>CHỦ TÀI KHOẢN</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>LE HONG THONG</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>SỐ TIỀN</Text>
                <Text style={[styles.detailValue, { color: colors.primaryAccent }]}>{amount}</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>NỘI DUNG CHUYỂN KHOẢN</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>MINISERIES VIP {planName.toUpperCase()}</Text>
              </View>
            </View>

            {/* QR Mock Image */}
            <View style={styles.qrContainer}>
              <View style={[styles.qrBorder, { borderColor: colors.border, backgroundColor: colors.qrBg }]}>
                {/* Dynamically build VietQR API link for MB Bank transfer */}
                <Image
                  source={{ uri: `https://api.vietqr.io/image/970422-0355428935-4OitQ0s.jpg?accountName=LE%20HONG%20THONG&amount=${planName === 'Basic' ? '10000' : '50000'}&addInfo=MINISERIES%20VIP%20${planName.toUpperCase()}` }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.qrCaption, { color: colors.textMuted }]}>
                Quét mã QR bằng ứng dụng ngân hàng của bạn để thanh toán tự động
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleConfirm}
              style={[styles.actionBtn, { backgroundColor: colors.primaryAccent, borderColor: colors.border }]}
            >
              <Text style={styles.actionBtnText}>XÁC NHẬN ĐÃ CHUYỂN KHOẢN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={[styles.actionBtn, { backgroundColor: 'transparent', borderColor: colors.border }]}
            >
              <Text style={[styles.actionBtnText, { color: colors.text }]}>HỦY GIAO DỊCH</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '90%',
    borderWidth: 2,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    fontSize: 14,
    fontWeight: '900',
    padding: 14,
    borderBottomWidth: 2,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
  },
  timerBox: {
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'System',
  },
  detailsContainer: {
    gap: 8,
    marginBottom: 20,
  },
  detailRow: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    flexDirection: 'column',
    gap: 2,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrBorder: {
    borderWidth: 2,
    padding: 8,
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrCaption: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  actionsContainer: {
    padding: 16,
    borderTopWidth: 2,
    borderColor: '#000000',
    gap: 12,
  },
  actionBtn: {
    borderWidth: 2,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
});
