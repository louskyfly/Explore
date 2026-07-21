import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Category, getCategoryInfo } from '../types/activity';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  category: Category;
  size?: 'small' | 'medium';
}

export function CategoryBadge({ category, size = 'medium' }: Props) {
  const { theme } = useTheme();
  const info = getCategoryInfo(category);
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: info.color + '20',
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? 8 : 12,
        },
      ]}
    >
      <MaterialIcons
        name={info.icon as any}
        size={isSmall ? 12 : 15}
        color={info.color}
      />
      <Text
        style={[
          styles.label,
          {
            color: info.color,
            fontSize: isSmall ? 10 : 12,
            marginLeft: isSmall ? 3 : 5,
          },
        ]}
      >
        {info.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
});
