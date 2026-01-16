import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const usePhotoEffectsLogic = () => {
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
      // Content generation logic
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

  return {
    downloadingPreset1,
    downloadingPreset2,
    handleGoBack,
    handleDownloadPreset
  };
};