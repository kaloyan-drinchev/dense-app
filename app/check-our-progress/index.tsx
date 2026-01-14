import React from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ResizeMode } from "expo-av";
import { colors } from "@/constants/colors";
import { Feather as Icon } from "@expo/vector-icons";
import { HomepageVideoModal } from "@/components/HomepageVideoModal";

import { styles } from "./styles";
import { useCheckOurProgressLogic } from "./logic";

export default function CheckOurProgressScreen() {
  const {
    showVideoModal,
    image1Loading,
    image2Loading,
    handleBack,
    openVideo,
    closeVideoModal,
    handleImage1Load,
    handleImage1Error,
    handleImage2Load,
    handleImage2Error,
    getVideoSource,
  } = useCheckOurProgressLogic();

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check Our Progress!</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.iconContainer}>
              <Icon name="play-circle" size={48} color={colors.primary} />
            </View>
            <Text style={styles.welcomeTitle}>Our Progress Videos</Text>
            <Text style={styles.welcomeDescription}>
              Watch our latest progress videos to see how DENSE is evolving and
              improving.
            </Text>
          </View>

          {/* Video 3-17 (Before) */}
          <View style={styles.videoSection}>
            <TouchableOpacity
              style={styles.videoContainer}
              onPress={() => openVideo("3-17")}
              activeOpacity={1}
            >
              {image1Loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
              <Image
                style={styles.videoThumbnail}
                source={require("@/assets/images/before-dense.jpeg")}
                resizeMode={ResizeMode.COVER}
                onLoad={handleImage1Load}
                onError={handleImage1Error}
              />
              {!image1Loading && (
                <View style={styles.videoPlayOverlay}>
                  <Icon name="play-circle" size={40} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Arrow Down Icon */}
          <View style={styles.arrowContainer}>
            <Icon name="arrow-down" size={60} color={colors.primary} />
          </View>

          {/* Video 3-16 (After) */}
          <View style={styles.videoSection}>
            <TouchableOpacity
              style={styles.videoContainer}
              onPress={() => openVideo("3-16")}
              activeOpacity={1}
            >
              {image2Loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading thumbnail...</Text>
                </View>
              )}
              <Image
                style={styles.videoThumbnail}
                source={require("@/assets/images/after-dense.jpeg")}
                resizeMode={ResizeMode.COVER}
                onLoad={handleImage2Load}
                onError={handleImage2Error}
              />
              {!image2Loading && (
                <View style={styles.videoPlayOverlay}>
                  <Icon name="play-circle" size={40} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Video Modal */}
      <HomepageVideoModal
        visible={showVideoModal}
        onClose={closeVideoModal}
        videoSource={getVideoSource()}
      />
    </LinearGradient>
  );
}
