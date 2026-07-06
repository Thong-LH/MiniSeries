import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { InvoiceModal } from '../../components/InvoiceModal';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { themeId, activePlan, setIsAuthenticated, triggerToast } = useApp();
  const router = useRouter();

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

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.brand, { color: colors.text }]}>👤 VIP & HỒ SƠ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={[styles.userCard, { borderColor: colors.border, backgroundColor: colors.cardBg, shadowColor: colors.border }]}>
          <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.primaryAccent }]}>
            <Text style={styles.avatarText}>L</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>LÊ HỒNG THÔNG</Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>thonglhse182025@fpt.edu.vn</Text>
            <View style={[styles.tierBadge, { borderColor: colors.border, backgroundColor: colors.text }]}>
              <Text style={[styles.tierBadgeText, { color: colors.bg }]}>
                {activePlan.toUpperCase()} PLAN
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Header */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>👑 NÂNG CẤP GÓI CƯỚC TOKENS</Text>

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
            Phù hợp cho học viên cá nhân muốn trải nghiệm bài giảng trắc nghiệm truyện tranh AI.
          </Text>
          <View style={styles.featuresList}>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ 30 Manga Tokens củng cố kiến thức</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Truy cập mọi bài giảng truyện tranh mẫu</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Hỗ trợ khách hàng tiêu chuẩn 24/7</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleUpgradeClick('Basic', '10,000đ')}
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
            <Text style={[styles.planPrice, { color: colors.primaryAccent }]}>50,000đ / tháng</Text>
          </View>
          <Text style={[styles.planDesc, { color: colors.textMuted }]}>
            Gói tối ưu cho giáo viên, học viên chuyên sâu, tạo không giới hạn bài học.
          </Text>
          <View style={styles.featuresList}>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ VÔ HẠN Manga Tokens tạo bài học</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ 30 Video Tokens tạo bài giảng phim ngắn</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Thứ tự ưu tiên Render AI tốc độ cao</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Hỗ trợ kỹ thuật ưu tiên cao nhất</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleUpgradeClick('Premium', '50,000đ')}
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

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={[styles.logoutBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.logoutBtnText, { color: colors.text }]}>ĐĂNG XUẤT TÀI KHOẢN</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Invoice Modal for MB Bank Transfer */}
      <InvoiceModal
        visible={invoiceVisible}
        planName={selectedPlan}
        amount={selectedAmount}
        onClose={() => setInvoiceVisible(false)}
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
  userCard: {
    borderWidth: 2,
    padding: 16,
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
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 11,
    fontWeight: '700',
  },
  tierBadge: {
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  tierBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  planCard: {
    borderWidth: 2,
    padding: 16,
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
    borderBottomWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 10,
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '900',
  },
  planDesc: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 14,
  },
  featuresList: {
    gap: 8,
    marginBottom: 16,
  },
  featureItem: {
    fontSize: 12,
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
    letterSpacing: 1,
  },
  logoutBtn: {
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginTop: 12,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
