import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function PhotoEffectsScreen() {
  const router = useRouter();
  const [downloadingPreset1, setDownloadingPreset1] = useState(false);
  const [downloadingPreset2, setDownloadingPreset2] = useState(false);

  const handleGoBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleDownloadPreset = async (presetNumber: 1 | 2) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const setDownloading = presetNumber === 1 ? setDownloadingPreset1 : setDownloadingPreset2;
    const fileName = `strong-lean-preset-${presetNumber}.pdf`;
    const presetName = presetNumber === 1 ? 'Strong & Defined' : 'Lean & Muscular';

    setDownloading(true);

    try {
      // For now, we'll create a simple PDF-like text file as a placeholder
      // In the future, this will download actual PDF files from your server/assets
      const pdfContent = `DENSE Photo Effects Preset ${presetNumber}
      
${presetName}

This preset enhances your physique photos to make you look stronger and leaner.

CAMERA SETTINGS:
• Brightness: +15
• Contrast: +25
• Highlights: -20
• Shadows: +30
• Clarity: +40
• Vibrance: +10

LIGHTING TIPS:
• Use natural light or ring light
• 45-degree angle lighting
• Avoid harsh overhead lights
• Golden hour (sunset/sunrise) works best

POSE RECOMMENDATIONS:
• Flex target muscles slightly
• Good posture - shoulders back
• Slight lean forward
• Engage core muscles

EDITING SETTINGS:
• Saturation: +15
• Warmth: +5
• Sharpness: +20
• Noise Reduction: +10

© DENSE Fitness App - Photo Enhancement Preset ${presetNumber}
`;

      // Create temporary file
      const fileUri = ((FileSystem as any).documentDirectory || '') + fileName;
      await (FileSystem as any).writeAsStringAsync(fileUri, pdfContent);

      // Share/download the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Download ${presetName} Preset`,
        });
      } else {
        Alert.alert(
          'Download Complete',
          `${presetName} preset has been saved to your device.`
        );
      }
    } catch (error) {
      Alert.alert(
        'Download Failed',
        'Unable to download the preset. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloading(false);
    }
  };

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
            <Text style={styles.descriptionTitle}>Photo Enhancement Presets</Text>
          </View>
          <Text style={styles.descriptionText}>
            Professional photo editing presets designed to make you look stronger and leaner in your progress photos. 
            Each preset includes camera settings, lighting tips, and editing parameters.
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
              Enhanced contrast and clarity for muscle definition. Perfect for showing off your gains and strength.
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
          <View style={[styles.presetIcon, { backgroundColor: colors.secondary }]}>
            <MaterialIcon name="photo-filter" size={28} color={colors.black} />
          </View>
          <View style={styles.presetContent}>
            <Text style={styles.presetTitle}>Lean & Muscular</Text>
            <Text style={styles.presetDescription}>
              Optimized for showing lean muscle mass and definition. Ideal for cut/shredding phases.
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
              <Text style={styles.tipText}>Take photos in natural light when possible</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>Use consistent lighting for progress comparisons</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>Apply presets before posting to social media</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={16} color={colors.success} />
              <Text style={styles.tipText}>Works best with iPhone Camera and VSCO apps</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  descriptionCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  descriptionTitle: {
    ...typography.h3,
    color: colors.white,
    marginLeft: 12,
  },
  descriptionText: {
    ...typography.body,
    color: colors.lighterGray,
    lineHeight: 22,
  },
  presetCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  presetContent: {
    flex: 1,
  },
  presetTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 6,
  },
  presetDescription: {
    ...typography.bodySmall,
    color: colors.lighterGray,
    marginBottom: 12,
    lineHeight: 18,
  },
  presetFeatures: {
    flexDirection: 'row',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 11,
  },
  downloadButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  tipsTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    ...typography.body,
    color: colors.lighterGray,
    flex: 1,
  },
});
