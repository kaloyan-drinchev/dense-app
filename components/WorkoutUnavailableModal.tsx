import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { formatAvailabilityDate } from '@/utils/workout-availability';

interface WorkoutUnavailableModalProps {
  visible: boolean;
  onClose: () => void;
  nextWorkoutName: string | null;
  nextAvailableDate: string | null;
  motivationalMessage: string;
  isCompletedToday: boolean;
}

export const WorkoutUnavailableModal: React.FC<WorkoutUnavailableModalProps> = ({
  visible,
  onClose,
  nextWorkoutName,
  nextAvailableDate,
  motivationalMessage,
  isCompletedToday,
}) => {
  const availabilityText = nextAvailableDate ? formatAvailabilityDate(nextAvailableDate) : 'Soon';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop with tap to close */}
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <BlurView intensity={20} style={styles.blurView}>
          {/* Modal Content */}
          <TouchableOpacity 
            activeOpacity={1}
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <LinearGradient
              colors={['#1A1A1A', '#0F0F0F']}
              style={styles.modalContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Icon name="clock" size={24} color={colors.primary} />
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="x" size={20} color={colors.lightGray} />
                </TouchableOpacity>
              </View>

              {/* Main Content */}
              <View style={styles.content}>
                <Text style={styles.title}>
                  {isCompletedToday ? 'Great Work Today!' : 'Workout Unavailable'}
                </Text>
                
                <Text style={styles.motivationalText}>
                  {motivationalMessage}
                </Text>

                {nextWorkoutName && (
                  <View style={styles.nextWorkoutContainer}>
                    <Text style={styles.nextWorkoutLabel}>Next Workout:</Text>
                    <Text style={styles.nextWorkoutName}>{nextWorkoutName}</Text>
                    <Text style={styles.availabilityText}>
                      Available {availabilityText}
                    </Text>
                  </View>
                )}

                {/* Rest Day Message */}
                <View style={styles.restMessage}>
                  <Icon name="heart" size={16} color={colors.secondary} />
                  <Text style={styles.restText}>
                    Recovery is when your muscles grow stronger!
                  </Text>
                </View>
              </View>

              {/* Footer */}
              <TouchableOpacity onPress={onClose} style={styles.gotItButton}>
                <LinearGradient
                  colors={['#00FF88', '#00CC6A']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Got It! 💪</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    ...typography.h3,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  motivationalText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  nextWorkoutContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  nextWorkoutLabel: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: 4,
    fontWeight: '600',
  },
  nextWorkoutName: {
    ...typography.h4,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  availabilityText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  restMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '20',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  restText: {
    ...typography.bodySmall,
    color: colors.secondary,
    flex: 1,
  },
  gotItButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.body,
    color: colors.black,
    fontWeight: 'bold',
  },
});
