import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";

// Logic & Store
import { useAuthStore } from "@/store/auth-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import { subscriptionService } from "@/services/subscription";
import { useWorkoutNotification } from "@/hooks/useWorkoutNotification";
import { useAppInitialization } from "@/hooks/useAppInitialization"; // <--- Your new hook

// Components
import { SetupWizard } from "@/components/SetupWizard";
import { SubscriptionScreen } from "@/components/SubscriptionScreen";
import { SubscriptionReminderModal } from "@/components/SubscriptionReminderModal";
import {
  AppErrorBoundary,
  NavigationErrorBoundary,
} from "@/components/AppErrorBoundaries"; // <--- Error Boundaries
import { ActiveWorkoutProvider } from "@/context/ActiveWorkoutContext";

import { colors } from "@/constants/colors";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 1. Use the hook for all startup logic (Fonts, Auth Check, Notifications, Updates)
  const { isReady, error } = useAppInitialization();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!isReady) {
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
  // --- EXACT BUSINESS LOGIC PRESERVED BELOW ---

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

  // Set up workout notification
  useWorkoutNotification();

  // Set up navigation refresh function
  useEffect(() => {
    const originalTrigger = triggerNavigationRefresh;
    useSubscriptionStore.setState({
      triggerNavigationRefresh: () => {
        console.log("🚨 NAVIGATION REFRESH TRIGGERED!");
        setTimeout(() => {
          setNavigationRefresh((prev) => prev + 1);
        }, 100);
      },
    });

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
          const daysLeft = getDaysUntilExpiry();
          if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7) {
            setReminderDaysLeft(daysLeft);
            setShowReminderModal(true);
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
  };

  const handleReminderCancel = () => {
    setShowReminderModal(false);
  };

  // Update navigation state logic
  useEffect(() => {
    const updateNavigationState = async () => {
      // 🔒 SECURITY: Don't make navigation decisions until subscription status is loaded
      if (user && !isFirstTime && !hasCheckedStatus) {
        return;
      }

      if (showWizard) {
        return;
      }

      if (user && !isFirstTime) {
        const { checkWizardStatus } = useAuthStore.getState();
        await checkWizardStatus();
        const updatedState = useAuthStore.getState();

        // Check if wizard results exist in database
        const { wizardResultsService } = await import("@/db/services");
        const wizardResults = await wizardResultsService.getByUserId(user.id);

        if (wizardResults && updatedState.hasCompletedWizard) {
          const { hasActiveSubscription } = useSubscriptionStore.getState();
          const subscriptionHandled = hasActiveSubscription();

          if (!subscriptionHandled) {
            useAuthStore.setState({ hasCompletedWizard: false });
            setShowWizard(true);
            setShowSubscription(false);
            return;
          }
        }

        if (wizardResults && !updatedState.hasCompletedWizard) {
          setShowWizard(true);
          setShowSubscription(false);
          return;
        }

        if (!updatedState.hasCompletedWizard && !wizardResults) {
          setShowWizard(true);
          setShowSubscription(false);
          return;
        }
      }

      if (isFirstTime || !user || !hasCompletedWizard) {
        if (!showWizard) {
          setShowWizard(true);
          setShowSubscription(false);
        }
        return;
      }

      try {
        const rawStatus = await subscriptionService.getUserStatus();
        const hasSubscription = rawStatus.isPro;

        const { wizardResultsService } = await import("@/db/services");
        const wizardResults = await wizardResultsService.getByUserId(user.id);
        if (wizardResults && !hasCompletedWizard) {
          return;
        }

        if (!hasSubscription) {
          setShowWizard(false);
          setShowSubscription(true);
        } else {
          setShowWizard(false);
          setShowSubscription(false);
        }
      } catch (error) {
        console.error(
          "❌ Error checking subscription status for navigation:",
          error
        );
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

  // --- RENDER LOGIC ---

  // 1. Loading State
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
        <Text style={{ color: colors.white, marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  // 2. Wizard State
  if (showWizard) {
    return <SetupWizard onClose={() => setShowWizard(false)} />;
  }

  // 3. Subscription State
  if (showSubscription) {
    return (
      <SubscriptionScreen
        onSubscribed={async () => {
          await refreshSubscriptionStatus();
          setShowSubscription(false);
          setNavigationRefresh((prev) => prev + 1);
        }}
        showSkipOption={false}
        onCancel={() => setShowSubscription(false)}
      />
    );
  }

  // 4. Main App Navigation (Stack)
  return (
    <>
      <ActiveWorkoutProvider>
        <Stack
          screenOptions={{
            headerBackTitle: "Back",
            headerStyle: { backgroundColor: colors.dark },
            headerTintColor: colors.white,
            headerTitleStyle: { fontWeight: "bold" },
            contentStyle: { backgroundColor: colors.dark },
          }}
        >
          {/* Main Tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
          <Stack.Screen
            name="error-boundary"
            options={{ headerShown: false }}
          />

          {/* Modal */}
          <Stack.Screen
            name="modal"
            options={{ headerShown: false, presentation: "modal" }}
          />

          {/* Dynamic Routes (Keep these as they likely still use [id]) */}
          <Stack.Screen
            name="program/[id]"
            options={{
              title: "Program Details",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="program/week/[weekId]"
            options={{ title: "Week Details", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="program/workout/[workoutId]"
            options={{ title: "Workout", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="program/exercise/[exerciseId]"
            options={{ title: "Exercise", animation: "slide_from_right" }}
          />

          {/* Static Routes - UPDATED NAMES (Removed /index) */}
          <Stack.Screen
            name="single-program-view"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="single-recipe-view"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="add-food-page" options={{ headerShown: false }} />
          <Stack.Screen
            name="nutrition-detail"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="my-goals" options={{ headerShown: false }} />
          <Stack.Screen name="icloud-backup" options={{ headerShown: false }} />
          <Stack.Screen name="allowed-foods" options={{ headerShown: false }} />
          <Stack.Screen
            name="notification-settings"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="ltwins-points" options={{ headerShown: false }} />
          <Stack.Screen
            name="nutrition-history"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="finished-workouts"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="finished-workouts-detail"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />

          <Stack.Screen
            name="Programs"
            options={{ headerTitle: "Programs", animation: "default" }}
          />

          <Stack.Screen
            name="workout-exercise-tracker"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="cardio-workout"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="manual-workout"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="check-our-progress"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="photo-effects" options={{ headerShown: false }} />
          <Stack.Screen
            name="exercise-history"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen name="ai-chat" options={{ headerShown: false }} />
          <Stack.Screen name="about-us" options={{ headerShown: false }} />
          <Stack.Screen name="profile-edit" options={{ headerShown: false }} />

          {/* The new wrapper files */}
          <Stack.Screen
            name="workout-session"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="workout-overview"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="my-achievements"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />

          <Stack.Screen
            name="profile"
            options={{ title: "Profile", presentation: "modal" }}
          />
        </Stack>
      </ActiveWorkoutProvider>

      <SubscriptionReminderModal
        visible={showReminderModal}
        daysRemaining={reminderDaysLeft}
        onRenew={handleReminderRenew}
        onCancel={handleReminderCancel}
      />
    </>
  );
}
