import axios from 'axios';
import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';

import Constants from 'expo-constants';

import AsyncStorage from '@react-native-async-storage/async-storage';

const getBaseUrl = () => {
  return 'https://miniseries.onrender.com/api';
};

export const BASE_URL = getBaseUrl();
console.log('Mobile API Base URL:', BASE_URL);

export let authToken: string | null = (Platform.OS === 'web' && typeof window !== 'undefined')
  ? localStorage.getItem('authToken')
  : null;

export const initializeAuthToken = async () => {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      authToken = localStorage.getItem('authToken');
    } else {
      authToken = await AsyncStorage.getItem('authToken');
    }
  } catch (e) {
    console.log('Không thể khôi phục token từ bộ nhớ:', e);
  }
  return authToken;
};

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (e) {
      console.log('Không thể lưu/xóa token trong localStorage:', e);
    }
  } else {
    try {
      if (token) {
        AsyncStorage.setItem('authToken', token).catch(e => console.log('Không thể lưu token:', e));
      } else {
        AsyncStorage.removeItem('authToken').catch(e => console.log('Không thể xóa token:', e));
      }
    } catch (e) {
      console.log('Lỗi thao tác AsyncStorage:', e);
    }
  }
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 giây timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Bộ đánh chặn (Interceptor) để tự động đính kèm Token vào Header trước khi gửi request
apiClient.interceptors.request.use(
  async (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let onUnauthorizedCallback: (() => void) | null = null;
export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

let isAlerting = false;

// Bộ đánh chặn xử lý lỗi phản hồi từ Server (ví dụ: Token hết hạn - 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      if (
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/login-profile') ||
        requestUrl.includes('/auth/register')
      ) {
        return Promise.reject(error);
      }

      if (!isAlerting) {
        isAlerting = true;

        const logout = () => {
          isAlerting = false;
          if (onUnauthorizedCallback) {
            onUnauthorizedCallback();
          }
          // Clear session variables
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            try {
              localStorage.removeItem('authToken');
              localStorage.removeItem('isAuthenticated');
              window.location.reload();
            } catch (e) {
              console.log('Không thể xóa session:', e);
            }
          } else {
            // For native mobile
            setAuthToken(null);
            router.replace('/(auth)/login');
          }
        };

        if (Platform.OS === 'web') {
          alert('Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.');
          logout();
        } else {
          Alert.alert(
            'Phiên làm việc hết hạn',
            'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
            [
              {
                text: 'Đồng ý',
                onPress: logout
              }
            ],
            { cancelable: false }
          );
        }
      }
    }
    return Promise.reject(error);
  }
);
