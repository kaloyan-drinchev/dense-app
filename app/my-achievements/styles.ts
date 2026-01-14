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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  overallStatsCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  statValue: {
    ...typography.h2,
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
  },
  bestWorkoutInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  bestWorkoutLabel: {
    ...typography.body,
    color: colors.white,
    fontSize: 14,
  },
  bestWorkoutDate: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
    marginTop: 4,
  },
  prCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  exerciseName: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  prStats: {
    flexDirection: 'row',
    gap: 12,
  },
  prStatItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  prStatLabel: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 11,
    marginBottom: 4,
  },
  prStatValue: {
    ...typography.h3,
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prStatDate: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});