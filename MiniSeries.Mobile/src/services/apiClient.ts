import axios from 'axios';
import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';

const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:5088/api'
  : 'http://localhost:5088/api'; 

let authToken: string | null = null;

// Khôi phục token từ localStorage nếu đang chạy trên trình duyệt (Web)
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    authToken = localStorage.getItem('authToken');
  } catch (e) {
    console.log('Không thể đọc token từ localStorage:', e);
  }
}

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

let isAlerting = false;

// Bộ đánh chặn xử lý lỗi phản hồi từ Server (ví dụ: Token hết hạn - 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!isAlerting) {
        isAlerting = true;
        
        const logout = () => {
          isAlerting = false;
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
