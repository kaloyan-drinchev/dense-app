import React from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Feather as Icon,
  MaterialIcons as MaterialIcon,
} from "@expo/vector-icons";
import { colors } from "@/constants/colors";

import { styles } from "./styles";
import { usePhotoEffectsLogic } from "./logic";

export default function PhotoEffectsScreen() {
  const {
    downloadingPreset1,
    downloadingPreset2,
    handleGoBack,
    handleDownloadPreset,
  } = usePhotoEffectsLogic();

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={1}
        >
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Photo Effects</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <View style={styles.descriptionCard}>
          <View style={styles.descriptionHeader}>
            <Icon name="camera" size={24} color={colors.primary} />
            <Text style={styles.descriptionTitle}>
              Photo Enhancement Presets
            </Text>
          </View>
          <Text style={styles.descriptionText}>
            Professional photo editing presets designed to make you look
            stronger and leaner in your progress photos. Each preset includes
            camera settings, lighting tips, and editing parameters.
          </Text>
        </View>

        {/* Preset 1 */}
        <TouchableOpacity
          style={styles.presetCard}
          onPress={() => handleDownloadPreset(1)}
          disabled={downloadingPreset1}
          activeOpacity={1}
        >
          <View style={styles.presetIcon}>
            <MaterialIcon name="photo-filter" size={28} color={colors.black} />
          </View>
          <View style={styles.presetContent}>
            <Text style={styles.presetTitle}>Strong & Defined</Text>
            <Text style={styles.presetDescription}>
              Enhanced contrast and clarity for muscle definition. Perfect for
              showing off your gains and strength.
            </Text>
            <View style={styles.presetFeatures}>
              <View style={styles.featureItem}>
                <Icon name="zap" size={12} color={colors.primary} />
                <Text style={styles.featureText}>Muscle Enhancement</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="sun" size={12} color={colors.primary} />
                <Text style={styles.featureText}>Perfect Lighting</Text>
              </View>
            </View>
          </View>
          <View style={styles.downloadButton}>
            {downloadingPreset1 ? (
              <Icon name="download-cloud" size={20} color={colors.lightGray} />
            ) : (
              <Icon name="download" size={20} color={colors.primary} />
            )}
          </View>
        </TouchableOpacity>

        {/* Preset 2 */}
        <TouchableOpacity
          style={styles.presetCard}
          onPress={() => handleDownloadPreset(2)}
          disabled={downloadingPreset2}
          activeOpacity={1}
        >
          <View
            style={[styles.presetIcon, { backgroundColor: colors.secondary }]}
          >
            <MaterialIcon name="photo-filter" size={28} color={colors.black} />
          </View>
          <View style={styles.presetContent}>
            <Text style={styles.presetTitle}>Lean & Muscular</Text>
            <Text style={styles.presetDescription}>
              Optimized for showing lean muscle mass and definition. Ideal for
              cut/shredding phases.
            </Text>
            <View style={styles.presetFeatures}>
              <View style={styles.featureItem}>
                <Icon name="target" size={12} color={colors.secondary} />
                <Text style={styles.featureText}>Cut Definition</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="eye" size={12} color={colors.secondary} />
                <Text style={styles.featureText}>Lean Focus</Text>
              </View>
            </View>
          </View>
          <View style={styles.downloadButton}>
            {downloadingPreset2 ? (
              <Icon name="download-cloud" size={20} color={colors.lightGray} />
            ) : (
              <Icon name="download" size={20} color={colors.secondary} />
            )}
          </View>
        </TouchableOpacity>

        {/* Usage Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Quick Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Take photos in natural light when possible
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Use consistent lighting for progress comparisons
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Apply presets before posting to social media
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>
                Works best with iPhone Camera and VSCO apps
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
