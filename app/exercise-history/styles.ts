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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    textTransform: 'capitalize',
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
  },
  
  // PR Cards
  prGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  prCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  prCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prCardTitle: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
  },
  prCardTrend: {
    opacity: 0.7,
  },
  prCardValue: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 4,
  },
  prCardDate: {
    ...typography.caption,
    color: colors.lighterGray,
    fontSize: 10,
  },
  noPRsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noPRsTitle: {
    ...typography.h4,
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  noPRsText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
  },
  
  // Session Cards
  sessionsContainer: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  latestSession: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  latestBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  latestBadgeText: {
    ...typography.caption,
    color: colors.black,
    fontSize: 10,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionStat: {
    alignItems: 'center',
  },
  sessionStatLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginBottom: 4,
  },
  sessionStatValue: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  setsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setChip: {
    backgroundColor: colors.mediumGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  setChipText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 11,
  },
  noHistoryContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noHistoryTitle: {
    ...typography.h4,
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  noHistoryText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
  },
});