import { StyleSheet } from "react-native";
import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
  },
  saveButton: {
    ...typography.button,
    color: colors.primary,
  },
  saveButtonDisabled: {
    color: colors.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    ...typography.bodySmall,
    color: colors.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...typography.body,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  numericInput: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...typography.timerSmall,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  bottomPadding: {
    height: 40,
  },

  // Profile Picture Styles
  profilePictureSection: {
    alignItems: "center",
  },
  profilePictureContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.darkGray,
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.darkGray,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.mediumGray,
    borderStyle: "dashed",
  },
  profilePlaceholderText: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 8,
    textAlign: "center",
  },
  changePhotoButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePhotoText: {
    color: colors.black,
    ...typography.bodySmall,
  },

  // Weight Redirect Styles
  weightRedirect: {
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weightRedirectContent: {
    flex: 1,
    marginRight: 12,
  },
  weightRedirectText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 4,
  },
  weightRedirectSubtext: {
    ...typography.caption,
    color: colors.lightGray,
    lineHeight: 18,
  },
});