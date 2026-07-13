import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { InvoiceModal } from '../../components/InvoiceModal';
import { PaymentHistoryModal } from '../../components/PaymentHistoryModal';
import { FeedbackModal } from '../../components/FeedbackModal';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';
import { SpaceBackground } from '../../components/SpaceBackground';
import { useTheme } from '../../hooks/use-theme';
import { LevelAvatar } from '../../components/LevelAvatar';
export default function ProfileScreen() {
  const {
    themeId,
    setThemeId,
    activePlan,
    userEmail,
    mangaTokens,
    videoTokens,
    setIsAuthenticated,
    triggerToast,
    refreshProfile,
    refreshStats,
    globalStreak
  } = useApp();
  const router = useRouter();
  const navigation = useNavigation();

  // Invoice modal states
  const [invoiceVisible, setInvoiceVisible] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [historyVisible, setHistoryVisible] = useState<boolean>(false);
  const [feedbackVisible, setFeedbackVisible] = useState<boolean>(false);

  const colors = useTheme();
  const isDark = colors.isDark;

  const toggleTheme = () => {
    setThemeId(isDark ? 'bold-typography' : 'bold-typography-dark');
  };

  const lastFetchTimeRef = useRef<number>(0);

  const fetchProfileData = async () => {
    try {
      await Promise.all([
        refreshProfile(),
        refreshStats()
      ]);
    } catch (e) {
      console.log('Error fetching profile data:', e);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const now = Date.now();
      if (now - lastFetchTimeRef.current > 3000) {
        lastFetchTimeRef.current = now;
        fetchProfileData();
      }
      apiClient.post('/analytics/track', { path: '/profile', deviceType: 'Mobile' }).catch(() => { });
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    lastFetchTimeRef.current = Date.now();
    fetchProfileData();
  }, []);

  const renderStreakFlame = (streakCount: number, size: number = 14) => {
    if (streakCount === 0) {
      return <Text style={{ fontSize: size, opacity: 0.35 }}>❄️</Text>;
    }
    if (streakCount < 3) {
      return <Text style={{ fontSize: size }}>🔥</Text>;
    }
    if (streakCount < 7) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: size }}>🔥</Text>
          <Text style={{ fontSize: size - 2, color: '#eab308', marginLeft: -2 }}>⚡</Text>
        </View>
      );
    }
    if (streakCount < 30) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: size }}>🔥</Text>
          <Text style={{ fontSize: size - 4, color: '#38bdf8', marginHorizontal: -2 }}>✨</Text>
          <Text style={{ fontSize: size }}>🔥</Text>
        </View>
      );
    }
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size - 6, marginBottom: -3 }}>👑</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: size - 4, color: '#a855f7' }}>✨</Text>
          <Text style={{ fontSize: size + 2 }}>🔥</Text>
          <Text style={{ fontSize: size - 4, color: '#a855f7' }}>✨</Text>
        </View>
      </View>
    );
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    triggerToast('Đã đăng xuất tài khoản!');
    router.replace('/(auth)/login');
  };

  const handleUpgradeClick = (planName: string, amount: string) => {
    setSelectedPlan(planName);
    setSelectedAmount(amount);
    setInvoiceVisible(true);
  };

  const displayName = userEmail ? userEmail.split('@')[0].toUpperCase() : 'USER';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <SpaceBackground />
      {/* Unified Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.cardBg }]}>
        <Text style={[styles.brand, { color: colors.text }]}>MINISERIES</Text>

        <View style={styles.headerRightBadges}>
          {/* Streak Flame Badge */}
          <View style={[styles.streakBadge, { borderColor: colors.border, backgroundColor: colors.bg, paddingLeft: 6, paddingRight: 8 }]}>
            {renderStreakFlame(globalStreak, 13)}
            <Text style={[styles.streakText, { color: colors.text, marginLeft: 3 }]}>{globalStreak}</Text>
          </View>
          {/* Gamified Level Avatar with Circular Progress */}
          <LevelAvatar />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={[styles.userCard, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: isDark ? '#000000' : '#0f172a' }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryAccent }]}>
            <Text style={styles.avatarText}>
              {displayName[0]}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>{userEmail || 'customer@miniseries.com'}</Text>
            <View style={[styles.tierBadge, { borderColor: colors.border, backgroundColor: colors.text }]}>
              <Text style={[styles.tierBadgeText, { color: colors.bg }]}>
                {activePlan.toUpperCase()} PLAN
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Header */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>NÂNG CẤP GÓI CƯỚC</Text>

        {/* Basic Pack */}
        <View style={[
          styles.planCard,
          { borderColor: colors.primaryAccent, backgroundColor: colors.cardBg, shadowColor: isDark ? '#000000' : '#0f172a' },
        ]}>
          <View style={[styles.planHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.planTitle, { color: colors.text }]}>BASIC PACK</Text>
            <Text style={[styles.planPrice, { color: colors.primaryAccent }]}>150,000đ</Text>
          </View>
          <Text style={[styles.planDesc, { color: colors.textMuted }]}>
            Phần lớn học viên cá nhân muốn trải nghiệm bài giảng trắc nghiệm truyện tranh và hoạt cảnh AI.
          </Text>
          <View style={styles.featuresList}>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Nhận ngay +20 Manga Tokens tạo truyện</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Nhận ngay +5 Video Tokens hoạt cảnh AI</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Lượt tạo cộng dồn vĩnh viễn, không hết hạn</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Quy đổi siêu tiết kiệm cho nhu cầu học tập</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleUpgradeClick('Basic', '150000')}
            style={[
              styles.planBtn,
              {
                backgroundColor: colors.primaryAccent,
                borderColor: colors.primaryAccent
              }
            ]}
          >
            <Text style={[styles.planBtnText, { color: '#ffffff' }]}>
              MUA GÓI BASIC
            </Text>
          </TouchableOpacity>
        </View>

        {/* Premium Pack */}
        <View style={[
          styles.planCard,
          { borderColor: '#fbbf24', backgroundColor: colors.cardBg, shadowColor: isDark ? '#000000' : '#0f172a' },
        ]}>
          <View style={[styles.planHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.planTitle, { color: colors.text }]}>PREMIUM PACK</Text>
            <Text style={[styles.planPrice, { color: '#fbbf24' }]}>300,000đ</Text>
          </View>
          <Text style={[styles.planDesc, { color: colors.textMuted }]}>
            Dành cho người sáng tạo và giảng viên muốn thiết kế khối lượng bài học lớn bằng cả video & manga.
          </Text>
          <View style={styles.featuresList}>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Nhận ngay +45 Manga Tokens tạo truyện</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Nhận ngay +15 Video Tokens hoạt cảnh AI</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Tiết kiệm hơn 35% so với gói Basic</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Lượt tạo cộng dồn vĩnh viễn, không hết hạn</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleUpgradeClick('Premium', '300000')}
            style={[
              styles.planBtn,
              {
                backgroundColor: '#fbbf24',
                borderColor: '#fbbf24'
              }
            ]}
          >
            <Text style={[styles.planBtnText, { color: '#000000' }]}>
              MUA GÓI PREMIUM
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buy individual tokens section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>MUA LẺ TỪNG LƯỢT TẠO (PAY-AS-YOU-GO)</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {/* Manga token lẻ */}
          <View style={[
            styles.addonCard,
            { flex: 1, borderColor: colors.primaryAccent, backgroundColor: colors.cardBg }
          ]}>
            <Text style={[styles.addonTitle, { color: colors.primaryAccent }]}>Manga lẻ</Text>
            <Text style={[styles.addonPrice, { color: colors.text }]}>10.000đ</Text>
            <Text style={[styles.addonDesc, { color: colors.textMuted }]}>+1 lượt tạo Truyện</Text>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleUpgradeClick('addon_manga_1', '10000')}
              style={[styles.addonBtn, { backgroundColor: colors.primaryAccent }]}
            >
              <Text style={[styles.addonBtnText, { color: '#ffffff' }]}>Mua Manga</Text>
            </TouchableOpacity>
          </View>

          {/* Video token lẻ */}
          <View style={[
            styles.addonCard,
            { flex: 1, borderColor: '#38bdf8', backgroundColor: colors.cardBg }
          ]}>
            <Text style={[styles.addonTitle, { color: '#38bdf8' }]}>Video lẻ</Text>
            <Text style={[styles.addonPrice, { color: colors.text }]}>30.000đ</Text>
            <Text style={[styles.addonDesc, { color: colors.textMuted }]}>+1 lượt tạo Video</Text>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleUpgradeClick('addon_video_1', '30000')}
              style={[styles.addonBtn, { backgroundColor: '#38bdf8' }]}
            >
              <Text style={[styles.addonBtnText, { color: '#000000' }]}>Mua Video</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CÀI ĐẶT GIAO DIỆN (Theme Setting Shortcut) */}
        <View style={[styles.themeSettingCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="moon-outline" size={24} color={colors.primaryAccent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.supportTitle, { color: colors.text }]}>CHẾ ĐỘ TỐI</Text>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>
                Thay đổi chế độ Sáng / Tối của hệ thống
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#475569', true: colors.primaryAccent }}
              thumbColor={isDark ? '#ffffff' : '#94a3b8'}
            />
          </View>
        </View>

        {/* Customer Support Shortcut (Consultation & Billing, Profile section) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/support?mode=support')}
          style={[styles.supportShortcutCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primaryAccent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.supportTitle, { color: colors.text }]}>TRUNG TÂM CSKH & TƯ VẤN</Text>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>Hỗ trợ giải đáp thanh toán, gói cước và tài khoản</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </View>
        </TouchableOpacity>        {/* Transaction History Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setHistoryVisible(true)}
          style={[styles.supportShortcutCard, { borderColor: colors.border, backgroundColor: colors.cardBg, marginTop: 12 }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="receipt-outline" size={24} color={colors.primaryAccent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.supportTitle, { color: colors.text }]}>LỊCH SỬ THANH TOÁN</Text>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>Xem toàn bộ lịch sử giao dịch và hóa đơn của bạn</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </View>
        </TouchableOpacity>

        {/* Feedback Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setFeedbackVisible(true)}
          style={[styles.supportShortcutCard, { borderColor: colors.border, backgroundColor: colors.cardBg, marginTop: 12 }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="star-outline" size={24} color="#eab308" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.supportTitle, { color: colors.text }]}>GỬI ĐÁNH GIÁ</Text>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: '700' }}>Chia sẻ trải nghiệm của bạn để giúp chúng tôi cải thiện</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </View>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleLogout}
          style={[styles.logoutBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.logoutBtnText, { color: colors.text }]}>ĐĂNG XUẤT TÀI KHOẢN</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Payment History Modal */}
      <PaymentHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
      />

      {/* Dynamic VietQR Invoice Payment Modal */}
      <InvoiceModal
        visible={invoiceVisible}
        onClose={() => {
          setInvoiceVisible(false);
          refreshProfile();
        }}
        planName={selectedPlan}
        amount={selectedAmount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerTokenBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTokenText: {
    fontSize: 14,
    fontWeight: '900',
  },
  headerRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '900',
  },
  headerThemeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  tierBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 16,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '900',
  },
  planDesc: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 14,
  },
  featuresList: {
    marginBottom: 16,
    gap: 8,
  },
  featureItem: {
    fontSize: 11,
    fontWeight: '700',
  },
  planBtn: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  supportShortcutCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    justifyContent: 'center',
  },
  supportTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  logoutBtn: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addonCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addonTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  addonPrice: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  addonDesc: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  addonBtn: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonBtnText: {
    fontSize: 11,
    fontWeight: '900',
  },
  themeSettingCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
});
