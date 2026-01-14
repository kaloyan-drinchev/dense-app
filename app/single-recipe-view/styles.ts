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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: colors.darkGray,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  recipeName: {
    ...typography.h2,
    color: colors.white,
    marginBottom: 8,
  },
  recipeDescription: {
    ...typography.body,
    color: colors.lightGray,
    marginBottom: 16,
    lineHeight: 22,
  },
  recipeMetadata: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '500',
  },
  nutritionCard: {
    backgroundColor: colors.mediumGray,
    padding: 16,
    borderRadius: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  nutritionLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  ingredientText: {
    ...typography.body,
    color: colors.white,
    flex: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    ...typography.bodySmall,
    color: colors.black,
    fontWeight: 'bold',
  },
  instructionText: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    lineHeight: 22,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  tipText: {
    ...typography.body,
    color: colors.lightGray,
    flex: 1,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 100,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.dark,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  addButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    ...typography.h4,
    color: colors.black,
    fontWeight: 'bold',
  },
});