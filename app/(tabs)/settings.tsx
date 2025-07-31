import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWorkoutStore } from '@/store/workout-store';
import { colors } from '@/constants/colors';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const { userProfile, resetProgress } = useWorkoutStore();
  const [notifications, setNotifications] = useState(true);

  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile');
  };

  const handleResetProgress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      'Reset Progress',
      'This will reset all your workout progress. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetProgress();
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>
              {userProfile?.name ? userProfile.name[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userProfile?.name || 'Set up your profile'}
            </Text>
            <Text style={styles.profileDetails}>
              {userProfile
                ? `${userProfile.weight} kg • ${userProfile.height} cm • ${userProfile.age} years`
                : 'Tap to complete your profile'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleEditProfile}>
            <Icon name="chevron-right" size={24} color={colors.lightGray} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Icon name="bell" size={20} color={colors.white} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Workout Reminders</Text>
              <Text style={styles.settingDescription}>
                Receive notifications for your workouts
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{
                false: colors.mediumGray,
                true: colors.primaryLight,
              }}
              thumbColor={notifications ? colors.primary : colors.lightGray}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleResetProgress}
          >
            <View
              style={[styles.settingIcon, { backgroundColor: colors.error }]}
            >
              <Icon name="trash-2" size={20} color={colors.white} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Reset Progress</Text>
              <Text style={styles.settingDescription}>
                Clear all workout data and start fresh
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Icon name="info" size={20} color={colors.white} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>App Version</Text>
              <Text style={styles.settingDescription}>1.0.0</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Icon name="help-circle" size={20} color={colors.white} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingDescription}>
                Get assistance with the app
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: colors.lighterGray,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
    paddingLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.lighterGray,
  },
});
