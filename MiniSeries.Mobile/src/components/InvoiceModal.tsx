import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator, Clipboard, Linking, AppState } from 'react-native';
import { Image } from 'expo-image';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/use-theme';
import { apiClient, BASE_URL } from '../services/apiClient';
import * as signalR from '@microsoft/signalr';
import { Ionicons } from '@expo/vector-icons';

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  planName: string;
  amount: string;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ visible, onClose, planName, amount }) => {
  const { themeId, triggerToast, setActivePlan, setMangaTokens, setVideoTokens } = useApp();
  const [secondsLeft, setSecondsLeft] = useState<number>(900); // 15 minutes

  const [loading, setLoading] = useState<boolean>(true);
  const [paymentCode, setPaymentCode] = useState<string>('');
  const [bankBin, setBankBin] = useState<string>('970422');
  const [accountNumber, setAccountNumber] = useState<string>('0909090909');
  const [accountName, setAccountName] = useState<string>('MINISERIES STUDIO');
  const [qrImageLoading, setQrImageLoading] = useState<boolean>(true);

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    triggerToast(`Đã sao chép ${label}!`);
  };

  const openPaymentApp = async (url: string, appName: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        triggerToast(`Không tìm thấy ứng dụng ${appName} trên thiết bị.`);
      }
    } catch (e) {
      console.log('Error opening app:', e);
      triggerToast(`Không thể mở ứng dụng ${appName}.`);
    }
  };



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
    let isMounted = true;

    if (visible) {
      setSecondsLeft(900);
      setLoading(true);
      setPaymentCode('');

      // Create invoice on Backend
      const initInvoice = async () => {
        try {
          const res = await apiClient.post('/payment/create-invoice', {
            amount: Number(amount),
            planName: planName
          });
          if (isMounted) {
            setPaymentCode(res.data.paymentCode);
            if (res.data.bankBin) setBankBin(res.data.bankBin);
            if (res.data.accountNumber) setAccountNumber(res.data.accountNumber);
            if (res.data.accountName) setAccountName(res.data.accountName);
            setLoading(false);
          }
        } catch (e: any) {
          console.log('Failed to create invoice:', e);
          if (isMounted) {
            triggerToast('Không thể kết nối đến máy chủ để tạo hóa đơn.');
            onClose();
          }
        }
      };

      initInvoice();

      timer = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, [visible, amount, planName]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Listen to payment status via SignalR PaymentHub with 30s slow fallback and AppState foreground trigger
  useEffect(() => {
    let connection: signalR.HubConnection | null = null;
    let fallbackInterval: any = null;
    let isMounted = true;

    const handlePaymentSuccess = () => {
      if (!isMounted) return;
      setActivePlan(planName);
      if (planName === 'Basic') {
        setMangaTokens((prev) => prev + 30);
      } else if (planName === 'Premium') {
        setMangaTokens(99999);
        setVideoTokens((prev) => prev + 30);
      }
      triggerToast(`Nâng cấp thành công gói ${planName}! 🎉`);
      onClose();
    };

    const checkPaymentStatus = async () => {
      if (!paymentCode || !isMounted) return false;
      try {
        const res = await apiClient.get('/payment/check-status', {
          params: { code: paymentCode }
        });
        if (res.data.isPaid && isMounted) {
          handlePaymentSuccess();
          return true;
        }
      } catch (e) {
        console.log('Error checking payment status:', e);
      }
      return false;
    };

    const startConnection = async () => {
      if (!visible || !paymentCode || !isMounted) return;
      
      const hubUrl = BASE_URL.replace('/api', '/hubs/payments');
      connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl)
        .configureLogging(signalR.LogLevel.None)
        .withAutomaticReconnect()
        .build();

      connection.on("PaymentReceived", (data: { isPaid: boolean }) => {
        if (data.isPaid && isMounted) {
          handlePaymentSuccess();
        }
      });

      try {
        await connection.start();
        if (!isMounted) {
          connection.stop().catch(() => {});
          return;
        }
        await connection.invoke("JoinPaymentGroup", paymentCode);
        console.log(`Subscribed to SignalR PaymentHub group: payment-${paymentCode}`);
      } catch (err) {
        console.log('Error starting SignalR connection for PaymentHub:', err);
      }
    };

    if (visible && paymentCode) {
      startConnection();

      // Fallback polling just in case SignalR fails or disconnects (every 30 seconds)
      fallbackInterval = setInterval(async () => {
        if (connection && connection.state === signalR.HubConnectionState.Connected) {
          return; // Skip polling if SignalR is active and connected
        }
        await checkPaymentStatus();
      }, 30000);

      // AppState change listener (handle background/foreground transition)
      const handleAppStateChange = async (nextAppState: string) => {
        if (nextAppState === 'active' && isMounted) {
          console.log('App returned to foreground. Checking payment status immediately...');
          const isPaid = await checkPaymentStatus();
          if (!isPaid && isMounted) {
            // Reconnect SignalR if aborted/disconnected
            if (!connection || connection.state === signalR.HubConnectionState.Disconnected) {
              console.log('SignalR disconnected during background. Reconnecting...');
              startConnection();
            }
          }
        }
      };

      const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        isMounted = false;
        if (fallbackInterval) clearInterval(fallbackInterval);
        appStateSubscription.remove();
        if (connection) {
          const conn = connection;
          const performCleanStop = async () => {
            try {
              if (conn.state === signalR.HubConnectionState.Connected) {
                await conn.invoke("LeavePaymentGroup", paymentCode);
              }
              await conn.stop();
            } catch (err) {
              console.log('Clean stop SignalR hub error:', err);
            }
          };
          performCleanStop();
        }
      };
    }
  }, [visible, paymentCode, planName]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.header, { color: colors.text, borderBottomColor: colors.border }]}>
            🏦 {bankBin === '970418' ? 'BIDV' : 'MB BANK'} CHUYỂN KHOẢN HÓA ĐƠN
          </Text>

          {loading ? (
            <View style={{ flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <ActivityIndicator size="large" color={colors.primaryAccent} />
              <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>
                Đang tạo hóa đơn giao dịch...
              </Text>
            </View>
          ) : (
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
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>NGÂN HÀNG THỤ HƯỞNG</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {bankBin === '970418' ? 'BIDV' : 'MB Bank'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => copyToClipboard(bankBin === '970418' ? 'BIDV' : 'MB Bank', 'tên ngân hàng')}
                    style={styles.copyBtn}
                  >
                    <Ionicons name="copy-outline" size={16} color={colors.primaryAccent} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>SỐ TÀI KHOẢN</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{accountNumber}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => copyToClipboard(accountNumber, 'số tài khoản')}
                    style={styles.copyBtn}
                  >
                    <Ionicons name="copy-outline" size={16} color={colors.primaryAccent} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>TÊN THỤ HƯỞNG</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{accountName}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => copyToClipboard(accountName, 'tên thụ hưởng')}
                    style={styles.copyBtn}
                  >
                    <Ionicons name="copy-outline" size={16} color={colors.primaryAccent} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>SỐ TIỀN THANH TOÁN</Text>
                    <Text style={[styles.detailValue, { color: colors.primaryAccent }]}>{amount}đ</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => copyToClipboard(String(amount).replace(/[^0-9]/g, ''), 'số tiền')}
                    style={styles.copyBtn}
                  >
                    <Ionicons name="copy-outline" size={16} color={colors.primaryAccent} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC CHÍNH XÁC)</Text>
                    <Text style={[styles.detailValue, { color: colors.text, fontWeight: '900' }]}>{paymentCode}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => copyToClipboard(paymentCode, 'nội dung chuyển khoản')}
                    style={styles.copyBtn}
                  >
                    <Ionicons name="copy-outline" size={16} color={colors.primaryAccent} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* QR Mock Image */}
              <View style={styles.qrContainer}>
                <View style={[styles.qrBorder, { borderColor: colors.border, backgroundColor: colors.qrBg }]}>
                  {qrImageLoading && (
                    <ActivityIndicator size="small" color={colors.primaryAccent} style={{ position: 'absolute' }} />
                  )}
                  <Image
                    source={{
                      uri: `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.jpg?amount=${String(amount).replace(/[^0-9]/g, '')}&addInfo=${encodeURIComponent(paymentCode)}&accountName=${encodeURIComponent(accountName)}`
                    }}
                    style={styles.qrImage}
                    contentFit="contain"
                    onLoadStart={() => setQrImageLoading(true)}
                    onLoadEnd={() => setQrImageLoading(false)}
                    onError={(e) => {
                      console.log('VietQR Image Load Error:', e);
                      setQrImageLoading(false);
                    }}
                  />
                </View>
                <Text style={[styles.qrCaption, { color: colors.textMuted }]}>
                  Chụp màn hình mã QR hoặc dùng các lối tắt bên dưới để thanh toán nhanh
                </Text>

                {/* Quick App Shortcuts */}
                <View style={styles.shortcutsContainer}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => openPaymentApp('momo://', 'MoMo')}
                    style={[styles.shortcutBtn, { borderColor: '#d24d80', backgroundColor: 'rgba(210, 77, 128, 0.08)', alignSelf: 'center', width: '100%', maxWidth: 220 }]}
                  >
                    <Ionicons name="wallet-outline" size={14} color="#d24d80" />
                    <Text style={[styles.shortcutBtnText, { color: '#d24d80' }]}>Mở ví MoMo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Action Buttons */}
          {!loading && (
            <View style={[styles.actionsContainer, { borderTopColor: colors.border }]}>
              <View style={{ paddingVertical: 12, alignItems: 'center', marginBottom: 10 }}>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                style={[styles.actionBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.text }]}>HỦY GIAO DỊCH</Text>
              </TouchableOpacity>
            </View>
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
    maxHeight: '90%',
    borderWidth: 1,
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    padding: 16,
    borderBottomWidth: 1,
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  copyBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrBorder: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    width: 270,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  qrCaption: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  shortcutsContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  shortcutBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shortcutBtnText: {
    fontSize: 12,
    fontWeight: '800',
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
