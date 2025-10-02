import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { wizardResultsService } from '@/db/services';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
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

  // Schedule smart workout reminder that only triggers on workout days
  async scheduleSmartWorkoutReminder(userId: string, reminderTime: string = '18:00'): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return null;
      }

      // Check if today is a workout day
      const isWorkoutDay = await this.isTodayWorkoutDay(userId);
      
      if (!isWorkoutDay) {
        console.log('Today is a rest day - no notification scheduled');
        return null;
      }

      const [hours, minutes] = reminderTime.split(':').map(Number);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "💪 Don't forget to complete your workout today!",
          body: "Your training session is waiting! Let's crush those goals!",
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      console.log('Smart workout reminder scheduled for workout day:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling smart workout reminder:', error);
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
