import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { InvoiceModal } from '../../components/InvoiceModal';
import { Ionicons } from '@expo/vector-icons';

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
    refreshProfile 
  } = useApp();
  const router = useRouter();
  const navigation = useNavigation();

  // Invoice modal states
  const [invoiceVisible, setInvoiceVisible] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<string>('');

  const isDark = themeId === 'bold-typography-dark';
  const colors = {
    bg: isDark ? '#121212' : '#FAF9F6',
    text: isDark ? '#FAF9F6' : '#1A1A1A',
    textMuted: isDark ? '#CFCFCF' : '#4A4A4A',
    border: isDark ? '#FFFFFF' : '#000000',
    primaryAccent: '#FF3E00',
    cardBg: isDark ? '#1a1a1a' : '#ffffff',
  };

  const toggleTheme = () => {
    setThemeId(isDark ? 'bold-typography' : 'bold-typography-dark');
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshProfile();
    });
    return unsubscribe;
  }, [navigation]);

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
      {/* Unified Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.brand, { color: colors.text }]}>MINISERIES</Text>
        
        {/* Token Badge */}
        <View style={[styles.headerTokenBadge, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
          <Ionicons name="book-outline" size={13} color={colors.text} style={{ marginRight: 2 }} />
          <Text style={[styles.headerTokenText, { color: colors.text }]}>
            {mangaTokens > 1000 ? '∞' : mangaTokens}
          </Text>
          <Text style={{ color: colors.textMuted, marginHorizontal: 6, fontSize: 10 }}>|</Text>
          <Ionicons name="film-outline" size={13} color={colors.text} style={{ marginRight: 2 }} />
          <Text style={[styles.headerTokenText, { color: colors.text }]}>
            {videoTokens}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleTheme}
            style={[styles.headerButton, { borderColor: colors.border }]}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={[styles.userCard, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: colors.border }]}>
          <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.primaryAccent }]}>
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
          { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: colors.border },
          activePlan === 'Basic' && { borderWidth: 4, borderColor: colors.primaryAccent }
        ]}>
          <View style={styles.planHeader}>
            <Text style={[styles.planTitle, { color: colors.text }]}>BASIC PLAN</Text>
            <Text style={[styles.planPrice, { color: colors.primaryAccent }]}>10,000đ / tháng</Text>
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
                backgroundColor: activePlan === 'Basic' ? 'transparent' : colors.text,
                borderColor: colors.border
              }
            ]}
          >
            <Text style={[styles.planBtnText, { color: activePlan === 'Basic' ? colors.text : colors.bg }]}>
              {activePlan === 'Basic' ? 'ĐANG SỬ DỤNG' : 'NÂNG CẤP GÓI'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Premium Plan */}
        <View style={[
          styles.planCard,
          { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: colors.border },
          activePlan === 'Premium' && { borderWidth: 4, borderColor: colors.primaryAccent }
        ]}>
          <View style={styles.planHeader}>
            <Text style={[styles.planTitle, { color: colors.text }]}>PREMIUM PLAN</Text>
            <Text style={[styles.planPrice, { color: colors.primaryAccent }]}>30,000đ / tháng</Text>
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
                backgroundColor: activePlan === 'Premium' ? 'transparent' : colors.text,
                borderColor: colors.border
              }
            ]}
          >
            <Text style={[styles.planBtnText, { color: activePlan === 'Premium' ? colors.text : colors.bg }]}>
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
    borderBottomWidth: 2,
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
    borderWidth: 2,
    paddingVertical: 6,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    borderWidth: 2,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderWidth: 2,
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
    borderWidth: 2,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
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
    borderWidth: 2,
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
    borderWidth: 2,
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
    borderWidth: 2,
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
