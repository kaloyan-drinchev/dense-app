import { useState, useEffect, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuthStore } from '@/store/auth-store';
import { subscriptionService } from '@/services/subscription';
import { notificationService } from '@/services/notification-service';
import { AppUpdateManager } from '@/utils/app-updates';

// Import fonts
import {
  Exo2_400Regular, Exo2_500Medium, Exo2_600SemiBold, Exo2_700Bold,
} from '@expo-google-fonts/exo-2';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import {
  Saira_400Regular, Saira_500Medium, Saira_600SemiBold, Saira_700Bold,
} from '@expo-google-fonts/saira';

export function useAppInitialization() {
  const [dbInitialized, setDbInitialized] = useState(false);
  
  const [fontsLoaded, fontError] = useFonts({
    ...FontAwesome.font,
    Exo2_400Regular, Exo2_500Medium, Exo2_600SemiBold, Exo2_700Bold,
    ArchivoBlack_400Regular,
    Saira_400Regular, Saira_500Medium, Saira_600SemiBold, Saira_700Bold,
  });

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const setup = async () => {
      try {
        console.log("🔄 Initializing app...");
        
        // 1. Auth & Subscriptions
        const { user, checkUserStatus, checkIfFirstTime } = useAuthStore.getState();
        if (checkUserStatus) await checkUserStatus();
        if (checkIfFirstTime) await checkIfFirstTime();
        
        if (user) {
          await subscriptionService.initialize(user.id);
        }

        // 2. Notifications
        try {
          const hasPermission = await notificationService.requestPermissions();
          console.log(hasPermission ? "✅ Notifications enabled" : "❌ Notifications denied");
        } catch (e) { console.error("Notification setup failed", e); }

        // 3. Updates
        const wasUpdated = await AppUpdateManager.checkForAppUpdate();
        if (wasUpdated) {
          setTimeout(() => AppUpdateManager.showUpdateNotification(), 2000);
        }

        setDbInitialized(true);
      } catch (err) {
        console.error("❌ App initialization error:", err);
      }
    };

    setup();
  }, []);

  // Handle Splash Screen
  useEffect(() => {
    if (fontsLoaded && dbInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbInitialized]);

  return { 
    isReady: fontsLoaded && dbInitialized, 
    error: fontError 
  };
}