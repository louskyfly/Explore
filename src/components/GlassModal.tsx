import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Dimensions, KeyboardAvoidingView, Platform, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function GlassModal({ visible, onClose, children }: Props) {
  const { theme } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(visible ? 1 : 0, { damping: 20, stiffness: 200 });
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.5,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 400 }],
    opacity: progress.value,
  }));

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.content,
            contentStyle,
            {
              backgroundColor: theme.glassBg,
              borderColor: theme.glassBorder,
              borderWidth: 1,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <Pressable style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: theme.border }]} />
          </Pressable>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: '#000' },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 40,
    maxHeight: '90%',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: { alignItems: 'center', paddingVertical: 8 },
  handleBar: { width: 36, height: 5, borderRadius: 2.5 },
});
