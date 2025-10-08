import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface ErrorStateProps {
  error?: Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  title?: string;
  message?: string;
  type?: 'network' | 'auth' | 'subscription' | 'general' | 'component';
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  onDismiss,
  title,
  message,
  type = 'general',
  compact = false
}) => {
  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return '🌐';
      case 'auth':
        return '🔐';
      case 'subscription':
        return '💳';
      case 'component':
        return '⚙️';
      default:
        return '⚠️';
    }
  };

  const getErrorMessage = () => {
    if (message) return message;
    
    switch (type) {
      case 'network':
        return "Connection issue. Please check your internet and try again.";
      case 'auth':
        return "Authentication error. Please sign in again.";
      case 'subscription':
        return "Subscription issue. Please try again or contact support.";
      case 'component':
        return "This feature encountered an error. Please try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const getErrorTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'network':
        return "Connection Error";
      case 'auth':
        return "Authentication Error";
      case 'subscription':
        return "Subscription Error";
      case 'component':
        return "Feature Error";
      default:
        return "Error";
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactContent}>
          <Text style={styles.compactIcon}>{getErrorIcon()}</Text>
          <View style={styles.compactTextContainer}>
            <Text style={styles.compactTitle}>{getErrorTitle()}</Text>
            <Text style={styles.compactMessage}>{getErrorMessage()}</Text>
          </View>
          {onRetry && (
            <TouchableOpacity
              style={styles.compactRetryButton}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.compactRetryText}>Retry</Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity
              style={styles.compactDismissButton}
              onPress={onDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.compactDismissText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getErrorIcon()}</Text>
        </View>
        
        <Text style={styles.title}>{getErrorTitle()}</Text>
        <Text style={styles.message}>{getErrorMessage()}</Text>
        
        <View style={styles.buttonContainer}>
          {onRetry && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={colors.gradients.primaryButton}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {onDismiss && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.dark,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
    width: '100%',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    ...typography.h4,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: colors.mediumGray,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  // Compact styles
  compactContainer: {
    backgroundColor: colors.mediumGray,
    borderRadius: 12,
    margin: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  compactTextContainer: {
    flex: 1,
  },
  compactTitle: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  compactMessage: {
    ...typography.caption,
    color: colors.lightGray,
  },
  compactRetryButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  compactRetryText: {
    ...typography.caption,
    color: colors.black,
    fontWeight: 'bold',
  },
  compactDismissButton: {
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginLeft: 4,
  },
  compactDismissText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default ErrorState;
