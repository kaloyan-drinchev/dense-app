import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { wizardResultsService } from '@/db/services';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Get push token
  async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      this.expoPushToken = token.data;
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Schedule workout reminder
  async scheduleWorkoutReminder(
    title: string = "Today is your workout! 💪",
    body: string = "Get ready to kill it! Time to crush your fitness goals!",
    triggerTime: Date
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerTime,
        },
      });

      console.log('Workout reminder scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling workout reminder:', error);
      return null;
    }
  }

  // Schedule smart daily workout reminder at specific time
  async scheduleDailyWorkoutReminder(reminderTime: string = '18:00'): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return null;
      }

      const [hours, minutes] = reminderTime.split(':').map(Number);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "💪 Time to Workout!",
          body: "Your workout is waiting! Let's crush those goals!",
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      console.log('Smart daily workout reminder scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling daily workout reminder:', error);
      return null;
    }
  }

  // Check if today is a workout day for the user
  async isTodayWorkoutDay(userId: string): Promise<boolean> {
    try {
      const wizardResults = await wizardResultsService.getByUserId(userId);
      if (!wizardResults) {
        console.log('No wizard results found for user');
        return false;
      }

      // Get user's training schedule
      const trainingDays = wizardResults.preferredTrainingDays 
        ? JSON.parse(wizardResults.preferredTrainingDays)
        : this.getDefaultTrainingDays(wizardResults.trainingDaysPerWeek);

      // Get today's day name
      const today = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayName = dayNames[today.getDay()];

      // Check if today is a training day
      const isWorkoutDay = trainingDays.includes(todayName);
      console.log(`Today (${todayName}) is ${isWorkoutDay ? 'a workout day' : 'a rest day'}`);
      
      return isWorkoutDay;
    } catch (error) {
      console.error('Error checking if today is workout day:', error);
      return false;
    }
  }

  // Get default training days based on days per week
  private getDefaultTrainingDays(daysPerWeek: number): string[] {
    switch (daysPerWeek) {
      case 3:
        return ['monday', 'wednesday', 'friday'];
      case 4:
        return ['monday', 'tuesday', 'thursday', 'friday'];
      case 5:
        return ['monday', 'tuesday', 'thursday', 'friday', 'saturday'];
      case 6:
        return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      default:
        return ['monday', 'wednesday', 'friday'];
    }
  }

  // Get daily motivational message (cycles through 10 messages)
  private getDailyMotivationalMessage(): string {
    const motivationalMessages = [
      "Your future self will thank you for the work you do today. Let's get started.",
      "The only workout you regret is the one you didn't do. Let's leave no regrets today. 💪",
      "Don't wish for it. Work for it. Your session is ready now. 🔥",
      "Be stronger than your excuses. It's time to prove it to yourself.",
      "Consistency is the key that unlocks your potential. Today is another turn of that key.",
      "Discipline is the bridge between your goals and reality. Time to cross it.",
      "Show up for yourself, even when you don't feel like it. That's where real strength is built.",
      "Remember that powerful feeling after a great workout? It's just one session away. Go get it!",
      "Today's challenge is waiting. Rise up and conquer it. 🏆",
      "There is a stronger version of you waiting to be unleashed. The time is now."
    ];

    // Get current date and calculate which message to show (cycles every 10 days)
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const messageIndex = dayOfYear % 10; // Cycles through 0-9, then back to 0
    
    return motivationalMessages[messageIndex];
  }

  // Schedule smart workout reminder (1 notification per day that cycles through 10 messages)
  async scheduleSmartWorkoutReminder(userId: string, reminderTime: string = '10:00'): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return null;
      }

      // Cancel any existing notifications first to ensure only 1 notification per day
      await this.cancelAllNotifications();

      const [hours, minutes] = reminderTime.split(':').map(Number);
      
      // Get all 10 motivational messages
      const motivationalMessages = [
        "Your future self will thank you for the work you do today. Let's get started.",
        "The only workout you regret is the one you didn't do. Let's leave no regrets today. 💪",
        "Don't wish for it. Work for it. Your session is ready now. 🔥",
        "Be stronger than your excuses. It's time to prove it to yourself.",
        "Consistency is the key that unlocks your potential. Today is another turn of that key.",
        "Discipline is the bridge between your goals and reality. Time to cross it.",
        "Show up for yourself, even when you don't feel like it. That's where real strength is built.",
        "Remember that powerful feeling after a great workout? It's just one session away. Go get it!",
        "Today's challenge is waiting. Rise up and conquer it. 🏆",
        "There is a stronger version of you waiting to be unleashed. The time is now."
      ];

      // Calculate which message should be shown today based on day of year
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 0);
      const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      const startingMessageIndex = dayOfYear % 10; // Which message in the cycle we start with today

      // Schedule notifications for the next 30 days (3 full cycles of the 10 messages)
      // Each day gets the next message in the loop
      // After 30 days, users can re-toggle notifications to refresh
      const scheduledIds: string[] = [];
      const DAYS_TO_SCHEDULE = 30;
      
      for (let dayOffset = 0; dayOffset < DAYS_TO_SCHEDULE; dayOffset++) {
        // Calculate which message to show for this day
        const messageIndex = (startingMessageIndex + dayOffset) % 10;
        
        // Calculate the fire date for this notification
        const fireDate = new Date();
        fireDate.setDate(today.getDate() + dayOffset);
        fireDate.setHours(hours, minutes, 0, 0);
        
        // Skip if the time has already passed today (for day 0)
        if (dayOffset === 0 && fireDate <= new Date()) {
          continue; // Skip today, will start tomorrow
        }
        
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "💪 Time to Workout!",
            body: motivationalMessages[messageIndex],
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireDate,
          },
        });
        
        scheduledIds.push(notificationId);
      }

      console.log(`✅ Daily workout reminders scheduled at ${reminderTime} - 1 notification per day`);
      console.log(`📅 Scheduled ${scheduledIds.length} notifications (next ${DAYS_TO_SCHEDULE} days)`);
      console.log(`🔄 Messages will cycle through all 10 motivational quotes`);
      console.log(`💡 Tip: Toggle notifications off/on after 30 days to refresh`);
      return scheduledIds.length > 0 ? scheduledIds[0] : null;
    } catch (error) {
      console.error('❌ Error scheduling smart workout reminder:', error);
      return null;
    }
  }

  // Schedule daily workout reminders (legacy method for multiple days)
  async scheduleDailyWorkoutReminders(
    workoutDays: string[] = ['Monday', 'Wednesday', 'Friday'],
    reminderTime: string = '18:00' // 6 PM
  ): Promise<string[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return [];
      }

      const scheduledIds: string[] = [];
      const [hours, minutes] = reminderTime.split(':').map(Number);

      for (const day of workoutDays) {
        const dayIndex = this.getDayIndex(day);
        if (dayIndex !== -1) {
          const triggerTime = this.getNextWorkoutTime(dayIndex, hours, minutes);
          
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: "Workout Day! 🔥",
              body: `Time to crush your ${day} workout! Let's get stronger! 💪`,
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              weekday: dayIndex,
              hour: hours,
              minute: minutes,
              repeats: true,
            },
          });

          scheduledIds.push(notificationId);
        }
      }

      console.log('Daily workout reminders scheduled:', scheduledIds);
      return scheduledIds;
    } catch (error) {
      console.error('Error scheduling daily workout reminders:', error);
      return [];
    }
  }

  // Schedule motivational notifications
  async scheduleMotivationalReminders(): Promise<string[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return [];
      }

      const motivationalMessages = [
        { title: "You're stronger than you think! 💪", body: "Every workout makes you better. Keep pushing!" },
        { title: "Progress, not perfection! 🎯", body: "Small steps lead to big changes. You've got this!" },
        { title: "Your future self will thank you! 🙏", body: "The pain of discipline is better than the pain of regret." },
        { title: "Beast mode activated! 🔥", body: "Time to show yourself what you're made of!" },
        { title: "Consistency is key! 🔑", body: "You don't have to be perfect, just consistent." },
      ];

      const scheduledIds: string[] = [];

      // Schedule random motivational messages throughout the week
      for (let i = 0; i < 3; i++) {
        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        const randomHour = 9 + Math.floor(Math.random() * 8); // Between 9 AM and 5 PM
        const randomMinute = Math.floor(Math.random() * 60);

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: randomMessage.title,
            body: randomMessage.body,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: randomHour,
            minute: randomMinute,
            repeats: true,
          },
        });

        scheduledIds.push(notificationId);
      }

      console.log('Motivational reminders scheduled:', scheduledIds);
      return scheduledIds;
    } catch (error) {
      console.error('Error scheduling motivational reminders:', error);
      return [];
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  // Cancel specific notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  private lastNotificationTime: string = '';
  private notificationCategorySet: boolean = false;

  // Create/Update ongoing workout notification with LIVE timer (Android Chronometer)
  async showWorkoutNotification(
    workoutName: string,
    elapsedTime: string,
    isPaused: boolean,
    startTime?: string,
    workoutStartTimestamp?: string
  ): Promise<void> {
    try {
      console.log(`⏱️ Updating notification with live timer`);

      // Only set up notification category once
      if (!this.notificationCategorySet) {
        await Notifications.setNotificationCategoryAsync('workout-active', [
          {
            identifier: 'pause',
            buttonTitle: '⏸ Pause',
            options: {
              opensAppToForeground: false,
            },
          },
          {
            identifier: 'resume',
            buttonTitle: '▶️ Resume',
            options: {
              opensAppToForeground: false,
            },
          },
        ]);
        this.notificationCategorySet = true;
      }

      // Calculate the base time for chronometer (when timer started)
      // Android chronometer needs the timestamp when counting started
      const baseTimestamp = workoutStartTimestamp 
        ? new Date(workoutStartTimestamp).getTime()
        : Date.now();

      const statusEmoji = isPaused ? '⏸️' : '▶️';
      const bodyText = `${statusEmoji} ${workoutName}`;

      // IMPORTANT: Schedule with same identifier to update in-place
      // Don't dismiss first - just update the existing notification
      const notificationContent: any = {
        identifier: 'workout-notification', // Same ID = updates existing notification
        content: {
          title: '💪 Workout in Progress',
          body: bodyText,
          sound: false,
          priority: Notifications.AndroidNotificationPriority.MAX,
          sticky: true,
          autoDismiss: false,
          categoryIdentifier: 'workout-active',
          data: {
            screen: 'workout-session',
            type: 'workout-active',
            time: elapsedTime,
          },
          // Android-specific: Enable LIVE chronometer timer
          ...(Platform.OS === 'android' && {
            color: '#00FF87',
            badge: 1,
            // This makes Android show a LIVE counting timer!
            showChronometer: true,
            chronometerCountDown: false,
            // Base time is when the workout started
            chronometerTime: baseTimestamp,
          }),
        },
        trigger: null,
      };

      await Notifications.scheduleNotificationAsync(notificationContent);
      
      this.lastNotificationTime = elapsedTime;
      console.log(`✅ Notification with LIVE chronometer updated (base: ${new Date(baseTimestamp).toLocaleTimeString()})`);
    } catch (error) {
      console.error('Error showing workout notification:', error);
    }
  }

  // Dismiss workout notification
  async dismissWorkoutNotification(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync('workout-notification').catch(() => {});
      await Notifications.dismissNotificationAsync('workout-notification');
      this.lastNotificationTime = ''; // Reset for next workout
      console.log('✅ Workout notification dismissed');
    } catch (error) {
      console.error('Error dismissing workout notification:', error);
    }
  }

  // Set up notification response handler
  setupNotificationHandlers(
    onPause: () => void,
    onResume: () => void,
    onTap: () => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const { actionIdentifier, notification } = response;
      const notificationData = notification.request.content.data;

      // Handle action buttons
      if (actionIdentifier === 'pause') {
        console.log('⏸ Pause action tapped');
        onPause();
      } else if (actionIdentifier === 'resume') {
        console.log('▶️ Resume action tapped');
        onResume();
      } else if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // User tapped the notification itself
        if (notificationData?.screen === 'workout-session') {
          console.log('📱 Notification tapped - navigating to workout');
          onTap();
        }
      }
    });
  }

  // Helper methods
  private getDayIndex(day: string): number {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(day);
  }

  private getNextWorkoutTime(dayIndex: number, hour: number, minute: number): Date {
    const now = new Date();
    const targetDate = new Date();
    
    // Calculate days until next occurrence of the target day
    const daysUntilTarget = (dayIndex - now.getDay() + 7) % 7;
    targetDate.setDate(now.getDate() + daysUntilTarget);
    targetDate.setHours(hour, minute, 0, 0);
    
    // If the time has passed today, schedule for next week
    if (targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 7);
    }
    
    return targetDate;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
