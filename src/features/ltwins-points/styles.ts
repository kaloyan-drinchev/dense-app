import { StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  twinEmoji: {
    fontSize: 80,
  },
  pointsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pointsGradient: {
    padding: 24,
    alignItems: 'center',
  },
  pointsLabel: {
    ...typography.body,
    color: colors.black,
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 64,
    fontFamily: typography.timer.fontFamily,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 4,
  },
  pointsMax: {
    ...typography.body,
    color: colors.black,
    opacity: 0.7,
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.black,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  descriptionCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  descriptionTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 12,
  },
  descriptionText: {
    ...typography.body,
    color: colors.lighterGray,
    marginBottom: 8,
    lineHeight: 22,
  },
  highlight: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  chartCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: colors.mediumGray,
    borderRadius: 12,
    padding: 16,
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  bar: {
    width: 24,
    backgroundColor: colors.primary,
    borderRadius: 4,
    marginTop: 4,
    minHeight: 4,
  },
  barValue: {
    ...typography.caption,
    color: colors.white,
    marginBottom: 4,
    fontSize: 10,
  },
  barLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 8,
    fontSize: 10,
  },
  historyCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  historyTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  historyLeft: {
    flex: 1,
  },
  historyExercise: {
    ...typography.body,
    color: colors.white,
    marginBottom: 4,
  },
  historyDate: {
    ...typography.caption,
    color: colors.lightGray,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyPoints: {
    ...typography.body,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    ...typography.h4,
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  toggleCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    ...typography.body,
    color: colors.white,
    marginBottom: 4,
  },
  toggleDescription: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
});