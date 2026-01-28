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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
  },
  noDataText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
  },
  preferenceCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.white,
  },
  cardContent: {
    gap: 12,
  },
  motivationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  motivationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  motivationTagEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  motivationTagText: {
    ...typography.caption,
    color: colors.black,
    fontWeight: '600',
  },
  trainingInfoGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  trainingInfoItem: {
    alignItems: 'center',
  },
  trainingInfoNumber: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: 'bold',
  },
  trainingInfoLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 4,
  },
  tdeeCardContent: {
    gap: 16,
  },
  calorieTargetSection: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: colors.dark,
    borderRadius: 12,
  },
  calorieTargetNumber: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 36,
  },
  calorieTargetLabel: {
    ...typography.body,
    color: colors.lightGray,
    marginTop: 4,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
  },
  macroLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 4,
  },
  goalDisplay: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  goalText: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  experienceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  experienceLabel: {
    ...typography.body,
    color: colors.lightGray,
  },
  experienceValue: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  focusSection: {
    gap: 8,
  },
  focusLabel: {
    ...typography.body,
    color: colors.lightGray,
  },
  muscleTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleTag: {
    backgroundColor: colors.dark,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  muscleTagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 4,
  },

  // Big 3 Lifts Styles
  strengthStatsGrid: {
    gap: 12,
  },
  strengthStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark,
    borderRadius: 8,
    padding: 16,
  },
  strengthStatLabel: {
    ...typography.body,
    color: colors.lightGray,
    fontSize: 16,
  },
  strengthStatValue: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '600',
  },
  strengthStatTotal: {
    backgroundColor: colors.darkGray,
    borderWidth: 2,
    borderColor: colors.primary,
    marginTop: 8,
  },
  strengthStatTotalValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
});