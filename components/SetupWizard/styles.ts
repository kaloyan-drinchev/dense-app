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
    paddingTop: 60,
    paddingBottom: 20,
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
    paddingBottom: 60,
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
    fontSize: 20,
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
    color: colors.black,
    fontWeight: 'bold',
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
    color: colors.black,
    fontWeight: 'bold',
  },
  completeContent: {
    alignItems: 'center',
    paddingVertical: 20,
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
});