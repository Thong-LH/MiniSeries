import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { apiClient, setAuthToken } from './apiClient';

const SUPABASE_URL = 'https://devnyzwnvyzgulqroyqa.supabase.co';

/**
 * Google Sign-In for MOBILE (Android/iOS) — opens Supabase OAuth in an in-app browser.
 * No native SDK configuration (SHA-1, google-services.json) needed.
 * Returns the backend login data (accessToken, planName, etc.) on success.
 */
export const signInWithGoogleBrowser = async (): Promise<any> => {
  // Build the redirect URI that the browser will return to after OAuth
  const redirectUri = Linking.createURL('auth/callback');

  // Supabase OAuth authorize URL
  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;

  // Open the browser for OAuth
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type !== 'success' || !result.url) {
    throw new Error('Đăng nhập Google đã bị hủy.');
  }

  // Parse the returned URL to extract access_token from hash fragment
  // Supabase redirects with: redirect_uri#access_token=...&refresh_token=...&...
  const returnedUrl = result.url;
  let supabaseAccessToken: string | null = null;

  // Try hash fragment first (standard Supabase redirect)
  const hashIndex = returnedUrl.indexOf('#');
  if (hashIndex !== -1) {
    const hashParams = new URLSearchParams(returnedUrl.substring(hashIndex + 1));
    supabaseAccessToken = hashParams.get('access_token');
  }

  // Fallback: try query params
  if (!supabaseAccessToken) {
    const urlObj = new URL(returnedUrl);
    supabaseAccessToken = urlObj.searchParams.get('access_token');
  }

  if (!supabaseAccessToken) {
    throw new Error('Không nhận được Access Token từ Google/Supabase.');
  }

  // Exchange Supabase access token with our backend
  const backendRes = await apiClient.post('/auth/google-signin', {
    accessToken: supabaseAccessToken,
  });

  const loginData = backendRes.data;

  if (loginData && loginData.accessToken) {
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