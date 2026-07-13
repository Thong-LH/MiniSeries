import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';

const LOGO = require('../../assets/images/project-logo-v2.png');

export default function IndexRedirector() {
  const { isAuthenticated, isAppReady } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isAppReady) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isAppReady]);

  return (
    <View style={styles.container}>
      <View style={styles.glow} />
      <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="MiniSeries logo" />
      <Text style={styles.brand}>MINISERIES</Text>
      <Text style={styles.tagline}>Học qua truyện tranh & hoạt cảnh AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
    paddingHorizontal: 32,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    top: '34%',
  },
  logo: {
    width: 128,
    height: 128,
    marginBottom: 20,
  },
  brand: {
    color: '#fafafa',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
