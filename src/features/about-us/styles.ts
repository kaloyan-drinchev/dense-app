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
    backgroundColor: colors.dark,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    ...typography.h1,
    color: colors.white,
    marginBottom: 8,
  },
  tagline: {
    ...typography.body,
    color: colors.lighterGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
  },
  bodyText: {
    ...typography.body,
    color: colors.lighterGray,
    lineHeight: 24,
    marginBottom: 16,
  },
  teamMember: {
    flexDirection: 'row',
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 4,
  },
  memberNameWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  goldMedalIcon: {
    marginLeft: 8,
  },
  memberRole: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  memberDescription: {
    ...typography.bodySmall,
    color: colors.lighterGray,
    lineHeight: 20,
  },
  valuesList: {
    marginTop: 16,
  },
  valueItem: {
    flexDirection: 'row',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  valueText: {
    flex: 1,
    marginLeft: 12,
    ...typography.bodySmall,
    color: colors.lighterGray,
    lineHeight: 20,
  },
  valueTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  contactContainer: {
    marginTop: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactText: {
    flex: 1,
    marginLeft: 12,
    ...typography.body,
    color: colors.white,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.darkGray,
    marginTop: 20,
  },
  footerText: {
    ...typography.body,
    color: colors.lighterGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerCopyright: {
    ...typography.bodySmall,
    color: colors.lightGray,
    textAlign: 'center',
  },
});