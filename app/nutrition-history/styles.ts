import { StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: { marginRight: 16, padding: 8 },
  headerTitle: { ...typography.h4, color: colors.white, flex: 1 },
  scrollView: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 24 },
  centerBox: { 
    padding: 24, 
    alignItems: 'center',
    marginTop: 60,
  },
  loadingText: { ...typography.body, color: colors.white },
  emptyText: { 
    ...typography.h4, 
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: { 
    ...typography.body, 
    color: colors.lightGray,
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryLeft: { flex: 1 },
  entryCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateTimeContainer: {
    alignItems: 'flex-start',
  },
  entryDate: { 
    ...typography.h4, 
    color: colors.white,
    fontWeight: 'bold',
  },
  entryTime: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginTop: 2,
  },
  entryCountBadge: {
    backgroundColor: colors.mediumGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  entryCountText: {
    ...typography.caption,
    color: colors.lightGray,
    fontWeight: '600',
  },
  nutritionSummary: {
    gap: 8,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calorieText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  macroItems: {
    flexDirection: 'row',
    gap: 16,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroLabel: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
  },
  macroValue: {
    ...typography.bodySmall,
    color: colors.white,
  },
  entryRight: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});