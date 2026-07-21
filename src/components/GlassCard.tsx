import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
  variant?: 'default' | 'elevated' | 'subtle';
}

export function GlassCard({ onPress, children, style, disabled, variant = 'default' }: Props) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.15 + glow.value * 0.2,
    shadowRadius: 16 + glow.value * 8,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 12, stiffness: 400 });
    glow.value = withSpring(1, { damping: 12, stiffness: 400 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 400 });
    glow.value = withSpring(0, { damping: 12, stiffness: 400 });
  };

  const glassBg = isDark
    ? 'rgba(44,44,46,0.65)'
    : 'rgba(255,255,255,0.55)';

  const glassBorderTop = isDark
    ? 'rgba(255,255,255,0.12)'
    : 'rgba(255,255,255,0.8)';

  const glassBorderBottom = isDark
    ? 'rgba(255,255,255,0.04)'
    : 'rgba(255,255,255,0.3)';

  return (
    <Animated.View style={[animatedStyle, glowStyle, {
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: variant === 'elevated' ? 8 : 4 },
      elevation: variant === 'elevated' ? 12 : 6,
    }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: glassBg,
            borderColor: glassBorderTop,
            borderBottomColor: glassBorderBottom,
            borderWidth: 1,
            opacity: pressed ? 0.88 : 1,
          },
          variant === 'elevated' && styles.elevated,
          variant === 'subtle' && styles.subtle,
          style,
        ]}
      >
        <LinearGradient
          colors={isDark
            ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']
            : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.1)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.glassSheen}
        />
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  glassSheen: {
    ...StyleSheet.absoluteFill,
    borderRadius: 22,
    pointerEvents: 'none',
  },
  elevated: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
  },
  subtle: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
