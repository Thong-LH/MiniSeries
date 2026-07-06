import axios from 'axios';

// Đường dẫn API Server Backend của dự án
const BASE_URL = 'https://miniseries-api.example.com'; 

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
    // KAN-90: Khi bạn LH tích hợp lưu Token vào bộ nhớ điện thoại (AsyncStorage/SecureStore),
    // bạn sẽ lấy token ra tại đây và đính kèm vào header:
    // const token = await SecureStore.getItemAsync('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Bộ đánh chặn xử lý lỗi phản hồi từ Server (ví dụ: Token hết hạn - 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Xử lý đăng xuất hoặc refresh token tại đây
      console.log('Token đã hết hạn hoặc không hợp lệ!');
    }
    return Promise.reject(error);
  }
);
