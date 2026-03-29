import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { ThemeColors } from '../types';
import { DEFAULT_THEME } from '../utils/constants';

interface ThemeContextValue {
  theme: ThemeColors;
  accentColor: string;
  setAccentColor: (color: string | null) => void;
  extractAccentFromArtwork: (uri: string | null) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  accentColor: DEFAULT_THEME.accent,
  setAccentColor: () => {},
  extractAccentFromArtwork: () => {},
  isDark: true,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ACCENT_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
  '#3B82F6', '#EF4444', '#14B8A6', '#F97316', '#84CC16',
];

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, accentColor, setAccentColor } = useUIStore();

  const extractAccentFromArtwork = useCallback((uri: string | null) => {
    if (!uri) return;
    const randomColor = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
    setAccentColor(randomColor);
  }, [setAccentColor]);

  const value = useMemo(() => ({
    theme,
    accentColor: accentColor || theme.accent,
    setAccentColor,
    extractAccentFromArtwork,
    isDark: true,
  }), [theme, accentColor, setAccentColor, extractAccentFromArtwork]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
