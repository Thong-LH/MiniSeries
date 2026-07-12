import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { apiClient, setAuthToken } from './apiClient';

import { Platform } from 'react-native';

const SUPABASE_URL = 'https://devnyzwnvyzgulqroyqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldm55endudnl6Z3VscXJveXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzk5MzIsImV4cCI6MjA5NDc1NTkzMn0.qh_mO172FKssq0QYJctScUKdeHJU6ESg4cbR-B0APwY';
const WEB_CLIENT_ID = '126955656491-lfu4ptko39ilrf4so15u83meop10qulm.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '126955656491-duofhuo9587n81cuhlgmivfjbs7t31k0.apps.googleusercontent.com';
const IOS_CLIENT_ID = '126955656491-vddeqf0bguj9g5gpah91m5u9sl3d0bbu.apps.googleusercontent.com';

// Configure Google Sign-in only on Native platforms to avoid Web platform warnings
if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    offlineAccess: true,
  } as any);
}

export const signInWithGoogleNative = async () => {
  try {
    // 1. Check Play Services availability and trigger native login popup
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult.data?.idToken;

    if (!idToken) {
      throw new Error('Không nhận được ID Token từ Google.');
    }

    // 2. Exchange Google ID Token with Supabase OAuth REST API
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=id_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        provider: 'google',
        token: idToken,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData?.error_description || errData?.message || 'Xác thực Supabase thất bại.');
    }

    const supabaseSession = await response.json();
    const supabaseAccessToken = supabaseSession.access_token;

    if (!supabaseAccessToken) {
      throw new Error('Không nhận được Access Token từ Supabase.');
    }

    // 3. Authenticate with our ASP.NET Core Backend using the Supabase Access Token
    const backendRes = await apiClient.post('/auth/google-signin', {
      accessToken: supabaseAccessToken,
    });

    const loginData = backendRes.data;

    // Save authentication token to apiClient state
    if (loginData && loginData.accessToken) {
      setAuthToken(loginData.accessToken);
    }

    return loginData;
  } catch (error: any) {
    console.error('Lỗi khi đăng nhập Google Native:', error);
    throw error;
  }
};

export const signOutGoogleNative = async () => {
  try {
    if (Platform.OS !== 'web') {
      await GoogleSignin.signOut();
    }
  } catch (e) {
    console.log('Lỗi đăng xuất Google Native:', e);
  }
};

export const signInWithGoogleWeb = () => {
  const supabaseUrl = 'https://devnyzwnvyzgulqroyqa.supabase.co';
  if (typeof window !== 'undefined') {
    const redirectUrl = window.location.origin + window.location.pathname;
    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
  }
};
