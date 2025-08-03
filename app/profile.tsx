import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/constants/colors";

export default function ProfileScreen() {
  const router = useRouter();
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Edit Profile",
        }} 
      />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile Settings</Text>
          <Text style={styles.subtitle}>Profile customization will be available soon</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});