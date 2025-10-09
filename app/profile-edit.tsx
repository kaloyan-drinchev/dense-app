import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { validateFile, FILE_SECURITY } from '@/utils/file-security';
import { validateProfileData, validateData, VALIDATION_SCHEMAS } from '@/utils/data-validation';

interface ProfileData {
  // Basic Personal Details
  name: string;
  profilePicture: string; // Base64 or URI
  
  // Physical Measurements
  bodyFat: string; // percentage
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { userProfile } = useWorkoutStore();

  const [profile, setProfile] = useState<ProfileData>({
    name: user?.name || userProfile?.name || '',
    profilePicture: userProfile?.profilePicture || '',
    bodyFat: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    try {
      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to allow access to your photo library to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false, // Don't load into memory immediately
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate file security
        const isValidFile = validateFile(asset, {
          maxSize: FILE_SECURITY.MAX_IMAGE_SIZE,
          allowedTypes: FILE_SECURITY.ALLOWED_IMAGE_TYPES,
          isImage: true
        });

        if (!isValidFile) {
          return; // Validation failed, error already shown
        }

        // Convert to base64 for storage
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        updateProfile('profilePicture', `data:image/jpeg;base64,${base64}`);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate profile data
      const validation = validateProfileData(profile);
      
      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.errors.join('\n'));
        return;
      }

      // Use sanitized data if validation passed
      const sanitizedData = validation.sanitized || profile;

      // Update auth store if name changed
      if (sanitizedData.name !== user?.name) {
        const { updateUser } = useAuthStore.getState();
        updateUser({ ...user, name: sanitizedData.name });
      }

      // Save to database using userProfileService
      const { userProfileService } = await import('@/db/services');
      
      // Check if profile exists
      let existingProfile;
      try {
        // Try to find existing profile by email
        const allProfiles = await userProfileService.getAll();
        existingProfile = allProfiles.find(p => p.email === user?.email);
      } catch (error) {
        console.log('No existing profile found');
      }

      const profileData = {
        name: sanitizedData.name,
        email: user?.email, // Keep existing email from auth store
        profilePicture: sanitizedData.profilePicture,
        bodyFat: sanitizedData.bodyFat ? parseFloat(sanitizedData.bodyFat) : undefined,
      };

      if (existingProfile) {
        // Update existing profile
        await userProfileService.update(existingProfile.id, profileData);
      } else {
        // Create new profile
        await userProfileService.create(profileData);
      }

      // Update workout store
      const { updateUserProfile } = useWorkoutStore.getState();
      updateUserProfile({
        ...profileData,
      });

      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = (field: keyof ProfileData, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };







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
        style={keyboardType === 'numeric' ? styles.numericInput : styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.lightGray}
        keyboardType={keyboardType}
      />
    </View>
  );







  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
            {isSaving ? 'Saving...' : 'Save'}
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
        {renderSection('Profile Picture', (
          <View style={styles.profilePictureSection}>
            <TouchableOpacity style={styles.profilePictureContainer} onPress={pickImage}>
              {profile.profilePicture && profile.profilePicture !== 'placeholder_avatar' ? (
                <Image source={{ uri: profile.profilePicture }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Icon name="camera" size={32} color={colors.lightGray} />
                  <Text style={styles.profilePlaceholderText}>
                    {profile.profilePicture === 'placeholder_avatar' ? 'Placeholder Set' : 'Add Photo'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
              <Text style={styles.changePhotoText}>
                {profile.profilePicture ? 'Change Photo' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Basic Personal Details */}
        {renderSection('Personal Information', (
          <>
            {renderInput('Full Name', profile.name, (text) => updateProfile('name', text), 'Enter your full name')}
          </>
        ))}

        {/* Physical Measurements */}
        {renderSection('Physical Measurements', (
          <>
            {renderInput('Body Fat % (optional)', profile.bodyFat, (text) => updateProfile('bodyFat', text), '15', 'numeric')}
            <TouchableOpacity 
              style={styles.weightRedirect}
              onPress={() => router.push('/(tabs)/progress')}
              activeOpacity={0.7}
            >
              <View style={styles.weightRedirectContent}>
                <Text style={styles.weightRedirectText}>💪 Manage your weight tracking</Text>
                <Text style={styles.weightRedirectSubtext}>
                  Track current weight, set targets, and monitor progress in the Progress tab
                </Text>
              </View>
              <Icon name="arrow-right" size={20} color={colors.primary} />
            </TouchableOpacity>
          </>
        ))}



        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  weightRedirect: {
    backgroundColor: colors.darkest,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weightRedirectContent: {
    flex: 1,
    marginRight: 12,
  },
  weightRedirectText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  weightRedirectSubtext: {
    ...typography.caption,
    color: colors.lightGray,
    lineHeight: 18,
  },
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.mediumGray,
    borderStyle: 'dashed',
  },
  profilePlaceholderText: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 8,
    textAlign: 'center',
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
});
