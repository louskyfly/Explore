import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, getTheme, LightTheme } from '../theme/colors';
import { Settings } from '../types/activity';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  primaryColor: '#007AFF',
  secondaryColor: '#5856D6',
  theme: 'auto',
  cardSize: 'medium',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: LightTheme,
  isDark: false,
  settings: defaultSettings,
  updateSettings: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    AsyncStorage.getItem('settings').then(data => {
      if (data) setSettings(JSON.parse(data));
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem('settings', JSON.stringify(next));
      return next;
    });
  }, []);

  const resolvedDark = settings.theme === 'auto'
    ? systemScheme === 'dark'
    : settings.theme === 'dark';

  const theme = resolvedDark ? getTheme('dark') : getTheme('light');

  return (
    <ThemeContext.Provider value={{ theme, isDark: resolvedDark, settings, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
