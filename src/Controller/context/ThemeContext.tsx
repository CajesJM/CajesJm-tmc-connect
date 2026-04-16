import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  sidebar: {
    background: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    icon: {
      active: string;
      inactive: string;
    };
  };
  accent: {
    primary: string;
    hover: string;
  };
  header: {
    background: string;
    text: string;
    border: string;
  };
  background: string;
  text: string;
  card: string;
  border: string;
  statusBar: 'light' | 'dark';

  textSecondary: string;
  textMuted: string;
  error: string;
  success?: string;
  warning?: string;
  primary?: string; 
}

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const lightColors: ThemeColors = {
  sidebar: {
    background: '#FFFFFF',
    border: '#E2E8F0',
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
      muted: '#94A3B8',
    },
    icon: {
      active: '#3B82F6',
      inactive: '#94A3B8',
    },
  },
  accent: {
    primary: '#3B82F6',
    hover: '#2563EB',
  },
  header: {
    background: '#FFFFFF',
    text: '#0A0F1E',
    border: '#EFF2F6',
  },
  background: '#F8FAFC',
  text: '#0A0F1E',
  card: '#FFFFFF',
  border: '#E2E8F0',
  statusBar: 'dark',
  textSecondary: '#64748B',
  textMuted: '#64748B',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  primary: '#3B82F6',
};

const darkColors: ThemeColors = {
  sidebar: {
    background: '#0A0F1E',
    border: '#1E2A45',
    text: {
      primary: '#FFFFFF',
      secondary: '#8B98B5',
      muted: '#5A6B8C',
    },
    icon: {
      active: '#FFFFFF',
      inactive: '#5A6B8C',
    },
  },
  accent: {
    primary: '#3B82F6',
    hover: '#60A5FA',
  },
  header: {
    background: '#0A0F1E',
    text: '#FFFFFF',
    border: '#1E2A45',
  },
  background: '#0F172A',
  text: '#FFFFFF',
  card: '#1E293B',
  border: '#334155',
  statusBar: 'light',
  textSecondary: '#8B98B5',
  textMuted: '#94A3B8',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  primary: '#3B82F6',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const toggleTheme = () => {
    const currentEffectiveTheme = getEffectiveTheme();
    const newTheme = currentEffectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (theme === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return theme;
  };

  const effectiveTheme = getEffectiveTheme();
  const isDark = effectiveTheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}