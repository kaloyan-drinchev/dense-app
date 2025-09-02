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
import { subscriptionService } from '@/services/subscription-service';
import { wizardResultsService } from '@/db/services';
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
    getTrialDaysRemaining,
    setSubscriptionEndDate,
    triggerNavigationRefresh,
    refreshSubscriptionStatus
  } = useSubscriptionStore();
  const [notifications, setNotifications] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(0);
  const [wizardData, setWizardData] = useState<any>(null);


  // Load trial days remaining and wizard data when screen loads
  useEffect(() => {
    const loadTrialDays = async () => {
      try {
        const days = await getTrialDaysRemaining();
        setTrialDaysLeft(days);
      } catch (error) {
        console.log('Failed to load trial days:', error);
      }
    };
    
    const loadWizardData = async () => {
      try {
        if (user?.id) {
          const data = await wizardResultsService.getByUserId(user.id);
          setWizardData(data);
        }
      } catch (error) {
        console.log('Failed to load wizard data:', error);
      }
    };
    
    if (isTrialActive()) {
      loadTrialDays();
    }
    
    loadWizardData();
  }, [getTrialDaysRemaining, isTrialActive, user?.id]);

  // Reload profile and wizard data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadProfile = async () => {
        if (user?.email) {
          try {
            const { userProfileService, wizardResultsService } = await import('@/db/services');
            const allProfiles = await userProfileService.getAll();
            const userProfileData = allProfiles.find(p => p.id === user.id);
            
            // Get wizard results for weight and height
            const wizardData = await wizardResultsService.getByUserId(user.id);
            console.log('🔍 Wizard data loaded:', { weight: wizardData?.weight, height: wizardData?.height, age: wizardData?.age, goal: wizardData?.goal });
            
            if (userProfileData) {
              const { updateUserProfile } = useWorkoutStore.getState();
              // Convert database types (null) to app types (undefined)
              // Use weight and height from wizard results instead of profile
              const convertedProfile = {
                ...userProfileData,
                email: userProfileData.email ?? undefined,
                weight: wizardData?.weight ?? undefined, // ✅ Use wizard weight
                height: wizardData?.height ?? undefined, // ✅ Use wizard height
                age: wizardData?.age ?? userProfileData.age ?? undefined, // ✅ Prefer wizard age
                profilePicture: userProfileData.profilePicture ?? undefined,
                goal: wizardData?.goal ?? userProfileData.goal ?? undefined, // ✅ Prefer wizard goal
                createdAt: userProfileData.createdAt ?? undefined,
                updatedAt: userProfileData.updatedAt ?? undefined,
                syncedAt: userProfileData.syncedAt ?? undefined,
              };
              console.log('🔍 Final profile after wizard data merge:', { weight: convertedProfile.weight, height: convertedProfile.height, age: convertedProfile.age, goal: convertedProfile.goal });
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



  const handleMyGoals = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/my-goals');
  };

  // 🚨 TESTING ONLY - Remove before production
  const handleResetProgress = () => {
    if (isResetting) return; // Prevent multiple resets
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      'Reset ALL Progress & Subscriptions',
      'This will clear ALL your data including subscriptions, trial status, wizard progress, and return you to the setup screen. This action cannot be undone.',
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
              console.log('🧹 Starting complete reset...');
              
              // Import AsyncStorage dynamically
              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              
              // Clear subscription/trial data
              await AsyncStorage.removeItem('user_subscription');
              await AsyncStorage.removeItem('user_trial_status');
              await AsyncStorage.removeItem('user_purchases');
              await AsyncStorage.removeItem('subscription_history');
              await AsyncStorage.removeItem('device_id');
              
              // Clear wizard completion
              await AsyncStorage.removeItem('user_wizard_completed');
              await AsyncStorage.removeItem('user_first_time');
              
              // Clear user data  
              await AsyncStorage.removeItem('user_profile');
              await AsyncStorage.removeItem('user_data');
              
              console.log('✅ AsyncStorage cleared');
              
              // Reset workout progress data
              await resetProgress();
              console.log('✅ Workout progress reset');
              
              // Refresh subscription status to reflect cleared state
              await refreshSubscriptionStatus();
              console.log('✅ Subscription status refreshed');
              
              // Then logout to return to biometric setup
              await logout();
              console.log('✅ Logged out - ready for fresh start');
              
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

  const handleSubscriptionPress = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Debug: Check raw subscription status from service
    try {
      const rawStatus = await subscriptionService.getSubscriptionStatus();
      const statusType = await subscriptionService.getSubscriptionStatusType();
      console.log('🔍 Debug - Raw subscription status:', rawStatus);
      console.log('🔍 Debug - Status type:', statusType);
    } catch (error) {
      console.error('🔍 Debug - Error getting status:', error);
    }

    const subscriptionInfo = getSubscriptionInfo();
    const daysLeft = getDaysUntilExpiry();
    const trialActive = isTrialActive();

    console.log('🔍 Debug - Subscription info from store:', subscriptionInfo);
    console.log('🔍 Debug - Days left:', daysLeft);

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

  const handleCancelSubscription = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      '🧪 Testing: Cancel Subscription',
      'This will set your subscription status to cancelled with 3 days remaining. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Set Cancelled',
          style: 'destructive',
          onPress: async () => {
            try {
              // Set subscription end date to 3 days from now
              const success = await setSubscriptionEndDate(3);
              
              if (success) {
                // Force refresh subscription status in store
                await refreshSubscriptionStatus();
                
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                
                // Small delay to ensure store has updated
                setTimeout(() => {
                  // Trigger navigation refresh to update app state
                  triggerNavigationRefresh();
                }, 100);
                
                Alert.alert(
                  '✅ Subscription Cancelled',
                  'Your subscription is now set to cancelled status with 3 days remaining. You should see the reminder message now.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  'Error',
                  'Failed to cancel subscription. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to cancel subscription. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleSetExpired = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      '🧪 Testing: Set Expired',
      'This will immediately expire your subscription. You will be forced to the subscription screen. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Set Expired',
          style: 'destructive',
          onPress: async () => {
            console.log('🚨 SET EXPIRED BUTTON CLICKED!');
            try {
              // Set subscription end date to yesterday (expired)
              console.log('🚨 Step 1: Calling setSubscriptionEndDate(-1)...');
                                      const success = await setSubscriptionEndDate(-1, true); // Disable auto-renewal for testing
              console.log('🚨 Step 1 result:', success);
              
              if (success) {
                // Force refresh subscription status in store
                console.log('🚨 Step 2: Calling refreshSubscriptionStatus...');
                await refreshSubscriptionStatus();
                console.log('🚨 Step 2 completed');
                
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                
                // Small delay to ensure store has updated
                console.log('🚨 Step 3: Waiting 100ms then triggering navigation refresh...');
                setTimeout(() => {
                  // Trigger navigation refresh to immediately redirect to subscription screen
                  console.log('🚨 Step 3: Calling triggerNavigationRefresh...');
                  triggerNavigationRefresh();
                }, 100);
                
                Alert.alert(
                  '✅ Subscription Expired',
                  'Your subscription is now expired. You will be redirected to the subscription screen.',
                  [{ text: 'OK' }]
                );
              } else {
                console.log('🚨 ERROR: setSubscriptionEndDate returned false');
                Alert.alert(
                  'Error',
                  'Failed to expire subscription. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to expire subscription. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
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
              Manage weight tracking in Progress tab
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

          <TouchableOpacity style={styles.settingItem} onPress={handleMyGoals}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
              <Icon name="target" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>My Goals</Text>
              <Text style={styles.settingDescription}>
                View your fitness goals and preferences
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
              <Text style={styles.settingTitle}>🚨 Reset All Progress & Subscriptions</Text>
              <Text style={styles.settingDescription}>
                Clear ALL data (subscriptions, trials, progress) and return to setup
              </Text>
            </View>
            {!isResetting && <Icon name="chevron-right" size={20} color={colors.lightGray} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={handleCancelSubscription}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.warning }]}>
              <Icon name="x-circle" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>🧪 Cancel Subscription</Text>
              <Text style={styles.settingDescription}>
                <Text>Set subscription to cancelled (3 days remaining)</Text>
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={handleSetExpired}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.error }]}>
              <Icon name="clock" size={20} color={colors.white} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>🧪 Set Expired</Text>
              <Text style={styles.settingDescription}>
                <Text>Set subscription to expired (immediate)</Text>
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
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
