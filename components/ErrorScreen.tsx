import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '@/constants/colors';
import { typography } from '@/constants/typography';

interface ErrorScreenProps {
  error?: Error | null;
  onRetry?: () => void;
  onGoBack?: () => void;
  onReportError?: () => void;
  title?: string;
  message?: string;
  showDetails?: boolean;
  type?: 'network' | 'auth' | 'subscription' | 'general' | 'component';
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  error,
  onRetry,
  onGoBack,
  onReportError,
  title = "Oops! Something went wrong",
  message,
  showDetails = false,
  type = 'general'
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
        return "We're having trouble connecting to our servers. Please check your internet connection and try again.";
      case 'auth':
        return "There was an issue with your authentication. Please sign in again.";
      case 'subscription':
        return "We couldn't verify your subscription status. Please try again or contact support.";
      case 'component':
        return "This feature encountered an unexpected error. We're working to fix it.";
      default:
        return "Something unexpected happened. Don't worry, we're on it!";
    }
  };

  const getErrorTitle = () => {
    switch (type) {
      case 'network':
        return "Connection Issue";
      case 'auth':
        return "Authentication Error";
      case 'subscription':
        return "Subscription Error";
      case 'component':
        return "Feature Error";
      default:
        return title;
    }
  };

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getErrorIcon()}</Text>
        </View>

        {/* Error Title */}
        <Text style={styles.title}>{getErrorTitle()}</Text>

        {/* Error Message */}
        <Text style={styles.message}>{getErrorMessage()}</Text>

        {/* Error Details (if enabled) */}
        {showDetails && error && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Technical Details:</Text>
            <Text style={styles.detailsText}>{error.message}</Text>
            {error.stack && (
              <Text style={styles.stackText}>{error.stack}</Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {onRetry && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gradients.primaryButton}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {onGoBack && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onGoBack}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          )}

          {onReportError && (
            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={onReportError}
              activeOpacity={0.8}
            >
              <Text style={styles.tertiaryButtonText}>Report Issue</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* DENSE Branding */}
        <View style={styles.brandingContainer}>
          <Text style={styles.brandingText}>DENSE</Text>
          <Text style={styles.brandingSubtext}>Fitness & Nutrition Tracker</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  detailsContainer: {
    backgroundColor: colors.mediumGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    width: '100%',
  },
  detailsTitle: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsText: {
    ...typography.caption,
    color: colors.lighterGray,
    marginBottom: 8,
  },
  stackText: {
    ...typography.caption,
    color: colors.lighterGray,
    fontFamily: 'monospace',
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
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.buttonLarge,
    color: colors.black,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: colors.mediumGray,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  tertiaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  brandingContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  brandingText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  brandingSubtext: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 4,
  },
});

export default ErrorScreen;
