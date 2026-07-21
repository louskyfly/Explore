import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Status, getStatusInfo } from '../types/activity';

interface Props {
  status: Status;
}

export function StatusBadge({ status }: Props) {
  const info = getStatusInfo(status);
  return (
    <View style={[styles.badge, { backgroundColor: info.color + '20' }]}>
      <View style={[styles.dot, { backgroundColor: info.color }]} />
      <Text style={[styles.label, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
