import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';

export default function LoginScreen() {
  const { themeId, setIsAuthenticated, triggerToast } = useApp();
  const router = useRouter();

  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [mockOtp, setMockOtp] = useState<string>('');

  const isDark = themeId === 'bold-typography-dark';
  const colors = {
    bg: isDark ? '#121212' : '#FAF9F6',
    text: isDark ? '#FAF9F6' : '#1A1A1A',
    textMuted: isDark ? '#CFCFCF' : '#4A4A4A',
    border: isDark ? '#FFFFFF' : '#000000',
    primaryAccent: '#FF3E00',
    inputBg: isDark ? '#1e1e1e' : '#FFFFFF',
  };

  const handleSendOtp = () => {
    if (!phone.trim()) {
      triggerToast('Vui lòng nhập số điện thoại!');
      return;
    }
    if (phone.length < 9) {
      triggerToast('Số điện thoại không hợp lệ!');
      return;
    }

    // Generate random 6 digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setMockOtp(code);
    setIsOtpSent(true);
    triggerToast(`Mã OTP (thử nghiệm) đã gửi: ${code}`);
  };

  const handleVerifyOtp = () => {
    if (!otp.trim()) {
      triggerToast('Vui lòng nhập mã OTP!');
      return;
    }
    if (otp === mockOtp || otp === '123456') { // Allow back-door 123456 for testing
      setIsAuthenticated(true);
      triggerToast('Đăng nhập thành công!');
      router.replace('/(tabs)/home');
    } else {
      triggerToast('Mã OTP không chính xác!');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: isDark ? '#1a1a1a' : '#ffffff', shadowColor: colors.border }]}>
        <Text style={[styles.brand, { color: colors.primaryAccent }]}>
          ⚡ MINISERIES
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {isOtpSent ? 'XÁC THỰC MÃ OTP' : 'ĐĂNG NHẬP HỆ THỐNG'}
        </Text>

        {!isOtpSent ? (
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.textMuted }]}>SỐ ĐIỆN THOẠI</Text>
            <TextInput
              keyboardType="phone-pad"
              placeholder="Nhập số điện thoại của bạn..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={phone}
              onChangeText={setPhone}
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSendOtp}
              style={[styles.button, { backgroundColor: colors.primaryAccent, borderColor: colors.border }]}
            >
              <Text style={styles.buttonText}>GỬI MÃ OTP</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.textMuted }]}>MÃ XÁC THỰC OTP</Text>
            <TextInput
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Nhập 6 số OTP..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={otp}
              onChangeText={setOtp}
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            />
            
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleVerifyOtp}
              style={[styles.button, { backgroundColor: colors.primaryAccent, borderColor: colors.border }]}
            >
              <Text style={styles.buttonText}>XÁC NHẬN ĐĂNG NHẬP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsOtpSent(false)}
              style={[styles.backButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.backButtonText, { color: colors.text }]}>QUAY LẠI</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
