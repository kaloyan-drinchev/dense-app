import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { processLTwinsGuess } from '@/utils/ltwins-game';

interface LTwinsGuessModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseName: string;
  actualSets: number;
  actualReps: number;
  actualWeight: number;
  userId: string;
}

export const LTwinsGuessModal: React.FC<LTwinsGuessModalProps> = ({
  visible,
  onClose,
  exerciseName,
  actualSets,
  actualReps,
  actualWeight,
  userId,
}) => {
  const [guessSets, setGuessSets] = useState('');
  const [guessReps, setGuessReps] = useState('');
  const [guessWeight, setGuessWeight] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'close' | 'wayoff' | null;
    points: number;
    message: string;
  } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetInputs = () => {
    setGuessSets('');
    setGuessReps('');
    setGuessWeight('');
    setFeedback(null);
    setShowAnswer(false);
    setIsProcessing(false);
  };

  // Reset when modal becomes visible or exercise changes
  useEffect(() => {
    if (visible) {
      resetInputs();
    }
  }, [visible, exerciseName, userId, actualSets, actualReps, actualWeight]);

  const handleGuess = async () => {
    if (isProcessing) return;
    
    if (!guessSets || !guessReps || !guessWeight) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    const sets = parseInt(guessSets);
    const reps = parseInt(guessReps);
    const weight = parseFloat(guessWeight);

    if (isNaN(sets) || isNaN(reps) || isNaN(weight)) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsProcessing(true);

    try {
      // Process the guess using the service
      const result = await processLTwinsGuess(userId, exerciseName, {
        sets,
        reps,
        weight,
      });

      // Show answer if correct
      if (result.isCorrect) {
        setShowAnswer(true);
      }

      // Apply haptic feedback
      if (Platform.OS !== 'web') {
        if (result.isCorrect) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (result.feedback.type === 'close') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      // Set feedback
      setFeedback({
        type: result.feedback.type,
        points: result.pointsEarned,
        message: result.feedback.message,
      });

      console.log(`✅ L Twins guess: ${result.pointsEarned} points earned (Total: ${result.totalPoints})`);
    } catch (error) {
      console.error('❌ Failed to process L Twins guess:', error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    resetInputs();
    onClose();
  };

  const getFeedbackColor = () => {
    if (!feedback) return colors.primary;
    switch (feedback.type) {
      case 'correct':
        return colors.primary;
      case 'close':
        return '#FFA500'; // Orange
      case 'wayoff':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <View style={styles.modalView}>
            {/* Twin Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={styles.twinEmoji}>👯‍♂️</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Beat the L Twins!</Text>
            
            {/* Exercise Name */}
            <Text style={styles.exerciseName}>{exerciseName}</Text>
            
            {/* Description */}
            <Text style={styles.description}>
              Guess the L Twins' current stats for this exercise
            </Text>

            {/* Input Fields */}
            {!showAnswer && (
              <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Sets</Text>
                  <TextInput
                    style={styles.input}
                    value={guessSets}
                    onChangeText={setGuessSets}
                    keyboardType="number-pad"
                    placeholder=""
                    placeholderTextColor={colors.lightGray}
                    maxLength={2}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    style={styles.input}
                    value={guessReps}
                    onChangeText={setGuessReps}
                    keyboardType="number-pad"
                    placeholder=""
                    placeholderTextColor={colors.lightGray}
                    maxLength={3}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={guessWeight}
                    onChangeText={setGuessWeight}
                    keyboardType="decimal-pad"
                    placeholder=""
                    placeholderTextColor={colors.lightGray}
                    maxLength={5}
                  />
                </View>
              </View>
            )}

            {/* Show Answer */}
            {showAnswer && (
              <View style={styles.answerContainer}>
                <Text style={styles.answerTitle}>L Twins' Stats:</Text>
                <View style={styles.answerRow}>
                  <Text style={styles.answerLabel}>Sets:</Text>
                  <Text style={styles.answerValue}>{actualSets}</Text>
                </View>
                <View style={styles.answerRow}>
                  <Text style={styles.answerLabel}>Reps:</Text>
                  <Text style={styles.answerValue}>{actualReps}</Text>
                </View>
                <View style={styles.answerRow}>
                  <Text style={styles.answerLabel}>Weight:</Text>
                  <Text style={styles.answerValue}>{actualWeight} kg</Text>
                </View>
              </View>
            )}

            {/* Feedback */}
            {feedback && (
              <View style={[styles.feedbackContainer, { borderColor: getFeedbackColor() }]}>
                <Text style={[styles.feedbackText, { color: getFeedbackColor() }]}>
                  {feedback.message}
                </Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {!showAnswer ? (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.guessButton]}
                    onPress={handleGuess}
                    disabled={isProcessing}
                  >
                    <Text style={styles.guessButtonText}>
                      {isProcessing ? 'Processing...' : 'Submit Guess'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.skipButton]}
                    onPress={handleClose}
                  >
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.guessButton]}
                  onPress={handleClose}
                >
                  <Text style={styles.guessButtonText}>Continue Training 🔥</Text>
                </TouchableOpacity>
              )}
            </View>
              </View>
              
              {/* Close button */}
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Icon name="x" size={24} color={colors.lightGray} />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
  },
  modalView: {
    backgroundColor: colors.darkGray,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.mediumGray,
    borderRadius: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  twinEmoji: {
    fontSize: 48,
  },
  title: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  exerciseName: {
    ...typography.body,
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    ...typography.bodySmall,
    color: colors.lighterGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.mediumGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputLabel: {
    ...typography.body,
    color: colors.white,
    flex: 1,
  },
  input: {
    ...typography.body,
    color: colors.white,
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  answerContainer: {
    width: '100%',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  answerTitle: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  answerLabel: {
    ...typography.body,
    color: colors.lighterGray,
  },
  answerValue: {
    ...typography.body,
    color: colors.white,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    width: '100%',
  },
  feedbackText: {
    ...typography.body,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 48,
  },
  guessButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guessButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: 'bold',
    
  },
  skipButton: {
    backgroundColor: colors.mediumGray,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    ...typography.button,
    color: colors.lightGray,
  },
});

