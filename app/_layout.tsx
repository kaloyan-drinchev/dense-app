import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { 
  Exo2_400Regular,
  Exo2_500Medium,
  Exo2_600SemiBold,
  Exo2_700Bold 
} from '@expo-google-fonts/exo-2';
import { 
  ArchivoBlack_400Regular 
} from '@expo-google-fonts/archivo-black';
import {
  Saira_400Regular,
  Saira_500Medium,
  Saira_600SemiBold,
  Saira_700Bold
} from '@expo-google-fonts/saira';
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform, View, Text, ActivityIndicator } from "react-native";


import { initializeDatabase } from "@/db/migrations";
import { useAuthStore } from "@/store/auth-store";
import { useSubscriptionStore } from "@/store/subscription-store.js";
import subscriptionService from "@/services/subscription-service.js";
import { notificationService } from "@/services/notification-service";


import { SetupWizard } from "@/components/SetupWizard";
import { SubscriptionScreen } from "@/components/SubscriptionScreen";
import { SubscriptionReminderModal } from "@/components/SubscriptionReminderModal";

import { AppUpdateManager } from "@/utils/app-updates";
import { AppErrorBoundary, NavigationErrorBoundary } from "@/components/ErrorBoundaries";

import { ErrorBoundary } from "./error-boundary";
import { colors } from "@/constants/colors";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Setup notifications
const setupNotifications = async () => {
  try {
    // Request notification permissions
    const hasPermission = await notificationService.requestPermissions();
    if (hasPermission) {
      console.log('✅ Notification permissions granted');
      
      // Note: Smart notifications are now handled by user settings
      // No automatic scheduling - user must enable in notification settings
      console.log('✅ Notification system ready - user can enable in settings');
    } else {
      console.log('❌ Notification permissions denied');
    }
  } catch (error) {
    console.error('❌ Error setting up notifications:', error);
  }
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    Exo2_400Regular,
    Exo2_500Medium,
    Exo2_600SemiBold,
    Exo2_700Bold,
    ArchivoBlack_400Regular,
    Saira_400Regular,
    Saira_500Medium,
    Saira_600SemiBold,
    Saira_700Bold,
  });
  
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);
  const authStore = useAuthStore();
  
  // Debug: Check what functions are available
  console.log('🔍 Auth store functions:', Object.keys(authStore));
  
  const { user, isFirstTime, checkUserStatus, checkIfFirstTime } = authStore;

  // Initialize database and check auth status on app startup
  useEffect(() => {
    const setupApp = async () => {
      try {
        console.log('🔄 Initializing local database...');
        const success = await initializeDatabase();
        if (success) {
          console.log('✅ Database initialization completed');
          
          // Initialize subscription service
          console.log('🔄 Initializing subscription service...');
          await subscriptionService.initialize();
          
          // Initialize notifications
          console.log('🔄 Setting up notifications...');
          await setupNotifications();
          
          // Check if user exists and if it's first time
          if (typeof checkUserStatus === 'function') {
            await checkUserStatus();
          } else {
            console.error('❌ checkUserStatus is not a function:', typeof checkUserStatus);
          }
          
          if (typeof checkIfFirstTime === 'function') {
            await checkIfFirstTime();
          } else {
            console.error('❌ checkIfFirstTime is not a function:', typeof checkIfFirstTime);
          }
          
          // Check for app updates and show what's new
          const wasUpdated = await AppUpdateManager.checkForAppUpdate();
          if (wasUpdated) {
            // Show update notification after a short delay
            setTimeout(() => {
              AppUpdateManager.showUpdateNotification();
            }, 2000);
          }
          
          setDbInitialized(true);
        } else {
          throw new Error('Database initialization failed');
        }
      } catch (err) {
        console.error('❌ Database initialization error:', err);
        setDbError(err instanceof Error ? err : new Error('Unknown database error'));
      }
    };

    setupApp();
  }, [checkUserStatus]);

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
  }, [error, dbError]);

  useEffect(() => {
    if (loaded && dbInitialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbInitialized]);

  if (!loaded || !dbInitialized) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <NavigationErrorBoundary>
        <AppNavigator />
      </NavigationErrorBoundary>
    </AppErrorBoundary>
  );
}

function AppNavigator() {
  const { user, hasCompletedWizard, isFirstTime } = useAuthStore();
  const { 
    hasActiveSubscription, 
    checkSubscriptionStatus, 
    refreshSubscriptionStatus, 
    shouldBlockAccess,
    isLoading: isSubscriptionLoading,
    hasCheckedStatus,
    getDaysUntilExpiry,
    triggerNavigationRefresh
  } = useSubscriptionStore();
  const [showWizard, setShowWizard] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDaysLeft, setReminderDaysLeft] = useState(0);
  const [navigationRefresh, setNavigationRefresh] = useState(0);


  // Set up navigation refresh function
  useEffect(() => {
    // Override the triggerNavigationRefresh function in the store
    const originalTrigger = triggerNavigationRefresh;
          useSubscriptionStore.setState({
        triggerNavigationRefresh: () => {
          console.log('🚨 NAVIGATION REFRESH TRIGGERED!');
          // Add small delay to prevent navigation timing issues
          setTimeout(() => {
            setNavigationRefresh(prev => {
              const newValue = prev + 1;
              console.log('🚨 Navigation refresh counter:', prev, '->', newValue);
              return newValue;
            });
          }, 100);
        }
      });

    // Cleanup
    return () => {
      useSubscriptionStore.setState({
        triggerNavigationRefresh: originalTrigger
      });
    };
  }, []);

  // Check subscription status when user exists
  useEffect(() => {
    if (user && !isFirstTime) {
      checkSubscriptionStatus();
    }
  }, [user, isFirstTime, checkSubscriptionStatus]);

  // Check for cancelled subscription and show reminder modal
  useEffect(() => {
    const checkForCancelledSubscription = async () => {
      if (user && !isFirstTime && hasCheckedStatus) {
        try {
          const isCancelled = await subscriptionService.isSubscriptionCancelled();
          
          if (isCancelled) {
            const daysLeft = getDaysUntilExpiry();
            if (daysLeft !== null && daysLeft >= 0) {
              setReminderDaysLeft(daysLeft);
              setShowReminderModal(true);
              console.log(`🟡 Showing reminder for cancelled subscription (${daysLeft} days left)`);
            }
          }
        } catch (error) {
          console.error('❌ Error checking cancelled subscription:', error);
        }
      }
    };

    checkForCancelledSubscription();
  }, [user, isFirstTime, hasCheckedStatus, getDaysUntilExpiry]);

  // Handle reminder modal actions
  const handleReminderRenew = () => {
    setShowReminderModal(false);
    setShowSubscription(true);
    console.log('🔄 User clicked Renew from reminder modal');
  };

  const handleReminderCancel = () => {
    setShowReminderModal(false);
    console.log('⏭️ User dismissed reminder modal');
  };



  // DEBUG: Log navigation state (only when navigation state changes)
  useEffect(() => {
    console.log('🧭 AppNavigator state:', {
      hasUser: !!user,
      hasCompletedWizard,
      isFirstTime,
      hasActiveSubscription: hasActiveSubscription(),
      showWizard,
      showSubscription,
      willShow: showWizard ? 'WIZARD' : showSubscription ? 'SUBSCRIPTION' : 'MAIN_APP'
    });
  }, [user, hasCompletedWizard, isFirstTime, showWizard, showSubscription]);

  // Update navigation state when user/first time state changes - CRITICAL: Wait for subscription check
  useEffect(() => {
    const updateNavigationState = async () => {
      // 🔒 SECURITY: Don't make navigation decisions until subscription status is loaded
      if (user && !isFirstTime && !hasCheckedStatus) {
        // Still loading subscription status - don't navigate yet to prevent bypass
        console.log('Waiting for subscription status to load before navigation...');
        return;
      }

      if (isFirstTime || !user || !hasCompletedWizard) {
        // First time, no user, or hasn't completed wizard - show wizard
        console.log('🔍 App Layout: Showing wizard - isFirstTime:', isFirstTime, 'hasUser:', !!user, 'hasCompletedWizard:', hasCompletedWizard);
        setShowWizard(true);
        setShowSubscription(false);
        return;
      }

      // Check subscription status type for navigation decisions
      try {
        const statusType = await subscriptionService.getSubscriptionStatusType();
        const rawStatus = await subscriptionService.getSubscriptionStatus();
        
        console.log('🔍 Navigation Debug - Status type:', statusType);
        console.log('🔍 Navigation Debug - Raw status:', rawStatus);
        
        if (statusType === 'subscription_expired' || statusType === 'no_subscription') {
          // Force expired or no subscription users to subscription screen
          console.log(`🚫 Access blocked - user status: ${statusType}`);
          setShowWizard(false);
          setShowSubscription(true);
        } else {
          // Active or cancelled users get main app access
          // (cancelled users will also see reminder modal separately)
          console.log(`✅ Access granted - user status: ${statusType}, hiding wizard and subscription`);
          setShowWizard(false);
          setShowSubscription(false);
        }
      } catch (error) {
        console.error('❌ Error checking subscription status for navigation:', error);
        // Fallback to old logic if error
        if (shouldBlockAccess()) {
          setShowWizard(false);
          setShowSubscription(true);
        } else {
          setShowWizard(false);
          setShowSubscription(false);
        }
      }
    };

    updateNavigationState();
  }, [user, hasCompletedWizard, isFirstTime, hasCheckedStatus, shouldBlockAccess, navigationRefresh]);

  // Show loading while checking subscription status to prevent bypass
  if (user && !isFirstTime && !hasCheckedStatus) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.dark }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.white, marginTop: 16, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  // Show wizard for first-time users or those who haven't completed it
  if (showWizard) {
    return (
      <SetupWizard 
        onClose={() => setShowWizard(false)}
      />
    );
  }

  // Show subscription screen if wizard completed but no active subscription
  if (showSubscription) {
    return (
      <SubscriptionScreen
        onSubscribed={async () => {
          // Refresh subscription status when returning from subscription
          await refreshSubscriptionStatus();
          setShowSubscription(false);
        }}
        showSkipOption={false}
        onCancel={async () => {
          try {
            // For now, just close the subscription screen
            // TODO: Re-implement subscription restoration when needed
            setShowSubscription(false);
          } catch (error) {
            console.error('❌ Failed to close subscription screen:', error);
            setShowSubscription(false);
          }
        }}
      />
    );
  }

  // Show main app if user exists, completed wizard, and has subscription
  return (
    <>
      <RootLayoutNav />
      
      {/* Subscription Reminder Modal */}
      <SubscriptionReminderModal
        visible={showReminderModal}
        daysRemaining={reminderDaysLeft}
        onRenew={handleReminderRenew}
        onCancel={handleReminderCancel}
      />
    </>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: colors.dark,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: colors.dark,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="program/[id]" 
        options={{ 
          title: "Program Details",
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="program/week/[weekId]" 
        options={{ 
          title: "Week Details",
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="program/workout/[workoutId]" 
        options={{ 
          title: "Workout",
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="program/exercise/[exerciseId]" 
        options={{ 
          title: "Exercise",
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="single-program-view" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="single-recipe-view" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="add-food-page" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="nutrition-detail" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="my-goals" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="icloud-backup" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="allowed-foods" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="notification-settings" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="nutrition-history" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="finished-workouts" 
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="finished-workouts-detail" 
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="workout-exercise-tracker" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="check-our-progress" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="photo-effects" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="exercise-history" 
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="ai-chat" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="about-us" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="profile-edit" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="workout-session" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          title: "Profile",
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}