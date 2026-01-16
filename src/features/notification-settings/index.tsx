import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { styles } from "./styles";
import { useNotificationSettingsLogic } from "./logic";

export default function NotificationSettingsScreen() {
  const {
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
    closeTimePicker,
  } = useNotificationSettingsLogic();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Workout Reminder</Text>
          <Text style={styles.sectionDescription}>
            Get reminded to complete your workout only on your training days. No
            notifications on rest days!
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Smart Workout Reminder</Text>
              <Text style={styles.settingSubtitle}>
                Only on your training days - no spam on rest days!
              </Text>
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
                  onPress={openTimePicker}
                >
                  <Icon name="clock" size={20} color={colors.primary} />
                  <Text style={styles.timeText}>
                    {formatTime(selectedTime)}
                  </Text>
                  <Icon
                    name="chevron-down"
                    size={16}
                    color={colors.lightGray}
                  />
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

          <TouchableOpacity
            style={styles.testButton}
            onPress={testNotification}
          >
            <Icon name="bell" size={20} color={colors.black} />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {scheduledNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scheduled Notifications</Text>
            <Text style={styles.sectionDescription}>
              {scheduledNotifications.length} notifications are currently
              scheduled.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={closeTimePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Reminder Time</Text>
              <TouchableOpacity
                onPress={closeTimePicker}
                style={styles.closeButton}
              >
                <Icon name="x" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* Note: On iOS, DateTimePicker inside a modal works well with display="spinner".
               On Android, it typically opens its own dialog, so the Modal wrapper might be redundant 
               if strictly following native patterns, but kept here for UI consistency as requested.
            */}
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleTimeChange}
              style={styles.timePicker}
              textColor={colors.white}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeTimePicker}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={saveNewTime}
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
