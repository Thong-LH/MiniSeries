import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { InvoiceModal } from '../../components/InvoiceModal';
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
    updateStatsFromData,
    globalStreak
  } = useApp();
  const router = useRouter();
  const navigation = useNavigation();

  // Invoice modal states
  const [invoiceVisible, setInvoiceVisible] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<string>('');

  const colors = useTheme();
  const isDark = colors.isDark;

  const toggleTheme = () => {
    setThemeId(isDark ? 'bold-typography' : 'bold-typography-dark');
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await apiClient.get('/progress/dashboard');
      if (res.data) {
        updateStatsFromData(res.data);
      }
    } catch (e) {
      console.log('Error fetching stats in profile:', e);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshProfile();
      fetchDashboardStats();
      apiClient.post('/analytics/track', { path: '/profile', deviceType: 'Mobile' }).catch(() => {});
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    refreshProfile();
    fetchDashboardStats();
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

          {/* Token Badge */}
          <View style={[styles.headerTokenBadge, { borderColor: colors.border, backgroundColor: colors.bg }]}>
            <Ionicons name="book-outline" size={12} color={colors.text} style={{ marginRight: 2 }} />
            <Text style={[styles.headerTokenText, { color: colors.text }]}>
              {mangaTokens > 1000 ? '∞' : mangaTokens}
            </Text>
            <Text style={{ color: colors.textMuted, marginHorizontal: 4, fontSize: 10 }}>|</Text>
            <Ionicons name="film-outline" size={12} color={colors.text} style={{ marginRight: 2 }} />
            <Text style={[styles.headerTokenText, { color: colors.text }]}>
              {videoTokens}
            </Text>
          </View>

          {/* Unified Theme Toggle Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleTheme}
            style={[styles.headerThemeBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={14} color={colors.text} />
          </TouchableOpacity>

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

        {/* Basic Plan */}
        <View style={[
          styles.planCard,
          { borderColor: activePlan === 'Basic' ? colors.primaryAccent : colors.border, backgroundColor: colors.cardBg, shadowColor: isDark ? '#000000' : '#0f172a' },
          activePlan === 'Basic' && { borderWidth: 2 }
        ]}>
          <View style={[styles.planHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.planTitle, { color: colors.text }]}>BASIC PLAN</Text>
            <Text style={[styles.planPrice, { color: activePlan === 'Basic' ? colors.primaryAccent : colors.text }]}>10,000đ / tháng</Text>
          </View>
          <Text style={[styles.planDesc, { color: colors.textMuted }]}>
            Phần lớn học viên cá nhân muốn trải nghiệm bài giảng trắc nghiệm truyện tranh AI.
          </Text>
          <View style={styles.featuresList}>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ 30 Manga Tokens củng cố kiến thức</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Truy cập mọi bài giảng truyện tranh mẫu</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Hỗ trợ khách hàng tiêu chuẩn 24/7</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleUpgradeClick('Basic', '10000')}
            disabled={activePlan === 'Basic'}
            style={[
              styles.planBtn,
              {
                backgroundColor: activePlan === 'Basic' ? 'transparent' : colors.primaryAccent,
                borderColor: activePlan === 'Basic' ? colors.border : colors.primaryAccent
              }
            ]}
          >
            <Text style={[styles.planBtnText, { color: activePlan === 'Basic' ? colors.text : '#ffffff' }]}>
              {activePlan === 'Basic' ? 'ĐANG SỬ DỤNG' : 'NÂNG CẤP GÓI'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Premium Plan */}
        <View style={[
          styles.planCard,
          { borderColor: activePlan === 'Premium' ? colors.plasmaAccent : colors.border, backgroundColor: colors.cardBg, shadowColor: isDark ? '#000000' : '#0f172a' },
          activePlan === 'Premium' && { borderWidth: 2 }
        ]}>
          <View style={[styles.planHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.planTitle, { color: colors.text }]}>PREMIUM PLAN</Text>
            <Text style={[styles.planPrice, { color: activePlan === 'Premium' ? colors.plasmaAccent : colors.text }]}>30,000đ / tháng</Text>
          </View>
          <Text style={[styles.planDesc, { color: colors.textMuted }]}>
            Dành cho người sáng tạo và giảng viên muốn thiết kế khối lượng bài học lớn bằng cả video & manga.
          </Text>
          <View style={styles.featuresList}>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Không giới hạn bài học truyện tranh (Manga)</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ 10 Video Tokens sinh hoạt cảnh AI hàng tháng</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Chất lượng hình ảnh sắc nét, tùy biến cao</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Ưu tiên hỗ trợ CSKH trực tuyến 24/7</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleUpgradeClick('Premium', '30000')}
            disabled={activePlan === 'Premium'}
            style={[
              styles.planBtn,
              {
                backgroundColor: activePlan === 'Premium' ? 'transparent' : colors.plasmaAccent,
                borderColor: activePlan === 'Premium' ? colors.border : colors.plasmaAccent
              }
            ]}
          >
            <Text style={[styles.planBtnText, { color: activePlan === 'Premium' ? colors.text : '#ffffff' }]}>
              {activePlan === 'Premium' ? 'ĐANG SỬ DỤNG' : 'NÂNG CẤP GÓI'}
            </Text>
          </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerTokenBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTokenText: {
    fontSize: 11,
    fontWeight: '900',
  },
  headerRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    fontSize: 11,
    fontWeight: '900',
  },
  headerThemeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
});
