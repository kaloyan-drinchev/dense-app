import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { colors } from '@/constants/colors';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface VoiceInputModalProps {
  visible: boolean;
  onClose: () => void;
  onVoiceResult: (text: string) => void;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  visible,
  onClose,
  onVoiceResult,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  // Simulate voice recognition since we can't use actual voice recognition in this environment
  const startListening = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsListening(true);
    setTranscript('');
    setError('');

    // Simulate processing time
    setTimeout(() => {
      setIsListening(false);

      // Simulate a successful voice recognition
      const simulatedFoods = [
        'I had a chicken breast with brown rice',
        'I ate an avocado and two eggs for breakfast',
        'I had a protein shake after my workout',
        'I had a banana and some almonds as a snack',
        'I had grilled salmon with broccoli for dinner',
      ];

      const randomFood =
        simulatedFoods[Math.floor(Math.random() * simulatedFoods.length)];
      setTranscript(randomFood);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 2000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const handleSubmit = () => {
    if (transcript) {
      onVoiceResult(transcript);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="x" size={24} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.title}>Voice Input</Text>
          <Text style={styles.subtitle}>
            Tell me what you ate, and I'll log it for you
          </Text>

          <View style={styles.micContainer}>
            <TouchableOpacity
              style={[styles.micButton, isListening && styles.micButtonActive]}
              onPress={isListening ? stopListening : startListening}
            >
              {isListening ? (
                <ActivityIndicator size="large" color={colors.white} />
              ) : (
                <Icon name="mic" size={32} color={colors.white} />
              )}
            </TouchableOpacity>
            <Text style={styles.micText}>
              {isListening ? 'Listening...' : 'Tap to speak'}
            </Text>
          </View>

          {transcript ? (
            <View style={styles.transcriptContainer}>
              <Text style={styles.transcriptLabel}>I heard:</Text>
              <Text style={styles.transcriptText}>{transcript}</Text>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Use This</Text>
              </TouchableOpacity>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: colors.dark,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.lighterGray,
    marginBottom: 32,
    textAlign: 'center',
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  micButtonActive: {
    backgroundColor: colors.error,
  },
  micText: {
    fontSize: 16,
    color: colors.lighterGray,
  },
  transcriptContainer: {
    width: '100%',
    alignItems: 'center',
  },
  transcriptLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 24,
    backgroundColor: colors.darkGray,
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  submitButton: {
    backgroundColor: colors.success,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  errorContainer: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
});
