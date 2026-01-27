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

  const handleDeleteAccount = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Show the compliance-critical warning modal
    Alert.alert(
      'Delete Account & Reset?',
      'This permanently deletes your profile, stats, and match history.\n\nNOTE: This does NOT cancel your subscription. You must manage subscriptions in your Device Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete & Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) {
                Alert.alert('Error', 'No user found to delete.');
                return;
              }

              // Step 1: Call the database RPC function to delete user profile
              const { supabase } = await import('@/config/supabase');
              const { data, error } = await supabase.rpc('delete_user_profile_by_id', {
                target_user_id: user.id
              });

              if (error) {
                console.error('Failed to delete user profile:', error);
                Alert.alert('Error', 'Failed to delete account. Please try again.');
                return;
              }

              console.log('✅ User profile deleted:', data);

              // Step 2: Clear local storage
              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              await AsyncStorage.clear();
              console.log('✅ Local storage cleared');

              // Step 3: Clear all stores
              const { useTimerStore } = await import('@/store/timer-store');
              useTimerStore.getState().resetTimer();
              
              const { useWorkoutCacheStore } = await import('@/store/workout-cache-store');
              useWorkoutCacheStore.getState().clearCache();
              
              const { useWorkoutStore } = await import('@/store/workout-store');
              useWorkoutStore.getState().clearUserProfile();

              const { useSubscriptionStore } = await import('@/store/subscription-store.js');
              useSubscriptionStore.setState({ 
                subscriptionStatus: null, 
                trialStatus: null, 
                hasCheckedStatus: false,
                isLoading: false,
                error: null
              });

              // Step 4: Reset auth store
              const { useAuthStore } = await import('@/store/auth-store');
              useAuthStore.setState({ 
                user: null,
                hasCompletedWizard: false, 
                isFirstTime: true,
                error: null,
                isLoading: false
              });

              // Step 5: Haptic feedback and redirect
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              // Redirect to onboarding
              router.replace('/');
              
            } catch (error: any) {
              console.error('Error during account deletion:', error);
              Alert.alert('Error', `Failed to delete account: ${error.message || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

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
    handleNotificationsToggle, handleManageSubscription,
    handleResetSubscriptionData, handleSubscriptionPress, handleDeleteAccount
  };
};