import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { useSubscriptionStore } from '@/store/subscription-store.js';
import { wizardResultsService } from '@/db/services';

export const useSettingsLogic = () => {
  const router = useRouter();
  const { userProfile } = useWorkoutStore();
  const { user, logout } = useAuthStore();
  
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

  // --- INITIAL LOAD ---
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

  // --- FOCUS EFFECT (Reload Profile & Wizard) ---
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        if (user?.email) {
          try {
            const { userProfileService, wizardResultsService } = await import('@/db/services');
            const allProfiles = await userProfileService.getAll();
            const userProfileData = allProfiles.find(p => p.id === user.id);
            const wizardData = await wizardResultsService.getByUserId(user.id);
            
            if (userProfileData) {
              const { updateUserProfile } = useWorkoutStore.getState();
              const convertedProfile = {
                ...userProfileData,
                email: userProfileData.email ?? undefined,
                weight: wizardData?.weight ?? undefined,
                height: wizardData?.height ?? undefined,
                age: wizardData?.age ?? userProfileData.age ?? undefined,
                profilePicture: userProfileData.profilePicture ?? undefined,
                goal: wizardData?.goal ?? userProfileData.goal ?? undefined,
                createdAt: userProfileData.createdAt instanceof Date ? userProfileData.createdAt.toISOString() : userProfileData.createdAt ?? undefined,
                updatedAt: userProfileData.updatedAt instanceof Date ? userProfileData.updatedAt.toISOString() : userProfileData.updatedAt ?? undefined,
                syncedAt: userProfileData.syncedAt instanceof Date ? userProfileData.syncedAt.toISOString() : userProfileData.syncedAt ?? undefined,
              };
              await updateUserProfile(convertedProfile);
            }
          } catch (error) {
            console.log('Failed to reload profile:', error);
          }
        }
      };
      
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

  // --- HANDLERS ---

  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleManageSubscription = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (Platform.OS === 'ios') {
        const { Linking } = await import('react-native');
        const url = 'https://apps.apple.com/account/subscriptions';
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
        else Alert.alert('Manage Subscription', 'Go to Settings > [Your Name] > Subscriptions', [{ text: 'OK' }]);
      } else {
        Alert.alert('Manage Subscription', 'Subscription management is available in the app store.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Error opening subscription management:', error);
    }
  };

  const handleStartTrial = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('🧪 Testing: Start 7-Day Trial', 'Start a fresh 7-day trial?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start Trial',
        style: 'default',
        onPress: async () => {
          try {
            const subscriptionModule = await import('@/services/subscription-service');
            const serviceInfo = subscriptionModule.getServiceInfo ? subscriptionModule.getServiceInfo() : null;
            if (serviceInfo && serviceInfo.service !== 'legacy') {
              Alert.alert('⚠️ Not Available', 'Only available in Legacy System.');
              return;
            }
            const legacyModule = await import('@/services/subscription-service-legacy');
            const legacyService = legacyModule.subscriptionService;
            if (legacyService?.clearTrialData) await legacyService.clearTrialData();
            
            let result: any = { success: true, message: 'Trial started!' };
            if (legacyService?.startFreeTrial) result = await legacyService.startFreeTrial();
            
            if (result.success) {
              await refreshSubscriptionStatus();
              triggerNavigationRefresh();
              Alert.alert('✅ Trial Started', result.message);
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to start trial.');
          }
        },
      },
    ]);
  };

  const handleExpireTrial = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('🧪 Testing: Expire Trial', 'Expire trial immediately?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Expire Trial',
        style: 'destructive',
        onPress: async () => {
          try {
            const legacyModule = await import('@/services/subscription-service-legacy');
            const legacyService = legacyModule.subscriptionService;
            let result = { success: true, message: 'Trial expired!' };
            if (legacyService?.expireTrial) result = await legacyService.expireTrial();
            
            if (result.success) {
              await refreshSubscriptionStatus();
              triggerNavigationRefresh();
              Alert.alert('✅ Trial Expired', result.message);
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to expire trial.');
          }
        },
      },
    ]);
  };

  const handleResetSubscriptionData = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('🧪 Testing: Reset All Data', 'Clear ALL subscription data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            await AsyncStorage.removeItem('user_subscription');
            await AsyncStorage.removeItem('user_trial_status');
            await AsyncStorage.removeItem('user_purchases');
            await AsyncStorage.removeItem('subscription_history');
            await AsyncStorage.removeItem('device_id');
            await refreshSubscriptionStatus();
            triggerNavigationRefresh();
            Alert.alert('✅ Reset Complete', 'Data cleared.');
          } catch (error) {
            Alert.alert('Error', 'Failed to reset data.');
          }
        },
      },
    ]);
  };

//   const handleResetApp = async () => {
//     if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//     Alert.alert('🚨 RESET APP', 'Delete ALL data and restart?', [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'DELETE EVERYTHING',
//         style: 'destructive',
//         onPress: async () => {
//           try {
//             if (!user?.id) return;
//             const { userProfileService } = await import('@/db/services');
//             await userProfileService.delete(user.id).catch(e => console.warn('Failed to delete profile:', e));
            
//             const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
//             const keys = ['auth-storage', 'subscription-storage', 'workout-timer-storage', 'workout-storage', 'workout-cache-storage', 'nutrition-storage'];
//             await AsyncStorage.multiRemove(keys);
            
//             const { useTimerStore } = await import('@/store/timer-store');
//             useTimerStore.getState().resetTimer();
//             const { useWorkoutCacheStore } = await import('@/store/workout-cache-store');
//             useWorkoutCacheStore.getState().clearCache();
//             const { useAuthStore } = await import('@/store/auth-store');
//             useAuthStore.setState({ hasCompletedWizard: false, isFirstTime: true });
            
//             logout();
//             if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//             Alert.alert('✅ Reset Complete', 'Restarting app.', [{ text: 'OK', onPress: () => router.replace('/') }]);
//           } catch (error) {
//             Alert.alert('Error', 'Failed to reset app completely.');
//           }
//         },
//       },
//     ]);
//   };

  const handleSubscriptionPress = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const subscriptionInfo = getSubscriptionInfo();
    const daysLeft = getDaysUntilExpiry();
    const trialActive = isTrialActive();
    const trialInfo = getTrialInfo();

    let title = '', message = '';
    if (trialActive || trialInfo.isActive) {
      title = '🆓 Free Trial Active';
      message = `${trialInfo.daysRemaining || trialDaysLeft} days remaining.`;
    } else if (subscriptionInfo.isActive && daysLeft !== null) {
      title = daysLeft > 0 ? '✅ Subscription Active' : '⚠️ Expires Today';
      message = daysLeft > 0 ? `Renews in ${daysLeft} days.` : 'Should auto-renew.';
    } else {
      title = '❌ No Active Subscription';
      message = 'Subscribe to DENSE Pro.';
    }
    Alert.alert(title, message, [{ text: 'Got it' }]);
  };

  return {
    router, user, userProfile, notifications, trialDaysLeft,
    hasActiveSubscription, getSubscriptionInfo, isTrialActive, getTrialInfo, getDaysUntilExpiry,
    handleNotificationsToggle, handleManageSubscription, handleStartTrial, handleExpireTrial,
    handleResetSubscriptionData, handleSubscriptionPress 
    // handleResetApp,
  };
};