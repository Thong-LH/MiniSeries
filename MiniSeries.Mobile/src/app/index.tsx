import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { SpaceBackground } from '../components/SpaceBackground';

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
    }, 1500); // Show off the gorgeous loading splash screen animation!

    return () => clearTimeout(timer);
  }, [isAuthenticated, isAppReady]);

  return (
    <View style={styles.container}>
      <SpaceBackground />
      
      <View style={styles.logoCard}>
        <View style={styles.logoRing}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="MiniSeries logo" />
        </View>
        <Text style={styles.brand}>MINISERIES</Text>
        <Text style={styles.tagline}>Học qua truyện tranh & hoạt cảnh AI</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCard: {
    width: '84%',
    paddingVertical: 44,
    paddingHorizontal: 24,
    borderRadius: 30,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // dark glassmorphism
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  logoRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.25)', // neon blue border
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  logo: {
    width: 90,
    height: 90,
  },
  brand: {
    color: '#fafafa',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 6,
    marginBottom: 10,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    color: '#94a3b8',
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    opacity: 0.8,
  },
});
