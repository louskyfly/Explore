import { useColorScheme } from 'react-native';

export const LightTheme = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#AEAEB2',
  border: '#E5E5EA',
  borderLight: '#F2F2F7',
  accent: '#007AFF',
  accentSecondary: '#5856D6',
  destructive: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  cardBackground: 'rgba(255,255,255,0.55)',
  cardBorder: 'rgba(255,255,255,0.8)',
  overlay: 'rgba(0,0,0,0.4)',
  shadow: 'rgba(0,0,0,0.08)',
  tabBar: 'rgba(249,249,249,0.78)',
  searchBackground: 'rgba(118,118,128,0.08)',
  separator: 'rgba(60,60,67,0.12)',
  statusBar: 'dark' as const,
  glassBg: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.8)',
  glassHighlight: 'rgba(255,255,255,0.6)',
  glassShadow: 'rgba(0,0,0,0.06)',
  glassBlur: 'rgba(255,255,255,0.72)',
};

export const DarkTheme = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  border: '#38383A',
  borderLight: '#2C2C2E',
  accent: '#0A84FF',
  accentSecondary: '#5E5CE6',
  destructive: '#FF453A',
  success: '#30D158',
  warning: '#FF9F0A',
  cardBackground: 'rgba(44,44,46,0.65)',
  cardBorder: 'rgba(255,255,255,0.12)',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(0,0,0,0.3)',
  tabBar: 'rgba(28,28,30,0.78)',
  searchBackground: 'rgba(118,118,128,0.16)',
  separator: 'rgba(84,84,88,0.65)',
  statusBar: 'light' as const,
  glassBg: 'rgba(44,44,46,0.65)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassHighlight: 'rgba(255,255,255,0.08)',
  glassShadow: 'rgba(0,0,0,0.2)',
  glassBlur: 'rgba(44,44,46,0.72)',
};

export type Theme = typeof LightTheme;

export function getTheme(colorScheme: 'light' | 'dark' | null | undefined): Theme {
  return (colorScheme === 'dark' ? DarkTheme : LightTheme) as Theme;
}
