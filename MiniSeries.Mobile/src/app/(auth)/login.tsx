import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { apiClient, setAuthToken } from '../../services/apiClient';
import { SpaceBackground } from '../../components/SpaceBackground';
import { useTheme } from '../../hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogleBrowser, signInWithGoogleWeb } from '../../services/googleAuth';

WebBrowser.maybeCompleteAuthSession();

const PasswordInput = ({
  value,
  onChangeText,
  placeholder,
  secureVisible,
  onToggleSecure,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureVisible: boolean;
  onToggleSecure: () => void;
}) => {
  const colors = useTheme();
  const isDark = colors.isDark;

  return (
    <View style={[styles.passwordContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <TextInput
        secureTextEntry={!secureVisible}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
        value={value}
        onChangeText={onChangeText}
        style={[styles.passwordInput, { color: colors.text }]}
      />
      <TouchableOpacity onPress={onToggleSecure} style={styles.eyeButton} activeOpacity={0.7}>
        <Ionicons
          name={secureVisible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
};

export default function LoginScreen() {
  const {
    themeId,
    setIsAuthenticated,
    setMangaTokens,
    setVideoTokens,
    setActivePlan,
    setUserEmail,
    triggerToast,
  } = useApp();
  const router = useRouter();

  // Modes: 'login' | 'register' | 'otp' | 'forgot_password' | 'reset_password'
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'otp' | 'forgot_password' | 'reset_password'>('login');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Show/hide password states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const colors = useTheme();
  const isDark = colors.isDark;

  // Web OAuth hash callback handler
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.substring(1));
        const supabaseAccessToken = params.get('access_token');
        if (supabaseAccessToken) {
          setLoading(true);
          window.history.replaceState(null, '', window.location.pathname);

          apiClient
            .post('/auth/google-signin', { accessToken: supabaseAccessToken })
            .then((backendRes) => {
              const loginData = backendRes.data;
              if (loginData && loginData.accessToken) {
                setAuthToken(loginData.accessToken);
                setIsAuthenticated(true);
                if (loginData.planName) setActivePlan(loginData.planName);
                if (loginData.remainingMangaCount !== undefined) setMangaTokens(loginData.remainingMangaCount);
                if (loginData.remainingVideoCount !== undefined) setVideoTokens(loginData.remainingVideoCount);
                setUserEmail(loginData.email || 'google-user@gmail.com');
                triggerToast('Đăng nhập Google thành công! 🎉');
                router.replace('/(tabs)/home');
              } else {
                triggerToast('Xác thực thất bại.');
              }
            })
            .catch((err) => {
              console.error('Lỗi đăng nhập Google Web:', err);
              triggerToast('Xác thực tài khoản Google thất bại.');
            })
            .finally(() => {
              setLoading(false);
            });
        }
      }
    }
  }, []);

  // Developer diagnostics modal
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState(apiClient.defaults.baseURL || '');
  const [testing, setTesting] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<Array<{ name: string; status: 'idle' | 'testing' | 'success' | 'failed'; detail: string }>>([
    { name: '1. Kết nối WAN (Internet)', status: 'idle', detail: 'Chưa kiểm tra' },
    { name: '2. Máy chủ LAN (IP cục bộ)', status: 'idle', detail: 'Chưa kiểm tra' },
    { name: '3. Đường dẫn API', status: 'idle', detail: 'Chưa kiểm tra' },
    { name: '4. Cloud DB (Supabase)', status: 'idle', detail: 'Chưa kiểm tra' },
  ]);

  const runDiagnosticTests = async () => {
    setTesting(true);
    const logs = [...diagnosticLogs];
    const updateLog = (index: number, status: 'testing' | 'success' | 'failed', detail: string) => {
      logs[index] = { ...logs[index], status, detail };
      setDiagnosticLogs([...logs]);
    };

    // Test 1: WAN
    updateLog(0, 'testing', 'Đang kết nối tới google.com...');
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 4000);
      await fetch('https://www.google.com', { method: 'HEAD', signal: ctrl.signal });
      clearTimeout(tid);
      updateLog(0, 'success', 'Thành công! Kết nối internet hoạt động.');
    } catch (e: any) {
      updateLog(0, 'failed', `Lỗi: ${e.message || 'Timeout'}`);
    }

    // Test 2: LAN
    const localIp = 'http://192.168.100.249:5088/api';
    updateLog(1, 'testing', `Đang kết nối tới ${localIp}...`);
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(localIp + '/auth/login-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: '123' }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      updateLog(1, 'success', `HTTP ${res.status}. Kết nối LAN hoạt động.`);
    } catch (e: any) {
      updateLog(1, 'failed', `Lỗi: ${e.message}. Kiểm tra Wi-Fi, backend và firewall.`);
    }

    // Test 3: API URL
    const testApiUrl = customBaseUrl.trim();
    updateLog(2, 'testing', `Đang kết nối tới ${testApiUrl}...`);
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(testApiUrl + '/auth/login-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: '123' }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      updateLog(2, 'success', `HTTP ${res.status}. Đường dẫn API hoạt động.`);
    } catch (e: any) {
      updateLog(2, 'failed', `Lỗi: ${e.message}. Kiểm tra lại đường dẫn API.`);
    }

    // Test 4: Supabase
    const supabaseUrl = 'https://devnyzwnvyzgulqroyqa.supabase.co';
    updateLog(3, 'testing', `Đang kết nối Supabase...`);
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(supabaseUrl + '/auth/v1/health', { signal: ctrl.signal });
      clearTimeout(tid);
      updateLog(3, 'success', `HTTP ${res.status}. Supabase hoạt động.`);
    } catch (e: any) {
      updateLog(3, 'failed', `Lỗi: ${e.message}. Supabase bị chặn hoặc lỗi mạng.`);
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

  // ─── AUTH HANDLERS ───────────────────────────────────────

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
      const errMsg =
        err.response?.data?.message ||
        (err.message === 'Network Error' || !err.response
          ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!'
          : 'Email hoặc mật khẩu không chính xác!');
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      signInWithGoogleWeb();
      return;
    }

    // Mobile: open browser-based Google OAuth
    setLoading(true);
    try {
      const data = await signInWithGoogleBrowser();
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
      console.log('Lỗi đăng nhập Google:', err);
      const msg = err.message || 'Đăng nhập Google thất bại!';
      triggerToast(msg);
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
      const errMsg = err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn!';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
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
      triggerToast(res.data.message || 'Mã OTP đã được gửi tới email của bạn!');
      setViewMode('reset_password');
    } catch (err: any) {
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
      const errMsg = err.response?.data?.message || 'Không thể đặt lại mật khẩu.';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ──────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <SpaceBackground />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View
          style={[
            styles.card,
            {
              borderColor: colors.border,
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)',
              shadowColor: isDark ? '#000000' : '#0f172a',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.brand, { color: colors.primaryAccent }]}>MINISERIES</Text>
            <TouchableOpacity
              onPress={() => {
                setCustomBaseUrl(apiClient.defaults.baseURL || '');
                setShowDiagnostics(true);
              }}
              style={styles.settingsBtn}
            >
              <Ionicons name="construct-outline" size={18} color={colors.textMuted} />
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

          {loading && <ActivityIndicator size="small" color={colors.primaryAccent} style={{ marginBottom: 16 }} />}

          {/* ───── LOGIN VIEW ───── */}
          {viewMode === 'login' && (
            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL</Text>
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="Nhập địa chỉ email..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>MẬT KHẨU</Text>
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu..."
                secureVisible={showPassword}
                onToggleSecure={() => setShowPassword(!showPassword)}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setOtpCode('');
                  setPassword('');
                  setViewMode('forgot_password');
                }}
                style={styles.forgotBtn}
              >
                <Text style={{ color: colors.plasmaAccent, fontSize: 11, fontWeight: '800' }}>QUÊN MẬT KHẨU?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleEmailLogin}
                disabled={loading}
                style={[styles.button, { backgroundColor: colors.primaryAccent, opacity: loading ? 0.6 : 1 }]}
              >
                <Ionicons name="log-in-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>HOẶC</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleGoogleLogin}
                disabled={loading}
                style={[styles.googleButton, { borderColor: isDark ? '#334155' : '#dadce0', backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#ffffff' }]}
              >
                <Ionicons name="logo-google" size={16} color={isDark ? '#93c5fd' : '#4285f4'} style={{ marginRight: 8 }} />
                <Text style={[styles.googleButtonText, { color: isDark ? '#e2e8f0' : '#3c4043' }]}>ĐĂNG NHẬP VỚI GOOGLE</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} onPress={() => setViewMode('register')} style={styles.linkButton}>
                <Text style={[styles.linkButtonText, { color: colors.plasmaAccent }]}>CHƯA CÓ TÀI KHOẢN? ĐĂNG KÝ NGAY</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ───── REGISTER VIEW ───── */}
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
                autoComplete="email"
                placeholder="Nhập địa chỉ email..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>MẬT KHẨU</Text>
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="Tối thiểu 6 ký tự..."
                secureVisible={showPassword}
                onToggleSecure={() => setShowPassword(!showPassword)}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>XÁC NHẬN MẬT KHẨU</Text>
              <PasswordInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu..."
                secureVisible={showConfirmPassword}
                onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleRegister}
                disabled={loading}
                style={[styles.button, { backgroundColor: colors.primaryAccent, opacity: loading ? 0.6 : 1 }]}
              >
                <Ionicons name="person-add-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.buttonText}>ĐĂNG KÝ</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} onPress={() => setViewMode('login')} style={styles.linkButton}>
                <Text style={[styles.linkButtonText, { color: colors.plasmaAccent }]}>ĐÃ CÓ TÀI KHOẢN? ĐĂNG NHẬP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ───── OTP VERIFICATION VIEW ───── */}
          {viewMode === 'otp' && (
            <View style={styles.form}>
              <Text style={[styles.otpHint, { color: colors.textMuted }]}>
                Mã OTP 6 chữ số đã được gửi tới email {email || 'của bạn'}. Vui lòng kiểm tra hộp thư (bao gồm thư rác).
              </Text>

              <Text style={[styles.label, { color: colors.textMuted }]}>MÃ XÁC THỰC OTP</Text>
              <TextInput
                keyboardType="number-pad"
                maxLength={6}
                placeholder="Nhập 6 chữ số OTP..."
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                value={otpCode}
                onChangeText={setOtpCode}
                style={[styles.input, styles.otpInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleVerifyOtp}
                disabled={loading}
                style={[styles.button, { backgroundColor: colors.primaryAccent, opacity: loading ? 0.6 : 1 }]}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.buttonText}>XÁC MINH OTP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setViewMode('register')}
                style={[styles.backButton, { borderColor: colors.border }]}
              >
                <Text style={[styles.backButtonText, { color: colors.text }]}>QUAY LẠI ĐĂNG KÝ</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ───── FORGOT PASSWORD VIEW ───── */}
          {viewMode === 'forgot_password' && (
            <View style={styles.form}>
              <Text style={[styles.otpHint, { color: colors.textMuted }]}>
                Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.
              </Text>

              <Text style={[styles.label, { color: colors.textMuted }]}>EMAIL</Text>
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
                disabled={loading}
                style={[styles.button, { backgroundColor: colors.primaryAccent, opacity: loading ? 0.6 : 1 }]}
              >
                <Ionicons name="mail-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
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

          {/* ───── RESET PASSWORD VIEW ───── */}
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
                style={[styles.input, styles.otpInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>MẬT KHẨU MỚI</Text>
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="Tối thiểu 6 ký tự..."
                secureVisible={showNewPassword}
                onToggleSecure={() => setShowNewPassword(!showNewPassword)}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>XÁC NHẬN MẬT KHẨU MỚI</Text>
              <PasswordInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới..."
                secureVisible={showConfirmPassword}
                onToggleSecure={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleResetPassword}
                disabled={loading}
                style={[styles.button, { backgroundColor: colors.primaryAccent, opacity: loading ? 0.6 : 1 }]}
              >
                <Ionicons name="key-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
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
        </View>

        {/* ───── DIAGNOSTICS MODAL ───── */}
        <Modal animationType="slide" transparent visible={showDiagnostics} onRequestClose={() => setShowDiagnostics(false)}>
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
                  let statusColor = '#94a3b8';
                  let statusText = '⏳ ';
                  if (log.status === 'testing') {
                    statusColor = '#eab308';
                    statusText = '🔄 ';
                  } else if (log.status === 'success') {
                    statusColor = '#22c55e';
                    statusText = '✅ ';
                  } else if (log.status === 'failed') {
                    statusColor = '#ef4444';
                    statusText = '❌ ';
                  }

                  return (
                    <View
                      key={index}
                      style={[
                        styles.logItem,
                        {
                          borderColor: statusColor,
                          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.6)',
                        },
                      ]}
                    >
                      <Text style={[styles.logName, { color: colors.text }]}>
                        {statusText}
                        {log.name}
                      </Text>
                      <Text style={[styles.logDetail, { color: log.status === 'failed' ? '#ef4444' : colors.textMuted }]}>{log.detail}</Text>
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
                      marginTop: 8,
                    },
                  ]}
                >
                  <Text style={[styles.buttonText, { fontSize: 12 }]}>{testing ? 'ĐANG CHẠY KIỂM TRA...' : '⚡ CHẠY TEST CHẨN ĐOÁN LỖI'}</Text>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity onPress={() => setShowDiagnostics(false)} style={[styles.backButton, { width: '100%', borderColor: colors.border }]}>
                <Text style={[styles.backButtonText, { color: colors.text }]}>ĐÓNG</Text>
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
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 20,
    padding: 28,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  settingsBtn: {
    padding: 8,
    borderRadius: 8,
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
  otpInput: {
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 8,
    fontWeight: '900',
  },
  otpHint: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  // Password input with eye toggle
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Buttons
  button: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  googleButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    paddingVertical: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginHorizontal: 12,
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
  // Diagnostics Modal
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