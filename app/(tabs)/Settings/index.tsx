import React from 'react';
import { View, ScrollView, TouchableOpacity, Switch, Image, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';

import { styles } from './styles';
import { useSettingsLogic } from './logic';
import { colors } from '@/constants/colors';

export default function SettingsScreen() {
  const {
    router, user, userProfile, notifications, trialDaysLeft,
    hasActiveSubscription, getSubscriptionInfo, isTrialActive, getTrialInfo, getDaysUntilExpiry,
    handleNotificationsToggle, handleManageSubscription, handleStartTrial, handleExpireTrial,
    handleResetSubscriptionData, handleSubscriptionPress
    // handleResetApp,
  } = useSettingsLogic();

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard} onPress={() => router.push('/profile-edit')} activeOpacity={1}>
          <View style={styles.profileAvatar}>
            {userProfile?.profilePicture ? (
              <Image source={{ uri: userProfile.profilePicture }} style={styles.profileAvatarImage} />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Text style={styles.profileInitial}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileDetails}>Manage weight tracking in Progress tab</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.lightGray} />
        </TouchableOpacity>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
              <Icon name="bell" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingDescription}>Workout reminders and updates</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/ltwins-points')}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
              <Text style={{ fontSize: 20 }}>👯‍♂️</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Beat the L Twins</Text>
              <Text style={styles.settingDescription}>View your points and game settings</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          {[
            { title: 'My Achievements', icon: 'award', color: colors.secondary, path: '/my-achievements' },
            { title: 'Help & Support', icon: 'help-circle', color: colors.secondary, path: null },
            { title: 'About DENSE', icon: 'info', color: colors.warning, path: '/about-us' },
            { title: 'My Goals', icon: 'target', color: colors.primary, path: '/my-goals' },
            { title: 'Check Our Progress!', icon: 'play-circle', color: colors.secondary, path: '/check-our-progress' },
            { title: 'Notification Settings', icon: 'bell', color: colors.primary, path: '/notification-settings' },
          ].map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.settingItem} 
              onPress={() => item.path && router.push(item.path as any)} 
              activeOpacity={1}
            >
              <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
                <Icon name={item.icon as any} size={20} color={colors.black} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{item.title}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.lightGray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handleSubscriptionPress} activeOpacity={1}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
              <Icon name="zap" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>DENSE Pro Status</Text>
              <Text style={styles.settingDescription}>
                {isTrialActive() ? 'Free Trial Active' : hasActiveSubscription() ? 'Subscription Active' : 'No Active Subscription'}
              </Text>
            </View>
            <View style={styles.subscriptionStatus}>
              <Icon 
                name={isTrialActive() || hasActiveSubscription() ? "check-circle" : "alert-circle"} 
                size={20} 
                color={isTrialActive() || hasActiveSubscription() ? colors.success : colors.warning} 
              />
            </View>
          </TouchableOpacity>

          {hasActiveSubscription() && (
            <TouchableOpacity style={styles.settingItem} onPress={handleManageSubscription}>
              <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
                <Icon name="settings" size={20} color={colors.black} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Manage Subscription</Text>
              </View>
              <Icon name="external-link" size={20} color={colors.lightGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Developer Testing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Testing</Text>
          {/* <TouchableOpacity style={styles.settingItem} onPress={handleResetApp}>
            <View style={[styles.settingIcon, { backgroundColor: colors.error }]}>
              <Icon name="trash-2" size={20} color={colors.white} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Reset Entire App</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity> */}

          <TouchableOpacity style={styles.settingItem} onPress={handleStartTrial}>
            <View style={[styles.settingIcon, { backgroundColor: colors.success }]}>
              <Icon name="play" size={20} color={colors.white} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Start 7-Day Trial</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleExpireTrial}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}>
              <Icon name="clock" size={20} color={colors.black} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Expire Trial</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.lightGray} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}