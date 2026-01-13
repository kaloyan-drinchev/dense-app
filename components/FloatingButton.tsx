import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface FloatingButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  gradientColors?: string[];
  disabledBackgroundColor?: string;
  disabledOpacity?: number;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  text,
  onPress,
  disabled = false,
  icon,
  backgroundColor = colors.primary,
  textColor = '#000',
  gradientColors,
  disabledBackgroundColor = colors.darkGray,
  disabledOpacity = 0.6,
}) => {
  const buttonContent = (
    <>
      {icon && <Icon name={icon as any} size={20} color={textColor} />}
      <Text style={[styles.buttonText, { color: textColor }]}>{text}</Text>
    </>
  );

  return (
    <LinearGradient
      colors={['transparent', colors.dark, colors.dark]}
      locations={[0, 0.3, 1]}
      style={styles.floatingButtonContainer}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {gradientColors && !disabled ? (
          <LinearGradient
            colors={gradientColors as unknown as readonly [string, string, ...string[]]}
            style={styles.floatingButton}
          >
            {buttonContent}
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={[
              disabled ? disabledBackgroundColor : backgroundColor,
              disabled ? disabledBackgroundColor : backgroundColor,
            ] as const}
            style={[
              styles.floatingButton,
              disabled && { opacity: disabledOpacity },
            ]}
          >
            {buttonContent}
          </LinearGradient>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 24,
    zIndex: 100,
  },
  touchable: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButton: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '400',
  },
});
