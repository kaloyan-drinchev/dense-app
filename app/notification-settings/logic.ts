import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { notificationService } from '@/services/notification-service';
import { useAuthStore } from '@/store/auth-store';

export const useNotificationSettingsLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Default to 10:00 AM
  const [selectedTime, setSelectedTime] = useState(() => {
    const defaultTime = new Date();
    defaultTime.setHours(10, 0, 0, 0); 
    return defaultTime;
  });

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const notifications = await notificationService.getScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleWorkoutRemindersToggle = async (value: boolean) => {
    try {
      if (value) {
        // Enable smart workout reminder at selected time
        const timeString = selectedTime.toTimeString().slice(0, 5); // Format as HH:MM
        if (user?.id) {
          await notificationService.scheduleSmartWorkoutReminder(user.id, timeString);
          Alert.alert('Success', `Smart workout reminder enabled for ${timeString}! You'll only get notified on your training days.`);
        } else {
          Alert.alert('Error', 'User not found. Please log in again.');
        }
      } else {
        // Disable workout reminders (cancel all notifications)
        await notificationService.cancelAllNotifications();
        Alert.alert('Success', 'Workout reminders have been disabled.');
      }
      setWorkoutReminders(value);
      await loadNotificationSettings();
    } catch (error) {
      console.error('Error toggling workout reminders:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    // For Android, we might want to close immediately on selection
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      setSelectedTime(selectedDate);
    }
  };

  const saveNewTime = () => {
    setShowTimePicker(false);
    // Re-schedule if currently enabled
    if (workoutReminders) {
      handleWorkoutRemindersToggle(true);
    }
  };

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };

  const testNotification = async () => {
    try {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 1); // Schedule for 1 minute from now
      
      await notificationService.scheduleWorkoutReminder(
        "Test Notification! 🧪",
        "This is a test notification from DENSE. If you see this, notifications are working!",
        now
      );
      
      Alert.alert('Test Sent', 'A test notification will arrive in 1 minute!');
      loadNotificationSettings();
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const handleBack = () => router.back();
  const openTimePicker = () => setShowTimePicker(true);
  const closeTimePicker = () => setShowTimePicker(false);

  return {
    user,
    workoutReminders,
    scheduledNotifications,
    selectedTime,
    showTimePicker,
    handleWorkoutRemindersToggle,
    handleTimeChange,
    saveNewTime,
    formatTime,
    testNotification,
    handleBack,
    openTimePicker,
    closeTimePicker
  };
};