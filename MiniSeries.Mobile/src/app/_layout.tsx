import React, { useEffect } from 'react';

import { Stack } from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';

import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { AppProvider, useApp } from '../context/AppContext';

import { useTheme } from '../hooks/use-theme';

import { Ionicons } from '@expo/vector-icons';



// Prevent the splash screen from auto-hiding before asset loading is complete.

SplashScreen.preventAutoHideAsync();



function RootLayoutNav() {

  const { toastMessage, closeToast, isAppReady } = useApp();

  const theme = useTheme();

  const isDark = theme.isDark;

  const insets = useSafeAreaInsets();



  useEffect(() => {

    if (isAppReady) {
      SplashScreen.hideAsync();
    }

  }, [isAppReady]);



  return (

    <View style={styles.container}>

      <Stack screenOptions={{ headerShown: false }}>

        <Stack.Screen name="index" />

        <Stack.Screen name="(auth)/login" />

        <Stack.Screen name="auth/callback" />

        <Stack.Screen name="(tabs)" />

        <Stack.Screen name="review/index" />

        <Stack.Screen name="lesson/[id]" />

        <Stack.Screen name="support/index" />

        <Stack.Screen name="achievements" />

      </Stack>



      {toastMessage ? (

        <View

          pointerEvents="box-none"

          style={[styles.toastAnchor, { top: insets.top + 10 }]}

        >

          <View

            style={[

              styles.toastContainer,

              {

                borderColor: theme.border,

                backgroundColor: theme.cardBg,

                shadowColor: isDark ? '#000000' : '#0f172a',

              },

            ]}

          >

            <View style={[styles.toastAccent, { backgroundColor: theme.primaryAccent }]} />

            <Ionicons name="checkmark-circle" size={18} color={theme.primaryAccent} style={styles.toastIcon} />

            <Text style={[styles.toastText, { color: theme.text }]} numberOfLines={2}>

              {toastMessage}

            </Text>

            <TouchableOpacity onPress={closeToast} style={styles.toastCloseBtn} activeOpacity={0.7} hitSlop={8}>

              <Ionicons name="close" size={16} color={theme.textMuted} />

            </TouchableOpacity>

          </View>

        </View>

      ) : null}

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

  toastAnchor: {

    position: 'absolute',

    left: 16,

    right: 16,

    zIndex: 9999,

    alignItems: 'center',

  },

  toastContainer: {

    width: '100%',

    maxWidth: 420,

    borderWidth: 1,

    borderRadius: 10,

    paddingVertical: 10,

    paddingHorizontal: 12,

    flexDirection: 'row',

    alignItems: 'center',

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.12,

    shadowRadius: 6,

    elevation: 4,

    overflow: 'hidden',

  },

  toastAccent: {

    position: 'absolute',

    left: 0,

    top: 0,

    bottom: 0,

    width: 3,

  },

  toastIcon: {

    marginLeft: 4,

    marginRight: 8,

  },

  toastText: {

    fontSize: 13,

    fontWeight: '700',

    flex: 1,

    lineHeight: 18,

  },

  toastCloseBtn: {

    padding: 4,

    marginLeft: 6,

    justifyContent: 'center',

    alignItems: 'center',

  },

});


