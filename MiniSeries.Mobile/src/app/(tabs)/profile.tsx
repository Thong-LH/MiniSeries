import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { InvoiceModal } from '../../components/InvoiceModal';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { themeId, activePlan, userName, userEmail, setIsAuthenticated, triggerToast, refreshProfile } = useApp();
  const router = useRouter();

  // Invoice modal states
  const [invoiceVisible, setInvoiceVisible] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<string>('');

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const colors = {
    bg: '#050811', // Deep dark cosmic blue/black matching Web
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: 'rgba(124, 58, 237, 0.3)',
    borderActive: '#0ea5e9', // Cyan active border matching Web
    primaryAccent: '#6366f1', // Indigo accent
    secondaryAccent: '#0ea5e9', // Cyan accent
    cardBg: '#0d111d', // Very dark grey-blue matching Web
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
      {/* Background Glows */}
      <View style={styles.glowTop} />
      
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.brand, { color: '#0ea5e9', fontWeight: '900' }]}>
          MINISERIES<Text style={{ color: '#d946ef' }}>LEARNING</Text>
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>👤 VIP & HỒ SƠ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* User Card */}
        <View style={[styles.userCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
          <View style={[styles.avatar, { borderColor: colors.secondaryAccent, backgroundColor: colors.primaryAccent }]}>
            <Text style={styles.avatarText}>
              {(userName || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{userName || 'User'}</Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>{userEmail || 'customer@miniseries.com'}</Text>
            <View style={[styles.tierBadge, { borderColor: colors.secondaryAccent, backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Text style={[styles.tierBadgeText, { color: colors.secondaryAccent }]}>
                {activePlan.toUpperCase()} PLAN
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Header */}
        <Text style={[styles.sectionTitle, { color: colors.text, textAlign: 'center' }]}>Chọn gói MiniSeries</Text>
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 20, paddingHorizontal: 16, lineHeight: 16 }}>
          Mỗi gói cấp số lượt generate trong 1 tháng. Một lượt được tính khi bạn phê duyệt script để hệ thống tạo media và quiz hoàn chỉnh.
        </Text>

        {/* Free Plan */}
        <View style={[
          styles.planCard,
          { borderColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: colors.cardBg },
          activePlan === 'Free' && { borderColor: colors.borderActive, borderWidth: 1.5 }
        ]}>
          <View style={styles.planHeader}>
            <Text style={[styles.planTitle, { color: colors.text }]}>Free</Text>
            <Text style={[styles.planPrice, { color: colors.secondaryAccent }]}>0đ / tháng</Text>
          </View>
          <Text style={[styles.planDesc, { color: colors.textMuted }]}>
            Trải nghiệm flow tạo MiniSeries cơ bản.
          </Text>
          <View style={styles.featuresList}>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ 3 lượt generate / tháng</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Trải nghiệm flow tạo MiniSeries cơ bản</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Tạo script, chapter, quiz và media</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Phù hợp để dùng thử</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={true}
            style={[
              styles.planBtn,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }
            ]}
          >
            <Text style={[styles.planBtnText, { color: colors.textMuted }]}>
              {activePlan === 'Free' ? 'ĐANG SỬ DỤNG' : 'GÓI MẶC ĐỊNH'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Basic Plan */}
        <View style={[
          styles.planCard,
          { borderColor: colors.border, backgroundColor: colors.cardBg },
          activePlan === 'Basic' && { borderColor: colors.borderActive, borderWidth: 1.5 }
        ]}>
          {/* Popular Badge */}
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>Phổ biến</Text>
          </View>

          <View style={styles.planHeader}>
            <Text style={[styles.planTitle, { color: colors.text }]}>Basic</Text>
            <Text style={[styles.planPrice, { color: colors.secondaryAccent }]}>150.000đ / tháng</Text>
          </View>
          <Text style={[styles.planDesc, { color: colors.textMuted }]}>
            Phù hợp cho học sinh, sinh viên hoặc giáo viên dùng thường xuyên.
          </Text>
          <View style={styles.featuresList}>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ 30 lượt generate / tháng</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Phù hợp cho học sinh, sinh viên hoặc giáo viên</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Ưu tiên cho nội dung manga và quiz</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Reset quota theo kỳ thanh toán</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleUpgradeClick('Basic', '150.000đ')}
            disabled={activePlan === 'Basic'}
            style={[
              styles.planBtn,
              {
                backgroundColor: activePlan === 'Basic' ? 'transparent' : colors.primaryAccent,
                borderColor: activePlan === 'Basic' ? colors.border : colors.primaryAccent
              }
            ]}
          >
            <Text style={[styles.planBtnText, { color: colors.text }]}>
              {activePlan === 'Basic' ? 'ĐANG SỬ DỤNG' : 'Mua gói Basic'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Premium Plan */}
        <View style={[
          styles.planCard,
          { borderColor: colors.border, backgroundColor: colors.cardBg },
          activePlan === 'Premium' && { borderColor: colors.borderActive, borderWidth: 1.5 }
        ]}>
          <View style={styles.planHeader}>
            <Text style={[styles.planTitle, { color: colors.text }]}>Premium</Text>
            <Text style={[styles.planPrice, { color: colors.secondaryAccent }]}>300.000đ / tháng</Text>
          </View>
          <Text style={[styles.planDesc, { color: colors.textMuted }]}>
            Dành cho người dùng tạo nhiều bài học, video và manga dài.
          </Text>
          <View style={styles.featuresList}>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ 100 lượt generate / tháng</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Dành cho người dùng tạo nhiều bài học</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Phù hợp cho video, manga và nội dung dài hơn</Text>
            <Text style={[styles.featureItem, { color: colors.text }]}>✓ Reset quota theo kỳ thanh toán</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleUpgradeClick('Premium', '300.000đ')}
            disabled={activePlan === 'Premium'}
            style={[
              styles.planBtn,
              {
                backgroundColor: activePlan === 'Premium' ? 'transparent' : '#eab308',
                borderColor: activePlan === 'Premium' ? colors.border : '#eab308'
              }
            ]}
          >
            <Text style={[styles.planBtnText, { color: activePlan === 'Premium' ? colors.text : '#050811', fontWeight: '900' }]}>
              {activePlan === 'Premium' ? 'ĐANG SỬ DỤNG' : 'Mua gói Premium'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Support Request Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/support')}
          style={[
            styles.supportBtn,
            {
              backgroundColor: colors.secondaryAccent,
              borderColor: colors.secondaryAccent,
            }
          ]}
        >
          <Text style={styles.supportBtnText}>👤 BÁO CÁO LỖI & THẮC MẮC</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={[styles.logoutBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.logoutBtnText, { color: colors.text }]}>ĐANG XUẤT TÀI KHOẢN</Text>
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
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 48 : 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  brand: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
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
    fontSize: 18,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '500',
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  tierBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#d946ef',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 10,
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '900',
  },
  planDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 14,
  },
  featuresList: {
    gap: 8,
    marginBottom: 16,
  },
  featureItem: {
    fontSize: 12,
    fontWeight: '600',
  },
  planBtn: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  supportBtn: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#06b6d4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  supportBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginTop: 16,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
