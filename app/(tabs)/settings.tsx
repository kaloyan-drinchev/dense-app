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
import { useSubscriptionStore } from '@/store/subscription-store';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
// import ConnectionTest from '@/components/ConnectionTest';

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile, resetProgress } = useWorkoutStore();
  const { user, logout } = useAuthStore();
  const { 
    hasActiveSubscription, 
    getDaysUntilExpiry, 
    getSubscriptionInfo,
    isTrialActive,
    getTrialDaysRemaining
  } = useSubscriptionStore();
  const [notifications, setNotifications] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(0);


  // Load trial days remaining when screen loads
  useEffect(() => {
    const loadTrialDays = async () => {
      try {
        const days = await getTrialDaysRemaining();
        setTrialDaysLeft(days);
      } catch (error) {
        console.log('Failed to load trial days:', error);
      }
    };
    
    if (isTrialActive()) {
      loadTrialDays();
    }
  }, [getTrialDaysRemaining, isTrialActive]);

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
      
      // Also refresh trial days when screen comes into focus
      const loadTrialDays = async () => {
        try {
          const days = await getTrialDaysRemaining();
          setTrialDaysLeft(days);
        } catch (error) {
          console.log('Failed to load trial days:', error);
        }
      };
      
      loadProfile();
      if (isTrialActive()) {
        loadTrialDays();
      }
    }, [user?.email, getTrialDaysRemaining, isTrialActive])
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

  const handleSubscriptionPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const subscriptionInfo = getSubscriptionInfo();
    const daysLeft = getDaysUntilExpiry();
    const trialActive = isTrialActive();

    let title = '';
    let message = '';

    if (trialActive) {
      title = '🆓 Free Trial Status';
      message = `Your free trial is currently active with ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} remaining.\n\nAfter your trial ends, you'll need to subscribe to continue accessing premium features.`;
    } else if (subscriptionInfo.isActive && daysLeft !== null) {
      if (daysLeft > 0) {
        title = '✅ Subscription Active';
        message = `Your DENSE Pro subscription is active and will renew in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.\n\nPlan: ${subscriptionInfo.planName || 'Pro'}\nExpires: ${subscriptionInfo.expiryDate ? new Date(subscriptionInfo.expiryDate).toLocaleDateString() : 'Unknown'}`;
      } else {
        title = '⚠️ Subscription Expires Today';
        message = `Your DENSE Pro subscription expires today.\n\nIt should automatically renew if you haven't cancelled it in your iOS Settings.`;
      }
    } else {
      title = '❌ No Active Subscription';
      message = `You don't currently have an active subscription.\n\nSubscribe to DENSE Pro to access unlimited AI-generated workouts and premium features.`;
    }

    Alert.alert(title, message, [{ text: 'Got it', style: 'default' }]);
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard} onPress={handleEditProfile}>
          <View style={styles.profileAvatar}>
            {userProfile?.profilePicture ? (
              <Image 
                source={{ uri: userProfile.profilePicture }} 
                style={styles.profileAvatarImage}
              />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Text style={styles.profileInitial}>
                  {user?.name && user.name.length > 0 ? user.name[0].toUpperCase() : 'U'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileDetails}>
              {String(userProfile?.weight || 0)} kg • {String(userProfile?.height || 0)} cm 
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.lightGray} />
        </TouchableOpacity>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
              <Icon name="bell" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Workout reminders and updates
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
              <Icon name="help-circle" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingDescription}>
                Get help and contact support
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/about-us')}>
            <View style={[styles.settingIcon, { backgroundColor: colors.warning }]}>
              <Icon name="info" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>About DENSE</Text>
              <Text style={styles.settingDescription}>
                Version 1.0.0 • Terms & Privacy
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>
        </View>

        {/* Developer & Testing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer & Testing</Text>

          {/* Connection Test Component */}
          {/* <View style={styles.connectionTestContainer}>
            <ConnectionTest />
          </View> */}

          <TouchableOpacity 
            style={[styles.settingItem, isResetting && styles.disabled]} 
            onPress={handleResetProgress}
            disabled={isResetting}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.error }]}>
              <Icon name="trash-2" size={20} color={colors.white} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>🚨 Reset All Progress</Text>
              <Text style={styles.settingDescription}>
                Clear all data and return to setup
              </Text>
            </View>
            {!isResetting && <Icon name="chevron-right" size={20} color={colors.lightGray} />}
          </TouchableOpacity>
        </View>

        {/* Account */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={[styles.settingIcon, { backgroundColor: colors.error }]}>
              <Icon name="log-out" size={20} color={colors.white} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Sign Out</Text>
              <Text style={styles.settingDescription}>
                Sign out of your account
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>
        </View> */}

        {/* Subscription Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleSubscriptionPress}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
              <Icon name="zap" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>DENSE Pro Status</Text>
              <Text style={styles.settingDescription}>
                {(() => {
                  const subscriptionInfo = getSubscriptionInfo();
                  const trialActive = isTrialActive();
                  
                  if (trialActive) {
                    return `Free Trial Active`;
                  } else if (subscriptionInfo.isActive) {
                    return `Subscription Active`;
                  } else {
                    return `No active subscription`;
                  }
                })()}
              </Text>
            </View>
            <View style={styles.subscriptionStatus}>
              {(() => {
                const subscriptionInfo = getSubscriptionInfo();
                const daysLeft = getDaysUntilExpiry();
                const trialActive = isTrialActive();
                
                if (trialActive || (subscriptionInfo.isActive && daysLeft !== null && daysLeft > 0)) {
                  return <Icon name="check-circle" size={20} color={colors.success} />;
                } else {
                  return <Icon name="alert-circle" size={20} color={colors.warning} />;
                }
              })()}
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Loading Overlay */}
      {isResetting && (
        <View style={styles.loadingOverlay}>
          <View style={{ backgroundColor: colors.darkGray, padding: 20, borderRadius: 12 }}>
            <Text style={{ color: colors.white }}>Resetting progress...</Text>
          </View>
        </View>
      )}


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
  subscriptionDetails: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 2,
  },
  subscriptionStatus: {
    justifyContent: 'center',
    alignItems: 'center',
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
  
  // Enhanced Subscription Styles - Spotify Style
  renewalInfoCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  renewalInfoCardExpanded: {
    borderWidth: 1,
    borderColor: colors.primary,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  renewalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  renewalTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 8,
  },
  renewalDate: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 4,
  },
  renewalNote: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  tapHint: {
    ...typography.caption,
    color: colors.lighterGray,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  historySection: {
    marginTop: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.lightGray,
  },
  historyList: {
    paddingTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  historyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyPlan: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '500',
  },
  historyDate: {
    ...typography.caption,
    color: colors.lightGray,
  },

  // Cancellation styles
  cancellationCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  cancellationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cancellationTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.warning,
    marginLeft: 8,
  },
  cancellationDate: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 4,
  },
  cancellationNote: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  reactivateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  reactivateButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: 'bold',
  },
});
