import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useAuthStore } from "@/store/auth-store";
import { useWorkoutStore } from "@/store/workout-store";
import { validateFile, FILE_SECURITY } from "@/utils/file-security";
import { validateProfileData } from "@/utils/data-validation";

export interface ProfileData {
  name: string;
  profilePicture: string;
  bodyFat: string;
}

export const useProfileEditLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { userProfile } = useWorkoutStore();

  const [profile, setProfile] = useState<ProfileData>({
    name: user?.name || userProfile?.name || "",
    profilePicture: userProfile?.profilePicture || "",
    bodyFat: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const updateProfile = (field: keyof ProfileData, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "You need to allow access to your photo library to change your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        const isValidFile = validateFile(asset, {
          maxSize: FILE_SECURITY.MAX_IMAGE_SIZE,
          allowedTypes: FILE_SECURITY.ALLOWED_IMAGE_TYPES,
          isImage: true,
        });

        if (!isValidFile) return;

        const base64 = await (FileSystem as any).readAsStringAsync(asset.uri, {
          encoding: (FileSystem as any).EncodingType.Base64,
        });

        updateProfile("profilePicture", `data:image/jpeg;base64,${base64}`);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleSave = async () => {
    // Early return if user is not authenticated
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to update your profile.");
      return;
    }

    setIsSaving(true);
    try {
      const validation = validateProfileData(profile);

      if (!validation.isValid) {
        Alert.alert("Validation Error", validation.errors.join("\n"));
        return;
      }

      const sanitizedData = validation.sanitized || profile;

      if (sanitizedData.name !== user.name) {
        const { updateUser } = useAuthStore.getState();
        updateUser({ ...user, name: sanitizedData.name });
      }

      const { userProfileService } = await import("@/db/services");

      let existingProfile;
      try {
        existingProfile = await userProfileService.getById(user.id);
      } catch (error) {
        console.log("No existing profile found:", error);
      }

      const profileData = {
        name: sanitizedData.name,
        email: user.email,
        profilePicture: sanitizedData.profilePicture,
        bodyFat: sanitizedData.bodyFat ? parseFloat(sanitizedData.bodyFat) : undefined,
      };

      let savedProfile;
      if (existingProfile) {
        savedProfile = await userProfileService.update(user.id, profileData);
        if (!savedProfile) {
          savedProfile = await userProfileService.create({ ...profileData, id: user.id });
        }
      } else {
        savedProfile = await userProfileService.create({ ...profileData, id: user.id });
      }

      if (!savedProfile) {
        throw new Error("Failed to save profile - no data returned");
      }

      const { updateUserProfile } = useWorkoutStore.getState();
      updateUserProfile({ ...profileData });

      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } catch (error) {
      console.error("Failed to save profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleWeightRedirect = () => {
    router.push("/(tabs)/Progress");
  };

  const handleBack = () => {
    router.back();
  };

  return {
    profile,
    isSaving,
    pickImage,
    handleSave,
    updateProfile,
    handleWeightRedirect,
    handleBack
  };
};