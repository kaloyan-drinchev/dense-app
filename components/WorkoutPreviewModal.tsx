import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restTime?: string;
}

interface WorkoutPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onStartWorkout: () => void;
  workoutName?: string;
  exercises?: Exercise[];
  estimatedDuration?: string;
}

export const WorkoutPreviewModal: React.FC<WorkoutPreviewModalProps> = ({
  visible,
  onClose,
  onStartWorkout,
  workoutName = "Today's Workout",
  exercises = [],
  estimatedDuration = "45-60 min"
}) => {
  const handleStartPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onStartWorkout();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#000000', '#0A0A0A']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onClose}
              >
                <Icon name="arrow-left" size={24} color={colors.white} />
              </TouchableOpacity>
              <Text style={[styles.title, typography.h3]}>{workoutName}</Text>
              <View style={styles.duration}>
                <Icon name="clock" size={16} color={colors.primary} />
                <Text style={[styles.durationText, typography.bodySmall]}>
                  {estimatedDuration}
                </Text>
              </View>
            </View>

            {/* Exercises List */}
            <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
              {exercises.map((exercise, index) => (
                <View key={exercise.id} style={styles.exerciseItem}>
                  <View style={styles.exerciseNumber}>
                    <Text style={[styles.exerciseNumberText, typography.bodySmall]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, typography.body]}>
                      {exercise.name}
                    </Text>
                    <Text style={[styles.exerciseDetails, typography.caption]}>
                      {exercise.sets} sets × {exercise.reps}
                      {exercise.restTime && ` • ${exercise.restTime} rest`}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Big Play Button */}
            <View style={styles.playButtonContainer}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={handleStartPress}
              >
                <LinearGradient
                  colors={['#00FF88', '#00CC6A']}
                  style={styles.playButtonGradient}
                >
                  <Icon name="play" size={48} color={colors.black} />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={[styles.playButtonText, typography.h4]}>
                Start Workout
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContainer: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    color: colors.primary,
  },
  exercisesList: {
    flex: 1,
    marginBottom: 24,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exerciseNumberText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.white,
    marginBottom: 4,
  },
  exerciseDetails: {
    color: colors.lighterGray,
  },
  playButtonContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  playButton: {
    marginBottom: 16,
  },
  playButtonGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  playButtonText: {
    color: colors.white,
    textAlign: 'center',
  },
});
