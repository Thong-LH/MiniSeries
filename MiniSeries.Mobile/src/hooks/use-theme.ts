import { useApp } from '../context/AppContext';

export function useTheme() {
  const { themeId } = useApp();
  const isDark = themeId === 'bold-typography-dark';

  return {
    background: isDark ? '#121212' : '#FAF9F6',
    text: isDark ? '#FAF9F6' : '#1A1A1A',
    textMuted: isDark ? '#CFCFCF' : '#4A4A4A',
    border: isDark ? '#FFFFFF' : '#000000',
    primaryAccent: '#FF3E00',
    cardBg: isDark ? '#1a1a1a' : '#ffffff',
  };
}
