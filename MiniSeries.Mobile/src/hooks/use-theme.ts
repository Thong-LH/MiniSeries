import { useApp } from '../context/AppContext';

export function useTheme() {
  const { themeId } = useApp();
  const isDark = themeId === 'bold-typography-dark';

  return {
    isDark,
    // Base colors
    background: isDark ? '#09090b' : '#f8fafc',
    bg: isDark ? '#09090b' : '#f8fafc',
    text: isDark ? '#fafafa' : '#0f172a',
    textMuted: isDark ? '#a1a1aa' : '#64748b',
    border: isDark ? 'rgba(56, 189, 248, 0.22)' : '#cbd5e1',
    borderMuted: isDark ? 'rgba(56, 189, 248, 0.12)' : '#e2e8f0',
    
    // Card and Container colors
    cardBg: isDark ? '#18181b' : 'rgba(255, 255, 255, 0.85)',
    cardBorder: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.15)',
    inputBg: isDark ? 'rgba(24, 24, 27, 0.65)' : 'rgba(255, 255, 255, 0.9)',
    
    // Accents & Buttons (Impeccable Theme Accents)
    primaryAccent: '#38bdf8', // Electric Sky Blue
    secondaryAccent: '#4ade80', // Gentle Green
    plasmaAccent: '#fb923c', // Soft Orange
    buttonTextActive: isDark ? '#09090b' : '#ffffff',
    
    // Format Badges/Tokens
    mangaAccent: '#fb923c', // Soft Orange
    videoAccent: '#38bdf8', // Sky Blue
    mangaBadgeBg: isDark ? 'rgba(251, 146, 60, 0.12)' : 'rgba(251, 146, 60, 0.08)',
    videoBadgeBg: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.08)',
    
    // Success/Error
    correct: '#4ade80',
    incorrect: '#f87171',
    correctBg: isDark ? 'rgba(74, 222, 128, 0.12)' : 'rgba(74, 222, 128, 0.08)',
    incorrectBg: isDark ? 'rgba(248, 113, 113, 0.12)' : 'rgba(248, 113, 113, 0.08)',
    
    // Specific highlights
    yellowGlow: '#fde047',
    pinkGlow: '#ec4899',
  };
}
