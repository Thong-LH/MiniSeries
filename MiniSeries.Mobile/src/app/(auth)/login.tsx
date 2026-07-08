import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { apiClient, setAuthToken } from '../../services/apiClient';
import { SpaceBackground } from '../../components/SpaceBackground';
import { useTheme } from '../../hooks/use-theme';

export default function LoginScreen() {
  const { 
    themeId, 
    setIsAuthenticated, 
    setMangaTokens, 
    setVideoTokens, 
    setActivePlan, 
    setUserEmail, 
    triggerToast 
  } = useApp();
  const router = useRouter();

  // Modes: 'login' | 'register' | 'otp'
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'otp'>('login');

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const colors = useTheme();
  const isDark = colors.isDark;

  const handleEmailLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      triggerToast('Vui lòng nhập Email và Mật khẩu!');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login-profile', {
        email: cleanEmail,
        password: password,
      });

      const data = res.data;
      if (data && data.accessToken) {
        setAuthToken(data.accessToken);
        setIsAuthenticated(true);
        if (data.planName) setActivePlan(data.planName);
        if (data.remainingMangaCount !== undefined) setMangaTokens(data.remainingMangaCount);
        if (data.remainingVideoCount !== undefined) setVideoTokens(data.remainingVideoCount);
        setUserEmail(cleanEmail);

        triggerToast('Đăng nhập thành công!');
        router.replace('/(tabs)/create');
      } else {
        triggerToast('Đăng nhập thất bại. Vui lòng kiểm tra lại!');
      }
    } catch (err: any) {
      console.log('Lỗi đăng nhập:', err);
      const errMsg = err.response?.data?.message || 'Email hoặc mật khẩu không chính xác!';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFullName || !cleanEmail || !password) {
      triggerToast('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    if (password.length < 6) {
      triggerToast('Mật khẩu phải chứa ít nhất 6 ký tự!');
      return;
    }
    if (password !== confirmPassword) {
      triggerToast('Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/register-profile', {
        email: cleanEmail,
        password: password,
        fullName: cleanFullName,
        supabaseUserId: '',
      });
      triggerToast('Mã OTP xác thực đã được gửi tới email của bạn!');
      setViewMode('otp');
    } catch (err: any) {
      console.log('Lỗi đăng ký:', err);
      const errMsg = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp) {
      triggerToast('Vui lòng nhập mã xác thực OTP!');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/verify-otp', {
        email: cleanEmail,
        otpCode: cleanOtp,
        fullName: fullName.trim(),
        supabaseUserId: '',
      });

      const data = res.data;
      if (data && data.accessToken) {
        setAuthToken(data.accessToken);
        setIsAuthenticated(true);
        if (data.planName) setActivePlan(data.planName);
        if (data.remainingMangaCount !== undefined) setMangaTokens(data.remainingMangaCount);
        if (data.remainingVideoCount !== undefined) setVideoTokens(data.remainingVideoCount);
        setUserEmail(cleanEmail);

        triggerToast('Đăng ký tài khoản thành công!');
        router.replace('/(tabs)/create');
      } else {
        triggerToast('Xác thực thất bại. Vui lòng thử lại!');
      }
    } catch (err: any) {
      console.log('Lỗi xác thực OTP:', err);
      const errMsg = err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn!';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <SpaceBackground />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={[
          styles.card, 
          { 
            borderColor: colors.border, 
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)', 
            shadowColor: isDark ? '#000000' : '#0f172a' 
          }
        ]}>
          <Text style={[styles.brand, { color: '#6366f1' }]}>
            MINISERIES
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {viewMode === 'login' ? 'ĐĂNG NHẬP HỆ THỐNG' : viewMode === 'register' ? 'ĐĂNG KÝ TÀI KHOẢN' : 'XÁC THỰC MÃ OTP'}
          </Text>

          {loading && (
            <ActivityIndicator size="small" color="#6366f1" style={{ marginBottom: 16 }} />
          )}

          {viewMode === 'login' && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL</Text>
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Nhập địa chỉ email..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>MẬT KHẨU</Text>
              <TextInput
                secureTextEntry
                placeholder="Nhập mật khẩu..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleEmailLogin}
                style={[styles.button, { backgroundColor: colors.primaryAccent }]}
              >
                <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setViewMode('register')}
                style={[styles.linkButton]}
              >
                <Text style={[styles.linkButtonText, { color: isDark ? '#a855f7' : '#7c3aed' }]}>CHƯA CÓ TÀI KHOẢN? ĐĂNG KÝ NGAY</Text>
              </TouchableOpacity>
            </View>
          )}

          {viewMode === 'register' && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textMuted }]}>HỌ VÀ TÊN</Text>
              <TextInput
                placeholder="Nhập họ và tên..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={fullName}
                onChangeText={setFullName}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL</Text>
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Nhập địa chỉ email..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>MẬT KHẨU</Text>
              <TextInput
                secureTextEntry
                placeholder="Nhập mật khẩu..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>XÁC NHẬN MẬT KHẨU</Text>
              <TextInput
                secureTextEntry
                placeholder="Nhập lại mật khẩu..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleRegister}
                style={[styles.button, { backgroundColor: colors.primaryAccent }]}
              >
                <Text style={styles.buttonText}>ĐĂNG KÝ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setViewMode('login')}
                style={[styles.linkButton]}
              >
                <Text style={[styles.linkButtonText, { color: isDark ? '#a855f7' : '#7c3aed' }]}>ĐÃ CÓ TÀI KHOẢN? ĐĂNG NHẬP</Text>
              </TouchableOpacity>
            </View>
          )}

          {viewMode === 'otp' && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textMuted }]}>MÃ XÁC THỰC OTP</Text>
              <TextInput
                keyboardType="number-pad"
                maxLength={6}
                placeholder="Nhập 6 chữ số OTP từ email..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={otpCode}
                onChangeText={setOtpCode}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleVerifyOtp}
                style={[styles.button, { backgroundColor: colors.primaryAccent }]}
              >
                <Text style={styles.buttonText}>XÁC MINH OTP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setViewMode('register')}
                style={[styles.backButton, { borderColor: colors.border }]}
              >
                <Text style={[styles.backButtonText, { color: colors.text }]}>QUAY LẠI</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  button: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
});
