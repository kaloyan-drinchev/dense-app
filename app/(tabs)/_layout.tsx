import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import { useChatStore } from '@/store/chat-store';

export default function TabLayout() {
  const router = useRouter();
  const { hasNotifications } = useChatStore();


  const openChat = () => {
    router.push('/ai-chat');
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
            <Icon name="home" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: 'Programs',
          tabBarIcon: ({ color }) => (
            <MaterialIcon name="fitness-center" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color }) => (
            <MaterialIcon name="restaurant" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <Icon name="bar-chart-2" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Icon name="user" size={28} color={color} />
          ),
        }}
      />
      </Tabs>
      


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
