import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Exercise } from '@/types/workout';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import { formatTime } from '@/utils/helpers';
import { ExerciseDemoModal } from './ExerciseDemoModal';
import { getExerciseThumbnailUrl } from '@/services/video-service';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
  index: number;
  status?: 'pending' | 'in-progress' | 'completed';
  prPotential?: boolean; // Whether this exercise has potential for PRs
  isUpdating?: boolean; // Whether status is currently being updated
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onPress,
  index,
  status = 'pending',
  prPotential = false,
  isUpdating = false,
}) => {
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleDemoPress = () => {
    setShowDemoModal(true);
  };

  const handleCloseModal = () => {
    setShowDemoModal(false);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        exercise.isCompleted && styles.completedContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        {/* Left side - Image */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={handleDemoPress}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: getExerciseThumbnailUrl(exercise.name) }}
            style={styles.exerciseImage}
            contentFit="cover"
          />
          <View style={styles.playOverlay}>
            <Icon name="play" size={14} color={colors.white} />
          </View>
        </TouchableOpacity>

        {/* Right side - Content */}
        <View style={styles.contentContainer}>
          {/* Top section - Exercise info */}
          <View style={styles.topSection}>
            <View style={styles.indexContainer}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{exercise.name}</Text>
              <Text style={styles.subtitle}>{exercise.targetMuscle}</Text>
            </View>
            <View style={styles.badgeContainer}>
              {prPotential && status !== 'completed' && !isUpdating && (
                <View style={styles.prBadge}>
                  <Icon name="zap" size={12} color={colors.black} />
                  <Text style={styles.prText}>PR</Text>
                </View>
              )}
              {isUpdating && (
                <View style={[styles.statusBadge, styles.statusUpdating]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
              {status === 'completed' && !isUpdating && (
                <View style={[styles.statusBadge, styles.statusCompleted]}>
                  <Text style={[styles.statusText, styles.statusTextCompleted]}>
                    Completed
                  </Text>
              </View>
              )}
            </View>
          </View>

          {/* Bottom right - Compact exercise info */}
          <View style={styles.compactInfoContainer}>
            <View style={styles.compactInfoItem}>
              <Text style={styles.compactInfoText}>{exercise.sets} sets</Text>
            </View>
            <Text style={styles.infoDivider}>•</Text>
            <View style={styles.compactInfoItem}>
              <Text style={styles.compactInfoText}>{exercise.reps} reps</Text>
            </View>
            <Text style={styles.infoDivider}>•</Text>
            <View style={styles.compactInfoItem}>
              <Icon name="clock" size={10} color={colors.lighterGray} />
              <Text style={styles.compactInfoText}>{formatTime(exercise.restTime)}</Text>
            </View>
          </View>
        </View>
      </View>

      <ExerciseDemoModal
        visible={showDemoModal}
        onClose={handleCloseModal}
        exercise={{
          name: exercise.name,
          targetMuscle: exercise.targetMuscle,
          imageUrl: getExerciseThumbnailUrl(exercise.name),
          videoUrl: exercise.videoUrl, // Will fall back to placeholder video
          notes: exercise.notes,
        }}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  completedContainer: {
    borderLeftColor: colors.success,
    borderLeftWidth: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.mediumGray,
    position: 'relative',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.white,
  },
  indexContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  indexText: {
    ...typography.caption,
    color: colors.black,
    fontWeight: '700',
    fontSize: 11,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.body,
    color: colors.white,
  },
  subtitle: {
    ...typography.caption,
    color: colors.lighterGray,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.mediumGray,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    textTransform: 'uppercase',
  },
  statusTextCompleted: {
    color: colors.black,
  },
  // Status colors
  statusPending: {
    backgroundColor: colors.mediumGray,
  },
  statusInProgress: {
    backgroundColor: '#a67c00',
  },
  statusCompleted: {
    backgroundColor: colors.success,
  },
  statusUpdating: {
    backgroundColor: colors.darkGray,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  
  // PR Indicator styles
  badgeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  prText: {
    ...typography.caption,
    color: colors.black,
    fontWeight: '700',
    fontSize: 9,
  },
  
  // New compact info styles
  compactInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 6,
  },
  compactInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  compactInfoText: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 11,
  },
  infoDivider: {
    ...typography.caption,
    color: colors.lighterGray,
    fontSize: 10,
  },
});
