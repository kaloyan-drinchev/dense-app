import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { Feather as Icon } from '@expo/vector-icons';

interface WorkoutStartModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  workoutName?: string;
}

export const WorkoutStartModal: React.FC<WorkoutStartModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  workoutName = "Today's Workout"
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[colors.darkGray, colors.dark]}
            style={styles.modalGradient}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Icon name="zap" size={48} color={colors.primary} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Ready to Start?</Text>
            
            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Are you ready to start your workout session?
            </Text>

            {/* Workout Name */}
            <View style={styles.workoutNameContainer}>
              <Text style={styles.workoutName}>{workoutName}</Text>
            </View>

            {/* Motivation Text */}
            <Text style={styles.motivationText}>
              💪 Let's get stronger today!
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>Not Yet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onConfirm}
              >
                <LinearGradient
                  colors={[colors.primary, '#4A90E2']}
                  style={styles.confirmGradient}
                >
                  <Icon name="play" size={18} color={colors.white} />
                  <Text style={styles.confirmButtonText}>Let's Go!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
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
    backgroundColor: 'rgba(58, 81, 153, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  workoutNameContainer: {
    backgroundColor: 'rgba(58, 81, 153, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(58, 81, 153, 0.3)',
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 14,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.mediumGray,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.lightGray,
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});
