import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { FloatingButtonProps } from '../core/types';

const { height: screenHeight } = Dimensions.get('window');

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  onPress,
  config = {},
  theme = {},
  hasNotifications = false,
  disabled = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;

  // Default configuration
  const defaultConfig = {
    size: 56,
    position: {
      bottom: 100, // Above tab bar
      right: 20,
    },
    icon: 'message-circle',
    showBadge: true,
  };

  const defaultTheme = {
    primary: '#007AFF',
    secondary: '#FF3B30',
    background: '#000000',
    text: '#FFFFFF',
    border: '#333333',
  };

  const mergedConfig = { ...defaultConfig, ...config };
  const mergedTheme = { ...defaultTheme, ...theme };

  // Pulse animation
  useEffect(() => {
    const createPulseAnimation = () => {
      return Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]);
    };

    if (!disabled) {
      const pulseLoop = Animated.loop(createPulseAnimation(), {
        iterations: -1,
      });
      pulseLoop.start();

      return () => pulseLoop.stop();
    }
  }, [disabled, pulseAnim]);

  // Badge animation
  useEffect(() => {
    Animated.spring(badgeAnim, {
      toValue: hasNotifications ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [hasNotifications, badgeAnim]);

  const buttonStyle = [
    styles.button,
    {
      width: mergedConfig.size,
      height: mergedConfig.size,
      borderRadius: mergedConfig.size / 2,
      backgroundColor: mergedTheme.primary,
      bottom: mergedConfig.position.bottom,
      right: mergedConfig.position.right,
      opacity: disabled ? 0.6 : 1,
    },
  ];

  const iconSize = mergedConfig.size * 0.4;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {/* Main AI Icon */}
        <Icon
          name={mergedConfig.icon as any}
          size={iconSize}
          color={mergedTheme.text}
        />

        {/* Notification Badge */}
        {mergedConfig.showBadge && (
          <Animated.View
            style={[
              styles.badge,
              {
                backgroundColor: mergedTheme.secondary,
                transform: [{ scale: badgeAnim }],
              },
            ]}
          >
            <View style={styles.badgeDot} />
          </Animated.View>
        )}

        {/* Glow Effect */}
        <View
          style={[
            styles.glow,
            {
              width: mergedConfig.size + 10,
              height: mergedConfig.size + 10,
              borderRadius: (mergedConfig.size + 10) / 2,
              backgroundColor: mergedTheme.primary,
            },
          ]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  glow: {
    position: 'absolute',
    opacity: 0.1,
    zIndex: -1,
  },
});
