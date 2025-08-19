import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface StatItemProps {
  value: string | number;
  label: string;
  onPress?: () => void;
  infoTitle?: string;
  infoDescription?: string;
  style?: any;
}

export const StatItem: React.FC<StatItemProps> = ({
  value,
  label,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity 
      style={[styles.statItem, style]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...typography.timerMedium,
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
});
