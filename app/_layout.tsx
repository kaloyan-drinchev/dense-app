import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import {
  Exo2_400Regular,
  Exo2_500Medium,
  Exo2_600SemiBold,
  Exo2_700Bold,
} from "@expo-google-fonts/exo-2";
import { ArchivoBlack_400Regular } from "@expo-google-fonts/archivo-black";
import {
  Saira_400Regular,
  Saira_500Medium,
  Saira_600SemiBold,
  Saira_700Bold,
} from "@expo-google-fonts/saira";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useRef } from "react";
import { Platform, View, Text, ActivityIndicator } from "react-native";

// Database initialization removed - using Supabase now
import { useAuthStore } from "@/store/auth-store";
import { useSubscriptionStore } from "@/store/subscription-store.js";
import { subscriptionService } from "@/services/subscription";
import { notificationService } from "@/services/notification-service";
import { useWorkoutNotification } from "@/hooks/useWorkoutNotification";

import { SetupWizard } from "@/components/SetupWizard";
import { SubscriptionScreen } from "@/components/SubscriptionScreen";
import { SubscriptionReminderModal } from "@/components/SubscriptionReminderModal";

import { AppUpdateManager } from "@/utils/app-updates";
import {
  AppErrorBoundary,
  NavigationErrorBoundary,
} from "@/components/ErrorBoundaries";
import { ActiveWorkoutProvider } from "@/context/ActiveWorkoutContext";

import ErrorBoundary from "./error-boundary";
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
      console.log("✅ Notification permissions granted");

      // Note: Smart notifications are now handled by user settings
      // No automatic scheduling - user must enable in notification settings
      console.log("✅ Notification system ready - user can enable in settings");
    } else {
      console.log("❌ Notification permissions denied");
    }
  } catch (error) {
    console.error("❌ Error setting up notifications:", error);
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
  const { user, isFirstTime } = authStore;

  // Initialize app (Supabase is initialized via config)
  // Use ref to ensure this only runs once on mount
  const hasInitialized = useRef(false);
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const setupApp = async () => {
      try {
        console.log("🔄 Initializing app with Supabase...");

        // Initialize subscription service
        console.log("🔄 Initializing subscription service...");
        const { user } = useAuthStore.getState();
        await subscriptionService.initialize(user?.id);

        // Initialize notifications
        console.log("🔄 Setting up notifications...");
        await setupNotifications();

        // Access functions directly from store to avoid dependency issues
        const { checkUserStatus, checkIfFirstTime } = useAuthStore.getState();

        // Check if user exists and if it's first time
        if (typeof checkUserStatus === "function") {
          await checkUserStatus();
        } else {
          console.error(
            "❌ checkUserStatus is not a function:",
            typeof checkUserStatus
          );
        }

        if (typeof checkIfFirstTime === "function") {
          await checkIfFirstTime();
        } else {
          console.error(
            "❌ checkIfFirstTime is not a function:",
            typeof checkIfFirstTime
          );
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
        console.log("✅ App initialization completed");
      } catch (err) {
        console.error("❌ App initialization error:", err);
        setDbError(
          err instanceof Error ? err : new Error("Unknown initialization error")
        );
      }
    };

    setupApp();
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
    if (dbError) {
      console.error("Database error:", dbError);
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
    hasCheckedStatus,
    getDaysUntilExpiry,
    triggerNavigationRefresh,
  } = useSubscriptionStore();
  const [showWizard, setShowWizard] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDaysLeft, setReminderDaysLeft] = useState(0);
  const [navigationRefresh, setNavigationRefresh] = useState(0);

  // Set up workout notification (shows persistent notification during workouts)
  useWorkoutNotification();

  // Set up navigation refresh function
  useEffect(() => {
    // Override the triggerNavigationRefresh function in the store
    const originalTrigger = triggerNavigationRefresh;
    useSubscriptionStore.setState({
      triggerNavigationRefresh: () => {
        console.log("🚨 NAVIGATION REFRESH TRIGGERED!");
        // Add small delay to prevent navigation timing issues
        setTimeout(() => {
          setNavigationRefresh((prev) => {
            const newValue = prev + 1;
            console.log("🚨 Navigation refresh counter:", prev, "->", newValue);
            return newValue;
          });
        }, 100);
      },
    });

    // Cleanup
    return () => {
      useSubscriptionStore.setState({
        triggerNavigationRefresh: originalTrigger,
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
          // Note: Cancellation checking is now handled through RevenueCat subscription status
          // If you need this feature, you'll need to implement it using RevenueCat's subscription info
          const daysLeft = getDaysUntilExpiry();
          if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7) {
            setReminderDaysLeft(daysLeft);
            setShowReminderModal(true);
            console.log(
              `🟡 Showing reminder for expiring subscription (${daysLeft} days left)`
            );
          }
        } catch (error) {
          console.error("❌ Error checking subscription expiry:", error);
        }
      }
    };

    checkForCancelledSubscription();
  }, [user, isFirstTime, hasCheckedStatus, getDaysUntilExpiry]);

  // Handle reminder modal actions
  const handleReminderRenew = () => {
    setShowReminderModal(false);
    setShowSubscription(true);
    console.log("🔄 User clicked Renew from reminder modal");
  };

  const handleReminderCancel = () => {
    setShowReminderModal(false);
    console.log("⏭️ User dismissed reminder modal");
  };

  // DEBUG: Log navigation state (only when navigation state changes)
  useEffect(() => {
    console.log("🧭 AppNavigator state:", {
      hasUser: !!user,
      hasCompletedWizard,
      isFirstTime,
      hasActiveSubscription: hasActiveSubscription(),
      showWizard,
      showSubscription,
      willShow: showWizard
        ? "WIZARD"
        : showSubscription
        ? "SUBSCRIPTION"
        : "MAIN_APP",
    });
  }, [user, hasCompletedWizard, isFirstTime, showWizard, showSubscription]);

  // Update navigation state when user/first time state changes - CRITICAL: Wait for subscription check
  useEffect(() => {
    const updateNavigationState = async () => {
      // 🔒 SECURITY: Don't make navigation decisions until subscription status is loaded
      if (user && !isFirstTime && !hasCheckedStatus) {
        // Still loading subscription status - don't navigate yet to prevent bypass
        console.log(
          "Waiting for subscription status to load before navigation..."
        );
        return;
      }

      // IMPORTANT: If wizard component is already showing, don't interfere with it
      // This prevents resetting the wizard during program generation or subscription phase
      if (showWizard) {
        console.log(
          "🔍 App Layout: Wizard component is already showing, not interfering"
        );
        return; // Don't interfere with wizard flow (generation, subscription, etc.)
      }

      // CRITICAL: Always check wizard results FIRST before checking subscription status
      // This prevents bypassing subscription screen if wizard isn't completed
      if (user && !isFirstTime) {
        const { checkWizardStatus } = useAuthStore.getState();
        await checkWizardStatus();
        const updatedState = useAuthStore.getState();

        // Check if wizard results exist in database (even if not marked as completed)
        // This handles the case where program is generated but subscription hasn't been handled yet
        const { wizardResultsService } = await import("@/db/services");
        const wizardResults = await wizardResultsService.getByUserId(user.id);

        console.log(
          "🔍 App Layout: Wizard check - hasCompletedWizard:",
          updatedState.hasCompletedWizard,
          "hasWizardResults:",
          !!wizardResults
        );

        // CRITICAL FIX: If wizard results exist but hasCompletedWizard is true,
        // verify that subscription was actually handled by checking subscription status
        if (wizardResults && updatedState.hasCompletedWizard) {
          // Wizard results exist AND flag says completed - verify subscription was handled
          const { hasActiveSubscription } = useSubscriptionStore.getState();
          const subscriptionHandled = hasActiveSubscription();

          // IMPORTANT: Even if trial is active, if wizard results exist but wizard wasn't properly completed
          // (i.e., user reloaded before completing subscription flow), we should show subscription screen
          // The trial might have been auto-started from a previous session
          if (!subscriptionHandled) {
            // Flag says completed but subscription wasn't handled - reset flag
            console.log(
              "🔍 App Layout: Wizard flag says completed but subscription not handled - resetting flag"
            );
            useAuthStore.setState({ hasCompletedWizard: false });
            const resetState = useAuthStore.getState();
            console.log(
              "🔍 App Layout: Flag reset - hasCompletedWizard:",
              resetState.hasCompletedWizard
            );
            console.log("🔍 App Layout: Showing wizard for subscription flow");
            setShowWizard(true);
            setShowSubscription(false);
            return;
          } else {
            // Subscription is handled (trial active or subscription active) - wizard is truly completed
            console.log(
              "🔍 App Layout: Wizard completed and subscription handled - proceeding to home"
            );
          }
        }

        if (wizardResults && !updatedState.hasCompletedWizard) {
          // Wizard results exist but not marked as completed - we're in subscription phase
          // CRITICAL: Don't check subscription status - stay in wizard to show subscription screen
          // Even if user has active trial, they must complete the subscription flow first
          console.log(
            "🔍 App Layout: Wizard results exist but not completed - subscription phase, showing wizard"
          );
          console.log(
            "🔍 App Layout: BLOCKING subscription status check - user must complete subscription flow"
          );
          setShowWizard(true);
          setShowSubscription(false);
          return; // CRITICAL: Return here to prevent subscription status check
        }

        if (!updatedState.hasCompletedWizard && !wizardResults) {
          // No wizard results and not completed - show wizard
          console.log("🔍 App Layout: No wizard results found, showing wizard");
          setShowWizard(true);
          setShowSubscription(false);
          return;
        }
      }

      if (isFirstTime || !user || !hasCompletedWizard) {
        // First time, no user, or hasn't completed wizard - show wizard
        // But only if wizard isn't already showing (to prevent reset during generation)
        if (!showWizard) {
          console.log(
            "🔍 App Layout: Showing wizard - isFirstTime:",
            isFirstTime,
            "hasUser:",
            !!user,
            "hasCompletedWizard:",
            hasCompletedWizard
          );
          setShowWizard(true);
          setShowSubscription(false);
        }
        return;
      }

      // Check subscription status type for navigation decisions
      try {
        // Log detailed subscription status for debugging
        const { logSubscriptionStatus } = useSubscriptionStore.getState();
        const statusDetails = logSubscriptionStatus();
        console.log(
          "🔍 Navigation Debug - Full subscription details:",
          statusDetails
        );

        const rawStatus = await subscriptionService.getUserStatus();
        const hasSubscription = rawStatus.isPro;

        console.log("🔍 Navigation Debug - Has subscription:", hasSubscription);
        console.log("🔍 Navigation Debug - Raw status:", rawStatus);

        // IMPORTANT: If wizard results exist but wizard isn't completed, we're in subscription phase
        // Don't check subscription status yet - let wizard handle the subscription screen
        const { wizardResultsService } = await import("@/db/services");
        const wizardResults = await wizardResultsService.getByUserId(user.id);
        if (wizardResults && !hasCompletedWizard) {
          console.log(
            "🔍 Navigation Debug: Wizard results exist but not completed - staying in wizard for subscription"
          );
          return; // Don't navigate away - wizard will handle subscription
        }

        if (!hasSubscription) {
          // No subscription - show subscription screen
          console.log(`🚫 Access blocked - no active subscription`);
          setShowWizard(false);
          setShowSubscription(true);
        } else {
          // Active subscription - grant access
          console.log(
            `✅ Access granted - active subscription, hiding wizard and subscription`
          );
          setShowWizard(false);
          setShowSubscription(false);
        }
      } catch (error) {
        console.error(
          "❌ Error checking subscription status for navigation:",
          error
        );
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
  }, [
    user,
    hasCompletedWizard,
    isFirstTime,
    hasCheckedStatus,
    shouldBlockAccess,
    navigationRefresh,
  ]);

  // Show loading while checking subscription status to prevent bypass
  if (user && !isFirstTime && !hasCheckedStatus) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.dark,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.white, marginTop: 16, fontSize: 16 }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Show wizard for first-time users or those who haven't completed it
  if (showWizard) {
    return <SetupWizard onClose={() => setShowWizard(false)} />;
  }

  // Show subscription screen if wizard completed but no active subscription
  if (showSubscription) {
    return (
      <SubscriptionScreen
        onSubscribed={async () => {
          console.log("🔄 onSubscribed called - refreshing status");
          // Refresh subscription status when returning from subscription
          await refreshSubscriptionStatus();
          console.log("✅ Status refreshed - closing subscription screen");
          setShowSubscription(false);
          // Trigger navigation refresh to re-evaluate and show main app
          setNavigationRefresh((prev) => prev + 1);
        }}
        showSkipOption={false}
        onCancel={async () => {
          try {
            // For now, just close the subscription screen
            // TODO: Re-implement subscription restoration when needed
            setShowSubscription(false);
          } catch (error) {
            console.error("❌ Failed to close subscription screen:", error);
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
    <ActiveWorkoutProvider>
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: colors.dark,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: colors.dark,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="+not-found/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="error-boundary/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="modal/index"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="program/[id]"
          options={{
            title: "Program Details",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="program/week/[weekId]"
          options={{
            title: "Week Details",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="program/workout/[workoutId]"
          options={{
            title: "Workout",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="program/exercise/[exerciseId]"
          options={{
            title: "Exercise",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="single-program-view/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="single-recipe-view/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="add-food-page/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="nutrition-detail/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="my-goals/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="icloud-backup/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="allowed-foods/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="notification-settings/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ltwins-points/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="nutrition-history/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="finished-workouts/index"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="finished-workouts-detail/index"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="Programs/index"
          options={{
            headerShown: true,
            headerTitle: "Programs",
            animation: "default",
          }}
        />
        <Stack.Screen
          name="workout-exercise-tracker/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="cardio-workout/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="manual-workout/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="check-our-progress/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="photo-effects/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="exercise-history/index"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="ai-chat/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="about-us/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="profile-edit/index"
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
          name="workout-overview/index"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="my-achievements/index"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="profile/index"
          options={{
            title: "Profile",
            presentation: "modal",
          }}
        />
      </Stack>
    </ActiveWorkoutProvider>
  );
}
