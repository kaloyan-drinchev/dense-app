import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";

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

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <RootLayoutNav />
    </ErrorBoundary>
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
        name="profile" 
        options={{ 
          title: "Profile",
          presentation: 'modal',
        }} 
      />
    </Stack>
  );
}