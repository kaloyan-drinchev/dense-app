import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LoadingState } from '@/components/LoadingState';
// import ConnectionTest from '@/components/ConnectionTest';

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile, resetProgress } = useWorkoutStore();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // Reload profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadProfile = async () => {
        if (user?.email) {
          try {
            const { userProfileService } = await import('@/db/services');
            const allProfiles = await userProfileService.getAll();
            const userProfileData = allProfiles.find(p => p.id === user.id);
            
            if (userProfileData) {
              const { updateUserProfile } = useWorkoutStore.getState();
              // Convert database types (null) to app types (undefined)
              const convertedProfile = {
                ...userProfileData,
                email: userProfileData.email ?? undefined,
                weight: userProfileData.weight ?? undefined,
                height: userProfileData.height ?? undefined,
                age: userProfileData.age ?? undefined,
                profilePicture: userProfileData.profilePicture ?? undefined,
                goal: userProfileData.goal ?? undefined,
                createdAt: userProfileData.createdAt ?? undefined,
                updatedAt: userProfileData.updatedAt ?? undefined,
                syncedAt: userProfileData.syncedAt ?? undefined,
              };
              await updateUserProfile(convertedProfile);
            }
          } catch (error) {
            console.log('Failed to reload profile:', error);
          }
        }
      };
      
      loadProfile();
    }, [user?.email])
  );

  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile-edit');
  };

  // 🚨 TESTING ONLY - Remove before production
  const handleResetProgress = () => {
    if (isResetting) return; // Prevent multiple resets
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      'Reset Progress',
      'This will clear all your progress and return you to the setup screen. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              // First reset all progress data
              await resetProgress();
              
              // Then logout to return to biometric setup
              await logout();
              
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }
            } catch (error) {
              console.error('Reset progress error:', error);
              Alert.alert('Error', 'Failed to reset progress. Please try again.');
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your local data will be saved.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logout();
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {isResetting && (
        <View style={styles.loadingOverlay}>
          <LoadingState text="Resetting all data..." />
        </View>
      )}
      <ScrollView
        style={[styles.scrollView, isResetting && styles.disabled]}
        contentContainerStyle={styles.contentContainer}
        scrollEnabled={!isResetting}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          
          {/* Backend Connection Test - Commented out for now */}
          {/* <View style={styles.connectionTestContainer}>
            <ConnectionTest />
          </View> */}
        </View>

        <TouchableOpacity style={styles.profileCard} onPress={handleEditProfile}>
          <View style={styles.profileAvatar}>
            {userProfile?.profilePicture && userProfile.profilePicture !== 'placeholder_avatar' ? (
              <Image 
                source={{ uri: userProfile.profilePicture }} 
                style={styles.profileAvatarImage}
              />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Text style={styles.profileInitial}>
                  {user?.name ? user.name[0].toUpperCase() : userProfile?.name ? userProfile.name[0].toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.name || userProfile?.name || 'Set up your profile'}
            </Text>
            <Text style={styles.profileDetails}>
              {user?.email || (userProfile && userProfile.weight && userProfile.height && userProfile.age)
                ? user?.email || `${userProfile?.weight} kg • ${userProfile?.height} cm • ${userProfile?.age} years`
                : 'Tap to complete your profile'}
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.lightGray} />
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Icon name="bell" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Workout Reminders</Text>
              <Text style={styles.settingDescription}>
                Receive notifications for your workouts
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{
                false: colors.mediumGray,
                true: colors.primaryLight,
              }}
              thumbColor={notifications ? colors.primary : colors.lightGray}
            />
          </View>
        </View>

        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          {/* Sign Out option commented out */}
          {/*
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleLogout}
          >
            <View
              style={[styles.settingIcon, { backgroundColor: colors.primary }]}
            >
              <Icon name="log-out" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Sign Out</Text>
              <Text style={styles.settingDescription}>
                Sign out of your account
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>
          */}

          {/* 🚨 TESTING ONLY - Remove this entire TouchableOpacity before production */}
          <TouchableOpacity
            style={[styles.settingItem, isResetting && styles.disabled]}
            onPress={isResetting ? undefined : handleResetProgress}
            disabled={isResetting}
          >
            <View
              style={[styles.settingIcon, { backgroundColor: colors.error }]}
            >
              <Icon name="trash-2" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Reset Progress</Text>
              <Text style={styles.settingDescription}>
                Clear all data and return to setup screen
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Icon name="info" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>App Version</Text>
              <Text style={styles.settingDescription}>1.0.0</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Icon name="help-circle" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingDescription}>
                Get assistance with the app
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,  // Only left/right padding
    paddingTop: 8,          // Minimal top padding
    paddingBottom: 32,      // Keep bottom unchanged
  },
  header: {
    marginBottom: 24,
  },
  title: {
    ...typography.h1,
    color: colors.white,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 4,
  },
  profileDetails: {
    ...typography.bodySmall,
    color: colors.lighterGray,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
    paddingLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    color: colors.white,
    marginBottom: 4,
  },
  settingDescription: {
    ...typography.bodySmall,
    color: colors.lighterGray,
  },
  connectionTestContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  disabled: {
    opacity: 0.5,
  },
});
