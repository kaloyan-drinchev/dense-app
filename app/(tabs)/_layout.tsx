import React, { useEffect, useState, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { colors, gradients } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import { useChatStore } from '@/store/chat-store';
import { useTimerStore } from '@/store/timer-store';

export default function TabLayout() {
  const router = useRouter();
  const { hasNotifications } = useChatStore();
  const { isWorkoutActive, timeElapsed, updateTimeElapsed } = useTimerStore();
  const [currentTime, setCurrentTime] = useState(timeElapsed);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update timer display continuously when workout is active
  useEffect(() => {
    if (isWorkoutActive) {
      intervalRef.current = setInterval(() => {
        updateTimeElapsed();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isWorkoutActive, updateTimeElapsed]);

  // Update current time when timeElapsed changes
  useEffect(() => {
    setCurrentTime(timeElapsed);
  }, [timeElapsed]);

  const openChat = () => {
    router.push('/ai-chat');
  };

  const goToWorkout = () => {
    router.push('/workout-session');
  };

  // Format timer for display
  const formatTimerTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.lightGray,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.darkGray,
          height: 70,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          ...typography.caption,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          ...typography.h3,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Icon name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: 'Programs',
          tabBarIcon: ({ color }) => (
            <MaterialIcon name="fitness-center" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color }) => (
            <MaterialIcon name="restaurant" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <Icon name="bar-chart-2" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Icon name="user" size={24} color={color} />
          ),
        }}
      />
      </Tabs>
      
      {/* Workout Timer Indicator */}
      {isWorkoutActive && (
        <TouchableOpacity
          style={styles.timerIndicator}
          onPress={goToWorkout}
          activeOpacity={0.8}
        >
          <Icon name="clock" size={16} color={colors.white} />
          <Text style={styles.timerIndicatorText}>{formatTimerTime(currentTime)}</Text>
        </TouchableOpacity>
      )}

      {/* Floating AI Assistant Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={openChat}
        activeOpacity={0.8}
      >
        <Icon name="activity" size={24} color="white" />
        
        {/* Notification Badge */}
        {hasNotifications && (
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
          </View>
        )}
      </TouchableOpacity>


    </View>
  );
}

const styles = StyleSheet.create({
  timerIndicator: {
    position: 'absolute',
    top: 50, // Below the status bar
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(58, 81, 153, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
    gap: 6,
  },
  timerIndicatorText: {
    ...typography.timerSmall,
    color: colors.white,
    includeFontPadding: false,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 85, // 15px above the 70px tab bar
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});
