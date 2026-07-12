import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppProvider, useApp } from '../context/AppContext';
import { useTheme } from '../hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { toastMessage, closeToast, themeId } = useApp();
  const theme = useTheme();
  const isDark = theme.isDark;

  useEffect(() => {
    // Hide splash screen immediately when mounted
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="review/index" />
        <Stack.Screen name="lesson/[id]" />
        <Stack.Screen name="support/index" />
        <Stack.Screen name="achievements" />
      </Stack>

      {/* Global Toast Notification */}
      {toastMessage && (
        <View style={[
          styles.toastContainer,
          {
            borderColor: theme.border,
            backgroundColor: theme.cardBg,
            shadowColor: isDark ? '#000000' : '#0f172a',
          }
        ]}>
          <View style={styles.toastPulse} />
          <Text style={[styles.toastText, { color: theme.text }]}>
            {toastMessage}
          </Text>
          <TouchableOpacity onPress={closeToast} style={styles.toastCloseBtn} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootLayoutNav />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    left: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 9999,
  },
  toastPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 12,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  toastCloseBtn: {
    padding: 2,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
