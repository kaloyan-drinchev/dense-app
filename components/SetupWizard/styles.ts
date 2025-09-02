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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50, // Reduced from 60
    paddingBottom: 10, // Reduced from 20
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    textAlign: 'center',
    flex: 1,
  },
  stepCounter: {
    ...typography.body,
    color: colors.lightGray,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30, // Reduced from 60
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.darkGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingProgressContainer: {
    width: '80%',
    marginTop: 30,
  },
  loadingProgressBar: {
    height: 6,
    backgroundColor: colors.darkGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  loadingProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  generatingIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 20,
  },
  generatingDescription: {
    ...typography.large,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepHeaderNoSubtitle: {
    alignItems: 'center',
    marginBottom: 15, // Reduced margin for steps without subtitle
  },
  stepTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    ...typography.large,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 20,
  },
  stepValidationError: {
    ...typography.body,
    color: 'red',
    textAlign: 'center',
    marginTop: 16,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    ...typography.button,
    color: colors.black,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  backButton: {
    backgroundColor: colors.darkGray,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  backButtonText: {
    ...typography.button,
    color: colors.white,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  nextButtonText: {
    ...typography.button,
    color: colors.black,
  },
  placeholderButton: {
    minWidth: 100,
  },
  bottomNavigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  // Program View Styles
  inlineProgram: {
    paddingVertical: 20,
  },
  inlineProgramName: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  inlineProgramDescription: {
    ...typography.bodySmall,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  programStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.timerMedium,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.lightGray,
  },
  workoutCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  workoutName: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 4,
  },
  workoutDuration: {
    ...typography.timerSmall,
    color: colors.lightGray,
    marginBottom: 12,
  },
  exerciseItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  exerciseName: {
    ...typography.bodySmall,
    color: colors.white,
  },
  exerciseDetails: {
    ...typography.caption,
    color: colors.primary,
  },
  finishButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  finishButtonText: {
    ...typography.button,
    color: colors.black,
  },
  // Check Program Button Styles
  checkProgramContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  checkProgramContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  checkProgramEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  checkProgramTitle: {
    ...typography.h1,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  checkProgramSubtitle: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 30,
  },
  checkProgramStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 30,
    width: '100%',
  },
  checkProgramStat: {
    alignItems: 'center',
  },
  checkProgramStatNumber: {
    ...typography.timerMedium,
    color: colors.primary,
  },
  checkProgramStatLabel: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginTop: 4,
  },
  checkProgramButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    marginBottom: 16,
  },
  checkProgramButtonText: {
    ...typography.button,
    color: colors.black,
    marginRight: 8,
  },
  viewLaterButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
  },
  viewLaterButtonText: {
    ...typography.body,
    color: colors.lightGray,
  },
  // Step Content Styles
  welcomeContent: {
    paddingBottom: 40,
  },
  welcomeText: {
    ...typography.large,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 30,
  },
  featureList: {
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },
  featureText: {
    ...typography.bodyLarge,
    color: colors.white,
    marginLeft: 12,
  },
  inputContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    ...typography.body,
    color: colors.white,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.body,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  nameInput: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    ...typography.h4,
    color: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
  },
  optionButton: {
    backgroundColor: colors.darkGray,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionText: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
  },
  selectedOptionText: {
    ...typography.button,
    color: colors.black,
  },
  scheduleContainer: {
    width: '100%',
  },
  daySelectionContainer: {
    marginTop: 30,
  },
  daySelectionTitle: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    backgroundColor: colors.darkGray,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    width: '30%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDay: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabledDay: {
    opacity: 0.5,
  },
  dayText: {
    ...typography.bodySmall,
    color: colors.white,
    textAlign: 'center',
  },
  selectedDayText: {
    ...typography.bodySmall,
    color: colors.black,
    fontWeight: 'bold',
  },
  priorityHint: {
    ...typography.bodySmall,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  priorityButton: {
    backgroundColor: colors.darkGray,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    width: '48%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPriority: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabledPriority: {
    opacity: 0.5,
  },
  priorityText: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
  },
  selectedPriorityText: {
    ...typography.button,
    color: colors.black,
  },
  completeContent: {
    alignItems: 'center',
    paddingVertical: 0, // Minimal padding to prevent layering issues
  },
  completeText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  summaryContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  summaryTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryItem: {
    fontSize: 14,
    color: colors.lightGray,
    marginBottom: 8,
    lineHeight: 20,
  },
  // Enhanced Step 11 "Your Preferences" styles
  completeScrollView: {
    flex: 1,
  },
  preferencesContainer: {
    width: '100%',
    gap: 16,
  },
  preferencesTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  preferenceCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.white,
  },
  cardContent: {
    gap: 12,
  },
  // Motivation tags styles
  motivationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  motivationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  motivationTagEmoji: {
    fontSize: 14,
  },
  motivationTagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  // Training info grid styles
  trainingInfoGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  trainingInfoItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
  },
  trainingInfoNumber: {
    ...typography.timerMedium,
    color: colors.primary,
  },
  trainingInfoLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 4,
  },
  trainingInfoNickname: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 2,
    fontSize: 10, // Keep smaller for nickname
  },
  // Experience row styles
  experienceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  // Focus section styles
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
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  muscleTagText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  // Stats grid styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 0.48,
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    ...typography.timerSmall,
    color: colors.primary,
    fontWeight: 'bold',
  },
  statLabelSmall: {
    fontSize: 11,
    color: colors.lightGray,
    marginTop: 4,
    textAlign: 'center',
  },
  // Goal display styles
  goalDisplay: {
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  goalText: {
    ...typography.h4,
    color: colors.primary,
    textAlign: 'center',
  },
  // TDEE Calculation Card styles
  tdeeCardContent: {
    gap: 20,
  },
  calorieTargetSection: {
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  calorieTargetMain: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
    paddingBottom: 12,
  },
  calorieTargetNumber: {
    ...typography.h1,
    color: colors.primary,
  },
  calorieTargetLabel: {
    ...typography.body,
    color: colors.lightGray,
    marginTop: 4,
  },
  tdeeBreakdown: {
    gap: 8,
  },
  tdeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tdeeLabel: {
    ...typography.caption,
    color: colors.lightGray,
  },
  tdeeValue: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  macroItem: {
    flex: 1,
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  macroIcon: {
    fontSize: 20,
  },
  macroValue: {
    ...typography.timerSmall,
    color: colors.primary,
    fontWeight: 'bold',
  },
  macroLabel: {
    ...typography.caption,
    color: colors.lightGray,
    textAlign: 'center',
    fontSize: 10, // Keep smaller for macro labels
  },
  macroPercentage: {
    ...typography.caption,
    color: colors.primary + '80',
    fontWeight: '600',
    fontSize: 9, // Keep very small for percentages
  },
  tdeeError: {
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  tdeeErrorText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
  },
  // Final step styles
  finalTitle: {
    ...typography.h1,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  finalSubtitle: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  finalCTA: {
    backgroundColor: colors.darkGray, // Little grey background instead of black
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary, // Green border
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
  },
  finalCTAIcon: {
    fontSize: 32,
  },
  finalCTAText: {
    ...typography.button, // Use consistent typography
    color: colors.white, // White text on grey background
    textAlign: 'center',
  },
  // Motivation step styles
  motivationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  motivationEmoji: {
    fontSize: 20,
  },
  // Training days styles
  trainingDaysContainer: {
    gap: 16,
  },
  trainingDayOption: {
    backgroundColor: colors.darkGray,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    padding: 20,
  },
  selectedTrainingDay: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  trainingDayContent: {
    alignItems: 'center',
  },
  trainingDayLabel: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 4,
  },
  selectedTrainingDayLabel: {
    color: colors.black,
  },
  trainingDayNickname: {
    ...typography.body,
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  selectedTrainingDayNickname: {
    ...typography.caption,
    color: colors.black,
    fontWeight: 'bold',
  },
});