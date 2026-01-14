import { StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 8,
  },
  loadingSubtext: {
    ...typography.body,
    color: colors.lightGray,
  },
  programOverview: {
    paddingVertical: 24,
  },
  programDescription: {
    ...typography.body,
    color: colors.lightGray,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderRadius: 8,
    alignSelf: 'center',
  },
  infoButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  infoBullets: {
    marginTop: 20,
    gap: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletDot: {
    ...typography.body,
    color: colors.primary,
    fontSize: 20,
    lineHeight: 20,
    marginTop: 2,
  },
  bulletText: {
    ...typography.body,
    color: colors.lightGray,
    flex: 1,
    lineHeight: 22,
  },
  workoutCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutCardLeft: {
    flex: 1,
    marginRight: 16,
  },
  workoutCardTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 8,
  },
  workoutCardMeta: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginBottom: 4,
  },
  workoutCardCompletion: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  exerciseList: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: 'bold',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...typography.body,
    color: colors.white,
    marginBottom: 4,
  },
  exerciseDetails: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
});