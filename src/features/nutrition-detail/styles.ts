import { StyleSheet } from "react-native";
import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";

export const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: { marginRight: 16, padding: 8 },
  headerTitle: { ...typography.h4, color: colors.white, flex: 1 },
  scrollView: { flex: 1 },
  contentContainer: { paddingBottom: 24 },
  centerBox: {
    padding: 24,
    alignItems: "center",
    marginTop: 60,
  },
  loadingText: { ...typography.body, color: colors.white },

  dateHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  dateTitle: {
    ...typography.h3,
    color: colors.white,
    textAlign: "center",
    marginBottom: 8,
  },
  sessionTime: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: "center",
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  statValue: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: "bold",
  },
  statLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.mediumGray,
  },

  mealsContainer: {
    padding: 16,
  },
  mealsTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
  },
  mealContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.mediumGray,
  },
  mealTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mealTitle: {
    ...typography.h4,
    color: colors.white,
  },
  mealSummary: {
    alignItems: "flex-end",
  },
  mealCalories: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "bold",
  },
  mealProtein: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  foodsList: {
    padding: 16,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  foodInfo: {
    flex: 1,
    marginRight: 12,
  },
  foodName: {
    ...typography.body,
    color: colors.white,
    marginBottom: 2,
  },
  foodAmount: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: 2,
  },
  foodTime: {
    ...typography.caption,
    color: colors.lightGray,
  },
  foodNutrition: {
    alignItems: "flex-end",
  },
  foodCalories: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "bold",
    marginBottom: 4,
  },
  foodMacros: {
    flexDirection: "row",
    gap: 6,
  },
  macroText: {
    ...typography.caption,
    color: colors.lightGray,
  },
  noDataContainer: {
    padding: 40,
    alignItems: "center",
  },
  noDataText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: "center",
  },
});