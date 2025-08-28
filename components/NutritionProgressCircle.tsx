import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface NutritionProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export const NutritionProgressCircle: React.FC<NutritionProgressCircleProps> = ({
  percentage,
  size = 85,
  strokeWidth = 4,
}) => {
  return (
    <AnimatedCircularProgress
      size={size}
      width={strokeWidth}
      fill={percentage}
      tintColor={percentage >= 90 ? colors.primary : colors.lightGray}
      backgroundColor={colors.mediumGray}
      rotation={0}
      lineCap="round"
      duration={800}
    >
      {() => (
        <View style={styles.circleContent}>
          <Text style={[styles.percentageText, { fontSize: size * 0.24 }]}>
            {percentage}%
          </Text>
        </View>
      )}
    </AnimatedCircularProgress>
  );
};

const styles = StyleSheet.create({
  circleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: 'bold',
  },
});
