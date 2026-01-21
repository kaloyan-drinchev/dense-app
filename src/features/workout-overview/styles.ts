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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120, // Extra space for floating button
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.lightGray,
    fontSize: 18,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  volumeCard: {
    borderColor: colors.secondary,
    borderWidth: 2,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  exerciseVolume: {
    ...typography.body,
    color: colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  exerciseStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  exerciseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseStatText: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 13,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.mediumGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 2,
  },
  homeButton: {
    marginTop: 8,
  },
  homeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  homeButtonText: {
    ...typography.button,
    color: colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  prBanner: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  prBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  prBannerHeaderText: {
    flex: 1,
  },
  prBannerTitle: {
    ...typography.h3,
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prBannerSubtitle: {
    ...typography.body,
    color: colors.lightGray,
    fontSize: 14,
  },
  prList: {
    gap: 12,
  },
  prItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  prItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prExerciseName: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  prType: {
    ...typography.caption,
    color: colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  prItemStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  prValue: {
    ...typography.h3,
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  prImprovement: {
    ...typography.body,
    color: colors.success,
    fontSize: 16,
    fontWeight: '600',
  },
});