import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';

export const LoadingOverlay: React.FC = () => {
  const { isGenerating, generationStep } = useApp();
  const [progress, setProgress] = useState<number>(0);

  const theme = useTheme();
  const isDark = theme.isDark;
  
  const colors = {
    bg: isDark ? 'rgba(9, 9, 11, 0.88)' : 'rgba(250, 250, 250, 0.88)',
    text: theme.text,
    textMuted: theme.textMuted,
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    primaryAccent: theme.primaryAccent,
    cardBg: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  };

  // Rotating animation for cosmic spinner
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Breathing animation for scale
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setProgress(0);
      
      // Start progress simulation
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) {
            return 98; // Hold at 98% until complete
          }
          return prev + Math.floor(Math.random() * 8) + 2;
        });
      }, 250);

      // Start loop animations
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

    } else {
      setProgress(0);
      rotateAnim.setValue(0);
      pulseAnim.setValue(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  if (!isGenerating) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.06],
  });

  return (
    <Modal transparent animationType="fade" visible={isGenerating}>
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          
          {/* Animated Cosmic Planet Loader */}
          <View style={styles.loaderContainer}>
            <Animated.View style={[styles.pulsingGlow, { 
              transform: [{ scale }], 
              backgroundColor: colors.primaryAccent,
              shadowColor: colors.primaryAccent 
            }]} />
            
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="planet" size={54} color={colors.primaryAccent} />
            </Animated.View>
            
            <Ionicons name="sparkles" size={18} color="#f59e0b" style={styles.sparkleIcon} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            HỆ THỐNG ĐANG TẠO BÀI HỌC
          </Text>

          {/* Premium Thin Glow Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <View style={[
              styles.progressBarFill, 
              { 
                width: `${progress}%`, 
                backgroundColor: colors.primaryAccent,
                shadowColor: colors.primaryAccent,
              }
            ]} />
          </View>

          <View style={styles.progressRow}>
            <Text style={[styles.progressNumber, { color: colors.text }]}>
              {progress}%
            </Text>
          </View>

          <View style={[styles.stepCard, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
            <Text style={[styles.stepText, { color: colors.textMuted }]}>
              {generationStep || 'Đang chuẩn bị dữ liệu học tập...'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loaderContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  pulsingGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.15,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  sparkleIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  progressRow: {
    marginBottom: 20,
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stepCard: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
});
