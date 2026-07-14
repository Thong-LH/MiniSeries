import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { apiClient, setAuthToken } from './apiClient';

const SUPABASE_URL = 'https://jtdqyzkaviqopmxotuge.supabase.co';

function extractAccessToken(url: string): string | null {
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    const token = new URLSearchParams(url.substring(hashIndex + 1)).get('access_token');
    if (token) return token;
  }

  try {
    return new URL(url).searchParams.get('access_token');
  } catch {
    return null;
  }
}

/**
 * Google Sign-In for MOBILE (Android/iOS) — opens Supabase OAuth in an in-app browser.
 * openAuthSessionAsync returns the redirect URL with #access_token; we exchange it here.
 */
export const signInWithGoogleBrowser = async (): Promise<any> => {
  const redirectUri = Linking.createURL('auth/callback');
  console.log('[Google OAuth] Redirect URI (Expo Go / mobile):', redirectUri);

  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;
  console.log('[Google OAuth] Auth URL:', authUrl);

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
  console.log('[Google OAuth] Browser result:', result.type, result.type === 'success' ? result.url : '');

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Đăng nhập Google đã bị hủy.');
  }

  if (result.type !== 'success' || !result.url) {
    throw new Error('Đăng nhập Google thất bại.');
  }

  const supabaseAccessToken = extractAccessToken(result.url);
  if (!supabaseAccessToken) {
    throw new Error('Không nhận được Access Token từ Google/Supabase.');
  }

  const backendRes = await apiClient.post('/auth/google-signin', {
    accessToken: supabaseAccessToken,
  });

  const loginData = backendRes.data;

  if (loginData?.accessToken) {
    setAuthToken(loginData.accessToken);
  }

  return loginData;
};

/**
 * Google Sign-In for WEB — redirects the entire page to Supabase OAuth.
 * After OAuth, the page reloads with #access_token=... in the URL hash.
 */
export const signInWithGoogleWeb = () => {
  if (typeof window !== 'undefined') {
    const redirectUrl = window.location.origin + window.location.pathname;
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
  }
};
