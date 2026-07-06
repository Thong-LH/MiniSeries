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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { apiClient, setAuthToken } from '../../services/apiClient';

export default function LoginScreen() {
  const {
    setIsAuthenticated,
    setMangaTokens,
    setVideoTokens,
    setActivePlan,
    setUserName,
    setUserEmail,
    triggerToast,
  } = useApp();
  const router = useRouter();

  // Modes: 'login' | 'register' | 'otp' | 'forgot-password' | 'verify-reset-otp' | 'reset-password'
  const [viewMode, setViewMode] = useState<
    'login' | 'register' | 'otp' | 'forgot-password' | 'verify-reset-otp' | 'reset-password'
  >('login');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Focus states for input glows
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const colors = {
    bg: '#050811', // Deep dark cosmic blue/black matching Web
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: 'rgba(124, 58, 237, 0.3)',
    borderFocus: '#06b6d4',
    primaryAccent: '#6366f1',
    secondaryAccent: '#0ea5e9', // Cyan color matching Web
    cardBg: '#0d111d', // Very dark grey-blue matching Web
    inputBg: 'rgba(8, 12, 24, 0.75)',
  };

  const handleEmailLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      triggerToast('Vui lòng điền đầy đủ Email và Mật khẩu.');
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
        if (data.fullName) setUserName(data.fullName);
        if (data.email) setUserEmail(data.email);

        triggerToast('Đăng nhập thành công!');
        router.replace('/(tabs)/create');
      } else {
        triggerToast('Đăng nhập thất bại, vui lòng kiểm tra phản hồi từ server.');
      }
    } catch (err: any) {
      console.log('Lỗi đăng nhập:', err);
      if (err.response) {
        console.log('Phản hồi lỗi đăng nhập từ server:', err.response.data);
      }
      const errMsg = err.response?.data?.message || 'Kết nối server thất bại. Vui lòng kiểm tra lại.';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFullName || !cleanEmail || !password) {
      triggerToast('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (password.length < 6) {
      triggerToast('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      triggerToast('Mật khẩu xác nhận không khớp.');
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
      triggerToast('Mã OTP xác thực đã được gửi đến email của bạn.');
      setViewMode('otp');
    } catch (err: any) {
      console.log('Lỗi đăng ký:', err);
      if (err.response) {
        console.log('Phản hồi lỗi đăng ký từ server:', err.response.data);
      }
      const errMsg = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp) {
      triggerToast('Vui lòng nhập mã OTP.');
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
        if (data.fullName) setUserName(data.fullName);
        if (data.email) setUserEmail(data.email);

        triggerToast('Xác thực và kích hoạt tài khoản thành công!');
        router.replace('/(tabs)/create');
      } else {
        triggerToast('Xác thực thất bại, vui lòng thử lại.');
      }
    } catch (err: any) {
      console.log('Lỗi xác minh OTP:', err);
      if (err.response) {
        console.log('Phản hồi lỗi xác minh OTP từ server:', err.response.data);
      }
      const errMsg = err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      triggerToast('Vui lòng điền Email.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: cleanEmail });
      triggerToast('Mã OTP khôi phục đã được gửi đến email của bạn.');
      setOtpCode('');
      setViewMode('verify-reset-otp');
    } catch (err: any) {
      console.log('Lỗi quên mật khẩu:', err);
      if (err.response) {
        console.log('Phản hồi lỗi quên mật khẩu từ server:', err.response.data);
      }
      const errMsg = err.response?.data?.message || 'Gửi mã khôi phục thất bại.';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp) {
      triggerToast('Vui lòng nhập mã OTP.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/verify-reset-otp', {
        email: cleanEmail,
        otpCode: cleanOtp,
      });
      triggerToast('Xác thực OTP thành công. Vui lòng nhập mật khẩu mới.');
      setPassword('');
      setConfirmPassword('');
      setViewMode('reset-password');
    } catch (err: any) {
      console.log('Lỗi xác thực OTP reset:', err);
      if (err.response) {
        console.log('Phản hồi lỗi xác thực OTP reset từ server:', err.response.data);
      }
      const errMsg = err.response?.data?.message || 'Mã xác thực không chính xác.';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!password) {
      triggerToast('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (password.length < 6) {
      triggerToast('Mật khẩu mới tối thiểu 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      triggerToast('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email: cleanEmail,
        otpCode: cleanOtp,
        newPassword: password,
      });
      triggerToast('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      setPassword('');
      setConfirmPassword('');
      setOtpCode('');
      setViewMode('login');
    } catch (err: any) {
      console.log('Lỗi đặt lại mật khẩu:', err);
      if (err.response) {
        console.log('Phản hồi lỗi đặt lại mật khẩu từ server:', err.response.data);
      }
      const errMsg = err.response?.data?.message || 'Đổi mật khẩu thất bại.';
      triggerToast(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Helper styles for focused inputs
  const getInputStyle = (fieldName: string) => [
    styles.input,
    {
      backgroundColor: colors.inputBg,
      borderColor: focusedField === fieldName ? colors.borderFocus : 'rgba(255, 255, 255, 0.1)',
      color: colors.text,
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      {/* Background Neon Glow circles simulation */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
          
          {/* Header Title section */}
          <View style={styles.header}>
            {viewMode === 'login' && (
              <>
                <Text style={[styles.brandTitle, { color: '#0ea5e9', fontWeight: '900' }]}>
                  MINISERIES<Text style={{ color: '#d946ef' }}>LEARNING</Text>
                </Text>
                <Text style={styles.subtitle}>Hệ thống bài học chuyển đổi tự động bằng Video & Manga</Text>
              </>
            )}
            {viewMode === 'register' && (
              <>
                <Text style={styles.brandTitle}>
                  Đăng Ký<Text style={{ color: colors.secondaryAccent }}> Thành Viên</Text>
                </Text>
                <Text style={styles.subtitle}>Tạo tài khoản mới để bắt đầu học tập</Text>
              </>
            )}
            {viewMode === 'otp' && (
              <>
                <Text style={styles.brandTitle}>
                  Xác Minh<Text style={{ color: colors.secondaryAccent }}> OTP</Text>
                </Text>
                <Text style={styles.subtitle}>Nhập mã xác thực để kích hoạt tài khoản của bạn</Text>
              </>
            )}
            {viewMode === 'forgot-password' && (
              <>
                <Text style={styles.brandTitle}>
                  Quên<Text style={{ color: colors.secondaryAccent }}> Mật Khẩu</Text>
                </Text>
                <Text style={styles.subtitle}>Nhập email của bạn để khôi phục mật khẩu</Text>
              </>
            )}
            {viewMode === 'verify-reset-otp' && (
              <>
                <Text style={styles.brandTitle}>
                  Xác Minh<Text style={{ color: colors.secondaryAccent }}> OTP</Text>
                </Text>
                <Text style={styles.subtitle}>Nhập mã xác thực để khôi phục mật khẩu</Text>
              </>
            )}
            {viewMode === 'reset-password' && (
              <>
                <Text style={styles.brandTitle}>
                  Đặt Lại<Text style={{ color: colors.secondaryAccent }}> Mật Khẩu</Text>
                </Text>
                <Text style={styles.subtitle}>Thiết lập mật khẩu mới cho tài khoản của bạn</Text>
              </>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.secondaryAccent} />
              <Text style={{ color: colors.textMuted, marginTop: 12 }}>Vui lòng đợi giây lát...</Text>
            </View>
          ) : (
            <View style={styles.form}>
              
              {/* LOGIN MODE */}
              {viewMode === 'login' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>EMAIL</Text>
                    <TextInput
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="example@email.com"
                      placeholderTextColor="#555"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('email')}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>MẬT KHẨU</Text>
                    <TextInput
                      secureTextEntry
                      autoCapitalize="none"
                      placeholder="••••••••"
                      placeholderTextColor="#555"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('password')}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setViewMode('forgot-password')}
                    style={styles.forgotBtn}
                  >
                    <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleEmailLogin}
                    style={[styles.actionBtn, { backgroundColor: colors.primaryAccent }]}
                  >
                    <Text style={styles.actionBtnText}>ĐĂNG NHẬP</Text>
                  </TouchableOpacity>

                  <View style={styles.footerContainer}>
                    <Text style={{ color: colors.textMuted }}>Chưa có tài khoản? </Text>
                    <TouchableOpacity onPress={() => setViewMode('register')}>
                      <Text style={styles.linkText}>Đăng ký ngay</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* REGISTER MODE */}
              {viewMode === 'register' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>HỌ VÀ TÊN</Text>
                    <TextInput
                      placeholder="Nguyễn Văn A"
                      placeholderTextColor="#555"
                      value={fullName}
                      onChangeText={setFullName}
                      onFocus={() => setFocusedField('fullName')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('fullName')}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>EMAIL</Text>
                    <TextInput
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="example@email.com"
                      placeholderTextColor="#555"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('email')}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>MẬT KHẨU</Text>
                    <TextInput
                      secureTextEntry
                      autoCapitalize="none"
                      placeholder="Tối thiểu 6 ký tự"
                      placeholderTextColor="#555"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('password')}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>XÁC NHẬN MẬT KHẨU</Text>
                    <TextInput
                      secureTextEntry
                      autoCapitalize="none"
                      placeholder="••••••••"
                      placeholderTextColor="#555"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('confirmPassword')}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleRegister}
                    style={[styles.actionBtn, { backgroundColor: colors.primaryAccent }]}
                  >
                    <Text style={styles.actionBtnText}>ĐĂNG KÝ TÀI KHOẢN</Text>
                  </TouchableOpacity>

                  <View style={styles.footerContainer}>
                    <Text style={{ color: colors.textMuted }}>Đã có tài khoản? </Text>
                    <TouchableOpacity onPress={() => setViewMode('login')}>
                      <Text style={styles.linkText}>Đăng nhập</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* OTP VALIDATION MODE */}
              {viewMode === 'otp' && (
                <>
                  <Text style={styles.infoText}>
                    Hệ thống đã gửi một mã OTP gồm 6 chữ số tới địa chỉ email{' '}
                    <Text style={{ color: '#c084fc', fontWeight: 'bold' }}>{email}</Text>. Vui lòng nhập mã để hoàn tất đăng ký.
                  </Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>MÃ XÁC THỰC OTP</Text>
                    <TextInput
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="123456"
                      placeholderTextColor="#555"
                      value={otpCode}
                      onChangeText={setOtpCode}
                      onFocus={() => setFocusedField('otpCode')}
                      onBlur={() => setFocusedField(null)}
                      style={[getInputStyle('otpCode'), styles.otpInput]}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleVerifyOtp}
                    style={[styles.actionBtn, { backgroundColor: colors.primaryAccent }]}
                  >
                    <Text style={styles.actionBtnText}>XÁC MINH & ĐĂNG NHẬP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setViewMode('register')}
                    style={styles.backLink}
                  >
                    <Text style={styles.backLinkText}>Quay lại bước đăng ký</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* FORGOT PASSWORD MODE */}
              {viewMode === 'forgot-password' && (
                <>
                  <Text style={styles.infoText}>
                    Nhập địa chỉ email đăng ký tài khoản của bạn. Hệ thống sẽ gửi một mã OTP để xác nhận đổi mật khẩu mới.
                  </Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>EMAIL TÀI KHOẢN</Text>
                    <TextInput
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="example@email.com"
                      placeholderTextColor="#555"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('email')}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleForgotPassword}
                    style={[styles.actionBtn, { backgroundColor: colors.primaryAccent }]}
                  >
                    <Text style={styles.actionBtnText}>GỬI MÃ XÁC THỰC</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setViewMode('login')}
                    style={styles.backLink}
                  >
                    <Text style={styles.backLinkText}>Quay lại đăng nhập</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* VERIFY RESET OTP MODE */}
              {viewMode === 'verify-reset-otp' && (
                <>
                  <Text style={styles.infoText}>
                    Mã OTP khôi phục mật khẩu đã được gửi tới email{' '}
                    <Text style={{ color: '#c084fc', fontWeight: 'bold' }}>{email}</Text>. Vui lòng nhập mã để tiếp tục.
                  </Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>MÃ XÁC THỰC OTP</Text>
                    <TextInput
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="123456"
                      placeholderTextColor="#555"
                      value={otpCode}
                      onChangeText={setOtpCode}
                      onFocus={() => setFocusedField('otpCode')}
                      onBlur={() => setFocusedField(null)}
                      style={[getInputStyle('otpCode'), styles.otpInput]}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleVerifyResetOtp}
                    style={[styles.actionBtn, { backgroundColor: colors.primaryAccent }]}
                  >
                    <Text style={styles.actionBtnText}>XÁC MINH MÃ OTP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setViewMode('login')}
                    style={styles.backLink}
                  >
                    <Text style={styles.backLinkText}>Quay lại đăng nhập</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* RESET PASSWORD MODE */}
              {viewMode === 'reset-password' && (
                <>
                  <Text style={styles.infoText}>
                    Xác thực OTP thành công. Vui lòng thiết lập mật khẩu mới cho tài khoản{' '}
                    <Text style={{ color: colors.secondaryAccent, fontWeight: 'bold' }}>{email}</Text>.
                  </Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>MẬT KHẨU MỚI</Text>
                    <TextInput
                      secureTextEntry
                      autoCapitalize="none"
                      placeholder="Tối thiểu 6 ký tự"
                      placeholderTextColor="#555"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('password')}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>XÁC NHẬN MẬT KHẨU MỚI</Text>
                    <TextInput
                      secureTextEntry
                      autoCapitalize="none"
                      placeholder="••••••••"
                      placeholderTextColor="#555"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      style={getInputStyle('confirmPassword')}
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleResetPassword}
                    style={[styles.actionBtn, { backgroundColor: colors.primaryAccent }]}
                  >
                    <Text style={styles.actionBtnText}>CẬP NHẬT MẬT KHẨU</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setViewMode('login')}
                    style={styles.backLink}
                  >
                    <Text style={styles.backLinkText}>Quay lại đăng nhập</Text>
                  </TouchableOpacity>
                </>
              )}

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
    position: 'relative',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(124, 58, 237, 0.12)', // Fade violet glow
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(6, 182, 212, 0.12)', // Fade cyan glow
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#c084fc',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#c084fc',
    textShadowColor: 'rgba(192, 132, 252, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  form: {
    width: '100%',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#06b6d4',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 6,
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: '500',
  },
  actionBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
    marginBottom: 16,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  linkText: {
    color: '#22d3ee',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  infoText: {
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  backLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  backLinkText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
