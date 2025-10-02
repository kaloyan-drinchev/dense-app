import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon } from '@expo/vector-icons';
import { notificationService } from '@/services/notification-service';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'expo-router';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [motivationalReminders, setMotivationalReminders] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

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
    setShowTimePicker(false);
    if (selectedDate) {
      setSelectedTime(selectedDate);
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
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Workout Reminder</Text>
          <Text style={styles.sectionDescription}>
            Get reminded to complete your workout only on your training days. No notifications on rest days!
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Smart Workout Reminder</Text>
              <Text style={styles.settingSubtitle}>Only on your training days - no spam on rest days!</Text>
            </View>
            <Switch
              value={workoutReminders}
              onValueChange={handleWorkoutRemindersToggle}
              trackColor={{ false: colors.mediumGray, true: colors.primary }}
              thumbColor={workoutReminders ? colors.white : colors.lightGray}
            />
          </View>

          {workoutReminders && (
            <View style={styles.timePickerSection}>
              <Text style={styles.timeLabel}>Reminder Time:</Text>
              <View style={styles.timeButtonContainer}>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Icon name="clock" size={20} color={colors.primary} />
                  <Text style={styles.timeText}>{formatTime(selectedTime)}</Text>
                  <Icon name="chevron-down" size={16} color={colors.lightGray} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          <Text style={styles.sectionDescription}>
            Test if notifications are working properly on your device.
          </Text>
          
          <TouchableOpacity style={styles.testButton} onPress={testNotification}>
            <Icon name="bell" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {scheduledNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scheduled Notifications</Text>
            <Text style={styles.sectionDescription}>
              {scheduledNotifications.length} notifications are currently scheduled.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Reminder Time</Text>
              <TouchableOpacity 
                onPress={() => setShowTimePicker(false)}
                style={styles.closeButton}
              >
                <Icon name="x" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
            
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleTimeChange}
              style={styles.timePicker}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.confirmButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
    flex: 1,
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 8,
  },
  sectionDescription: {
    ...typography.body,
    color: colors.lightGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.lightGray,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  testButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  timePickerSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  timeLabel: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 12,
  },
  timeButtonContainer: {
    width: '100%',
    maxWidth: 200,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.mediumGray,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    width: '100%',
  },
  timeText: {
    ...typography.body,
    color: colors.black,
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.darkGray,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.white,
  },
  closeButton: {
    padding: 8,
  },
  timePicker: {
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.mediumGray,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
});
