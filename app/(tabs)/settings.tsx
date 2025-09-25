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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { useSubscriptionStore } from '@/store/subscription-store.js';
import * as subscriptionService from '@/services/subscription-service.js';
import { wizardResultsService } from '@/db/services';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LEGAL_URLS, openLegalURL } from '@/constants/legal.js';

// import ConnectionTest from '@/components/ConnectionTest';

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile } = useWorkoutStore();
  const { user, logout, createCloudAccount, backupToCloud, checkCloudStatus } = useAuthStore();
  const { 
    hasActiveSubscription, 
    getDaysUntilExpiry, 
    getSubscriptionInfo,
    isTrialActive,
    getTrialDaysRemaining,
    getTrialInfo,
    setSubscriptionEndDate,
    triggerNavigationRefresh,
    refreshSubscriptionStatus
  } = useSubscriptionStore();
  const [notifications, setNotifications] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(0);
  const [wizardData, setWizardData] = useState<any>(null);
  const [cloudEmail, setCloudEmail] = useState('');
  const [showCloudEmailInput, setShowCloudEmailInput] = useState(false);
  const [isCloudProcessing, setIsCloudProcessing] = useState(false);


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

  const handlePhotoEffects = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/photo-effects');
  };

  const handleManageSubscription = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (Platform.OS === 'ios') {
        // Open Apple's subscription management
        const { Linking } = await import('react-native');
        const url = 'https://apps.apple.com/account/subscriptions';
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert(
            'Manage Subscription',
            'To manage your subscription, go to Settings > [Your Name] > Subscriptions on your device.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Manage Subscription',
          'Subscription management is available in the app store where you purchased the subscription.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening subscription management:', error);
      Alert.alert(
        'Error',
        'Unable to open subscription management. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };




  // 🧪 ENHANCED SUBSCRIPTION TESTING FUNCTIONS

  const handleStartTrial = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      '🧪 Testing: Start 7-Day Trial',
      'This will start a fresh 7-day trial (resets trial state). Perfect for testing the trial experience.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start Trial',
          style: 'default',
          onPress: async () => {
            try {
              // Check if we're using legacy system (developer testing only works with legacy)
              const subscriptionModule = await import('@/services/subscription-service');
              const serviceInfo = subscriptionModule.getServiceInfo ? subscriptionModule.getServiceInfo() : null;
              
              if (serviceInfo && serviceInfo.service !== 'legacy') {
                Alert.alert(
                  '⚠️ Not Available',
                  'Developer testing features are only available when using Legacy System. RevenueCat handles trials automatically.',
                  [{ text: 'OK' }]
                );
                return;
              }
              
              // Import legacy service directly for testing
              const legacyModule = await import('@/services/subscription-service-legacy');
              const legacyService = legacyModule.subscriptionService;
              
              // Clear existing trial data and start fresh
              if (legacyService && legacyService.clearTrialData) {
                await legacyService.clearTrialData();
              }
              
              let result: { success: boolean; message: string; trialEndDate?: string | null } = { success: true, message: 'Trial started successfully!', trialEndDate: null };
              if (legacyService && legacyService.startFreeTrial) {
                result = await legacyService.startFreeTrial();
              }
              
              if (result.success) {
                await refreshSubscriptionStatus();
                triggerNavigationRefresh();
                
                Alert.alert(
                  '✅ Trial Started',
                  `${result.message || 'Free trial started successfully!'}\nTrial ends: ${result.trialEndDate ? new Date(result.trialEndDate).toLocaleDateString() : 'In 7 days'}`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', result.message || 'Failed to start trial', [{ text: 'OK' }]);
              }
            } catch (error) {
              console.error('Start trial error:', error);
              Alert.alert('Error', 'Failed to start trial. Please try again.', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  const handleExpireTrial = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      '🧪 Testing: Expire Trial',
      'This will expire your trial immediately, simulating what happens when the 7-day trial ends. You should be prompted to subscribe.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Expire Trial',
          style: 'destructive',
          onPress: async () => {
            try {
              // Check if we're using legacy system (developer testing only works with legacy)
              const subscriptionModule = await import('@/services/subscription-service');
              const serviceInfo = subscriptionModule.getServiceInfo ? subscriptionModule.getServiceInfo() : null;
              
              if (serviceInfo && serviceInfo.service !== 'legacy') {
                Alert.alert(
                  '⚠️ Not Available',
                  'Developer testing features are only available when using Legacy System. RevenueCat handles subscription status automatically.',
                  [{ text: 'OK' }]
                );
                return;
              }
              
              // Import legacy service directly for testing
              const legacyModule = await import('@/services/subscription-service-legacy');
              const legacyService = legacyModule.subscriptionService;
              
              let result = { success: true, message: 'Trial expired successfully!' };
              if (legacyService && legacyService.expireTrial) {
                result = await legacyService.expireTrial();
              }
              
              if (result.success) {
                await refreshSubscriptionStatus();
                triggerNavigationRefresh();
                
                Alert.alert(
                  '✅ Trial Expired',
                  result.message || 'Your trial has ended. You should now be prompted to subscribe.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', result.message || 'Failed to expire trial', [{ text: 'OK' }]);
              }
            } catch (error) {
              console.error('Expire trial error:', error);
              Alert.alert('Error', 'Failed to expire trial. Please try again.', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  const handleSetSubscriptionDays = async (days: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const dayText = days === 1 ? '1 day' : `${days} days`;
    const warningLevel = days === 1 ? 'critical' : days <= 3 ? 'warning' : 'info';

    Alert.alert(
      `🧪 Testing: ${dayText} remaining`,
      `This will set your subscription to expire in ${dayText}. Perfect for testing ${warningLevel} expiration warnings.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: `Set ${dayText}`,
          style: 'default',
          onPress: async () => {
            try {
              const success = await setSubscriptionEndDate(days);
              
              if (success) {
                await refreshSubscriptionStatus();
                triggerNavigationRefresh();
                
                Alert.alert(
                  '✅ Subscription Updated',
                  `Your subscription now expires in ${dayText}. Check for expiration warnings throughout the app.`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', 'Failed to update subscription. Please try again.', [{ text: 'OK' }]);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update subscription. Please try again.', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  const handleResetSubscriptionData = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      '🧪 Testing: Reset All Data',
      'This will clear ALL subscription and trial data, returning you to a fresh state as if you just installed the app.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // Import AsyncStorage
              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              
              // Clear all subscription-related storage
              await AsyncStorage.removeItem('user_subscription');
              await AsyncStorage.removeItem('user_trial_status');
              await AsyncStorage.removeItem('user_purchases');
              await AsyncStorage.removeItem('subscription_history');
              await AsyncStorage.removeItem('device_id');
              
              // Refresh subscription status to reflect cleared state
              await refreshSubscriptionStatus();
              triggerNavigationRefresh();
              
              Alert.alert(
                '✅ Reset Complete',
                'All subscription and trial data has been cleared. You can now test the full onboarding flow.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to reset data. Please try again.', [{ text: 'OK' }]);
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

    const subscriptionInfo = getSubscriptionInfo();
    const daysLeft = getDaysUntilExpiry();
    const trialActive = isTrialActive();
    const trialInfo = getTrialInfo();

    let title = '';
    let message = '';

    // ALWAYS check trial status first - this takes priority
    if (trialActive || trialInfo.isActive) {
      const daysRemaining = trialInfo.daysRemaining || trialDaysLeft;
      title = '🆓 Free Trial Active';
      message = `Your 7-day free trial is currently active with ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining.\n\n✨ Enjoy all premium features while on trial!\n\nAfter your trial ends, you'll need to subscribe to continue accessing premium features.`;
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

  const handleResetApp = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      '🚨 RESET ENTIRE APP',
      'This will DELETE ALL YOUR DATA and reset the app to the very beginning:\n\n• All workouts & progress\n• All nutrition data\n• Subscription status\n• User profile\n• Wizard responses\n\nYou will go through the welcome screen and 12-step wizard again. This cannot be undone!',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'DELETE EVERYTHING',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚨 RESET APP: Starting complete app reset...');
              
              // Import AsyncStorage
              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              
              // Clear all Zustand stores
              console.log('🚨 RESET APP: Clearing Zustand stores...');
              await AsyncStorage.removeItem('auth-storage');
              await AsyncStorage.removeItem('subscription-storage');
              await AsyncStorage.removeItem('workout-timer-storage');
              await AsyncStorage.removeItem('workout-storage');
              await AsyncStorage.removeItem('nutrition-storage');
              
              // Clear all subscription-related storage
              console.log('🚨 RESET APP: Clearing subscription data...');
              await AsyncStorage.removeItem('user_subscription');
              await AsyncStorage.removeItem('user_trial_status');
              await AsyncStorage.removeItem('user_purchases');
              await AsyncStorage.removeItem('subscription_history');
              await AsyncStorage.removeItem('device_id');
              await AsyncStorage.removeItem('subscription_cancelled');
              
              // Clear Apple IAP storage
              console.log('🚨 RESET APP: Clearing Apple IAP data...');
              await AsyncStorage.removeItem('apple_iap_purchases');
              
              // Clear any other potential storage keys
              console.log('🚨 RESET APP: Clearing additional data...');
              const { 
                wizardResultsService, 
                userProfileService, 
                dailyLogService, 
                customMealService, 
                userProgressService 
              } = await import('@/db/services');
              
              // Clear all database tables (if user exists)
              if (user?.id) {
                try {
                  // Clear wizard results
                  const wizardData = await wizardResultsService.getByUserId(user.id);
                  if (wizardData) {
                    await wizardResultsService.delete(wizardData.id);
                    console.log('✅ Cleared wizard results');
                  }
                } catch (error) {
                  console.log('ℹ️ No wizard results to clear');
                }
                
                try {
                  await userProfileService.delete(user.id);
                  console.log('✅ Cleared user profile');
                } catch (error) {
                  console.log('ℹ️ No user profile to clear');
                }
                
                try {
                  // Clear daily logs (nutrition data)
                  const dailyLogs = await dailyLogService.getByUserId(user.id);
                  for (const log of dailyLogs) {
                    await dailyLogService.delete(log.id);
                  }
                  console.log('✅ Cleared daily logs');
                } catch (error) {
                  console.log('ℹ️ No daily logs to clear');
                }
                
                try {
                  // Clear custom meals
                  const customMeals = await customMealService.getByUserId(user.id);
                  for (const meal of customMeals) {
                    await customMealService.delete(meal.id);
                  }
                  console.log('✅ Cleared custom meals');
                } catch (error) {
                  console.log('ℹ️ No custom meals to clear');
                }
                
                try {
                  // Clear user progress (workout data)
                  const progress = await userProgressService.getByUserId(user.id);
                  if (progress) {
                    await userProgressService.delete(progress.id);
                  }
                  console.log('✅ Cleared user progress');
                } catch (error) {
                  console.log('ℹ️ No user progress to clear');
                }
              }
              
              console.log('🚨 RESET APP: Clearing auth state...');
              
              // Reset auth state to trigger complete restart
              const { checkIfFirstTime, logout } = useAuthStore.getState();
              
              // Logout to clear auth state
              logout();
              
              console.log('✅ RESET APP: Complete! App will restart from welcome screen.');
              
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              
              Alert.alert(
                '✅ App Reset Complete',
                'All data has been deleted. The app will now restart from the very beginning with the welcome screen and wizard.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Force app to restart completely
                      router.replace('/');
                    }
                  }
                ]
              );
              
            } catch (error) {
              console.error('❌ Error resetting app:', error);
              Alert.alert(
                'Error',
                'Failed to reset app completely. Some data may remain. Please try again or restart the app manually.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  // iCloud Backup Handlers
  const handleCreateCloudAccount = async () => {
    if (!cloudEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your iCloud email address to setup backup.');
      return;
    }

    setIsCloudProcessing(true);

    try {
      const result = await createCloudAccount(cloudEmail.trim());
      
      if (result.success) {
        Alert.alert(
          'Backup Setup Complete!',
          'Your workout data has been backed up to iCloud and will sync automatically.',
          [{ text: 'OK', onPress: () => {
            setShowCloudEmailInput(false);
            setCloudEmail('');
            // Refresh cloud status
            checkCloudStatus();
          }}]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to setup iCloud backup.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to setup iCloud backup. Please try again.');
    } finally {
      setIsCloudProcessing(false);
    }
  };

  const handleBackupToCloud = async () => {
    setIsCloudProcessing(true);

    try {
      const result = await backupToCloud();
      
      if (result.success) {
        Alert.alert('Backup Complete!', 'Your workout data has been successfully backed up to iCloud.');
      } else {
        Alert.alert('Backup Failed', result.error || 'Failed to backup data to iCloud.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to backup data. Please try again.');
    } finally {
      setIsCloudProcessing(false);
    }
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
        <TouchableOpacity style={styles.profileCard} onPress={handleEditProfile} activeOpacity={1}>
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
          
          <TouchableOpacity style={styles.settingItem} activeOpacity={1}>
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

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/about-us')} activeOpacity={1}>
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

          <TouchableOpacity style={styles.settingItem} onPress={handleMyGoals} activeOpacity={1}>
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

        {/* Photo Effects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Effects</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handlePhotoEffects} activeOpacity={1}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
              <MaterialIcon name="photo-filter" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Photo Effects</Text>
              <Text style={styles.settingDescription}>
                Download presets to make you look stronger and leaner
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>
        </View>

        {/* Account */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleLogout} activeOpacity={1}>
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
          
          <TouchableOpacity style={styles.settingItem} onPress={handleSubscriptionPress} activeOpacity={1}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
              <Icon name="zap" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>DENSE Pro Status</Text>
              <Text style={styles.settingDescription}>
                {(() => {
                  const subscriptionInfo = getSubscriptionInfo();
                  const daysLeft = getDaysUntilExpiry();
                  const trialActive = isTrialActive();
                  const trialInfo = getTrialInfo();
                  
                  if (trialActive || trialInfo.isActive) {
                    const daysRemaining = trialInfo.daysRemaining || trialDaysLeft;
                    return `Free Trial Active • ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`;
                  } else if (subscriptionInfo.isActive && daysLeft !== null) {
                    if (daysLeft > 0) {
                      const planName = subscriptionInfo.planName || 'Pro';
                      return `${planName} Active • ${daysLeft} day${daysLeft !== 1 ? 's' : ''} until renewal`;
                    } else {
                      return `Subscription expires today`;
                    }
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
                const trialInfo = getTrialInfo();
                
                if (trialActive || trialInfo.isActive || (subscriptionInfo.isActive && daysLeft !== null && daysLeft > 0)) {
                  return <Icon name="check-circle" size={20} color={colors.success} />;
                } else {
                  return <Icon name="alert-circle" size={20} color={colors.warning} />;
                }
              })()}
            </View>
          </TouchableOpacity>

          {/* Manage Subscription Button - Required by Apple */}
          {hasActiveSubscription() && (
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleManageSubscription}
              activeOpacity={1}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
                <Icon name="settings" size={20} color={colors.black} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Manage Subscription</Text>
                <Text style={styles.settingDescription}>
                  Cancel, change plan, or view billing history
                </Text>
              </View>
              <Icon name="external-link" size={20} color={colors.lightGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* iCloud Backup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>iCloud Backup</Text>
          
          {user?.hasCloudAccount ? (
            <>
              {/* iCloud Backup Active */}
              <TouchableOpacity style={styles.settingItem} onPress={() => {}} disabled activeOpacity={1}>
                <View style={[styles.settingIcon, { backgroundColor: colors.success }]}>
                  <Icon name="cloud" size={20} color={colors.white} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Backup Active</Text>
                  <Text style={styles.settingDescription}>
                    {user.email} • Last backup: {user.lastSyncAt ? new Date(user.lastSyncAt).toLocaleDateString() : 'Never'}
                  </Text>
                </View>
                <Icon name="check-circle" size={20} color={colors.success} />
              </TouchableOpacity>

              {/* Manual Backup */}
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={handleBackupToCloud}
                disabled={isCloudProcessing}
                activeOpacity={1}
              >
                <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
                  <Icon name="upload-cloud" size={20} color={colors.black} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Backup Now</Text>
                  <Text style={styles.settingDescription}>
                    Manually backup all your data to iCloud
                  </Text>
                </View>
                {isCloudProcessing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Icon name="chevron-right" size={20} color={colors.lightGray} />
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Setup iCloud Backup */}
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={() => setShowCloudEmailInput(!showCloudEmailInput)}
                activeOpacity={1}
              >
                <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
                  <Icon name="cloud-off" size={20} color={colors.black} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Setup iCloud Backup</Text>
                  <Text style={styles.settingDescription}>
                    Save your workout data to never lose progress
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.lightGray} />
              </TouchableOpacity>

              {/* Email Input (conditionally shown) */}
              {showCloudEmailInput && (
                <View style={styles.emailInputSection}>
                  <TextInput
                    style={styles.emailInput}
                    placeholder="Enter your iCloud email address"
                    placeholderTextColor={colors.lightGray}
                    value={cloudEmail}
                    onChangeText={setCloudEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[styles.createAccountButton, isCloudProcessing && styles.createAccountButtonDisabled]}
                    onPress={handleCreateCloudAccount}
                    disabled={isCloudProcessing}
                    activeOpacity={1}
                  >
                    {isCloudProcessing ? (
                      <ActivityIndicator size="small" color={colors.black} />
                    ) : (
                      <Text style={styles.createAccountButtonText}>Setup Backup</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* Subscription System Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription System</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => {
            // Import the subscription service to get current status
            import('../../services/subscription-service').then((service) => {
              const serviceInfo = service.getServiceInfo ? service.getServiceInfo() : 
                { service: 'legacy', description: 'Legacy System (Development Mode)' };
              
              const isRevenueCat = serviceInfo.service === 'revenuecat';
              
              Alert.alert(
                'Subscription System Status',
                `Currently using: ${serviceInfo.description}\n\n${
                  isRevenueCat 
                    ? 'Your app is using secure server-side subscription validation through RevenueCat.'
                    : 'Your app is in development mode. When you get your Apple Developer account:\n\n1. Set up RevenueCat dashboard\n2. Add API keys to environment\n3. System will automatically upgrade'
                }`,
                [{ text: 'Got it' }]
              );
            }).catch(() => {
              Alert.alert(
                'Subscription System Status',
                'Currently using Legacy System (Development Mode)',
                [{ text: 'Got it' }]
              );
            });
          }} activeOpacity={1}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
              <Icon name="credit-card" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Payment System</Text>
              <Text style={styles.settingDescription}>
                Hybrid System (Auto-detects RevenueCat)
              </Text>
            </View>
            <Icon name="info" size={20} color={colors.lightGray} />
          </TouchableOpacity>
        </View>

        {/* Developer Testing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Testing</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleResetApp} activeOpacity={1}>
            <View style={[styles.settingIcon, { backgroundColor: colors.error }]}>
              <Icon name="trash-2" size={20} color={colors.white} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Reset Entire App</Text>
              <Text style={styles.settingDescription}>
                Delete all data and restart from welcome screen
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleResetSubscriptionData} activeOpacity={1}>
            <View style={[styles.settingIcon, { backgroundColor: colors.warning }]}>
              <Icon name="refresh-cw" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Reset Subscription Data</Text>
              <Text style={styles.settingDescription}>
                Clear subscription & trial data only
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleStartTrial} activeOpacity={1}>
            <View style={[styles.settingIcon, { backgroundColor: colors.success }]}>
              <Icon name="play" size={20} color={colors.white} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Start 7-Day Trial</Text>
              <Text style={styles.settingDescription}>
                Test trial experience from beginning
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleExpireTrial} activeOpacity={1}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
              <Icon name="clock" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Expire Trial</Text>
              <Text style={styles.settingDescription}>
                End trial immediately, trigger subscription prompt
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

  // Cloud Sync Styles
  emailInputSection: {
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 16,
  },
  emailInput: {
    backgroundColor: colors.darkGray,
    borderColor: colors.lightGray,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.white,
  },
  createAccountButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  createAccountButtonDisabled: {
    opacity: 0.6,
  },
  createAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
});
