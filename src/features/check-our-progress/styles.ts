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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeDescription: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  videoSection: {
    marginBottom: 24,
  },
  videoContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 16/9,
    position: 'relative',
    marginHorizontal: 20,
    height: 200,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.black,
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    ...typography.body,
    color: colors.white,
    marginTop: 12,
    textAlign: 'center',
  },
});