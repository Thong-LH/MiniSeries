import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../hooks/use-theme';

export const LoadingOverlay: React.FC = () => {
  const { isGenerating, generationStep, themeId } = useApp();
  const [progress, setProgress] = useState<number>(0);

  const theme = useTheme();
  const isDark = theme.isDark;
  const colors = {
    bg: isDark ? 'rgba(3, 7, 18, 0.95)' : 'rgba(248, 250, 252, 0.95)',
    text: theme.text,
    border: theme.border,
    primaryAccent: theme.primaryAccent,
    cardBg: theme.cardBg,
  };

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) {
            return 98; // Hold at 98 until complete
          }
          return prev + Math.floor(Math.random() * 8) + 2;
        });
      }, 200);
    } else {
      setProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  if (!isGenerating) return null;

  return (
    <Modal transparent animationType="fade" visible={isGenerating}>
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            HỆ THỐNG ĐANG TẠO BÀI HỌC
          </Text>
          
          <ActivityIndicator size="large" color={colors.primaryAccent} style={styles.spinner} />

          <View style={[styles.progressBarContainer, { borderColor: colors.border, backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
            <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.primaryAccent }]} />
          </View>

          <Text style={[styles.progressNumber, { color: colors.text }]}>
            TIẾN TRÌNH: {progress}%
          </Text>

          <Text style={[styles.stepText, { color: colors.text }]}>
            {generationStep}
          </Text>
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
    borderWidth: 2,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  spinner: {
    marginVertical: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 16,
    borderWidth: 2,
    marginBottom: 10,
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
  },
  progressNumber: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 16,
    fontFamily: 'System',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
});
