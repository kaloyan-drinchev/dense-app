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
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  mealTypeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  mealTypeLabel: {
    ...typography.body,
    color: colors.white,
    marginBottom: 12,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    backgroundColor: colors.darkGray,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMealType: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mealTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  mealTypeText: {
    ...typography.bodySmall,
    color: colors.white,
    textAlign: 'center',
  },
  selectedMealTypeText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  recipesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  instructionText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  categoryContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.mediumGray,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    ...typography.h4,
    color: colors.white,
  },
  foodCount: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginLeft: 8,
  },
  foodsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  recipeInfo: {
    flex: 1,
    marginRight: 12,
  },
  recipeName: {
    ...typography.body,
    color: colors.white,
    marginBottom: 4,
  },
  recipeDescription: {
    ...typography.bodySmall,
    color: colors.lightGray,
    lineHeight: 18,
  },
  recipeNutrition: {
    alignItems: 'flex-end',
  },
  caloriesBadge: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  macroInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  macroText: {
    ...typography.caption,
    color: colors.lightGray,
  },
});