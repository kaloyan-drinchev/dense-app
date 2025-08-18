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

interface WorkoutOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onView: () => void;
  onLetsGo: () => void;
  workoutName?: string;
}

export const WorkoutOptionsModal: React.FC<WorkoutOptionsModalProps> = ({
  visible,
  onClose,
  onView,
  onLetsGo,
  workoutName = "Today's Workout"
}) => {
  const handleOptionPress = (action: () => void) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    action();
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
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Icon name="zap" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.title, typography.h2]}>Ready to Train?</Text>
              <Text style={[styles.subtitle, typography.body]}>
                {workoutName}
              </Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleOptionPress(onLetsGo)}
              >
                <LinearGradient
                  colors={['#00FF88', '#00CC6A']}
                  style={styles.optionGradient}
                >
                  <Icon name="play" size={24} color={colors.black} />
                  <Text style={[styles.optionTitle, typography.h4, { color: colors.black }]}>
                    Let's Go!
                  </Text>
                  <Text style={[styles.optionDescription, typography.bodySmall, { color: colors.black }]}>
                    Start workout immediately
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={[styles.closeText, typography.body]}>Cancel</Text>
            </TouchableOpacity>
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
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  title: {
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.lighterGray,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  optionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    color: colors.white,
    textAlign: 'center',
  },
  optionDescription: {
    color: colors.lighterGray,
    textAlign: 'center',
  },
  closeButton: {
    alignItems: 'center',
    padding: 12,
  },
  closeText: {
    color: colors.lightGray,
  },
});
