import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { styles } from "./styles";
import { useProfileEditLogic } from "./logic";

export default function ProfileEditScreen() {
  const {
    profile,
    isSaving,
    pickImage,
    handleSave,
    updateProfile,
    handleWeightRedirect,
    handleBack,
  } = useProfileEditLogic();

  // Helper render functions
  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    keyboardType?: any
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={keyboardType === "numeric" ? styles.numericInput : styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.lightGray}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          >
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Profile Picture */}
        {renderSection(
          "Profile Picture",
          <View style={styles.profilePictureSection}>
            <TouchableOpacity
              style={styles.profilePictureContainer}
              onPress={pickImage}
            >
              {profile.profilePicture &&
              profile.profilePicture !== "placeholder_avatar" ? (
                <Image
                  source={{ uri: profile.profilePicture }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Icon name="camera" size={32} color={colors.lightGray} />
                  <Text style={styles.profilePlaceholderText}>
                    {profile.profilePicture === "placeholder_avatar"
                      ? "Placeholder Set"
                      : "Add Photo"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={pickImage}
            >
              <Text style={styles.changePhotoText}>
                {profile.profilePicture ? "Change Photo" : "Add Photo"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Basic Personal Details */}
        {renderSection(
          "Personal Information",
          <>
            {renderInput(
              "Full Name",
              profile.name,
              (text) => updateProfile("name", text),
              "Enter your full name"
            )}
          </>
        )}

        {/* Physical Measurements */}
        {renderSection(
          "Physical Measurements",
          <>
            {renderInput(
              "Body Fat % (optional)",
              profile.bodyFat,
              (text) => updateProfile("bodyFat", text),
              "15",
              "numeric"
            )}
            <TouchableOpacity
              style={styles.weightRedirect}
              onPress={handleWeightRedirect}
              activeOpacity={0.7}
            >
              <View style={styles.weightRedirectContent}>
                <Text style={styles.weightRedirectText}>
                  💪 Manage your weight tracking
                </Text>
                <Text style={styles.weightRedirectSubtext}>
                  Track current weight, set targets, and monitor progress in the
                  Progress tab
                </Text>
              </View>
              <Icon name="arrow-right" size={20} color={colors.primary} />
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}
