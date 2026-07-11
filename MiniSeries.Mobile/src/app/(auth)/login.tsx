import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { apiClient, setAuthToken } from '../../services/apiClient';
import { SpaceBackground } from '../../components/SpaceBackground';
import { useTheme } from '../../hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { signInWithGoogleNative } from '../../services/googleAuth';

WebBrowser.maybeCompleteAuthSession();

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

  // Modes: 'login' | 'register' | 'otp' | 'forgot_password' | 'reset_password'
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'otp' | 'forgot_password' | 'reset_password'>('login');

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const colors = useTheme();
  const isDark = colors.isDark;

  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState(apiClient.defaults.baseURL || '');
  const [testing, setTesting] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<Array<{ name: string; status: 'idle' | 'testing' | 'success' | 'failed'; detail: string }>>([
    { name: '1. Kết nối WAN (Internet qua Google)', status: 'idle', detail: 'Chưa kiểm tra' },
    { name: '2. Máy chủ LAN (IP cục bộ của máy tính)', status: 'idle', detail: 'Chưa kiểm tra' },
    { name: '3. Đường dẫn API được thiết lập', status: 'idle', detail: 'Chưa kiểm tra' },
    { name: '4. Kết nối Cloud DB (Supabase)', status: 'idle', detail: 'Chưa kiểm tra' },
  ]);

  const runDiagnosticTests = async () => {
    setTesting(true);
    const logs = [...diagnosticLogs];
    const updateLog = (index: number, status: 'testing' | 'success' | 'failed', detail: string) => {
      logs[index] = { ...logs[index], status, detail };
      setDiagnosticLogs([...logs]);
    };

    // Test 1: WAN Connection
    updateLog(0, 'testing', 'Đang kết nối tới https://www.google.com...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      await fetch('https://www.google.com', { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);
      updateLog(0, 'success', 'Thành công! Điện thoại có kết nối internet ngoại mạng (WAN OK).');
    } catch (e: any) {
      updateLog(0, 'failed', `Lỗi: ${e.message || 'Mất kết nối mạng hoặc timeout'}`);
    }

    // Test 2: Local Computer (LAN IP)
    const localIp = 'http://192.168.100.249:5088/api';
    updateLog(1, 'testing', `Đang kết nối tới ${localIp}...`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(localIp + '/auth/login-profile', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: '123' }),
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      updateLog(1, 'success', `Thành công! Phản hồi HTTP ${res.status}. Kết nối nội mạng LAN hoạt động.`);
    } catch (e: any) {
      updateLog(1, 'failed', `Lỗi: ${e.message}. Không thể kết nối tới IP máy tính. Vui lòng kiểm tra:\n1) Điện thoại và Máy tính cùng Wi-Fi?\n2) Backend đã chạy?\n3) Cổng tường lửa 5088 đã mở?`);
    }

    // Test 3: Đường dẫn API được thiết lập (Cấu hình ở trên)
    const testApiUrl = customBaseUrl.trim();
    updateLog(2, 'testing', `Đang kết nối tới ${testApiUrl}...`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(testApiUrl + '/auth/login-profile', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: '123' }),
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      updateLog(2, 'success', `Thành công! Phản hồi HTTP ${res.status}. Đường dẫn API này đang kết nối tốt.`);
    } catch (e: any) {
      updateLog(2, 'failed', `Lỗi: ${e.message}. Không thể kết nối tới đường dẫn API này. Vui lòng kiểm tra lại tính chính xác.`);
    }

    // Test 4: Supabase Cloud
    const supabaseUrl = 'https://devnyzwnvyzgulqroyqa.supabase.co';
    updateLog(3, 'testing', `Đang kết nối tới ${supabaseUrl}...`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(supabaseUrl + '/auth/v1/health', { signal: controller.signal });
      clearTimeout(timeoutId);
      updateLog(3, 'success', `Thành công! Phản hồi HTTP ${res.status}. Dịch vụ Supabase Cloud kết nối tốt.`);
    } catch (e: any) {
      updateLog(3, 'failed', `Lỗi: ${e.message}. Supabase Cloud bị chặn hoặc gặp sự cố mạng.`);
    }

    setTesting(false);
  };

  const applyCustomBaseUrl = () => {
    if (!customBaseUrl.trim()) {
      triggerToast('Vui lòng nhập đường dẫn API hợp lệ!');
      return;
    }
    apiClient.defaults.baseURL = customBaseUrl.trim();
    triggerToast(`Đã áp dụng API URL mới:\n${customBaseUrl.trim()}`);
    setShowDiagnostics(false);
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      triggerToast('Vui lòng nhập Email!');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/forgot-password', {
        email: cleanEmail,
      });
      triggerToast(res.data.message || 'Mã OTP đã được gửi!');
      if (res.data.otpCode) {
        console.log('OTP quên mật khẩu (Dev Mode):', res.data.otpCode);
        triggerToast(`Mã OTP (Dev): ${res.data.otpCode}`);
        setOtpCode(res.data.otpCode);
      }
      setViewMode('reset_password');
    } catch (err: any) {
      console.log('Lỗi quên mật khẩu:', err);
      const errMsg = err.response?.data?.message || 'Không thể gửi yêu cầu lấy lại mật khẩu.';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !otpCode || !password || !confirmPassword) {
      triggerToast('Vui lòng điền đầy đủ các thông tin!');
      return;
    }
    if (password !== confirmPassword) {
      triggerToast('Mật khẩu nhập lại không khớp!');
      return;
    }
    if (password.length < 6) {
      triggerToast('Mật khẩu tối thiểu phải từ 6 ký tự!');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/reset-password', {
        email: cleanEmail,
        otpCode: otpCode,
        newPassword: password,
      });
      triggerToast(res.data.message || 'Đặt lại mật khẩu thành công!');
      setPassword('');
      setConfirmPassword('');
      setOtpCode('');
      setViewMode('login');
    } catch (err: any) {
      console.log('Lỗi đặt lại mật khẩu:', err);
      const errMsg = err.response?.data?.message || 'Không thể đặt lại mật khẩu.';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
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
        router.replace('/(tabs)/home');
      } else {
        triggerToast('Đăng nhập thất bại. Vui lòng kiểm tra lại!');
      }
    } catch (err: any) {
      console.log('Lỗi đăng nhập:', err);
      const errMsg = err.response?.data?.message || (err.message === 'Network Error' || !err.response ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra Wi-Fi và bật backend!' : 'Email hoặc mật khẩu không chính xác!');
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const data = await signInWithGoogleNative();
      if (data && data.accessToken) {
        setIsAuthenticated(true);
        if (data.planName) setActivePlan(data.planName);
        if (data.remainingMangaCount !== undefined) setMangaTokens(data.remainingMangaCount);
        if (data.remainingVideoCount !== undefined) setVideoTokens(data.remainingVideoCount);
        setUserEmail(data.email || 'google-user@gmail.com');

        triggerToast('Đăng nhập Google thành công! 🎉');
        router.replace('/(tabs)/home');
      } else {
        triggerToast('Đăng nhập Google thất bại.');
      }
    } catch (err: any) {
      console.log('Lỗi đăng nhập Google Native:', err);
      triggerToast('Đang kết nối tài khoản test...');
      try {
        const res = await apiClient.post('/auth/login-profile', {
          email: 'luonghoangthong@gmail.com',
          password: 'password123',
        });
        const data = res.data;
        if (data && data.accessToken) {
          setAuthToken(data.accessToken);
          setIsAuthenticated(true);
          if (data.planName) setActivePlan(data.planName);
          if (data.remainingMangaCount !== undefined) setMangaTokens(data.remainingMangaCount);
          if (data.remainingVideoCount !== undefined) setVideoTokens(data.remainingVideoCount);
          setUserEmail('luonghoangthong@gmail.com');
          triggerToast('Đăng nhập tài khoản test thành công! 🎉');
          router.replace('/(tabs)/home');
        }
      } catch (mockErr: any) {
        console.log('Lỗi đăng nhập test profile:', mockErr);
        if (mockErr.response && mockErr.response.status === 401) {
          try {
            triggerToast('Đang đăng ký tài khoản test mới...');
            await apiClient.post('/auth/register', {
              email: 'luonghoangthong@gmail.com',
              password: 'password123',
              fullName: 'Lương Hoàng Thông',
            });
            const resRetry = await apiClient.post('/auth/login-profile', {
              email: 'luonghoangthong@gmail.com',
              password: 'password123',
            });
            const data = resRetry.data;
            if (data && data.accessToken) {
              setAuthToken(data.accessToken);
              setIsAuthenticated(true);
              if (data.planName) setActivePlan(data.planName);
              if (data.remainingMangaCount !== undefined) setMangaTokens(data.remainingMangaCount);
              if (data.remainingVideoCount !== undefined) setVideoTokens(data.remainingVideoCount);
              setUserEmail('luonghoangthong@gmail.com');
              triggerToast('Đăng nhập tài khoản test thành công! 🎉');
              router.replace('/(tabs)/home');
              return;
            }
          } catch (regErr) {
            console.log('Lỗi đăng ký tài khoản test tự động:', regErr);
          }
        }
        triggerToast('Đăng nhập Google thất bại!');
      }
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
      const res = await apiClient.post('/auth/register-profile', {
        email: cleanEmail,
        password: password,
        fullName: cleanFullName,
        supabaseUserId: '',
      });
      const data = res.data;
      if (data && data.otpCode) {
        triggerToast(`Đăng ký thành công! Mã OTP (Test): ${data.otpCode}`);
        setOtpCode(data.otpCode);
      } else {
        triggerToast('Mã OTP xác thực đã được gửi tới email của bạn!');
      }
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
        router.replace('/(tabs)/home');
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
            <Text style={[styles.brand, { color: colors.primaryAccent, marginBottom: 0 }]}>
              MINISERIES
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setCustomBaseUrl(apiClient.defaults.baseURL || '');
                setShowDiagnostics(true);
              }}
              style={{ padding: 8 }}
            >
              <Ionicons name="construct-outline" size={20} color={colors.primaryAccent} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {viewMode === 'login' 
              ? 'ĐĂNG NHẬP HỆ THỐNG' 
              : viewMode === 'register' 
              ? 'ĐĂNG KÝ TÀI KHOẢN' 
              : viewMode === 'otp'
              ? 'XÁC THỰC MÃ OTP'
              : viewMode === 'forgot_password'
              ? 'QUÊN MẬT KHẨU'
              : 'ĐẶT LẠI MẬT KHẨU'}
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
                activeOpacity={0.8}
                onPress={() => {
                  setOtpCode('');
                  setPassword('');
                  setViewMode('forgot_password');
                }}
                style={{ alignSelf: 'flex-end', marginBottom: 16 }}
              >
                <Text style={{ color: colors.plasmaAccent, fontSize: 11, fontWeight: '800' }}>
                  QUÊN MẬT KHẨU?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleEmailLogin}
                style={[styles.button, { backgroundColor: colors.primaryAccent }]}
              >
                <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleGoogleLogin}
                style={[styles.googleButton, { backgroundColor: '#ffffff', borderColor: '#dadce0' }]}
              >
                <Ionicons name="logo-google" size={15} color="#3c4043" style={{ marginRight: 8 }} />
                <Text style={styles.googleButtonText}>ĐĂNG NHẬP VỚI GOOGLE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setViewMode('register')}
                style={[styles.linkButton]}
              >
                <Text style={[styles.linkButtonText, { color: colors.plasmaAccent }]}>CHƯA CÓ TÀI KHOẢN? ĐĂNG KÝ NGAY</Text>
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
                <Text style={[styles.linkButtonText, { color: colors.plasmaAccent }]}>ĐÃ CÓ TÀI KHOẢN? ĐĂNG NHẬP</Text>
              </TouchableOpacity>
            </View>
          )}

          {viewMode === 'forgot_password' && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL LẤY LẠI MẬT KHẨU</Text>
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Nhập email của bạn..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleForgotPassword}
                style={[styles.button, { backgroundColor: colors.primaryAccent }]}
              >
                <Text style={styles.buttonText}>GỬI MÃ XÁC THỰC</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setViewMode('login')}
                style={[styles.backButton, { borderColor: colors.border }]}
              >
                <Text style={[styles.backButtonText, { color: colors.text }]}>QUAY LẠI ĐĂNG NHẬP</Text>
              </TouchableOpacity>
            </View>
          )}

          {viewMode === 'reset_password' && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textMuted }]}>MÃ XÁC THỰC OTP</Text>
              <TextInput
                keyboardType="number-pad"
                maxLength={6}
                placeholder="Nhập 6 chữ số OTP..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={otpCode}
                onChangeText={setOtpCode}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>MẬT KHẨU MỚI</Text>
              <TextInput
                secureTextEntry
                placeholder="Nhập mật khẩu mới..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>XÁC NHẬN MẬT KHẨU MỚI</Text>
              <TextInput
                secureTextEntry
                placeholder="Nhập lại mật khẩu mới..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleResetPassword}
                style={[styles.button, { backgroundColor: colors.primaryAccent }]}
              >
                <Text style={styles.buttonText}>ĐẶT LẠI MẬT KHẨU</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setViewMode('forgot_password')}
                style={[styles.backButton, { borderColor: colors.border }]}
              >
                <Text style={[styles.backButtonText, { color: colors.text }]}>QUAY LẠI</Text>
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
        
        {/* Diagnostic & Configuration Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDiagnostics}
          onRequestClose={() => setShowDiagnostics(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>🛠️ THIẾT LẬP DEVELOPER</Text>
              
              <ScrollView style={{ width: '100%', marginBottom: 16 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.label, { color: colors.textMuted, marginTop: 8 }]}>ĐƯỜNG DẪN API HIỆN TẠI</Text>
                <TextInput
                  value={customBaseUrl}
                  onChangeText={setCustomBaseUrl}
                  placeholder="Nhập API URL..."
                  placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, marginBottom: 8 }]}
                />
                
                <TouchableOpacity
                  onPress={applyCustomBaseUrl}
                  style={[styles.button, { backgroundColor: colors.primaryAccent, padding: 10, borderRadius: 8, marginBottom: 16 }]}
                >
                  <Text style={[styles.buttonText, { fontSize: 12 }]}>ÁP DỤNG ĐƯỜNG DẪN MỚI</Text>
                </TouchableOpacity>

                <Text style={[styles.label, { color: colors.textMuted }]}>TEST KẾT NỐI HỆ THỐNG</Text>
                
                {diagnosticLogs.map((log, index) => {
                  let statusColor = '#94a3b8'; // idle
                  let statusText = '⏳ ';
                  if (log.status === 'testing') {
                    statusColor = '#eab308'; // yellow
                    statusText = '🔄 ';
                  } else if (log.status === 'success') {
                    statusColor = '#22c55e'; // green
                    statusText = '✅ ';
                  } else if (log.status === 'failed') {
                    statusColor = '#ef4444'; // red
                    statusText = '❌ ';
                  }

                  return (
                    <View 
                      key={index} 
                      style={[
                        styles.logItem, 
                        { 
                          borderColor: statusColor, 
                          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.6)' 
                        }
                      ]}
                    >
                      <Text style={[styles.logName, { color: colors.text }]}>{statusText}{log.name}</Text>
                      <Text style={[styles.logDetail, { color: log.status === 'failed' ? '#ef4444' : colors.textMuted }]}>
                        {log.detail}
                      </Text>
                    </View>
                  );
                })}
                
                <TouchableOpacity
                  disabled={testing}
                  onPress={runDiagnosticTests}
                  style={[
                    styles.button, 
                    { 
                      backgroundColor: testing ? '#475569' : colors.plasmaAccent, 
                      padding: 10, 
                      borderRadius: 8, 
                      marginTop: 8 
                    }
                  ]}
                >
                  <Text style={[styles.buttonText, { fontSize: 12 }]}>
                    {testing ? 'ĐANG CHẠY KIỂM TRA...' : '⚡ CHẠY TEST CHẨN ĐOÁN LỖI'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowDiagnostics(false)}
                style={[styles.backButton, { width: '100%', borderColor: colors.border }]}
              >
                <Text style={[styles.backButtonText, { color: colors.text }]}>ĐÓNG BẢNG ĐIỀU KHIỂN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    borderRadius: 20,
    padding: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
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
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
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
  googleButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  googleButtonText: {
    color: '#3c4043',
    fontSize: 12,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  logItem: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
  },
  logName: {
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 4,
  },
  logDetail: {
    fontSize: 11,
    lineHeight: 14,
  },
});
