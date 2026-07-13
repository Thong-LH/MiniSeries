import { View, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

/**
 * Deep-link landing route for OAuth redirect URI.
 * Token exchange runs in signInWithGoogleBrowser via openAuthSessionAsync.
 */
export default function AuthCallback() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212' }}>
      <ActivityIndicator size="large" color="#FF3E00" />
    </View>
  );
}
