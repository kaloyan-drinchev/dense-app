import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface WorkoutNotStartedModalProps {
  visible: boolean;
  onClose: () => void;
  onStartWorkout: () => void;
}

export const WorkoutNotStartedModal: React.FC<WorkoutNotStartedModalProps> = ({
  visible,
  onClose,
  onStartWorkout
}) => {
  const handleStartPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onStartWorkout();
  };

  const handleClosePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
            colors={['#000000', '#0A0A0A']}
            style={styles.modalContent}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Icon name="alert-circle" size={48} color={colors.warning} />
            </View>

            {/* Content */}
            <Text style={[styles.title, typography.h3]}>
              Workout Not Started
            </Text>
            <Text style={[styles.message, typography.body]}>
              You need to start your workout session before accessing individual exercises.
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartPress}
              >
                <LinearGradient
                  colors={['#00FF88', '#00CC6A']}
                  style={styles.startButtonGradient}
                >
                  <Icon name="play" size={20} color={colors.black} />
                  <Text style={[styles.startButtonText, typography.button]}>
                    Start Workout
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClosePress}
              >
                <Text style={[styles.cancelButtonText, typography.body]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  title: {
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: colors.lighterGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  startButtonText: {
    color: colors.black,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: colors.lightGray,
  },
});
