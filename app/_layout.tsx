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
import { Platform } from "react-native";

import { initializeDatabase } from "@/db/migrations";
import { useAuthStore } from "@/store/auth-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import { AuthScreen } from "@/components/AuthScreen";
import { BiometricSetupScreen } from "@/components/BiometricSetupScreen";
import { SetupWizard } from "@/components/SetupWizard";
import { SubscriptionScreen } from "@/components/SubscriptionScreen";
import { AppUpdateManager } from "@/utils/app-updates";

import { ErrorBoundary } from "./error-boundary";
import { colors } from "@/constants/colors";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
  const { isAuthenticated, isFirstTime, checkAuthStatus, checkIfFirstTime } = useAuthStore();

  // Initialize database and check auth status on app startup
  useEffect(() => {
    const setupApp = async () => {
      try {
        console.log('🔄 Initializing local database...');
        const success = await initializeDatabase();
        if (success) {
          console.log('✅ Database initialization completed');
          
          // Check if user was previously authenticated and if it's first time
          await checkAuthStatus();
          await checkIfFirstTime();
          
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
  }, [checkAuthStatus]);

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
    <ErrorBoundary>
      <AppNavigator />
    </ErrorBoundary>
  );
}

function AppNavigator() {
  const { isAuthenticated, hasCompletedWizard, isFirstTime } = useAuthStore();
  const { hasActiveSubscription, checkSubscriptionStatus } = useSubscriptionStore();
  const [showBiometricSetup, setShowBiometricSetup] = useState(isFirstTime);
  const [showAuth, setShowAuth] = useState(!isAuthenticated && !isFirstTime);
  const [showWizard, setShowWizard] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  // Check subscription status when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isFirstTime) {
      checkSubscriptionStatus();
    }
  }, [isAuthenticated, isFirstTime]);

  // DEBUG: Log navigation state (only when navigation state changes)
  useEffect(() => {
    console.log('🧭 AppNavigator state:', {
      isAuthenticated,
      hasCompletedWizard,
      isFirstTime,
      hasActiveSubscription: hasActiveSubscription(),
      showBiometricSetup,
      showAuth,
      showWizard,
      showSubscription,
      willShow: showBiometricSetup ? 'BIOMETRIC_SETUP' : showAuth ? 'AUTH' : showWizard ? 'WIZARD' : showSubscription ? 'SUBSCRIPTION' : 'MAIN_APP'
    });
  }, [isAuthenticated, hasCompletedWizard, isFirstTime, showBiometricSetup, showAuth, showWizard, showSubscription]);

  // Update navigation state when authentication/first time state changes
  useEffect(() => {
    if (isFirstTime) {
      setShowBiometricSetup(true);
      setShowAuth(false);
      setShowWizard(false);
      setShowSubscription(false);
    } else if (!isAuthenticated) {
      setShowBiometricSetup(false);
      setShowAuth(true);
      setShowWizard(false);
      setShowSubscription(false);
    } else if (isAuthenticated && !hasCompletedWizard) {
      setShowBiometricSetup(false);
      setShowAuth(false);
      setShowWizard(true);
      setShowSubscription(false);
    } else if (isAuthenticated && hasCompletedWizard && !hasActiveSubscription()) {
      // User completed wizard but doesn't have active subscription
      setShowBiometricSetup(false);
      setShowAuth(false);
      setShowWizard(false);
      setShowSubscription(true);
    } else {
      setShowBiometricSetup(false);
      setShowAuth(false);
      setShowWizard(false);
      setShowSubscription(false);
    }
  }, [isAuthenticated, hasCompletedWizard, isFirstTime, hasActiveSubscription]);

  // Show biometric setup for first-time users
  if (showBiometricSetup) {
    return (
      <BiometricSetupScreen 
        onComplete={() => setShowBiometricSetup(false)}
      />
    );
  }

  // Show auth screen if not authenticated (returning users)
  if (showAuth) {
    return (
      <AuthScreen 
        onComplete={() => setShowAuth(false)}
      />
    );
  }

  // Show wizard if authenticated but hasn't completed wizard
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
        onSubscribed={() => setShowSubscription(false)}
        showSkipOption={false}
      />
    );
  }

  // Show main app if authenticated, completed wizard, and has subscription
  return <RootLayoutNav />;
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
        name="ai-chat" 
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