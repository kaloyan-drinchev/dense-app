import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { notificationService } from '@/services/notification-service';
import { liveActivityService } from '@/services/live-activity-service';
import { useTimerStore } from '@/store/timer-store';
import * as Notifications from 'expo-notifications';

/**
 * Hook to manage workout notification
 * iOS: Uses Live Activities for live timer on lock screen
 * Android: Uses Chronometer for live timer in notification
 */
export function useWorkoutNotification() {
  const router = useRouter();
  const pathname = usePathname();
  const notificationSubscription = useRef<Notifications.Subscription | null>(null);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [hasStartedLiveActivity, setHasStartedLiveActivity] = useState(false);

  const {
    isWorkoutActive,
    isRunning,
    timeElapsed,
    workoutName,
    workoutStartTime,
    pauseTimer,
    resumeTimer,
  } = useTimerStore();

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Listen to app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('🔄 App state changed:', appState, '->', nextAppState);
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  // Set up notification handlers
  useEffect(() => {
    const handleTap = () => {
      // Only navigate if not already on workout-session page
      // This prevents the visual glitch of replacing the same screen
      if (pathname !== '/workout-session') {
        console.log('📱 Notification tapped - navigating to workout-session');
        router.replace('/workout-session');
      } else {
        console.log('📱 Notification tapped - already on workout-session, no navigation needed');
      }
    };

    notificationSubscription.current = notificationService.setupNotificationHandlers(
      pauseTimer,
      resumeTimer,
      handleTap
    );

    return () => {
      if (notificationSubscription.current) {
        notificationSubscription.current.remove();
      }
    };
  }, [pauseTimer, resumeTimer, router, pathname]);

  // Start/End Live Activity when workout starts/ends (iOS only)
  useEffect(() => {
    if (Platform.OS === 'ios' && liveActivityService.isSupported()) {
      if (isWorkoutActive && workoutName && workoutStartTime && !hasStartedLiveActivity) {
        // Start Live Activity
        console.log('🚀 Starting iOS Live Activity');
        liveActivityService.startWorkoutActivity(
          workoutName,
          new Date(workoutStartTime)
        ).then(() => {
          setHasStartedLiveActivity(true);
        });
      } else if (!isWorkoutActive && hasStartedLiveActivity) {
        // End Live Activity
        console.log('🏁 Ending iOS Live Activity');
        liveActivityService.endWorkoutActivity(timeElapsed);
        setHasStartedLiveActivity(false);
      }
    }
  }, [isWorkoutActive, workoutName, workoutStartTime, hasStartedLiveActivity, timeElapsed]);

  // Handle showing/hiding notification based on app state (no timer dependency)
  useEffect(() => {
    const isAppInBackground = appState === 'background';
    
    console.log('🔍 NOTIFICATION HOOK STATE:', {
      isWorkoutActive,
      workoutName,
      appState,
      isAppInBackground,
      platform: Platform.OS,
    });
    
    if (isWorkoutActive && workoutName) {
      if (isAppInBackground) {
        // App backgrounded - show notification with current time
        console.log('✅ SHOWING NOTIFICATION - App went to background');
        
        const state = useTimerStore.getState();
        const formattedTime = formatTime(state.timeElapsed);
        
        const startTime = state.workoutStartTime ? new Date(state.workoutStartTime) : null;
        const startTimeStr = startTime ? startTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }) : '';
        
        notificationService.showWorkoutNotification(
          workoutName,
          formattedTime,
          !state.isRunning,
          startTimeStr,
          state.workoutStartTime || undefined
        );
      } else {
        // App is in foreground - ensure notification is dismissed
        notificationService.dismissWorkoutNotification();
      }
    } else {
      // Workout not active - clean up
      notificationService.dismissWorkoutNotification();
    }
  }, [isWorkoutActive, workoutName, appState]); // Only react to workout/app state changes
  
  // Separate effect: Update Live Activity every second (iOS only, when backgrounded)
  useEffect(() => {
    if (Platform.OS === 'ios' && 
        liveActivityService.isSupported() && 
        hasStartedLiveActivity && 
        isWorkoutActive &&
        appState === 'background') {
      // Update Live Activity with current elapsed time
      liveActivityService.updateWorkoutActivity(timeElapsed, !isRunning);
    }
  }, [timeElapsed, isRunning, hasStartedLiveActivity, isWorkoutActive, appState]); // Update every second, but only when backgrounded

}



