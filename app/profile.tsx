import React from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { ProfileSetup } from "@/components/ProfileSetup";
import { colors } from "@/constants/colors";

export default function ProfileScreen() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Edit Profile",
        }} 
      />
      <View style={styles.container}>
        <ProfileSetup onComplete={() => {}} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
});