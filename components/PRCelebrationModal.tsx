import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, gradients } from '@/constants/colors';
import { typography } from '@/constants/typography';
import type { PersonalRecord } from '@/utils/pr-tracking';

interface PRCelebrationModalProps {
  visible: boolean;
  exerciseName: string;
  prs: PersonalRecord[];
  onClose: () => void;
  onShare?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const PRCelebrationModal: React.FC<PRCelebrationModalProps> = ({
  visible,
  exerciseName,
  prs,
  onClose,
  onShare,
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Confetti animations (simple star bursts)
  const confetti1 = useRef(new Animated.Value(0)).current;
  const confetti2 = useRef(new Animated.Value(0)).current;
  const confetti3 = useRef(new Animated.Value(0)).current;
  const confetti4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Extra celebration haptics
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 200);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 400);
      }

      // Start animations
      Animated.parallel([
        // Main content animation
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        // Trophy rotation
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(rotateAnim, {
            toValue: 0,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
        // Confetti burst animations
        Animated.stagger(100, [
          Animated.timing(confetti1, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(confetti2, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(confetti3, { toValue: 1, duration: 850, useNativeDriver: true }),
          Animated.timing(confetti4, { toValue: 1, duration: 950, useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      rotateAnim.setValue(0);
      confetti1.setValue(0);
      confetti2.setValue(0);
      confetti3.setValue(0);
      confetti4.setValue(0);
    }
  }, [visible]);

  const formatPRText = (pr: PersonalRecord): { main: string; subtitle: string; improvement: string } => {
    switch (pr.type) {
      case 'weight':
        const improvement = pr.previousValue ? `+${(pr.value - pr.previousValue).toFixed(1)}kg` : 'First PR!';
        return {
          main: `${pr.value}kg`,
          subtitle: 'Weight PR',
          improvement,
        };
      case 'reps':
        const repImprovement = pr.previousValue ? `+${pr.value - pr.previousValue} reps` : 'First PR!';
        return {
          main: `${pr.value} reps`,
          subtitle: 'Rep PR',
          improvement: repImprovement,
        };
      case 'volume':
        const volumeImprovement = pr.previousValue ? `+${(pr.value - pr.previousValue).toFixed(0)}kg` : 'First PR!';
        return {
          main: `${pr.value.toFixed(0)}kg`,
          subtitle: 'Volume PR',
          improvement: volumeImprovement,
        };
      case '1rm':
        const rmImprovement = pr.previousValue ? `+${(pr.value - pr.previousValue).toFixed(1)}kg` : 'First PR!';
        return {
          main: `${pr.value.toFixed(1)}kg`,
          subtitle: 'Estimated 1RM',
          improvement: rmImprovement,
        };
      default:
        return { main: '', subtitle: '', improvement: '' };
    }
  };

  const getMotivationalMessage = (): string => {
    const messages = [
      "You're getting stronger! 💪",
      "Absolute beast mode! 🔥",
      "That's what I'm talking about! 🚀",
      "Keep crushing it! ⚡",
      "Unstoppable progress! 💯",
      "You're on fire! 🔥",
      "Next level achieved! 🎯",
      "Strength unlocked! 💪",
      "Making gains! 📈",
      "Champion mindset! 🏆",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getPRIcon = (type: string): string => {
    switch (type) {
      case 'weight': return '🏋️';
      case 'reps': return '🔥';
      case 'volume': return '💪';
      case '1rm': return '👑';
      default: return '🎯';
    }
  };

  // Trophy rotation animation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Confetti positions (simple stars)
  const confettiStyle = (anim: Animated.Value, startX: number, startY: number) => {
    return {
      opacity: anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1, 0],
      }),
      transform: [
        {
          translateX: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, startX],
          }),
        },
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, startY],
          }),
        },
        {
          scale: anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 1.5, 0.5],
          }),
        },
      ],
    } as any; // TypeScript workaround for complex Animated transforms
  };

  if (!visible || prs.length === 0) return null;

  const primaryPR = prs[0];
  const prData = formatPRText(primaryPR);
  const hasMultiplePRs = prs.length > 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti elements - Simple stars */}
        <Animated.View style={[styles.confetti, confettiStyle(confetti1, -100, -150)]}>
          <Text style={styles.confettiText}>✨</Text>
        </Animated.View>
        <Animated.View style={[styles.confetti, confettiStyle(confetti2, 100, -120)]}>
          <Text style={styles.confettiText}>⭐</Text>
        </Animated.View>
        <Animated.View style={[styles.confetti, confettiStyle(confetti3, -80, -180)]}>
          <Text style={styles.confettiText}>💫</Text>
        </Animated.View>
        <Animated.View style={[styles.confetti, confettiStyle(confetti4, 90, -140)]}>
          <Text style={styles.confettiText}>🌟</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#1a1a1a', '#0a0a0a'] as const}
            style={styles.content}
          >
            {/* Glow effect background */}
            <View style={styles.glowContainer}>
              <LinearGradient
                colors={['rgba(0, 255, 136, 0.3)', 'rgba(0, 255, 136, 0)']}
                style={styles.glow}
              />
            </View>

            {/* Trophy Icon with animation */}
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Text style={styles.trophyIcon}>🏆</Text>
            </Animated.View>

            {/* Main Title */}
            <Text style={styles.title}>
              {hasMultiplePRs ? '🔥 MULTIPLE PRS! 🔥' : '🎉 NEW PR! 🎉'}
            </Text>

            {/* Exercise Name */}
            <Text style={styles.exerciseName}>{exerciseName}</Text>

            {/* PR Details */}
            <View style={styles.prContainer}>
              <LinearGradient
                colors={[...gradients.primaryButton] as [string, string, ...string[]]}
                style={styles.prCard}
              >
                <Text style={styles.prIcon}>{getPRIcon(primaryPR.type)}</Text>
                <Text style={styles.prValue}>{prData.main}</Text>
                <Text style={styles.prSubtitle}>{prData.subtitle}</Text>
                
                {/* Improvement badge */}
                <View style={styles.improvementBadge}>
                  <Text style={styles.improvementText}>{prData.improvement}</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Additional PRs if multiple */}
            {hasMultiplePRs && (
              <View style={styles.additionalPRs}>
                <Text style={styles.additionalPRsTitle}>Also achieved:</Text>
                <View style={styles.additionalPRsList}>
                  {prs.slice(1).map((pr, index) => {
                    const data = formatPRText(pr);
                    return (
                      <View key={index} style={styles.additionalPRItem}>
                        <Text style={styles.additionalPRIcon}>{getPRIcon(pr.type)}</Text>
                        <Text style={styles.additionalPRText}>
                          {data.subtitle}: {data.main}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Motivational Message */}
            <Text style={styles.motivationalMessage}>{getMotivationalMessage()}</Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {onShare && (
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    onShare();
                  }}
                  activeOpacity={0.8}
                >
                  <Icon name="share-2" size={20} color={colors.white} />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[...gradients.primaryButton] as [string, string, ...string[]]}
                  style={styles.continueButtonGradient}
                >
                  <Text style={styles.continueButtonText}>Continue Training 🔥</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
  },
  content: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  trophyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  exerciseName: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 24,
    textAlign: 'center',
  },
  prContainer: {
    width: '100%',
    marginBottom: 24,
  },
  prCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  prIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  prValue: {
    fontSize: 56,
    fontFamily: typography.timer.fontFamily,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 4,
  },
  prSubtitle: {
    ...typography.body,
    color: colors.black,
    fontWeight: '600',
    marginBottom: 12,
  },
  improvementBadge: {
    backgroundColor: colors.black,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  improvementText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  additionalPRs: {
    width: '100%',
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  additionalPRsTitle: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginBottom: 12,
    textAlign: 'center',
  },
  additionalPRsList: {
    gap: 8,
  },
  additionalPRItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  additionalPRIcon: {
    fontSize: 24,
  },
  additionalPRText: {
    ...typography.body,
    color: colors.white,
    flex: 1,
  },
  motivationalMessage: {
    ...typography.h5,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.darkGray,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: 'bold',
    fontSize: 18,
  },
  // Confetti styles
  confetti: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2,
    left: SCREEN_WIDTH / 2,
    zIndex: 1,
  },
  confettiText: {
    fontSize: 32,
  },
});

