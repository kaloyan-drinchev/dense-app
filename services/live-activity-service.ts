import { Platform } from 'react-native';

/**
 * iOS Live Activities Service
 * Shows live workout timer on lock screen and Dynamic Island
 * Requires: iOS 16.1+, custom development build with ActivityKit
 */

interface WorkoutActivityAttributes {
  workoutName: string;
  startTime: number; // Unix timestamp
}

interface WorkoutActivityState {
  elapsedSeconds: number;
  isPaused: boolean;
}

class LiveActivityService {
  private static instance: LiveActivityService;
  private currentActivityId: string | null = null;
  private activityModule: any = null;

  private constructor() {
    // Try to load the native module
    if (Platform.OS === 'ios') {
      try {
        // This will be the native module we create
        const { LiveActivityModule } = require('react-native').NativeModules;
        this.activityModule = LiveActivityModule;
      } catch (error) {
        console.warn('⚠️ Live Activities not available (requires custom development build)');
      }
    }
  }

  public static getInstance(): LiveActivityService {
    if (!LiveActivityService.instance) {
      LiveActivityService.instance = new LiveActivityService();
    }
    return LiveActivityService.instance;
  }

  /**
   * Check if Live Activities are supported
   */
  isSupported(): boolean {
    return Platform.OS === 'ios' && this.activityModule !== null;
  }

  /**
   * Start a Live Activity for workout tracking
   */
  async startWorkoutActivity(
    workoutName: string,
    startTime: Date
  ): Promise<string | null> {
    if (!this.isSupported()) {
      console.log('📱 Live Activities not supported, using fallback notification');
      return null;
    }

    try {
      const attributes: WorkoutActivityAttributes = {
        workoutName,
        startTime: startTime.getTime(),
      };

      const initialState: WorkoutActivityState = {
        elapsedSeconds: 0,
        isPaused: false,
      };

      console.log('🚀 Starting Live Activity:', workoutName);
      
      const activityId = await this.activityModule.startActivity({
        attributes,
        contentState: initialState,
      });

      this.currentActivityId = activityId;
      console.log('✅ Live Activity started:', activityId);
      
      return activityId;
    } catch (error) {
      console.error('❌ Error starting Live Activity:', error);
      return null;
    }
  }

  /**
   * Update the Live Activity with new elapsed time
   */
  async updateWorkoutActivity(
    elapsedSeconds: number,
    isPaused: boolean
  ): Promise<void> {
    if (!this.isSupported() || !this.currentActivityId) {
      return;
    }

    try {
      const newState: WorkoutActivityState = {
        elapsedSeconds,
        isPaused,
      };

      await this.activityModule.updateActivity({
        activityId: this.currentActivityId,
        contentState: newState,
      });

      // Don't log every update (too verbose)
      // console.log('⏱️ Live Activity updated:', elapsedSeconds);
    } catch (error) {
      console.error('❌ Error updating Live Activity:', error);
    }
  }

  /**
   * End the Live Activity
   */
  async endWorkoutActivity(finalElapsedSeconds: number): Promise<void> {
    if (!this.isSupported() || !this.currentActivityId) {
      return;
    }

    try {
      const finalState: WorkoutActivityState = {
        elapsedSeconds: finalElapsedSeconds,
        isPaused: true,
      };

      await this.activityModule.endActivity({
        activityId: this.currentActivityId,
        contentState: finalState,
        dismissalPolicy: 'default', // Auto-dismiss after 4 hours
      });

      console.log('✅ Live Activity ended');
      this.currentActivityId = null;
    } catch (error) {
      console.error('❌ Error ending Live Activity:', error);
      this.currentActivityId = null;
    }
  }

  /**
   * Check if there's an active Live Activity
   */
  hasActiveActivity(): boolean {
    return this.currentActivityId !== null;
  }
}

export const liveActivityService = LiveActivityService.getInstance();

