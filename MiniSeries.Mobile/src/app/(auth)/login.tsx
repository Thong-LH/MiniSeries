import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { apiClient, setAuthToken } from '../../services/apiClient';

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

  const isDark = themeId === 'bold-typography-dark';
  const colors = {
    bg: isDark ? '#121212' : '#FAF9F6',
    text: isDark ? '#FAF9F6' : '#1A1A1A',
    textMuted: isDark ? '#CFCFCF' : '#4A4A4A',
    border: isDark ? '#FFFFFF' : '#000000',
    primaryAccent: '#FF3E00',
    inputBg: isDark ? '#1e1e1e' : '#FFFFFF',
  };

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
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: isDark ? '#1a1a1a' : '#ffffff', shadowColor: colors.border }]}>
          <Text style={[styles.brand, { color: colors.primaryAccent }]}>
            MINISERIES
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {viewMode === 'login' ? 'ĐĂNG NHẬP HỆ THỐNG' : viewMode === 'register' ? 'ĐĂNG KÝ TÀI KHOẢN' : 'XÁC THỰC MÃ OTP'}
          </Text>

          {loading && (
            <ActivityIndicator size="small" color={colors.primaryAccent} style={{ marginBottom: 16 }} />
          )}

          {viewMode === 'login' && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL</Text>
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Nhập địa chỉ email..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>MẬT KHẨU</Text>
              <TextInput
                secureTextEntry
                placeholder="Nhập mật khẩu..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleEmailLogin}
                style={[styles.button, { backgroundColor: colors.primaryAccent, borderColor: colors.border }]}
              >
                <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setViewMode('register')}
                style={[styles.linkButton]}
              >
                <Text style={[styles.linkButtonText, { color: colors.text }]}>CHƯA CÓ TÀI KHOẢN? ĐĂNG KÝ NGAY</Text>
              </TouchableOpacity>
            </View>
          )}

          {viewMode === 'register' && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textMuted }]}>HỌ VÀ TÊN</Text>
              <TextInput
                placeholder="Nhập họ và tên..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={fullName}
                onChangeText={setFullName}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL</Text>
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Nhập địa chỉ email..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>MẬT KHẨU</Text>
              <TextInput
                secureTextEntry
                placeholder="Nhập mật khẩu..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>XÁC NHẬN MẬT KHẨU</Text>
              <TextInput
                secureTextEntry
                placeholder="Nhập lại mật khẩu..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleRegister}
                style={[styles.button, { backgroundColor: colors.primaryAccent, borderColor: colors.border }]}
              >
                <Text style={styles.buttonText}>ĐĂNG KÝ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setViewMode('login')}
                style={[styles.linkButton]}
              >
                <Text style={[styles.linkButtonText, { color: colors.text }]}>ĐÃ CÓ TÀI KHOẢN? ĐĂNG NHẬP</Text>
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
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={otpCode}
                onChangeText={setOtpCode}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleVerifyOtp}
                style={[styles.button, { backgroundColor: colors.primaryAccent, borderColor: colors.border }]}
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
    borderWidth: 2,
    padding: 24,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    borderWidth: 2,
    padding: 14,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  button: {
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  backButton: {
    borderWidth: 2,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
});
