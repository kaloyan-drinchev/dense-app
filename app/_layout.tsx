import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import { initializeDatabase } from "@/db/migrations";
import { useAuthStore } from "@/store/auth-store";
import { AuthScreen } from "@/components/AuthScreen";
import { SetupWizard } from "@/components/SetupWizard";
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
  });
  
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);
  const { isAuthenticated, checkAuthStatus } = useAuthStore();

  // Initialize database and check auth status on app startup
  useEffect(() => {
    const setupApp = async () => {
      try {
        console.log('🔄 Initializing local database...');
        const success = await initializeDatabase();
        if (success) {
          console.log('✅ Database initialization completed');
          
          // Check if user was previously authenticated
          await checkAuthStatus();
          
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
  const { isAuthenticated, hasCompletedWizard } = useAuthStore();
  const [showAuth, setShowAuth] = useState(!isAuthenticated);
  const [showWizard, setShowWizard] = useState(false);

  // Update showAuth when authentication state changes
  useEffect(() => {
    setShowAuth(!isAuthenticated);
  }, [isAuthenticated]);

  // Update showWizard when authentication and wizard state changes
  useEffect(() => {
    if (isAuthenticated && !hasCompletedWizard) {
      setShowWizard(true);
      setShowAuth(false);
    } else {
      setShowWizard(false);
    }
  }, [isAuthenticated, hasCompletedWizard]);

  // Show auth screen if not authenticated
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
        visible={true}
        onClose={() => setShowWizard(false)}
        onComplete={() => setShowWizard(false)}
      />
    );
  }

  // Show main app if authenticated and completed wizard
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
        name="profile" 
        options={{ 
          title: "Profile",
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}