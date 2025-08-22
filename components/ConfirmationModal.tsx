import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface ConfirmationButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
}

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  iconName?: keyof typeof Icon.glyphMap;
  iconColor?: string;
  buttons: ConfirmationButton[];
  highlightText?: string; // Optional text to highlight in a container
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  title,
  message,
  iconName = 'help-circle',
  iconColor = colors.primary,
  buttons,
  highlightText,
}) => {
  const handleButtonPress = (button: ConfirmationButton) => {
    if (Platform.OS !== 'web') {
      const impactStyle = button.style === 'destructive' 
        ? Haptics.ImpactFeedbackStyle.Heavy 
        : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(impactStyle);
    }
    
    button.onPress();
    onClose();
  };

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'destructive':
        return { backgroundColor: colors.error };
      case 'primary':
        return { gradient: [colors.primary, '#4A90E2'] };
      case 'cancel':
      default:
        return { backgroundColor: colors.mediumGray };
    }
  };

  const getButtonTextStyle = (style?: string) => {
    switch (style) {
      case 'destructive':
        return { color: colors.white };
      case 'primary':
        return { color: colors.white };
      case 'cancel':
      default:
        return { color: colors.lightGray };
    }
  };

  const renderButton = (button: ConfirmationButton, index: number) => {
    const buttonStyle = getButtonStyle(button.style);
    const textStyle = getButtonTextStyle(button.style);

    if (buttonStyle.gradient) {
      return (
        <TouchableOpacity
          key={index}
          style={[styles.button, { overflow: 'hidden' }]}
          onPress={() => handleButtonPress(button)}
        >
          <LinearGradient
            colors={buttonStyle.gradient as [string, string, ...string[]]}
            style={styles.gradientButton}
          >
            <Text style={[styles.buttonText, textStyle]}>{button.text}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={[styles.button, buttonStyle]}
        onPress={() => handleButtonPress(button)}
      >
        <Text style={[styles.buttonText, textStyle]}>{button?.text || ''}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <LinearGradient
            colors={[colors.darkGray, colors.dark]}
            style={styles.modalGradient}
          >
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
              <Icon name={iconName} size={48} color={iconColor} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>
            
            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Highlight Text (optional) */}
            {highlightText && (
              <View style={styles.highlightContainer}>
                <Text style={styles.highlightText}>{highlightText}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={[
              styles.buttonContainer,
              buttons.length > 2 && styles.buttonContainerVertical
            ]}>
              {buttons.map((button, index) => renderButton(button, index))}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: Math.min(width - 40, 340),
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalGradient: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.lighterGray,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  highlightContainer: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  highlightText: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  gradientButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.button,
  },
});
