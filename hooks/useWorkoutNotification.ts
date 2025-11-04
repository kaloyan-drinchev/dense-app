import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useRouter } from 'expo-router';
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
      router.push('/workout-session');
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
  }, [pauseTimer, resumeTimer, router]);

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

  // Update Live Activity every second (iOS) or show notification when backgrounded (Android)
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
      // iOS: Update Live Activity with current elapsed time
      if (Platform.OS === 'ios' && liveActivityService.isSupported() && hasStartedLiveActivity) {
        liveActivityService.updateWorkoutActivity(timeElapsed, !isRunning);
      }
      
      // Show notification when app is backgrounded (both platforms)
      if (isAppInBackground) {
        console.log('✅ SHOWING NOTIFICATION - App in background');
        
        const state = useTimerStore.getState();
        const formattedTime = formatTime(state.timeElapsed);
        
        // Get workout start time for additional context
        const startTime = state.workoutStartTime ? new Date(state.workoutStartTime) : null;
        const startTimeStr = startTime ? startTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }) : '';
        
        console.log(`📲 Showing notification: ${formattedTime} (started at ${startTimeStr})`);
        
        // Android: Use chronometer, iOS: fallback notification
        notificationService.showWorkoutNotification(
          workoutName,
          formattedTime,
          !state.isRunning,
          startTimeStr,
          state.workoutStartTime || undefined
        );
      } else {
        // App is active - hide notification
        console.log('🚫 App in foreground - hiding notification');
        notificationService.dismissWorkoutNotification();
      }
    } else {
      // Workout not active - clean up
      notificationService.dismissWorkoutNotification();
    }
  }, [isWorkoutActive, workoutName, appState, timeElapsed, isRunning, hasStartedLiveActivity]); // Update every second

}



