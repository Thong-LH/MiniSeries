import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/use-theme';

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  planName: string;
  amount: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ visible, onClose, planName, amount }) => {
  const { themeId, triggerToast, setActivePlan, setMangaTokens, setVideoTokens } = useApp();
  const [secondsLeft, setSecondsLeft] = useState<number>(900); // 15 minutes

  const theme = useTheme();
  const isDark = theme.isDark;
  const colors = {
    bg: isDark ? 'rgba(3, 7, 18, 0.85)' : 'rgba(248, 250, 252, 0.85)',
    text: theme.text,
    textMuted: theme.textMuted,
    border: theme.border,
    primaryAccent: theme.primaryAccent,
    cardBg: theme.cardBg,
    qrBg: '#FFFFFF',
  };

  useEffect(() => {
    let timer: any;
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
              <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>NGÂN HÀNG THỤ HƯỞNG</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>MB Bank (Ngân hàng Quân Đội)</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>SỐ TÀI KHOẢN</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>0909090909</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>TÊN THỤ HƯỞNG</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>MINISERIES STUDIO</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>SỐ TIỀN</Text>
                <Text style={[styles.detailValue, { color: colors.primaryAccent }]}>{amount}đ</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>NỘI DUNG CHUYỂN KHOẢN</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>MINISERIES VIP {planName.toUpperCase()}</Text>
              </View>
            </View>

            {/* QR Mock Image */}
            <View style={styles.qrContainer}>
              <View style={[styles.qrBorder, { borderColor: colors.border, backgroundColor: colors.qrBg }]}>
                <Image
                  source={{ uri: `https://api.vietqr.io/image/970422-0909090909-4OitQ0s.jpg?accountName=MINISERIES%20STUDIO&amount=${planName === 'Basic' ? '10000' : '30000'}&addInfo=MINISERIES%20VIP%20${planName.toUpperCase()}` }}
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
          <View style={[styles.actionsContainer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleConfirm}
              style={[styles.actionBtn, { backgroundColor: colors.primaryAccent, borderColor: colors.primaryAccent }]}
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
    borderWidth: 1,
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    fontSize: 14,
    fontWeight: '900',
    padding: 14,
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
    borderWidth: 1,
    borderRadius: 12,
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
    borderTopWidth: 1,
    gap: 12,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 10,
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
