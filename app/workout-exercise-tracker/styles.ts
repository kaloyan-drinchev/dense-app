import { StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  fullScreen: {
    flex: 1,
  },
  floatingHeaderBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60, // Extended for status bar/dynamic island
    paddingBottom: 16,
  },
  floatingBackButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  floatingDeleteButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
  },
  deleteButton: {
    marginLeft: 16,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 0,
    paddingBottom: 120, // Extra padding for floating button
  },
  exerciseImageContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
    marginTop: 0,
    marginBottom: -40,
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  imageGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  exerciseContentWrapper: {
    padding: 16,
    paddingTop: 20,
  },
  exerciseHeader: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  targetMuscle: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  targetMuscleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  notesContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  notesTitle: {
    ...typography.body,
    color: colors.white,
    marginBottom: 8,
  },
  notesText: {
    ...typography.body,
    color: colors.lighterGray,
    lineHeight: 24,
  },
  errorWrapper: {
    padding: 16,
    marginTop: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingOverlayContent: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingOverlayText: {
    fontSize: 20,
    color: colors.lightGray,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingDots: {
    color: colors.primary,
  },
});